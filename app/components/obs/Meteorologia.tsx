'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BALCAO_DIARIO, BALCAO_LAT, BALCAO_LON, BALCAO_DIARIO_INICIO, BALCAO_DIARIO_FIM } from '@/app/lib/acessibilidade-meteo-dados';
import { t } from '@/app/lib/i18n';
import { C, Card, SectionTitle, tipStyle } from './comum';

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxy += dx * dy; sxx += dx * dx; syy += dy * dy; }
  const den = Math.sqrt(sxx * syy);
  return den === 0 ? NaN : sxy / den;
}

const corrLabel = (r: number): string => {
  if (isNaN(r)) return '-';
  const a = Math.abs(r);
  const f = a < 0.2 ? t('muito fraca', 'very weak') : a < 0.4 ? t('fraca', 'weak') : a < 0.6 ? t('moderada', 'moderate') : t('forte', 'strong');
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)} (${f})`;
};

// ─── Meteorologia × Afluência (open-meteo) ───
export default function Meteorologia() {
  const [wx, setWx] = useState<Record<string, { tmax: number; precip: number }> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cap = new Date(); cap.setDate(cap.getDate() - 5);
        const capStr = cap.toISOString().slice(0, 10);
        const endDate = BALCAO_DIARIO_FIM < capStr ? BALCAO_DIARIO_FIM : capStr;
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${BALCAO_LAT}&longitude=${BALCAO_LON}&start_date=${BALCAO_DIARIO_INICIO}&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=Europe%2FLisbon`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const map: Record<string, { tmax: number; precip: number }> = {};
        (j.daily.time as string[]).forEach((d, i) => {
          map[d] = { tmax: j.daily.temperature_2m_max[i], precip: j.daily.precipitation_sum[i] };
        });
        if (alive) { setWx(map); setStatus('ok'); }
      } catch (e: any) {
        if (alive) { setErr(e?.message || 'erro'); setStatus('error'); }
      }
    })();
    return () => { alive = false; };
  }, []);

  if (status === 'loading') {
    return <div style={{ padding: '50px 0', textAlign: 'center', color: C.textDim, fontSize: 14 }}>{t('A obter dados meteorológicos (open-meteo)…', 'Fetching weather data (open-meteo)…')}</div>;
  }
  if (status === 'error' || !wx) {
    return (
      <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}40`, borderRadius: 10, padding: '16px 18px', color: C.negative, fontSize: 13 }}>
        {t('Não foi possível obter os dados meteorológicos. Detalhe:', 'Could not fetch the weather data. Detail:')} {err}{t('. A API open-meteo é gratuita e sem chave - confirma a ligação e tenta novamente.', '. The open-meteo API is free and key-less - check the connection and try again.')}
      </div>
    );
  }

  const joined = BALCAO_DIARIO
    .map(([d, n]) => { const w = wx[d]; return w ? { d, n, tmax: w.tmax, precip: w.precip, ano: +d.slice(0, 4) } : null; })
    .filter(Boolean) as { d: string; n: number; tmax: number; precip: number; ano: number }[];

  const avg = (a: { n: number }[]) => (a.length ? a.reduce((s, r) => s + r.n, 0) / a.length : 0);
  const perYear = [2025, 2026].map((ano) => {
    const rows = joined.filter((r) => r.ano === ano);
    const dry = rows.filter((r) => r.precip < 1);
    const rainy = rows.filter((r) => r.precip >= 1);
    return {
      ano, n: rows.length,
      dryAvg: avg(dry), rainyAvg: avg(rainy), dryN: dry.length, rainyN: rainy.length,
      corrTemp: pearson(rows.map((r) => r.tmax), rows.map((r) => r.n)),
      corrPrec: pearson(rows.map((r) => r.precip), rows.map((r) => r.n)),
    };
  }).filter((y) => y.n > 0);

  // Agregação semanal (segunda-feira) para o gráfico
  const weeks: Record<string, { atSum: number; atN: number; tSum: number; order: number }> = {};
  joined.forEach((r) => {
    const dt = new Date(r.d + 'T00:00:00');
    const off = (dt.getDay() + 6) % 7;
    const mon = new Date(dt); mon.setDate(dt.getDate() - off);
    const key = mon.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = { atSum: 0, atN: 0, tSum: 0, order: mon.getTime() };
    weeks[key].atSum += r.n; weeks[key].atN += 1; weeks[key].tSum += r.tmax;
  });
  const weekly = Object.entries(weeks).sort((a, b) => a[1].order - b[1].order).map(([key, w]) => ({
    sem: key.slice(5).replace('-', '/'),
    atend: Math.round(w.atSum / Math.max(w.atN, 1)),
    temp: +(w.tSum / Math.max(w.atN, 1)).toFixed(1),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={`${t('Atendimentos do balcão × meteorologia ·', 'Front desk visits × weather ·')} ${BALCAO_DIARIO.length} ${t('dias', 'days')}`}>{t('Meteorologia e Afluência', 'Weather and Footfall')}</SectionTitle>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>{t('Leitura exploratória', 'Exploratory reading')}</div>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
          {t('A afluência ao balcão depende sobretudo da época do ano, do dia da semana e de eventos - não só do tempo. Além disso, 2026 tem um nível de registo muito superior a 2025. Por isso a análise é feita', 'Front desk footfall depends mostly on the time of year, the day of the week and events - not just the weather. Moreover, 2026 has a much higher recording level than 2025. The analysis is therefore done')} <strong>{t('separadamente por ano', 'separately by year')}</strong>{t(' e deve ser lida como exploratória, não como prova de causa-efeito.', ' and should be read as exploratory, not as proof of cause and effect.')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {perYear.map((y) => {
          const mx = Math.max(y.dryAvg, y.rainyAvg, 1);
          return (
            <Card key={y.ano} title={`${y.ano} · ${y.n} ${t('dias com dados', 'days with data')}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>{t('Dias secos', 'Dry days')} ({y.dryN})</span>
                    <span style={{ color: C.textMuted }}>{y.dryAvg.toFixed(1)} {t('atend./dia', 'visits/day')}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div className="obs-grow" style={{ width: `${(y.dryAvg / mx) * 100}%`, height: '100%', background: C.accent }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>{t('Dias de chuva', 'Rainy days')} ({y.rainyN})</span>
                    <span style={{ color: C.textMuted }}>{y.rainyAvg.toFixed(1)} {t('atend./dia', 'visits/day')}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div className="obs-grow" style={{ width: `${(y.rainyAvg / mx) * 100}%`, height: '100%', background: C.info }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>
                  <span>{t('Correlação c/ temperatura:', 'Correlation w/ temperature:')} <strong style={{ color: C.text }}>{corrLabel(y.corrTemp)}</strong></span>
                </div>
                <div style={{ fontSize: 11.5, color: C.textMuted }}>
                  {t('Correlação c/ precipitação:', 'Correlation w/ precipitation:')} <strong style={{ color: C.text }}>{corrLabel(y.corrPrec)}</strong>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title={t('Evolução semanal - atendimento médio vs temperatura máxima média', 'Weekly evolution - average visits vs average max temperature')}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={weekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="sem" stroke={C.textDim} tick={{ fontSize: 9, fill: C.textMuted }} interval={9} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}°`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(v: any, name: any) => [name === 'temp' ? `${v}°C` : v, name === 'temp' ? t('Temp. máx. média', 'Avg max temp.') : t('Atend./dia (média)', 'Visits/day (avg)')]} />
            <Bar yAxisId="l" dataKey="atend" fill={C.accent} radius={[3, 3, 0, 0]} opacity={0.85} />
            <Line yAxisId="r" dataKey="temp" stroke={C.orange} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        {t('Fonte meteorológica: open-meteo.com', 'Weather source: open-meteo.com')} ({t('arquivo histórico, gratuito, sem chave', 'historical archive, free, key-less')}){t(', coordenadas', ', coordinates')} {BALCAO_LAT}, {BALCAO_LON}{t('. Dia de chuva = precipitação ≥ 1 mm. Atendimento = registos do balcão por dia.', '. Rainy day = precipitation ≥ 1 mm. Visits = front desk records per day.')}
      </p>
    </div>
  );
}

