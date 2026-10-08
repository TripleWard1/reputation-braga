'use client';

import { t } from '@/app/lib/i18n';
import { DORMIDAS_BRAGA, MESES } from '@/app/lib/observatorio-dados';
import { INSTO_DADOS } from '@/app/lib/insto-dados';
import { INDICADORES_SIMPLES } from '@/app/lib/indicadores-simples';
import { C, SectionTitle, KPI, Card } from './comum';

// Prontidão de Braga para a rede INSTO (UN Tourism International Network of Sustainable Tourism Observatories):
// as 11 áreas obrigatórias, o que a plataforma mede, onde, e os dados de ambiente, clima e governança.
type Estado = 'coberta' | 'parcial' | 'falta';
interface Area { pt: string; en: string; estado: Estado; tem: [string, string]; nota?: [string, string]; separador?: string; ancora?: boolean }
const D = INSTO_DADOS;
const fmt = (v: number, d = 0) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const AREAS: Area[] = [
  { pt: 'Sazonalidade', en: 'Tourism seasonality', estado: 'coberta', separador: 'procura', tem: ['Dormidas e hóspedes mês a mês, índice de sazonalidade face ao país, estimativa do ano e procura mensal nos autocarros.', 'Monthly stays and guests, seasonality index vs Portugal, annual estimate and monthly bus demand.'] },
  { pt: 'Emprego', en: 'Employment', estado: 'coberta', separador: 'emprego', tem: ['Pessoal ao serviço no alojamento e restauração (2022–2024), peso no emprego e ganho médio.', 'Persons employed in accommodation and food (2022–2024), share of employment and average earnings.'] },
  { pt: 'Benefícios económicos do destino', en: 'Destination economic benefits', estado: 'coberta', separador: 'economia', tem: ['Proveitos, RevPAR, gastos com cartões estrangeiros e taxa turística.', 'Revenue, RevPAR, foreign card spending and tourist tax.'] },
  { pt: 'Satisfação dos residentes', en: 'Local satisfaction', estado: 'coberta', separador: 'sustentabilidade', tem: ['Barómetro de Perceção dos Residentes 2026 (293 respostas).', 'Residents’ Perception Barometer 2026 (293 responses).'] },
  { pt: 'Acessibilidade', en: 'Accessibility', estado: 'coberta', separador: 'acessibilidade', tem: ['Indicadores de acessibilidade do destino e quartos adaptados na hotelaria.', 'Destination accessibility indicators and adapted hotel rooms.'] },
  { pt: 'Governança', en: 'Governance', estado: 'coberta', ancora: true, tem: ['Processos participativos e grupos de trabalho documentados (abaixo), certificação Full da Green Destinations e este Observatório.', 'Documented participatory processes and working groups (below), Green Destinations Full certification and this Observatory.'], nota: ['Ponto a melhorar: 45% dos residentes sentem que não são ouvidos (Barómetro 2026).', 'Area to improve: 45% of residents feel they are not heard (2026 Barometer).'] },
  { pt: 'Ação climática', en: 'Climate action', estado: 'coberta', ancora: true, tem: [`Emissões de CO₂ do concelho: −30% entre 2008 e 2024 (PAESC, maio de 2026). Meta: −40% em 2030 e neutralidade em 2050.`, `Municipal CO₂ emissions: −30% between 2008 and 2024 (SECAP, May 2026). Target: −40% by 2030 and neutrality by 2050.`] },
  { pt: 'Gestão de energia', en: 'Energy management', estado: 'coberta', ancora: true, tem: [`Consumo elétrico por habitante e por tipo de consumo (INE, ${D.energia.ano}).`, `Electricity consumption per inhabitant and by type of use (INE, ${D.energia.ano}).`], nota: ['Medido ao nível do concelho, com estimativa do peso do turismo.', 'Measured at municipal level, with an estimate of tourism’s share.'] },
  { pt: 'Gestão da água', en: 'Water management', estado: 'coberta', ancora: true, tem: [`Água distribuída por habitante (INE, ${D.agua.ano}).`, `Water supplied per inhabitant (INE, ${D.agua.ano}).`], nota: ['Medido ao nível do concelho, com estimativa do peso do turismo.', 'Measured at municipal level, with an estimate of tourism’s share.'] },
  { pt: 'Águas residuais', en: 'Wastewater (sewage) management', estado: 'coberta', ancora: true, tem: [`Águas residuais tratadas por nível de tratamento (INE, ${D.aguasResiduais.ano}).`, `Wastewater treated by treatment level (INE, ${D.aguasResiduais.ano}).`] },
  { pt: 'Gestão de resíduos sólidos', en: 'Solid waste management', estado: 'coberta', ancora: true, tem: [`Resíduos urbanos por habitante (INE, ${D.residuos.ano}) e indicadores do estudo de impacto da Green Destinations.`, `Municipal waste per inhabitant (INE, ${D.residuos.ano}) and Green Destinations impact study indicators.`], nota: ['Falta a proporção de recolha seletiva (INE).', 'Separate collection share (INE) still missing.'] },
];
const COR: Record<Estado, string> = { coberta: C.positive, parcial: C.orange, falta: C.negative };

export default function Insto({ irPara, nomeSeparador, semTitulo }: { irPara: (id: string) => void; nomeSeparador: (id: string) => string | null; semTitulo?: boolean }) {
  const n = (e: Estado) => AREAS.filter((a) => a.estado === e).length;
  const rotulo: Record<Estado, string> = { coberta: t('Coberta', 'Covered'), parcial: t('Em parte', 'Partial'), falta: t('Em falta', 'Missing') };
  const irAmbiente = () => document.getElementById('insto-ambiente')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Peso dos turistas na população (estimativa): dormidas/365 face à população implícita nos dados do INE
  const M = MESES as unknown as string[];
  const dorm2025 = M.reduce((a, m) => a + ((DORMIDAS_BRAGA as any)[m]?.['2025'] ?? 0), 0);
  const ago = (DORMIDAS_BRAGA as any)['Agosto']?.['2025'] ?? 0;
  const pop = D.energia.porTipoBraga.total / D.energia.porHab.Braga;
  const pMedia = (dorm2025 / 365 / pop) * 100, pAgosto = (ago / 31 / pop) * 100;
  const cl = D.clima; const [e08, , e24] = cl.total as number[];
  const reducao = (1 - e24 / e08) * 100;
  const terciario = (D.aguasResiduais.Braga.terciario / D.aguasResiduais.Braga.total) * 100;
  const e = D.energia.porTipoBraga;
  const territ = ['Braga', 'Cávado', 'Norte', 'Portugal'];
  const linhaComp = (titulo: string, obj: Record<string, number>, unid: string, d = 0) => (
    <div style={{ padding: '10px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 6 }}>{titulo}</div>
      {territ.map((r) => { const v = obj[r]; const mx = Math.max(...territ.map((x) => obj[x])); return (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) 92px', gap: 10, alignItems: 'center', margin: '4px 0', fontSize: 13 }}>
          <span style={{ color: r === 'Braga' ? C.text : C.textMuted, fontWeight: r === 'Braga' ? 700 : 400 }}>{r}</span>
          <div style={{ height: 7, background: '#262A30', borderRadius: 999, overflow: 'hidden' }}><div className="obs-grow" style={{ width: `${(v / mx) * 100}%`, height: '100%', background: r === 'Braga' ? C.accent : C.textDim, borderRadius: 999 }} /></div>
          <span style={{ textAlign: 'right', color: C.text }}>{fmt(v, d)} {unid}</span>
        </div>); })}
    </div>
  );
  return (
    <>
      {!semTitulo && (<>
      <SectionTitle sub={t('Áreas obrigatórias da rede INSTO da ONU Turismo · estado da plataforma em outubro de 2026', 'UN Tourism INSTO mandatory issue areas · platform status as of October 2026')}>{t(`Braga já monitoriza as ${n('coberta')} áreas exigidas pela rede INSTO`, `Braga already monitors all ${n('coberta')} areas required by the INSTO network`)}</SectionTitle>
      <div style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65, margin: '0 0 18px', padding: '14px 16px', borderRadius: 8, background: C.accentBg, border: '1px solid rgba(138,176,230,.3)' }}>
        {t('A INSTO é a rede de observatórios de turismo sustentável da ONU Turismo. Os membros comprometem-se a monitorizar 11 áreas, enviam um relatório anual e mantêm um grupo de trabalho local com os parceiros do destino. As áreas ambientais são medidas ao nível do concelho, como a rede admite, com uma estimativa do peso do turismo.', 'INSTO is UN Tourism’s network of sustainable tourism observatories. Members commit to monitoring 11 areas, submit an annual report and keep a local working group with destination partners. Environmental areas are measured at municipal level, as the network allows, with an estimate of tourism’s share.')}
      </div>
      </>)}
      <ul style={{ listStyle: 'none', margin: '0 0 26px', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {AREAS.map((a) => (
          <li key={a.pt} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 18px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${COR[a.estado]}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <strong style={{ fontSize: 15, color: C.text }}>{t(a.pt, a.en)}</strong>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: COR[a.estado], border: `1px solid ${COR[a.estado]}66`, whiteSpace: 'nowrap' }}>{rotulo[a.estado]}</span>
            </div>
            <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.55 }}>{t(a.tem[0], a.tem[1])}</div>
            {a.nota && <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.5 }}>{t(a.nota[0], a.nota[1])}</div>}
            {a.separador && nomeSeparador(a.separador)
              ? <button type="button" className="obs-leit-ir" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={() => irPara(a.separador!)}>{t('Abrir', 'Open')} «{nomeSeparador(a.separador)}» <span aria-hidden="true">→</span></button>
              : a.ancora ? <button type="button" className="obs-leit-ir" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={irAmbiente}>{t('Ver os dados abaixo', 'See the data below')} <span aria-hidden="true">↓</span></button> : null}
          </li>
        ))}
      </ul>

      <div id="insto-ambiente" style={{ scrollMarginTop: 120 }}>
        <SectionTitle sub={`${D.fonteAmbiente} · ${cl.fonte}`}>{t(`Ambiente, clima e governança: emissões do concelho −${fmt(reducao)}% desde ${cl.anoBase}`, `Environment, climate and governance: municipal emissions −${fmt(reducao)}% since ${cl.anoBase}`)}</SectionTitle>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t(`Emissões de CO₂ · 2024`, 'CO₂ emissions · 2024')} value={`${fmt(e24)} t`} sub={t(`−${fmt(reducao)}% face a ${cl.anoBase} · meta −${cl.meta2030}% em 2030`, `−${fmt(reducao)}% vs ${cl.anoBase} · target −${cl.meta2030}% by 2030`)} color={C.positive} />
        <KPI label={t(`Energia elétrica por habitante · ${D.energia.ano}`, `Electricity per inhabitant · ${D.energia.ano}`)} value={`${fmt(D.energia.porHab.Braga)} kWh`} sub={t(`${fmt((1 - D.energia.porHab.Braga / D.energia.porHab.Portugal) * 100)}% abaixo da média nacional`, `${fmt((1 - D.energia.porHab.Braga / D.energia.porHab.Portugal) * 100)}% below the national average`)} color={C.accent} />
        <KPI label={t(`Água por habitante · ${D.agua.ano}`, `Water per inhabitant · ${D.agua.ano}`)} value={`${fmt(D.agua.porHab.Braga, 1)} m³`} sub={t(`Portugal: ${fmt(D.agua.porHab.Portugal, 1)} m³`, `Portugal: ${fmt(D.agua.porHab.Portugal, 1)} m³`)} color={C.cyan} />
        <KPI label={t(`Tratamento terciário · ${D.aguasResiduais.ano}`, `Tertiary treatment · ${D.aguasResiduais.ano}`)} value={`${fmt(terciario, 1)}%`} sub={t('das águas residuais tratadas no concelho (o nível mais exigente)', 'of wastewater treated in the municipality (the most advanced level)')} color={C.purple} />
        <KPI label={t(`Resíduos urbanos por habitante · ${D.residuos.ano}`, `Municipal waste per inhabitant · ${D.residuos.ano}`)} value={`${fmt(D.residuos.porHab.Braga)} kg`} sub={t(`Portugal: ${fmt(D.residuos.porHab.Portugal)} kg`, `Portugal: ${fmt(D.residuos.porHab.Portugal)} kg`)} color={C.orange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`Emissões de CO₂ por setor, ${cl.anoBase} → 2024 (t)`, `CO₂ emissions by sector, ${cl.anoBase} → 2024 (t)`)}>
          {(cl.setores as [string, number, number, number][]).map(([nome, a, , b]) => (
            <div key={nome} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 90px 90px 60px', gap: 8, alignItems: 'baseline', padding: '7px 0', borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ color: C.text }}>{t(nome, nome)}</span>
              <span style={{ textAlign: 'right', color: C.textDim }}>{fmt(a)}</span>
              <span style={{ textAlign: 'right', color: C.text, fontWeight: 600 }}>{fmt(b)}</span>
              <span style={{ textAlign: 'right', color: b < a ? C.positive : C.negative, fontWeight: 700 }}>{b < a ? '−' : '+'}{fmt(Math.abs(1 - b / a) * 100)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t(`Os transportes são ${fmt((cl.setores[0][3] / e24) * 100)}% das emissões. Os edifícios de serviços, onde estão a hotelaria e a restauração, reduziram ${fmt((1 - cl.setores[3][3] / cl.setores[3][1]) * 100)}%. Meta do Pacto de Autarcas: −${cl.meta2030}% em 2030 (ambição de −${cl.ambicao2030}%) e neutralidade climática em ${cl.neutralidade}.`, `Transport is ${fmt((cl.setores[0][3] / e24) * 100)}% of emissions. Service buildings, which include hotels and restaurants, cut ${fmt((1 - cl.setores[3][3] / cl.setores[3][1]) * 100)}%. Covenant of Mayors target: −${cl.meta2030}% by 2030 (ambition −${cl.ambicao2030}%) and climate neutrality by ${cl.neutralidade}.`)}</div>
        </Card>
        <Card title={t('Braga face à região e ao país', 'Braga vs region and country')}>
          {linhaComp(t(`Energia elétrica por habitante (${D.energia.ano})`, `Electricity per inhabitant (${D.energia.ano})`), D.energia.porHab, 'kWh')}
          {linhaComp(t(`Água distribuída por habitante (${D.agua.ano})`, `Water supplied per inhabitant (${D.agua.ano})`), D.agua.porHab, 'm³', 1)}
          {linhaComp(t(`Resíduos urbanos por habitante (${D.residuos.ano})`, `Municipal waste per inhabitant (${D.residuos.ano})`), D.residuos.porHab, 'kg')}
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t(`Consumo elétrico em Braga por tipo (${D.energia.ano}): não doméstico, onde estão o comércio, os serviços e o turismo, ${fmt((e.naoDomestico / e.total) * 100)}%; doméstico ${fmt((e.domestico / e.total) * 100)}%; indústria ${fmt((e.industria / e.total) * 100)}%.`, `Electricity use in Braga by type (${D.energia.ano}): non-domestic, which includes retail, services and tourism, ${fmt((e.naoDomestico / e.total) * 100)}%; domestic ${fmt((e.domestico / e.total) * 100)}%; industry ${fmt((e.industria / e.total) * 100)}%.`)}</div>
        </Card>
      </div>
      <Card title={t('O peso do turismo no consumo do concelho (estimativa)', 'Tourism’s share of municipal consumption (estimate)')}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div><div style={{ fontSize: 30, fontWeight: 700, color: C.text }}>{fmt(pMedia, 1)}%</div><div style={{ fontSize: 13, color: C.textMuted }}>{t('da população, em média, ao longo do ano', 'of the population, on average, through the year')}</div></div>
          <div><div style={{ fontSize: 30, fontWeight: 700, color: C.orange }}>{fmt(pAgosto, 1)}%</div><div style={{ fontSize: 13, color: C.textMuted }}>{t('em agosto, o mês com mais dormidas', 'in August, the busiest month')}</div></div>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginTop: 12 }}>{t(`As ${fmt(dorm2025)} dormidas de 2025 equivalem, em média, a ${fmt(dorm2025 / 365)} pessoas por dia, face a uma população de cerca de ${fmt(Math.round(pop / 100) * 100)} habitantes (implícita nos dados do INE). Se os turistas consumirem como os residentes, representam cerca de ${fmt(pMedia, 1)}% da água, da energia doméstica e dos resíduos do concelho. É uma estimativa: não inclui visitantes de um dia nem diferenças de consumo entre turistas e residentes.`, `The ${fmt(dorm2025)} overnight stays in 2025 are on average equivalent to ${fmt(dorm2025 / 365)} people a day, against a population of about ${fmt(Math.round(pop / 100) * 100)} (implied by INE data). If tourists consume like residents, they account for about ${fmt(pMedia, 1)}% of the municipality’s water, domestic energy and waste. This is an estimate: it excludes day visitors and differences in consumption between tourists and residents.`)}</div>
      </Card>
      <Card title={t('Governança: como o destino é gerido e quem participa', 'Governance: how the destination is managed and who takes part')}>
        {(D.governanca as string[][]).map((g, i) => (
          <div key={g[0]} style={{ padding: '10px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t(g[0], g[2])}</div>
            <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, marginTop: 3 }}>{t(g[1], g[3])}</div>
          </div>
        ))}
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(237,160,107,.1)', border: '1px solid rgba(237,160,107,.3)' }}>{t('Ponto a melhorar: no Barómetro 2026, 45% dos residentes dizem que não são ouvidos nas decisões sobre o turismo. Um grupo de trabalho local da INSTO, com residentes, é a resposta natural.', 'Area to improve: in the 2026 Barometer, 45% of residents say they are not heard in tourism decisions. A local INSTO working group including residents is the natural response.')}</div>
      </Card>
      <Card title={t('Como ler os indicadores do Relatório INSTO', 'How to read the INSTO Report indicators')}>
        <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{t('O relatório usa alguns indicadores técnicos. Em poucas palavras, é isto que cada um diz:', 'The report uses a few technical indicators. In a few words, this is what each one says:')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {INDICADORES_SIMPLES.map((x) => (
            <div key={x.pt[0]} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t(x.pt[0], x.en[0])}</div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, marginTop: 4 }}>{t(x.pt[1], x.en[1])}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
