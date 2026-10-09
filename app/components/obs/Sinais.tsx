'use client';

import { t } from '@/app/lib/i18n';
import { MESES, DORMIDAS_BRAGA, HOSPEDES_BRAGA, DORMIDAS_NORTE, DORMIDAS_PORTUGAL, SEMESTRE_2026, TAXA_TURISTICA } from '@/app/lib/observatorio-dados';
import { AEROPORTO_PORTO } from '@/app/lib/alojamento-aeroporto-dados';
import { SIBS_MENSAL } from '@/app/lib/sibs-dados';

// "Sinais": compara o valor mais recente de cada indicador com o seu PRÓPRIO padrão histórico
// e mostra apenas os desvios relevantes, com a explicação e a ligação ao separador com os dados completos.
type Tom = 'atencao' | 'positivo' | 'info';
interface Sinal { id: string; tom: Tom; tema: string; titulo: string; valor: string; texto: string; separador: string; peso: number }

const M = MESES as unknown as string[];
const num = (v: number) => Math.round(v).toLocaleString(t('pt-PT', 'en-GB'));
const pct = (v: number, d = 1) => `${v >= 0 ? '+' : ''}${v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
const mesNome = (i: number) => new Date(2026, i, 1).toLocaleDateString(t('pt-PT', 'en-GB'), { month: 'long' });
function media(xs: number[]) { let s = 0; for (let i = 0; i < xs.length; i++) s += xs[i]; return xs.length ? s / xs.length : 0; }
function desvio(xs: number[]) { const m = media(xs); let s = 0; for (let i = 0; i < xs.length; i++) s += (xs[i] - m) * (xs[i] - m); return xs.length > 1 ? Math.sqrt(s / (xs.length - 1)) : 0; }
function valor(serie: any, mes: string, ano: number): number | null { const v = serie && serie[mes] ? serie[mes][String(ano)] : undefined; return typeof v === 'number' ? v : null; }
function ultimoMes(serie: any, ano: number): number { let u = -1; for (let i = 0; i < 12; i++) if (valor(serie, M[i], ano) !== null) u = i; return u; }

// Variação homóloga de um mês e o padrão dos três anos anteriores (média e desvio-padrão das variações)
function homologa(serie: any, i: number, ano: number) {
  const a = valor(serie, M[i], ano), b = valor(serie, M[i], ano - 1);
  if (a === null || !b) return null;
  const v = (a / b - 1) * 100;
  const hist: number[] = [];
  for (let y = ano - 1; y >= ano - 3; y--) { const x = valor(serie, M[i], y), z = valor(serie, M[i], y - 1); if (x !== null && z) hist.push((x / z - 1) * 100); }
  return { atual: a, anterior: b, v, mu: media(hist), sd: desvio(hist), n: hist.length };
}
function acumulado(serie: any, ano: number, ate: number) { let s = 0; for (let i = 0; i <= ate; i++) s += valor(serie, M[i], ano) || 0; return s; }

function calcularSinais(): Sinal[] {
  const r: Sinal[] = [];
  const ANO = 2026;
  // 1) Dormidas do último mês publicado, face ao padrão do mesmo mês
  try {
    const u = ultimoMes(DORMIDAS_BRAGA, ANO);
    const h = u >= 0 ? homologa(DORMIDAS_BRAGA, u, ANO) : null;
    if (h) {
      const z = h.sd > 0.5 ? (h.v - h.mu) / h.sd : 0;
      const tom: Tom = h.v < 0 || z <= -1 ? 'atencao' : z >= 1 || h.v >= 5 ? 'positivo' : 'info';
      r.push({ id: 'dorm-mes', tom, tema: t('Procura', 'Demand'), separador: 'procura', peso: Math.abs(z) + Math.abs(h.v) / 10,
        titulo: t(`Dormidas em ${mesNome(u)}`, `Overnight stays in ${mesNome(u)}`), valor: pct(h.v),
        texto: t(`${num(h.atual)} dormidas, contra ${num(h.anterior)} no mesmo mês de ${ANO - 1}. Nos ${h.n} anos anteriores, este mês variou em média ${pct(h.mu)}${tom === 'atencao' ? ': o resultado está abaixo do padrão.' : tom === 'positivo' ? ': o resultado está acima do padrão.' : ', em linha com o padrão.'}`,
          `${num(h.atual)} overnight stays, against ${num(h.anterior)} in the same month of ${ANO - 1}. Over the previous ${h.n} years, this month changed on average ${pct(h.mu)}${tom === 'atencao' ? ': the result is below the usual pattern.' : tom === 'positivo' ? ': the result is above the usual pattern.' : ', in line with the usual pattern.'}`) });
    }
    // 2) Acumulado do ano face ao Norte e a Portugal (só meses publicados nas três séries)
    const ate = Math.min(ultimoMes(DORMIDAS_BRAGA, ANO), ultimoMes(DORMIDAS_NORTE, ANO), ultimoMes(DORMIDAS_PORTUGAL, ANO));
    if (ate >= 0) {
      const vb = (acumulado(DORMIDAS_BRAGA, ANO, ate) / acumulado(DORMIDAS_BRAGA, ANO - 1, ate) - 1) * 100;
      const vn = (acumulado(DORMIDAS_NORTE, ANO, ate) / acumulado(DORMIDAS_NORTE, ANO - 1, ate) - 1) * 100;
      const vp = (acumulado(DORMIDAS_PORTUGAL, ANO, ate) / acumulado(DORMIDAS_PORTUGAL, ANO - 1, ate) - 1) * 100;
      const dif = vb - vn;
      if (Math.abs(dif) >= 0.5) r.push({ id: 'dorm-regiao', tom: dif < 0 ? 'atencao' : 'positivo', tema: t('Procura', 'Demand'), separador: 'procura', peso: Math.abs(dif),
        titulo: t(`Braga face ao Norte (janeiro a ${mesNome(ate)})`, `Braga vs the North (January to ${mesNome(ate)})`), valor: `${dif >= 0 ? '+' : ''}${dif.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} p.p.`,
        texto: t(`Dormidas em Braga ${pct(vb)}, na Região Norte ${pct(vn)} e em Portugal ${pct(vp)}. ${dif < 0 ? 'Braga cresce menos do que a região.' : 'Braga cresce mais do que a região.'}`,
          `Overnight stays in Braga ${pct(vb)}, in the North ${pct(vn)} and in Portugal ${pct(vp)}. ${dif < 0 ? 'Braga is growing less than the region.' : 'Braga is growing faster than the region.'}`) });
    }
  } catch { /* indicador indisponível */ }
  // 3) Estada média
  try {
    // Compara o mesmo período nos dois anos (janeiro até ao último mês publicado).
    const ue = ultimoMes(DORMIDAS_BRAGA, ANO);
    const hA = ue >= 0 ? acumulado(HOSPEDES_BRAGA, ANO, ue) : 0, hB = ue >= 0 ? acumulado(HOSPEDES_BRAGA, ANO - 1, ue) : 0;
    const a = hA ? acumulado(DORMIDAS_BRAGA, ANO, ue) / hA : 0, b = hB ? acumulado(DORMIDAS_BRAGA, ANO - 1, ue) / hB : 0;
    if (a && b && Math.abs(a - b) >= 0.03) r.push({ id: 'estada', tom: a > b ? 'positivo' : 'atencao', tema: t('Procura', 'Demand'), separador: 'procura', peso: Math.abs(a - b) * 20,
      titulo: t(`Estada média (janeiro a ${mesNome(ue)})`, `Average length of stay (January to ${mesNome(ue)})`), valor: `${a.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('noites', 'nights')}`,
      texto: t(`No mesmo período de ${ANO - 1} era de ${b.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} noites. ${a > b ? 'Os hóspedes ficaram, em média, mais noites.' : 'Os hóspedes ficaram, em média, menos noites.'}`,
        `In the same period of ${ANO - 1} it was ${b.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} nights. ${a > b ? 'Guests stayed more nights on average.' : 'Guests stayed fewer nights on average.'}`) });
  } catch { /* indisponível */ }
  // 4) Mercados (1.º semestre): maiores subidas e descidas entre os 10 principais
  try {
    const S: any = SEMESTRE_2026;
    const top = [...S.mercadosDormidas].sort((x: any[], y: any[]) => y[2] - x[2]).slice(0, 10);
    const vars: [string, number, number][] = [];
    for (let i = 0; i < top.length; i++) { const [nome, a, b] = top[i]; if (a > 0) vars.push([nome, (b / a - 1) * 100, b]); }
    vars.sort((x, y) => x[1] - y[1]);
    const desc = vars[0], sub = vars[vars.length - 1];
    if (desc && desc[1] <= -10) r.push({ id: 'merc-desce', tom: 'atencao', tema: t('Mercados', 'Markets'), separador: 'mercados', peso: Math.abs(desc[1]) / 5,
      titulo: t(`${desc[0]} em queda`, `${desc[0]} declining`), valor: pct(desc[1]),
      texto: t(`${num(desc[2])} dormidas no 1.º semestre de ${ANO}. É o mercado, entre os dez principais, com a maior descida face a ${ANO - 1}.`, `${num(desc[2])} overnight stays in H1 ${ANO}. Among the top ten markets, it shows the largest drop vs ${ANO - 1}.`) });
    if (sub && sub[1] >= 10) r.push({ id: 'merc-sobe', tom: 'positivo', tema: t('Mercados', 'Markets'), separador: 'mercados', peso: sub[1] / 5,
      titulo: t(`${sub[0]} em crescimento`, `${sub[0]} growing`), valor: pct(sub[1]),
      texto: t(`${num(sub[2])} dormidas no 1.º semestre de ${ANO}. É o mercado, entre os dez principais, que mais cresce face a ${ANO - 1}.`, `${num(sub[2])} overnight stays in H1 ${ANO}. Among the top ten markets, it is the fastest-growing vs ${ANO - 1}.`) });
  } catch { /* indisponível */ }
  // 5) Taxa turística: separa o efeito do preço do efeito da procura
  try {
    const T: any = TAXA_TURISTICA;
    let u = -1; for (let i = 0; i < 12; i++) if (T[String(ANO)] && typeof T[String(ANO)][M[i]] === 'number' && T[String(ANO)][M[i]] > 0) u = i;
    const ultDorm = ultimoMes(DORMIDAS_BRAGA, ANO);
    const lim = Math.min(u, ultDorm);
    if (lim >= 0 && T[String(ANO - 1)]) {
      let r26 = 0, r25 = 0;
      for (let i = 0; i <= lim; i++) { r26 += T[String(ANO)][M[i]] || 0; r25 += T[String(ANO - 1)][M[i]] || 0; }
      const vr = (r26 / r25 - 1) * 100;
      const vd = (acumulado(DORMIDAS_BRAGA, ANO, lim) / acumulado(DORMIDAS_BRAGA, ANO - 1, lim) - 1) * 100;
      r.push({ id: 'taxa', tom: 'info', tema: t('Taxa turística', 'Tourist tax'), separador: 'taxa', peso: 1.2,
        titulo: t(`Receita da taxa turística (janeiro a ${mesNome(lim)})`, `Tourist tax revenue (January to ${mesNome(lim)})`), valor: pct(vr, 0),
        texto: t(`A receita subiu ${pct(vr, 0)}, mas as dormidas variaram ${pct(vd)}: a subida reflete sobretudo o alargamento da cobrança a todo o ano (antes, só de março a outubro), com o mesmo valor de 1,50 €, e não um aumento da procura.`,
          `Revenue rose ${pct(vr, 0)}, but overnight stays changed ${pct(vd)}: the increase mainly reflects collection being extended to the whole year (previously March to October only), at the same €1.50, not higher demand.`) });
    }
  } catch { /* indisponível */ }
  // 6) Aeroporto do Porto: aceleração ou abrandamento face aos 12 meses anteriores
  try {
    const A: any = AEROPORTO_PORTO; const ms = A.meses as { mes: string; n: number; varHom: number }[];
    if (ms && ms.length >= 13) {
      const ult = ms[ms.length - 1]; const ant: number[] = [];
      for (let i = ms.length - 13; i < ms.length - 1; i++) if (typeof ms[i].varHom === 'number') ant.push(ms[i].varHom);
      const mu = media(ant); const dif = ult.varHom - mu;
      if (Math.abs(dif) >= 2) {
        const [aa, mm] = ult.mes.split('-').map(Number);
        r.push({ id: 'aero', tom: dif < 0 ? 'atencao' : 'positivo', tema: t('Aeroporto', 'Airport'), separador: 'aeroporto', peso: Math.abs(dif) / 3,
          titulo: t(`Aeroporto do Porto em ${mesNome(mm - 1)} de ${aa}`, `Porto Airport in ${mesNome(mm - 1)} ${aa}`), valor: pct(ult.varHom),
          texto: t(`Passageiros desembarcados ${pct(ult.varHom)} face ao mesmo mês do ano anterior, contra uma média de ${pct(mu)} nos 12 meses antes. ${dif < 0 ? 'Pode antecipar um abrandamento das dormidas em Braga (relação não testada).' : 'Pode antecipar uma aceleração das dormidas em Braga (relação não testada).'}`,
            `Arriving passengers ${pct(ult.varHom)} vs the same month a year earlier, against an average of ${pct(mu)} over the previous 12 months. ${dif < 0 ? 'It may anticipate a slowdown in Braga’s overnight stays (relationship not tested).' : 'It may anticipate an acceleration in Braga’s overnight stays (relationship not tested).'}`) });
      }
    }
  } catch { /* indisponível */ }
  // 7) Pagamentos eletrónicos (SIBS), último mês disponível
  try {
    const S = SIBS_MENSAL as any[]; let ult: any = null;
    for (let i = 0; i < S.length; i++) if (S[i].indicador === 'Operações de pagamento eletrónico' && (!ult || S[i].mes > ult.mes)) ult = S[i];
    if (ult && typeof ult.varValor === 'number' && Math.abs(ult.varValor) >= 3) {
      const [aa, mm] = String(ult.mes).split('-').map(Number);
      r.push({ id: 'sibs', tom: ult.varValor < 0 ? 'atencao' : 'positivo', tema: t('Gastos com cartão', 'Card spending'), separador: 'cartoes', peso: Math.abs(ult.varValor) / 6,
        titulo: t(`Pagamentos com cartão em ${mesNome(mm - 1)} de ${aa}`, `Card payments in ${mesNome(mm - 1)} ${aa}`), valor: pct(ult.varValor, 0),
        texto: t(`Valor dos pagamentos eletrónicos no concelho face ao mesmo mês do ano anterior (todos os cartões, incluindo portugueses).`, `Value of electronic payments in the municipality vs the same month a year earlier (all cards, including Portuguese ones).`) });
    }
  } catch { /* indisponível */ }
  // 8) Hóspedes do último mês publicado (só se divergirem das dormidas)
  try {
    const u = ultimoMes(HOSPEDES_BRAGA, ANO); const h = u >= 0 ? homologa(HOSPEDES_BRAGA, u, ANO) : null; const d = u >= 0 ? homologa(DORMIDAS_BRAGA, u, ANO) : null;
    if (h && d && Math.abs(h.v - d.v) >= 3) r.push({ id: 'hosp', tom: 'info', tema: t('Procura', 'Demand'), separador: 'procura', peso: Math.abs(h.v - d.v) / 4,
      titulo: t(`Hóspedes e dormidas divergem em ${mesNome(u)}`, `Guests and overnight stays diverge in ${mesNome(u)}`), valor: pct(h.v),
      texto: t(`Hóspedes ${pct(h.v)} e dormidas ${pct(d.v)}. ${h.v > d.v ? 'Registaram-se mais hóspedes, mas menos dormidas por hóspede.' : 'Registaram-se menos hóspedes, mas mais dormidas por hóspede.'}`,
        `Guests ${pct(h.v)} and overnight stays ${pct(d.v)}. ${h.v > d.v ? 'More guests were recorded, but fewer nights per guest.' : 'Fewer guests were recorded, but more nights per guest.'}`) });
  } catch { /* indisponível */ }
  return r.sort(ordenarSinais);
}
const ORDEM: Record<Tom, number> = { atencao: 0, positivo: 1, info: 2 };
function ordenarSinais(a: Sinal, b: Sinal) { return ORDEM[a.tom] - ORDEM[b.tom] || b.peso - a.peso; }

const COR: Record<Tom, string> = { atencao: '#EDA06B', positivo: '#7CC79A', info: '#8AB0E6' };
const ICONE: Record<Tom, string> = { atencao: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z', positivo: 'M3 17l6-6 4 4 8-8M15 7h6v6', info: 'M12 16v-4M12 8h.01M12 22a10 10 0 100-20 10 10 0 000 20z' };

export default function Sinais({ irPara, nomeSeparador }: { irPara: (id: string) => void; nomeSeparador: (id: string) => string | null }) {
  let lista: Sinal[] = [];
  try { lista = calcularSinais(); } catch { lista = []; }
  if (!lista.length) return null;
  const rot: Record<Tom, string> = { atencao: t('Atenção', 'Attention'), positivo: t('Positivo', 'Positive'), info: t('Contexto', 'Context') };
  let nA = 0; for (let i = 0; i < lista.length; i++) if (lista[i].tom === 'atencao') nA++;
  return (
    <section className="obs-sinais" aria-labelledby="obs-sinais-t">
      <div className="obs-sinais-cab">
        <div>
          <h2 id="obs-sinais-t">{t('Sinais', 'Signals')}</h2>
          <p>{t('Desvios relevantes de cada indicador face ao seu próprio padrão histórico. Só aparece o que mudou.', 'Relevant deviations of each indicator from its own historical pattern. Only what changed is shown.')}</p>
        </div>
        <span className="obs-sinais-n">{nA ? t(`${nA} a acompanhar`, `${nA} to watch`) : t('Sem alertas', 'No alerts')}</span>
      </div>
      <ul className="obs-sinais-l">
        {lista.map((s) => (
          <li key={s.id} className={`obs-sinal ${s.tom}`}>
            <div className="obs-sinal-top">
              <span className="obs-sinal-tom" style={{ color: COR[s.tom] }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONE[s.tom]} /></svg>
                {rot[s.tom]} · {s.tema}
              </span>
              <b style={{ color: COR[s.tom] }}>{s.valor}</b>
            </div>
            <h3>{s.titulo}</h3>
            <p>{s.texto}</p>
            {nomeSeparador(s.separador) && <button type="button" className="obs-leit-ir" onClick={() => irPara(s.separador)}>{t('Ver em', 'See in')} «{nomeSeparador(s.separador)}» <span aria-hidden="true">→</span></button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
