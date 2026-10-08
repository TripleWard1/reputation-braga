import { t } from '@/app/lib/i18n';
import { carregar, aviso } from '@/app/lib/abrir-documento';

// Exportação COMPLETA de um separador do Observatório para PDF A4, com o aspeto da plataforma em versão clara.
// 1) Mostra todos os cartões (mesmo os que ainda não apareceram ao descer) e espera que os gráficos e números acabem.
// 2) Fixa a largura do conteúdo para a de uma folha (para os gráficos se desenharem à medida).
// 3) Fotografa o conteúdo uma vez (html2canvas) e, na cópia, converte as cores escuras em claras (fundo branco, texto escuro).
// 4) Corta em páginas sem partir cartões nem títulos, com cabeçalho (logótipo, título) e rodapé numerado.
// Funções de topo, só com ciclos (o compressor do Next.js parte funções aninhadas que usam parâmetros de fora).

const H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const LARGURA = 1040; // px do conteúdo durante a exportação
const MARGEM = 10; // mm
const CAB_MM = 30; // altura do cabeçalho da 1.ª página
const ATRIB = 'data-exportar-pdf';

interface Cor { r: number; g: number; b: number; a: number }
function corDe(s: string | null): Cor | null {
  if (!s) return null;
  const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/);
  if (!m) return null;
  let a = 1;
  if (m[4] != null) a = m[4].indexOf('%') >= 0 ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
}
function lum(c: Cor): number { return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255; }
function sat(c: Cor): number { const mx = Math.max(c.r, c.g, c.b); const mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; }
function escurecer(c: Cor, alvo: number): string {
  const l = lum(c) || 1; const f = Math.min(1, alvo / l);
  return `rgb(${Math.round(c.r * f)},${Math.round(c.g * f)},${Math.round(c.b * f)})`;
}
// Texto claro → escuro (cores com tom ficam com o mesmo tom, mais escuro)
function textoClaro(c: Cor): string | null {
  if (c.a < 0.05 || lum(c) < 0.5) return null;
  if (sat(c) > 0.22) return escurecer(c, 0.32);
  return lum(c) > 0.78 ? '#15171B' : '#4A5060';
}
function temGradienteEscuro(s: string): boolean {
  const re = /rgba?\([^)]*\)/g; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) { const c = corDe(m[0]); if (c && c.a > 0.3 && lum(c) < 0.3) return true; }
  return false;
}

/** Converte, na cópia usada para o PDF, o tema escuro da plataforma num tema claro de impressão. */
export function clarearElemento(win: Window, raiz: HTMLElement): void {
  const todos: Element[] = [raiz];
  const lista = raiz.querySelectorAll('*');
  for (let i = 0; i < lista.length; i++) todos.push(lista[i]);
  // Ler primeiro todos os estilos e só depois escrever (evita recalcular a página a cada elemento)
  const estilos: CSSStyleDeclaration[] = [];
  const copias: { bg: string; bgi: string; cor: string; bt: string; br: string; bb: string; bl: string; fill: string; stroke: string; disp: string }[] = [];
  for (let i = 0; i < todos.length; i++) {
    const cs = win.getComputedStyle(todos[i]);
    estilos.push(cs);
    copias.push({ bg: cs.backgroundColor, bgi: cs.backgroundImage, cor: cs.color, bt: cs.borderTopColor, br: cs.borderRightColor, bb: cs.borderBottomColor, bl: cs.borderLeftColor, fill: cs.fill, stroke: cs.stroke, disp: cs.display });
  }
  for (let i = 0; i < todos.length; i++) {
    const el = todos[i] as HTMLElement | SVGElement;
    const s = copias[i];
    const st = (el as HTMLElement).style;
    if (!st) continue;
    const tag = el.tagName.toLowerCase();
    // Fora do PDF: tabelas só para leitores de ecrã (o html2canvas não as esconde e escrevia-as por cima dos gráficos),
    // botões de descarregar e campos de formulário. Os restantes botões ficam, porque muitas vezes têm conteúdo (nomes, linhas).
    const cl = (el as Element).getAttribute('class') || '';
    if (/(^|\s)(obs-sr|rb-sr|obs-dl|rb-dados|sim-exp|cal-exp|obs-leit-setas)(\s|$)/.test(cl) || tag === 'input' || tag === 'select' || tag === 'textarea' || (el as Element).getAttribute('data-sem-pdf') !== null) { st.setProperty('display', 'none', 'important'); continue; }
    st.setProperty('box-shadow', 'none', 'important');
    st.setProperty('text-shadow', 'none', 'important');
    st.setProperty('animation', 'none', 'important');
    st.setProperty('transition', 'none', 'important');
    const bg = corDe(s.bg);
    if (bg && bg.a > 0.02 && lum(bg) < 0.35) {
      if (bg.a < 0.5) st.setProperty('background-color', 'transparent', 'important');
      else st.setProperty('background-color', lum(bg) < 0.115 ? '#FFFFFF' : '#F4F6F9', 'important');
    }
    if (s.bgi && s.bgi !== 'none' && s.bgi.indexOf('gradient') >= 0 && temGradienteEscuro(s.bgi)) st.setProperty('background-image', 'none', 'important');
    const c = corDe(s.cor);
    if (c) { const n = textoClaro(c); if (n) st.setProperty('color', n, 'important'); }
    const lados: [string, string][] = [['border-top-color', s.bt], ['border-right-color', s.br], ['border-bottom-color', s.bb], ['border-left-color', s.bl]];
    for (let k = 0; k < 4; k++) { const b = corDe(lados[k][1]); if (b && b.a > 0.05 && lum(b) < 0.4) st.setProperty(lados[k][0], '#E1E6EE', 'important'); }
    // Gráficos (SVG): texto claro → escuro; linhas de grelha escuras → cinzento claro
    if (el instanceof (win as any).SVGElement) {
      // Barras com degradê definido noutro gráfico: o html2canvas desenha cada gráfico à parte e perdia a cor
      if (s.fill && s.fill.indexOf('url(') === 0) {
        const m = s.fill.match(/#([^"')\s]+)/);
        const g = m ? win.document.getElementById(m[1]) : null;
        const svgProprio = (el as Element).closest('svg');
        if (g && (!svgProprio || !svgProprio.contains(g))) {
          const stop = g.querySelector('stop');
          const cor = stop ? (stop.getAttribute('stop-color') || win.getComputedStyle(stop).stopColor) : null;
          if (cor) st.setProperty('fill', cor, 'important');
        }
      }
      const f = corDe(s.fill);
      if (f && (tag === 'text' || tag === 'tspan')) { const n = textoClaro(f); if (n) st.setProperty('fill', n, 'important'); }
      else if (f && f.a > 0.05 && lum(f) < 0.25 && tag !== 'svg') st.setProperty('fill', '#EEF1F5', 'important');
      const k = corDe(s.stroke);
      if (k && k.a > 0.05) {
        if (lum(k) < 0.35) st.setProperty('stroke', '#D5DAE1', 'important');
        else if (lum(k) > 0.85 && sat(k) < 0.2) st.setProperty('stroke', '#9AA1AC', 'important');
      }
    }
  }
  // Os cartões aparecem com animação: no PDF ficam logo visíveis
  const cartoes = raiz.querySelectorAll('.obs-card');
  for (let i = 0; i < cartoes.length; i++) { const e = cartoes[i] as HTMLElement; e.style.setProperty('opacity', '1', 'important'); e.style.setProperty('transform', 'none', 'important'); }
  raiz.style.setProperty('background', '#FFFFFF', 'important');
}

// Faixas com deslocamento lateral (ex.: «Leituras do momento») passam a várias linhas, para nada ficar escondido.
// Feito no conteúdo real (e desfeito no fim), para as medidas das páginas baterem certo com a fotografia.
export function abrirFaixas(raiz: HTMLElement): { el: HTMLElement; estilo: string | null }[] {
  const mexidos: { el: HTMLElement; estilo: string | null }[] = [];
  const lista = raiz.querySelectorAll('*');
  for (let i = 0; i < lista.length; i++) {
    const e = lista[i] as HTMLElement;
    if (!e.style) continue;
    const cs = window.getComputedStyle(e);
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 4) {
      mexidos.push({ el: e, estilo: e.getAttribute('style') });
      e.style.overflow = 'visible';
      if (cs.display.indexOf('flex') >= 0) e.style.flexWrap = 'wrap';
      if (cs.display.indexOf('grid') >= 0) { e.style.gridAutoFlow = 'row'; e.style.gridTemplateColumns = 'repeat(auto-fill, minmax(230px, 1fr))'; }
    }
  }
  return mexidos;
}
function repor(mexidos: { el: HTMLElement; estilo: string | null }[]): void {
  for (let i = 0; i < mexidos.length; i++) { const m = mexidos[i]; if (m.estilo == null) m.el.removeAttribute('style'); else m.el.setAttribute('style', m.estilo); }
}

// Zonas onde NÃO se pode cortar: o espaço ocupado por cada bloco pequeno (texto, linha de tabela, gráfico, cartão).
// Um corte só pode cair num intervalo vazio entre blocos; depois de um título fica reservado espaço para o conteúdo.
export function zonasOcupadas(raiz: HTMLElement, altPagina: number): [number, number][] {
  const topo = raiz.getBoundingClientRect().top;
  const iv: [number, number][] = [];
  const lista = raiz.querySelectorAll('*');
  for (let i = 0; i < lista.length; i++) {
    const e = lista[i] as HTMLElement;
    if (e.closest && e.closest('.obs-sr, .rb-sr')) continue;
    const b = e.getBoundingClientRect();
    if (b.height <= 1 || b.width <= 1 || b.height > altPagina * 0.6) continue;
    let fim = b.bottom - topo;
    if (/^H[1-6]$/.test(e.tagName) || (e.style && parseFloat(e.style.fontSize || '0') >= 18)) fim += 60;
    iv.push([b.top - topo + 0.5, fim - 0.5]);
  }
  iv.sort(porInicio);
  const unidas: [number, number][] = [];
  for (let i = 0; i < iv.length; i++) {
    const u = unidas.length ? unidas[unidas.length - 1] : null;
    if (u && iv[i][0] <= u[1]) { if (iv[i][1] > u[1]) u[1] = iv[i][1]; } else unidas.push([iv[i][0], iv[i][1]]);
  }
  return unidas;
}
function porInicio(a: [number, number], b: [number, number]) { return a[0] - b[0]; }
export function fatias(total: number, primeira: number, outras: number, zonas: [number, number][]): [number, number][] {
  const r: [number, number][] = [];
  let ini = 0;
  while (ini < total - 4) {
    const alt = r.length === 0 ? primeira : outras;
    const lim = ini + alt;
    let fim = -1;
    if (lim >= total) fim = total;
    else {
      // o último espaço livre antes do limite da página
      for (let i = zonas.length - 1; i >= 0; i--) {
        const livreIni = zonas[i][1];
        const livreFim = i + 1 < zonas.length ? zonas[i + 1][0] : total;
        if (livreIni > lim) continue;
        const corte = Math.min(lim, livreIni + Math.min(10, (livreFim - livreIni) / 2));
        if (corte > ini + alt * 0.3) { fim = Math.round(corte); break; }
        break;
      }
    }
    if (fim < 0) fim = Math.min(total, lim);
    r.push([ini, fim]); ini = fim;
  }
  return r;
}
// Números grandes cabem no cartão, sem espaçamento entre letras (o html2canvas desenha-o letra a letra e desalinhava)
export const CSS_EXPORTAR = `
.obs-exportando .obs-kpi-v { font-size: 27px !important; white-space: nowrap !important; }
.obs-exportando * { letter-spacing: normal !important; font-variant-numeric: normal !important; font-feature-settings: normal !important; }
.obs-exportando .obs-dl, .obs-exportando .rb-dados, .obs-exportando .sim-exp, .obs-exportando .cal-exp, .obs-exportando .obs-leit-setas { display: none !important; }
.obs-exportando .obs-card { opacity: 1 !important; transform: none !important; transition: none !important; }
`;
function esperarImagens(raiz: HTMLElement): Promise<void> {
  const imgs = raiz.querySelectorAll('img');
  const ps: Promise<void>[] = [];
  for (let i = 0; i < imgs.length; i++) ps.push(esperarUma(imgs[i] as HTMLImageElement));
  return Promise.all(ps).then(nada);
}
function nada() { /* fim */ }
function esperarUma(im: HTMLImageElement): Promise<void> {
  if (im.complete) return Promise.resolve();
  return new Promise<void>((ok) => { im.addEventListener('load', () => ok()); im.addEventListener('error', () => ok()); setTimeout(ok, 6000); });
}
function esperar(ms: number): Promise<void> { return new Promise((ok) => setTimeout(ok, ms)); }
function nomeFicheiro(x: string): string {
  return `${x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70) || 'documento'}.pdf`;
}
function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
}
function prepararClone(doc: Document): void {
  const fora = doc.querySelectorAll('.obs-tabs, .obs-hero, .obs-toast');
  for (let i = 0; i < fora.length; i++) (fora[i] as HTMLElement).style.setProperty('display', 'none', 'important');
  const el = doc.querySelector(`[${ATRIB}]`) as HTMLElement | null;
  if (el && doc.defaultView) clarearElemento(doc.defaultView, el);
}

export interface OpcoesSeparador { titulo: string; eyebrow: string; subtitulo?: string; rodape?: string }

export async function exportarSeparador(el: HTMLElement, o: OpcoesSeparador): Promise<void> {
  const av = aviso(t('A preparar o PDF…', 'Preparing the PDF…'));
  const antes = { width: el.style.width, maxWidth: el.style.maxWidth, minWidth: el.style.minWidth };
  let mexidos: { el: HTMLElement; estilo: string | null }[] = [];
  let estilo: HTMLStyleElement | null = null;
  try {
    // 1) Todos os cartões visíveis (os que ainda não tinham aparecido ao descer)
    window.dispatchEvent(new Event('beforeprint'));
    // 2) Largura de folha, para os gráficos se redesenharem à medida
    el.style.width = `${LARGURA}px`; el.style.maxWidth = `${LARGURA}px`; el.style.minWidth = `${LARGURA}px`;
    // Ajustes de impressão (aplicados também ao conteúdo real, para as medidas das páginas baterem certo)
    estilo = document.createElement('style');
    estilo.textContent = CSS_EXPORTAR;
    document.head.appendChild(estilo);
    el.classList.add('obs-exportando');
    window.dispatchEvent(new Event('resize'));
    // Imagens que só carregavam ao descer passam a carregar já
    const imgs = el.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) { const im = imgs[i] as HTMLImageElement; if (im.loading === 'lazy') im.loading = 'eager'; }
    await Promise.all([carregar(H2C), carregar(JSPDF), esperar(2200)]);
    mexidos = abrirFaixas(el);
    await Promise.all([esperarImagens(el), esperar(400)]);
    const w = window as any;
    const html2canvas = w.html2canvas; const JsPDF = w.jspdf && w.jspdf.jsPDF;
    if (!html2canvas || !JsPDF) throw new Error('bibliotecas');
    try { if ((document as any).fonts && (document as any).fonts.ready) await (document as any).fonts.ready; } catch { /* segue */ }

    const total = Math.ceil(el.scrollHeight);
    const largMm = 210 - MARGEM * 2;
    const pxMm = LARGURA / largMm;
    const primeira = Math.floor((297 - MARGEM * 2 - CAB_MM) * pxMm);
    const outras = Math.floor((297 - MARGEM * 2) * pxMm);
    const partes = fatias(total, primeira, outras, zonasOcupadas(el, outras));

    av.mudar(t('A gerar o PDF…', 'Generating the PDF…'));
    let escala = 2;
    if (total * escala > 30000) escala = Math.max(1, 30000 / total);
    el.setAttribute(ATRIB, '1');
    const tela: HTMLCanvasElement = await html2canvas(el, { scale: escala, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: Math.max(document.documentElement.clientWidth, LARGURA + 80), onclone: prepararClone });
    el.removeAttribute(ATRIB);

    const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const logo = await carregarImagem(`${window.location.origin}/visit-braga-logo-negativo.png`);
    const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' });
    const rodape = o.rodape || t('Município de Braga · Divisão de Atividades Económicas e Turismo · Observatório de Turismo de Braga', 'Braga City Council · Economic Activities and Tourism Division · Braga Tourism Observatory');
    for (let i = 0; i < partes.length; i++) {
      av.mudar(t(`A gerar o PDF… página ${i + 1} de ${partes.length}`, `Generating the PDF… page ${i + 1} of ${partes.length}`));
      if (i > 0) pdf.addPage();
      let y0 = MARGEM;
      if (i === 0) {
        // Cabeçalho: faixa escura com logótipo, contexto, título e data
        pdf.setFillColor(21, 23, 27); pdf.roundedRect(MARGEM, MARGEM, largMm, CAB_MM - 4, 2.5, 2.5, 'F');
        if (logo) { const h = 5; pdf.addImage(logo, 'PNG', MARGEM + 6, MARGEM + 5, h * (logo.width / logo.height), h); }
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(163, 168, 177);
        pdf.text(`${t('Gerado a', 'Generated on')} ${hoje}`, MARGEM + largMm - 6, MARGEM + 8.6, { align: 'right' });
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(138, 176, 230);
        pdf.text(o.eyebrow.toUpperCase(), MARGEM + 6, MARGEM + 15);
        pdf.setFontSize(15); pdf.setTextColor(255, 255, 255);
        pdf.text(o.titulo, MARGEM + 6, MARGEM + 21.5, { maxWidth: largMm - 12 });
        // Faixa de cores da identidade
        const cores: [number, number, number, number][] = [[226, 35, 26, 0.22], [138, 176, 230, 0.38], [233, 196, 106, 0.18], [124, 199, 154, 0.22]];
        let x = MARGEM;
        for (let k = 0; k < cores.length; k++) { const wk = largMm * cores[k][3]; pdf.setFillColor(cores[k][0], cores[k][1], cores[k][2]); pdf.rect(x, MARGEM + CAB_MM - 5.2, wk, 1.2, 'F'); x += wk; }
        if (o.subtitulo) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(90, 98, 112); pdf.text(o.subtitulo, MARGEM, MARGEM + CAB_MM + 0.5, { maxWidth: largMm }); }
        y0 = MARGEM + CAB_MM + (o.subtitulo ? 3 : 0);
      }
      const [a, b] = partes[i];
      const pag = document.createElement('canvas');
      pag.width = tela.width; pag.height = Math.max(1, Math.round((b - a) * escala));
      const cx = pag.getContext('2d');
      if (cx) { cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, pag.width, pag.height); cx.drawImage(tela, 0, Math.round(a * escala), tela.width, pag.height, 0, 0, pag.width, pag.height); }
      pdf.addImage(pag.toDataURL('image/jpeg', 0.9), 'JPEG', MARGEM, y0, largMm, (b - a) / pxMm, undefined, 'FAST');
      // Rodapé
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(111, 116, 125);
      pdf.setDrawColor(225, 230, 238); pdf.setLineWidth(0.2); pdf.line(MARGEM, 297 - MARGEM + 3, 210 - MARGEM, 297 - MARGEM + 3);
      pdf.text(rodape, MARGEM, 297 - MARGEM + 6.5, { maxWidth: 150 });
      pdf.text(t(`Página ${i + 1} de ${partes.length}`, `Page ${i + 1} of ${partes.length}`), 210 - MARGEM, 297 - MARGEM + 6.5, { align: 'right' });
    }
    pdf.save(nomeFicheiro(`${o.eyebrow} ${o.titulo}`));
  } catch {
    alert(t('Não foi possível gerar o PDF. Verifique a ligação à internet e tente de novo.', 'Could not generate the PDF. Check your internet connection and try again.'));
  } finally {
    el.removeAttribute(ATRIB);
    repor(mexidos);
    el.classList.remove('obs-exportando');
    if (estilo) estilo.remove();
    el.style.width = antes.width; el.style.maxWidth = antes.maxWidth; el.style.minWidth = antes.minWidth;
    window.dispatchEvent(new Event('resize'));
    av.fechar();
  }
}
