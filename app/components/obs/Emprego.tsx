'use client';

import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { BarrasPct, C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Emprego no turismo (INE, SCIE) — só leitura ═══
export default function Emprego() {
  const R = EMPREGO.regioes, S = EMPREGO.separacao, SB = EMPREGO.serieBraga;
  const cresc = SB ? ((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100 : 0;
  const pc = (a: number, b: number) => (a / Math.max(1, b)) * 100;
  const v = (x: number, d = 1) => x.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
  const peso = (r: string) => pc(R[r].turismo, R[r].total);
  const bragaNoCavado = pc(R['Braga'].turismo, R['Cávado'].turismo);
  const bragaNoCavadoTotal = pc(R['Braga'].total, R['Cávado'].total);
  const agNoCavado = pc(R['Braga'].agencias, R['Cávado'].agencias);
  const regs = ['Braga', 'Cávado', 'Norte', 'Portugal'];
  const setores: [string, number, string][] = [
    [t('Atividades administrativas e serviços de apoio', 'Administrative and support services'), R['Braga'].administrativas, C.textDim],
    [t('Consultoria, atividades científicas e técnicas', 'Consulting, scientific and technical'), R['Braga'].consultoria, C.textDim],
    [t('Alojamento, restauração e similares', 'Accommodation and food services'), R['Braga'].turismo, C.accent],
    [t('Agências de viagem e operadores turísticos', 'Travel agencies and tour operators'), R['Braga'].agencias, C.orange],
  ];
  const maxS = Math.max(...setores.map((x) => x[1]));
  return (
    <>
      <SectionTitle sub={EMPREGO.fonte}>{t(`Pelo menos ${fmt(R['Braga'].turismo)} pessoas trabalham no alojamento e na restauração em Braga`, `At least ${fmt(R['Braga'].turismo)} people work in accommodation and food services in Braga`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Alojamento e restauração · Braga', 'Accommodation and food · Braga')} value={fmt(R['Braga'].turismo)} sub={t(`pelo menos · ${v(peso('Braga'))}% das ${fmt(R['Braga'].total)} pessoas ao serviço nas empresas · +${v(cresc)}% desde ${SB.anos[0]}`, `${v(peso('Braga'))}% of ${fmt(R['Braga'].total)} people employed in companies · +${v(cresc)}% since ${SB.anos[0]}`)} color={C.accent} />
        <KPI label={t('Peso no emprego das empresas: comparação', 'Share of company employment: comparison')} value={`${v(peso('Portugal'))}%`} sub={t(`Portugal · Norte ${v(peso('Norte'))}% · Cávado ${v(peso('Cávado'))}%`, `Portugal · North ${v(peso('Norte'))}% · Cávado ${v(peso('Cávado'))}%`)} color={C.textDim} />
        <KPI label={t('Braga no Cávado', 'Braga within Cávado')} value={`${v(bragaNoCavado, 0)}%`} sub={t(`do emprego turístico da região (e ${v(bragaNoCavadoTotal, 0)}% do emprego total)`, `of the region’s tourism employment (and ${v(bragaNoCavadoTotal, 0)}% of total employment)`)} color={C.purple} />
        <KPI label={t('Agências e operadores turísticos', 'Travel agencies and operators')} value={fmt(R['Braga'].agencias)} sub={t(`${v(agNoCavado, 0)}% deste emprego no Cávado está em Braga`, `${v(agNoCavado, 0)}% of this Cávado employment is in Braga`)} color={C.orange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Peso do alojamento e restauração no emprego das empresas (%)', 'Accommodation and food services share of company employment (%)')}>
          <BarrasPct dados={regs.map((r) => [r, Math.round(peso(r) * 10) / 10] as [string, number])} cor={C.accent} max={10} />
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t('O turismo pesa menos no emprego de Braga do que no país: natural num concelho com uma base industrial, universitária e de serviços forte. Não é um sinal de fraqueza do turismo, mas de uma economia diversificada.', 'Tourism weighs less in Braga’s employment than nationally: natural in a municipality with a strong industrial, university and services base. It signals a diversified economy rather than weak tourism.')}</div>
        </Card>
        <Card title={t('Alojamento ou restauração? (% do emprego turístico)', 'Accommodation or food services? (% of tourism employment)')}>
          {['Cávado', 'Norte', 'Portugal'].map((r, i) => {
            const al = pc(S[r].alojamento, S[r].alojamento + S[r].restauracao);
            return (
              <div key={r} style={{ margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 6 }}><span style={{ color: C.text, fontWeight: 600 }}>{r}</span><span style={{ color: C.textMuted }}>{t('alojamento', 'accommodation')} <strong style={{ color: C.text }}>{v(al, 0)}%</strong> · {t('restauração', 'food')} <strong style={{ color: C.text }}>{v(100 - al, 0)}%</strong></span></div>
                <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', background: '#262A30' }}>
                  <div className="obs-grow" style={{ width: `${al}%`, background: C.purple, animationDelay: `${i * 80}ms` }} />
                  <div className="obs-grow" style={{ width: `${100 - al}%`, background: C.accent, animationDelay: `${i * 80 + 60}ms` }} />
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t(`No Cávado, o emprego hoteleiro é só ${v(pc(S['Cávado'].alojamento, S['Cávado'].alojamento + S['Cávado'].restauracao), 0)}% do emprego turístico, contra ${v(pc(S['Portugal'].alojamento, S['Portugal'].alojamento + S['Portugal'].restauracao), 0)}% no país. O INE não divulga esta divisão para Braga; o Cávado é o nível mais próximo.`, `In Cávado, hotel jobs are only ${v(pc(S['Cávado'].alojamento, S['Cávado'].alojamento + S['Cávado'].restauracao), 0)}% of tourism employment, vs ${v(pc(S['Portugal'].alojamento, S['Portugal'].alojamento + S['Portugal'].restauracao), 0)}% nationally. INE does not publish this split for Braga; Cávado is the closest level.`)}</div>
        </Card>
      </div>
      {EMPREGO.ganhoTerritorios && EMPREGO.ganho && (() => {
        const GT = EMPREGO.ganhoTerritorios, G = EMPREGO.ganho;
        const ult = GT.anos.length - 1;
        const br = GT.territorios['Braga'], no = GT.territorios['Norte'];
        const eu = (x: number) => `${Math.round(x).toLocaleString(t('pt-PT', 'en-GB'))} €`;
        const rac = G.turismo / no.servicos[ult];
        const estBraga = br.servicos[ult] * rac;
        const cresc = (br.total[ult] / br.total[0] - 1) * 100;
        const vsNorte = (br.total[ult] / no.total[ult] - 1) * 100;
        const IN = EMPREGO.inflacao;
        const deflator = IN ? (IN.taxas as number[]).reduce((a: number, x: number) => a * (1 + x / 100), 1) : 1;
        const crescReal = (br.total[ult] / br.total[0] / deflator - 1) * 100;
        const gap = (1 - GT.sexoBraga2024.mulheres / GT.sexoBraga2024.homens) * 100;
        const cores: Record<string, string> = { Braga: C.accent, 'Cávado': C.purple, Norte: C.orange, Portugal: C.textDim };
        const serie = GT.anos.map((a: number, i: number) => { const o: any = { ano: String(a) }; Object.keys(GT.territorios).forEach((k) => { o[k] = GT.territorios[k].total[i]; }); return o; });
        return (
          <Card title={t(`Quanto se ganha em Braga, ${GT.anos[0]}–${GT.anos[ult]}`, `What Braga pays, ${GT.anos[0]}–${GT.anos[ult]}`)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 14 }}>
              <KPI label={t(`Ganho médio em Braga · ${GT.anos[ult]}`, `Average earnings in Braga · ${GT.anos[ult]}`)} value={eu(br.total[ult])} sub={t(`desde ${GT.anos[0]}: +${Math.round(cresc)}% nominal, +${Math.round(crescReal)}% descontada a inflação · ${vsNorte >= 0 ? '+' : ''}${v(vsNorte)}% face ao Norte`, `since ${GT.anos[0]}: +${Math.round(cresc)}% nominal, +${Math.round(crescReal)}% after inflation · ${vsNorte >= 0 ? '+' : ''}${v(vsNorte)}% vs North`)} color={C.accent} />
              <KPI label={t('Turismo em Braga (estimativa)', 'Tourism in Braga (estimate)')} value={`≈ ${eu(estBraga)}`} sub={t(`serviços de Braga (${eu(br.servicos[ult])}) × ${v(rac * 100)}%, a proporção turismo/serviços do Norte`, `Braga services (${eu(br.servicos[ult])}) × ${v(rac * 100)}%, the North’s tourism/services ratio`)} color={C.orange} />
              <KPI label={t(`Diferença salarial em Braga · ${GT.anos[ult]}`, `Pay gap in Braga · ${GT.anos[ult]}`)} value={`${v(gap)}%`} sub={t(`mulheres ${eu(GT.sexoBraga2024.mulheres)} · homens ${eu(GT.sexoBraga2024.homens)}`, `women ${eu(GT.sexoBraga2024.mulheres)} · men ${eu(GT.sexoBraga2024.homens)}`)} color={C.pink} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={serie} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="€" domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(val: any, nm: any) => [eu(Number(val)), nm]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.keys(GT.territorios).map((k) => <Line key={k} type="monotone" dataKey={k} stroke={cores[k] || C.textDim} strokeWidth={k === 'Braga' ? 3 : 2} dot={{ r: 3 }} />)}
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t(`Ganho médio mensal de todas as atividades, em valores nominais (sem descontar a inflação: ${IN ? (IN.taxas as number[]).map((x: number, i: number) => `${IN.anos[i]} ${String(x).replace('.', ',')}%`).join(', ') : ''}, segundo o IPC do INE). Só inclui trabalhadores a tempo completo com remuneração completa: na restauração, onde há muito trabalho a tempo parcial, o rendimento típico pode ser inferior. O INE não publica o setor do turismo ao nível do concelho, por isso o valor do turismo em Braga é uma estimativa da plataforma, não um dado oficial. Fonte: ${GT.fonte}.`, `Average monthly earnings across all activities. INE does not publish the tourism sector at municipal level, so the Braga tourism figure is a platform estimate, not official data. Source: ${GT.fonte}.`)}</div>
          </Card>
        );
      })()}
      {EMPREGO.ganho && (() => {
        const G = EMPREGO.ganho;
        const dif = (G.turismo / G.total - 1) * 100;
        const eu = (x: number) => `${x.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 0 })} €`;
        const dadosG = G.porEscalao.escaloes.map((e: string, i: number) => ({ escalao: e, total: G.porEscalao.total[i], turismo: G.porEscalao.turismo[i] }));
        return (
          <Card title={t(`Quanto se ganha no turismo, por dimensão de empresa · região ${G.regiao}, ${G.ano}`, `What tourism pays, by company size · ${G.regiao} region, ${G.ano}`)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
              <KPI label={t('Alojamento e restauração', 'Accommodation and food')} value={eu(G.turismo)} sub={t('ganho médio mensal', 'average monthly earnings')} color={C.accent} />
              <KPI label={t('Todas as atividades', 'All activities')} value={eu(G.total)} sub={t(`o turismo paga ${Math.abs(Math.round(dif))}% ${dif < 0 ? 'menos' : 'mais'}`, `tourism pays ${Math.abs(Math.round(dif))}% ${dif < 0 ? 'less' : 'more'}`)} color={C.textDim} />
              <KPI label={t('Microempresas do turismo (1–4 pessoas)', 'Tourism micro-firms (1–4 people)')} value={eu(G.porEscalao.turismo[0])} sub={t(`contra ${eu(G.porEscalao.turismo[6])} nas de 250–499 pessoas`, `vs ${eu(G.porEscalao.turismo[6])} in firms with 250–499 people`)} color={C.orange} />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dadosG} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="escalao" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
                <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="€" />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} labelFormatter={(l: any) => t(`Empresas com ${l} pessoas`, `Firms with ${l} people`)} formatter={(val: any, nm: any) => [eu(Number(val)), nm]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="turismo" name={t('Alojamento e restauração', 'Accommodation and food')} fill={C.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name={t('Todas as atividades', 'All activities')} fill={C.textDim} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t(`Por dimensão da empresa (n.º de pessoas ao serviço). O INE só publica este indicador ao nível da região ${G.regiao}, sem concelho. Como em Braga predominam micro e pequenas empresas turísticas (TIA 2025), os salários locais do setor deverão estar mais perto dos valores das empresas pequenas. Fonte: ${G.fonte}.`, `By company size (persons employed). INE only publishes this indicator at ${G.regiao} region level, not by municipality. Since micro and small tourism firms predominate in Braga (TIA 2025), local wages are likely closer to small-firm values. Source: ${G.fonte}.`)}</div>
          </Card>
        );
      })()}
      {SB && (
        <Card title={t(`Evolução em Braga, ${SB.anos[0]}–${SB.anos[SB.anos.length - 1]} (pessoas ao serviço)`, `Trend in Braga, ${SB.anos[0]}–${SB.anos[SB.anos.length - 1]} (persons employed)`)}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SB.anos.map((a: number, i: number) => ({ ano: String(a), turismo: SB.turismo[i], administrativas: SB.administrativas[i] }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(val: any, n: any) => [fmt(val), n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="turismo" name={t('Alojamento e restauração', 'Accommodation and food')} fill={C.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="administrativas" name={t('Serviços administrativos (comparação)', 'Administrative services (comparison)')} fill={C.textDim} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t(`O emprego no alojamento e na restauração cresceu ${v(cresc)}% em dois anos: ${v(((SB.turismo[1] / SB.turismo[0]) - 1) * 100)}% em ${SB.anos[1]} e ${v(((SB.turismo[2] / SB.turismo[1]) - 1) * 100)}% em ${SB.anos[2]}. Fonte: ${SB.fonte}.`, `Employment in accommodation and food grew ${v(cresc)}% in two years: ${v(((SB.turismo[1] / SB.turismo[0]) - 1) * 100)}% in ${SB.anos[1]} and ${v(((SB.turismo[2] / SB.turismo[1]) - 1) * 100)}% in ${SB.anos[2]}. Source: ${SB.fonte}.`)}</div>
        </Card>
      )}
      <Card title={t('Emprego em Braga: o turismo ao lado de outros serviços', 'Employment in Braga: tourism next to other services')}>
        {setores.map(([nome, n, cor], i) => (
          <div key={nome} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 320px) minmax(0,1fr) 120px', gap: 12, alignItems: 'center', margin: '10px 0', fontSize: 13.5 }}>
            <span style={{ color: C.text }}>{nome}</span>
            <div style={{ height: 9, background: '#262A30', borderRadius: 999, overflow: 'hidden' }}><div className="obs-grow" style={{ width: `${(n / maxS) * 100}%`, height: '100%', background: cor, borderRadius: 999, animationDelay: `${i * 70}ms` }} /></div>
            <span style={{ textAlign: 'right', color: C.text }}><strong>{fmt(n)}</strong> <span style={{ color: C.textDim }}>· {v(pc(n, R['Braga'].total))}%</span></span>
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>{t(`Notas: o INE conta este emprego pela localização da empresa, que pode ser a sede; os trabalhadores de hotéis de cadeias com sede noutro concelho podem não estar incluídos em Braga, por isso o valor deve ser lido como mínimo. O total refere-se às empresas não financeiras e não inclui a administração pública. A restauração serve também os residentes, por isso nem todo este emprego se deve ao turismo. A comparação entre regiões é de ${EMPREGO.ano}, o último ano publicado; a evolução de Braga desde 2022 vem do PORDATA (mesma fonte, INE). "Pessoal ao serviço" inclui trabalhadores por conta de outrem, proprietários e familiares que trabalham na empresa.`, `Notes: INE counts this employment by company location, which may be the head office; staff at hotels of chains headquartered in another municipality may not be counted in Braga, so the figure should be read as a minimum. The total refers to non-financial companies and excludes public administration. Food services also serve residents, so not all this employment is due to tourism. The regional comparison is for ${EMPREGO.ano}, the latest published year; Braga’s trend since 2022 comes from PORDATA (same source, INE). "Persons employed" includes employees, owners and family members working in the company.`)}</div>
    </>
  );
}

