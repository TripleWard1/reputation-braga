'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SEMESTRE_2026 } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { SIBS_PAISES, SIBS_MENSAL, SIBS_SETORES, SIBS_CONCELHOS, SIBS_PERIODO } from '@/app/lib/sibs-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Gastos com cartão (SIBS Analytics) - só leitura dos dados exportados ═══
export default function Cartoes() {
  const me = (v: number) => `${(v / 1e6).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} M€`;
  const pct = (v: number | null | undefined) => (v == null ? '-' : `${v >= 0 ? '+' : ''}${v.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 0 })}%`);
  const paises = [...SIBS_PAISES].filter((p) => p.valor > 0).sort((a, b) => b.valor - a.valor);
  const totEst = paises.reduce((s2, p) => s2 + p.valor, 0);
  const nEst = paises.reduce((s2, p) => s2 + (p.n || 0), 0);
  const braga = SIBS_CONCELHOS.find((c) => c.concelho.trim().toLowerCase() === 'braga');
  const rank = [...SIBS_CONCELHOS].sort((a, b) => b.valor - a.valor);
  const posBraga = rank.findIndex((c) => c.concelho.trim().toLowerCase() === 'braga') + 1;
  const DIASPORA = ['França', 'Suíça', 'Luxemburgo', 'Alemanha', 'Bélgica', 'Andorra', 'Reino Unido'];
  const diaspora = paises.filter((p) => DIASPORA.includes(p.pais)).reduce((s2, p) => s2 + p.valor, 0);
  const top12 = paises.slice(0, 12).map((p) => ({ pais: dl(p.pais), valor: Math.round(p.valor / 1e5) / 10, var: p.varValor }));
  const medios = paises.filter((p) => (p.n || 0) >= 5000 && p.medio).sort((a, b) => (b.medio || 0) - (a.medio || 0)).slice(0, 10).map((p) => ({ pais: dl(p.pais), medio: p.medio }));
  const MESES_C = [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];
  const mesesTodos: string[] = [];
  for (let y = 2025; y <= 2026; y++) for (let m = 1; m <= 12; m++) { const k = `${y}-${String(m).padStart(2, '0')}`; if (k <= '2026-01') mesesTodos.push(k); }
  const mensal = mesesTodos.map((k) => {
    const el = SIBS_MENSAL.find((x) => x.mes === k && /eletr/i.test(x.indicador));
    const nu = SIBS_MENSAL.find((x) => x.mes === k && /numer/i.test(x.indicador));
    return { mes: `${MESES_C[+k.slice(5, 7) - 1]} ${k.slice(2, 4)}`, eletronico: el?.valor != null ? Math.round(el.valor / 1e6) : null, numerario: nu?.valor != null ? Math.round(nu.valor / 1e6) : null };
  });
  const semDados = mensal.filter((m) => m.eletronico == null).map((m) => m.mes);
  const setores = (SIBS_SETORES.valor || []).map((x) => ({ setor: x.setor.length > 34 ? x.setor.slice(0, 32) + '…' : x.setor, valor: Math.round(x.v / 1e6), var: x.var }));
  // Cruzamento: peso no gasto com cartão vs peso nas dormidas (INE, 1.º semestre)
  const S: any = SEMESTRE_2026 as any;
  const estDorm = Number(S?.residencia?.dormidas?.Estrangeiro) || 0;
  const alias: Record<string, string> = { 'Estados Unidos': 'Estados Unidos da América' };
  const cruz = (Array.isArray(S?.mercadosDormidas) ? S.mercadosDormidas : []).slice(0, 8).map((r: any[]) => {
    const nome = String(r[0]); const card = paises.find((p) => p.pais === nome || p.pais === alias[nome]);
    return { pais: dl(nome), dormidas: estDorm ? Math.round((Number(r[2]) / estDorm) * 1000) / 10 : 0, gasto: card && totEst ? Math.round((card.valor / totEst) * 1000) / 10 : 0 };
  });
  const COMP = ['Braga', 'Guimarães', 'Porto', 'Viana do Castelo', 'Barcelos', 'Vila Nova de Famalicão', 'Vila Nova De Famalicão'];
  const comp = SIBS_CONCELHOS.filter((c) => COMP.map((x) => x.toLowerCase()).includes(c.concelho.trim().toLowerCase())).sort((a, b) => b.valor - a.valor);
  return (
    <>
      <SectionTitle sub={`SIBS Analytics · ${SIBS_PERIODO} · ${t('operações no concelho de Braga', 'transactions in the municipality of Braga')}`}>{t(`Cartões estrangeiros gastaram ${me(totEst)} em Braga`, `Foreign cards spent ${me(totEst)} in Braga`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Gasto com cartões estrangeiros', 'Foreign card spending')} value={me(totEst)} sub={braga ? t(`${((totEst / braga.valor) * 100).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}% de todo o gasto com cartão em Braga`, `${((totEst / braga.valor) * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}% of all card spending in Braga`) : ''} color={C.accent} />
        <KPI label={t('Operações', 'Transactions')} value={fmt(nEst)} sub={t(`valor médio ${(totEst / Math.max(1, nEst)).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} €`, `average ${(totEst / Math.max(1, nEst)).toLocaleString('en-GB', { maximumFractionDigits: 1 })} €`)} color={C.info} />
        <KPI label={t('Maior país', 'Top country')} value={dl(paises[0]?.pais || '-')} sub={paises[0] ? `${me(paises[0].valor)} · ${pct(paises[0].varValor)} ${t('homólogo', 'YoY')}` : ''} color={C.positive} />
        <KPI label={t('Países com forte emigração portuguesa', 'Countries with large Portuguese diaspora')} value={`${Math.round((diaspora / Math.max(1, totEst)) * 100)}%`} sub={t('do gasto estrangeiro (França, Suíça, Luxemburgo, Alemanha, Bélgica, Andorra, Reino Unido)', 'of foreign spending (France, Switzerland, Luxembourg, Germany, Belgium, Andorra, UK)')} color={C.orange} />
        {braga && <KPI label={t('Braga entre os concelhos', 'Braga among municipalities')} value={`${posBraga}.º`} sub={t(`${me(braga.valor)} com todos os cartões · ${pct(braga.varValor)} homólogo`, `${me(braga.valor)} with all cards · ${pct(braga.varValor)} YoY`)} color={C.purple} />}
      </div>
      <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, margin: '0 0 16px', padding: '12px 16px', background: C.accentBg, borderRadius: 6 }}>
        {t('Leitura: os cartões franceses, suíços e luxemburgueses pesam muito mais no gasto do que nas dormidas. Grande parte deste gasto é da diáspora bracarense, que visita a família e não fica em alojamento turístico. Os pagamentos com cartão mostram por isso um visitante que o INE não apanha.', 'Reading: French, Swiss and Luxembourg cards weigh far more in spending than in overnight stays. Much of this is Braga’s diaspora visiting family and not staying in tourist accommodation, so card payments reveal a visitor INE does not capture.')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Gasto por país do cartão (M€)', 'Spending by card country (M€)')}>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={top12} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis type="category" dataKey="pais" width={120} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any, it: any) => [`${String(v).replace('.', ',')} M€ · ${pct(it?.payload?.var)} ${t('homólogo', 'YoY')}`, t('Gasto', 'Spending')]} />
              <Bar dataKey="valor" name={t('Gasto', 'Spending')} fill={C.accent} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Peso no gasto vs peso nas dormidas (%)', 'Share of spending vs share of stays (%)')}>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={cruz} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
              <YAxis type="category" dataKey="pais" width={110} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${String(v).replace('.', ',')}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="dormidas" name={t('Dormidas de estrangeiros (INE, jan–jun 2026)', 'Foreign stays (INE, Jan–Jun 2026)')} fill={C.textDim} radius={[0, 3, 3, 0]} />
              <Bar dataKey="gasto" name={t('Gasto com cartões estrangeiros', 'Foreign card spending')} fill={C.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Valor médio por compra (€) · países com 5 000 ou mais operações', 'Average purchase (€) · countries with 5,000+ transactions')}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={medios} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="€" />
              <YAxis type="category" dataKey="pais" width={120} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [`${String(v).replace('.', ',')} €`, t('Valor médio', 'Average')]} />
              <Bar dataKey="medio" name={t('Valor médio', 'Average')} fill={C.orange} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Setores com mais gasto em Braga (M€, todos os cartões)', 'Sectors with most spending in Braga (M€, all cards)')}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={setores} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis type="category" dataKey="setor" width={170} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any, it: any) => [`${v} M€ · ${pct(it?.payload?.var)} ${t('homólogo', 'YoY')}`, t('Gasto', 'Spending')]} />
              <Bar dataKey="valor" name={t('Gasto', 'Spending')} fill={C.positive} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title={t('Gasto mensal em Braga (M€, todos os cartões)', 'Monthly spending in Braga (M€, all cards)')}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mensal} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [v == null ? t('sem dados', 'no data') : `${v} M€`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="eletronico" name={t('Pagamentos eletrónicos', 'Electronic payments')} fill={C.accent} radius={[4, 4, 0, 0]} />
            <Bar dataKey="numerario" name={t('Levantamentos em numerário', 'Cash withdrawals')} fill={C.textDim} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {semDados.length > 0 && <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{t(`A exportação da SIBS não trouxe dados de pagamentos eletrónicos para ${semDados.join(', ')}.`, `The SIBS export has no electronic payment data for ${semDados.join(', ')}.`)}</div>}
      </Card>
      <Card title={t('Braga e concelhos vizinhos (todos os cartões)', 'Braga and neighbouring municipalities (all cards)')}>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '8px 6px' }}>{t('Concelho', 'Municipality')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Gasto', 'Spending')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Operações', 'Transactions')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Valor médio', 'Average')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Homólogo', 'YoY')}</th></tr></thead>
            <tbody>{comp.map((c) => (
              <tr key={c.concelho} style={{ borderTop: `1px solid ${C.border}`, fontWeight: c.concelho.trim().toLowerCase() === 'braga' ? 700 : 400, color: c.concelho.trim().toLowerCase() === 'braga' ? C.accentLight : C.text }}>
                <td style={{ padding: '9px 6px' }}>{c.concelho.trim()}</td><td data-l={t('Gasto', 'Spending')} style={{ padding: '9px 6px', textAlign: 'right' }}>{me(c.valor)}</td><td data-l={t('Operações', 'Transactions')} style={{ padding: '9px 6px', textAlign: 'right' }}>{c.n ? fmt(c.n) : '-'}</td><td data-l={t('Valor médio', 'Average')} style={{ padding: '9px 6px', textAlign: 'right' }}>{c.medio ? `${String(c.medio).replace('.', ',')} €` : '-'}</td><td data-l={t('Homólogo', 'YoY')} style={{ padding: '9px 6px', textAlign: 'right', color: (c.varValor || 0) >= 0 ? C.positive : C.negative }}>{pct(c.varValor)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>{t('Fonte: SIBS Analytics (exportação de 28/09/2026). Valores arredondados pela SIBS. O país é o do emissor do cartão, não a nacionalidade de quem paga. Os setores e o gasto mensal incluem cartões portugueses.', 'Source: SIBS Analytics (exported 28/09/2026). Values rounded by SIBS. Country is the card issuer’s, not the payer’s nationality. Sectors and monthly spending include Portuguese cards.')}</div>
    </>
  );
}

