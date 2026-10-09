'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SEMESTRE_2026 } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { SIBS_PAISES, SIBS_MENSAL, SIBS_SETORES, SIBS_CONCELHOS, SIBS_PERIODO } from '@/app/lib/sibs-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Gastos com cartão (SIBS Analytics) - só leitura dos dados exportados ═══
export default function Cartoes() {
  const me = (v: number) => (v >= 1e9 ? `${(v / 1e9).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} ${t('mil M€', 'bn €')}` : `${(v / 1e6).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} M€`);
  const pct = (v: number | null | undefined) => (v == null ? '-' : `${v >= 0 ? '+' : ''}${v.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 0 })}%`);
  const paises = [...SIBS_PAISES].filter((p) => p.valor > 0).sort((a, b) => b.valor - a.valor);
  const totEst = paises.reduce((s2, p) => s2 + p.valor, 0);
  const nEst = paises.reduce((s2, p) => s2 + (p.n || 0), 0);
  const braga = SIBS_CONCELHOS.find((c) => c.concelho.trim().toLowerCase() === 'braga');
  const rank = [...SIBS_CONCELHOS].sort((a, b) => b.valor - a.valor);
  const posBraga = rank.findIndex((c) => c.concelho.trim().toLowerCase() === 'braga') + 1;
  // Empates no valor arredondado pela SIBS: mostra o intervalo de posições.
  const empatados = braga ? rank.filter((c) => c.valor === braga.valor).length : 1;
  const posMin = braga ? rank.filter((c) => c.valor > braga.valor).length + 1 : posBraga;
  const posTxt = empatados > 1 ? `${posMin}.º–${posMin + empatados - 1}.º` : `${posBraga}.º`;
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
  const semNum = mensal.filter((m) => m.numerario == null).map((m) => m.mes);
  const setores = (SIBS_SETORES.valor || []).map((x) => ({ setor: x.setor.length > 34 ? x.setor.slice(0, 32) + '…' : x.setor, valor: Math.round(x.v / 1e6), var: x.var }));
  // Cruzamento: peso no gasto com cartão vs peso nas dormidas (INE, 1.º semestre)
  const S: any = SEMESTRE_2026 as any;
  const estDorm = Number(S?.residencia?.dormidas?.Estrangeiro) || 0;
  const alias: Record<string, string> = { 'Estados Unidos': 'Estados Unidos da América' };
  const cruz = (Array.isArray(S?.mercadosDormidas) ? S.mercadosDormidas : []).slice(0, 8).map((r: any[]) => {
    const nome = String(r[0]); const card = paises.find((p) => p.pais === nome || p.pais === alias[nome]);
    return { pais: dl(nome), dormidas: estDorm ? Math.round((Number(r[2]) / estDorm) * 1000) / 10 : 0, gasto: card && totEst ? Math.round((card.valor / totEst) * 1000) / 10 : 0 };
  });
  const fr = cruz.find((x: any) => x.pais === dl('França'));
  const COMP = ['Braga', 'Guimarães', 'Porto', 'Viana do Castelo', 'Barcelos', 'Vila Nova de Famalicão', 'Vila Nova De Famalicão'];
  const comp = SIBS_CONCELHOS.filter((c) => COMP.map((x) => x.toLowerCase()).includes(c.concelho.trim().toLowerCase())).sort((a, b) => b.valor - a.valor);
  return (
    <>
      <SectionTitle sub={`SIBS Analytics · ${SIBS_PERIODO} · ${t('operações no concelho de Braga', 'transactions in the municipality of Braga')}`}>{t(`Cartões estrangeiros movimentaram ${me(totEst)} em Braga em 13 meses`, `Foreign cards moved ${me(totEst)} in Braga over 13 months`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Valor movimentado com cartões estrangeiros', 'Value moved with foreign cards')} value={me(totEst)} sub={braga ? t(`cerca de ${Math.round((totEst / braga.valor) * 100)}% do valor de todas as operações registadas pela SIBS em Braga`, `about ${Math.round((totEst / braga.valor) * 100)}% of the value of all operations recorded by SIBS in Braga`) : ''} color={C.accent} />
        <KPI label={t('Operações', 'Transactions')} value={fmt(nEst)} sub={t(`valor médio ${(totEst / Math.max(1, nEst)).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} €`, `average ${(totEst / Math.max(1, nEst)).toLocaleString('en-GB', { maximumFractionDigits: 1 })} €`)} color={C.info} />
        <KPI label={t('Maior país', 'Top country')} value={dl(paises[0]?.pais || '-')} sub={paises[0] ? `${me(paises[0].valor)} · ${pct(paises[0].varValor)} ${t('homólogo', 'YoY')}` : ''} color={C.positive} />
        <KPI label={t('Países com forte emigração portuguesa', 'Countries with large Portuguese diaspora')} value={`${Math.round((diaspora / Math.max(1, totEst)) * 100)}%`} sub={t('do gasto estrangeiro (França, Suíça, Luxemburgo, Alemanha, Bélgica, Andorra, Reino Unido)', 'of foreign spending (France, Switzerland, Luxembourg, Germany, Belgium, Andorra, UK)')} color={C.orange} />
        {braga && <KPI label={t('Braga entre os concelhos', 'Braga among municipalities')} value={posTxt} sub={t(`${me(braga.valor)} com todos os cartões${empatados > 1 ? ' · empatado no arredondamento da SIBS' : ''}`, `${me(braga.valor)} with all cards${empatados > 1 ? ' · tied in SIBS rounding' : ''}`)} color={C.purple} />}
      </div>
      <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, margin: '0 0 16px', padding: '12px 16px', background: C.accentBg, borderRadius: 6 }}>
        {t(`Leitura: os cartões franceses representam ${fr ? fr.gasto.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : '-'}% do valor dos cartões estrangeiros, mas só ${fr ? fr.dormidas.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : '-'}% das dormidas de estrangeiros (INE, jan–jun 2026). Uma explicação possível é a visita de emigrantes que não ficam em alojamento turístico, mas os dados não permitem confirmá-lo, e os períodos das duas fontes não coincidem.`, `Reading: French cards account for ${fr ? fr.gasto.toLocaleString('en-GB', { maximumFractionDigits: 1 }) : '-'}% of foreign card value, but only ${fr ? fr.dormidas.toLocaleString('en-GB', { maximumFractionDigits: 1 }) : '-'}% of foreign overnight stays (INE, Jan–Jun 2026). One possible explanation is emigrants visiting without staying in tourist accommodation, but the data cannot confirm it, and the two sources cover different periods.`)}
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
        <Card title={t('Peso no valor dos cartões vs peso nas dormidas (%)', 'Share of card value vs share of stays (%)')}>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={cruz} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
              <YAxis type="category" dataKey="pais" width={110} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${String(v).replace('.', ',')}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="dormidas" name={t('Dormidas de estrangeiros (INE, jan–jun 2026)', 'Foreign stays (INE, Jan–Jun 2026)')} fill={C.textDim} radius={[0, 3, 3, 0]} />
              <Bar dataKey="gasto" name={t('Cartões estrangeiros (SIBS, jan 2025–jan 2026)', 'Foreign cards (SIBS, Jan 2025–Jan 2026)')} fill={C.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 6 }}>{t('Períodos diferentes (SIBS: jan 2025–jan 2026; INE: jan–jun 2026): comparação apenas indicativa. Só os 8 mercados com mais dormidas.', 'Different periods (SIBS: Jan 2025–Jan 2026; INE: Jan–Jun 2026): indicative comparison only. Only the 8 markets with most stays.')}</div>
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
      <Card title={t('Operações mensais em Braga (M€, todos os cartões)', 'Monthly operations in Braga (M€, all cards)')}>
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
        {(semDados.length > 0 || semNum.length > 0) && <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{t(`A exportação da SIBS não trouxe dados de pagamentos eletrónicos para ${semDados.join(', ') || '-'} nem de levantamentos para ${semNum.join(', ') || '-'}.`, `The SIBS export has no electronic payment data for ${semDados.join(', ') || '-'} and no cash data for ${semNum.join(', ') || '-'}.`)}</div>}
      </Card>
      <Card title={t('Braga e concelhos vizinhos (todos os cartões)', 'Braga and neighbouring municipalities (all cards)')}>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '8px 6px' }}>{t('Concelho', 'Municipality')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Gasto', 'Spending')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Operações', 'Transactions')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Valor médio', 'Average')}</th></tr></thead>
            <tbody>{comp.map((c) => (
              <tr key={c.concelho} style={{ borderTop: `1px solid ${C.border}`, fontWeight: c.concelho.trim().toLowerCase() === 'braga' ? 700 : 400, color: c.concelho.trim().toLowerCase() === 'braga' ? C.accentLight : C.text }}>
                <td style={{ padding: '9px 6px' }}>{c.concelho.trim()}</td><td data-l={t('Gasto', 'Spending')} style={{ padding: '9px 6px', textAlign: 'right' }}>{me(c.valor)}</td><td data-l={t('Operações', 'Transactions')} style={{ padding: '9px 6px', textAlign: 'right' }}>{c.n ? fmt(c.n) : '-'}</td><td data-l={t('Valor médio', 'Average')} style={{ padding: '9px 6px', textAlign: 'right' }}>{c.medio ? `${String(c.medio).replace('.', ',')} €` : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>{t('Fonte: SIBS Analytics (exportação de 28/09/2026). Valores arredondados pela SIBS. O país é o do emissor do cartão, não a nacionalidade de quem paga. Os setores e os valores mensais incluem cartões portugueses. O país do emissor pode refletir o banco ou a fintech que emitiu o cartão. A evolução no tempo usa o ficheiro mensal da SIBS (mês a mês, pagamentos eletrónicos e numerário em separado); a variação anual do ficheiro de concelhos não é mostrada porque não coincide com o ficheiro mensal.', 'Source: SIBS Analytics (exported 28/09/2026). Values rounded by SIBS. Country is the card issuer’s, not the payer’s nationality. Sectors and monthly values include Portuguese cards. The issuer country may reflect the bank or fintech that issued the card. Trends over time use SIBS’s monthly file (month by month, electronic and cash payments separately); the annual change in the municipalities file is not shown because it does not match the monthly file.')}</div>
    </>
  );
}

