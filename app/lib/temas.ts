// ═══════════════════════════════════════════════════════════════════════════
// LÓGICA DA REPUTAÇÃO (Visão Geral e Locais)
// • Números: uma só fonte (reviewStats) — o topo, os rankings e o texto da IA
//   usam todos os mesmos valores.
// • Temas fixos: cada comentário com texto é classificado pela IA em 0–3 temas
//   com polaridade (+ elogio / − crítica). O ESTADO de cada tema é calculado
//   aqui, comparando os últimos 12 meses com os 12–36 meses anteriores.
// • Robustez: abaixo de 30 comentários → "Dados insuficientes" e fora dos rankings.
// ═══════════════════════════════════════════════════════════════════════════

import { windowStats, type ReviewStats, type StoredReview } from './reviews';
import { t } from './i18n';

export const MIN_ROBUSTO = 30;

export const TEMAS: { id: string; pt: string; en: string; desc: string }[] = [
  { id: 'paisagem', pt: 'Paisagem e património', en: 'Landscape and heritage', desc: 'beleza, vistas, arquitetura, valor histórico ou religioso, jardins' },
  { id: 'acesso', pt: 'Acesso e estacionamento', en: 'Access and parking', desc: 'chegar ao local, estacionamento, transportes, trânsito' },
  { id: 'sinalizacao', pt: 'Informação e sinalização', en: 'Information and signage', desc: 'placas, orientação no local, painéis, horários pouco claros' },
  { id: 'fluxos', pt: 'Gestão de fluxos', en: 'Visitor flow management', desc: 'filas, lotação, tempos de espera, multidões' },
  { id: 'acessibilidade', pt: 'Acessibilidade', en: 'Accessibility', desc: 'mobilidade reduzida, escadas, rampas, cadeiras de rodas, carrinhos de bebé' },
  { id: 'servicos', pt: 'Serviços e equipamentos', en: 'Services and facilities', desc: 'WC, cafetaria, loja, bancos, sombras, funcionamento de equipamentos' },
  { id: 'multilingue', pt: 'Informação multilingue', en: 'Multilingual information', desc: 'informação ou atendimento noutras línguas' },
  { id: 'atendimento', pt: 'Atendimento', en: 'Staff and service', desc: 'simpatia, disponibilidade e conhecimento do pessoal' },
  { id: 'preco', pt: 'Preço e valor', en: 'Price and value', desc: 'preço de bilhetes, relação qualidade/preço, gratuitidade' },
  { id: 'limpeza', pt: 'Limpeza e conservação', en: 'Cleanliness and upkeep', desc: 'limpeza, manutenção, estado de conservação' },
];
export const temaNome = (id: string) => { const x = TEMAS.find((y) => y.id === id); return x ? t(x.pt, x.en) : id; };
const TAG_RE = new RegExp(`^(${TEMAS.map((x) => x.id).join('|')})([+-])$`);
export const tagValida = (s: string) => TAG_RE.test(s);

export type Estado = 'forte' | 'persistente' | 'novo' | 'deixou';
export const estadoNome = (e: Estado) => ({
  forte: t('Ponto forte', 'Strength'),
  persistente: t('Persistente', 'Persistent'),
  novo: t('Novo', 'New'),
  deixou: t('Deixou de ser referido', 'No longer mentioned'),
})[e];

export interface TemaStat { id: string; recPos: number; recNeg: number; prevPos: number; prevNeg: number; estado: Estado | null }

// ─── Números (fonte única) ──────────────────────────────────────────────────
export interface Numeros {
  n: number; avg: number; idx: number; pos: number; neg: number; resp: number | null;
  semTexto: number; textN: number; from: string; to: string;
  robustez: 'alta' | 'media' | 'insuficiente'; basis: 'estrelas' | 'ia';
}
export interface LocMin { id: string; name: string; category: string; reviews: unknown[]; analysis: any | null; reviewStats?: ReviewStats; lastAnalyzed?: string | null }

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function numeros(loc: LocMin): Numeros | null {
  const ws = windowStats(loc.reviewStats);
  if (ws) {
    const semT = ws.langs.find((l) => l.code === 'none');
    const n = ws.n;
    return {
      n, avg: r2(ws.avg), idx: r1(ws.avg * 2), pos: ws.pos, neg: ws.neg, resp: ws.respRate,
      semTexto: semT ? r1((semT.n / n) * 100) : 0, textN: n - (semT ? semT.n : 0), from: ws.from, to: ws.to,
      robustez: n >= 100 ? 'alta' : n >= MIN_ROBUSTO ? 'media' : 'insuficiente', basis: 'estrelas',
    };
  }
  const a = loc.analysis;
  if (!a || !a.sentimentScore) return null;
  const n = a.reviewCount || loc.reviews.length || 0;
  return {
    n, avg: r2(a.sentimentScore / 2), idx: r1(a.sentimentScore), pos: a.sentimentBreakdown?.positive ?? 0, neg: a.sentimentBreakdown?.negative ?? 0,
    resp: null, semTexto: 0, textN: n, from: '', to: '',
    robustez: n >= 100 ? 'alta' : n >= MIN_ROBUSTO ? 'media' : 'insuficiente', basis: 'ia',
  };
}


// ─── Índice do destino (fonte única: Visão Geral, barra lateral, Observatório, relatório) ───
// Média de estrelas ponderada pelo n.º de avaliações, só com locais com dados suficientes.
export function indiceDestino(locs: LocMin[]): { idx: number; avg: number; n: number; locais: number } | null {
  const rob = locs.map((l) => numeros(l)).filter((x): x is Numeros => !!x && x.robustez !== 'insuficiente');
  const n = rob.reduce((s, x) => s + x.n, 0);
  if (!n) return null;
  const avg = rob.reduce((s, x) => s + x.avg * x.n, 0) / n;
  return { idx: Math.round(avg * 20) / 10, avg: Math.round(avg * 100) / 100, n, locais: rob.length };
}

export function ranking(locs: LocMin[]): { id: string; name: string; n: number; idx: number }[] {
  return locs.map((l) => ({ l, x: numeros(l) }))
    .filter((o) => o.x && o.x.robustez !== 'insuficiente')
    .map((o) => ({ id: o.l.id, name: o.l.name, n: o.x!.n, idx: o.x!.idx }))
    .sort((a, b) => b.idx - a.idx || b.n - a.n);
}

// ─── Temas: estado calculado a partir das classificações dos comentários ────
export function temaStats(reviews: StoredReview[], now = new Date()): { temas: TemaStat[]; textRec: number; textPrev: number } {
  const y1 = new Date(now); y1.setFullYear(y1.getFullYear() - 1);
  const c1 = y1.toISOString();
  const base: Record<string, TemaStat> = {};
  TEMAS.forEach((x) => { base[x.id] = { id: x.id, recPos: 0, recNeg: 0, prevPos: 0, prevNeg: 0, estado: null }; });
  let textRec = 0, textPrev = 0;
  for (const r of reviews) {
    if (!r.t || !r.t.trim()) continue;
    const rec = r.d >= c1;
    if (rec) textRec++; else textPrev++;
    for (const tg of r.tg || []) {
      const m = tg.match(TAG_RE);
      if (!m) continue;
      const s = base[m[1]];
      if (m[2] === '+') { if (rec) s.recPos++; else s.prevPos++; } else { if (rec) s.recNeg++; else s.prevNeg++; }
    }
  }
  const thr = (n: number) => Math.max(2, Math.ceil(n * 0.02));
  const tR = thr(textRec), tP = thr(textPrev), tT = Math.max(3, Math.ceil((textRec + textPrev) * 0.04));
  const temas = Object.values(base).map((s) => {
    const nr = s.recNeg >= tR, np = s.prevNeg >= tP;
    s.estado = nr && np ? 'persistente' : nr ? 'novo' : np ? 'deixou' : s.recPos + s.prevPos >= tT ? 'forte' : null;
    return s;
  });
  return { temas, textRec, textPrev };
}

// Excertos para a IA descrever cada tema
export function excertos(reviews: StoredReview[], id: string, sinal: '+' | '-', max = 3): string[] {
  return reviews.filter((r) => r.t && (r.tg || []).includes(id + sinal)).slice(0, max).map((r) => r.t.replace(/\s+/g, ' ').slice(0, 170));
}

// ─── Alerta face ao trimestre anterior ──────────────────────────────────────
export function alerta(st?: ReviewStats | null): string | null {
  const ws = windowStats(st);
  if (!ws) return null;
  const q = ws.quarters.filter((x) => x.n >= 5);
  if (q.length < 2) return null;
  const a = q[q.length - 2], b = q[q.length - 1];
  const nomeQ = (s: string) => { const [y, tq] = s.split('-T'); return t(`${tq}.º trimestre de ${y}`, `Q${tq} ${y}`); };
  const f1 = (x: number) => x.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const f2 = (x: number) => x.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (a.negPct === 0 && b.negPct > 0) {
    let k = 0;
    for (let i = q.length - 2; i >= 0 && q[i].negPct === 0; i--) k++;
    return t(`Comentários negativos passaram de 0% para ${f1(b.negPct)}% no ${nomeQ(b.q)}${k >= 2 ? `, após ${k} trimestres sem nenhum` : ''}.`,
      `Negative reviews went from 0% to ${f1(b.negPct)}% in ${nomeQ(b.q)}${k >= 2 ? `, after ${k} quarters with none` : ''}.`);
  }
  if (a.avg - b.avg >= 0.15) return t(`A média desceu de ${f2(a.avg)} para ${f2(b.avg)} estrelas no ${nomeQ(b.q)}.`, `The average fell from ${f2(a.avg)} to ${f2(b.avg)} stars in ${nomeQ(b.q)}.`);
  if (b.negPct - a.negPct >= 3) return t(`Comentários negativos subiram de ${f1(a.negPct)}% para ${f1(b.negPct)}% no ${nomeQ(b.q)}.`, `Negative reviews rose from ${f1(a.negPct)}% to ${f1(b.negPct)}% in ${nomeQ(b.q)}.`);
  return null;
}

// ─── Consistência dos números no texto da IA ────────────────────────────────
export function numerosPermitidos(x: Numeros, extra: number[] = []): number[] {
  return [x.n, x.avg, x.idx, x.pos, x.neg, x.resp ?? -1, x.semTexto, x.textN, 100 - x.semTexto, ...extra].filter((v) => v >= 0);
}
/** true se todos os números do texto estiverem na lista (anos e contagens pequenas são tolerados). */
export function numerosCoerentes(texto: string, permitidos: number[]): boolean {
  const achados = texto.match(/\d+(?:[.,]\d+)?/g) || [];
  return achados.every((s) => {
    const v = Number(s.replace(',', '.'));
    if (Number.isInteger(v) && (v <= 12 || (v >= 2015 && v <= 2035))) return true;
    return permitidos.some((p) => Math.abs(p - v) < 0.051);
  });
}

// Texto-modelo, usado quando a IA não devolve texto coerente ou a análise está desatualizada
export function resumoModelo(nome: string, x: Numeros): string {
  const f = (v: number, d: number) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
  return [
    t(`Nos últimos três anos, ${nome} recebeu **${f(x.n, 0)} avaliações** no Google, com média de **${f(x.avg, 2)} estrelas**.`,
      `Over the last three years, ${nome} received **${f(x.n, 0)} reviews** on Google, averaging **${f(x.avg, 2)} stars**.`),
    t(`**${f(x.pos, 1)}%** são positivas e **${f(x.neg, 1)}%** negativas.`, `**${f(x.pos, 1)}%** are positive and **${f(x.neg, 1)}%** negative.`),
  ].join(' ');
}
