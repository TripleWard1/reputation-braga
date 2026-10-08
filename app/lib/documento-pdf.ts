import { abrirJanelaDocumento } from '@/app/lib/abrir-documento';
import { t } from '@/app/lib/i18n';

// Documento institucional em A4 (tema claro) para exportar PDF a partir dos dados, e não de uma fotografia da página.
// Mesma identidade do Relatório Anual INSTO: cabeçalho escuro com o logótipo, faixa de cores, tabelas azuis.
// Funções de topo, só com ciclos (o compressor do Next.js parte funções aninhadas que usam parâmetros de fora).

export function esc(x: unknown): string {
  return String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// **negrito** → <b>
export function rico(x: string): string { return esc(x).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }

export function paragrafo(x: string): string { return x ? `<p>${rico(x)}</p>` : ''; }
export function seccao(titulo: string, cap?: string): string {
  return `<h2>${esc(titulo)}</h2>${cap ? `<p class="cap">${esc(cap)}</p>` : ''}`;
}
export function subtitulo(x: string): string { return `<h3>${esc(x)}</h3>`; }
export function aviso(rotulo: string, texto: string, tom?: 'alerta' | 'info'): string {
  return `<div class="aviso ${tom === 'info' ? 'info' : ''}"><b>${esc(rotulo)}</b> ${rico(texto)}</div>`;
}
export function etiqueta(x: string, cor: string, fundo: string): string {
  return `<span class="etq" style="color:${cor};background:${fundo}">${esc(x)}</span>`;
}

export interface Kpi { rotulo: string; valor: string; nota?: string; cor?: string }
export function kpis(itens: Kpi[]): string {
  let h = `<div class="kpis" style="grid-template-columns:repeat(${Math.min(4, Math.max(1, itens.length))},1fr)">`;
  for (let i = 0; i < itens.length; i++) {
    const k = itens[i];
    h += `<div class="kpi"${k.cor ? ` style="border-left-color:${k.cor}"` : ''}><span>${esc(k.rotulo)}</span><b${k.cor ? ` style="color:${k.cor}"` : ''}>${esc(k.valor)}</b>${k.nota ? `<em>${esc(k.nota)}</em>` : ''}</div>`;
  }
  return h + '</div>';
}

// Células: texto simples, ou { html } para conteúdo já formatado (etiquetas, negrito)
export type Celula = string | number | { html: string };
function celula(c: Celula): string {
  if (c && typeof c === 'object') return c.html;
  return esc(c);
}
export function tabela(cab: string[], linhas: Celula[][], opts?: { num?: number[]; larguras?: string[]; nota?: string; compacta?: boolean }): string {
  if (!linhas.length) return '';
  const num = (opts && opts.num) || [];
  let h = `<table${opts && opts.compacta ? ' class="compacta"' : ''}><thead><tr>`;
  for (let i = 0; i < cab.length; i++) {
    const w = opts && opts.larguras && opts.larguras[i] ? ` style="width:${opts.larguras[i]}"` : '';
    h += `<th${num.indexOf(i) >= 0 ? ' class="n"' : ''}${w}>${esc(cab[i])}</th>`;
  }
  h += '</tr></thead><tbody>';
  for (let r = 0; r < linhas.length; r++) {
    h += '<tr>';
    for (let i = 0; i < linhas[r].length; i++) h += `<td${num.indexOf(i) >= 0 ? ' class="n"' : ''}>${celula(linhas[r][i])}</td>`;
    h += '</tr>';
  }
  h += '</tbody></table>';
  if (opts && opts.nota) h += `<p class="fonte">${esc(opts.nota)}</p>`;
  return h;
}

export interface Barra { rotulo: string; valor: number; texto: string; cor?: string }
export function barras(itens: Barra[], max?: number): string {
  let m = max || 0;
  if (!m) for (let i = 0; i < itens.length; i++) if (itens[i].valor > m) m = itens[i].valor;
  if (!m) m = 1;
  let h = '<div class="barras">';
  for (let i = 0; i < itens.length; i++) {
    const b = itens[i];
    const w = Math.max(0, Math.min(100, (b.valor / m) * 100));
    h += `<div class="lb"><span>${esc(b.rotulo)}</span><div class="tr"><i style="width:${w.toFixed(1)}%;background:${b.cor || '#3B5B8C'}"></i></div><b>${esc(b.texto)}</b></div>`;
  }
  return h + '</div>';
}

// Gráfico de colunas simples (HTML puro, nítido no PDF)
export interface Coluna { rotulo: string; valor: number; texto: string; cor?: string }
export function colunas(itens: Coluna[], min?: number): string {
  if (!itens.length) return '';
  let mx = -Infinity; let mn = Infinity;
  for (let i = 0; i < itens.length; i++) { if (itens[i].valor > mx) mx = itens[i].valor; if (itens[i].valor < mn) mn = itens[i].valor; }
  const base = min == null ? 0 : min;
  const amp = mx - base || 1;
  let h = `<div class="colunas" style="grid-template-columns:repeat(${itens.length},minmax(0,1fr))">`;
  for (let i = 0; i < itens.length; i++) {
    const c = itens[i];
    const alt = Math.max(4, ((c.valor - base) / amp) * 110);
    h += `<div class="col"><small>${esc(c.texto)}</small><i style="height:${alt.toFixed(0)}px;background:${c.cor || '#3B5B8C'}"></i><span>${esc(c.rotulo)}</span></div>`;
  }
  return h + '</div>';
}

export function lista(itens: string[], marca?: string, cor?: string): string {
  if (!itens.length) return '';
  let h = '<ul class="lst">';
  for (let i = 0; i < itens.length; i++) h += `<li><i style="color:${cor || '#3B5B8C'}">${esc(marca || '•')}</i><span>${rico(itens[i])}</span></li>`;
  return h + '</ul>';
}
export function numerada(itens: { titulo: string; texto?: string }[]): string {
  let h = '<ol class="num">';
  for (let i = 0; i < itens.length; i++) h += `<li><i>${String(i + 1).padStart(2, '0')}</i><div><b>${esc(itens[i].titulo)}</b>${itens[i].texto ? `<span>${rico(itens[i].texto || '')}</span>` : ''}</div></li>`;
  return h + '</ol>';
}
export function citacao(texto: string, rodape: string, cor?: string): string {
  return `<blockquote style="border-left-color:${cor || '#3B5B8C'}">“${esc(texto)}”<small>${esc(rodape)}</small></blockquote>`;
}
export function duas(esq: string, dir: string): string { return `<div class="duas"><div>${esq}</div><div>${dir}</div></div>`; }
export function caixa(conteudo: string, titulo?: string, cor?: string): string {
  return `<div class="caixa"${cor ? ` style="border-top-color:${cor}"` : ''}>${titulo ? `<h4${cor ? ` style="color:${cor}"` : ''}>${esc(titulo)}</h4>` : ''}${conteudo}</div>`;
}
export function fontes(itens: { nome: string; url?: string }[]): string {
  let h = '<ul class="fontes">';
  for (let i = 0; i < itens.length; i++) h += `<li>${esc(itens[i].nome)}${itens[i].url ? `<br><span>${esc(itens[i].url)}</span>` : ''}</li>`;
  return h + '</ul>';
}
export function quebra(): string { return '<div class="quebra"></div>'; }

const CSS = `
*{box-sizing:border-box}
body{margin:0;font-family:'Public Sans',Arial,sans-serif;color:#1C1F24;background:#fff;font-size:12px;line-height:1.55;width:794px}
.pag{padding:4px 6px 10px}
.quebra{page-break-before:always;height:0}
.cab{background:#15171B;color:#fff;border-radius:10px;padding:22px 28px 26px;position:relative;overflow:hidden}
.cab .topo{display:flex;justify-content:space-between;align-items:center;gap:16px}
.cab img{height:20px;width:auto;display:block}
.cab .data{font-size:10.5px;color:#A3A8B1;text-align:right}
.cab .eyebrow{margin-top:22px;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8AB0E6}
.cab h1{font-size:30px;line-height:1.1;margin:6px 0 8px;letter-spacing:-.02em;font-weight:800}
.cab .sub{font-size:12px;color:#C9CDD3}
.cab .faixa{position:absolute;left:0;right:0;bottom:0;height:5px;background:linear-gradient(90deg,#E2231A 0 22%,#8AB0E6 22% 60%,#E9C46A 60% 78%,#7CC79A 78%)}
.kpis{display:grid;gap:10px;margin:16px 0 4px}
.kpi{border:1px solid #E1E6EE;border-left:4px solid #3B5B8C;border-radius:8px;padding:10px 12px}
.kpi span{display:block;font-size:10px;color:#5A6270;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.kpi b{display:block;font-size:22px;letter-spacing:-.01em;margin:3px 0 1px;line-height:1.15}
.kpi em{display:block;font-style:normal;font-size:10px;color:#5A6270}
h2{font-size:17px;margin:24px 0 4px;padding-bottom:5px;border-bottom:2px solid #3B5B8C;letter-spacing:-.01em;color:#15171B}
.cap{font-size:10.5px;color:#5A6270;margin:0 0 10px}
h3{font-size:13px;margin:16px 0 6px;color:#3B5B8C} h3 .etq{margin-left:8px;vertical-align:1px}
h4{font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;color:#3B5B8C}
p{margin:0 0 8px}
table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:10.8px}
th{background:#3B5B8C;color:#fff;text-align:left;padding:6px 8px;font-weight:700}
td{padding:5px 8px;border-bottom:1px solid #E1E6EE;vertical-align:top}
.n{text-align:right;font-variant-numeric:tabular-nums}
tr:nth-child(even) td{background:#F4F7FB}
table.compacta{font-size:10.2px} table.compacta td{padding:4px 7px}
.fonte{font-size:9.5px;color:#6F747D;margin:3px 0 10px}
.aviso{background:#FDF1E7;border-left:4px solid #C2410C;padding:10px 14px;border-radius:6px;margin:12px 0}
.aviso b{color:#C2410C;margin-right:6px}
.aviso.info{background:#EEF3FA;border-left-color:#3B5B8C} .aviso.info b{color:#3B5B8C}
.etq{display:inline-block;font-size:9.5px;font-weight:700;border-radius:999px;padding:1px 8px;white-space:nowrap}
.barras .lb{display:grid;grid-template-columns:150px minmax(0,1fr) 120px;gap:10px;align-items:center;padding:4px 0}
.barras .tr{height:9px;background:#EDF1F6;border-radius:99px;overflow:hidden} .barras .tr i{display:block;height:100%;border-radius:99px}
.barras b{text-align:right;font-weight:600;font-size:11px}
.duas .barras .lb{grid-template-columns:44px minmax(0,1fr) 84px}
.colunas{display:grid;gap:4px;align-items:end;height:150px;margin:8px 0 4px}
.col{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px}
.col i{display:block;width:70%;border-radius:3px 3px 0 0}
.col small{font-size:9px;color:#1C1F24;font-weight:700} .col span{font-size:9px;color:#5A6270;white-space:nowrap}
.duas{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.caixa{border:1px solid #E1E6EE;border-top:3px solid #3B5B8C;border-radius:8px;padding:12px 14px}
ul.lst{list-style:none;margin:0 0 6px;padding:0} ul.lst li{display:grid;grid-template-columns:14px minmax(0,1fr);gap:6px;padding:5px 0;border-bottom:1px solid #EEF1F5} ul.lst li:last-child{border-bottom:0} ul.lst i{font-style:normal;font-weight:800}
ol.num{list-style:none;margin:0;padding:0;display:grid;gap:8px} ol.num li{display:grid;grid-template-columns:30px minmax(0,1fr);gap:8px;border:1px solid #E1E6EE;border-radius:8px;padding:10px 12px}
ol.num i{font-style:normal;font-weight:800;font-size:16px;color:#3B5B8C} ol.num b{display:block} ol.num span{display:block;color:#3A3F48;margin-top:3px}
blockquote{margin:8px 0;padding:6px 12px;border-left:3px solid;font-style:italic;color:#3A3F48;font-size:11px}
blockquote small{display:block;font-style:normal;color:#6F747D;font-size:9.5px;margin-top:3px}
ul.fontes{padding-left:16px;margin:4px 0} ul.fontes li{font-size:10px;color:#3A3F48;margin-bottom:5px} ul.fontes span{color:#6F747D;word-break:break-all}
.rodape{margin-top:20px;padding-top:8px;border-top:1px solid #E1E6EE;font-size:9.5px;color:#6F747D;display:flex;justify-content:space-between;gap:12px}
`;

export interface Documento { titulo: string; eyebrow: string; subtitulo?: string; corpo: string; rodape?: string; ficheiro?: string }

// Monta o documento e gera o PDF (motor A4 de abrir-documento: quebras sem cortar linhas e numeração de páginas)
export function gerarDocumento(d: Documento): void {
  const win = abrirJanelaDocumento(820, 1100);
  if (!win) return;
  const origem = typeof window !== 'undefined' ? window.location.origin : '';
  const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' });
  const rod = d.rodape || t('Município de Braga · Divisão de Atividades Económicas e Turismo · Observatório de Turismo de Braga', 'Braga City Council · Economic Activities and Tourism Division · Braga Tourism Observatory');
  const html = `<!DOCTYPE html><html lang="${t('pt', 'en')}"><head><meta charset="utf-8">
<title>${esc(d.ficheiro || d.titulo)}</title>
<meta name="pdf-rodape" content="${esc(rod)}">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="pag">
<div class="cab"><div class="topo"><img src="${origem}/visit-braga-logo-negativo.png" alt="Visit Braga"><div class="data">${esc(t('Gerado a', 'Generated on'))} ${esc(hoje)}</div></div>
<div class="eyebrow">${esc(d.eyebrow)}</div><h1>${esc(d.titulo)}</h1>${d.subtitulo ? `<div class="sub">${esc(d.subtitulo)}</div>` : ''}<div class="faixa"></div></div>
${d.corpo}
<div class="rodape"><span>${esc(rod)}</span><span>${esc(origem.replace(/^https?:\/\//, ''))}</span></div>
</div></body></html>`;
  win.document.open(); win.document.write(html); win.document.close();
}
