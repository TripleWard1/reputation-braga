'use client';

import { SUSTENTABILIDADE } from '@/app/lib/observatorio-dados';
import { t, dl } from '@/app/lib/i18n';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { Badge, C, Card, HBars, KPI, MiniPie, SectionTitle, fmt } from './comum';

// ═══ O setor turístico: negócios certificados e retrato do TIA — só leitura ═══
function SetorSustentavel() {
  const D = SETOR_SUSTENTAVEL, T = D.tia;
  const porSelo = (D.certificados as any[]).reduce((o: Record<string, number>, c) => { o[c.selo] = (o[c.selo] || 0) + 1; return o; }, {});
  return (
    <>
      <SectionTitle sub={`${D.fonteCert} · ${T.fonte}`}>{t(`O destino tem a certificação Full; ${D.certificados.length} negócios turísticos têm certificação ambiental própria`, `The destination holds Full certification; ${D.certificados.length} tourism businesses hold their own environmental certification`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Negócios certificados', 'Certified businesses')} value={String(D.certificados.length)} sub={Object.entries(porSelo).map(([k, v]) => `${v} ${k}`).join(' · ')} color={C.positive} />
        <KPI label={t('Dependência económica do turismo', 'Economic dependence on tourism')} value={T.dependencia} sub={t('da população ativa (estimativa do TIA)', 'of the working population (TIA estimate)')} color={C.accent} />
        <KPI label={t('Recolha seletiva junto aos alojamentos', 'Recycling near accommodation')} value={`${String(T.recolhaSeletiva).replace('.', ',')}%`} sub={t('com ecoponto a menos de 100 m (200 m em zona rural)', 'with recycling point within 100 m (200 m in rural areas)')} color={C.cyan} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Negócios com certificação ambiental', 'Businesses with environmental certification')}>
          {(D.certificados as any[]).map((c, i) => (
            <div key={c.nome} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '9px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.nome}</div><div style={{ fontSize: 12, color: C.textDim }}>{c.tipo}</div></div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: C.positive, border: `1px solid ${C.positive}66`, background: C.positiveBg, whiteSpace: 'nowrap' }}>{c.selo}</span>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t('Há margem para alargar: nenhuma empresa de Braga tem ainda o Good Travel Seal, o selo para empresas da mesma entidade que certificou a cidade.', 'There is room to grow: no Braga business holds the Good Travel Seal yet, the business label from the same body that certified the city.')}</div>
        </Card>
        <Card title={t('Retrato do setor (TIA 2025)', 'Sector snapshot (TIA 2025)')}>
          {(T.oferta as [string, number][]).map(([nome, n], i) => (
            <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${C.border}` : 'none', fontSize: 13.5 }}><span style={{ color: C.text }}>{nome}</span><strong style={{ color: C.text }}>{fmt(n)}</strong></div>
          ))}
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{T.estrutura}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 8 }}>{t('Picos de procura: ', 'Demand peaks: ')}{(T.picos as string[]).join(' · ')}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{t(`Os números do TIA são de 2025. Hoje, a base municipal da taxa turística tem ${(AL_BRAGA as any).total} alojamentos locais ativos.`, `TIA figures are from 2025. Today the municipal tourist tax database lists ${(AL_BRAGA as any).total} active short-term rentals.`)}</div>
        </Card>
      </div>
    </>
  );
}

function Sustentabilidade() {
  const S = SUSTENTABILIDADE;
  const P = S.percecao; const A = S.appEco; const D = S.destino;
  const nivelCor = (n: number) => (n >= 5 ? C.positive : n >= 3 ? C.accent : C.negative);

  return (
    <>
      {/* Green Destinations hero - Full Certification */}
      <div style={{ background: `linear-gradient(135deg, ${C.positiveBg}, ${C.card})`, border: `1px solid ${C.positive}66`, borderRadius: 14, padding: '22px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <img src="https://i.imgur.com/RdXH9Nc.png" alt="Green Destinations Certified" style={{ height: 62, width: 'auto', display: 'block' }} />
            <img src="https://i.imgur.com/dP5ptj7.png" alt="GSTC Certified" style={{ height: 62, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.positive, background: C.positiveBg, border: `1px solid ${C.positive}66`, borderRadius: 5, padding: '3px 9px', marginBottom: 7 }}>
              {t('Certificação Green Destinations', 'Green Destinations certification')}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.positive, lineHeight: 1.25 }}>
              {t('Green Destinations - Full Certification (2026)', 'Green Destinations - Full Certification (2026)')}
            </div>
            <div style={{ fontSize: 12.5, color: C.text, margin: '7px 0 0', lineHeight: 1.55 }}>
              {t('Certificação de destino sustentável obtida em 2026, depois do Platinum Award de 2023.', 'Sustainable destination certification obtained in 2026, following the 2023 Platinum Award.')}
            </div>
            <div style={{ fontSize: 11.5, color: C.textMuted, margin: '6px 0 0' }}>
              {t('Monitorização da sustentabilidade turística, qualidade de vida e governação do destino · reconhecida pelo GSTC', 'Monitoring of tourism sustainability, quality of life and destination governance · GSTC-recognised')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.positive}26` }}>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.positive }}>2023</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{t('Platinum Award', 'Platinum Award')}</div>
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.positive }}>2026</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{t('Full Certification', 'Full Certification')}</div>
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: C.positive }}>GSTC</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{t('programa reconhecido', 'recognised programme')}</div>
          </div>
        </div>
      </div>

      {/* A) Perceção dos residentes */}
      <SectionTitle sub={`${t('Barómetro de Perceção dos Residentes ·', 'Residents Perception Barometer ·')} ${P.n} ${t('respostas (90,4% residentes; inclui quem trabalha ou estuda em Braga) ·', 'responses (90.4% residents; includes people who work or study in Braga) ·')} ${P.periodo}`}>{t('Perceção dos Residentes sobre o Turismo', 'Residents Perception of Tourism')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <Badge icon="👍" value={`${P.positiva}%`} label={t('perceção global positiva', 'overall positive perception')} color={C.positive} />
        <Badge icon="💶" value={`${P.beneficiaEconomia}%`} label={t('o turismo beneficia a economia', 'tourism benefits the economy')} color={C.accent} />
        <Badge icon="🎭" value={`${P.valorizaCultura}%`} label={t('valoriza a cultura local', 'values local culture')} color={C.purple} />
        <Badge icon="🏠" value={`${P.melhoraVida}%`} label={t('melhora a vida dos residentes', 'improves residents quality of life')} color={C.info} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title={t('Sinais positivos vs tensões percebidas', 'Positive signals vs perceived tensions')}>
          <HBars data={[[t('Beneficia a economia', 'Benefits the economy'), P.beneficiaEconomia], [t('Valoriza a cultura', 'Values culture'), P.valorizaCultura], [t('Respeito pela cultura local', 'Respect for local culture'), P.respeitaCultura], [t('Melhora a vida dos residentes', 'Improves residents quality of life'), P.melhoraVida]]} color={C.positive} />
          <div style={{ height: 1, background: C.border, margin: '14px 0' }} />
          <HBars data={[[t('Aumenta o custo de vida', 'Raises the cost of living'), P.custoVida], [t('Impactos ambientais', 'Environmental impacts'), P.impactosAmbientais], [t('Causa sobrelotação', 'Causes overcrowding'), P.sobrelotacao], [t('Não se sentem ouvidos', 'Do not feel heard'), P.naoOuvidos]]} color={C.negative} />
        </Card>
        <Card title={t('Índice Global de Perceção do Turismo (IGPT)', 'Global Tourism Perception Index (GTPI)')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {P.igpt.map((d) => (
              <div key={d.dim} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.text }}>{dl(d.dim)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: nivelCor(d.nivel), background: `${nivelCor(d.nivel)}1a`, padding: '3px 10px', borderRadius: 7, whiteSpace: 'nowrap' }}>{dl(d.resultado)}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: C.textDim, margin: '12px 0 0' }}>{t('Governança e participação é a dimensão a reforçar: só', 'Governance and participation is the dimension to strengthen: only')} {P.ouvidos}{t('% sentem que são ouvidos nas decisões sobre turismo.', '% feel they are heard in tourism decisions.')}</p>
        </Card>
      </div>

      {/* B) Pegada do visitante - App Eco */}
      <SectionTitle sub={`${t('App Eco · Posto de Turismo · piloto com', 'App Eco · Tourist Office · pilot with')} ${A.submissoes} ${t('submissões', 'submissions')}`}>{t('Pegada Ambiental do Visitante', 'Visitor Environmental Footprint')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <Badge icon="🌍" value={`${A.pegadaMedia}`} label={t('kg CO₂e por visitante (pegada média)', 'kg CO₂e per visitor (average footprint)')} color={C.accent} />
        <Badge icon="♻️" value={`${A.taxaReciclagem}%`} label={t(`das submissões indicam reciclagem (${Math.round((A.taxaReciclagem / 100) * A.submissoes)} de ${A.submissoes})`, `of submissions report recycling (${Math.round((A.taxaReciclagem / 100) * A.submissoes)} of ${A.submissoes})`)} color={C.positive} />
        <Badge icon="📝" value={`${A.submissoes}`} label={t('submissões no piloto', 'pilot submissions')} color={C.info} hint={t('amostra reduzida - projeto em arranque', 'small sample - project starting up')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title={t('Meio de chegada do visitante (App Eco)', 'Visitor means of arrival (App Eco)')}><MiniPie data={A.transporte} /></Card>
        <Card title={t('Alojamento escolhido (App Eco, 7 respostas)', 'Chosen accommodation (App Eco, 7 answers)')}><MiniPie data={A.alojamento} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 4 }}>
        <Card title={t('Nível de resíduos (6 respostas)', 'Waste level (6 answers)')}><HBars data={A.residuos} color={C.positive} /></Card>
        <Card title={t('Regime alimentar', 'Diet')}><HBars data={A.dieta} color={C.accent} /></Card>
        <Card title={t('Uso de climatização (13 respostas)', 'Air conditioning use (13 answers)')}><HBars data={A.climatizacao} color={C.info} /></Card>
      </div>

      {/* C) Indicadores do destino - Green Destinations TIA */}
      <SectionTitle sub="Green Destinations - Tourism Impact Assessment Braga 2025">{t('Indicadores de Sustentabilidade do Destino', 'Destination Sustainability Indicators')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="📅" value={`${D.sazonalidade}%`} label={`${t('sazonalidade', 'seasonality')} (${t('nacional', 'national')} ${D.sazonalidadeNacional}%)`} color={C.positive} hint={t('abaixo da média nacional = mais equilibrado', 'below national average = more balanced')} />
        <Badge icon="👥" value={`${D.turistasPorHabitante}`} label={t('turistas por habitante (pico)', 'tourists per resident (peak)')} color={C.info} />
        <Badge icon="🚌" value={`${D.frotaVerde}%`} label={t('frota TUB elétrica ou a gás natural', 'TUB fleet electric or natural gas')} color={C.positive} hint={t(`78 de 161 autocarros (${D.autocarrosEletricos} elétricos, 32 a gás natural); o TIA indica 60%`, `78 of 161 buses (${D.autocarrosEletricos} electric, 32 natural gas); the TIA states 60%`)} />
        <Badge icon="💡" value={`${D.iluminacaoLED}%`} label={t('iluminação pública em LED', 'public LED lighting')} color={C.accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="🍃" value={`+${D.biorresiduosVar}%`} label={t('biorresíduos recolhidos (2021→2023)', 'biowaste collected (2021→2023)')} color={C.positive} />
        <Badge icon="🤝" value={`>${D.economiaLocal}%`} label={t('economia turística gerida por locais', 'tourism economy run by locals')} color={C.purple} />
        <Badge icon="🌱" value={`${D.pegadaConcelho.toLocaleString(t('pt-PT', 'en-GB'))}`} label={t('kg CO₂e/pessoa/ano (média de testes voluntários)', 'kg CO₂e/person/year (average of voluntary tests)')} color={C.cyan} hint={t('DECO · média de 1 230 testes voluntários', 'DECO · average of 1,230 voluntary tests')} />
        <Badge icon="🚶" value={`${D.redePedestre} km`} label={t('rede de percursos pedestres', 'walking trail network')} color={C.accent} hint={`+ ${D.redeCiclavel} ${t('km de ciclovias', 'km of cycle paths')}`} />
      </div>
      <p style={{ fontSize: 11, color: C.textDim, margin: '14px 0 0', lineHeight: 1.6 }}>
        {t('Fontes: Barómetro de Perceção dos Residentes 2026 (n=', 'Sources: Residents Perception Barometer 2026 (n=')}{P.n}{t(', amostra não probabilística), App Eco do Posto de Turismo (piloto,', ', non-probabilistic sample), Tourist Office App Eco (pilot,')} {A.submissoes} {t('submissões) e Green Destinations Tourism Impact Assessment Braga 2025. Os dados da App Eco refletem uma amostra ainda reduzida e devem ser lidos como tendência inicial.', 'submissions) and Green Destinations Tourism Impact Assessment Braga 2025. The App Eco data reflects a still-small sample and should be read as an initial trend.')}
      </p>
    </>
  );
}

export default function SustentabilidadeSeparador() {
  return (<><Sustentabilidade /><SetorSustentavel /></>);
}
