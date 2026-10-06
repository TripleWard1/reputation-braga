import { t } from '@/app/lib/i18n';

// Abre a "janela" onde os PDF são montados.
// No browser: janela nova, como sempre. Na app instalada (modo standalone, ex.: ecrã principal do telemóvel),
// uma janela nova não tem forma de voltar atrás; por isso o documento abre DENTRO da app, numa camada
// com "Voltar" e "Guardar como PDF". Devolve uma janela onde se escreve o documento (como window.open).
export function abrirJanelaDocumento(largura: number, altura: number): Window | null {
  if (typeof window === 'undefined') return null;
  const nav = navigator as Navigator & { standalone?: boolean };
  const instalada = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || nav.standalone === true;
  if (!instalada) return window.open('', '_blank', `width=${largura},height=${altura}`);

  const fundo = document.createElement('div');
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.style.cssText = 'position:fixed;inset:0;z-index:5000;display:flex;flex-direction:column;background:#15171B;';
  const barra = document.createElement('div');
  barra.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top, 0px)) 14px 10px;background:#1C1F24;border-bottom:1px solid #2D3139;';
  const botao = (texto: string, principal: boolean) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = texto;
    b.style.cssText = `height:42px;padding:0 18px;border-radius:999px;font:700 14px 'Public Sans',system-ui,sans-serif;cursor:pointer;${principal ? 'border:0;background:#8AB0E6;color:#0F1216;' : 'border:1px solid #3A404B;background:transparent;color:#ECEDEF;'}`;
    return b;
  };
  const voltar = botao(t('← Voltar', '← Back'), false);
  const guardar = botao(t('Guardar como PDF', 'Save as PDF'), true);
  const quadro = document.createElement('iframe');
  quadro.title = t('Documento', 'Document');
  quadro.style.cssText = 'flex:1;width:100%;border:0;background:#fff;';
  voltar.onclick = () => { fundo.remove(); };
  guardar.onclick = () => { try { quadro.contentWindow?.focus(); quadro.contentWindow?.print(); } catch { /* sem impressão disponível */ } };
  barra.appendChild(voltar);
  barra.appendChild(guardar);
  fundo.appendChild(barra);
  fundo.appendChild(quadro);
  document.body.appendChild(fundo);
  voltar.focus();
  return quadro.contentWindow;
}
