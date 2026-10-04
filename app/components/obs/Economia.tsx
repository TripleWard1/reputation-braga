'use client';

import { ResponsiveContainer, LineChart, BarChart, AreaChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MESES, MESES_CURTO, DORMIDAS_BRAGA, REVPAR_MENSAL, ADR_ANUAL, HEADLINE, INFRA, QUARTOS, CAPACIDADE_CAMAS, ALOJAMENTO_FREGUESIA, SEMESTRE_2026, DORMIDAS_PORTUGAL } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, KPI, SectionTitle, YEAR_COLORS, fmt, fmtE, tipStyle } from './comum';

function CompareBars({ title, vals, unit = '' }: { title: string; vals: Record<string, number>; unit?: string }) {
  const max = Math.max(...Object.values(vals), 1);
  const cor: Record<string, string> = { Braga: C.accent, Norte: C.positive, Portugal: C.info };
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(vals).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 64, fontSize: 11, color: C.textMuted }}>{dl(k)}</span>
            <div style={{ flex: 1, height: 18, borderRadius: 5, background: C.card, overflow: 'hidden' }}>
              <div className="obs-grow" style={{ width: `${(v / max) * 100}%`, height: '100%', background: cor[k] || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.bg }}>{v}{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ECONOMIA ────────────────────────────────────────────────────────────────
export default function Economia() {
  const revparData = MESES.map((m, i) => {
    const row: any = { mes: dl(MESES_CURTO[i]) };
    ['2022', '2023', '2024', '2025', '2026'].forEach((y) => { row[y] = REVPAR_MENSAL[m]?.[y] ?? null; });
    return row;
  });
  const adrData = Object.entries(ADR_ANUAL).map(([y, v]) => ({ ano: y, adr: v }));

  // ── 1.º semestre de 2026 (INE) - mesmo método nos dois anos ──
  const S = SEMESTRE_2026;
  const H1 = MESES.slice(0, 6);
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const media = (v: number[]) => soma(v) / v.length;
  const somaH1 = (serie: Record<string, Record<string, number | null>>, y: string) => H1.reduce((acc, m) => acc + (serie[m]?.[y] ?? 0), 0);
  const varP = (a: number, b: number) => Math.round((b / a - 1) * 1000) / 10;
  const dormH1 = somaH1(DORMIDAS_BRAGA, '2026');
  const provH1 = soma(S.proveitos.Braga['2026']);
  const revparH1 = media(S.revpar.Braga['2026']);
  const adrH1 = media(S.adr.Braga['2026']);
  const semComp = [
    { ind: t('Dormidas', 'Overnight stays'), Braga: varP(somaH1(DORMIDAS_BRAGA, '2025'), dormH1), Portugal: varP(somaH1(DORMIDAS_PORTUGAL, '2025'), somaH1(DORMIDAS_PORTUGAL, '2026')) },
    { ind: t('Proveitos', 'Revenue'), Braga: varP(soma(S.proveitos.Braga['2025']), provH1), Portugal: varP(S.proveitos.PortugalTotal['2025'], S.proveitos.PortugalTotal['2026']) },
    { ind: 'RevPAR', Braga: varP(media(S.revpar.Braga['2025']), revparH1), Portugal: varP(media(S.revpar.Portugal['2025']), media(S.revpar.Portugal['2026'])) },
    { ind: 'ADR', Braga: varP(media(S.adr.Braga['2025']), adrH1), Portugal: varP(media(S.adr.Portugal['2025']), media(S.adr.Portugal['2026'])) },
  ];
  const oq = S.ocupQuarto.totalINE, oc = S.ocupCama.totalINE;
  const pp = (a: number, b: number) => Math.round((b - a) * 10) / 10;
  const sinal = (n: number) => `${n >= 0 ? '+' : ''}${n.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })}`;
  const MC = [t('Jan', 'Jan'), t('Fev', 'Feb'), t('Mar', 'Mar'), t('Abr', 'Apr'), t('Mai', 'May'), t('Jun', 'Jun')];
  const adrMensal = MC.map((mes, i) => ({ mes, '2023': S.adr.Braga['2023'][i], '2024': S.adr.Braga['2024'][i], '2025': S.adr.Braga['2025'][i], '2026': S.adr.Braga['2026'][i] }));
  const provMensal = MC.map((mes, i) => ({ mes, '2025': S.proveitos.Braga['2025'][i], '2026': S.proveitos.Braga['2026'][i] }));

  // ── Oferta / capacidade de alojamento (INE) ──
  const capRow = (o: { total: number; hotelaria: number; alojamentoLocal: number }, ano: string) => ({
    ano,
    hotelaria: o.hotelaria,
    al: o.alojamentoLocal,
    ter: o.total - o.hotelaria - o.alojamentoLocal,
    total: o.total,
  });
  const quartosData = Object.keys(QUARTOS.Braga).sort().map((y) => capRow(QUARTOS.Braga[y], y));
  const camasData = Object.keys(CAPACIDADE_CAMAS.Braga).sort().map((y) => capRow(CAPACIDADE_CAMAS.Braga[y], y));
  const qNow = QUARTOS.Braga['2025'], qPrev = QUARTOS.Braga['2024'];
  const cNow = CAPACIDADE_CAMAS.Braga['2025'], cPrev = CAPACIDADE_CAMAS.Braga['2024'];
  const varQuartos = (qNow.total / qPrev.total - 1) * 100;
  const varCamas = (cNow.total / cPrev.total - 1) * 100;
  const quotaQuartos = (qNow.total / QUARTOS.Portugal['2025'].total) * 100;
  const camasPorQuarto = cNow.total / qNow.total;
  const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  // ── Oferta por freguesia ──
  const fregTotal = ALOJAMENTO_FREGUESIA.reduce((a, f) => a + f.al + f.et, 0);
  const fregAL = ALOJAMENTO_FREGUESIA.reduce((a, f) => a + f.al, 0);
  const fregET = ALOJAMENTO_FREGUESIA.reduce((a, f) => a + f.et, 0);
  const fregUrbanas = ALOJAMENTO_FREGUESIA.filter((f) => f.freguesia.startsWith('Braga ('));
  const concentracao = (fregUrbanas.reduce((a, f) => a + f.al + f.et, 0) / fregTotal) * 100;
  const fregTop = ALOJAMENTO_FREGUESIA.slice(0, 12).map((f) => ({ nome: f.curto, al: f.al, et: f.et }));

  return (
    <>
      {/* ── 1.º semestre de 2026 ── */}
      <SectionTitle sub={t('INE/TravelBI · janeiro a junho · 2026 face a 2025', 'INE/TravelBI · January to June · 2026 vs 2025')}>{t('1.º semestre de 2026', '1st half of 2026')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, margin: '12px 0 14px' }}>
        <KPI label={t('Dormidas', 'Overnight stays')} value={fmt(dormH1)} sub={`${sinal(semComp[0].Braga)}% ${t('vs 2025', 'vs 2025')}`} color={C.accent} />
        <KPI label={t('Proveitos', 'Revenue')} value={fmtE(provH1)} sub={`${sinal(semComp[1].Braga)}% ${t('vs 2025', 'vs 2025')}`} color={C.positive} />
        <KPI label={t('RevPAR médio', 'Average RevPAR')} value={`${revparH1.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} €`} sub={`${sinal(semComp[2].Braga)}% ${t('vs 2025', 'vs 2025')}`} color={C.info} />
        <KPI label={t('ADR médio', 'Average ADR')} value={`${adrH1.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} €`} sub={`${sinal(semComp[3].Braga)}% ${t('vs 2025', 'vs 2025')}`} color={C.purple} />
        <KPI label={t('Ocupação-quarto', 'Room occupancy')} value={`${oq.Braga['2026'].toLocaleString(t('pt-PT', 'en-GB'))}%`} sub={`${sinal(pp(oq.Braga['2025'], oq.Braga['2026']))} p.p. · PT ${sinal(pp(oq.Portugal['2025'], oq.Portugal['2026']))}`} color={C.cyan} />
        <KPI label={t('Ocupação-cama', 'Bed occupancy')} value={`${oc.Braga['2026'].toLocaleString(t('pt-PT', 'en-GB'))}%`} sub={`${sinal(pp(oc.Braga['2025'], oc.Braga['2026']))} p.p. · PT ${sinal(pp(oc.Portugal['2025'], oc.Portugal['2026']))}`} color={C.orange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Card title={t('Braga cresce mais do que Portugal - variação homóloga (%)', 'Braga grows faster than Portugal - year-on-year change (%)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={semComp} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ind" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${sinal(v)}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Braga" fill={C.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Portugal" fill={C.textDim} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('ADR mensal em Braga (€) - janeiro a junho', 'Monthly ADR in Braga (€) - January to June')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={adrMensal} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v} €`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {['2023', '2024', '2025', '2026'].map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2026' ? 3 : 2} dot={{ r: 2 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title={t('Proveitos do alojamento por mês - 2025 e 2026', 'Accommodation revenue by month - 2025 and 2026')}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={provMensal} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1e6).toFixed(1)}M`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmtE(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="2025" fill={YEAR_COLORS['2025']} radius={[4, 4, 0, 0]} />
            <Bar dataKey="2026" fill={YEAR_COLORS['2026']} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0', lineHeight: 1.5 }}>
          {t('RevPAR e ADR: média simples dos seis meses, com o mesmo método em 2025 e 2026 (o INE só publica o valor semestral ponderado de 2026). Ocupação: total semestral publicado pelo INE. p.p. = pontos percentuais.', 'RevPAR and ADR: simple average of the six months, with the same method in 2025 and 2026 (INE only publishes the weighted half-year value for 2026). Occupancy: half-year total published by INE. p.p. = percentage points.')}
        </p>
      </Card>

      <div style={{ height: 22 }} />
      <SectionTitle sub={t('Anos completos', 'Full years')}>{t('Evolução anual', 'Annual trend')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14, marginTop: 12 }}>
        <CompareBars title={t('RevPAR 2025 - rendimento por quarto disponível (€)', 'RevPAR 2025 - revenue per available room (€)')} vals={HEADLINE.revpar2025} unit="€" />
        <CompareBars title={t('ADR 2025 - rendimento por quarto ocupado (€)', 'ADR 2025 - revenue per occupied room (€)')} vals={HEADLINE.adr2025} unit="€" />
        <CompareBars title={t('RevPAR 2024 - para comparação (€)', 'RevPAR 2024 - for comparison (€)')} vals={HEADLINE.revpar2024} unit="€" />
        <CompareBars title={t('ADR 2024 - para comparação (€)', 'ADR 2024 - for comparison (€)')} vals={HEADLINE.adr2024} unit="€" />
        <CompareBars title={t('Taxa líquida de ocupação-quarto 2024 (%)', 'Net room occupancy rate 2024 (%)')} vals={HEADLINE.ocupQuarto} unit="%" />
        <CompareBars title={t('Taxa líquida de ocupação-cama 2024 (%)', 'Net bed occupancy rate 2024 (%)')} vals={HEADLINE.ocupCama} unit="%" />
      </div>

      <Card title={t('RevPAR mensal em Braga (€) - 2022 a 2026', 'Monthly RevPAR in Braga (€) - 2022 to 2026')}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revparData} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v} €`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {['2022', '2023', '2024', '2025', '2026'].map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2026' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Card title={t('ADR anual em Braga (€) - 2018 a 2025', 'Annual ADR in Braga (€) - 2018 to 2025')}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adrData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs><linearGradient id="adrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.5} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => [`${v} €`, 'ADR']} />
              <Area type="monotone" dataKey="adr" stroke={C.accent} strokeWidth={2.5} fill="url(#adrg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Proveitos do alojamento (variação 2024→2025)', 'Accommodation revenue (change 2024→2025)')}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.accent }}>{fmtE(HEADLINE.proveitos.Braga2025 * 1e6)}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{t('Braga 2025 · de', 'Braga 2025 · from')} {HEADLINE.proveitos.Braga2024} {t('M€ em 2024', 'M€ in 2024')}</div>
          </div>
          <CompareBars title={t('Variação dos proveitos 2024–2025 (%)', 'Revenue change 2024–2025 (%)')} vals={{ Braga: HEADLINE.proveitos.varBraga2025, Norte: HEADLINE.proveitos.varNorte2025, Portugal: HEADLINE.proveitos.varPortugal2025 }} unit="%" />
          <p style={{ fontSize: 11, color: C.textDim, margin: '10px 0 0' }}>
            {t('Para comparação, em 2024 Braga cresceu', 'For comparison, in 2024 Braga grew')} {HEADLINE.proveitos.varBraga}% {t('face a 2023', 'over 2023')}.
          </p>
        </Card>
      </div>

      {/* ── Capacidade de alojamento - quartos e camas (INE) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '14px 0' }}>
        <KPI label={t('Quartos 2025', 'Rooms 2025')} value={fmt(qNow.total)} sub={`${pct(varQuartos)} ${t('vs 2024', 'vs 2024')}`} color={C.accent} />
        <KPI label={t('Camas 2025', 'Beds 2025')} value={fmt(cNow.total)} sub={`${pct(varCamas)} ${t('vs 2024', 'vs 2024')}`} color={C.info} />
        <KPI label={t('Quota nacional', 'National share')} value={`${quotaQuartos.toFixed(2)}%`} sub={t('dos quartos de Portugal', 'of Portugal\u2019s rooms')} color={C.purple} />
        <KPI label={t('Camas por quarto', 'Beds per room')} value={camasPorQuarto.toFixed(2)} sub={t('média 2025', '2025 average')} color={C.positive} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <Card title={t('Quartos em Braga por tipologia - 2017 a 2025', 'Rooms in Braga by type - 2017 to 2025')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={quartosData} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hotelaria" stackId="q" name={t('Hotelaria', 'Hotels')} fill={C.accent} />
              <Bar dataKey="al" stackId="q" name={t('Alojamento local', 'Local accommodation')} fill={C.info} />
              <Bar dataKey="ter" stackId="q" name={t('Turismo espaço rural', 'Rural tourism')} fill={C.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
            {t('Fonte: INE - Inquérito à Permanência de Hóspedes. A quebra de 2020 reflete o encerramento de unidades durante a pandemia.', 'Source: INE - Guest Stays Survey. The 2020 drop reflects units closing during the pandemic.')}
          </p>
        </Card>

        <Card title={t('Camas (capacidade) - 2023 a 2025', 'Beds (capacity) - 2023 to 2025')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={camasData} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="hotelaria" stackId="c" name={t('Hotelaria', 'Hotels')} fill={C.accent} />
              <Bar dataKey="al" stackId="c" name={t('Alojamento local', 'Local accommodation')} fill={C.info} />
              <Bar dataKey="ter" stackId="c" name={t('Turismo espaço rural', 'Rural tourism')} fill={C.purple} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
            {t('O alojamento local aqui contabilizado é apenas o abrangido pelo inquérito do INE, não coincidindo com os', 'Local accommodation here covers only units included in the INE survey, not matching the')} {fmt(INFRA.alojamentoLocal)} {t('registos de AL do município.', 'AL registrations in the municipality.')}
          </p>
        </Card>
      </div>

      {/* ── Oferta por freguesia (RNAL + RNET) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '14px 0' }}>
        <KPI label={t('Estabelecimentos', 'Establishments')} value={fmt(fregTotal)} sub={t('AL + empreendimentos', 'AL + tourist establishments')} color={C.accent} />
        <KPI label={t('Alojamento Local', 'Local Accommodation')} value={fmt(fregAL)} sub={t('registos RNAL', 'RNAL registrations')} color={C.info} />
        <KPI label={t('Empreendimentos', 'Tourist establishments')} value={fmt(fregET)} sub={t('registos RNET', 'RNET registrations')} color={C.purple} />
        <KPI label={t('Concentração urbana', 'Urban concentration')} value={`${concentracao.toFixed(0)}%`} sub={t('nas 4 freguesias da cidade', 'in the 4 city parishes')} color={C.positive} />
      </div>

      <Card title={t('Oferta de alojamento por freguesia - 12 principais', 'Accommodation supply by parish - top 12')}>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={fregTop} layout="vertical" margin={{ top: 6, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
            <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis type="category" dataKey="nome" width={170} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="al" stackId="f" name={t('Alojamento Local', 'Local Accommodation')} fill={C.info} />
            <Bar dataKey="et" stackId="f" name={t('Empreendimentos', 'Tourist establishments')} fill={C.accent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          {t('Registos RNAL e RNET do município ·', 'Municipal RNAL and RNET records ·')} {fmt(ALOJAMENTO_FREGUESIA.length)} {t('freguesias com oferta registada. As 4 freguesias urbanas concentram', 'parishes with registered supply. The 4 city parishes hold')} {concentracao.toFixed(0)}% {t('do total.', 'of the total.')}
        </p>
      </Card>
    </>
  );
}

