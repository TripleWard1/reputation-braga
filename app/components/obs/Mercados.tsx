'use client';

import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BALCAO, SEMESTRE_2026 } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, Chips, HBars, fmt, tipStyle } from './comum';

// ─── MERCADOS ────────────────────────────────────────────────────────────────
export default function Mercados() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  const S = SEMESTRE_2026;
  const mercDorm = S.mercadosDormidas.map(([p, a, b]) => ({ pais: dl(p), v2025: a, v2026: b, variacao: Math.round(((b - a) / a) * 1000) / 10 }));
  const pctEstr = Math.round((S.residencia.dormidas.Estrangeiro / (S.residencia.dormidas.Estrangeiro + S.residencia.dormidas.Portugal)) * 100);
  const ord = [...mercDorm].sort((x, y) => y.variacao - x.variacao);
  const fmtV = (m: { pais: string; variacao: number }) => `${m.pais} (${m.variacao >= 0 ? '+' : ''}${m.variacao.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })}%)`;
  const subidas = ord.slice(0, 3).map(fmtV).join(', ');
  const descidas = ord.filter((m) => m.variacao < 0).map(fmtV).join(', ');
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`${t('Nacionalidades no balcão -', 'Nationalities at the front desk -')} ${ano}`}>
          <HBars data={b.nacionalidades.slice(0, 12)} />
        </Card>
        <Card title={`${t('Cidades de origem dos visitantes -', 'Cities of origin of visitors -')} ${ano}`}>
          <HBars data={b.cidades.slice(0, 12)} color={C.info} />
        </Card>
      </div>
      <Card title={t('Mercados emissores internacionais - dormidas no 1.º semestre (INE)', 'International source markets - overnight stays in the 1st half (INE)')}>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={mercDorm} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="pais" width={104} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="v2025" name="2025" fill={C.textDim} radius={[0, 3, 3, 0]} />
            <Bar dataKey="v2026" name="2026" fill={C.accent} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {mercDorm.map((m) => (
            <span key={m.pais} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, color: m.variacao >= 0 ? C.positive : C.negative }}>
              {m.pais} {m.variacao >= 0 ? '+' : ''}{m.variacao.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })}%
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: C.textMuted, margin: '12px 0 0', lineHeight: 1.6 }}>
          {t('Os mercados estrangeiros já valem', 'Foreign markets now account for')} <strong style={{ color: C.text }}>{pctEstr}%</strong> {t('das dormidas em Braga no 1.º semestre de 2026. Maiores subidas entre os principais mercados:', 'of overnight stays in Braga in the 1st half of 2026. Largest increases among the main markets:')} {subidas}{t('. Em recuo:', '. Declining:')} {descidas}.
        </p>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          {t('Fonte: INE, dormidas por país de residência, jan–jun. Comparação disponível para os 10 principais mercados de cada ano.', 'Source: INE, overnight stays by country of residence, Jan–Jun. Comparison available for the top 10 markets of each year.')}
        </p>
      </Card>
    </>
  );
}

