import { t } from '@/app/lib/i18n';

// Exportação para PDF que funciona em todo o lado (computador, telemóvel e app instalada).
// Os três sítios que exportam continuam a "escrever" o documento como numa janela (document.open/write/close);
// aqui, em vez de abrir uma janela e pedir para imprimir, o documento é montado numa moldura invisível
// e convertido num ficheiro PDF que é descarregado diretamente (html2pdf.js, carregado só quando é preciso).

const BIBLIOTECA = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
let promessa: Promise<any> | null = null;
function carregarBiblioteca(): Promise<any> {
  const w = window as any;
  if (w.html2pdf) return Promise.resolve(w.html2pdf);
  if (!promessa) {
    promessa = new Promise((ok, falha) => {
      const sc = document.createElement('script');
      sc.src = BIBLIOTECA; sc.async = true;
      sc.onload = () => (w.html2pdf ? ok(w.html2pdf) : falha(new Error('html2pdf')));
      sc.onerror = () => { promessa = null; falha(new Error('html2pdf')); };
      document.head.appendChild(sc);
    });
  }
  return promessa;
}

function aviso(texto: string): () => void {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = texto;
  el.style.cssText = "position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom, 0px));transform:translateX(-50%);z-index:6000;padding:12px 20px;border-radius:999px;background:#1C1F24;border:1px solid rgba(138,176,230,.5);color:#ECEDEF;font:600 14px 'Public Sans',system-ui,sans-serif;box-shadow:0 14px 34px -12px rgba(0,0,0,.75);";
  document.body.appendChild(el);
  return () => el.remove();
}

function nomeFicheiro(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  const base = (m ? m[1] : 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70);
  return `${base || 'documento'}.pdf`;
}

async function gerarPdf(html: string, largura: number) {
  const fechar = aviso(t('A gerar o PDF…', 'Generating the PDF…'));
  const moldura = document.createElement('iframe');
  moldura.setAttribute('aria-hidden', 'true');
  moldura.style.cssText = `position:fixed;left:-10000px;top:0;width:${Math.min(largura, 1100)}px;height:1400px;border:0;visibility:hidden;`;
  document.body.appendChild(moldura);
  try {
    // Sem os pedidos automáticos de impressão que vinham no documento
    const limpo = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const doc = moldura.contentDocument as Document;
    doc.open(); doc.write(limpo); doc.close();
    await new Promise((r) => setTimeout(r, 300));
    const fontes = (doc as any).fonts;
    if (fontes && fontes.ready) { try { await fontes.ready; } catch { /* segue */ } }
    const imagens = Array.from(doc.images);
    await Promise.all(imagens.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = r; im.onerror = r; setTimeout(r, 4000); }))));
    const html2pdf = await carregarBiblioteca();
    await html2pdf().set({
      margin: [10, 10, 12, 10],
      filename: nomeFicheiro(html),
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: Math.min(largura, 1100) },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    }).from(doc.body).save();
  } catch {
    alert(t('Não foi possível gerar o PDF. Verifique a ligação à internet e tente de novo.', 'Could not generate the PDF. Check your internet connection and try again.'));
  } finally {
    fechar();
    moldura.remove();
  }
}

// Devolve um objeto com a mesma forma de uma janela (document.open/write/close, focus, print),
// para os sítios que exportam não precisarem de mudar. Ao fechar o documento, gera o PDF.
export function abrirJanelaDocumento(largura: number, _altura: number): Window | null {
  if (typeof window === 'undefined') return null;
  let html = '';
  const falsa = {
    document: {
      open: () => { html = ''; },
      write: (x: string) => { html += x; },
      close: () => { void gerarPdf(html, largura); },
    },
    focus: () => {},
    print: () => {},
    close: () => {},
  };
  return falsa as unknown as Window;
}
