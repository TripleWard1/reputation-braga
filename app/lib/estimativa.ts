// Estimativa das dormidas em Braga para os meses ainda não publicados pelo INE.
// Método: mês em falta = mesmo mês do ano anterior × (1 + crescimento homólogo acumulado do ano até ao último mês publicado).
// Intervalo: entre o mês mais fraco e o mais forte do próprio ano. Fonte única para o Observatório e o modo apresentação.
import { DORMIDAS_BRAGA, MESES } from '@/app/lib/observatorio-dados';

export interface MesEstimativa { mes: string; i: number; real: number | null; anterior: number | null; est: number | null; min: number | null; max: number | null }
export interface Estimativa { ano: number; ultimoMes: number; g: number; gMin: number; gMax: number; meses: MesEstimativa[]; real: number; total: number; totalMin: number; totalMax: number; totalAnterior: number; variacao: number }

export function estimativaDormidas(ano = 2026): Estimativa | null {
  const y = String(ano), y0 = String(ano - 1);
  const M = MESES as unknown as string[];
  const D: any = DORMIDAS_BRAGA;
  const reais: (number | null)[] = M.map((m) => (D[m]?.[y] ?? null));
  const ant: (number | null)[] = M.map((m) => (D[m]?.[y0] ?? null));
  const ult = reais.reduce((u: number, v, i) => (v != null ? i : u), -1);
  if (ult < 0 || ult >= 11) return null;
  const real = reais.slice(0, ult + 1).reduce((a: number, v) => a + (v || 0), 0);
  const baseR = ant.slice(0, ult + 1).reduce((a: number, v) => a + (v || 0), 0);
  if (!baseR) return null;
  const g = real / baseR - 1;
  const vars = reais.slice(0, ult + 1).map((v, i) => (v && ant[i] ? v / (ant[i] as number) - 1 : null)).filter((x): x is number => x != null);
  const gMin = Math.min(...vars), gMax = Math.max(...vars);
  const meses: MesEstimativa[] = M.map((m, i) => {
    const b = ant[i];
    const futuro = i > ult && b != null;
    return { mes: m, i, real: reais[i], anterior: b, est: futuro ? Math.round(b! * (1 + g)) : null, min: futuro ? Math.round(b! * (1 + gMin)) : null, max: futuro ? Math.round(b! * (1 + gMax)) : null };
  });
  const soma = (k: 'est' | 'min' | 'max') => meses.reduce((a, x) => a + (x[k] || 0), 0);
  const totalAnterior = ant.reduce((a: number, v) => a + (v || 0), 0);
  const total = real + soma('est');
  return { ano, ultimoMes: ult, g, gMin, gMax, meses, real, total, totalMin: real + soma('min'), totalMax: real + soma('max'), totalAnterior, variacao: total / totalAnterior - 1 };
}
