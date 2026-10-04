'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { MESES, MESES_CURTO, DORMIDAS_BRAGA, HOSPEDES_BRAGA, DORMIDAS_ANUAL, HOSPEDES_ANUAL, SUSTENTABILIDADE, SEMESTRE_2026 } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, Chips, YEAR_COLORS, fmt, tipStyle } from './comum';

// ─── PROCURA (INE) ───────────────────────────────────────────────────────────
export default function Procura() {
  const [metric, setMetric] = useState<'dormidas' | 'hospedes'>('dormidas');
  const [anos, setAnos] = useState<string[]>(['2024', '2025', '2026']);
  const src = metric === 'dormidas' ? DORMIDAS_BRAGA : HOSPEDES_BRAGA;
  const data = MESES.map((m, i) => {
    const row: any = { mes: dl(MESES_CURTO[i]) };
    anos.forEach((y) => { row[y] = src[m]?.[y] ?? null; });
    return row;
  });
  const todosAnos = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const toggleAno = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const anual = metric === 'dormidas' ? DORMIDAS_ANUAL : HOSPEDES_ANUAL;
  const anualData = Object.entries(anual).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, v: v as number }));

  // 2026 em curso (meses com dados)
  const meses26 = MESES.filter((m) => DORMIDAS_BRAGA[m]?.['2026'] != null);
  const somaY = (src: Record<string, Record<string, number | null>>, y: string) => meses26.reduce((s, m) => s + (src[m]?.[y] ?? 0), 0);
  const d26 = somaY(DORMIDAS_BRAGA, '2026'), d25p = somaY(DORMIDAS_BRAGA, '2025');
  const h26 = somaY(HOSPEDES_BRAGA, '2026'), h25p = somaY(HOSPEDES_BRAGA, '2025');
  const dVar26 = d25p ? (d26 / d25p - 1) * 100 : 0;
  const hVar26 = h25p ? (h26 / h25p - 1) * 100 : 0;
  const periodo26 = meses26.length ? `${dl(MESES_CURTO[MESES.indexOf(meses26[0])])}–${dl(MESES_CURTO[MESES.indexOf(meses26[meses26.length - 1])])} 2026` : '';
  const fnum = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'));
  const fvar = (v: number) => (v >= 0 ? '+' : '') + String(+v.toFixed(1)).replace('.', t(',', '.')) + '%';

  return (
    <>
      {meses26.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', background: C.cardAlt, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, borderRadius: 12, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, background: C.accentBg, padding: '4px 10px', borderRadius: 20 }}>{t('2026 em curso', '2026 in progress')}</span>
            <span style={{ fontSize: 12, color: C.textDim }}>{periodo26}</span>
          </div>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{fnum(d26)}</span>
              <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 6 }}>{t('dormidas', 'overnight stays')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: dVar26 >= 0 ? C.positive : C.negative, marginLeft: 8 }}>{fvar(dVar26)}</span>
            </div>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{fnum(h26)}</span>
              <span style={{ fontSize: 12, color: C.textMuted, marginLeft: 6 }}>{t('hóspedes', 'guests')}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: hVar26 >= 0 ? C.positive : C.negative, marginLeft: 8 }}>{fvar(hVar26)}</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: C.textDim, marginLeft: 'auto' }}>{t('face ao mesmo período de 2025', 'vs the same period in 2025')}</span>
        </div>
      )}

      <Card title={`${metric === 'dormidas' ? t('Dormidas', 'Overnight stays') : t('Hóspedes', 'Guests')} ${t('mensais em Braga - comparação plurianual', 'monthly in Braga - multi-year comparison')}`}
        right={<div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chips options={['dormidas', 'hospedes']} sel={[metric]} toggle={(o) => setMetric(o as any)} single label={(o) => o === 'dormidas' ? t('Dormidas', 'Overnight stays') : t('Hóspedes', 'Guests')} />
          <Chips options={todosAnos} sel={anos} toggle={toggleAno} />
        </div>}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 6, right: 10, left: -6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {anos.map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2025' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>{t('Fonte: INE / TravelBI. 2025 é ano completo; os dados de 2026 estão disponíveis até onde o INE consolidou (lag habitual de ~3 meses).', 'Source: INE / TravelBI. 2025 is a complete year; 2026 data is available as far as INE has consolidated (usual lag of ~3 months).')}</p>
      </Card>

      <Card title={`${t('Total anual de', 'Annual total of')} ${metric === 'dormidas' ? t('dormidas', 'overnight stays') : t('hóspedes', 'guests')} ${t('(anos completos)', '(complete years)')}`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={anualData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), metric === 'dormidas' ? t('Dormidas', 'Overnight stays') : t('Hóspedes', 'Guests')]} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>{anualData.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>{t('Nota: a quebra de 2020–2021 reflete a pandemia. Recuperação plena a partir de 2022.', 'Note: the 2020–2021 drop reflects the pandemic. Full recovery from 2022 onwards.')}</p>
      </Card>

      {(() => {
        const sazAno = '2025';
        const sazVals = MESES.map((m) => DORMIDAS_BRAGA[m]?.[sazAno] ?? 0);
        const sazTotal = sazVals.reduce((s, v) => s + v, 0);
        let peakI = 0, troughI = 0;
        sazVals.forEach((v, i) => { if (v > sazVals[peakI]) peakI = i; if (v < sazVals[troughI]) troughI = i; });
        const peakShare = sazTotal ? (sazVals[peakI] / sazTotal) * 100 : 0;
        const ratio = sazVals[troughI] ? sazVals[peakI] / sazVals[troughI] : 0;
        const Ds = SUSTENTABILIDADE.destino;
        const fdec = (v: number) => String(v).replace('.', t(',', '.'));
        const bar = (label: string, v: number, color: string) => (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 5 }}>
              <span>{label}</span><span style={{ color: C.text, fontWeight: 600 }}>{fdec(v)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: C.border, overflow: 'hidden' }}>
              <div className="obs-grow" style={{ width: `${Math.min(100, (v / 45) * 100)}%`, height: '100%', borderRadius: 5, background: color }} />
            </div>
          </div>
        );
        return (
          <Card title={t('Sazonalidade da procura', 'Demand seasonality')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22, alignItems: 'center' }}>
              <div>
                {bar('Braga', Ds.sazonalidade, C.positive)}
                {bar(t('Média nacional', 'National average'), Ds.sazonalidadeNacional, C.textMuted)}
                <p style={{ fontSize: 11, color: C.textDim, margin: '4px 0 0' }}>{t('Índice de sazonalidade: quanto menor, mais equilibrada é a procura ao longo do ano.', 'Seasonality index: the lower it is, the more balanced demand is across the year.')}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{dl(MESES_CURTO[peakI])}</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6 }}>{t('mês de pico', 'peak month')} · {fdec(+peakShare.toFixed(1))}% {t('do ano', 'of the year')}</div>
                </div>
                <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.info, lineHeight: 1 }}>{fdec(+ratio.toFixed(1))}×</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6 }}>{t('rácio pico/vale', 'peak/trough ratio')} ({dl(MESES_CURTO[peakI])} vs {dl(MESES_CURTO[troughI])})</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, margin: '16px 0 0' }}>
              {t('Braga é menos sazonal do que a média nacional (', 'Braga is less seasonal than the national average (')}{fdec(Ds.sazonalidade)}% vs {fdec(Ds.sazonalidadeNacional)}%{t('), sinal de uma procura mais distribuída ao longo do ano. Ainda assim, agosto concentra o pico e o inverno regista os vales, pelo que há margem para reforçar a procura na época baixa (eventos, turismo religioso, Caminhos de Santiago). Fonte do índice: Green Destinations · curva mensal: INE/TravelBI ', '), a sign of demand more evenly spread across the year. Even so, August holds the peak and winter records the troughs, so there is room to strengthen demand in the low season (events, religious tourism, Camino de Santiago). Index source: Green Destinations · monthly curve: INE/TravelBI ')}({sazAno}).
            </p>
          </Card>
        );
      })()}

      {(() => {
        const top = SEMESTRE_2026.topMunicipios.map(([nome, a, b]) => ({ nome, d2025: a, d2026: b, variacao: Math.round(((b - a) / a) * 1000) / 10 }));
        const posBraga = top.filter((x) => x.nome !== 'Ourém').findIndex((x) => x.nome === 'Braga') + 1;
        return (
          <Card title={t('Destinos regionais com mais dormidas - 1.º semestre de 2026', 'Regional destinations with the most overnight stays - 1st half of 2026')}>
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={84} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
                <Bar dataKey="d2026" name={t('Dormidas 2026', 'Overnight stays 2026')} radius={[0, 4, 4, 0]}>
                  {top.map((d) => <Cell key={d.nome} fill={d.nome === 'Braga' ? C.accent : C.textDim} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {top.map((m) => (
                <span key={m.nome} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 7, background: m.nome === 'Braga' ? C.accentBg : C.bg, border: `1px solid ${C.border}`, color: m.variacao >= 0 ? C.positive : C.negative }}>
                  {m.nome} {m.variacao >= 0 ? '+' : ''}{m.variacao.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })}%
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, margin: '12px 0 0' }}>
              {t(`Excluindo Ourém (procura marcada pelo Santuário de Fátima, não diretamente comparável), Braga é o ${posBraga}.º destino regional em dormidas no 1.º semestre e um dos poucos do grupo a crescer.`, `Excluding Ourém (demand driven by the Fátima Sanctuary, not directly comparable), Braga is the no. ${posBraga} regional destination by overnight stays in the 1st half and one of the few in the group to grow.`)}
            </p>
            <p style={{ fontSize: 11, color: C.textDim, margin: '6px 0 0' }}>
              {t('Municípios excluindo as Áreas Metropolitanas de Lisboa e do Porto, o Algarve e as Regiões Autónomas. Fonte: INE/TravelBI, jan–jun.', 'Municipalities excluding the Lisbon and Porto Metropolitan Areas, the Algarve and the Autonomous Regions. Source: INE/TravelBI, Jan–Jun.')}
            </p>
          </Card>
        );
      })()}
    </>
  );
}

