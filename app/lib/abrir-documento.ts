import { t } from '@/app/lib/i18n';

// Exportação para PDF que funciona em todo o lado (computador, telemóvel e app instalada).
// O documento é montado numa moldura própria com a largura de uma folha A4 e os seus próprios estilos;
// cada página é fotografada diretamente nessa moldura (html2canvas) e o PDF é montado com jsPDF.
// As quebras de página são calculadas para não cortar linhas de tabela, parágrafos ou títulos,
// e respeitam as quebras forçadas (page-break-before / break-before / classe "quebra").
// Margem: 10 mm por omissão; um documento com <meta name="pdf-margem" content="0"> controla as suas margens.

const LARGURA_PX = 794; // A4 a 96 ppp
const H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const cache: Record<string, Promise<void>> = {};
function carregar(src: string): Promise<void> {
  if (!cache[src]) {
    cache[src] = new Promise((ok, falha) => {
      const sc = document.createElement('script');
      sc.src = src; sc.async = true;
      sc.onload = () => ok();
      sc.onerror = () => { delete cache[src]; falha(new Error(src)); };
      document.head.appendChild(sc);
    });
  }
  return cache[src];
}

function aviso(texto: string): { mudar: (x: string) => void; fechar: () => void } {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = texto;
  el.style.cssText = "position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom, 0px));transform:translateX(-50%);z-index:6000;padding:12px 20px;border-radius:999px;background:#1C1F24;border:1px solid rgba(138,176,230,.5);color:#ECEDEF;font:600 14px 'Public Sans',system-ui,sans-serif;box-shadow:0 14px 34px -12px rgba(0,0,0,.75);";
  document.body.appendChild(el);
  return { mudar: (x: string) => { el.textContent = x; }, fechar: () => el.remove() };
}

function nomeFicheiro(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  const base = (m ? m[1] : 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70);
  return `${base || 'documento'}.pdf`;
}

// Pontos de corte: fundos de blocos que não devem ser partidos; quebras forçadas: topos de elementos marcados
function pontosDeCorte(doc: Document): { cortes: number[]; forcadas: number[] } {
  const win = doc.defaultView as Window;
  const topo = doc.body.getBoundingClientRect().top;
  const cortes: number[] = []; const forcadas: number[] = [];
  const blocos = doc.body.querySelectorAll('p, li, tr, h1, h2, h3, h4, h5, table, section, article, figure, img, ul, ol, blockquote, pre, hr, .bloco, .area, div');
  for (let i = 0; i < blocos.length; i++) {
    const el = blocos[i] as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.height <= 0) continue;
    cortes.push(Math.round(r.bottom - topo));
    const cs = win.getComputedStyle(el) as CSSStyleDeclaration & { breakBefore?: string };
    if (el.classList.contains('quebra') || cs.pageBreakBefore === 'always' || cs.breakBefore === 'page') forcadas.push(Math.round(r.top - topo));
  }
  cortes.sort((a, b) => a - b); forcadas.sort((a, b) => a - b);
  return { cortes, forcadas };
}
function fatias(total: number, altPagina: number, cortes: number[], forcadas: number[]): [number, number][] {
  const r: [number, number][] = [];
  let ini = 0;
  while (ini < total - 2) {
    const lim = ini + altPagina;
    let fim = -1;
    for (let i = 0; i < forcadas.length; i++) if (forcadas[i] > ini + 4 && forcadas[i] <= lim) { fim = forcadas[i]; break; }
    if (fim < 0) {
      if (lim >= total) fim = total;
      else { for (let i = cortes.length - 1; i >= 0; i--) if (cortes[i] <= lim && cortes[i] > ini + altPagina * 0.45) { fim = cortes[i]; break; } }
      if (fim < 0) fim = Math.min(total, lim);
    }
    r.push([ini, fim]); ini = fim;
  }
  return r;
}

function esperarImagem(im: HTMLImageElement): Promise<void> {
  if (im.complete) return Promise.resolve();
  return new Promise<void>((ok) => { const fim = () => ok(); im.addEventListener('load', fim); im.addEventListener('error', fim); setTimeout(fim, 5000); });
}

async function gerarPdf(html: string) {
  const av = aviso(t('A gerar o PDF…', 'Generating the PDF…'));
  const moldura = document.createElement('iframe');
  moldura.setAttribute('aria-hidden', 'true');
  moldura.setAttribute('tabindex', '-1');
  moldura.style.cssText = `position:fixed;left:-12000px;top:0;width:${LARGURA_PX}px;height:1200px;border:0;opacity:0;pointer-events:none;`;
  document.body.appendChild(moldura);
  try {
    const margem = /<meta[^>]+name=["']pdf-margem["'][^>]+content=["']0["']/i.test(html) ? 0 : 10;
    const limpo = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const doc = moldura.contentDocument as Document;
    doc.open(); doc.write(limpo); doc.close();
    // fundo branco e largura fixa, independentemente do que o documento traga
    const base = doc.createElement('style');
    base.textContent = `html,body{background:#fff !important;margin:0}body{width:${LARGURA_PX - (margem ? 0 : 0)}px;-webkit-print-color-adjust:exact;print-color-adjust:exact}`;
    doc.head.appendChild(base);
    await new Promise((r) => setTimeout(r, 350));
    const fontes = (doc as any).fonts;
    if (fontes && fontes.ready) { try { await fontes.ready; } catch { /* segue */ } }
    const imagens = Array.from(doc.images);
    await Promise.all(imagens.map(esperarImagem));
    await Promise.all([carregar(H2C), carregar(JSPDF)]);
    const w = window as any;
    const html2canvas = w.html2canvas; const JsPDF = w.jspdf && w.jspdf.jsPDF;
    if (!html2canvas || !JsPDF) throw new Error('bibliotecas');
    const total = Math.ceil(Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight));
    moldura.style.height = `${total}px`;
    const larguraMm = 210 - margem * 2; const alturaMm = 297 - margem * 2;
    const pxPorMm = LARGURA_PX / larguraMm;
    const altPagina = Math.floor(alturaMm * pxPorMm);
    const { cortes, forcadas } = pontosDeCorte(doc);
    const partes = fatias(total, altPagina, cortes, forcadas);
    const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    for (let i = 0; i < partes.length; i++) {
      av.mudar(t(`A gerar o PDF… página ${i + 1} de ${partes.length}`, `Generating the PDF… page ${i + 1} of ${partes.length}`));
      const [a, b] = partes[i];
      const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff', x: 0, y: a, width: LARGURA_PX, height: b - a, windowWidth: LARGURA_PX, windowHeight: total, scrollX: 0, scrollY: 0, logging: false });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', margem, margem, larguraMm, (b - a) / pxPorMm, undefined, 'FAST');
    }
    pdf.save(nomeFicheiro(html));
  } catch {
    alert(t('Não foi possível gerar o PDF. Verifique a ligação à internet e tente de novo.', 'Could not generate the PDF. Check your internet connection and try again.'));
  } finally {
    av.fechar();
    moldura.remove();
  }
}

// Devolve um objeto com a mesma forma de uma janela (document.open/write/close, focus, print),
// para os sítios que exportam não precisarem de mudar. Ao fechar o documento, gera o PDF.
export function abrirJanelaDocumento(_largura: number, _altura: number): Window | null {
  if (typeof window === 'undefined') return null;
  let html = '';
  const falsa = {
    document: {
      open: () => { html = ''; },
      write: (x: string) => { html += x; },
      close: () => { void gerarPdf(html); },
    },
    focus: () => {},
    print: () => {},
    close: () => {},
  };
  return falsa as unknown as Window;
}
