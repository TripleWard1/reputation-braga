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
        <KPI label={t('Faturação 2026 (jan–jun)', 'Invoiced 2026 (Jan–Jun)')} value={fmtE(acum2026)} sub={t('provisório', 'provisional')} color={C.cyan} />
        <KPI label={t('Faturação 2025', 'Invoiced 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="+23% vs 2024" color={C.positive} />
        <KPI label={t('Faturação 2024', 'Invoiced 2024')} value={fmtE(TAXA_TURISTICA['2024'].Total)} color={C.accent} />
        <KPI label={t('Empreendimentos', 'Establishments')} value={fmt(INFRA.empreendimentos)} sub={t('na lista da taxa turística (inclui um hotel encerrado e o parque de campismo; sem data)', 'on the tourist tax list (includes a closed hotel and the campsite; undated)')} color={C.info} />
        <KPI label={t('Alojamento Local', 'Local Accommodation')} value={fmt(INFRA.alojamentoLocal)} sub={t('registos na lista da taxa turística (inclui inativos; 542 ativos no separador Alojamento Local)', 'records on the tourist tax list (includes inactive; 542 active in the Short-term rentals tab)')} color={C.purple} />
      </div>

      <Card title={t('Faturação mensal da Taxa Municipal Turística (€)', 'Monthly Municipal Tourist Tax invoicing (€)')}
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
          {t('Reg. n.º 927/2025 · 1,50 €/dormida · até 4 noites seguidas · hóspedes com 16 ou mais anos. O salto de 2026 (jan:', 'Reg. no. 927/2025 · €1.50/overnight · up to 4 consecutive nights · guests aged 16 or over. The 2026 jump (Jan:')} {fmtE(TAXA_TURISTICA['2026'].Janeiro)}{t(') reflete o alargamento da cobrança a todo o ano, em vigor desde o fim de julho de 2025 (antes, só de março a outubro), com o mesmo valor de 1,50 €. Isenções: deslocações por motivos de saúde (com um acompanhante), incapacidade igual ou superior a 60% e alojamento por emergência social ou proteção civil. Até março de 2026, os valores são de faturação emitida (podem incluir faturas anuladas depois); abril a junho de 2026 são valores cobrados até 30/06/2026, ainda provisórios. Cada valor está no mês da fatura, não no mês da dormida.', ') reflects collection being extended to the whole year, in force since late July 2025 (previously March to October only), at the same €1.50. Exemptions: travel for medical reasons (with one companion), disability of 60% or more, and accommodation due to a social or civil protection emergency. Up to March 2026, figures are invoices issued (they may include invoices cancelled later); April to June 2026 are amounts collected up to 30/06/2026, still provisional. Each value sits in the invoice month, not the month of the stay.')}
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

