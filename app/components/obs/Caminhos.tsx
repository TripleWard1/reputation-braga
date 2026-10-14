'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CAMINHOS } from '@/app/lib/caminhos-santiago-dados';
import { t } from '@/app/lib/i18n';
import { Badge, C, Card, Cruz, HBars, MiniPie, SectionTitle, fmt, tipStyle } from './comum';

export default function Caminhos() {
  const K = CAMINHOS;
  const somaNac = K.cga2025.nacionalidades.reduce((s, [, v]) => s + v, 0);
  const nacPie: [string, number][] = [
    ...K.cga2025.nacionalidades,
    [t('Outros (23 países)', 'Others (23 countries)'), +(100 - somaNac).toFixed(1)],
  ];
  const partInicio = K.partidasBraga[0][1];
  const partFim = K.partidasBraga[K.partidasBraga.length - 1][1];
  const geira2025 = K.porCaminho2025[0][1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={t('Compostelas emitidas a quem iniciou a peregrinação na Sé de Braga. Fonte: Serviço de Peregrinos da Catedral de Santiago de Compostela, divulgado pelo Diário do Minho (05/01/2025 e 05/01/2026) e pela Associação do Caminho da Geira e dos Arrieiros.', 'Compostelas issued to those who began their pilgrimage at Braga Cathedral. Source: Pilgrims Office of the Cathedral of Santiago de Compostela.')}>
        {t('Caminhos de Santiago', 'Camino de Santiago')}
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <Badge icon="🥾" value={fmt(partFim)} label={`${t('partidas de Braga em 2025', 'departures from Braga in 2025')} (${t('o valor mais alto da série; eram', 'highest in the series; were')} ${fmt(partInicio)} ${t('em 2022', 'in 2022')})`} color={C.accent} />
        <Badge icon="🏅" value={`${K.rankingNacional}.ª`} label={`${t('posição nacional como ponto de partida', 'national position as a starting point')} (${t('líder:', 'leader:')} ${K.liderNacional})`} color={C.info} />
        <Badge icon="🧭" value={fmt(geira2025)} label={t('partidas pelo Caminho da Geira em 2025 - ultrapassou o Caminho Central pela 1.ª vez', 'departures via the Geira route in 2025 - overtook the Central route for the first time')} color={C.positive} />
        <Badge icon="📜" value={fmt(K.acumulado.peregrinos)} label={t('peregrinos no Caminho da Geira desde 2017', 'pilgrims on the Geira route since 2017')} color={C.purple} />
      </div>

      <Card title={t('Partidas de Braga por caminho (2023–2025)', 'Departures from Braga by route (2023–2025)')}>
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={K.evolucao} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="ano" tick={{ fill: C.textMuted, fontSize: 12 }} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 12 }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Geira" name="Geira e Arrieiros" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Central" name={t('Central Português', 'Portuguese Central')} stroke={C.info} strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, marginTop: 8 }}>
          {t('Em 2025, o Caminho da Geira e dos Arrieiros (567) ultrapassou pela primeira vez o Caminho Central Português (550) nas partidas de Braga. A Geira subiu de 403 (2023) para 567 (2025), enquanto o Central recuou de 674 para 550 no mesmo período.', 'In 2025, the Geira e dos Arrieiros route (567) overtook the Portuguese Central route (550) for the first time in departures from Braga. The Geira rose from 403 (2023) to 567 (2025), while the Central fell from 674 to 550 in the same period.')}
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title={t('Repartição por caminho (2025)', 'Breakdown by route (2025)')}>
          <HBars data={K.porCaminho2025} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>{t('Partidas de Braga, por itinerário (nº de Compostelas).', 'Departures from Braga, by itinerary (no. of Compostelas).')}</p>
        </Card>
        <Card title={t('Origem dos peregrinos do Caminho da Geira (2025)', 'Origin of Geira route pilgrims (2025)')}>
          <MiniPie data={nacPie} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title={t('Como percorrem o Caminho da Geira (2025)', 'How they travel the Geira route (2025)')}>
          <MiniPie data={K.cga2025.modo} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{K.cga2025.inicioBraga}{t('% inicia o percurso na própria Sé de Braga.', '% start the route at Braga Cathedral itself.')}</p>
        </Card>
        <Card title={t('Meses de maior procura - Caminho da Geira (% dos peregrinos)', 'Peak months - Geira route (% of pilgrims)')}>
          <HBars data={K.cga2025.meses} color={C.purple} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>{t('Cerca de 60% entre os 46 e 65 anos (421 peregrinos); cerca de', 'About 60% aged 46 to 65 (421 pilgrims); about')} {K.cga2025.homens}{t('% são homens.', '% are men.')}</p>
        </Card>
      </div>

      <Card title={t('Sinal no balcão Visit Braga', 'Signal at the Visit Braga front desk')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{t('Peregrinos atendidos no posto', 'Pilgrims served at the office')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: C.textDim }}>{K.balcao.peregrinos2025} {t('em 2025', 'in 2025')}</span>
              <span style={{ color: C.textDim }}>→</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.positive }}>{K.balcao.peregrinos2026}</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>{t('em 2026*', 'in 2026*')}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{t('Interesse «Caminhos de Santiago» registado', 'Recorded «Camino de Santiago» interest')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: C.textDim }}>{K.balcao.interesse2025} {t('em 2025', 'in 2025')}</span>
              <span style={{ color: C.textDim }}>→</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>{K.balcao.interesse2026}</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>{t('em 2026*', 'in 2026*')}</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>{t('*Dados de 2026 parciais (até 24 de setembro), registos de visitantes. O campo «peregrino» só passou a ser registado em 2026, por isso a comparação com 2025 não mede um aumento real.', '*Partial 2026 data (to 24 September), visitor records. The «pilgrim» field was only recorded from 2026, so the comparison with 2025 does not measure a real increase.')}</p>
      </Card>

      <Card title={t('Valor económico do peregrino', 'Economic value of the pilgrim')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Cruz label={t('impacto de cada peregrino', 'impact of each pilgrim')} value={`${String(K.economia.fatorTurista).replace('.', t(',', '.'))}×`} color={C.accent} nota={t('equivalente a turistas convencionais', 'equivalent to conventional tourists')} />
          <Cruz label={t('mais produto', 'more output')} value={`${t('até', 'up to')} +${K.economia.maisProduto}%`} color={C.positive} nota={t('por cada euro gasto pelo peregrino', 'per euro spent by the pilgrim')} />
          <Cruz label={t('mais emprego', 'more jobs')} value={`${t('até', 'up to')} +${K.economia.maisEmprego}%`} color={C.info} nota={t('por cada euro gasto pelo peregrino', 'per euro spent by the pilgrim')} />
        </div>
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>
          {t('Primeiras conclusões do estudo da Universidade de Santiago de Compostela (USC/IDEGA) sobre o Caminho na Galiza, divulgadas em abril de 2018 - não específico de Braga. Servem de enquadramento sobre o peso económico do peregrino, não como medição local.', 'Preliminary findings of the University of Santiago de Compostela (USC/IDEGA) study on the Camino in Galicia, released in April 2018 - not specific to Braga. They serve as context on the economic weight of the pilgrim, not as a local measurement.')}
        </p>
      </Card>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
        {t('Notas de leitura: os valores correspondem a Compostelas emitidas pelo Serviço de Peregrinos da Catedral de Santiago, pelo que subestimam o total real - muitos peregrinos não solicitam o documento (as associações estimam números superiores). O Caminho da Geira e dos Arrieiros tem 239 km, parte da Sé de Braga e atravessa Amares e Terras de Bouro até entrar na Galiza pela Portela do Homem (Lobios). No acumulado 2017–2025, segundo a Associação:', 'Reading notes: the figures correspond to Compostelas issued by the Pilgrims Office of the Cathedral of Santiago, so they underestimate the real total - many pilgrims do not request the document (associations estimate higher numbers). The Geira e dos Arrieiros route is 239 km long, starts at Braga Cathedral and crosses Amares and Terras de Bouro before entering Galicia via Portela do Homem (Lobios). Cumulative 2017–2025, according to the Association:')} {fmt(K.acumulado.peregrinos)} {t('peregrinos e', 'pilgrims and')} {fmt(K.acumulado.compostelas)} {t('Compostelas.', 'Compostelas.')}
      </p>
    </div>
  );
}

