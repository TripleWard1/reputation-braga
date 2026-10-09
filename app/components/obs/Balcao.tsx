'use client';

import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MESES, MESES_CURTO, BALCAO } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, Chips, HBars, KPI, fmt, tipStyle } from './comum';

// ─── ATENDIMENTO BALCÃO ──────────────────────────────────────────────────────
export default function Balcao() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  const mensal = MESES.map((m, i) => {
    const v = b.mensal[String(i + 1)];
    return { mes: dl(MESES_CURTO[i]), atendimentos: v ? v[0] : null, pax: v ? v[1] : null };
  });
  const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          {t('Dados do Posto de Turismo - cada registo é um atendimento ao balcão; as listas por categoria contam atendimentos, não pessoas.', 'Tourist Office data - each record is one front desk visit; category lists count visits, not people.')} {ano === '2026' ? t('Ano em curso · de 1 de janeiro a 24 de setembro (setembro parcial).', 'Year in progress · from 1 January to 24 September (September partial).') : t('Ano completo.', 'Complete year.')}
        </p>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Atendimentos', 'Visits')} value={fmt(b.atendimentos)} color={C.accent} />
        <KPI label={t('Pessoas (pax)', 'People (pax)')} value={fmt(b.pax)} color={C.accentLight} />
        <KPI label={t('Visitantes', 'Visitors')} value={`${pctVisit}%`} sub={`${fmt(b.visitantes)} ${t('atendimentos a turistas', 'visits by tourists')}`} color={C.info} />
        <KPI label={t('Peregrinos', 'Pilgrims')} value={fmt(b.peregrinos)} sub="Caminhos de Santiago" color={C.purple} />
        <KPI label={t('Grupos', 'Groups')} value={fmt(b.grupos)} color={C.cyan} />
        <KPI label={t('Com crianças', 'With children')} value={fmt(b.criancas)} color={C.pink} />
      </div>

      <Card title={`${t('Atendimentos e pessoas por mês -', 'Visits and people per month -')} ${ano}`}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={mensal} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="atendimentos" name={t('Atendimentos', 'Visits')} fill={C.accent} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="pax" name={t('Pessoas (pax)', 'People (pax)')} stroke={C.info} strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`${t('O que procuram (interesses) -', 'What they look for (interests) -')} ${ano}`}><HBars data={b.interesses.slice(0, 10)} color={C.accent} /></Card>
        <Card title={`${t('Nacionalidades -', 'Nationalities -')} ${ano}`}><HBars data={b.nacionalidades.slice(0, 10)} color={C.info} /></Card>
        {b.meioChegada.length > 0 && <Card title={`${t('Meio de chegada -', 'Means of arrival -')} ${ano}`}><HBars data={b.meioChegada} color={C.positive} /></Card>}
        {b.alojamento.length > 0 && <Card title={`${t('Tipo de alojamento -', 'Accommodation type -')} ${ano}`}><HBars data={b.alojamento} color={C.purple} /></Card>}
      </div>

      {ano === '2025' && (
        <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}30`, borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          {t('Nota: em 2025 o registo de “meio de chegada”, alojamento, cidade e parte dos interesses ainda não era sistemático, e alguns registos agregam grupos grandes (até 250 pessoas num só registo), daí cerca de 7,7 pessoas por registo. A partir de 2026 a recolha é muito mais completa: evite comparar 2025 com 2026.', 'Note: in 2025 the recording of “means of arrival”, accommodation, city and part of the interests was not yet systematic, and some records aggregate large groups (up to 250 people in a single record), hence about 7.7 people per record. From 2026 data collection is much more complete: avoid comparing 2025 with 2026.')}
        </div>
      )}
    </>
  );
}

