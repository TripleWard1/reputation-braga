import { abrirJanelaDocumento } from '@/app/lib/abrir-documento';
// ═══════════════════════════════════════════════════════════════════════════
// GERADOR DE DOCUMENTOS PREMIUM (tema claro A4) - Observatório Visit Braga
// Sem dependências: produz HTML claro impresso pelo browser (texto vetorial,
// nítido em PDF). Reutilizável por qualquer área - basta montar kpis + sections.
// ═══════════════════════════════════════════════════════════════════════════

type Bar = { label: string; value: number; display?: string };

export type Section =
  | { kind: 'prose'; title?: string; paras: string[] }
  | { kind: 'bars'; title: string; note?: string; data: Bar[]; color?: string }
  | { kind: 'table'; title: string; note?: string; head: string[]; rows: (string | number)[][]; emphasizeRow?: number }
  | { kind: 'stats'; title: string; items: { label: string; value: string; sub?: string }[] };

export interface PremiumDocOpts {
  logo: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  kpis: { label: string; value: string; sub?: string }[];
  sections: Section[];
  footerL?: string;
  footerR?: string;
}

const esc = (t: any) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderSection(s: Section): string {
  if (s.kind === 'prose') {
    const h = s.title ? '<h2>' + esc(s.title) + '</h2>' : '';
    const ps = s.paras.map((p) => '<p>' + esc(p) + '</p>').join('');
    return '<section>' + h + ps + '</section>';
  }
  if (s.kind === 'bars') {
    const max = Math.max.apply(null, s.data.map((d) => d.value).concat([1]));
    const color = s.color || '#6FA0DC';
    const rows = s.data.map((d) => {
      const w = Math.max(2, (d.value / max) * 100).toFixed(1);
      const disp = esc(d.display != null ? d.display : d.value);
      return '<div class="bar"><div class="bl"><span>' + esc(d.label) + '</span><span class="bv">' + disp +
        '</span></div><div class="bt"><div class="bf" style="width:' + w + '%;background:' + color + ';"></div></div></div>';
    }).join('');
    const note = s.note ? '<p class="note">' + esc(s.note) + '</p>' : '';
    return '<section><h2>' + esc(s.title) + '</h2>' + rows + note + '</section>';
  }
  if (s.kind === 'table') {
    const head = '<tr>' + s.head.map((h, i) => '<th class="' + (i === 0 ? 'l' : 'r') + '">' + esc(h) + '</th>').join('') + '</tr>';
    const body = s.rows.map((r, ri) => {
      const cls = ri === s.emphasizeRow ? ' class="em"' : '';
      const cells = r.map((c, i) => '<td class="' + (i === 0 ? 'l' : 'r') + '">' + esc(c) + '</td>').join('');
      return '<tr' + cls + '>' + cells + '</tr>';
    }).join('');
    const note = s.note ? '<p class="note">' + esc(s.note) + '</p>' : '';
    return '<section><h2>' + esc(s.title) + '</h2><table>' + head + body + '</table>' + note + '</section>';
  }
  if (s.kind === 'stats') {
    const items = s.items.map((it) => {
      const sub = it.sub ? '<div class="ss">' + esc(it.sub) + '</div>' : '';
      return '<div class="st"><div class="sv">' + esc(it.value) + '</div><div class="sl">' + esc(it.label) + '</div>' + sub + '</div>';
    }).join('');
    return '<section><h2>' + esc(s.title) + '</h2><div class="stats">' + items + '</div></section>';
  }
  return '';
}

export function openPremiumDoc(opts: PremiumDocOpts) {
  const win = abrirJanelaDocumento(1100, 860);
  if (!win) { alert('Permita pop-ups para exportar o PDF.'); return; }
  const kpiHtml = opts.kpis.map((k) => {
    const sub = k.sub ? '<div class="ks">' + esc(k.sub) + '</div>' : '';
    return '<div class="kpi"><div class="kv">' + esc(k.value) + '</div><div class="kl">' + esc(k.label) + '</div>' + sub + '</div>';
  }).join('');
  const sectionsHtml = opts.sections.map(renderSection).join('');
  const footerL = esc(opts.footerL || 'Município de Braga · Divisão de Atividades Económicas e Turismo');
  const footerR = esc(opts.footerR || 'Observatório de Turismo de Braga');

  const css = [
    '*{box-sizing:border-box;margin:0;padding:0;}',
    ":root{--ink:#15171B;--ink2:#3A3F48;--muted:#6F747D;--acc:#3E6FB0;--accL:#8AB0E6;--star:#C8961B;--paper:#ffffff;--band:#15171B;--line:#E3E6EB;--tint:#F4F6F9;}",
    'html,body{background:#E9EBEF;}',
    "body{font-family:'Public Sans',system-ui,sans-serif;color:var(--ink);font-variant-numeric:tabular-nums;-webkit-print-color-adjust:exact;print-color-adjust:exact;}",
    '.sheet{background:var(--paper);width:210mm;min-height:297mm;margin:0 auto;display:flex;flex-direction:column;box-shadow:0 4px 30px rgba(0,0,0,.18);}',
    '.band{background:radial-gradient(520px 200px at 50% 0%,rgba(138,176,230,.22),transparent),var(--band);padding:26px 36px 24px;text-align:center;border-bottom:3px solid var(--accL);}',
    '.band img{height:30px;width:auto;display:block;margin:0 auto 18px;}',
    '.band .eyebrow{font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--accL);margin-bottom:8px;}',
    ".band h1{font-weight:700;font-size:24px;color:#fff;letter-spacing:-.02em;line-height:1.12;}",
    '.band .sub{font-size:11px;color:#A3A8B1;margin-top:7px;}',
    '.kpis{display:flex;gap:10px;padding:22px 32px 6px;}',
    '.kpi{flex:1;background:var(--tint);border:1px solid var(--line);border-radius:6px;padding:14px 15px;border-top:3px solid var(--accL);}',
    ".kv{font-weight:700;font-size:21px;color:var(--ink);line-height:1.05;letter-spacing:-.01em;}",
    '.kl{font-size:9px;color:var(--muted);margin-top:8px;}',
    '.ks{font-size:8.5px;color:var(--acc);margin-top:4px;font-weight:600;}',
    '.content{flex:1;padding:14px 36px 30px;}',
    'section{margin-top:16px;break-inside:avoid;}',
    ".content h2{font-weight:700;font-size:15px;color:var(--ink);margin:8px 0 8px;padding-bottom:7px;position:relative;letter-spacing:-.01em;}",
    ".content h2:after{content:'';position:absolute;left:0;bottom:0;width:34px;height:2px;background:var(--accL);}",
    '.content p{font-size:10.5pt;line-height:1.62;color:var(--ink2);margin:8px 0;}',
    '.note{font-size:9pt !important;color:var(--muted) !important;margin-top:10px !important;line-height:1.5;}',
    '.bar{margin:10px 0;}',
    '.bl{display:flex;justify-content:space-between;font-size:10.5pt;color:var(--ink2);margin-bottom:5px;}',
    '.bv{color:var(--ink);font-weight:700;}',
    '.bt{height:8px;border-radius:999px;background:#E9EDF3;overflow:hidden;}',
    '.bf{height:100%;border-radius:999px;}',
    'table{width:100%;border-collapse:collapse;margin-top:4px;}',
    'th{font-size:8.5pt;font-weight:600;color:var(--muted);padding:8px 9px;border-bottom:1.5px solid var(--line);}',
    'td{font-size:10.5pt;color:var(--ink2);padding:8px 9px;border-bottom:1px solid var(--line);}',
    'th.l,td.l{text-align:left;}',
    'th.r,td.r{text-align:right;}',
    'tr.em td{background:var(--tint);color:var(--ink);font-weight:700;}',
    '.stats{display:flex;gap:10px;flex-wrap:wrap;}',
    '.st{flex:1;min-width:120px;background:var(--tint);border:1px solid var(--line);border-radius:6px;padding:13px 14px;}',
    ".sv{font-weight:700;font-size:18px;color:var(--ink);}",
    '.sl{font-size:9pt;color:var(--ink2);margin-top:6px;}',
    '.ss{font-size:8pt;color:var(--muted);margin-top:3px;}',
    '.foot{padding:12px 32px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:8.5px;color:var(--muted);}',
    '@page{size:A4;margin:0;}',
    '@media print{html,body{background:#fff;}.sheet{margin:0;box-shadow:none;}}',
  ].join('');

  const html =
    '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">' +
    '<title>' + esc(opts.title) + ' - ' + esc(opts.subtitle) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' +
    '<div class="sheet">' +
    '<div class="band"><img src="' + opts.logo + '" alt="Visit Braga">' +
    '<div class="eyebrow">' + esc(opts.eyebrow) + '</div><h1>' + esc(opts.title) + '</h1>' +
    '<div class="sub">' + esc(opts.subtitle) + '</div></div>' +
    '<div class="kpis">' + kpiHtml + '</div>' +
    '<div class="content">' + sectionsHtml + '</div>' +
    '<div class="foot"><span>' + footerL + '</span><span>' + footerR + '</span></div>' +
    '</div>' +
    '<script>setTimeout(function(){window.focus();window.print();},800);</script>' +
    '</body></html>';
  win.document.open(); win.document.write(html); win.document.close();
}