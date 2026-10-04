'use client';

import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MESES, DORMIDAS_BRAGA } from '@/app/lib/observatorio-dados';
import { t } from '@/app/lib/i18n';
import { AEROPORTO_PORTO } from '@/app/lib/alojamento-aeroporto-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Aeroporto do Porto (INE) - só leitura; cruzado com as dormidas de Braga ═══
export default function Aeroporto() {
  const M = AEROPORTO_PORTO.meses;
  const MC = [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];
  const rot = (m: string) => `${MC[+m.slice(5, 7) - 1]} ${m.slice(2, 4)}`;
  const ult = M[M.length - 1];
  const ult12 = M.slice(-12).reduce((a, x) => a + x.n, 0), ant12 = M.slice(-24, -12).reduce((a, x) => a + x.n, 0);
  const pico = [...M].sort((a, b) => b.n - a.n)[0];
  const dormHom = (m: string) => { const nome = (MESES as string[])[+m.slice(5, 7) - 1]; const y = m.slice(0, 4); const a = (DORMIDAS_BRAGA as any)[nome]?.[y]; const b = (DORMIDAS_BRAGA as any)[nome]?.[String(+y - 1)]; return a && b ? Math.round((a / b - 1) * 1000) / 10 : null; };
  const dados = M.map((x) => ({ mes: rot(x.mes), passageiros: Math.round(x.n / 1000), aeroporto: x.varHom, braga: dormHom(x.mes) }));
  const comAmbos = M.filter((x) => x.varHom != null && dormHom(x.mes) != null);
  const acordo = comAmbos.filter((x) => Math.sign(x.varHom!) === Math.sign(dormHom(x.mes)!)).length;
  return (
    <>
      <SectionTitle sub={`${AEROPORTO_PORTO.fonte} · ${t('atualizado a', 'updated')} ${AEROPORTO_PORTO.atualizado}`}>{t(`${fmt(ult12)} passageiros desembarcaram no Porto nos últimos 12 meses (${ult12 >= ant12 ? '+' : ''}${(((ult12 - ant12) / ant12) * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%)`, `${fmt(ult12)} passengers landed in Porto in the last 12 months (${ult12 >= ant12 ? '+' : ''}${(((ult12 - ant12) / ant12) * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%)`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t(`Último mês · ${rot(ult.mes)}`, `Latest month · ${rot(ult.mes)}`)} value={fmt(ult.n)} sub={ult.varHom != null ? t(`${ult.varHom >= 0 ? '+' : ''}${ult.varHom.toLocaleString('pt-PT')}% face ao ano anterior`, `${ult.varHom >= 0 ? '+' : ''}${ult.varHom.toLocaleString('en-GB')}% year on year`) : ''} color={C.accent} />
        <KPI label={t('Últimos 12 meses', 'Last 12 months')} value={`${(ult12 / 1e6).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 2 })} M`} sub={t('passageiros desembarcados', 'passengers landed')} color={C.positive} />
        <KPI label={t('Mês com mais movimento', 'Busiest month')} value={rot(pico.mes)} sub={`${fmt(pico.n)} ${t('passageiros', 'passengers')}`} color={C.orange} />
        {comAmbos.length > 0 && <KPI label={t('Aeroporto e Braga em sintonia', 'Airport and Braga in step')} value={`${acordo} ${t('de', 'of')} ${comAmbos.length}`} sub={t(`meses em que os passageiros no Porto e as dormidas em Braga subiram ou desceram ao mesmo tempo (${Math.round((acordo / comAmbos.length) * 100)}%)`, `months in which Porto passengers and Braga overnight stays rose or fell together (${Math.round((acordo / comAmbos.length) * 100)}%)`)} color={C.purple} />}
      </div>
      <Card title={t('Passageiros desembarcados por mês (milhares) · últimos 3 anos', 'Passengers landed per month (thousands) · last 3 years')}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={2} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [`${fmt(v)} mil`, t('Passageiros', 'Passengers')]} />
            <Bar dataKey="passageiros" name={t('Passageiros', 'Passengers')} fill={C.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title={t('Variação face ao ano anterior: aeroporto do Porto vs dormidas em Braga (%)', 'Year-on-year change: Porto airport vs Braga overnight stays (%)')}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={2} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [v == null ? '-' : `${String(v).replace('.', ',')}%`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="aeroporto" name={t('Aeroporto do Porto', 'Porto airport')} stroke={C.accent} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="braga" name={t('Dormidas em Braga', 'Braga overnight stays')} stroke={C.orange} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('Quando as duas linhas andam juntas, o aeroporto serve de sinal antecipado: os dados do aeroporto saem antes das dormidas do INE. Este ficheiro traz só o total de passageiros; o país de origem do voo não está incluído.', 'When both lines move together, the airport works as an early signal: airport data is released before INE overnight stays. This file only has total passengers; the flight’s country of origin is not included.')}</div>
      </Card>
    </>
  );
}

