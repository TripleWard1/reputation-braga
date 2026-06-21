// Tradução on-the-fly (PT -> EN) do conteúdo gerado por IA, com cache em memória.
// Quando o idioma ativo é PT, dispAnalysis() devolve a análise original.
// Quando é EN, devolve a versão traduzida (ou a PT como fallback enquanto traduz),
// disparando uma tradução via Groq na primeira vez e re-renderizando quando termina.
import { getLang } from './i18n';

type AnyAnalysis = any;

const cache = new Map<string, AnyAnalysis>(); // loc.id -> análise traduzida (EN)
const inflight = new Set<string>();

let notify: (() => void) | null = null;
/** Liga um callback que força re-render quando uma tradução fica pronta. */
export function setTransNotify(fn: () => void) { notify = fn; }

/** Invalida a tradução de um local (ex.: após nova análise). */
export function invalidateTrans(locId: string) { cache.delete(locId); inflight.delete(locId); }

/** Limpa toda a cache de traduções. */
export function clearTransCache() { cache.clear(); inflight.clear(); }

function pick(a: AnyAnalysis) {
  return {
    summary: a.summaryPT ?? '',
    praises: a.keyPraises ?? [],
    issues: a.keyIssues ?? [],
    themesPos: a.topThemesPositive ?? [],
    themesNeg: a.topThemesNegative ?? [],
    insights: a.actionableInsights ?? [],
    marketNotes: Array.isArray(a.marketSentiment) ? a.marketSentiment.map((m: any) => m?.note ?? '') : [],
  };
}

async function translateAnalysis(locId: string, a: AnyAnalysis): Promise<void> {
  if (cache.has(locId) || inflight.has(locId)) return;
  inflight.add(locId);
  try {
    const src = pick(a);
    const prompt = `Translate the following Portuguese tourism-analysis content into natural, fluent international English. Return ONLY a JSON object (no markdown, no backticks, no commentary) with EXACTLY these keys: summary (string), praises (string[]), issues (string[]), themesPos (string[]), themesNeg (string[]), insights (string[]), marketNotes (string[]). Keep every array the same length and order as the input. Preserve meaning and an institutional tone. Input:\n${JSON.stringify(src)}`;
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error('translate http ' + res.status);
    const data = await res.json();
    let txt = (data.choices?.[0]?.message?.content ?? '').trim();
    txt = txt.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const j = JSON.parse(txt);
    const arr = (v: any, fb: any[]) => (Array.isArray(v) ? v : fb);
    const origMS = Array.isArray(a.marketSentiment) ? a.marketSentiment : [];
    const notes = arr(j.marketNotes, []);
    const translated = {
      ...a,
      summaryPT: typeof j.summary === 'string' && j.summary ? j.summary : a.summaryPT,
      keyPraises: arr(j.praises, a.keyPraises ?? []),
      keyIssues: arr(j.issues, a.keyIssues ?? []),
      topThemesPositive: arr(j.themesPos, a.topThemesPositive ?? []),
      topThemesNegative: arr(j.themesNeg, a.topThemesNegative ?? []),
      actionableInsights: arr(j.insights, a.actionableInsights ?? []),
      marketSentiment: origMS.map((m: any, i: number) => ({ ...m, note: notes[i] ?? m?.note })),
    };
    cache.set(locId, translated);
  } catch {
    // Em caso de falha, deixa por traduzir (fica em PT); pode tentar de novo mais tarde.
  } finally {
    inflight.delete(locId);
    if (notify) notify();
  }
}

/**
 * Acessor síncrono para usar no render e no gerador de relatório.
 * PT: devolve a análise original. EN: devolve a traduzida (cache) ou a PT como
 * fallback, disparando a tradução em segundo plano na primeira chamada.
 */
export function dispAnalysis<T extends { id: string; analysis?: AnyAnalysis }>(loc: T): AnyAnalysis {
  const a = loc.analysis;
  if (!a) return a;
  if (getLang() !== 'en') return a;
  const c = cache.get(loc.id);
  if (c) return c;
  translateAnalysis(loc.id, a); // fire-and-forget
  return a; // fallback PT até estar pronto
}