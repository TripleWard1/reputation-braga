'use client';

// ═══════════════════════════════════════════════════════════════════════════
// VISÃO GERAL + LOCAIS - painel de apoio à decisão (reputação dos locais)
// • Medidor de reputação (média real de estrelas, com o valor de há 12 meses)
// • Alertas por regras claras: queda de média, subida de críticas, média < 4,
//   falta de resposta, análise desatualizada, amostra pequena
// • Matriz "onde agir" (volume × avaliação), classificação com tendência,
//   problemas que se repetem entre locais e satisfação por língua
// • Locais como dossiês, com a análise sempre visível
// Não toca no Observatório.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { t } from '@/app/lib/i18n';
import { dispAnalysis } from '@/app/lib/ai-translate';
import { windowStats, langName, type ReviewStats, type WindowStats } from '@/app/lib/reviews';

// ─── Tipos mínimos (compatíveis com Location do page.tsx) ───────────────────
export interface VLoc {
  id: string;
  name: string;
  category: string;
  reviews: unknown[];
  analysis: any | null;
  lastAnalyzed: string | null;
  reviewStats?: ReviewStats;
}

// ─── Tokens ─────────────────────────────────────────────────────────────────
const K = {
  slab: '#11141c', slab2: '#151924', line: '#242938', lineSoft: '#1b1f2a',
  gold: '#c9a84c', goldHi: '#e8d49a', goldBg: 'rgba(201,168,76,0.10)',
  text: '#ece8df', mute: '#a3a09a', dim: '#6f727c',
  good: '#7cc49a', warn: '#e3a857', bad: '#e27d68', info: '#8fb1dd',
};
const SERIF = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const NUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };
const loc0 = () => t('pt-PT', 'en-GB');
const fmt = (n: number, d = 0) => n.toLocaleString(loc0(), { minimumFractionDigits: d, maximumFractionDigits: d });
const sinal = (n: number, d = 2) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n), d)}`;

// ─── Ícones (traço fino, desenhados para a app) ─────────────────────────────
const PATHS: Record<string, string> = {
  import: 'M12 3v11m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zm9 3l-4.35-4.35',
  arrow: 'M5 12h14m-6-6l6 6-6 6',
  link: 'M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  paste: 'M9 4h6v3H9zM8 5H6a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1h-2M9 12h6M9 16h4',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  up: 'M4 17l6-6 4 4 6-7M14 8h6v6',
  down: 'M4 7l6 6 4-4 6 7M14 16h6v-6',
  flat: 'M4 12h16',
  chat: 'M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12z',
  reply: 'M9 14L4 9l5-5M4 9h11a5 5 0 015 5v6',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zm3.5-12.5l-2 5-5 2 2-5 5-2z',
  chart: 'M4 20V10M10 20V4M16 20v-7M2 20h20',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  columns: 'M4 5h6v14H4zM14 5h6v14h-6z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
};
export function Icon({ name, size = 16, color = 'currentColor', stroke = 1.6, style }: { name: string; size?: number; color?: string; stroke?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-0.18em', flexShrink: 0, ...style }}>
      <path d={PATHS[name] || ''} />
    </svg>
  );
}

// ─── Estrelas com preenchimento parcial ─────────────────────────────────────
const STAR = 'M12 2.6l2.85 6.03 6.6.78-4.88 4.53 1.3 6.53L12 17.2l-5.87 3.27 1.3-6.53-4.88-4.53 6.6-.78L12 2.6z';
export function Stars({ value, size = 16, gap = 2 }: { value: number; size?: number; gap?: number }) {
  return (
    <span role="img" aria-label={t(`${fmt(value, 2)} de 5 estrelas`, `${fmt(value, 2)} out of 5 stars`)} style={{ display: 'inline-flex', gap, verticalAlign: 'middle' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const f = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}><path d={STAR} fill={K.line} /></svg>
            <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${f * 100}%`, overflow: 'hidden' }}>
              <svg width={size} height={size} viewBox="0 0 24 24"><path d={STAR} fill={K.gold} /></svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}

// ─── Medidor em arco (1 a 5 estrelas) ───────────────────────────────────────
function Gauge({ value, previous, size = 320 }: { value: number; previous: number | null; size?: number }) {
  const W = size, r = W / 2 - 22, cx = W / 2, cy = W / 2 + 4, H = W / 2 + 34;
  const pt = (v: number, rr = r) => {
    const a = Math.PI * (1 - (Math.max(1, Math.min(5, v)) - 1) / 4);
    return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  };
  const [vx, vy] = pt(value);
  const arco = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${vx.toFixed(2)} ${vy.toFixed(2)}`;
  const trilho = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const prev = previous != null ? pt(previous) : null;
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t(`Média de ${fmt(value, 2)} estrelas`, `Average of ${fmt(value, 2)} stars`)}>
        <defs>
          <linearGradient id="rbv-ouro" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#7d6428" />
            <stop offset="100%" stopColor={K.goldHi} />
          </linearGradient>
        </defs>
        <path d={trilho} fill="none" stroke={K.lineSoft} strokeWidth={12} strokeLinecap="round" />
        <path d={arco} fill="none" stroke="url(#rbv-ouro)" strokeWidth={12} strokeLinecap="round" className="rbv-arco" pathLength={100} />
        {[1, 2, 3, 4, 5].map((v) => {
          const [x1, y1] = pt(v, r - 16), [x2, y2] = pt(v, r - 24), [lx, ly] = pt(v, r - 38);
          return (
            <g key={v}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.dim} strokeWidth={1.2} />
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fill={K.dim} style={{ fontFamily: 'inherit' }}>{v}</text>
            </g>
          );
        })}
        {prev && (
          <g>
            <circle cx={prev[0]} cy={prev[1]} r={7} fill={K.slab} stroke={K.mute} strokeWidth={1.5} strokeDasharray="2 2" />
          </g>
        )}
        <circle cx={vx} cy={vy} r={8} fill={K.goldHi} stroke={K.slab} strokeWidth={3} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: W * 0.2, lineHeight: 1, fontWeight: 500, color: K.text, letterSpacing: '-0.02em', ...NUM }}>{fmt(value, 2)}</div>
        <div style={{ fontSize: 12.5, color: K.mute, marginTop: 6 }}>{t('média de estrelas, de 1 a 5', 'average stars, from 1 to 5')}</div>
      </div>
    </div>
  );
}

// ─── Mini gráfico de tendência ──────────────────────────────────────────────
function Spark({ values, w = 96, h = 26, color = K.gold }: { values: number[]; w?: number; h?: number; color?: string }) {
  if (values.length < 2) return <span style={{ display: 'inline-block', width: w, height: h }} />;
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(0.2, max - min);
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`);
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} />
    </svg>
  );
}

// ─── Cálculos ───────────────────────────────────────────────────────────────
const ym = (d: Date) => d.toISOString().slice(0, 7);
const mesesAtras = (n: number) => { const d = new Date(); return ym(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1))); };
interface Periodo { n: number; sum: number; neg: number; replies: number }
function somaPeriodo(st: ReviewStats | undefined, de: string, ate: string): Periodo {
  const p = { n: 0, sum: 0, neg: 0, replies: 0 };
  if (!st || !st.byMonth) return p;
  for (const [m, s] of Object.entries(st.byMonth)) {
    if (m >= de && m < ate) { p.n += s.n; p.sum += s.sum; p.neg += (s.dist?.[0] || 0) + (s.dist?.[1] || 0); p.replies += s.replies || 0; }
  }
  return p;
}
const mediaP = (p: Periodo) => (p.n ? p.sum / p.n : null);
const negP = (p: Periodo) => (p.n ? (p.neg / p.n) * 100 : null);

export interface Metrica {
  loc: VLoc; a: any | null; ws: WindowStats | null;
  avg: number | null; n: number; neg: number | null; resp: number | null;
  rec: Periodo; prev: Periodo; delta: number | null; negDelta: number | null;
  quarters: number[]; basis: 'estrelas' | 'ia' | 'nenhuma'; stale: boolean;
}
export function metrica(l: VLoc): Metrica {
  const ws = windowStats(l.reviewStats);
  const a = l.analysis ? dispAnalysis(l) : null;
  const rec = somaPeriodo(l.reviewStats, mesesAtras(12), '9999-99');
  const prev = somaPeriodo(l.reviewStats, mesesAtras(24), mesesAtras(12));
  const mr = mediaP(rec), mp = mediaP(prev), nr = negP(rec), np = negP(prev);
  const ok = rec.n >= 10 && prev.n >= 10;
  return {
    loc: l, a, ws,
    avg: ws ? ws.avg : a && a.sentimentScore ? a.sentimentScore / 2 : null,
    n: ws ? ws.n : (a && a.reviewCount) || l.reviews.length || 0,
    neg: ws ? ws.neg : a && a.sentimentBreakdown ? a.sentimentBreakdown.negative : null,
    resp: ws ? ws.respRate : null,
    rec, prev,
    delta: ok && mr != null && mp != null ? mr - mp : null,
    negDelta: ok && nr != null && np != null ? nr - np : null,
    quarters: ws ? ws.quarters.map((q) => q.avg) : [],
    basis: ws ? 'estrelas' : a ? 'ia' : 'nenhuma',
    stale: !!l.reviewStats && (!l.lastAnalyzed || l.lastAnalyzed < l.reviewStats.lastImport),
  };
}

interface Alerta { sev: number; id: string; nome: string; texto: string; acao: string; peso: number }
function alertas(ms: Metrica[]): Alerta[] {
  const out: Alerta[] = [];
  for (const m of ms) {
    const base = { id: m.loc.id, nome: m.loc.name, peso: m.n };
    const mr = mediaP(m.rec), mp = mediaP(m.prev), nr = negP(m.rec), np = negP(m.prev);
    if (m.delta != null && m.delta <= -0.15 && mr != null && mp != null)
      out.push({ ...base, sev: m.delta <= -0.3 ? 3 : 2, texto: t(`A média caiu de ${fmt(mp, 2)} para ${fmt(mr, 2)} estrelas nos últimos 12 meses.`, `The average fell from ${fmt(mp, 2)} to ${fmt(mr, 2)} stars over the last 12 months.`), acao: t('Ver os problemas recentes', 'See recent issues') });
    if (m.negDelta != null && m.negDelta >= 3 && nr != null && np != null)
      out.push({ ...base, sev: m.negDelta >= 6 ? 3 : 2, texto: t(`As críticas de 1–2 estrelas passaram de ${fmt(np, 1)}% para ${fmt(nr, 1)}% dos comentários.`, `1–2 star reviews rose from ${fmt(np, 1)}% to ${fmt(nr, 1)}% of reviews.`), acao: t('Identificar a causa', 'Identify the cause') });
    if (m.avg != null && m.avg < 4 && m.n >= 30)
      out.push({ ...base, sev: 2, texto: t(`Média de ${fmt(m.avg, 2)} estrelas, abaixo das 4 estrelas, com ${fmt(m.n)} comentários.`, `Average of ${fmt(m.avg, 2)} stars, below 4 stars, across ${fmt(m.n)} reviews.`), acao: t('Definir plano de melhoria', 'Set an improvement plan') });
    if (m.resp != null && m.resp < 5 && m.n >= 50)
      out.push({ ...base, sev: 1, texto: t(`Só ${fmt(m.resp, 1)}% dos comentários têm resposta de quem gere o local.`, `Only ${fmt(m.resp, 1)}% of reviews get a reply from the site manager.`), acao: t('Responder às críticas ou sensibilizar a entidade gestora', 'Reply to criticism or engage the site manager') });
    if (m.stale)
      out.push({ ...base, sev: 1, texto: t('Há comentários importados que ainda não entraram na análise.', 'There are imported reviews not yet included in the analysis.'), acao: t('Correr a análise', 'Run the analysis') });
    if (m.basis !== 'nenhuma' && m.n > 0 && m.n < 30)
      out.push({ ...base, sev: 1, texto: t(`Só ${fmt(m.n)} comentários: leitura pouco robusta.`, `Only ${fmt(m.n)} reviews: a weak reading.`), acao: t('Não comparar com locais de grande volume', 'Do not compare with high-volume places') });
  }
  return out.sort((x, y) => y.sev - x.sev || y.peso - x.peso);
}

// ─── Peças de layout ────────────────────────────────────────────────────────
function Secao({ titulo, sub, children, direita }: { titulo: string; sub?: string; children: ReactNode; direita?: ReactNode }) {
  return (
    <section style={{ marginTop: 44 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${K.line}` }}>
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, margin: 0, color: K.text, letterSpacing: '-0.01em' }}>{titulo}</h2>
          {sub && <p style={{ fontSize: 13, color: K.mute, margin: '6px 0 0', lineHeight: 1.55 }}>{sub}</p>}
        </div>
        {direita}
      </div>
      {children}
    </section>
  );
}

const btn = (primary = false, disabled = false): CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  border: primary ? 'none' : `1px solid ${K.line}`, background: primary ? (disabled ? K.line : K.gold) : 'transparent',
  color: primary ? (disabled ? K.dim : '#15120a') : disabled ? K.dim : K.text, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
});
const iconBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: `1px solid ${K.line}`, background: 'transparent', color: K.mute, cursor: 'pointer' };

function Tendencia({ delta }: { delta: number | null }) {
  if (delta == null) return <span style={{ fontSize: 12, color: K.dim }}>{t('sem histórico', 'no history')}</span>;
  const c = delta <= -0.05 ? K.bad : delta >= 0.05 ? K.good : K.mute;
  const ic = delta <= -0.05 ? 'down' : delta >= 0.05 ? 'up' : 'flat';
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: c, fontWeight: 600, ...NUM }}><Icon name={ic} size={14} />{sinal(delta)}</span>;
}

function BarraSentimento({ a, ws }: { a: any | null; ws: WindowStats | null }) {
  const pos = ws ? ws.pos : a?.sentimentBreakdown?.positive, neu = ws ? ws.neu : a?.sentimentBreakdown?.neutral, neg = ws ? ws.neg : a?.sentimentBreakdown?.negative;
  if (pos == null || neg == null) return null;
  return (
    <div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: K.lineSoft }}>
        <div style={{ width: `${pos}%`, background: K.good }} />
        <div style={{ width: `${neu || 0}%`, background: K.dim }} />
        <div style={{ width: `${neg}%`, background: K.bad }} />
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: K.mute, marginTop: 6, ...NUM }}>
        <span><span style={{ color: K.good }}>●</span> {fmt(pos, 0)}% {t('positivos', 'positive')}</span>
        <span><span style={{ color: K.bad }}>●</span> {fmt(neg, 0)}% {t('negativos', 'negative')}</span>
      </div>
    </div>
  );
}

const ESTILO = `
.rbv button:focus-visible, .rbv a:focus-visible, .rbv input:focus-visible, .rbv select:focus-visible { outline: 2px solid ${K.gold}; outline-offset: 2px; }
.rbv-linha:hover { background: ${K.slab2}; }
.rbv-arco { stroke-dasharray: 100; stroke-dashoffset: 100; animation: rbv-arco 1.1s cubic-bezier(.2,.7,.2,1) .15s forwards; }
@keyframes rbv-arco { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .rbv-arco { animation: none; stroke-dashoffset: 0; } }
@media (max-width: 820px) { .rbv-hero { grid-template-columns: 1fr !important; } .rbv-rank-cab, .rbv-rank-col-opc { display: none !important; } }
`;

// ═══════════════════════════════════════════════════════════════════════════
// VISÃO GERAL
// ═══════════════════════════════════════════════════════════════════════════
export function VisaoGeral({ locations, onOpen, onAdd, onImport, problemsOf, taxonomy }: {
  locations: VLoc[];
  onOpen: (id: string) => void;
  onAdd: () => void;
  onImport: () => void;
  problemsOf: (l: any) => Record<string, number>;
  taxonomy: { id: string; label: string }[];
}) {
  const [todosAlertas, setTodosAlertas] = useState(false);
  const ms = locations.map(metrica);
  const comDados = ms.filter((m) => m.avg != null && m.n > 0);

  if (!comDados.length) {
    return (
      <div className="rbv" style={{ padding: '56px 32px', maxWidth: 720 }}>
        <style>{ESTILO}</style>
        <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 500, margin: 0, color: K.text }}>{t('Reputação de Braga', 'Braga’s reputation')}</h1>
        <p style={{ fontSize: 15, color: K.mute, lineHeight: 1.6, margin: '14px 0 26px' }}>
          {t('Ainda não há locais analisados. Importa os comentários do Google Maps dos monumentos e corre a análise para ver aqui o estado da reputação do destino.', 'No places have been analysed yet. Import the Google Maps reviews of the monuments and run the analysis to see the destination’s reputation here.')}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={btn(true)} onClick={onImport}><Icon name="import" /> {t('Importar comentários', 'Import reviews')}</button>
          <button style={btn()} onClick={onAdd}><Icon name="plus" /> {t('Adicionar local', 'Add place')}</button>
        </div>
      </div>
    );
  }

  // ── Índice global (média ponderada pelo número de comentários) ──
  const comEstrelas = ms.filter((m) => m.ws);
  let gN = 0, gSum = 0, gNeg = 0, gRep = 0;
  const recG: Periodo = { n: 0, sum: 0, neg: 0, replies: 0 }, prevG: Periodo = { n: 0, sum: 0, neg: 0, replies: 0 };
  for (const m of comEstrelas) {
    const w = m.ws!;
    gN += w.n; gSum += w.avg * w.n; gNeg += (w.neg / 100) * w.n; gRep += w.replies;
    (['n', 'sum', 'neg', 'replies'] as const).forEach((k) => { recG[k] += m.rec[k]; prevG[k] += m.prev[k]; });
  }
  const indice = gN ? gSum / gN : comDados.reduce((s, m) => s + (m.avg || 0), 0) / comDados.length;
  const idxRec = mediaP(recG), idxPrev = prevG.n >= 30 ? mediaP(prevG) : null;
  const totalN = comDados.reduce((s, m) => s + m.n, 0);
  const pctNeg = gN ? (gNeg / gN) * 100 : null;
  const pctResp = gN ? (gRep / gN) * 100 : null;
  const analisados = ms.filter((m) => m.a).length;

  let frase = t('Média ponderada pelo número de comentários de cada local, nos últimos 3 anos.', 'Average weighted by each place’s number of reviews, over the last 3 years.');
  if (idxRec != null && idxPrev != null) {
    const d = idxRec - idxPrev;
    frase = Math.abs(d) < 0.03
      ? t(`Estável: ${fmt(idxPrev, 2)} estrelas há um ano, ${fmt(idxRec, 2)} nos últimos 12 meses.`, `Stable: ${fmt(idxPrev, 2)} stars a year ago, ${fmt(idxRec, 2)} over the last 12 months.`)
      : d > 0
        ? t(`A melhorar: de ${fmt(idxPrev, 2)} para ${fmt(idxRec, 2)} estrelas nos últimos 12 meses.`, `Improving: from ${fmt(idxPrev, 2)} to ${fmt(idxRec, 2)} stars over the last 12 months.`)
        : t(`A piorar: de ${fmt(idxPrev, 2)} para ${fmt(idxRec, 2)} estrelas nos últimos 12 meses.`, `Declining: from ${fmt(idxPrev, 2)} to ${fmt(idxRec, 2)} stars over the last 12 months.`);
  }

  const al = alertas(ms);
  const alVis = todosAlertas ? al : al.slice(0, 6);
  const sevCor = (s: number) => (s >= 3 ? K.bad : s === 2 ? K.warn : K.info);

  // ── Matriz "onde agir" ──
  const ns = comDados.map((m) => m.n).sort((a, b) => a - b);
  const medN = ns[Math.floor(ns.length / 2)] || 1;
  const pontos = comDados.map((m) => ({ x: Math.max(1, m.n), y: Math.round((m.avg || 0) * 100) / 100, id: m.loc.id, nome: m.loc.name, delta: m.delta }));
  const quad = (m: Metrica) => (m.n >= medN ? ((m.avg || 0) >= indice ? 'proteger' : 'corrigir') : (m.avg || 0) >= indice ? 'promover' : 'acompanhar');
  const QUADS: { id: string; titulo: string; texto: string; cor: string }[] = [
    { id: 'corrigir', titulo: t('Corrigir primeiro', 'Fix first'), texto: t('Muito visitados e abaixo da média de Braga: é aqui que cada melhoria chega a mais pessoas.', 'Highly visited and below Braga’s average: improvements here reach the most people.'), cor: K.bad },
    { id: 'proteger', titulo: t('Proteger', 'Protect'), texto: t('Muito visitados e acima da média: manter a qualidade e vigiar sinais de queda.', 'Highly visited and above average: keep quality up and watch for decline.'), cor: K.good },
    { id: 'promover', titulo: t('Dar a conhecer', 'Promote'), texto: t('Bem avaliados mas pouco comentados: potencial para promoção e circuitos.', 'Well rated but little reviewed: potential for promotion and routes.'), cor: K.gold },
    { id: 'acompanhar', titulo: t('Acompanhar', 'Monitor'), texto: t('Pouco volume e abaixo da média: acompanhar antes de investir.', 'Low volume and below average: monitor before investing.'), cor: K.mute },
  ];
  const yMin = Math.max(1, Math.floor((Math.min(...pontos.map((p) => p.y)) - 0.15) * 10) / 10);

  // ── Classificação ──
  const ranking = [...comDados].sort((a, b) => (b.avg || 0) - (a.avg || 0));

  // ── Problemas transversais ──
  const probs = taxonomy.map((p) => {
    const onde = ms.filter((m) => m.a && (problemsOf(m.loc)[p.id] || 0) > 0);
    return { ...p, onde: onde.map((m) => m.loc.name), peso: onde.reduce((s, m) => s + m.n, 0) };
  }).filter((p) => p.onde.length > 0).sort((a, b) => b.onde.length - a.onde.length || b.peso - a.peso).slice(0, 8);

  // ── Satisfação por língua ──
  const lg: Record<string, { n: number; sum: number }> = {};
  for (const m of comEstrelas) for (const l of m.ws!.langs) { if (!lg[l.code]) lg[l.code] = { n: 0, sum: 0 }; lg[l.code].n += l.n; lg[l.code].sum += l.avg * l.n; }
  const linguas = Object.entries(lg).filter(([c, v]) => c !== 'und' && v.n >= 10).map(([c, v]) => ({ c, n: v.n, avg: v.sum / v.n })).sort((a, b) => b.n - a.n).slice(0, 9);

  // ── Propostas da análise (dos locais que mais precisam) ──
  const prioridade = [...comDados].filter((m) => m.a && Array.isArray(m.a.actionableInsights) && m.a.actionableInsights.length)
    .sort((a, b) => (quad(a) === 'corrigir' ? 0 : 1) - (quad(b) === 'corrigir' ? 0 : 1) || (a.avg || 0) - (b.avg || 0)).slice(0, 4);

  return (
    <div className="rbv" style={{ padding: '36px 32px 64px', maxWidth: 1240 }}>
      <style>{ESTILO}</style>

      {/* ── Estado da reputação ── */}
      <div className="rbv-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)', gap: 40, alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 500, lineHeight: 1.05, margin: 0, color: K.text, letterSpacing: '-0.02em' }}>{t('Reputação de Braga', 'Braga’s reputation')}</h1>
          <p style={{ fontSize: 16, color: K.text, lineHeight: 1.55, margin: '16px 0 0', maxWidth: 520 }}>{frase}</p>
          <p style={{ fontSize: 13, color: K.mute, lineHeight: 1.55, margin: '8px 0 0', maxWidth: 520 }}>
            {t(`Baseado em ${fmt(totalN)} comentários do Google Maps sobre ${comDados.length} locais.`, `Based on ${fmt(totalN)} Google Maps reviews of ${comDados.length} places.`)}
            {gN < totalN && ' ' + t('Os locais sem comentários importados usam a nota da análise anterior.', 'Places without imported reviews use the previous analysis score.')}
          </p>
          <dl style={{ display: 'flex', flexWrap: 'wrap', gap: '18px 36px', margin: '28px 0 0', padding: '18px 0 0', borderTop: `1px solid ${K.line}` }}>
            {[
              [t('Comentários', 'Reviews'), fmt(totalN), t('últimos 3 anos', 'last 3 years')],
              [t('Críticas', 'Criticism'), pctNeg != null ? `${fmt(pctNeg, 1)}%` : '-', t('com 1–2 estrelas', 'with 1–2 stars')],
              [t('Respostas', 'Replies'), pctResp != null ? `${fmt(pctResp, 1)}%` : '-', t('de quem gere os locais', 'from site managers')],
              [t('Locais analisados', 'Places analysed'), `${analisados}/${locations.length}`, t('com análise de temas', 'with theme analysis')],
            ].map(([l, v, s]) => (
              <div key={l}>
                <dt style={{ fontSize: 12.5, color: K.mute }}>{l}</dt>
                <dd style={{ margin: '4px 0 0', fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: K.text, ...NUM }}>{v}</dd>
                <dd style={{ margin: 0, fontSize: 11.5, color: K.dim }}>{s}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div style={{ justifySelf: 'center', width: '100%', maxWidth: 360 }}>
          <Gauge value={indice} previous={idxPrev} />
          {idxPrev != null && (
            <p style={{ fontSize: 11.5, color: K.dim, textAlign: 'center', margin: '10px 0 0' }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', border: `1.5px dashed ${K.mute}`, verticalAlign: '-1px', marginRight: 6 }} />
              {t(`Valor de há 12 a 24 meses: ${fmt(idxPrev, 2)}`, `Value 12 to 24 months ago: ${fmt(idxPrev, 2)}`)}
            </p>
          )}
        </div>
      </div>

      {/* ── Alertas ── */}
      <Secao titulo={t('O que precisa de atenção', 'What needs attention')}
        sub={t('Sinais detetados automaticamente a partir das estrelas e das datas dos comentários, do mais grave para o menos grave.', 'Signals detected automatically from review stars and dates, most serious first.')}>
        {al.length === 0 ? (
          <p style={{ fontSize: 14, color: K.mute, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><Icon name="check" color={K.good} /> {t('Nenhum sinal de alerta nos locais monitorizados.', 'No warning signs across the monitored places.')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {alVis.map((a, i) => (
              <button key={i} onClick={() => onOpen(a.id)} className="rbv-linha"
                style={{ display: 'grid', gridTemplateColumns: '4px minmax(0, 1fr) auto', gap: 16, alignItems: 'center', textAlign: 'left', padding: '14px 12px 14px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${K.lineSoft}`, cursor: 'pointer', color: K.text }}>
                <span style={{ alignSelf: 'stretch', borderRadius: 2, background: sevCor(a.sev) }} />
                <span>
                  <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500 }}>{a.nome}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: K.mute, marginTop: 3, lineHeight: 1.5 }}>{a.texto}</span>
                </span>
                <span style={{ fontSize: 12.5, color: sevCor(a.sev), display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>{a.acao} <Icon name="arrow" size={14} /></span>
              </button>
            ))}
            {al.length > 6 && (
              <button onClick={() => setTodosAlertas((v) => !v)} style={{ ...btn(), alignSelf: 'flex-start', marginTop: 14 }}>
                {todosAlertas ? t('Mostrar só os principais', 'Show only the main ones') : t(`Ver os ${al.length} sinais`, `See all ${al.length} signals`)}
              </button>
            )}
          </div>
        )}
      </Secao>

      {/* ── Onde agir ── */}
      <Secao titulo={t('Onde agir', 'Where to act')}
        sub={t('Cada local posicionado pelo número de comentários (quantas pessoas o visitam e falam dele) e pela média de estrelas. A linha horizontal é a média de Braga.', 'Each place positioned by number of reviews (how many people visit and talk about it) and by average stars. The horizontal line is Braga’s average.')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, bottom: 26, left: 0 }}>
                <CartesianGrid stroke={K.lineSoft} />
                <XAxis type="number" dataKey="x" scale="log" domain={['auto', 'auto']} stroke={K.dim} tick={{ fontSize: 11, fill: K.mute }}
                  tickFormatter={(v: any) => fmt(Number(v))} label={{ value: t('comentários (escala logarítmica)', 'reviews (log scale)'), position: 'insideBottom', offset: -16, fill: K.dim, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" domain={[yMin, 5]} stroke={K.dim} tick={{ fontSize: 11, fill: K.mute }} tickFormatter={(v: any) => fmt(Number(v), 1)} width={40} />
                <ZAxis range={[90, 90]} />
                <ReferenceLine y={Math.round(indice * 100) / 100} stroke={K.gold} strokeDasharray="4 4" />
                <ReferenceLine x={medN} stroke={K.line} />
                <Tooltip cursor={{ stroke: K.line }} content={({ payload }: any) => {
                  const p = payload && payload[0] && payload[0].payload;
                  if (!p) return null;
                  return (
                    <div style={{ background: K.slab2, border: `1px solid ${K.line}`, borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: K.text }}>
                      <div style={{ fontFamily: SERIF, fontSize: 15, marginBottom: 4 }}>{p.nome}</div>
                      <div style={{ color: K.mute, ...NUM }}>{fmt(p.y, 2)} ★ · {fmt(p.x)} {t('comentários', 'reviews')}</div>
                    </div>
                  );
                }} />
                <Scatter data={pontos} onClick={(d: any) => { const id = d?.payload?.id ?? d?.id; if (id) onOpen(id); }}>
                  {pontos.map((p) => <Cell key={p.id} fill={p.delta != null && p.delta <= -0.15 ? K.bad : p.delta != null && p.delta >= 0.15 ? K.good : K.gold} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px 24px' }}>
            {QUADS.map((q) => {
              const lista = comDados.filter((m) => quad(m) === q.id);
              return (
                <div key={q.id} style={{ borderLeft: `2px solid ${q.cor}`, paddingLeft: 14 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 17, color: K.text }}>{q.titulo}</div>
                  <p style={{ fontSize: 12, color: K.dim, margin: '4px 0 8px', lineHeight: 1.5 }}>{q.texto}</p>
                  {lista.length ? lista.map((m) => (
                    <button key={m.loc.id} onClick={() => onOpen(m.loc.id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, width: '100%', background: 'none', border: 'none', padding: '3px 0', color: K.text, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                      <span>{m.loc.name}</span><span style={{ color: K.mute, ...NUM }}>{fmt(m.avg || 0, 2)}</span>
                    </button>
                  )) : <span style={{ fontSize: 12.5, color: K.dim }}>{t('Nenhum local.', 'No places.')}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </Secao>

      {/* ── Classificação ── */}
      <Secao titulo={t('Classificação dos locais', 'Places ranking')}
        sub={t('Ordenados pela média de estrelas dos últimos 3 anos. A tendência compara os últimos 12 meses com os 12 anteriores.', 'Sorted by average stars over the last 3 years. The trend compares the last 12 months with the previous 12.')}>
        <div className="rbv-rank-cab" style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 2.2fr) 1.4fr 0.9fr 1.1fr 0.8fr', gap: 16, fontSize: 12, color: K.dim, padding: '0 10px 10px' }}>
          <span /><span>{t('Local', 'Place')}</span><span>{t('Avaliação', 'Rating')}</span><span>{t('Comentários', 'Reviews')}</span><span>{t('Tendência', 'Trend')}</span><span>{t('Críticas', 'Criticism')}</span>
        </div>
        {ranking.map((m, i) => (
          <button key={m.loc.id} onClick={() => onOpen(m.loc.id)} className="rbv-linha"
            style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 2.2fr) 1.4fr 0.9fr 1.1fr 0.8fr', gap: 16, alignItems: 'center', width: '100%', textAlign: 'left', padding: '14px 10px', background: 'transparent', border: 'none', borderTop: `1px solid ${K.lineSoft}`, color: K.text, cursor: 'pointer', borderRadius: 6 }}>
            <span style={{ fontFamily: SERIF, fontSize: 15, color: K.dim, ...NUM }}>{i + 1}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ fontFamily: SERIF, fontSize: 17, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.loc.name}</span>
              <span style={{ fontSize: 12, color: K.dim }}>{m.basis === 'ia' ? t('nota da análise anterior', 'previous analysis score') : m.loc.category}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stars value={m.avg || 0} size={14} />
              <span style={{ fontSize: 15, fontWeight: 600, ...NUM }}>{fmt(m.avg || 0, 2)}</span>
            </span>
            <span className="rbv-rank-col-opc" style={{ fontSize: 13.5, color: K.mute, ...NUM }}>{fmt(m.n)}</span>
            <span className="rbv-rank-col-opc" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Spark values={m.quarters} w={70} h={22} color={m.delta != null && m.delta <= -0.15 ? K.bad : K.gold} />
              <Tendencia delta={m.delta} />
            </span>
            <span className="rbv-rank-col-opc" style={{ fontSize: 13.5, color: m.neg != null && m.neg >= 10 ? K.bad : K.mute, ...NUM }}>{m.neg != null ? `${fmt(m.neg, 1)}%` : '-'}</span>
          </button>
        ))}
      </Secao>

      {/* ── Problemas e mercados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0 48px' }}>
        <Secao titulo={t('Problemas que se repetem', 'Recurring issues')}
          sub={t('Temas de crítica que aparecem em vários locais: sinais de problemas do destino, não de um só monumento.', 'Criticism themes that appear across several places: destination-level issues, not a single monument.')}>
          {probs.length === 0 ? <p style={{ fontSize: 13, color: K.dim, margin: 0 }}>{t('Sem problemas comuns detetados nas análises.', 'No common issues detected in the analyses.')}</p> : probs.map((p) => (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: `1px solid ${K.lineSoft}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, color: K.text }}>{p.label}</span>
                <span style={{ fontSize: 12.5, color: K.mute, ...NUM }}>{t(`${p.onde.length} de ${analisados} locais`, `${p.onde.length} of ${analisados} places`)}</span>
              </div>
              <div style={{ height: 4, background: K.lineSoft, borderRadius: 2, margin: '7px 0 6px', overflow: 'hidden' }}>
                <div style={{ width: `${(p.onde.length / Math.max(1, analisados)) * 100}%`, height: '100%', background: K.warn }} />
              </div>
              <div style={{ fontSize: 12, color: K.dim, lineHeight: 1.5 }}>{p.onde.join(', ')}</div>
            </div>
          ))}
        </Secao>

        <Secao titulo={t('Satisfação por língua', 'Satisfaction by language')}
          sub={t('Média de estrelas de quem escreve em cada língua. Uma língua abaixo da média aponta para falhas de informação, sinalética ou acolhimento para esse mercado.', 'Average stars by review language. A language below average points to gaps in information, signage or welcome for that market.')}>
          {linguas.length === 0 ? <p style={{ fontSize: 13, color: K.dim, margin: 0 }}>{t('Importa comentários para ver este indicador.', 'Import reviews to see this indicator.')}</p> : linguas.map((l) => {
            const dif = l.avg - indice;
            return (
              <div key={l.c} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 14, alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${K.lineSoft}` }}>
                <span style={{ fontSize: 14, color: K.text }}>{langName(l.c)} <span style={{ fontSize: 12, color: K.dim, ...NUM }}>· {fmt((l.n / Math.max(1, gN)) * 100, 0)}%</span></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Stars value={l.avg} size={12} gap={1} /><span style={{ fontSize: 13.5, fontWeight: 600, ...NUM }}>{fmt(l.avg, 2)}</span></span>
                <span style={{ fontSize: 12, width: 52, textAlign: 'right', color: dif <= -0.1 ? K.bad : dif >= 0.1 ? K.good : K.dim, ...NUM }}>{sinal(dif)}</span>
              </div>
            );
          })}
        </Secao>
      </div>

      {/* ── Propostas ── */}
      {prioridade.length > 0 && (
        <Secao titulo={t('Propostas de ação', 'Proposed actions')}
          sub={t('Sugestões da análise de temas para os locais onde agir tem mais impacto. Confirmar sempre antes de avançar.', 'Suggestions from the theme analysis for the places where action has the most impact. Always verify before acting.')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {prioridade.map((m) => (
              <div key={m.loc.id}>
                <button onClick={() => onOpen(m.loc.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: K.text, fontFamily: SERIF, fontSize: 18, textAlign: 'left', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {m.loc.name} <Icon name="arrow" size={14} color={K.gold} />
                </button>
                <ol style={{ margin: '10px 0 0', paddingLeft: 18, color: K.mute, fontSize: 13.5, lineHeight: 1.6 }}>
                  {(m.a.actionableInsights as string[]).slice(0, 3).map((x, i) => <li key={i} style={{ marginBottom: 6 }}>{x}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAIS - dossiês com a análise sempre visível
// ═══════════════════════════════════════════════════════════════════════════
export function LocaisView(props: {
  locations: VLoc[];
  analyzing: string | null;
  batchRun: { i: number; total: number; name: string } | null;
  copiedLinkId: string | null;
  onOpen: (id: string) => void;
  onAnalyze: (id: string) => void;
  onAnalyzeAll: () => void;
  onImport: () => void;
  onPaste: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  catLabel: (c: string) => string;
}) {
  const { locations, analyzing, batchRun, copiedLinkId } = props;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [ordem, setOrdem] = useState<'avaliacao' | 'volume' | 'tendencia' | 'nome'>('avaliacao');

  const cats = Array.from(new Set(locations.map((l) => l.category))).sort();
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let ms = locations.map(metrica).filter((m) => (!cat || m.loc.category === cat) && (!q || norm(m.loc.name).includes(norm(q))));
  ms = ms.sort((a, b) => {
    if (ordem === 'nome') return a.loc.name.localeCompare(b.loc.name, 'pt');
    if (ordem === 'volume') return b.n - a.n;
    if (ordem === 'tendencia') return (a.delta ?? 99) - (b.delta ?? 99);
    return (b.avg ?? -1) - (a.avg ?? -1);
  });
  const temImportados = locations.some((l) => l.reviewStats);
  const ocupado = !!analyzing || !!batchRun;

  return (
    <div className="rbv" style={{ padding: '36px 32px 64px', maxWidth: 1240 }}>
      <style>{ESTILO}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 500, margin: 0, color: K.text, letterSpacing: '-0.02em' }}>{t('Locais monitorizados', 'Monitored places')}</h1>
          <p style={{ fontSize: 14, color: K.mute, margin: '10px 0 0' }}>{t(`${locations.length} locais · a análise completa abre ao clicar no nome`, `${locations.length} places · the full analysis opens when you click the name`)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn()} onClick={props.onImport}><Icon name="import" /> {t('Importar comentários', 'Import reviews')}</button>
          <button style={btn(false, ocupado || !temImportados)} disabled={ocupado || !temImportados} onClick={props.onAnalyzeAll}><Icon name="spark" /> {t('Analisar todos', 'Analyse all')}</button>
          <button style={btn(true)} onClick={props.onAdd}><Icon name="plus" /> {t('Adicionar local', 'Add place')}</button>
        </div>
      </div>

      {batchRun && (
        <div style={{ marginTop: 20, padding: '12px 16px', borderLeft: `2px solid ${K.gold}`, background: K.goldBg, fontSize: 13.5, color: K.text, borderRadius: '0 8px 8px 0' }}>
          {t('A analisar', 'Analysing')} {batchRun.i} {t('de', 'of')} {batchRun.total}: <strong>{batchRun.name}</strong>. {t('Mantém esta página aberta até ao fim.', 'Keep this page open until it finishes.')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '26px 0 8px' }}>
        <label style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: K.dim }}><Icon name="search" size={15} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Pesquisar local', 'Search place')} aria-label={t('Pesquisar local', 'Search place')}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: 8, border: `1px solid ${K.line}`, background: K.slab, color: K.text, fontSize: 13.5 }} />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t('Categoria', 'Category')}
          style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${K.line}`, background: K.slab, color: K.text, fontSize: 13.5 }}>
          <option value="">{t('Todas as categorias', 'All categories')}</option>
          {cats.map((c) => <option key={c} value={c}>{props.catLabel(c)}</option>)}
        </select>
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as any)} aria-label={t('Ordenar', 'Sort')}
          style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${K.line}`, background: K.slab, color: K.text, fontSize: 13.5 }}>
          <option value="avaliacao">{t('Melhor avaliação', 'Best rated')}</option>
          <option value="volume">{t('Mais comentários', 'Most reviews')}</option>
          <option value="tendencia">{t('Maior queda primeiro', 'Biggest drop first')}</option>
          <option value="nome">{t('Nome', 'Name')}</option>
        </select>
      </div>

      {locations.length === 0 && (
        <p style={{ fontSize: 14, color: K.mute, marginTop: 30 }}>{t('Ainda não há locais. Adiciona o primeiro ou importa um ficheiro de comentários, que cria os locais automaticamente.', 'No places yet. Add the first one or import a reviews file, which creates the places automatically.')}</p>
      )}
      {locations.length > 0 && ms.length === 0 && <p style={{ fontSize: 14, color: K.mute, marginTop: 30 }}>{t('Nenhum local corresponde à pesquisa.', 'No place matches the search.')}</p>}

      <div>
        {ms.map((m) => {
          const l = m.loc, a = m.a;
          const nRev = m.ws ? m.ws.n : l.reviews.length;
          const aAnalisar = analyzing === l.id;
          const fortes: string[] = a ? (a.keyPraises?.length ? a.keyPraises : a.topThemesPositive || []).slice(0, 3) : [];
          const fracos: string[] = a ? ((a.issuesRecent?.length ? a.issuesRecent : a.keyIssues?.length ? a.keyIssues : a.topThemesNegative) || []).slice(0, 3) : [];
          return (
            <article key={l.id} style={{ padding: '28px 0', borderTop: `1px solid ${K.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0, flex: '1 1 420px' }}>
                  <div style={{ fontSize: 12.5, color: K.dim }}>{props.catLabel(l.category)}</div>
                  <button onClick={() => props.onOpen(l.id)} style={{ background: 'none', border: 'none', padding: 0, margin: '4px 0 0', cursor: 'pointer', textAlign: 'left', color: K.text, fontFamily: SERIF, fontSize: 28, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                    {l.name}
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                    {m.avg != null ? (
                      <>
                        <Stars value={m.avg} size={22} gap={3} />
                        <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: K.text, lineHeight: 1, ...NUM }}>{fmt(m.avg, 2)}</span>
                        <span style={{ fontSize: 13, color: K.mute, ...NUM }}>
                          {fmt(nRev)} {t('comentários', 'reviews')}{m.ws ? ` ${t('nos últimos 3 anos', 'in the last 3 years')}` : ''}
                          {m.basis === 'ia' && ` · ${t('nota estimada pela análise anterior', 'score estimated by the previous analysis')}`}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 13.5, color: K.mute }}>
                        {nRev > 0 ? t(`${fmt(nRev)} comentários por analisar`, `${fmt(nRev)} reviews to analyse`) : t('Sem comentários. Importa-os do Google Maps.', 'No reviews. Import them from Google Maps.')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {a ? (
                    <button style={btn(true)} onClick={() => props.onOpen(l.id)}>{t('Abrir análise', 'Open analysis')} <Icon name="arrow" size={15} /></button>
                  ) : nRev > 0 ? (
                    <button style={btn(true, ocupado)} disabled={ocupado} onClick={() => props.onAnalyze(l.id)}><Icon name="spark" /> {aAnalisar ? t('A analisar…', 'Analysing…') : t('Analisar', 'Analyse')}</button>
                  ) : (
                    <button style={btn(true)} onClick={props.onImport}><Icon name="import" /> {t('Importar comentários', 'Import reviews')}</button>
                  )}
                </div>
              </div>

              {a && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px 36px', marginTop: 22 }}>
                  <div>
                    {a.summaryPT && <p style={{ fontSize: 14, color: K.text, lineHeight: 1.65, margin: '0 0 16px', maxWidth: 520 }}>{a.summaryPT}</p>}
                    <BarraSentimento a={a} ws={m.ws} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 14, fontSize: 12.5, color: K.mute }}>
                      {m.quarters.length > 1 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Spark values={m.quarters} color={m.delta != null && m.delta <= -0.15 ? K.bad : K.gold} /><Tendencia delta={m.delta} /></span>}
                      {m.resp != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="reply" size={14} /> {fmt(m.resp, 1)}% {t('com resposta', 'replied')}</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: K.good, marginBottom: 8 }}>{t('Pontos fortes', 'Strengths')}</div>
                    {fortes.length ? fortes.map((x, i) => <p key={i} style={{ fontSize: 13.5, color: K.text, lineHeight: 1.55, margin: '0 0 8px', paddingLeft: 12, borderLeft: `1px solid ${K.line}` }}>{x}</p>) : <p style={{ fontSize: 13, color: K.dim, margin: 0 }}>-</p>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: K.bad, marginBottom: 8 }}>{a.issuesRecent?.length ? t('Problemas nos últimos 12 meses', 'Issues in the last 12 months') : t('Problemas', 'Issues')}</div>
                    {fracos.length ? fracos.map((x, i) => <p key={i} style={{ fontSize: 13.5, color: K.text, lineHeight: 1.55, margin: '0 0 8px', paddingLeft: 12, borderLeft: `1px solid ${K.line}` }}>{x}</p>) : <p style={{ fontSize: 13, color: K.dim, margin: 0 }}>-</p>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
                <span style={{ fontSize: 12, color: K.dim }}>
                  {l.lastAnalyzed ? t(`Analisado a ${new Date(l.lastAnalyzed).toLocaleDateString('pt-PT')}`, `Analysed on ${new Date(l.lastAnalyzed).toLocaleDateString('en-GB')}`) : t('Ainda não analisado', 'Not analysed yet')}
                  {m.stale && <span style={{ color: K.warn }}> · {t('há comentários novos por analisar', 'new reviews waiting for analysis')}</span>}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {nRev > 0 && a && (
                    <button style={iconBtn} disabled={ocupado} onClick={() => props.onAnalyze(l.id)} title={t('Reanalisar', 'Re-analyse')} aria-label={t('Reanalisar', 'Re-analyse')}>
                      <Icon name="spark" size={15} color={aAnalisar ? K.gold : undefined} />
                    </button>
                  )}
                  <button style={iconBtn} onClick={() => props.onPaste(l.id)} title={t('Colar comentários à mão', 'Paste reviews manually')} aria-label={t('Colar comentários à mão', 'Paste reviews manually')}><Icon name="paste" size={15} /></button>
                  {a && (
                    <button style={{ ...iconBtn, color: copiedLinkId === l.id ? K.good : K.mute }} onClick={() => props.onShare(l.id)} title={t('Copiar link partilhável', 'Copy shareable link')} aria-label={t('Copiar link partilhável', 'Copy shareable link')}>
                      <Icon name={copiedLinkId === l.id ? 'check' : 'link'} size={15} />
                    </button>
                  )}
                  <button style={iconBtn} onClick={() => props.onEdit(l.id)} title={t('Editar', 'Edit')} aria-label={t('Editar', 'Edit')}><Icon name="edit" size={15} /></button>
                  <button style={iconBtn} onClick={() => { if (window.confirm(t(`Apagar "${l.name}" e todos os seus comentários?`, `Delete "${l.name}" and all its reviews?`))) props.onDelete(l.id); }} title={t('Apagar', 'Delete')} aria-label={t('Apagar', 'Delete')}><Icon name="trash" size={15} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
