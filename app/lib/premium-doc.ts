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
    const color = s.color || '#c9a84c';
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
  const win = window.open('', '_blank', 'width=1100,height=860');
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
    ":root{--ink:#1f232c;--ink2:#3a3f4b;--muted:#7c8190;--gold:#9c7d28;--goldL:#c9a84c;--paper:#ffffff;--band:#14171d;--line:#e7e3d8;--tint:#faf8f3;}",
    'html,body{background:#e9e9ec;}',
    "body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;}",
    '.sheet{background:var(--paper);width:210mm;min-height:297mm;margin:0 auto;display:flex;flex-direction:column;box-shadow:0 4px 30px rgba(0,0,0,.18);}',
    '.band{background:var(--band);padding:26px 32px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--goldL);}',
    '.band img{height:36px;width:auto;}',
    '.band .t{text-align:right;}',
    '.band .eyebrow{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--goldL);margin-bottom:7px;}',
    ".band h1{font-family:'Fraunces',serif;font-weight:600;font-size:22px;color:#fff;letter-spacing:-.01em;line-height:1.1;}",
    '.band .sub{font-size:11px;color:#9aa0ad;margin-top:6px;}',
    '.kpis{display:flex;gap:10px;padding:22px 32px 6px;}',
    '.kpi{flex:1;background:var(--tint);border:1px solid var(--line);border-radius:10px;padding:14px 15px;}',
    ".kv{font-family:'Fraunces',serif;font-weight:600;font-size:20px;color:var(--ink);line-height:1.05;}",
    '.kl{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:8px;}',
    '.ks{font-size:8px;color:var(--gold);margin-top:4px;}',
    '.content{flex:1;padding:14px 36px 30px;}',
    'section{margin-top:14px;break-inside:avoid;}',
    ".content h2{font-family:'Fraunces',serif;font-weight:600;font-size:15px;color:var(--ink);margin:8px 0 8px;padding-bottom:7px;position:relative;}",
    ".content h2:after{content:'';position:absolute;left:0;bottom:0;width:34px;height:2px;background:var(--goldL);}",
    '.content p{font-size:10.5pt;line-height:1.62;color:var(--ink2);margin:8px 0;}',
    '.note{font-size:9pt !important;color:var(--muted) !important;margin-top:10px !important;line-height:1.5;}',
    '.bar{margin:10px 0;}',
    '.bl{display:flex;justify-content:space-between;font-size:10.5pt;color:var(--ink2);margin-bottom:5px;}',
    '.bv{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums;}',
    '.bt{height:8px;border-radius:5px;background:#efece3;overflow:hidden;}',
    '.bf{height:100%;border-radius:5px;}',
    'table{width:100%;border-collapse:collapse;margin-top:4px;}',
    'th{font-size:8.5pt;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:8px 9px;border-bottom:1.5px solid var(--line);}',
    'td{font-size:10.5pt;color:var(--ink2);padding:8px 9px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums;}',
    'th.l,td.l{text-align:left;}',
    'th.r,td.r{text-align:right;}',
    'tr.em td{background:var(--tint);color:var(--ink);font-weight:600;}',
    '.stats{display:flex;gap:10px;flex-wrap:wrap;}',
    '.st{flex:1;min-width:120px;background:var(--tint);border:1px solid var(--line);border-radius:10px;padding:13px 14px;}',
    ".sv{font-family:'Fraunces',serif;font-weight:600;font-size:18px;color:var(--ink);}",
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
    '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>' + css + '</style></head><body>' +
    '<div class="sheet">' +
    '<div class="band"><img src="' + opts.logo + '" alt="Visit Braga">' +
    '<div class="t"><div class="eyebrow">' + esc(opts.eyebrow) + '</div><h1>' + esc(opts.title) + '</h1>' +
    '<div class="sub">' + esc(opts.subtitle) + '</div></div></div>' +
    '<div class="kpis">' + kpiHtml + '</div>' +
    '<div class="content">' + sectionsHtml + '</div>' +
    '<div class="foot"><span>' + footerL + '</span><span>' + footerR + '</span></div>' +
    '</div>' +
    '<script>setTimeout(function(){window.focus();window.print();},800);</script>' +
    '</body></html>';
  win.document.open(); win.document.write(html); win.document.close();
}