'use client';

import { useState } from 'react';
import { MESES, TAXA_TURISTICA } from '@/app/lib/observatorio-dados';
import { t, getLang } from '@/app/lib/i18n';
import { C, Card, fmt, fmtE } from './comum';
import { descarregarDados } from '@/app/lib/exportar-dados';

// Simulador da Taxa Municipal Turística.
// Base: os últimos 12 meses com faturação conhecida (julho de 2025 a junho de 2026), já com cobrança todo o ano.
// Cada fatura refere-se às dormidas do mês anterior (a declaração é feita no mês seguinte), por isso a receita
// de cada mês de faturação é atribuída ao mês anterior de dormida. Noites tributadas = receita ÷ 1,50 €.
// Funções de topo, sem funções aninhadas que usem parâmetros de fora (o compressor do Next.js parte esse padrão).
const VALOR_ATUAL = 1.5;
const M = MESES as unknown as string[];
interface MesBase { mesDormida: number; anoFatura: string; mesFatura: string; receita: number; noites: number; epoca: boolean }

function baseDoze(): MesBase[] {
  const r: MesBase[] = [];
  const T: any = TAXA_TURISTICA;
  const janela: [string, number][] = [];
  for (let i = 6; i < 12; i++) janela.push(['2025', i]);
  for (let i = 0; i < 6; i++) janela.push(['2026', i]);
  for (let k = 0; k < janela.length; k++) {
    const ano = janela[k][0]; const mi = janela[k][1];
    const v = T[ano] && typeof T[ano][M[mi]] === 'number' ? T[ano][M[mi]] : 0;
    const mesDormida = (mi + 11) % 12; // mês anterior ao da fatura
    r.push({ mesDormida, anoFatura: ano, mesFatura: M[mi], receita: v, noites: v / VALOR_ATUAL, epoca: mesDormida >= 2 && mesDormida <= 9 });
  }
  r.sort(porMesDormida);
  return r;
}
function porMesDormida(a: MesBase, b: MesBase) { return a.mesDormida - b.mesDormida; }
function somaReceita(l: MesBase[]) { let s = 0; for (let i = 0; i < l.length; i++) s += l[i].receita; return s; }
function simular(l: MesBase[], valor: number, todoAno: boolean, variacao: number): number[] {
  const r: number[] = [];
  for (let i = 0; i < l.length; i++) r.push(todoAno || l[i].epoca ? l[i].noites * (1 + variacao / 100) * valor : 0);
  return r;
}
function soma(xs: number[]) { let s = 0; for (let i = 0; i < xs.length; i++) s += xs[i]; return s; }
function loc(): string { const l = getLang() as string; return l === 'en' ? 'en-GB' : l === 'es' ? 'es-ES' : 'pt-PT'; }
const eur2 = (v: number) => v.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mesNome = (i: number) => new Date(2026, i, 1).toLocaleDateString(loc(), { month: 'short' }).replace('.', '');

// Valores praticados noutros municípios (Postal, 29/07/2026); o número máximo de noites e as isenções variam.
const REFERENCIAS: { nome: string; valor: number }[] = [
  { nome: 'Braga', valor: 1.5 }, { nome: 'Faro', valor: 2 }, { nome: 'Porto', valor: 3 }, { nome: 'Lisboa', valor: 4 },
];

export default function SimuladorTaxa() {
  const base = baseDoze();
  const receitaBase = somaReceita(base);
  const [valor, setValor] = useState(VALOR_ATUAL);
  const [todoAno, setTodoAno] = useState(true);
  const [variacao, setVariacao] = useState(0);
  const sim = simular(base, valor, todoAno, variacao);
  const total = soma(sim);
  const dif = total - receitaBase;
  const inverno = soma(simular(base, valor, true, variacao)) - soma(simular(base, valor, false, variacao));
  const max = Math.max(1, ...sim, ...base.map(receitaDe));
  const exportar = () => {
    const linhas = base.map(function (b, i) {
      return {
        [t('Mês da dormida', 'Stay month')]: mesNome(b.mesDormida),
        [t('Fatura (mês/ano)', 'Invoice (month/year)')]: `${b.mesFatura} ${b.anoFatura}`,
        [t('Receita real (€)', 'Actual revenue (€)')]: Math.round(b.receita * 100) / 100,
        [t('Noites tributadas', 'Taxed nights')]: Math.round(b.noites),
        [t('Receita simulada (€)', 'Simulated revenue (€)')]: Math.round(sim[i] * 100) / 100,
      };
    });
    descarregarDados(t('Simulador da taxa turística', 'Tourist tax simulator'), [linhas]);
  };
  return (
    <Card title={t('Simulador da taxa turística', 'Tourist tax simulator')} right={<button type="button" className="sim-exp" onClick={exportar}>{t('Dados', 'Data')}</button>}>
      <style>{CSS}</style>
      <p className="sim-intro">{t(`Parte das noites efetivamente tributadas nos últimos 12 meses com faturação conhecida (julho de 2025 a junho de 2026): ${fmt(Math.round(receitaBase / VALOR_ATUAL))} noites, ${fmtE(receitaBase)} de receita. Ajuste os parâmetros para ver o efeito na receita anual.`, `Based on the nights actually taxed over the last 12 months with known invoicing (July 2025 to June 2026): ${fmt(Math.round(receitaBase / VALOR_ATUAL))} nights, ${fmtE(receitaBase)} in revenue. Adjust the parameters to see the effect on annual revenue.`)}</p>
      <div className="sim-grid">
        <div className="sim-ctrl">
          <label className="sim-l" htmlFor="sim-valor">{t('Valor por noite', 'Rate per night')} <b>{eur2(valor)} €</b></label>
          <input id="sim-valor" type="range" min={0.5} max={4} step={0.25} value={valor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValor(Number(e.target.value))} />
          <div className="sim-refs" role="group" aria-label={t('Valores de referência', 'Reference rates')}>
            {REFERENCIAS.map((r) => <button key={r.nome} type="button" className={valor === r.valor ? 'on' : ''} aria-pressed={valor === r.valor} onClick={() => setValor(r.valor)}>{r.nome} · {eur2(r.valor)} €</button>)}
          </div>

          <span className="sim-l">{t('Período de cobrança', 'Collection period')}</span>
          <div className="sim-seg" role="group" aria-label={t('Período de cobrança', 'Collection period')}>
            <button type="button" className={todoAno ? 'on' : ''} aria-pressed={todoAno} onClick={() => setTodoAno(true)}>{t('Todo o ano (atual)', 'All year (current)')}</button>
            <button type="button" className={!todoAno ? 'on' : ''} aria-pressed={!todoAno} onClick={() => setTodoAno(false)}>{t('Só março a outubro (regra anterior)', 'March to October only (previous rule)')}</button>
          </div>

          <label className="sim-l" htmlFor="sim-var">{t('Variação das dormidas', 'Change in overnight stays')} <b>{variacao > 0 ? '+' : ''}{variacao}%</b></label>
          <input id="sim-var" type="range" min={-20} max={20} step={1} value={variacao} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariacao(Number(e.target.value))} />
        </div>

        <div className="sim-res">
          <div className="sim-total">
            <span>{t('Receita anual estimada', 'Estimated annual revenue')}</span>
            <b>{fmtE(total)}</b>
            <em style={{ color: dif >= 0 ? C.positive : C.negative }}>{dif >= 0 ? '+' : '−'}{fmtE(Math.abs(dif))} {t('face aos últimos 12 meses', 'vs the last 12 months')}</em>
          </div>
          <div className="sim-mini">
            <div><b>{fmt(Math.round(soma(sim) / Math.max(0.01, valor)))}</b><span>{t('noites tributadas', 'taxed nights')}</span></div>
            <div><b>{fmtE(inverno)}</b><span>{t('vêm dos meses de inverno (novembro a fevereiro)', 'come from the winter months (November to February)')}</span></div>
          </div>
          <div className="sim-barras" role="img" aria-label={t('Receita por mês de dormida: real e simulada', 'Revenue by stay month: actual and simulated')}>
            {base.map((b, i) => (
              <div key={b.mesDormida} className="sim-col">
                <div className="sim-par">
                  <i style={{ height: `${(b.receita / max) * 100}%`, background: C.border }} title={`${t('Real', 'Actual')}: ${fmtE(b.receita)}`} />
                  <i style={{ height: `${(sim[i] / max) * 100}%`, background: b.epoca ? C.accent : C.cyan }} title={`${t('Simulado', 'Simulated')}: ${fmtE(sim[i])}`} />
                </div>
                <small>{mesNome(b.mesDormida)}</small>
              </div>
            ))}
          </div>
          <div className="sim-leg"><span><i style={{ background: C.border }} />{t('Real', 'Actual')}</span><span><i style={{ background: C.accent }} />{t('Simulado (época)', 'Simulated (season)')}</span><span><i style={{ background: C.cyan }} />{t('Simulado (inverno)', 'Simulated (winter)')}</span></div>
        </div>
      </div>
      <details className="sim-met">
        <summary>{t('Como é calculado e limitações', 'How it is calculated and limitations')}</summary>
        <ul>
          <li>{t('Noites tributadas = receita faturada ÷ 1,50 €. Cada fatura é atribuída ao mês anterior, o da dormida, porque a declaração é feita no mês seguinte.', 'Taxed nights = invoiced revenue ÷ €1.50. Each invoice is assigned to the previous month, the month of the stay, because it is declared the following month.')}</li>
          <li>{t('Receita simulada = noites tributadas × (1 + variação das dormidas) × valor por noite, só nos meses incluídos no período de cobrança.', 'Simulated revenue = taxed nights × (1 + change in stays) × rate per night, only in the months included in the collection period.')}</li>
          <li>{t('Abril a junho de 2026 são provisórios e estão subavaliados (faturas ainda por cobrar), por isso a base é conservadora.', 'April to June 2026 are provisional and understated (invoices still unpaid), so the base is conservative.')}</li>
          <li>{t('Não é possível simular o número máximo de noites nem a idade de isenção: faltam a distribuição das estadas por número de noites e a idade dos hóspedes.', 'The maximum number of nights and the exemption age cannot be simulated: the distribution of stays by number of nights and the age of guests are not available.')}</li>
          <li>{t('O simulador não estima se um valor mais alto reduziria a procura; para isso use a variação das dormidas como cenário.', 'The simulator does not estimate whether a higher rate would reduce demand; use the change in stays as a scenario for that.')}</li>
          <li>{t('A receita simulada é o valor cobrado aos hóspedes. Os alojamentos retêm uma comissão de cobrança de 2,5% (artigo H-4/7.º do Código Regulamentar), por isso o valor que chega ao Município é cerca de 97,5% deste.', 'Simulated revenue is the amount charged to guests. Accommodation providers keep a 2.5% collection fee (article H-4/7 of the Municipal Regulatory Code), so the amount reaching the Municipality is about 97.5% of it.')}</li>
          <li>{t('Valores de referência de outros municípios: Postal, 29/07/2026. O número máximo de noites e as isenções variam de município para município.', 'Reference rates of other municipalities: Postal, 29/07/2026. The maximum number of nights and exemptions vary between municipalities.')}</li>
        </ul>
      </details>
    </Card>
  );
}
function receitaDe(b: MesBase) { return b.receita; }

const CSS = `
.sim-intro { margin: 0 0 14px; font-size: 13.5px; color: ${C.textMuted}; line-height: 1.6; }
.sim-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 18px; }
.sim-ctrl { display: flex; flex-direction: column; gap: 8px; }
.sim-l { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; color: ${C.text}; margin-top: 6px; }
.sim-l b { color: ${C.accent}; font-size: 15px; }
.sim-ctrl input[type=range] { width: 100%; accent-color: ${C.accent}; }
.sim-refs, .sim-seg { display: flex; flex-wrap: wrap; gap: 6px; }
.sim-refs button, .sim-seg button { height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMuted}; font: 600 12.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.sim-refs button.on, .sim-seg button.on { background: ${C.accentBg}; border-color: ${C.accent}; color: ${C.text}; }
.sim-res { display: flex; flex-direction: column; gap: 12px; }
.sim-total { padding: 14px 16px; border-radius: 12px; background: ${C.cardAlt}; display: flex; flex-direction: column; gap: 2px; }
.sim-total span { font-size: 12px; color: ${C.textMuted}; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
.sim-total b { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; color: ${C.text}; }
.sim-total em { font-style: normal; font-size: 13px; font-weight: 600; }
.sim-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sim-mini div { padding: 10px 12px; border-radius: 10px; background: ${C.cardAlt}; }
.sim-mini b { display: block; font-size: 18px; color: ${C.text}; } .sim-mini span { font-size: 12px; color: ${C.textMuted}; line-height: 1.35; }
.sim-barras { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 4px; height: 150px; align-items: end; }
.sim-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; }
.sim-par { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
.sim-par i { display: block; width: 42%; border-radius: 3px 3px 0 0; transition: height .35s ease; }
.sim-col small { font-size: 10.5px; color: ${C.textDim}; }
.sim-leg { display: flex; gap: 14px; flex-wrap: wrap; font-size: 11.5px; color: ${C.textMuted}; }
.sim-leg span { display: inline-flex; align-items: center; gap: 6px; } .sim-leg i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.sim-met { margin-top: 14px; border-top: 1px solid ${C.border}; padding-top: 10px; }
.sim-met summary { cursor: pointer; font-size: 13px; font-weight: 700; color: ${C.accent}; }
.sim-met ul { margin: 8px 0 0; padding-left: 18px; font-size: 12.5px; color: ${C.textMuted}; line-height: 1.6; }
.sim-exp { height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMuted}; font: 600 12px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.sim-exp:hover { border-color: ${C.accent}; color: ${C.text}; }
@media (prefers-reduced-motion: reduce) { .sim-par i { transition: none; } }
@media (max-width: 760px) { .sim-grid { grid-template-columns: 1fr; } .sim-barras { height: 120px; gap: 2px; } .sim-total b { font-size: 28px; } }
`;
