'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { MESES, INFRA, TAXA_TURISTICA } from '@/app/lib/observatorio-dados';
import { t } from '@/app/lib/i18n';
import { C, Card, Chips, KPI, YEAR_COLORS, fmt, fmtE, tipStyle } from './comum';
import SimuladorTaxa from './SimuladorTaxa';

export default function Taxa() {
  const [anos, setAnos] = useState<string[]>(['2023', '2024', '2025']);
  const todos = ['2021', '2022', '2023', '2024', '2025', '2026'];
  const toggle = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const mensal = MESES.map((m) => {
    const row: any = { mes: m.slice(0, 3) };
    anos.forEach((y) => { row[y] = TAXA_TURISTICA[y]?.[m] ?? null; });
    return row;
  });
  const totais = ['2021', '2022', '2023', '2024', '2025'].map((y) => ({ ano: y, total: TAXA_TURISTICA[y].Total }));
  const acum2026 = Object.entries(TAXA_TURISTICA['2026']).filter(([k]) => k !== 'Total').reduce((s, [, v]) => s + v, 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Receita 2026 (jan–jun)', 'Revenue 2026 (Jan–Jun)')} value={fmtE(acum2026)} sub={t('provisório', 'provisional')} color={C.cyan} />
        <KPI label={t('Receita 2025', 'Revenue 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="+23% vs 2024" color={C.positive} />
        <KPI label={t('Receita 2024', 'Revenue 2024')} value={fmtE(TAXA_TURISTICA['2024'].Total)} color={C.accent} />
        <KPI label={t('Empreendimentos', 'Establishments')} value={fmt(INFRA.empreendimentos)} sub={t('hotéis e similares', 'hotels and similar')} color={C.info} />
        <KPI label={t('Alojamento Local', 'Local Accommodation')} value={fmt(INFRA.alojamentoLocal)} sub={t('registos AL', 'AL registrations')} color={C.purple} />
      </div>

      <Card title={t('Receita mensal da Taxa Municipal Turística (€)', 'Monthly Municipal Tourist Tax revenue (€)')}
        right={<Chips options={todos} sel={anos} toggle={toggle} />}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mensal} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmtE(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {anos.map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2026' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          {t('Reg. n.º 927/2025 · 1,50 €/dormida · até 4 noites · hóspedes > 16 anos. O salto de 2026 (jan:', 'Reg. no. 927/2025 · €1.50/overnight · up to 4 nights · guests > 16 years. The 2026 jump (Jan:')} {fmtE(TAXA_TURISTICA['2026'].Janeiro)}{t(') reflete o alargamento da cobrança a todo o ano, em vigor desde o fim de julho de 2025 (antes, só de março a outubro), com o mesmo valor de 1,50 €. Isenções: deslocações por motivos de saúde (com um acompanhante), incapacidade igual ou superior a 60% e alojamento por emergência social ou proteção civil. Abril a junho são provisórios: apurados sobre documentos cobrados até 30/06/2026.', ') reflects collection being extended to the whole year, in force since late July 2025 (previously March to October only), at the same €1.50. Exemptions: travel for medical reasons (with one companion), disability of 60% or more, and accommodation due to a social or civil protection emergency. April to June are provisional: based on documents collected up to 30/06/2026.')}
        </p>
      </Card>

      <Card title={t('Receita anual total (€)', 'Total annual revenue (€)')}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={totais} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), t('Receita', 'Revenue')]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>{totais.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <SimuladorTaxa />
    </>
  );
}

