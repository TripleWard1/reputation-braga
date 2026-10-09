'use client';

import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { AEROPORTO_PORTO } from '@/app/lib/alojamento-aeroporto-dados';
import { estimativaDormidas } from '@/app/lib/estimativa';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Estimativa das dormidas do ano (meses ainda não publicados pelo INE) ═══
export default function EstimativaDormidas() {
  const E = estimativaDormidas();
  if (!E) return <SectionTitle sub="INE/TravelBI">{t('Sem meses por estimar neste momento', 'No months left to estimate right now')}</SectionTitle>;
  const MC = [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];
  const pc = (x: number, d = 1) => `${x >= 0 ? '+' : ''}${(x * 100).toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
  const dados = E.meses.map((m) => ({ mes: MC[m.i], anterior: m.anterior, real: m.real, estimativa: m.est }));
  const futuros = E.meses.filter((m) => m.est != null);
  const ultNome = MC[E.ultimoMes];
  // sinal do aeroporto: variação dos meses já publicados para Braga vs meses seguintes já conhecidos no aeroporto
  const A = AEROPORTO_PORTO.meses;
  const anoS = String(E.ano);
  const aeroBase = A.filter((x) => x.mes.startsWith(anoS) && +x.mes.slice(5, 7) - 1 <= E.ultimoMes && x.varHom != null);
  const aeroDepois = A.filter((x) => x.mes.startsWith(anoS) && +x.mes.slice(5, 7) - 1 > E.ultimoMes && x.varHom != null);
  const media = (xs: { varHom: number | null }[]) => xs.reduce((a, x) => a + (x.varHom || 0), 0) / Math.max(1, xs.length);
  return (
    <>
      <SectionTitle sub={t(`Estimativa da plataforma com base no INE/TravelBI até ${ultNome} de ${E.ano} · não é um dado oficial`, `Platform estimate based on INE/TravelBI up to ${ultNome} ${E.ano} · not official data`)}>{t(`Projeção para ${E.ano}: cerca de ${fmt(Math.round(E.total / 100) * 100)} dormidas em Braga (${pc(E.variacao)}), se se mantiver o crescimento de jan–${ultNome}`, `${E.ano} projection: about ${fmt(Math.round(E.total / 100) * 100)} overnight stays in Braga (${pc(E.variacao)}), if Jan–${ultNome} growth holds`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t(`Total estimado ${E.ano}`, `Estimated total ${E.ano}`)} value={fmt(Math.round(E.total / 100) * 100)} sub={t(`entre ${fmt(Math.round(E.totalMin / 100) * 100)} e ${fmt(Math.round(E.totalMax / 100) * 100)}`, `between ${fmt(Math.round(E.totalMin / 100) * 100)} and ${fmt(Math.round(E.totalMax / 100) * 100)}`)} color={C.orange} />
        <KPI label={t(`Já publicado (jan–${ultNome})`, `Already published (Jan–${ultNome})`)} value={fmt(E.real)} sub={t(`${pc(E.g)} face a ${E.ano - 1}`, `${pc(E.g)} vs ${E.ano - 1}`)} color={C.accent} />
        <KPI label={t('Crescimento usado na estimativa', 'Growth used in the estimate')} value={pc(E.g)} sub={t(`intervalo: ${pc(E.gMin)} a ${pc(E.gMax)} (mês mais fraco e mais forte do ano)`, `range: ${pc(E.gMin)} to ${pc(E.gMax)} (weakest and strongest month)`)} color={C.purple} />
        {aeroDepois.length > 0 && <KPI label={t('Sinal do aeroporto', 'Airport signal')} value={pc((aeroDepois[0].varHom || 0) / 100)} sub={t(`${MC[+aeroDepois[0].mes.slice(5, 7) - 1]} no Porto, contra ${pc(media(aeroBase) / 100)} em média nos meses já publicados`, `${MC[+aeroDepois[0].mes.slice(5, 7) - 1]} in Porto, vs ${pc(media(aeroBase) / 100)} on average in published months`)} color={C.cyan} />}
      </div>
      <Card title={t(`Dormidas por mês: ${E.ano} real, ${E.ano} estimado e ${E.ano - 1}`, `Overnight stays per month: ${E.ano} actual, ${E.ano} estimated and ${E.ano - 1}`)}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${Math.round(v / 1000)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [v == null ? '-' : fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="real" name={t(`${E.ano} (INE)`, `${E.ano} (INE)`)} fill={C.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="estimativa" name={t(`${E.ano} (estimativa)`, `${E.ano} (estimate)`)} fill={C.orange} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="anterior" name={String(E.ano - 1)} stroke={C.textDim} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Meses estimados', 'Estimated months')}>
          {futuros.map((m, i) => (
            <div key={m.mes} style={{ display: 'grid', gridTemplateColumns: '60px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '9px 0', borderTop: i ? `1px solid ${C.border}` : 'none', fontSize: 13.5 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{MC[m.i]}</span>
              <span style={{ color: C.textDim }}>{t(`entre ${fmt(m.min || 0)} e ${fmt(m.max || 0)}`, `between ${fmt(m.min || 0)} and ${fmt(m.max || 0)}`)}</span>
              <strong style={{ color: C.text }}>{fmt(m.est || 0)}</strong>
            </div>
          ))}
        </Card>
        <Card title={t('Como é calculado', 'How it is calculated')}>
          {[
            t(`Cada mês em falta = o mesmo mês de ${E.ano - 1} × (1 + ${pc(E.g)}), o crescimento acumulado de janeiro a ${ultNome}.`, `Each missing month = the same month in ${E.ano - 1} × (1 + ${pc(E.g)}), the cumulative growth from January to ${ultNome}.`),
            t(`O intervalo usa o mês com menor (${pc(E.gMin)}) e maior (${pc(E.gMax)}) crescimento deste ano.`, `The range uses this year’s weakest (${pc(E.gMin)}) and strongest (${pc(E.gMax)}) month.`),
            t('O aeroporto do Porto publica antes do INE: se crescer em linha com os meses anteriores, a estimativa mantém-se credível.', 'Porto airport publishes before INE: if it grows in line with previous months, the estimate stays credible.'),
            t('A estimativa atualiza-se sozinha quando entrarem novos meses do INE. Não substitui os dados oficiais.', 'The estimate updates itself as new INE months arrive. It does not replace official data.'),
          ].map((x, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', gap: 6, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, padding: '6px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}><span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}</span>{x}</div>)}
        </Card>
      </div>
    </>
  );
}

