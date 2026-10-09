'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { DORMIDAS_ANUAL, HEADLINE, TAXA_TURISTICA, BALCAO } from '@/app/lib/observatorio-dados';
import { t, getLang } from '@/app/lib/i18n';
import { estadaRecente, dec2 } from '@/app/lib/estada-media';
import { C, Card, Cruz, KPI, YEAR_COLORS, fmt, fmtE, tipStyle } from './comum';

// ─── VISÃO GERAL ─────────────────────────────────────────────────────────────
export default function Geral({ rep, repL, repR }: { rep?: number | null; repL?: number; repR?: number }) {
  const ER = estadaRecente();
  const PT = getLang() !== 'en';
  const MES = ER ? (getLang() === 'es' ? ER.mesEs : ER.mesPt) : '';
  const dormDataAnual = Object.entries(DORMIDAS_ANUAL).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, dormidas: v as number }));
  const taxaAnual = Object.entries(TAXA_TURISTICA).map(([y, m]) => ({ ano: y, total: y === '2026' ? Object.entries(m).filter(([k]) => k !== 'Total').reduce((s, [, v]) => s + v, 0) : (m.Total || 0) }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Dormidas 2025', 'Overnight stays 2025')} value={fmt(HEADLINE.dormidas2025)} sub={`+${HEADLINE.dormidasVar}% ${t('homólogo · provisório', 'YoY · provisional')}`} color={HEADLINE.dormidasVar >= 0 ? C.positive : C.negative} />
        <KPI label={t('Hóspedes 2025', 'Guests 2025')} value={fmt(HEADLINE.hospedes2025)} sub={`+${HEADLINE.hospedesVar}% ${t('homólogo', 'YoY')}`} color={C.accentLight} />
        <KPI label={t('Taxa Turística 2025', 'Tourist Tax 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} sub={t('faturação (receita municipal)', 'invoiced (municipal revenue)')} color={C.accent} />
        <KPI label={t('Atendimentos Balcão 2025', 'Front Desk Visits 2025')} value={fmt(BALCAO['2025'].atendimentos)} sub={`${fmt(BALCAO['2025'].pax)} pax`} color={C.info} />
        {ER ? <KPI label={t('Estada Média', 'Average Stay')} value={`${dec2(ER.valor, PT)} ${t('noites', 'nights')}`} sub={t(`janeiro a ${MES} de ${ER.ano} (INE, provisório) · ${dec2(ER.valorAnterior, true)} no mesmo período de ${Number(ER.ano) - 1} · ${dec2(ER.valorAnoCompleto, true)} em ${ER.anoCompleto}`, `January to ${ER.mesEn} ${ER.ano} (INE, provisional) · ${dec2(ER.valorAnterior, false)} in the same period of ${Number(ER.ano) - 1} · ${dec2(ER.valorAnoCompleto, false)} in ${ER.anoCompleto}`)} color={C.purple} /> : <KPI label={t('Estada Média', 'Average Stay')} value={`${HEADLINE.estadaMedia.Braga}`} sub={t('noites (INE 2024)', 'nights (INE 2024)')} color={C.purple} />}
        <KPI label={t('Ocupação-quarto', 'Room Occupancy')} value={`${HEADLINE.ocupQuarto.Braga}%`} sub={t('líquida (INE 2024)', 'net (INE 2024)')} color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Dormidas anuais em Braga (INE/TravelBI)', 'Annual overnight stays in Braga (INE/TravelBI)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dormDataAnual} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Dormidas', 'Overnight stays')]} />
              <Bar dataKey="dormidas" radius={[4, 4, 0, 0]}>
                {dormDataAnual.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Receita da Taxa Municipal Turística (€/ano)', 'Municipal Tourist Tax revenue (€/year)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taxaAnual} margin={{ top: 6, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), t('Receita', 'Revenue')]} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {taxaAnual.map((d) => <Cell key={d.ano} fill={d.ano === '2026' ? C.textDim : C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>{t('2026 parcial (jan–jun; abr–jun provisórios). O salto reflete a cobrança passar a ser feita todo o ano desde o fim de julho de 2025 (Regulamento n.º 927/2025; antes, só de março a outubro), com o mesmo valor de 1,50 €/dormida.', '2026 partial (Jan–Jun; Apr–Jun provisional). The jump reflects collection being extended to the whole year (previously March to October only), at the same €1.50/overnight.')}</p>
        </Card>
      </div>

      <Card title={t('Cruzamento Reputação Online × Procura Real', 'Online Reputation × Real Demand Cross-analysis')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Cruz label={t('Reputação média (plataforma)', 'Average reputation (platform)')} value={rep != null ? `${rep.toFixed(1)}/10` : '-'} color={C.accent} nota={`${repL ?? 0} ${t('locais', 'places')} · ${fmt(repR ?? 0)} reviews`} />
          <Cruz label={t('Dormidas 2025 (INE)', 'Overnight stays 2025 (INE)')} value={fmt(HEADLINE.dormidas2025)} color={C.info} nota={`+${HEADLINE.dormidasVar}% ${t('homólogo', 'YoY')}`} />
          <Cruz label={t('Atendimentos balcão 2025', 'Front desk visits 2025')} value={fmt(BALCAO['2025'].atendimentos)} color={C.positive} nota={`${fmt(BALCAO['2025'].pax)} ${t('pessoas atendidas (pax)', 'people served (pax)')}`} />
          <Cruz label={t('Receita taxa 2025', 'Tax revenue 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} color={C.purple} nota={t('dado próprio do Município', 'Municipality\u2019s own data')} />
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '14px 0 0', lineHeight: 1.6 }}>
          {t('Três fontes distintas, com leituras complementares: o que as pessoas ', 'Three distinct sources with complementary readings: what people ')}<strong>{t('dizem', 'say')}</strong>{t(' (reputação), onde ', ' (reputation), where they ')}<strong>{t('dormem', 'sleep')}</strong>{t(' (INE + taxa) e o que ', ' (INE + tax) and what they ')}<strong>{t('procuram', 'seek')}</strong>{t(' ao balcão. Cruzá-las pode ajudar a detetar sinais precoces (hipótese a testar; a plataforma não mede essa relação).', ' at the front desk. Crossing them may help detect early signals (a hypothesis to test; the platform does not measure that relationship).')}
        </p>
      </Card>
    </>
  );
}

