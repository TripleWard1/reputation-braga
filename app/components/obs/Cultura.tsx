'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { BILHETEIRA, BILHETEIRA_FONTE } from '@/app/lib/bilheteira-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Cultura: bilheteira do Theatro Circo, gnration e BMA (FazCultura) - só leitura ═══
export default function Cultura() {
  const ents = ['theatro circo', 'gnration', 'bma'].filter((k) => BILHETEIRA[k]);
  const CORES_E: Record<string, string> = { 'theatro circo': C.accent, gnration: C.positive, bma: C.orange };
  const MC = [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];
  const meses = Array.from(new Set(ents.flatMap((k) => Object.keys(BILHETEIRA[k].meses)))).sort();
  const mensal = meses.map((m) => { const o: any = { mes: `${MC[+m.slice(5, 7) - 1]} ${m.slice(2, 4)}` }; ents.forEach((k) => { o[k] = BILHETEIRA[k].meses[m]?.bilhetes || 0; }); return o; });
  const resumo = ents.map((k) => {
    const b = BILHETEIRA[k]; const ms = Object.values(b.meses);
    const bil = ms.reduce((a, x) => a + x.bilhetes, 0), ses = ms.reduce((a, x) => a + x.sessoes, 0), rec = ms.reduce((a, x) => a + x.receita, 0), conv = ms.reduce((a, x) => a + x.convites, 0);
    const lot = ms.filter((x) => x.lotacao); const ocup = lot.length ? (lot.reduce((a, x) => a + (x.ocupados || 0), 0) / lot.reduce((a, x) => a + (x.lotacao || 0), 0)) * 100 : null;
    return { k, nome: b.entidade, bil, ses, rec, conv, ocup };
  });
  const tc = BILHETEIRA['theatro circo'];
  // 1.º quadrimestre: 2026 vs 2025 (meses comparáveis)
  const q = (k: string, y: string) => ['01', '02', '03', '04'].reduce((a, mm) => a + (BILHETEIRA[k]?.meses[`${y}-${mm}`]?.bilhetes || 0), 0);
  const tc25 = q('theatro circo', '2025'), tc26 = q('theatro circo', '2026');
  const tipos = tc ? Object.entries(tc.tipos).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tipo, v]) => ({ tipo, v })) : [];
  const eur = (v: number) => `${(v / 1000).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} mil €`;
  return (
    <>
      <SectionTitle sub={BILHETEIRA_FONTE}>{tc25 ? t(`Theatro Circo: ${fmt(tc26)} bilhetes de janeiro a abril de 2026 (${tc26 >= tc25 ? '+' : ''}${(((tc26 - tc25) / tc25) * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}% face a 2025)`, `Theatro Circo: ${fmt(tc26)} tickets from January to April 2026 (${tc26 >= tc25 ? '+' : ''}${(((tc26 - tc25) / tc25) * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}% vs 2025)`) : t('Bilheteira cultural', 'Cultural box office')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        {resumo.map((r) => (
          <KPI key={r.k} label={`${r.nome} · ${r.k === 'bma' ? t('jan 2025 a fev 2026 (sem registos em ago 25, mar e abr 26)', 'Jan 2025 to Feb 2026 (no records Aug 25, Mar and Apr 26)') : t('jan 2025 a abr 2026', 'Jan 2025 to Apr 2026')}`} value={fmt(r.bil)} color={CORES_E[r.k]}
            sub={t(`bilhetes · ${fmt(r.ses)} sessões · ${eur(r.rec)}${r.ocup != null ? ` · ocupação ${r.ocup.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}% (2026)` : ''}`, `tickets · ${fmt(r.ses)} sessions · ${eur(r.rec)}${r.ocup != null ? ` · occupancy ${r.ocup.toLocaleString('en-GB', { maximumFractionDigits: 0 })}% (2026)` : ''}`)} />
        ))}
      </div>
      <Card title={t('Bilhetes por mês', 'Tickets per month')}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mensal} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {ents.map((k) => <Bar key={k} dataKey={k} name={BILHETEIRA[k].entidade} stackId="a" fill={CORES_E[k]} />)}
          </BarChart>
        </ResponsiveContainer>
      </Card>
      {tc && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card title={t('Theatro Circo: bilhetes por tipo de espetáculo', 'Theatro Circo: tickets by type of show')}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tipos} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
                <YAxis type="category" dataKey="tipo" width={120} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Bilhetes', 'Tickets')]} />
                <Bar dataKey="v" name={t('Bilhetes', 'Tickets')} fill={C.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card title={t('Theatro Circo: espetáculos com mais público', 'Theatro Circo: shows with the largest audiences')}>
            {tc.topEventos.slice(0, 10).map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${C.border}` : 'none', fontSize: 13.5 }}>
                <span style={{ minWidth: 0 }}>{e.evento} <span style={{ color: C.textDim, fontSize: 12 }}>· {e.periodo}</span></span>
                <strong style={{ whiteSpace: 'nowrap' }}>{fmt(e.bilhetes)}</strong>
              </div>
            ))}
          </Card>
        </div>
      )}
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>{t('Bilhetes emitidos (inclui convites), sem sessões online. A ocupação só existe nos ficheiros de 2026, que trazem a lotação. O cruzamento com os comentários do Google aparece na ficha do local Theatro Circo.', 'Tickets issued (including complimentary), excluding online sessions. Occupancy only exists in 2026 files, which include capacity. The cross-analysis with Google reviews appears in the Theatro Circo place profile.')}</div>
    </>
  );
}

