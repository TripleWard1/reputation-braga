'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { ResponsiveContainer, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts';
import { t, dl } from '@/app/lib/i18n';

// Paleta da identidade nova (a mesma da Visão Geral e dos Locais)
export const C = {
  bg: '#15171B', card: '#1C1F24', cardAlt: '#22262D', border: '#2D3139',
  accent: '#8AB0E6', accentLight: '#B7CDF0', accentBg: 'rgba(138,176,230,0.12)',
  positive: '#7CC79A', positiveBg: 'rgba(124,199,154,0.13)',
  negative: '#EF8A7B', negativeBg: 'rgba(239,138,123,0.13)',
  info: '#E9C46A', purple: '#A99BE0', pink: '#E39AC0', cyan: '#6FC8D6', orange: '#EDA06B',
  text: '#ECEDEF', textMuted: '#A3A8B1', textDim: '#8A909B',
};
// Uma cor por ano, em tons harmonizados; o ano em curso (parcial) destaca-se a dourado
export const YEAR_COLORS: Record<string, string> = {
  '2019': '#6F747D', '2020': '#6FC8D6', '2021': '#A99BE0',
  '2022': '#E39AC0', '2023': '#7CC79A', '2024': '#EDA06B',
  '2025': '#8AB0E6', '2026': '#F2C14E',
};
export const PAL = [C.accent, C.positive, C.orange, C.purple, C.cyan, C.pink, C.info, '#6F747D'];
export const fmt = (n: number | null | undefined, c = 0) =>
  n == null || isNaN(n as number) ? '-' : (n as number).toLocaleString('pt-PT', { minimumFractionDigits: c, maximumFractionDigits: c });
export const fmtE = (n: number | null | undefined) => {
  if (n == null) return '-';
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} M€`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} k€`;
  return `${fmt(n)} €`;
};
// ─── Efeitos como nos Locais (só aspeto): aparecer ao descer e números a contar ───
export const semMov = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function useVisivelObs<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (vis) return;
    const el = ref.current;
    const mostra = () => setVis(true);
    window.addEventListener('beforeprint', mostra);
    if (!el || typeof IntersectionObserver === 'undefined' || semMov()) { setVis(true); return () => window.removeEventListener('beforeprint', mostra); }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setVis(true); io.disconnect(); } }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => { io.disconnect(); window.removeEventListener('beforeprint', mostra); };
  }, [vis]);
  return [ref, vis];
}
/** Conta até ao número do texto (ex.: "689 063", "58.1%", "20,66 M€"); no fim mostra o texto original, tal e qual. */
export function ContaTexto({ texto }: { texto: string }) {
  const [ref, vis] = useVisivelObs<HTMLSpanElement>();
  const [p, setP] = useState(0);
  const m = typeof texto === 'string' ? texto.match(/\d[\d\s\u00A0\u202F.,]*\d|\d/) : null;
  useEffect(() => {
    if (!vis || !m) return;
    if (semMov()) { setP(1); return; }
    let raf = 0; const t0 = performance.now(), dur = 1200;
    const passo = (agora: number) => { const x = Math.min(1, (agora - t0) / dur); setP(1 - Math.pow(1 - x, 3)); if (x < 1) raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis, texto]);
  if (!m || p >= 1) return <span ref={ref}>{texto}</span>;
  const tok = m[0];
  const temVirg = tok.includes(','), temPonto = tok.includes('.');
  let dec = 0, sepDec = '', sepMil = '';
  if (temVirg) { dec = tok.split(',').pop()!.length; sepDec = ','; }
  else if (temPonto && tok.split('.').pop()!.length !== 3) { dec = tok.split('.').pop()!.length; sepDec = '.'; }
  else if (temPonto) sepMil = '.';
  const gm = tok.match(/[\s\u00A0\u202F]/); if (gm) sepMil = gm[0];
  const limpo = tok.replace(/[\s\u00A0\u202F]/g, '').replace(sepMil === '.' ? /\./g : /$^/, '').replace(',', '.');
  const alvo = parseFloat(limpo);
  if (!isFinite(alvo)) return <span ref={ref}>{texto}</span>;
  const v = alvo * p;
  const [ip, dp] = v.toFixed(dec).split('.');
  const inteiro = sepMil ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, sepMil) : ip;
  const num = dp ? `${inteiro}${sepDec}${dp}` : inteiro;
  return <span ref={ref}>{texto.slice(0, m.index)}{num}{texto.slice((m.index || 0) + tok.length)}</span>;
}
// Barras de percentagem (mesmo estilo das listas animadas)
export function BarrasPct({ dados, cor, max }: { dados: [string, number][]; cor: string; max?: number }) {
  const m = max || Math.max(1, ...dados.map((d) => d[1]));
  return (
    <div>
      {dados.map(([nome, v], i) => (
        <div key={nome} style={{ margin: '9px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}><span style={{ color: C.text }}>{nome}</span><strong style={{ color: C.text }}>{String(v).replace('.', ',')}%</strong></div>
          <div style={{ height: 7, background: '#262A30', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
            <div className="obs-grow" style={{ width: `${(v / m) * 100}%`, height: '100%', background: cor, borderRadius: 999, animationDelay: `${i * 60}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
export function KPI({ label, value, sub, color = C.accent }: { label: string; value: string; sub?: string; color?: string }) {
  const [kref, kvis] = useVisivelObs<HTMLDivElement>();
  return (
    <div ref={kref} className={`obs-card obs-kpi${kvis ? ' in' : ''}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '20px 22px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMuted, marginBottom: 10, lineHeight: 1.35 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, boxShadow: `0 0 10px ${color}`, flexShrink: 0 }} />{label}
      </div>
      <div className="obs-kpi-v" style={{ fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1.05, marginBottom: 8, letterSpacing: '-0.02em' }}><ContaTexto texto={value} /></div>
      {sub && <div style={{ fontSize: 13, color: color, lineHeight: 1.4 }}>{sub}</div>}
      <div className="obs-kpi-linha" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent 75%)` }} />
    </div>
  );
}
// ── Dados dos gráficos: exportação para Excel e tabela para leitores de ecrã ──
// Lê os dados diretamente dos elementos do gráfico (props "data" e "dados"), por isso funciona em todos os cartões.
type Linha = Record<string, string | number | null>;
const ROTULOS: Record<string, [string, string]> = {
  mes: ['Mês', 'Month'], ano: ['Ano', 'Year'], hora: ['Hora', 'Hour'], dia: ['Dia', 'Day'], v: ['Valor', 'Value'], n: ['Número', 'Number'], valor: ['Valor', 'Value'],
  pais: ['País', 'Country'], tipo: ['Tipo', 'Type'], setor: ['Setor', 'Sector'], freguesia: ['Freguesia', 'Parish'], mod: ['Modalidade', 'Type'], atividade: ['Atividade', 'Activity'],
  periodo: ['Período', 'Period'], escalao: ['Escalão', 'Size band'], name: ['Nome', 'Name'], nome: ['Nome', 'Name'], value: ['Valor', 'Value'], label: ['Rótulo', 'Label'], cat: ['Categoria', 'Category'],
  passageiros: ['Passageiros', 'Passengers'], camas: ['Camas', 'Beds'], quartos: ['Quartos', 'Rooms'], total: ['Total', 'Total'],
};
const IGNORAR = new Set(['color', 'cor', 'fill', 'stroke', 'key', 'id', 'icon', 'icone']);
function recolherDados(no: any, out: { conjuntos: any[][]; nomes: Record<string, string> }, prof = 0) {
  if (!no || prof > 10) return;
  if (Array.isArray(no)) { no.forEach((x) => recolherDados(x, out, prof + 1)); return; }
  if (typeof no !== 'object' || !no.props) return;
  const p = no.props;
  const d = Array.isArray(p.data) ? p.data : Array.isArray(p.dados) ? p.dados : null;
  if (d && d.length && (Array.isArray(d[0]) || (d[0] && typeof d[0] === 'object'))) out.conjuntos.push(d);
  if (typeof p.dataKey === 'string' && typeof p.name === 'string') out.nomes[p.dataKey] = p.name;
  if (p.children) recolherDados(p.children, out, prof + 1);
}
function paraLinhas(conj: any[], nomes: Record<string, string>): Linha[] {
  if (Array.isArray(conj[0])) {
    return conj.map((r: any[]) => { const o: Linha = {}; r.forEach((v, i) => { o[i === 0 ? t('Item', 'Item') : i === 1 ? t('Valor', 'Value') : `${t('Valor', 'Value')} ${i}`] = typeof v === 'number' || typeof v === 'string' ? v : v == null ? null : String(v); }); return o; });
  }
  const chaves: string[] = [];
  conj.forEach((r: any) => Object.keys(r || {}).forEach((k) => { if (!IGNORAR.has(k) && !k.startsWith('_') && !chaves.includes(k)) chaves.push(k); }));
  const titulo = (k: string) => nomes[k] || (ROTULOS[k] ? t(ROTULOS[k][0], ROTULOS[k][1]) : k);
  return conj.map((r: any) => {
    const o: Linha = {};
    chaves.forEach((k) => { const v = r?.[k]; o[titulo(k)] = typeof v === 'number' || typeof v === 'string' ? v : v == null ? null : typeof v === 'boolean' ? (v ? t('sim', 'yes') : t('não', 'no')) : null; });
    return o;
  });
}
const slugFicheiro = (s: string) => (s || 'dados').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'dados';
let xlsxPromessa: Promise<any> | null = null;
function carregarXlsx(): Promise<any> {
  const w = window as any;
  if (w.XLSX) return Promise.resolve(w.XLSX);
  if (!xlsxPromessa) {
    xlsxPromessa = new Promise((ok, ko) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      sc.async = true;
      sc.onload = () => (w.XLSX ? ok(w.XLSX) : ko(new Error('xlsx')));
      sc.onerror = () => { xlsxPromessa = null; ko(new Error('xlsx')); };
      document.head.appendChild(sc);
    });
  }
  return xlsxPromessa;
}
function guardarFicheiro(conteudo: BlobPart, tipo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function descarregarDados(titulo: string, folhas: Linha[][]) {
  const nome = slugFicheiro(titulo);
  try {
    const X = await carregarXlsx();
    const wb = X.utils.book_new();
    folhas.forEach((l, i) => X.utils.book_append_sheet(wb, X.utils.json_to_sheet(l), folhas.length > 1 ? `${t('Dados', 'Data')} ${i + 1}` : t('Dados', 'Data')));
    X.writeFile(wb, `${nome}.xlsx`);
  } catch {
    // Alternativa sem biblioteca: CSV que o Excel abre diretamente (UTF-8 com BOM, separador ";" e vírgula decimal)
    const csv = folhas.map((l) => {
      const cab = Object.keys(l[0] || {});
      const cel = (v: any) => { if (v == null) return ''; if (typeof v === 'number') return String(v).replace('.', ','); const s2 = String(v); return /[;"\n]/.test(s2) ? `"${s2.replace(/"/g, '""')}"` : s2; };
      return [cab.map(cel).join(';'), ...l.map((r) => cab.map((k) => cel(r[k])).join(';'))].join('\r\n');
    }).join('\r\n\r\n');
    guardarFicheiro('\ufeff' + csv, 'text/csv;charset=utf-8', `${nome}.csv`);
  }
}
function TabelaAcessivel({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  const cab = Object.keys(linhas[0] || {});
  if (!cab.length) return null;
  return (
    <table className="obs-sr">
      <caption>{titulo}</caption>
      <thead><tr>{cab.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{linhas.slice(0, 80).map((r, i) => <tr key={i}>{cab.map((c) => <td key={c}>{r[c] == null ? '—' : typeof r[c] === 'number' ? (r[c] as number).toLocaleString(t('pt-PT', 'en-GB')) : String(r[c])}</td>)}</tr>)}</tbody>
    </table>
  );
}
export function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  const [cref, cvis] = useVisivelObs<HTMLDivElement>();
  const idTitulo = useId();
  const rec = { conjuntos: [] as any[][], nomes: {} as Record<string, string> };
  try { recolherDados(children, rec); } catch { /* sem dados exportáveis */ }
  const folhas = rec.conjuntos.map((c) => paraLinhas(c, rec.nomes)).filter((l) => l.length && Object.keys(l[0]).length);
  return (
    <div ref={cref} role="group" aria-labelledby={idTitulo} className={`obs-card${cvis ? ' in' : ''}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div id={idTitulo} style={{ fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.01em', lineHeight: 1.35 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {right}
          {folhas.length > 0 && (
            <button type="button" className="obs-dl" onClick={() => descarregarDados(title, folhas)} title={t('Descarregar os dados deste gráfico em Excel', 'Download this chart’s data as Excel')} aria-label={t(`Descarregar dados em Excel: ${title}`, `Download data as Excel: ${title}`)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
              <span>{t('Dados', 'Data')}</span>
            </button>
          )}
        </div>
      </div>
      {folhas.length > 0 && <TabelaAcessivel titulo={title} linhas={folhas[0]} />}
      {cvis ? children : <div style={{ minHeight: 240 }} />}
    </div>
  );
}
export function Chips({ options, sel, toggle, single, label }: { options: string[]; sel: string[]; toggle: (o: string) => void; single?: boolean; label?: (o: string) => string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = sel.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontWeight: on ? 600 : 500, fontFamily: 'inherit',
            border: `1px solid ${on ? (YEAR_COLORS[o] || C.accent) : C.border}`,
            background: on ? (YEAR_COLORS[o] ? `${YEAR_COLORS[o]}22` : C.accentBg) : 'transparent',
            color: on ? (YEAR_COLORS[o] || C.accentLight) : C.textMuted,
          }}>{label ? label(o) : o}</button>
        );
      })}
    </div>
  );
}
export const tipStyle = { background: 'rgba(21,23,27,0.94)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12.5, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' };
export function HBars({ data, color }: { data: [string, number][]; color?: string }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map(([k, v], i) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: C.text }}>{dl(k)}</span>
            <span style={{ color: C.textMuted }}>{fmt(v)}</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
            <div className="obs-grow" style={{ width: `${(v / max) * 100}%`, height: '100%', background: color || PAL[i % PAL.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
export function Cruz({ label, value, color, nota }: { label: string; value: string; color: string; nota: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textDim }}>{nota}</div>
    </div>
  );
}
// ─── TAXA TURÍSTICA ──────────────────────────────────────────────────────────
// ─── SUSTENTABILIDADE ────────────────────────────────────────────────────────
export const SUS_PAL = [C.positive, C.accent, C.orange, C.purple, C.info, C.cyan, C.pink];
// Ícones de traço fino para os indicadores (substituem os emojis)
export const BADGE_ICON: Record<string, string> = {
  '👍': 'M7 11v9H4v-9h3zm0 0l4-8a2 2 0 012 2v4h5.5a2 2 0 012 2.3l-1.2 7A2 2 0 0117.3 20H7',
  '💶': 'M18 7a7 7 0 100 10M5 10h9M5 14h9',
  '🎭': 'M4 4h16v6a8 8 0 01-16 0V4zM9 9h.01M15 9h.01M9 13a4 4 0 006 0',
  '🏠': 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z',
  '🌍': 'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  '♻': 'M7 19H4.8a1.8 1.8 0 01-1.6-2.7L5 13M8 10L5 13l-3-1M11 5.3l1.2-2a1.8 1.8 0 013.1 0L17 6M16 6l3 1 1-3M19 13l1.8 3.3a1.8 1.8 0 01-1.6 2.7H14M14 16l-3 3 3 3',
  '📝': 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  '📜': 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  '📅': 'M4 6h16v15H4zM4 10h16M8 3v5M16 3v5',
  '👥': 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7.5M22 21v-1a6 6 0 00-4-5.6',
  '🚌': 'M5 17V6a2 2 0 012-2h10a2 2 0 012 2v11M5 12h14M5 17h14M7 20v-3M17 20v-3M8 15h.01M16 15h.01',
  '💡': 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z',
  '🍃': 'M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l8-8',
  '🌱': 'M12 21v-9M12 12C12 7 9 4 4 4c0 5 3 8 8 8zM12 14c0-4 3-7 8-7 0 4-3 7-8 7z',
  '🤝': 'M12 21s-8-4.5-8-11a4.5 4.5 0 018-2.9A4.5 4.5 0 0120 10c0 6.5-8 11-8 11z',
  '🚶': 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h2M18 9v6a4 4 0 01-4 4h-2',
  '🥾': 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h2M18 9v6a4 4 0 01-4 4h-2',
  '🏅': 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.5 14L7 22l5-3 5 3-1.5-8',
  '🧭': 'M12 21a9 9 0 100-18 9 9 0 000 18zm3.5-12.5l-2 5-5 2 2-5 5-2z',
};
export function Badge({ icon, value, label, color = C.accent, hint }: { icon: string; value: string; label: string; color?: string; hint?: string }) {
  const path = BADGE_ICON[icon] || BADGE_ICON[icon.replace(/\uFE0F/g, '')];
  const [bref, bvis] = useVisivelObs<HTMLDivElement>();
  return (
    <div ref={bref} className={`obs-card${bvis ? ' in' : ''}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {path && (
          <div style={{ width: 42, height: 42, borderRadius: 6, background: `${color}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1.1, letterSpacing: '-0.01em' }}><ContaTexto texto={value} /></div>
          <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.35, marginTop: 3 }}>{label}</div>
        </div>
      </div>
      {hint && <div style={{ fontSize: 12, color: C.textDim, marginTop: 8, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ margin: '36px 0 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.015em', lineHeight: 1.25 }}>{children}</div>
      {sub && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}
export function MiniPie({ data, height = 210 }: { data: [string, number][]; height?: number }) {
  const rows = data.map(([name, value], i) => ({ name: dl(name), value, fill: SUS_PAL[i % SUS_PAL.length] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
          {rows.map((r, i) => <Cell key={i} fill={r.fill} />)}
        </Pie>
        <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
