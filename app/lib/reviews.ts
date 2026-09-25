// ═══════════════════════════════════════════════════════════════════════════
// COMENTÁRIOS DO GOOGLE MAPS — importação, armazenamento e estatísticas
//
// • Importa ficheiros exportados (JSON ou CSV) de serviços como o Apify
//   ("Google Maps Reviews Scraper"): texto, estrelas, data exata, língua e
//   resposta do proprietário. Os nomes dos autores NUNCA são lidos nem guardados.
// • Só ficam comentários com menos de 3 anos (janela móvel: os mais antigos
//   são removidos automaticamente a cada nova importação).
// • Sem duplicados: cada comentário tem um identificador único.
// • Armazenamento: locations/{id}/reviewMonths/{AAAA-MM} — um documento por mês,
//   para nunca ultrapassar o limite de 1 MB por documento do Firestore.
// • O documento do local guarda só as estatísticas mensais (reviewStats).
// ═══════════════════════════════════════════════════════════════════════════

import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { t } from './i18n';

export const WINDOW_YEARS = 3;
const MAX_TEXT = 1500;

export interface StoredReview { id: string; d: string; s: number; l: string; t: string; r?: number }
export interface MonthStat { n: number; sum: number; dist: number[]; langs: Record<string, number[]>; replies: number }
export interface ReviewStats { byMonth: Record<string, MonthStat>; placeId: string; placeTitle: string; lastImport: string; source: string }

export interface ParsedReview extends StoredReview { placeKey: string; placeTitle: string }
export interface ImportGroup {
  key: string; title: string; reviews: ParsedReview[];
  inWindow: number; outWindow: number; from: string; to: string; avg: number;
}

export function cutoffDate(now = new Date()): Date {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - WINDOW_YEARS);
  return d;
}

// ─── Línguas ────────────────────────────────────────────────────────────────
const LANG_PT: Record<string, string> = {
  pt: 'Português', es: 'Espanhol', en: 'Inglês', fr: 'Francês', de: 'Alemão', it: 'Italiano', nl: 'Neerlandês',
  pl: 'Polaco', ru: 'Russo', uk: 'Ucraniano', zh: 'Chinês', ja: 'Japonês', ko: 'Coreano', ca: 'Catalão', gl: 'Galego',
  sv: 'Sueco', da: 'Dinamarquês', no: 'Norueguês', fi: 'Finlandês', cs: 'Checo', ro: 'Romeno', hu: 'Húngaro',
  tr: 'Turco', ar: 'Árabe', he: 'Hebraico', el: 'Grego', und: 'Indeterminado',
};
const LANG_EN: Record<string, string> = {
  pt: 'Portuguese', es: 'Spanish', en: 'English', fr: 'French', de: 'German', it: 'Italian', nl: 'Dutch',
  pl: 'Polish', ru: 'Russian', uk: 'Ukrainian', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ca: 'Catalan', gl: 'Galician',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian',
  tr: 'Turkish', ar: 'Arabic', he: 'Hebrew', el: 'Greek', und: 'Undetermined',
};
export const langName = (code: string) => t(LANG_PT[code] ?? code.toUpperCase(), LANG_EN[code] ?? code.toUpperCase());
export const langNamePT = (code: string) => LANG_PT[code] ?? code.toUpperCase();

// Deteção simples (só usada quando o ficheiro não indica a língua)
const STOP: Record<string, string[]> = {
  pt: ['não', 'muito', 'uma', 'com', 'também', 'são', 'está', 'você', 'vale', 'pena', 'lindo', 'fomos', 'bem'],
  es: ['muy', 'pero', 'también', 'hay', 'merece', 'precioso', 'bonito', 'fuimos', 'bien', 'sitio', 'esta'],
  en: ['the', 'and', 'very', 'was', 'with', 'worth', 'beautiful', 'is', 'of', 'great', 'you'],
  fr: ['le', 'la', 'les', 'très', 'est', 'une', 'avec', 'pour', 'vaut', 'magnifique', 'nous'],
  de: ['der', 'die', 'und', 'sehr', 'ist', 'mit', 'ein', 'schön', 'nicht', 'wir', 'auch'],
  it: ['il', 'molto', 'della', 'bellissimo', 'che', 'non', 'sono', 'anche', 'questo'],
  nl: ['het', 'een', 'zeer', 'mooi', 'niet', 'van', 'wij', 'ook', 'erg'],
};
export function detectLang(text: string): string {
  const s = ` ${text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ')} `;
  const score: Record<string, number> = {};
  for (const [l, words] of Object.entries(STOP)) score[l] = words.reduce((a, w) => a + (s.includes(` ${w} `) ? 1 : 0), 0);
  if (/[ãõç]/.test(text)) score.pt += 2;
  if (/[ñ¿¡]/.test(text)) score.es += 2;
  if (/[äöüß]/.test(text)) score.de += 2;
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : 'und';
}

// ─── Leitura de ficheiros ───────────────────────────────────────────────────
function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  const s = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sep = (s.split('\n')[0].match(/;/g) || []).length > (s.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function flatten(o: any, prefix = '', out: Record<string, any> = {}): Record<string, any> {
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) flatten(v, prefix ? `${prefix}/${k}` : k, out);
  } else out[prefix.toLowerCase()] = o;
  return out;
}

function pick(o: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  // colunas aninhadas exportadas como "pai/filho" ou "pai.filho"
  for (const k of keys) {
    const hit = Object.keys(o).find((x) => (x.endsWith(`/${k}`) || x.endsWith(`.${k}`)) && o[x] !== undefined && o[x] !== null && String(o[x]).trim() !== '');
    if (hit) return o[hit];
  }
  return undefined;
}

const K = {
  text: ['text', 'reviewtext', 'review_text', 'review', 'content', 'comment', 'snippet', 'texto'],
  stars: ['stars', 'rating', 'reviewrating', 'review_rating', 'score', 'estrelas'],
  date: ['publishedatdate', 'published_at_date', 'publishedat', 'publishedattimestamp', 'publisheddate', 'reviewdate', 'review_date', 'iso_date', 'datetime', 'date', 'published_at', 'data'],
  id: ['reviewid', 'review_id', 'reviewurl', 'review_url', 'reviewlink', 'id'],
  lang: ['originallanguage', 'original_language', 'language', 'reviewlanguage', 'lang', 'idioma'],
  reply: ['responsefromownertext', 'response_from_owner_text', 'ownerresponse', 'owner_response', 'responsefromowner', 'reply', 'resposta'],
  placeKey: ['placeid', 'place_id', 'placefeatureid', 'googleplaceid', 'cid', 'fid'],
  placeTitle: ['title', 'placename', 'place_name', 'placetitle', 'businessname', 'locationname', 'place'],
};

function toDate(v: any): Date | null {
  if (v == null) return null;
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v);
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(36);
}

export function parseReviewFile(text: string): { reviews: ParsedReview[]; skipped: number } {
  let objs: Record<string, any>[] = [];
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const j = JSON.parse(trimmed);
      const arr = Array.isArray(j) ? j : j.items || j.data || j.reviews || j.results || [];
      objs = (arr as any[]).map((o) => flatten(o));
    } catch {
      // JSON Lines (um objeto por linha)
      objs = trimmed.split('\n').filter((l) => l.trim().startsWith('{')).map((l) => { try { return flatten(JSON.parse(l)); } catch { return {}; } });
    }
  } else {
    const rows = parseCSVRows(trimmed);
    const hdr = (rows[0] || []).map((h) => h.trim().toLowerCase());
    objs = rows.slice(1).map((r) => Object.fromEntries(hdr.map((h, i) => [h, r[i]])));
  }

  const reviews: ParsedReview[] = [];
  let skipped = 0;
  for (const o of objs) {
    const date = toDate(pick(o, K.date));
    let stars = Number(String(pick(o, K.stars) ?? '').replace(',', '.'));
    if (stars > 5 && stars <= 10) stars = stars / 2;
    if (!date || !(stars >= 1 && stars <= 5)) { skipped++; continue; }
    const txt = String(pick(o, K.text) ?? '').trim().slice(0, MAX_TEXT);
    const placeKey = String(pick(o, K.placeKey) ?? '').trim();
    const placeTitle = String(pick(o, K.placeTitle) ?? '').trim();
    const rawLang = String(pick(o, K.lang) ?? '').trim().toLowerCase().slice(0, 2);
    const lang = /^[a-z]{2}$/.test(rawLang) ? rawLang : txt ? detectLang(txt) : 'und';
    const d = date.toISOString();
    const rid = String(pick(o, K.id) ?? '').trim() || hash(`${placeKey || placeTitle}|${d}|${stars}|${txt.slice(0, 80)}`);
    const rev: ParsedReview = { id: rid.slice(0, 180), d, s: Math.round(stars), l: lang, t: txt, placeKey, placeTitle };
    if (pick(o, K.reply)) rev.r = 1;
    reviews.push(rev);
  }
  return { reviews, skipped };
}

export function groupByPlace(reviews: ParsedReview[], now = new Date()): ImportGroup[] {
  const cut = cutoffDate(now).toISOString();
  const m = new Map<string, ImportGroup>();
  for (const r of reviews) {
    const key = r.placeKey || r.placeTitle || '—';
    let g = m.get(key);
    if (!g) { g = { key, title: r.placeTitle || t('(local sem nome no ficheiro)', '(place without a name in the file)'), reviews: [], inWindow: 0, outWindow: 0, from: r.d, to: r.d, avg: 0 }; m.set(key, g); }
    g.reviews.push(r);
    if (r.d >= cut) g.inWindow++; else g.outWindow++;
  }
  for (const g of Array.from(m.values())) {
    const inW = g.reviews.filter((r) => r.d >= cut);
    const base = inW.length ? inW : g.reviews;
    g.from = base.reduce((a, r) => (r.d < a ? r.d : a), base[0].d);
    g.to = base.reduce((a, r) => (r.d > a ? r.d : a), base[0].d);
    g.avg = Math.round((base.reduce((a, r) => a + r.s, 0) / base.length) * 100) / 100;
  }
  return Array.from(m.values()).sort((a, b) => b.reviews.length - a.reviews.length);
}

// Sugere o local da app correspondente (1.º pelo placeId já guardado, depois pelo nome)
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
const STOPW = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a', 'the', 'of', 'braga', 'em']);
const tokens = (s: string) => new Set(norm(s).split(/\s+/).filter((w) => w.length > 1 && !STOPW.has(w)));
export function suggestMatch(g: ImportGroup, locs: { id: string; name: string; reviewStats?: ReviewStats }[]): string {
  const byId = locs.find((l) => l.reviewStats?.placeId && l.reviewStats.placeId === g.key);
  if (byId) return byId.id;
  const a = tokens(g.title);
  let best = '', bestScore = 0;
  for (const l of locs) {
    const b = tokens(l.name);
    const inter = Array.from(a).filter((x) => b.has(x)).length;
    const score = inter / Math.max(1, Math.min(a.size, b.size));
    if (score > bestScore) { bestScore = score; best = l.id; }
  }
  return bestScore >= 0.5 ? best : '';
}

// ─── Firestore ──────────────────────────────────────────────────────────────
const monthsCol = (locId: string) => collection(db, 'locations', locId, 'reviewMonths');

async function readMonths(locId: string): Promise<Record<string, StoredReview[]>> {
  const snap = await getDocs(monthsCol(locId));
  const out: Record<string, StoredReview[]> = {};
  snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => { out[d.id] = ((d.data() as any).items || []) as StoredReview[]; });
  return out;
}

export function buildStats(months: Record<string, StoredReview[]>, meta: { placeId: string; placeTitle: string; source: string }): ReviewStats {
  const byMonth: Record<string, MonthStat> = {};
  for (const [m, items] of Object.entries(months)) {
    if (!items.length) continue;
    const st: MonthStat = { n: 0, sum: 0, dist: [0, 0, 0, 0, 0], langs: {}, replies: 0 };
    for (const r of items) {
      st.n++; st.sum += r.s; st.dist[r.s - 1]++;
      if (!st.langs[r.l]) st.langs[r.l] = [0, 0];
      st.langs[r.l][0]++; st.langs[r.l][1] += r.s;
      if (r.r) st.replies++;
    }
    byMonth[m] = st;
  }
  return { byMonth, placeId: meta.placeId, placeTitle: meta.placeTitle, lastImport: new Date().toISOString(), source: meta.source };
}

/** Junta os comentários ao local (sem duplicados), remove os com mais de 3 anos e devolve as novas estatísticas. */
export async function importIntoLocation(locId: string, g: ImportGroup, source = 'Google Maps (ficheiro exportado)', now = new Date()):
  Promise<{ added: number; dup: number; removedOld: number; stats: ReviewStats }> {
  const cut = cutoffDate(now).toISOString();
  const cutMonth = cut.slice(0, 7);
  const months = await readMonths(locId);
  const seen = new Set<string>();
  Object.values(months).forEach((arr) => arr.forEach((r) => seen.add(r.id)));
  const changed = new Set<string>();
  let added = 0, dup = 0, removedOld = 0;
  for (const r of g.reviews) {
    if (r.d < cut) continue;
    if (seen.has(r.id)) { dup++; continue; }
    seen.add(r.id);
    const m = r.d.slice(0, 7);
    const clean: StoredReview = { id: r.id, d: r.d, s: r.s, l: r.l, t: r.t };
    if (r.r) clean.r = 1;
    (months[m] = months[m] || []).push(clean);
    changed.add(m);
    added++;
  }
  // janela móvel: remove meses/comentários com mais de 3 anos
  for (const m of Object.keys(months)) {
    if (m < cutMonth) { removedOld += months[m].length; delete months[m]; await deleteDoc(doc(monthsCol(locId), m)); continue; }
    const keep = months[m].filter((r) => r.d >= cut);
    if (keep.length !== months[m].length) { removedOld += months[m].length - keep.length; months[m] = keep; changed.add(m); }
  }
  for (const m of Array.from(changed)) {
    months[m].sort((a, b) => (a.d < b.d ? 1 : -1));
    await setDoc(doc(monthsCol(locId), m), { items: months[m] });
  }
  const stats = buildStats(months, { placeId: g.key, placeTitle: g.title, source });
  return { added, dup, removedOld, stats };
}

export async function loadWindowReviews(locId: string, now = new Date()): Promise<StoredReview[]> {
  const cut = cutoffDate(now).toISOString();
  const months = await readMonths(locId);
  return Object.values(months).flat().filter((r) => r.d >= cut).sort((a, b) => (a.d < b.d ? 1 : -1));
}

export async function deleteLocationReviews(locId: string): Promise<void> {
  const snap = await getDocs(monthsCol(locId));
  for (const d of snap.docs) await deleteDoc(d.ref);
}

// ─── Estatísticas da janela de 3 anos (calculadas no momento) ───────────────
export interface WindowStats {
  n: number; avg: number; dist: number[]; pos: number; neu: number; neg: number;
  replies: number; respRate: number; from: string; to: string;
  langs: { code: string; n: number; avg: number }[];
  quarters: { q: string; n: number; avg: number; negPct: number }[];
}
export function windowStats(st?: ReviewStats | null, now = new Date()): WindowStats | null {
  if (!st || !st.byMonth) return null;
  const cutMonth = cutoffDate(now).toISOString().slice(0, 7);
  const months = Object.keys(st.byMonth).filter((m) => m >= cutMonth).sort();
  if (!months.length) return null;
  let n = 0, sum = 0, replies = 0;
  const dist = [0, 0, 0, 0, 0];
  const langs: Record<string, number[]> = {};
  const qs: Record<string, { n: number; sum: number; neg: number }> = {};
  for (const m of months) {
    const s = st.byMonth[m];
    n += s.n; sum += s.sum; replies += s.replies;
    s.dist.forEach((v, i) => { dist[i] += v; });
    for (const [l, v] of Object.entries(s.langs)) { if (!langs[l]) langs[l] = [0, 0]; langs[l][0] += v[0]; langs[l][1] += v[1]; }
    const q = `${m.slice(0, 4)}-T${Math.floor((+m.slice(5, 7) - 1) / 3) + 1}`;
    if (!qs[q]) qs[q] = { n: 0, sum: 0, neg: 0 };
    qs[q].n += s.n; qs[q].sum += s.sum; qs[q].neg += s.dist[0] + s.dist[1];
  }
  if (!n) return null;
  const pct = (x: number) => Math.round((x / n) * 1000) / 10;
  return {
    n, avg: Math.round((sum / n) * 100) / 100, dist,
    pos: pct(dist[3] + dist[4]), neu: pct(dist[2]), neg: pct(dist[0] + dist[1]),
    replies, respRate: pct(replies), from: months[0], to: months[months.length - 1],
    langs: Object.entries(langs).map(([code, v]) => ({ code, n: v[0], avg: Math.round((v[1] / v[0]) * 100) / 100 })).sort((a, b) => b.n - a.n),
    quarters: Object.entries(qs).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([q, v]) => ({ q, n: v.n, avg: Math.round((v.sum / v.n) * 100) / 100, negPct: Math.round((v.neg / v.n) * 1000) / 10 })),
  };
}

// ─── Amostra para a IA ──────────────────────────────────────────────────────
// A IA não lê milhares de comentários: recebe uma amostra equilibrada, dividida em
// "últimos 12 meses" e "período anterior", com peso reforçado das críticas.
function spread<T>(arr: T[], k: number): T[] {
  if (arr.length <= k) return arr;
  const out: T[] = [];
  for (let i = 0; i < k; i++) out.push(arr[Math.floor((i * arr.length) / k)]);
  return out;
}
function balanced(list: StoredReview[], max: number): StoredReview[] {
  const withText = list.filter((r) => r.t.trim().length >= 25);
  const neg = withText.filter((r) => r.s <= 2), mid = withText.filter((r) => r.s === 3), pos = withText.filter((r) => r.s >= 4);
  const a = spread(neg, Math.round(max * 0.4));
  const b = spread(mid, Math.round(max * 0.15));
  const c = spread(pos, max - a.length - b.length);
  return [...a, ...b, ...c].sort((x, y) => (x.d < y.d ? 1 : -1));
}
export function sampleForAI(reviews: StoredReview[], now = new Date()): { recent: StoredReview[]; previous: StoredReview[] } {
  const y1 = new Date(now); y1.setFullYear(y1.getFullYear() - 1);
  const cut1 = y1.toISOString();
  return {
    recent: balanced(reviews.filter((r) => r.d >= cut1), 90),
    previous: balanced(reviews.filter((r) => r.d < cut1), 60),
  };
}
