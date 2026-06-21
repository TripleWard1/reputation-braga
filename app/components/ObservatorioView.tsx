'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie,
} from 'recharts';
import {
  MESES, MESES_CURTO,
  DORMIDAS_BRAGA, HOSPEDES_BRAGA, DORMIDAS_ANUAL, HOSPEDES_ANUAL,
  REVPAR_MENSAL, ADR_ANUAL, HEADLINE, INFRA, TAXA_TURISTICA, BALCAO, SUSTENTABILIDADE,
} from '@/app/lib/observatorio-dados';
import { DIGITAL } from '@/app/lib/audiencia-digital-dados';
import {
  ACESSIBILIDADE, BALCAO_DIARIO, BALCAO_LAT, BALCAO_LON,
  BALCAO_DIARIO_INICIO, BALCAO_DIARIO_FIM,
} from '@/app/lib/acessibilidade-meteo-dados';
import { CAMINHOS } from '@/app/lib/caminhos-santiago-dados';
import { openPremiumDoc, Section } from '@/app/lib/premium-doc';
import { t, dl } from '@/app/lib/i18n';

const LOGO = 'https://i.imgur.com/Vij12Qd.png';

// Formatação para documentos (pt-PT)
const dNum = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'));
const dDec = (v: number) => String(v).replace('.', t(',', '.'));
const dPct = (v: number) => (v >= 0 ? '+' : '') + dDec(v) + '%';
const dEur = (n: number) => (n >= 1e6 ? dDec(+(n / 1e6).toFixed(2)) + ' M€' : dNum(Math.round(n)) + ' €');

const C = {
  bg: '#0c0e14', card: '#161920', cardAlt: '#1c2030', border: '#252836',
  accent: '#c9a84c', accentLight: '#e8cc7e', accentBg: 'rgba(201,168,76,0.12)',
  positive: '#34d399', positiveBg: 'rgba(52,211,153,0.12)',
  negative: '#f87171', negativeBg: 'rgba(248,113,113,0.12)',
  info: '#60a5fa', purple: '#a78bfa', pink: '#f472b6', cyan: '#22d3ee', orange: '#fb923c',
  text: '#e2e0db', textMuted: '#9a99a0', textDim: '#8a8c9e',
};

const YEAR_COLORS: Record<string, string> = {
  '2019': '#9aa0b5', '2020': '#60a5fa', '2021': '#22d3ee',
  '2022': '#a78bfa', '2023': '#f472b6', '2024': '#fb923c',
  '2025': '#c9a84c', '2026': '#34d399',
};
const PAL = [C.accent, C.info, C.positive, C.purple, C.pink, C.cyan, C.orange, '#f472b6'];

type Tab = 'geral' | 'procura' | 'economia' | 'mercados' | 'balcao' | 'taxa' | 'sustentabilidade' | 'digital' | 'acessibilidade' | 'meteo' | 'caminhos' | 'cruzamentos';

interface Props { reputacaoMedia?: number | null; reputacaoLocais?: number; reputacaoReviews?: number; }

const fmt = (n: number | null | undefined, c = 0) =>
  n == null || isNaN(n as number) ? '—' : (n as number).toLocaleString('pt-PT', { minimumFractionDigits: c, maximumFractionDigits: c });
const fmtE = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} M€`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} k€`;
  return `${fmt(n)} €`;
};

export default function ObservatorioView({ reputacaoMedia, reputacaoLocais, reputacaoReviews }: Props) {
  const [tab, setTab] = useState<Tab>('geral');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'geral', label: t('Visão Geral', 'Overview') },
    { id: 'procura', label: t('Procura (INE)', 'Demand (INE)') },
    { id: 'economia', label: t('Economia', 'Economy') },
    { id: 'mercados', label: t('Mercados', 'Markets') },
    { id: 'balcao', label: t('Atendimento Balcão', 'Front Desk') },
    { id: 'taxa', label: t('Taxa Turística', 'Tourist Tax') },
    { id: 'sustentabilidade', label: t('Sustentabilidade', 'Sustainability') },
    { id: 'digital', label: t('Audiência Digital', 'Digital Audience') },
    { id: 'acessibilidade', label: t('Acessibilidade', 'Accessibility') },
    { id: 'meteo', label: t('Meteorologia', 'Weather') },
    { id: 'caminhos', label: t('Caminhos de Santiago', 'Camino de Santiago') },
    { id: 'cruzamentos', label: t('Cruzamentos', 'Cross-analysis') },
  ];
  const tabLabel = TABS.find((t) => t.id === tab)?.label || '';

  const exportProcura = () => {
    const H = HEADLINE;
    const nf = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'));
    const dec = (v: number) => String(v).replace('.', t(',', '.'));
    const pct = (v: number) => (v >= 0 ? '+' : '') + dec(v) + '%';
    const anos = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const dormBars = anos.map((y) => ({ label: y, value: DORMIDAS_ANUAL[y] || 0, display: nf(DORMIDAS_ANUAL[y] || 0) }));

    const Ds = SUSTENTABILIDADE.destino;
    const sazVals = MESES.map((m) => DORMIDAS_BRAGA[m]?.['2025'] ?? 0);
    const sazTotal = sazVals.reduce((s, v) => s + v, 0);
    let pkI = 0, trI = 0;
    sazVals.forEach((v, i) => { if (v > sazVals[pkI]) pkI = i; if (v < sazVals[trI]) trI = i; });
    const pkShare = sazTotal ? (sazVals[pkI] / sazTotal) * 100 : 0;
    const pkRatio = sazVals[trI] ? sazVals[pkI] / sazVals[trI] : 0;

    const sections: Section[] = [
      { kind: 'prose', paras: [
        t(`Em 2025, Braga registou ${nf(H.dormidas2025)} dormidas (${pct(H.dormidasVar)} face a 2024) e ${nf(H.hospedes2025)} hóspedes (${pct(H.hospedesVar)}). Fonte: INE/TravelBI.`, `In 2025, Braga recorded ${nf(H.dormidas2025)} overnight stays (${pct(H.dormidasVar)} vs 2024) and ${nf(H.hospedes2025)} guests (${pct(H.hospedesVar)}). Source: INE/TravelBI.`),
        t(`Para enquadramento regional, no acumulado de 2025 (dados preliminares) o conjunto do país cresceu ${pct(H.dormidasPTVar)} em dormidas e a Região Norte ${pct(H.dormidasNorteVar)}.`, `For regional context, in the cumulative 2025 figures (preliminary data) the country as a whole grew ${pct(H.dormidasPTVar)} in overnight stays and the Norte Region ${pct(H.dormidasNorteVar)}.`),
      ] },
      { kind: 'bars', title: t('Dormidas anuais em Braga (2019–2025)', 'Annual overnight stays in Braga (2019–2025)'), data: dormBars,
        note: t('A quebra de 2020–2021 reflete a pandemia; recuperação plena a partir de 2022. 2025 é ano completo; 2026 ainda em curso.', 'The 2020–2021 drop reflects the pandemic; full recovery from 2022. 2025 is a complete year; 2026 still ongoing.') },
      { kind: 'table', title: t('Braga no contexto regional e nacional', 'Braga in the regional and national context'), head: [t('Indicador', 'Indicator'), 'Braga', t('Norte', 'North'), 'Portugal'],
        rows: [
          [t('Ocupação por quarto', 'Room occupancy'), dec(H.ocupQuarto.Braga) + '%', dec(H.ocupQuarto.Norte) + '%', dec(H.ocupQuarto.Portugal) + '%'],
          [t('Ocupação por cama', 'Bed occupancy'), dec(H.ocupCama.Braga) + '%', dec(H.ocupCama.Norte) + '%', dec(H.ocupCama.Portugal) + '%'],
          [t('Estada média (noites)', 'Average stay (nights)'), dec(H.estadaMedia.Braga), dec(H.estadaMedia.Norte), dec(H.estadaMedia.Portugal)],
          [t('Variação das dormidas (homóloga)', 'Change in overnight stays (YoY)'), pct(H.dormidasVar), pct(H.dormidasNorteVar), pct(H.dormidasPTVar)],
        ],
        emphasizeRow: 0,
        note: t('Fonte: INE/TravelBI. Indicadores do período mais recente consolidado.', 'Source: INE/TravelBI. Indicators for the most recent consolidated period.') },
      { kind: 'stats', title: t('Sazonalidade da procura', 'Seasonality of demand'), items: [
        { label: t('Índice de sazonalidade (Braga)', 'Seasonality index (Braga)'), value: dec(Ds.sazonalidade) + '%', sub: t('menor = mais equilibrado', 'lower = more balanced') },
        { label: t('Média nacional', 'National average'), value: dec(Ds.sazonalidadeNacional) + '%' },
        { label: t('Mês de pico (2025)', 'Peak month (2025)'), value: dl(MESES[pkI]), sub: dec(+pkShare.toFixed(1)) + t('% do ano', '% of the year') },
        { label: t('Rácio pico / vale', 'Peak / trough ratio'), value: dec(+pkRatio.toFixed(1)) + '×', sub: dl(MESES[pkI]) + ' vs ' + dl(MESES[trI]) },
      ] },
      { kind: 'prose', title: t('Leitura', 'Analysis'), paras: [
        t(`A ocupação por quarto em Braga (${dec(H.ocupQuarto.Braga)}%) supera a média da Região Norte e aproxima-se da nacional, sinal de uma procura sólida apesar da estada curta.`, `Room occupancy in Braga (${dec(H.ocupQuarto.Braga)}%) exceeds the Norte Region average and approaches the national one, a sign of solid demand despite the short stay.`),
        t(`A estada média de ${dec(H.estadaMedia.Braga)} noites (${dec(H.estadaMedia.naoResidentes)} entre não residentes) confirma Braga como destino de curtas estadias e porta de entrada do Minho, com margem para estratégias que aumentem o número de noites.`, `The average stay of ${dec(H.estadaMedia.Braga)} nights (${dec(H.estadaMedia.naoResidentes)} among non-residents) confirms Braga as a short-stay destination and a gateway to the Minho, with room for strategies that increase the number of nights.`),
        t(`Braga é menos sazonal do que a média nacional (${dec(Ds.sazonalidade)}% vs ${dec(Ds.sazonalidadeNacional)}%): a procura está mais distribuída ao longo do ano. O pico mantém-se no verão (${dl(MESES[pkI])}), pelo que há margem para reforçar a época baixa.`, `Braga is less seasonal than the national average (${dec(Ds.sazonalidade)}% vs ${dec(Ds.sazonalidadeNacional)}%): demand is more spread across the year. The peak stays in summer (${dl(MESES[pkI])}), so there is room to strengthen the low season.`),
        t('2025 está completo. Os dados de 2026 são parciais (jan–abr), com as dormidas a crescerem cerca de +3,8% face ao mesmo período de 2025.', '2025 is complete. The 2026 data is partial (Jan–Apr), with overnight stays growing about +3.8% versus the same period in 2025.'),
      ] },
    ];

    openPremiumDoc({
      logo: LOGO,
      eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Procura Turística', 'Tourism Demand'),
      subtitle: t(H.periodo, H.periodo.replace('(ano completo)', '(complete year)')),
      kpis: [
        { label: t('Dormidas 2025', 'Overnight stays 2025'), value: nf(H.dormidas2025), sub: pct(H.dormidasVar) + t(' homólogo', ' YoY') },
        { label: t('Hóspedes 2025', 'Guests 2025'), value: nf(H.hospedes2025), sub: pct(H.hospedesVar) + t(' homólogo', ' YoY') },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dec(H.ocupQuarto.Braga) + '%', sub: t('Braga · Norte ', 'Braga · North ') + dec(H.ocupQuarto.Norte) + '%' },
        { label: t('Estada média', 'Average stay'), value: dec(H.estadaMedia.Braga) + t(' noites', ' nights'), sub: dec(H.estadaMedia.naoResidentes) + t(' não residentes', ' non-residents') },
      ],
      sections,
      footerR: t('Procura Turística · Fonte INE/TravelBI', 'Tourism Demand · Source INE/TravelBI'),
    });
  };

  const exportEconomia = () => {
    const H = HEADLINE;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Economia do Alojamento', 'Accommodation Economy'), subtitle: t('INE/TravelBI · indicadores 2024', 'INE/TravelBI · 2024 indicators'),
      kpis: [
        { label: 'RevPAR Braga', value: dEur(H.revpar2024.Braga), sub: '2024' },
        { label: 'ADR Braga', value: dEur(H.adr2024.Braga), sub: '2024' },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dDec(H.ocupQuarto.Braga) + '%', sub: 'Braga' },
        { label: t('Proveitos 2024', 'Revenue 2024'), value: dDec(H.proveitos.Braga2024) + ' M€', sub: dPct(H.proveitos.varBraga) + t(' face a 2023', ' vs 2023') },
      ],
      sections: [
        { kind: 'table', title: t('Desempenho hoteleiro 2024 — Braga vs Norte vs Portugal', 'Hotel performance 2024 — Braga vs North vs Portugal'),
          head: [t('Indicador', 'Indicator'), 'Braga', t('Norte', 'North'), 'Portugal'],
          rows: [
            [t('RevPAR (rendimento por quarto disponível)', 'RevPAR (revenue per available room)'), dEur(H.revpar2024.Braga), dEur(H.revpar2024.Norte), dEur(H.revpar2024.Portugal)],
            [t('ADR (rendimento por quarto ocupado)', 'ADR (revenue per occupied room)'), dEur(H.adr2024.Braga), dEur(H.adr2024.Norte), dEur(H.adr2024.Portugal)],
            [t('Ocupação por quarto', 'Room occupancy'), dDec(H.ocupQuarto.Braga) + '%', dDec(H.ocupQuarto.Norte) + '%', dDec(H.ocupQuarto.Portugal) + '%'],
            [t('Ocupação por cama', 'Bed occupancy'), dDec(H.ocupCama.Braga) + '%', dDec(H.ocupCama.Norte) + '%', dDec(H.ocupCama.Portugal) + '%'],
          ], emphasizeRow: 0,
          note: t('Fonte: INE/TravelBI, 2024.', 'Source: INE/TravelBI, 2024.') },
        { kind: 'bars', title: t('Variação dos proveitos do alojamento (2023 → 2024)', 'Change in accommodation revenue (2023 → 2024)'),
          data: [
            { label: 'Braga', value: H.proveitos.varBraga, display: dPct(H.proveitos.varBraga) },
            { label: 'Norte', value: H.proveitos.varNorte, display: dPct(H.proveitos.varNorte) },
            { label: 'Portugal', value: H.proveitos.varPortugal, display: dPct(H.proveitos.varPortugal) },
          ],
          note: t(`Proveitos de alojamento em Braga: ${dDec(H.proveitos.Braga2023)} M€ (2023) para ${dDec(H.proveitos.Braga2024)} M€ (2024).`, `Accommodation revenue in Braga: ${dDec(H.proveitos.Braga2023)} M€ (2023) to ${dDec(H.proveitos.Braga2024)} M€ (2024).`) },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`Braga apresenta RevPAR e ADR abaixo das médias regional e nacional — preços médios mais baixos — mas uma ocupação por quarto (${dDec(H.ocupQuarto.Braga)}%) superior à da Região Norte e próxima da nacional.`, `Braga shows RevPAR and ADR below the regional and national averages — lower average prices — but a room occupancy (${dDec(H.ocupQuarto.Braga)}%) higher than the Norte Region and close to the national one.`),
          t('A combinação de ocupação elevada com preço médio contido aponta margem para estratégias de valorização do preço médio (qualificação da oferta, eventos âncora, captação de segmentos de maior valor), sem dependência de aumentar volumes.', 'The combination of high occupancy with a contained average price points to room for strategies that raise the average price (upgrading the offer, anchor events, attracting higher-value segments), without relying on increasing volumes.'),
        ] },
      ],
      footerR: t('Economia do Alojamento · Fonte INE/TravelBI', 'Accommodation Economy · Source INE/TravelBI'),
    });
  };

  const exportMercados = () => {
    const b25 = BALCAO['2025']; const b26 = BALCAO['2026'];
    const top = HEADLINE.mercados2025;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Mercados Emissores', 'Source Markets'), subtitle: t('INE 2025 · Atendimento de Balcão', 'INE 2025 · Front Desk'),
      kpis: [
        { label: t('Principal mercado', 'Main market'), value: dl(top[0]), sub: t('INE · por dormidas', 'INE · by overnight stays') },
        { label: t('Nacionalidade #1 (balcão)', 'Nationality #1 (front desk)'), value: dl(b26.nacionalidades[0][0]), sub: dNum(b26.nacionalidades[0][1]) + t(' em 2026', ' in 2026') },
        { label: t('Cidade #1 (balcão)', 'City #1 (front desk)'), value: dl(b26.cidades[0][0]), sub: dNum(b26.cidades[0][1]) + t(' em 2026', ' in 2026') },
        { label: t('Mercados no top', 'Markets in top'), value: String(top.length), sub: t('internacionais (INE)', 'international (INE)') },
      ],
      sections: [
        { kind: 'table', title: t('Principais mercados internacionais (INE 2025, por dormidas)', 'Main international markets (INE 2025, by overnight stays)'),
          head: ['#', t('Mercado', 'Market')], rows: top.map((m, i) => [String(i + 1), dl(m)]), emphasizeRow: 0,
          note: t('Espanha lidera, seguida de Brasil, França e Reino Unido.', 'Spain leads, followed by Brazil, France and the United Kingdom.') },
        { kind: 'bars', title: t('Nacionalidades no balcão (2026, top 10)', 'Front desk nationalities (2026, top 10)'),
          data: b26.nacionalidades.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Cidades de origem dos visitantes (balcão 2026, top 10)', 'Visitor origin cities (front desk 2026, top 10)'),
          data: b26.cidades.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
        { kind: 'prose', title: 'Leitura', paras: [
          t('O domínio ibérico é claro: Espanha encabeça tanto as dormidas (INE) como o atendimento físico no balcão, reforçada por cidades como Madrid, Vigo, A Coruña e Bilbao no topo das origens.', 'Iberian dominance is clear: Spain leads both overnight stays (INE) and physical front desk visits, reinforced by cities such as Madrid, Vigo, A Coruña and Bilbao at the top of the origins.'),
          t(`Para referência, em 2025 o balcão registou ${dNum(b25.nacionalidades[0][1])} atendimentos a espanhóis; em 2026 (ano em curso) já vai em ${dNum(b26.nacionalidades[0][1])}.`, `For reference, in 2025 the front desk recorded ${dNum(b25.nacionalidades[0][1])} visits by Spaniards; in 2026 (ongoing year) it already stands at ${dNum(b26.nacionalidades[0][1])}.`),
        ] },
      ],
      footerR: t('Mercados Emissores · INE / Balcão', 'Source Markets · INE / Front Desk'),
    });
  };

  const exportBalcao = () => {
    const b = BALCAO['2026'];
    const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Posto de Turismo', 'Municipality of Braga · Tourist Office'),
      title: t('Atendimento de Balcão', 'Front Desk Service'), subtitle: t('2026 (ano em curso, até junho)', '2026 (ongoing year, to June)'),
      kpis: [
        { label: t('Atendimentos', 'Visits'), value: dNum(b.atendimentos) },
        { label: t('Pessoas (pax)', 'People (pax)'), value: dNum(b.pax) },
        { label: t('Visitantes', 'Visitors'), value: pctVisit + '%', sub: dNum(b.visitantes) + t(' turistas', ' tourists') },
        { label: t('Peregrinos', 'Pilgrims'), value: dNum(b.peregrinos), sub: t('Caminhos de Santiago', 'Camino de Santiago') },
      ],
      sections: [
        { kind: 'bars', title: t('O que procuram (interesses, top 10)', 'What they look for (interests, top 10)'),
          data: b.interesses.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
        { kind: 'bars', title: t('Meio de chegada', 'Means of arrival'),
          data: b.meioChegada.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'table', title: t('Nacionalidades (top 10)', 'Nationalities (top 10)'),
          head: [t('Nacionalidade', 'Nationality'), t('Atendimentos', 'Visits')], rows: b.nacionalidades.slice(0, 10).map((x: [string, number]) => [dl(x[0]), dNum(x[1])]) },
        { kind: 'prose', title: t('Nota', 'Note'), paras: [
          t('Cada registo corresponde a um atendimento no Posto de Turismo. Os dados de 2026 são do ano em curso (até junho), pelo que os totais anuais serão superiores.', 'Each record corresponds to one visit at the Tourist Office. The 2026 data is for the ongoing year (to June), so the annual totals will be higher.'),
        ] },
      ],
      footerR: t('Atendimento de Balcão · Posto de Turismo', 'Front Desk Service · Tourist Office'),
    });
  };

  const exportTaxa = () => {
    const TX = TAXA_TURISTICA;
    const anos = ['2021', '2022', '2023', '2024', '2025'];
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Taxa Municipal Turística', 'Municipal Tourist Tax'), subtitle: t('Receita 2021–2026', 'Revenue 2021–2026'),
      kpis: [
        { label: t('Receita 2025', 'Revenue 2025'), value: dEur(TX['2025'].Total), sub: dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100) + ' vs 2024' },
        { label: t('Receita 2024', 'Revenue 2024'), value: dEur(TX['2024'].Total) },
        { label: t('Empreendimentos', 'Establishments'), value: dNum(INFRA.empreendimentos), sub: t('hotéis e similares', 'hotels and similar') },
        { label: t('Alojamento Local', 'Local Accommodation'), value: dNum(INFRA.alojamentoLocal), sub: t('registos AL', 'AL registrations') },
      ],
      sections: [
        { kind: 'bars', title: t('Receita anual total (€)', 'Total annual revenue (€)'),
          data: anos.map((y) => ({ label: y, value: TX[y].Total, display: dEur(TX[y].Total) })),
          note: t('Crescimento sustentado desde a retoma pós-pandemia.', 'Sustained growth since the post-pandemic recovery.') },
        { kind: 'prose', title: t('Enquadramento', 'Context'), paras: [
          t('Regulamento n.º 927/2025: 1,50 € por dormida, até ao máximo de 4 noites, aplicável a hóspedes com mais de 16 anos.', 'Regulation no. 927/2025: €1.50 per overnight stay, up to a maximum of 4 nights, applicable to guests over 16 years old.'),
          t(`A receita de 2025 totalizou ${dEur(TX['2025'].Total)}, mais ${dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100)} do que em 2024. O arranque de 2026 reflete a entrada em vigor do novo valor da taxa (janeiro: ${dEur(TX['2026'].Janeiro)}).`, `The 2025 revenue totalled ${dEur(TX['2025'].Total)}, ${dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100)} more than in 2024. The start of 2026 reflects the new tax rate coming into force (January: ${dEur(TX['2026'].Janeiro)}).`),
        ] },
      ],
      footerR: t('Taxa Municipal Turística', 'Municipal Tourist Tax'),
    });
  };

  const exportSustentabilidade = () => {
    const S = SUSTENTABILIDADE; const P = S.percecao; const D = S.destino;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Green Destinations', 'Municipality of Braga · Green Destinations'),
      title: t('Sustentabilidade do Destino', 'Destination Sustainability'), subtitle: t(`Certificação ${D.certificacao} · perceção e indicadores`, `${D.certificacao} certification · perception and indicators`),
      kpis: [
        { label: t('Certificação', 'Certification'), value: 'Platinum', sub: 'Green Destinations' },
        { label: t('Perceção positiva', 'Positive perception'), value: dDec(P.positiva) + '%', sub: t(`residentes · n=${P.n}`, `residents · n=${P.n}`) },
        { label: t('Sazonalidade', 'Seasonality'), value: dDec(D.sazonalidade) + '%', sub: t(`nacional ${dDec(D.sazonalidadeNacional)}%`, `national ${dDec(D.sazonalidadeNacional)}%`) },
        { label: t('Frota TUB verde', 'Green TUB fleet'), value: dDec(D.frotaVerde) + '%', sub: t(`${D.autocarrosEletricos} elétricos`, `${D.autocarrosEletricos} electric`) },
      ],
      sections: [
        { kind: 'bars', title: t('Perceção dos residentes — sinais positivos', 'Residents perception — positive signals'),
          data: [
            { label: t('O turismo beneficia a economia', 'Tourism benefits the economy'), value: P.beneficiaEconomia, display: dDec(P.beneficiaEconomia) + '%' },
            { label: t('Valoriza a cultura local', 'Values local culture'), value: P.valorizaCultura, display: dDec(P.valorizaCultura) + '%' },
            { label: t('Respeito pela cultura local', 'Respect for local culture'), value: P.respeitaCultura, display: dDec(P.respeitaCultura) + '%' },
            { label: t('Melhora a vida dos residentes', 'Improves residents quality of life'), value: P.melhoraVida, display: dDec(P.melhoraVida) + '%' },
          ], color: '#34d399' },
        { kind: 'bars', title: t('Tensões percebidas', 'Perceived tensions'),
          data: [
            { label: t('Aumenta o custo de vida', 'Raises the cost of living'), value: P.custoVida, display: dDec(P.custoVida) + '%' },
            { label: t('Impactos ambientais', 'Environmental impacts'), value: P.impactosAmbientais, display: dDec(P.impactosAmbientais) + '%' },
            { label: t('Causa sobrelotação', 'Causes overcrowding'), value: P.sobrelotacao, display: dDec(P.sobrelotacao) + '%' },
            { label: t('Não se sentem ouvidos', 'Do not feel heard'), value: P.naoOuvidos, display: dDec(P.naoOuvidos) + '%' },
          ], color: '#f87171' },
        { kind: 'table', title: t('Indicadores de sustentabilidade do destino', 'Destination sustainability indicators'),
          head: [t('Indicador', 'Indicator'), t('Valor', 'Value')], rows: [
            [t('Sazonalidade (concentração no verão)', 'Seasonality (summer concentration)'), dDec(D.sazonalidade) + '%'],
            [t('Turistas por habitante (pico)', 'Tourists per resident (peak)'), dDec(D.turistasPorHabitante)],
            [t('Frota TUB amiga do ambiente', 'Eco-friendly TUB fleet'), dDec(D.frotaVerde) + '%'],
            [t('Iluminação pública em LED', 'Public LED lighting'), dDec(D.iluminacaoLED) + '%'],
            [t('Economia turística gerida por locais', 'Tourism economy run by locals'), '>' + dDec(D.economiaLocal) + '%'],
            [t('Rede de percursos pedestres', 'Walking trail network'), dNum(D.redePedestre) + ' km'],
          ],
          note: t(`Fontes: Barómetro de Perceção dos Residentes 2026 (n=${P.n}, amostra não probabilística) e Green Destinations Tourism Impact Assessment Braga 2025.`, `Sources: Residents Perception Barometer 2026 (n=${P.n}, non-probabilistic sample) and Green Destinations Tourism Impact Assessment Braga 2025.`) },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`A perceção global é muito positiva (${dDec(P.positiva)}%), com economia e cultura como dimensões mais fortes. A dimensão a reforçar é a governança e participação: apenas ${dDec(P.ouvidos)}% dos residentes sentem que são ouvidos nas decisões sobre turismo.`, `Overall perception is very positive (${dDec(P.positiva)}%), with economy and culture as the strongest dimensions. The dimension to strengthen is governance and participation: only ${dDec(P.ouvidos)}% of residents feel they are heard in tourism decisions.`),
        ] },
      ],
      footerR: t('Sustentabilidade · Green Destinations', 'Sustainability · Green Destinations'),
    });
  };

  const exportDigital = () => {
    const k = DIGITAL.kpis;
    const totalCanais = DIGITAL.canais.reduce((s, x) => s + x[1], 0);
    const totalDisp = DIGITAL.dispositivos.reduce((s, x) => s + x[1], 0);
    const pctOrg = Math.round((DIGITAL.canais[0][1] / totalCanais) * 100);
    const pctMob = Math.round((DIGITAL.dispositivos[0][1] / totalDisp) * 100);
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · visitbraga.travel', 'Municipality of Braga · visitbraga.travel'),
      title: t('Audiência Digital', 'Digital Audience'), subtitle: `Google Analytics · ${DIGITAL.periodo}`,
      kpis: [
        { label: t('Utilizadores', 'Users'), value: dNum(k.utilizadores) },
        { label: t('Visualizações', 'Views'), value: dNum(k.visualizacoes) },
        { label: t('Envolvimento', 'Engagement'), value: dDec(k.taxaEnvolvimento) + '%' },
        { label: t('Páginas / utilizador', 'Pages / user'), value: dDec(k.pagsPorUtilizador) },
      ],
      sections: [
        { kind: 'bars', title: t('Canais de aquisição', 'Acquisition channels'),
          data: DIGITAL.canais.map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'bars', title: t('Top países (utilizadores)', 'Top countries (users)'),
          data: DIGITAL.paises.slice(0, 8).map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Páginas mais vistas', 'Most viewed pages'),
          data: DIGITAL.paginas.slice(0, 8).map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#a78bfa' },
        { kind: 'prose', title: t('Leitura estratégica', 'Strategic reading'), paras: [
          t(`${pctOrg}% dos utilizadores chegam por pesquisa orgânica — o que reforça a prioridade da estratégia SEO/GEO para o Visit Braga.`, `${pctOrg}% of users arrive via organic search — which reinforces the priority of the SEO/GEO strategy for Visit Braga.`),
          t(`${pctMob}% acede por telemóvel: a experiência mobile é determinante.`, `${pctMob}% access via mobile: the mobile experience is decisive.`),
          t('Os picos de tráfego coincidem com eventos sazonais (Luzes de Natal, Passagem de Ano), que dominam as páginas mais vistas. Cidades por deteção aproximada de IP; entradas sem cidade definida excluídas dos tops.', 'Traffic peaks coincide with seasonal events (Christmas Lights, New Year), which dominate the most viewed pages. Cities by approximate IP detection; entries without a defined city excluded from the tops.'),
        ] },
      ],
      footerR: t('Audiência Digital · GA4 visitbraga.travel', 'Digital Audience · GA4 visitbraga.travel'),
    });
  };

  const exportAcessibilidade = () => {
    const A = ACESSIBILIDADE;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Posto de Turismo', 'Municipality of Braga · Tourist Office'),
      title: t('Acessibilidade no Atendimento', 'Accessibility in Service'), subtitle: t('Necessidades especiais registadas no balcão', 'Special needs recorded at the front desk'),
      kpis: [
        { label: t('Atendimentos registados', 'Recorded visits'), value: dNum(A.total) },
        { label: t('Pessoas abrangidas', 'People covered'), value: dNum(A.pax) },
        { label: t('% do total de atendimentos', '% of total visits'), value: dDec(A.pct) + '%' },
      ],
      sections: [
        { kind: 'prose', title: t('Amostra reduzida — leitura cautelosa', 'Small sample — read with caution'), paras: [
          t(`O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado (${A.total} em ${dNum(A.totalAtendimentos)} atendimentos). Os números abaixo são um ponto de partida e não refletem a procura real.`, `Recording of special needs only began in 2026 and is heavily underused (${A.total} of ${dNum(A.totalAtendimentos)} visits). The numbers below are a starting point and do not reflect real demand.`),
          t('O valor deste indicador cresce com o registo sistemático no balcão — vale a pena reforçar essa prática junto da equipa de atendimento.', 'The value of this indicator grows with systematic recording at the front desk — it is worth reinforcing this practice with the service team.'),
        ] },
        { kind: 'bars', title: t('Por tipo de necessidade', 'By type of need'),
          data: A.tipos.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Por mês (2026)', 'By month (2026)'),
          data: A.porMes.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
      ],
      footerR: t('Acessibilidade no Atendimento', 'Accessibility in Service'),
    });
  };

  const exportCaminhos = () => {
    const K = CAMINHOS;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Caminhos de Santiago', 'Camino de Santiago'), subtitle: t('Partidas de Braga · Serviço de Peregrinos da Catedral de Santiago', 'Departures from Braga · Pilgrims Office of the Cathedral of Santiago'),
      kpis: [
        { label: t('Partidas de Braga 2025', 'Departures from Braga 2025'), value: dNum(K.partidasBraga[K.partidasBraga.length - 1][1]), sub: t('recorde', 'record') },
        { label: t('Posição nacional', 'National position'), value: K.rankingNacional + '.ª', sub: t(`líder: ${K.liderNacional}`, `leader: ${K.liderNacional}`) },
        { label: t('Caminho da Geira 2025', 'Geira Route 2025'), value: dNum(K.porCaminho2025[0][1]), sub: t('lidera pela 1.ª vez', 'leads for the first time') },
        { label: t('Acumulado da Geira', 'Geira cumulative'), value: dNum(K.acumulado.peregrinos), sub: t('desde 2017', 'since 2017') },
      ],
      sections: [
        { kind: 'table', title: t('Partidas de Braga por caminho (2023–2025)', 'Departures from Braga by route (2023–2025)'),
          head: [t('Ano', 'Year'), dl('Geira e Arrieiros'), dl('Central Português')],
          rows: K.evolucao.map((e) => [e.ano, dNum(e.Geira), dNum(e.Central)]), emphasizeRow: 2,
          note: t('Em 2025 o Caminho da Geira ultrapassou pela primeira vez o Central nas partidas de Braga.', 'In 2025 the Geira route overtook the Central for the first time in departures from Braga.') },
        { kind: 'bars', title: t('Repartição por caminho (2025)', 'Breakdown by route (2025)'),
          data: K.porCaminho2025.map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })) },
        { kind: 'bars', title: t('Origem dos peregrinos do Caminho da Geira (2025)', 'Origin of Geira route pilgrims (2025)'),
          data: K.cga2025.nacionalidades.map((x) => ({ label: dl(x[0]), value: x[1], display: dDec(x[1]) + '%' })), color: '#60a5fa' },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`Braga registou ${dNum(K.partidasBraga[K.partidasBraga.length - 1][1])} partidas em 2025 (o valor mais elevado de que há registo) e subiu à ${K.rankingNacional}.ª posição nacional como ponto de partida. ${dDec(K.cga2025.inicioBraga)}% dos peregrinos do Caminho da Geira iniciam na Sé de Braga.`, `Braga recorded ${dNum(K.partidasBraga[K.partidasBraga.length - 1][1])} departures in 2025 (the highest on record) and rose to national position ${K.rankingNacional} as a starting point. ${dDec(K.cga2025.inicioBraga)}% of Geira route pilgrims start at Braga Cathedral.`),
          t('Os valores correspondem a Compostelas emitidas, pelo que subestimam o total real (muitos peregrinos não solicitam o documento). As associações estimam números superiores.', 'The figures correspond to issued Compostelas, so they underestimate the real total (many pilgrims do not request the document). Associations estimate higher numbers.'),
        ] },
      ],
      footerR: t('Caminhos de Santiago · Serviço de Peregrinos', 'Camino de Santiago · Pilgrims Office'),
    });
  };

  const exportGeral = () => {
    const H = HEADLINE;
    const dormBars = Object.entries(DORMIDAS_ANUAL).filter(([, v]) => v != null).map(([y, v]) => ({ label: y, value: v as number, display: dNum(v as number) }));
    const taxaBars = ['2021', '2022', '2023', '2024', '2025'].map((y) => ({ label: y, value: TAXA_TURISTICA[y].Total, display: dEur(TAXA_TURISTICA[y].Total) }));
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Síntese do Destino', 'Destination Overview'), subtitle: t('Indicadores-chave do turismo de Braga', 'Key indicators of Braga tourism'),
      kpis: [
        { label: t('Reputação média', 'Average reputation'), value: reputacaoMedia != null ? dDec(+reputacaoMedia.toFixed(1)) + '/10' : '—', sub: t(`${reputacaoLocais ?? 0} locais · ${dNum(reputacaoReviews ?? 0)} reviews`, `${reputacaoLocais ?? 0} sites · ${dNum(reputacaoReviews ?? 0)} reviews`) },
        { label: t('Dormidas 2025', 'Overnight stays 2025'), value: dNum(H.dormidas2025), sub: dPct(H.dormidasVar) + t(' homólogo', ' YoY') },
        { label: t('Hóspedes 2025', 'Guests 2025'), value: dNum(H.hospedes2025), sub: dPct(H.hospedesVar) + t(' homólogo', ' YoY') },
        { label: t('Receita da taxa 2025', 'Tax revenue 2025'), value: dEur(TAXA_TURISTICA['2025'].Total) },
        { label: t('Atendimentos balcão 2025', 'Front desk visits 2025'), value: dNum(BALCAO['2025'].atendimentos), sub: dNum(BALCAO['2025'].pax) + ' pax' },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dDec(H.ocupQuarto.Braga) + '%', sub: t(`estada média ${dDec(H.estadaMedia.Braga)} noites`, `average stay ${dDec(H.estadaMedia.Braga)} nights`) },
      ],
      sections: [
        { kind: 'bars', title: t('Dormidas anuais em Braga (2019–2025)', 'Annual overnight stays in Braga (2019–2025)'), data: dormBars, note: t('Fonte: INE/TravelBI.', 'Source: INE/TravelBI.') },
        { kind: 'bars', title: t('Receita da Taxa Municipal Turística (€/ano)', 'Municipal Tourist Tax revenue (€/year)'), data: taxaBars, color: '#a78bfa', note: t('Taxa de 1,50 € por dormida (regulamento n.º 927/2025).', 'Tax of €1.50 per overnight stay (regulation no. 927/2025).') },
        { kind: 'prose', title: t('Cruzamento reputação × procura', 'Reputation × demand cross-analysis'), paras: [
          t('Três fontes independentes triangulam a mesma realidade: o que as pessoas dizem (reputação online), onde dormem (INE e taxa turística) e o que procuram ao balcão.', 'Three independent sources triangulate the same reality: what people say (online reputation), where they stay (INE and tourist tax) and what they look for at the front desk.'),
          t('Quando a reputação de um ponto de interesse âncora cai, isso costuma anteceder quebras na procura; a receita da taxa permite quantificar o retorno de cada intervenção.', 'When the reputation of an anchor point of interest drops, it usually precedes falls in demand; the tax revenue allows quantifying the return of each intervention.'),
        ] },
      ],
      footerR: t('Síntese do Destino', 'Destination Overview'),
    });
  };

  const exportCruzamentos = () => {
    const canon = (s: string) => (s === 'Estados Unidos' ? 'EUA' : s);
    const bal = (BALCAO['2026'].nacionalidades as [string, number][]).map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
    const dig = DIGITAL.paises.map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
    const balTotal = bal.reduce((s, [, n]) => s + n, 0) || 1;
    const digTotal = dig.reduce((s, [, n]) => s + n, 0) || 1;
    const balMap: Record<string, number> = {}; bal.forEach(([c, n]) => { balMap[c] = (n / balTotal) * 100; });
    const digMap: Record<string, number> = {}; dig.forEach(([c, n]) => { digMap[c] = (n / digTotal) * 100; });
    const ineRank: Record<string, number> = {}; HEADLINE.mercados2025.forEach((c, i) => { ineRank[canon(c)] = i + 1; });
    const markets = Array.from(new Set([...Object.keys(balMap), ...Object.keys(digMap)]));
    const rows = markets.map((m) => ({ m, bal: balMap[m] || 0, dig: digMap[m] || 0, ine: ineRank[m] || null, gap: (digMap[m] || 0) - (balMap[m] || 0) }))
      .sort((a, b) => (b.bal + b.dig) - (a.bal + a.dig)).slice(0, 12);
    const digitalOver = [...rows].filter((r) => r.gap > 3).sort((a, b) => b.gap - a.gap).slice(0, 3);
    const fisicoOver = [...rows].filter((r) => r.gap < -3).sort((a, b) => a.gap - b.gap).slice(0, 3);
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Cruzamento de Mercados', 'Market Cross-analysis'), subtitle: t('Presença física (balcão) vs interesse digital (site)', 'Physical presence (front desk) vs digital interest (site)'),
      kpis: [
        { label: t('Principal mercado (INE)', 'Main market (INE)'), value: dl(HEADLINE.mercados2025[0]) },
        { label: t('Topo no balcão', 'Top at front desk'), value: dl([...rows].sort((a, b) => b.bal - a.bal)[0]?.m || '—'), sub: t('presença física', 'physical presence') },
        { label: t('Topo no digital', 'Top in digital'), value: dl([...rows].sort((a, b) => b.dig - a.dig)[0]?.m || '—'), sub: t('interesse online', 'online interest') },
        { label: t('Mercados cruzados', 'Cross-referenced markets'), value: String(rows.length) },
      ],
      sections: [
        { kind: 'table', title: t('Mercados: ranking INE, presença física e interesse digital', 'Markets: INE ranking, physical presence and digital interest'),
          head: [t('Mercado', 'Market'), 'INE', t('Balcão', 'Front desk'), 'Digital'],
          rows: rows.map((r) => [dl(r.m), r.ine ? ('#' + r.ine) : '—', dDec(+r.bal.toFixed(1)) + '%', dDec(+r.dig.toFixed(1)) + '%']),
          note: t('Quota % excluindo Portugal (mercado doméstico). INE = posição por dormidas.', 'Share % excluding Portugal (domestic market). INE = position by overnight stays.') },
        { kind: 'stats', title: t('Mais interesse online que presença física', 'More online interest than physical presence'),
          items: digitalOver.length ? digitalOver.map((r) => ({ label: dl(r.m), value: '+' + dDec(+r.gap.toFixed(1)) + ' pp', sub: t('online acima de física', 'online above physical') })) : [{ label: '—', value: t('Sem divergências', 'No divergences'), sub: t('relevantes', 'relevant') }] },
        { kind: 'stats', title: t('Mais presença física que pegada online', 'More physical presence than online footprint'),
          items: fisicoOver.length ? fisicoOver.map((r) => ({ label: dl(r.m), value: dDec(+r.gap.toFixed(1)) + ' pp', sub: t('física acima de online', 'physical above online') })) : [{ label: '—', value: t('Sem divergências', 'No divergences'), sub: t('relevantes', 'relevant') }] },
        { kind: 'prose', title: t('Notas de leitura', 'Reading notes'), paras: [
          t('As três fontes medem coisas diferentes: INE são dormidas reais; o balcão é apenas quem entra no posto de turismo (fatia pequena e auto-selecionada, dados de 2026); o digital é a audiência do site (inclui investigação e possível tráfego automatizado, como nos valores elevados da China).', 'The three sources measure different things: INE are real overnight stays; the front desk is only those who enter the tourist office (a small, self-selected share, 2026 data); digital is the site audience (includes research and possible automated traffic, as in the high figures from China).'),
          t('Portugal foi excluído por ser mercado doméstico. Lê isto como indício para investigar, não como prova.', 'Portugal was excluded as it is the domestic market. Read this as a clue to investigate, not as proof.'),
        ] },
      ],
      footerR: t('Cruzamento de Mercados', 'Market Cross-analysis'),
    });
  };

  const exportarPDF = () => {
    const node = document.getElementById('obs-print-area');
    if (!node) return;
    const win = window.open('', '_blank', 'width=1180,height=860');
    if (!win) { alert(t('Permita pop-ups para exportar o PDF.', 'Allow pop-ups to export the PDF.')); return; }
    const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: '2-digit', month: 'long', year: 'numeric' });
    const html =
      '<!DOCTYPE html><html lang="' + t('pt', 'en') + '"><head><meta charset="utf-8">' +
      '<title>' + t('Observatório de Turismo de Braga', 'Braga Tourism Observatory') + ' — ' + tabLabel + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{box-sizing:border-box;}' +
      'body{margin:0;font-family:"DM Sans",sans-serif;background:#0c0e14;color:#e2e0db;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.brand{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:2px solid #c9a84c;}' +
      '.brand img{height:30px;}' +
      '.brand .meta{text-align:right;}' +
      '.brand h1{font-size:17px;margin:0;color:#c9a84c;letter-spacing:-0.01em;}' +
      '.brand .sub{font-size:12px;color:#9a99a0;margin-top:2px;}' +
      '.content{padding:18px 24px;}' +
      '.content button{display:none !important;}' +
      '.content > div > div:first-child{break-inside:avoid;}' +
      'footer{padding:14px 28px;border-top:1px solid #252836;font-size:10px;color:#8a8c9e;display:flex;justify-content:space-between;}' +
      '@page{margin:12mm;}' +
      '</style></head><body>' +
      '<div class="brand"><img src="https://i.imgur.com/Vij12Qd.png" alt="Visit Braga">' +
      '<div class="meta"><h1>' + t('Observatório de Turismo de Braga', 'Braga Tourism Observatory') + '</h1><div class="sub">' + tabLabel + ' · ' + hoje + '</div></div></div>' +
      '<div class="content">' + node.innerHTML + '</div>' +
      '<footer><span>' + t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division') + '</span>' +
      '<span>' + t('Fontes: INE/TravelBI · Taxa Municipal Turística · Atendimento de Balcão', 'Sources: INE/TravelBI · Municipal Tourist Tax · Front Desk') + '</span></footer>' +
      '<script>setTimeout(function(){window.focus();window.print();},700);</script>' +
      '</body></html>';
    win.document.open(); win.document.write(html); win.document.close();
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: C.text }}>{t('Observatório de Turismo de Braga', 'Braga Tourism Observatory')}</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>{t('Análise integrada de dados reais — INE/TravelBI · Atendimento de Balcão · Taxa Municipal Turística', 'Integrated analysis of real data — INE/TravelBI · Front Desk · Municipal Tourist Tax')}</p>
        </div>
        {tab !== 'meteo' && (
          <button onClick={() => {
            const map: Record<string, () => void> = {
              geral: exportGeral, procura: exportProcura, economia: exportEconomia, mercados: exportMercados,
              balcao: exportBalcao, taxa: exportTaxa, sustentabilidade: exportSustentabilidade,
              digital: exportDigital, acessibilidade: exportAcessibilidade, caminhos: exportCaminhos,
              cruzamentos: exportCruzamentos,
            };
            (map[tab] || exportarPDF)();
          }} style={{
            padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accentBg,
            color: C.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          }}>{t('⬇ Exportar PDF', '⬇ Export PDF')}</button>
        )}
      </div>

      {/* Sub-navegação */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.accent : C.textMuted,
            borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}`, marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <div id="obs-print-area">
        {tab === 'geral' && <Geral rep={reputacaoMedia} repL={reputacaoLocais} repR={reputacaoReviews} />}
        {tab === 'procura' && <Procura />}
        {tab === 'economia' && <Economia />}
        {tab === 'mercados' && <Mercados />}
        {tab === 'balcao' && <Balcao />}
        {tab === 'taxa' && <Taxa />}
        {tab === 'sustentabilidade' && <Sustentabilidade />}
        {tab === 'digital' && <Digital />}
        {tab === 'acessibilidade' && <Acessibilidade />}
        {tab === 'meteo' && <Meteorologia />}
        {tab === 'caminhos' && <Caminhos />}
        {tab === 'cruzamentos' && <Cruzamentos />}
      </div>
    </div>
  );
}

// ─── Componentes base ────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = C.accent }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: color, opacity: 0.85 }}>{sub}</div>}
    </div>
  );
}
function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
function Chips({ options, sel, toggle, single, label }: { options: string[]; sel: string[]; toggle: (o: string) => void; single?: boolean; label?: (o: string) => string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = sel.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            padding: '4px 11px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: on ? 600 : 400,
            border: `1px solid ${on ? (YEAR_COLORS[o] || C.accent) : C.border}`,
            background: on ? (YEAR_COLORS[o] ? `${YEAR_COLORS[o]}22` : C.accentBg) : 'transparent',
            color: on ? (YEAR_COLORS[o] || C.accentLight) : C.textMuted,
          }}>{label ? label(o) : o}</button>
        );
      })}
    </div>
  );
}
const tipStyle = { background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

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
  if (isNaN(r)) return '—';
  const a = Math.abs(r);
  const f = a < 0.2 ? t('muito fraca', 'very weak') : a < 0.4 ? t('fraca', 'weak') : a < 0.6 ? t('moderada', 'moderate') : t('forte', 'strong');
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)} (${f})`;
};

function HBars({ data, color }: { data: [string, number][]; color?: string }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map(([k, v], i) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: C.text }}>{dl(k)}</span>
            <span style={{ color: C.textMuted }}>{fmt(v)}</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
            <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: color || PAL[i % PAL.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
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
              <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: cor[k] || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.bg }}>{v}{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VISÃO GERAL ─────────────────────────────────────────────────────────────
function Geral({ rep, repL, repR }: { rep?: number | null; repL?: number; repR?: number }) {
  const dormDataAnual = Object.entries(DORMIDAS_ANUAL).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, dormidas: v as number }));
  const taxaAnual = Object.entries(TAXA_TURISTICA).map(([y, m]) => ({ ano: y, total: y === '2026' ? Object.entries(m).filter(([k]) => k !== 'Total').reduce((s, [, v]) => s + v, 0) : (m.Total || 0) }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Dormidas 2025', 'Overnight stays 2025')} value={fmt(HEADLINE.dormidas2025)} sub={`+${HEADLINE.dormidasVar}% ${t('homólogo', 'YoY')}`} color={HEADLINE.dormidasVar >= 0 ? C.positive : C.negative} />
        <KPI label={t('Hóspedes 2025', 'Guests 2025')} value={fmt(HEADLINE.hospedes2025)} sub={`+${HEADLINE.hospedesVar}% ${t('homólogo', 'YoY')}`} color={C.accentLight} />
        <KPI label={t('Taxa Turística 2025', 'Tourist Tax 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} sub={t('receita municipal', 'municipal revenue')} color={C.accent} />
        <KPI label={t('Atendimentos Balcão 2025', 'Front Desk Visits 2025')} value={fmt(BALCAO['2025'].atendimentos)} sub={`${fmt(BALCAO['2025'].pax)} pax`} color={C.info} />
        <KPI label={t('Estada Média', 'Average Stay')} value={`${HEADLINE.estadaMedia.Braga}`} sub={t('noites (INE 2024)', 'nights (INE 2024)')} color={C.purple} />
        <KPI label={t('Ocupação-quarto', 'Room Occupancy')} value={`${HEADLINE.ocupQuarto.Braga}%`} sub={t('líquida (INE 2024)', 'net (INE 2024)')} color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Dormidas anuais em Braga (INE/TravelBI)', 'Annual overnight stays in Braga (INE/TravelBI)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dormDataAnual} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Dormidas', 'Overnight stays')]} />
              <Bar dataKey="dormidas" radius={[4, 4, 0, 0]}>
                {dormDataAnual.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Receita da Taxa Municipal Turística (€/ano)', 'Municipal Tourist Tax revenue (€/year)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taxaAnual} margin={{ top: 6, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), t('Receita', 'Revenue')]} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {taxaAnual.map((d) => <Cell key={d.ano} fill={d.ano === '2026' ? C.textDim : C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>{t('2026 parcial (jan–mar). O salto reflete a entrada em vigor da taxa de 1,50 €/dormida.', '2026 partial (Jan–Mar). The jump reflects the tax of €1.50/overnight coming into force.')}</p>
        </Card>
      </div>

      <Card title={t('◈ Cruzamento Reputação Online × Procura Real', '◈ Online Reputation × Real Demand Cross-analysis')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Cruz label={t('Reputação média (plataforma)', 'Average reputation (platform)')} value={rep != null ? `${rep.toFixed(1)}/10` : '—'} color={C.accent} nota={`${repL ?? 0} ${t('locais', 'places')} · ${fmt(repR ?? 0)} reviews`} />
          <Cruz label={t('Dormidas 2025 (INE)', 'Overnight stays 2025 (INE)')} value={fmt(HEADLINE.dormidas2025)} color={C.info} nota={`+${HEADLINE.dormidasVar}% ${t('homólogo', 'YoY')}`} />
          <Cruz label={t('Atendimentos balcão 2025', 'Front desk visits 2025')} value={fmt(BALCAO['2025'].atendimentos)} color={C.positive} nota={`${fmt(BALCAO['2025'].pax)} ${t('visitantes', 'visitors')}`} />
          <Cruz label={t('Receita taxa 2025', 'Tax revenue 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} color={C.purple} nota={t('dado próprio do Município', 'Municipality\u2019s own data')} />
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '14px 0 0', lineHeight: 1.6 }}>
          {t('Três fontes independentes a triangular a mesma realidade: o que as pessoas ', 'Three independent sources triangulating the same reality: what people ')}<strong>{t('dizem', 'say')}</strong>{t(' (reputação), onde ', ' (reputation), where they ')}<strong>{t('dormem', 'sleep')}</strong>{t(' (INE + taxa) e o que ', ' (INE + tax) and what they ')}<strong>{t('procuram', 'seek')}</strong>{t(' ao balcão. Quando a reputação de um POI âncora cai, costuma anteceder quebras na procura — e a receita da taxa permite quantificar o retorno de cada intervenção.', ' at the front desk. When the reputation of an anchor POI falls, it usually precedes drops in demand — and the tax revenue lets you quantify the return of each intervention.')}
        </p>
      </Card>
    </>
  );
}
function Cruz({ label, value, color, nota }: { label: string; value: string; color: string; nota: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textDim }}>{nota}</div>
    </div>
  );
}

// ─── PROCURA (INE) ───────────────────────────────────────────────────────────
function Procura() {
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

      <Card title={`${metric === 'dormidas' ? t('Dormidas', 'Overnight stays') : t('Hóspedes', 'Guests')} ${t('mensais em Braga — comparação plurianual', 'monthly in Braga — multi-year comparison')}`}
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
              <div style={{ width: `${Math.min(100, (v / 45) * 100)}%`, height: '100%', borderRadius: 5, background: color }} />
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
    </>
  );
}

// ─── ECONOMIA ────────────────────────────────────────────────────────────────
function Economia() {
  const revparData = MESES.map((m, i) => {
    const row: any = { mes: dl(MESES_CURTO[i]) };
    ['2022', '2023', '2024'].forEach((y) => { row[y] = REVPAR_MENSAL[m]?.[y] ?? null; });
    return row;
  });
  const adrData = Object.entries(ADR_ANUAL).map(([y, v]) => ({ ano: y, adr: v }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
        <CompareBars title={t('RevPAR 2024 — rendimento por quarto disponível (€)', 'RevPAR 2024 — revenue per available room (€)')} vals={HEADLINE.revpar2024} unit="€" />
        <CompareBars title={t('ADR 2024 — rendimento por quarto ocupado (€)', 'ADR 2024 — revenue per occupied room (€)')} vals={HEADLINE.adr2024} unit="€" />
        <CompareBars title={t('Taxa líquida de ocupação-quarto 2024 (%)', 'Net room occupancy rate 2024 (%)')} vals={HEADLINE.ocupQuarto} unit="%" />
        <CompareBars title={t('Taxa líquida de ocupação-cama 2024 (%)', 'Net bed occupancy rate 2024 (%)')} vals={HEADLINE.ocupCama} unit="%" />
      </div>

      <Card title={t('RevPAR mensal em Braga (€) — 2022 a 2024', 'Monthly RevPAR in Braga (€) — 2022 to 2024')}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revparData} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v} €`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {['2022', '2023', '2024'].map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Card title={t('ADR anual em Braga (€) — 2018 a 2024', 'Annual ADR in Braga (€) — 2018 to 2024')}>
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
        <Card title={t('Proveitos do alojamento (variação 2023→2024)', 'Accommodation revenue (change 2023→2024)')}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.accent }}>{fmtE(HEADLINE.proveitos.Braga2024 * 1e6)}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{t('Braga 2024 · de', 'Braga 2024 · from')} {HEADLINE.proveitos.Braga2023} {t('M€ em 2023', 'M€ in 2023')}</div>
          </div>
          <CompareBars title={t('Variação dos proveitos 2023–2024 (%)', 'Revenue change 2023–2024 (%)')} vals={{ Braga: HEADLINE.proveitos.varBraga, Norte: HEADLINE.proveitos.varNorte, Portugal: HEADLINE.proveitos.varPortugal }} unit="%" />
        </Card>
      </div>
    </>
  );
}

// ─── MERCADOS ────────────────────────────────────────────────────────────────
function Mercados() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`${t('Nacionalidades no balcão —', 'Nationalities at the front desk —')} ${ano}`}>
          <HBars data={b.nacionalidades.slice(0, 12)} />
        </Card>
        <Card title={`${t('Cidades de origem dos visitantes —', 'Cities of origin of visitors —')} ${ano}`}>
          <HBars data={b.cidades.slice(0, 12)} color={C.info} />
        </Card>
      </div>
      <Card title={t('Principais mercados emissores internacionais (INE 2025, por dormidas)', 'Main international source markets (INE 2025, by overnight stays)')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HEADLINE.mercados2025.map((m, i) => (
            <span key={m} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i < 4 ? C.accentBg : C.bg, color: i < 4 ? C.accentLight : C.textMuted, border: `1px solid ${C.border}` }}>
              {i + 1}. {dl(m)}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: '12px 0 0', lineHeight: 1.5 }}>
          {t('Espanha é o principal mercado internacional, seguida de Brasil, França e Reino Unido. O balcão confirma o domínio ibérico (Espanha + cidades como Madrid, Vigo, A Coruña, Bilbao no topo).', 'Spain is the main international market, followed by Brazil, France and the United Kingdom. The front desk confirms Iberian dominance (Spain + cities such as Madrid, Vigo, A Coruña and Bilbao at the top).')}
        </p>
      </Card>
    </>
  );
}

// ─── ATENDIMENTO BALCÃO ──────────────────────────────────────────────────────
function Balcao() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  const mensal = MESES.map((m, i) => {
    const v = b.mensal[String(i + 1)];
    return { mes: dl(MESES_CURTO[i]), atendimentos: v ? v[0] : null, pax: v ? v[1] : null };
  });
  const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          {t('Dados do Posto de Turismo — cada registo é um atendimento ao balcão.', 'Tourist Office data — each record is one front desk visit.')} {ano === '2026' ? t('Ano em curso (até junho).', 'Year in progress (to June).') : t('Ano completo.', 'Complete year.')}
        </p>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Atendimentos', 'Visits')} value={fmt(b.atendimentos)} color={C.accent} />
        <KPI label={t('Pessoas (pax)', 'People (pax)')} value={fmt(b.pax)} color={C.accentLight} />
        <KPI label={t('Visitantes', 'Visitors')} value={`${pctVisit}%`} sub={`${fmt(b.visitantes)} ${t('de turistas', 'tourists')}`} color={C.info} />
        <KPI label={t('Peregrinos', 'Pilgrims')} value={fmt(b.peregrinos)} sub="Caminhos de Santiago" color={C.purple} />
        <KPI label={t('Grupos', 'Groups')} value={fmt(b.grupos)} color={C.cyan} />
        <KPI label={t('Com crianças', 'With children')} value={fmt(b.criancas)} color={C.pink} />
      </div>

      <Card title={`${t('Atendimentos e pessoas por mês —', 'Visits and people per month —')} ${ano}`}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={mensal} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="atendimentos" name={t('Atendimentos', 'Visits')} fill={C.accent} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="pax" name={t('Pessoas (pax)', 'People (pax)')} stroke={C.info} strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`${t('O que procuram (interesses) —', 'What they look for (interests) —')} ${ano}`}><HBars data={b.interesses.slice(0, 10)} color={C.accent} /></Card>
        <Card title={`${t('Nacionalidades —', 'Nationalities —')} ${ano}`}><HBars data={b.nacionalidades.slice(0, 10)} color={C.info} /></Card>
        {b.meioChegada.length > 0 && <Card title={`${t('Meio de chegada —', 'Means of arrival —')} ${ano}`}><HBars data={b.meioChegada} color={C.positive} /></Card>}
        {b.alojamento.length > 0 && <Card title={`${t('Tipo de alojamento —', 'Accommodation type —')} ${ano}`}><HBars data={b.alojamento} color={C.purple} /></Card>}
      </div>

      {ano === '2025' && (
        <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}30`, borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          {t('Nota: em 2025 o registo de “meio de chegada” e parte dos interesses ainda não era sistemático, daí os totais mais baixos nessas dimensões. A partir de 2026 a recolha é muito mais completa.', 'Note: in 2025 the recording of “means of arrival” and part of the interests was not yet systematic, hence the lower totals in those dimensions. From 2026 the data collection is much more complete.')}
        </div>
      )}
    </>
  );
}

// ─── TAXA TURÍSTICA ──────────────────────────────────────────────────────────
// ─── SUSTENTABILIDADE ────────────────────────────────────────────────────────
const SUS_PAL = [C.positive, C.info, C.accent, C.purple, C.pink, C.cyan];

function Badge({ icon, value, label, color = C.accent, hint }: { icon: string; value: string; label: string; color?: string; hint?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${color}30`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.3 }}>{label}</div>
        </div>
      </div>
      {hint && <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ margin: '22px 0 12px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.accentLight, letterSpacing: '-0.01em' }}>{children}</div>
      {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MiniPie({ data, height = 210 }: { data: [string, number][]; height?: number }) {
  const rows = data.map(([name, value], i) => ({ name: dl(name), value, fill: SUS_PAL[i % SUS_PAL.length] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
          {rows.map((r, i) => <Cell key={i} fill={r.fill} />)}
        </Pie>
        <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v}%`, n]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Sustentabilidade() {
  const S = SUSTENTABILIDADE;
  const P = S.percecao; const A = S.appEco; const D = S.destino;
  const nivelCor = (n: number) => (n >= 5 ? C.positive : n >= 3 ? C.accent : C.negative);

  return (
    <>
      {/* Green Destinations hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.positiveBg}, ${C.card})`, border: `1px solid ${C.positive}40`, borderRadius: 14, padding: '20px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: C.positiveBg, border: `2px solid ${C.positive}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🌿</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.positive }}>{t('Green Destinations — Certificação', 'Green Destinations — Certification')} {D.certificacao}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{t('Monitorização da sustentabilidade turística, qualidade de vida e governação do destino · em progresso para a certificação Full', 'Monitoring of tourism sustainability, quality of life and destination governance · in progress towards Full certification')}</div>
        </div>
      </div>

      {/* A) Perceção dos residentes */}
      <SectionTitle sub={`${t('Barómetro de Perceção dos Residentes ·', 'Residents Perception Barometer ·')} ${P.n} ${t('respostas ·', 'responses ·')} ${P.periodo}`}>{t('Perceção dos Residentes sobre o Turismo', 'Residents Perception of Tourism')}</SectionTitle>
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

      {/* B) Pegada do visitante — App Eco */}
      <SectionTitle sub={`${t('App Eco · Posto de Turismo · piloto com', 'App Eco · Tourist Office · pilot with')} ${A.submissoes} ${t('submissões', 'submissions')}`}>{t('Pegada Ambiental do Visitante', 'Visitor Environmental Footprint')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <Badge icon="🌍" value={`${A.pegadaMedia}`} label={t('kg CO₂e por visitante (pegada média)', 'kg CO₂e per visitor (average footprint)')} color={C.accent} />
        <Badge icon="♻️" value={`${A.taxaReciclagem}%`} label={t('dos visitantes reciclam', 'of visitors recycle')} color={C.positive} />
        <Badge icon="📝" value={`${A.submissoes}`} label={t('submissões no piloto', 'pilot submissions')} color={C.info} hint={t('amostra reduzida — projeto em arranque', 'small sample — project starting up')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title={t('Meio de chegada do visitante (App Eco)', 'Visitor means of arrival (App Eco)')}><MiniPie data={A.transporte} /></Card>
        <Card title={t('Alojamento escolhido (App Eco)', 'Chosen accommodation (App Eco)')}><MiniPie data={A.alojamento} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 4 }}>
        <Card title={t('Nível de resíduos', 'Waste level')}><HBars data={A.residuos} color={C.positive} /></Card>
        <Card title={t('Regime alimentar', 'Diet')}><HBars data={A.dieta} color={C.accent} /></Card>
        <Card title={t('Uso de climatização', 'Air conditioning use')}><HBars data={A.climatizacao} color={C.info} /></Card>
      </div>

      {/* C) Indicadores do destino — Green Destinations TIA */}
      <SectionTitle sub="Green Destinations — Tourism Impact Assessment Braga 2025">{t('Indicadores de Sustentabilidade do Destino', 'Destination Sustainability Indicators')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="📅" value={`${D.sazonalidade}%`} label={`${t('sazonalidade', 'seasonality')} (${t('nacional', 'national')} ${D.sazonalidadeNacional}%)`} color={C.positive} hint={t('abaixo da média nacional = mais equilibrado', 'below national average = more balanced')} />
        <Badge icon="👥" value={`${D.turistasPorHabitante}`} label={t('turistas por habitante (pico)', 'tourists per resident (peak)')} color={C.info} />
        <Badge icon="🚌" value={`${D.frotaVerde}%`} label={t('frota TUB amiga do ambiente', 'eco-friendly TUB fleet')} color={C.positive} hint={`${D.autocarrosEletricos} ${t('autocarros elétricos', 'electric buses')}`} />
        <Badge icon="💡" value={`${D.iluminacaoLED}%`} label={t('iluminação pública em LED', 'public LED lighting')} color={C.accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="🍃" value={`+${D.biorresiduosVar}%`} label={t('biorresíduos recolhidos (2021→2023)', 'biowaste collected (2021→2023)')} color={C.positive} />
        <Badge icon="🤝" value={`>${D.economiaLocal}%`} label={t('economia turística gerida por locais', 'tourism economy run by locals')} color={C.purple} />
        <Badge icon="🌱" value={`${D.pegadaConcelho.toLocaleString(t('pt-PT', 'en-GB'))}`} label={t('kg CO₂e/pessoa/ano (concelho)', 'kg CO₂e/person/year (municipality)')} color={C.cyan} hint={t('DECO · 1.230 testes', 'DECO · 1,230 tests')} />
        <Badge icon="🚶" value={`${D.redePedestre} km`} label={t('rede de percursos pedestres', 'walking trail network')} color={C.accent} hint={`+ ${D.redeCiclavel} ${t('km de ciclovias', 'km of cycle paths')}`} />
      </div>
      <p style={{ fontSize: 11, color: C.textDim, margin: '14px 0 0', lineHeight: 1.6 }}>
        {t('Fontes: Barómetro de Perceção dos Residentes 2026 (n=', 'Sources: Residents Perception Barometer 2026 (n=')}{P.n}{t(', amostra não probabilística), App Eco do Posto de Turismo (piloto,', ', non-probabilistic sample), Tourist Office App Eco (pilot,')} {A.submissoes} {t('submissões) e Green Destinations Tourism Impact Assessment Braga 2025. Os dados da App Eco refletem uma amostra ainda reduzida e devem ser lidos como tendência inicial.', 'submissions) and Green Destinations Tourism Impact Assessment Braga 2025. The App Eco data reflects a still-small sample and should be read as an initial trend.')}
      </p>
    </>
  );
}

function Taxa() {
  const [anos, setAnos] = useState<string[]>(['2023', '2024', '2025']);
  const todos = ['2021', '2022', '2023', '2024', '2025', '2026'];
  const toggle = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const mensal = MESES.map((m) => {
    const row: any = { mes: m.slice(0, 3) };
    anos.forEach((y) => { row[y] = TAXA_TURISTICA[y]?.[m] ?? null; });
    return row;
  });
  const totais = ['2021', '2022', '2023', '2024', '2025'].map((y) => ({ ano: y, total: TAXA_TURISTICA[y].Total }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Receita 2025', 'Revenue 2025')} value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="+23% vs 2024" color={C.positive} />
        <KPI label={t('Receita 2024', 'Revenue 2024')} value={fmtE(TAXA_TURISTICA['2024'].Total)} color={C.accent} />
        <KPI label={t('Empreendimentos', 'Establishments')} value={fmt(INFRA.empreendimentos)} sub={t('hotéis e similares', 'hotels and similar')} color={C.info} />
        <KPI label={t('Alojamento Local', 'Local Accommodation')} value={fmt(INFRA.alojamentoLocal)} sub={t('registos AL', 'AL registrations')} color={C.purple} />
      </div>

      <Card title={t('Receita mensal da Taxa Municipal Turística (€)', 'Monthly Municipal Tourist Tax revenue (€)')}
        right={<Chips options={todos} sel={anos} toggle={toggle} />}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mensal} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmtE(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {anos.map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2026' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          {t('Reg. n.º 927/2025 · 1,50 €/dormida · até 4 noites · hóspedes > 16 anos. O salto de 2026 (jan:', 'Reg. no. 927/2025 · €1.50/overnight · up to 4 nights · guests > 16 years. The 2026 jump (Jan:')} {fmtE(TAXA_TURISTICA['2026'].Janeiro)}{t(') reflete a entrada em vigor do novo valor da taxa.', ') reflects the new tax rate coming into force.')}
        </p>
      </Card>

      <Card title={t('Receita anual total (€)', 'Total annual revenue (€)')}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={totais} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), t('Receita', 'Revenue')]} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>{totais.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}

// ─── Audiência Digital (Google Analytics — visitbraga.travel) ───
function Digital() {
  const k = DIGITAL.kpis;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={`Google Analytics · ${DIGITAL.periodo}`}>{t('Audiência Digital — visitbraga.travel', 'Digital Audience — visitbraga.travel')}</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label={t('Utilizadores', 'Users')} value={fmt(k.utilizadores)} color={C.accent} />
        <KPI label={t('Novos utilizadores', 'New users')} value={fmt(k.novos)} color={C.info} />
        <KPI label={t('Visualizações', 'Views')} value={fmt(k.visualizacoes)} color={C.positive} />
        <KPI label={t('Taxa de envolvimento', 'Engagement rate')} value={`${k.taxaEnvolvimento.toLocaleString(t('pt-PT', 'en-GB'))}%`} color={C.purple} />
        <KPI label={t('Tempo médio', 'Average time')} value={`${k.tempoMedioSeg}s`} sub={t('por utilizador', 'per user')} color={C.cyan} />
        <KPI label={t('Páginas / utilizador', 'Pages / user')} value={k.pagsPorUtilizador.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} color={C.orange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Canais de aquisição', 'Acquisition channels')}><MiniPie data={DIGITAL.canais} /></Card>
        <Card title={t('Dispositivo', 'Device')}><MiniPie data={DIGITAL.dispositivos} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Top países', 'Top countries')}><HBars data={DIGITAL.paises} color={C.info} /></Card>
        <Card title={t('Top idiomas', 'Top languages')}><HBars data={DIGITAL.idiomas} color={C.positive} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Top cidades', 'Top cities')}><HBars data={DIGITAL.cidades} color={C.accent} /></Card>
        <Card title={t('Páginas mais vistas', 'Most viewed pages')}><HBars data={DIGITAL.paginas} color={C.purple} /></Card>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('Leitura estratégica', 'Strategic reading')}</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: C.text, fontSize: 13, lineHeight: 1.7 }}>
          <li><strong>63%</strong> {t('dos utilizadores chegam por', 'of users arrive via')} <strong>{t('pesquisa orgânica', 'organic search')}</strong>{t(' — reforça a prioridade da estratégia SEO/GEO para o Visit Braga.', ' — reinforces the priority of the SEO/GEO strategy for Visit Braga.')}</li>
          <li><strong>74%</strong> {t('acede por', 'access via')} <strong>{t('telemóvel', 'mobile')}</strong>{t(' — a experiência mobile é determinante.', ' — the mobile experience is decisive.')}</li>
          <li>{t('Mercados internacionais com mais tráfego:', 'International markets with the most traffic:')} <strong>{t('França, Espanha, China, EUA e Brasil', 'France, Spain, China, USA and Brazil')}</strong>{t(' — alinhado com os mercados emissores físicos do balcão.', ' — aligned with the physical source markets at the front desk.')}</li>
          <li>{t('Os picos de tráfego coincidem com', 'Traffic peaks coincide with')} <strong>{t('eventos sazonais', 'seasonal events')}</strong>{t(' (Luzes de Natal, Passagem de Ano), que dominam as páginas mais vistas.', ' (Christmas Lights, New Year), which dominate the most viewed pages.')}</li>
        </ul>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        {t('Fonte: Google Analytics 4', 'Source: Google Analytics 4')} ({t('propriedade visitbraga.travel', 'visitbraga.travel property')}){t(', período', ', period')} {DIGITAL.periodo}{t('. As cidades resultam de deteção aproximada por IP; entradas sem cidade definida foram excluídas dos tops.', '. Cities come from approximate IP detection; entries without a defined city were excluded from the tops.')}
      </p>
    </div>
  );
}

// ─── Acessibilidade no Atendimento (balcão) ───
function Acessibilidade() {
  const A = ACESSIBILIDADE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={t('Necessidades especiais registadas no balcão de turismo', 'Special needs recorded at the tourism front desk')}>{t('Acessibilidade no Atendimento', 'Accessibility in Service')}</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label={t('Atendimentos registados', 'Recorded visits')} value={fmt(A.total)} color={C.accent} />
        <KPI label={t('Pessoas abrangidas', 'People covered')} value={fmt(A.pax)} color={C.info} />
        <KPI label={t('% do total de atendimentos', '% of total visits')} value={`${A.pct.toLocaleString(t('pt-PT', 'en-GB'))}%`} color={C.purple} />
      </div>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>{t('⚠ Amostra reduzida — leitura cautelosa', '⚠ Small sample — read with caution')}</div>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
          {t('O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado', 'Recording of special needs only began in 2026 and is heavily underused')} ({A.total} {t('em', 'of')} {fmt(A.totalAtendimentos)} {t('atendimentos', 'visits')}){t('. Os números abaixo são um ponto de partida e não refletem a procura real. O valor deste módulo cresce com o registo sistemático no balcão — vale a pena reforçar essa prática junto da equipa de atendimento.', '. The numbers below are a starting point and do not reflect real demand. The value of this module grows with systematic recording at the front desk — it is worth reinforcing this practice with the service team.')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Por tipo de necessidade', 'By type of need')}><HBars data={A.tipos} color={C.info} /></Card>
        <Card title={t('Por mês (2026)', 'By month (2026)')}><HBars data={A.porMes} color={C.accent} /></Card>
      </div>
    </div>
  );
}

// ─── Meteorologia × Afluência (open-meteo) ───
function Meteorologia() {
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
        {t('Não foi possível obter os dados meteorológicos. Detalhe:', 'Could not fetch the weather data. Detail:')} {err}{t('. A API open-meteo é gratuita e sem chave — confirma a ligação e tenta novamente.', '. The open-meteo API is free and key-less — check the connection and try again.')}
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
          {t('A afluência ao balcão depende sobretudo da época do ano, do dia da semana e de eventos — não só do tempo. Além disso, 2026 tem um nível de registo muito superior a 2025. Por isso a análise é feita', 'Front desk footfall depends mostly on the time of year, the day of the week and events — not just the weather. Moreover, 2026 has a much higher recording level than 2025. The analysis is therefore done')} <strong>{t('separadamente por ano', 'separately by year')}</strong>{t(' e deve ser lida como exploratória, não como prova de causa-efeito.', ' and should be read as exploratory, not as proof of cause and effect.')}
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
                    <span style={{ color: C.text }}>☀ {t('Dias secos', 'Dry days')} ({y.dryN})</span>
                    <span style={{ color: C.textMuted }}>{y.dryAvg.toFixed(1)} {t('atend./dia', 'visits/day')}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div style={{ width: `${(y.dryAvg / mx) * 100}%`, height: '100%', background: C.accent }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>🌧 {t('Dias de chuva', 'Rainy days')} ({y.rainyN})</span>
                    <span style={{ color: C.textMuted }}>{y.rainyAvg.toFixed(1)} {t('atend./dia', 'visits/day')}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div style={{ width: `${(y.rainyAvg / mx) * 100}%`, height: '100%', background: C.info }} />
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

      <Card title={t('Evolução semanal — atendimento médio vs temperatura máxima média', 'Weekly evolution — average visits vs average max temperature')}>
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

// ─── Cruzamentos de dados (físico × digital × INE) ───
function Cruzamentos() {
  const canon = (s: string) => (s === 'Estados Unidos' ? 'EUA' : s);
  const bal: [string, number][] = (BALCAO['2026'].nacionalidades as [string, number][])
    .map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
  const dig: [string, number][] = DIGITAL.paises
    .map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
  const balTotal = bal.reduce((s, [, n]) => s + n, 0) || 1;
  const digTotal = dig.reduce((s, [, n]) => s + n, 0) || 1;
  const balMap: Record<string, number> = {}; bal.forEach(([c, n]) => { balMap[c] = (n / balTotal) * 100; });
  const digMap: Record<string, number> = {}; dig.forEach(([c, n]) => { digMap[c] = (n / digTotal) * 100; });
  const ineRank: Record<string, number> = {}; HEADLINE.mercados2025.forEach((c, i) => { ineRank[canon(c)] = i + 1; });

  const markets = Array.from(new Set([...Object.keys(balMap), ...Object.keys(digMap)]));
  const rows = markets.map((m) => ({
    m, bal: balMap[m] || 0, dig: digMap[m] || 0, ine: ineRank[m] || null, gap: (digMap[m] || 0) - (balMap[m] || 0),
  })).sort((a, b) => (b.bal + b.dig) - (a.bal + a.dig)).slice(0, 12);
  const maxShare = Math.max(...rows.map((r) => Math.max(r.bal, r.dig)), 1);
  const digitalOver = [...rows].filter((r) => r.gap > 3).sort((a, b) => b.gap - a.gap).slice(0, 3);
  const fisicoOver = [...rows].filter((r) => r.gap < -3).sort((a, b) => a.gap - b.gap).slice(0, 3);
  const dot = (cor: string) => ({ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: cor, marginRight: 5 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={t('Os mesmos mercados vistos por três fontes independentes', 'The same markets seen through three independent sources')}>{t('Cruzamentos de Dados', 'Data Cross-analysis')}</SectionTitle>

      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.textMuted, flexWrap: 'wrap' }}>
        <span><span style={dot(C.accent)} />{t('Balcão — presença física', 'Front desk — physical presence')}</span>
        <span><span style={dot(C.info)} />{t('Digital — interesse online', 'Digital — online interest')}</span>
        <span style={{ color: C.textDim }}>{t('#n = posição no ranking INE (dormidas)', '#n = position in INE ranking (overnight stays)')}</span>
      </div>

      <Card title={t('Mercados emissores · presença física vs interesse digital (quota %, excluindo Portugal)', 'Source markets · physical presence vs online interest (share %, excluding Portugal)')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {rows.map((r) => (
            <div key={r.m} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 52px', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: C.text }}>{dl(r.m)}</span>
                {r.ine && <span style={{ fontSize: 10, color: C.accent, background: C.accentBg, padding: '1px 6px', borderRadius: 6 }}>#{r.ine}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                  <div style={{ width: `${(r.bal / maxShare) * 100}%`, height: '100%', background: C.accent }} />
                </div>
                <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                  <div style={{ width: `${(r.dig / maxShare) * 100}%`, height: '100%', background: C.info }} />
                </div>
              </div>
              <div style={{ fontSize: 11, textAlign: 'right' }}>
                <div style={{ color: C.accent }}>{r.bal.toFixed(1)}%</div>
                <div style={{ color: C.info }}>{r.dig.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Mais interesse online que presença física', 'More online interest than physical presence')}>
          {digitalOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {digitalOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{dl(r.m)}</span>
                  <span style={{ color: C.info, fontWeight: 600 }}>+{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>{t('Sem divergências relevantes.', 'No relevant divergences.')}</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>{t('Mercados com curiosidade online ainda por converter em visita — ou tráfego de pesquisa/bots a validar.', 'Markets with online curiosity not yet converted into a visit — or search/bot traffic to validate.')}</div>
        </Card>
        <Card title={t('Mais presença física que pegada online', 'More physical presence than online footprint')}>
          {fisicoOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fisicoOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{dl(r.m)}</span>
                  <span style={{ color: C.accent, fontWeight: 600 }}>{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>{t('Sem divergências relevantes.', 'No relevant divergences.')}</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>{t('Chegam sem passar tanto pelo site — há margem para os captar em canais digitais.', 'They arrive without going through the site as much — there is room to capture them on digital channels.')}</div>
        </Card>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        {t('As três fontes medem coisas diferentes: INE = dormidas reais; balcão = apenas quem entra no posto de turismo (fatia pequena e auto-selecionada, dados de 2026); digital = audiência do site (inclui investigação e possível tráfego automatizado, p. ex. valores elevados da China). Portugal foi excluído por ser mercado doméstico. Lê isto como indício para investigar, não como prova.', 'The three sources measure different things: INE = real overnight stays; front desk = only those who enter the tourist office (a small, self-selected share, 2026 data); digital = the site audience (includes research and possible automated traffic, e.g. the high figures from China). Portugal was excluded as it is the domestic market. Read this as a clue to investigate, not as proof.')}
      </p>
    </div>
  );
}

function Caminhos() {
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
      <SectionTitle sub={t('Compostelas emitidas a quem iniciou a peregrinação na Sé de Braga. Fonte: Serviço de Peregrinos da Catedral de Santiago de Compostela.', 'Compostelas issued to those who began their pilgrimage at Braga Cathedral. Source: Pilgrims Office of the Cathedral of Santiago de Compostela.')}>
        {t('Caminhos de Santiago', 'Camino de Santiago')}
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <Badge icon="🥾" value={fmt(partFim)} label={`${t('partidas de Braga em 2025', 'departures from Braga in 2025')} (${t('recorde; eram', 'record; were')} ${fmt(partInicio)} ${t('em 2022', 'in 2022')})`} color={C.accent} />
        <Badge icon="🏅" value={`${K.rankingNacional}.ª`} label={`${t('posição nacional como ponto de partida', 'national position as a starting point')} (${t('líder:', 'leader:')} ${K.liderNacional})`} color={C.info} />
        <Badge icon="🧭" value={fmt(geira2025)} label={t('partidas pelo Caminho da Geira em 2025 — lidera pela 1.ª vez', 'departures via the Geira route in 2025 — leads for the first time')} color={C.positive} />
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
        <Card title={t('Meses de maior procura — Caminho da Geira (% dos peregrinos)', 'Peak months — Geira route (% of pilgrims)')}>
          <HBars data={K.cga2025.meses} color={C.purple} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>{t('Maioria entre os 46 e 65 anos; cerca de', 'Mostly between 46 and 65 years old; about')} {K.cga2025.homens}{t('% são homens.', '% are men.')}</p>
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
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>{t('*Dados de 2026 parciais (até meados de junho). O salto reflete sobretudo o registo mais sistemático deste interesse a partir de 2026, mas é coerente com a procura crescente pela rota.', '*Partial 2026 data (to mid-June). The jump reflects mostly the more systematic recording of this interest from 2026, but it is consistent with the growing demand for the route.')}</p>
      </Card>

      <Card title={t('Valor económico do peregrino', 'Economic value of the pilgrim')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Cruz label={t('impacto de cada peregrino', 'impact of each pilgrim')} value={`${String(K.economia.fatorTurista).replace('.', t(',', '.'))}×`} color={C.accent} nota={t('equivalente a turistas convencionais', 'equivalent to conventional tourists')} />
          <Cruz label={t('mais produto', 'more output')} value={`+${K.economia.maisProduto}%`} color={C.positive} nota={t('por cada euro gasto pelo peregrino', 'per euro spent by the pilgrim')} />
          <Cruz label={t('mais emprego', 'more jobs')} value={`+${K.economia.maisEmprego}%`} color={C.info} nota={t('por cada euro gasto pelo peregrino', 'per euro spent by the pilgrim')} />
        </div>
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>
          {t('Estimativas do estudo da Universidade de Santiago de Compostela (USC/IDEGA) sobre o Caminho na Galiza — não específico de Braga. Servem de enquadramento sobre o peso económico do peregrino, não como medição local.', 'Estimates from the University of Santiago de Compostela (USC/IDEGA) study on the Camino in Galicia — not specific to Braga. They serve as context on the economic weight of the pilgrim, not as a local measurement.')}
        </p>
      </Card>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
        {t('Notas de leitura: os valores correspondem a Compostelas emitidas pelo Serviço de Peregrinos da Catedral de Santiago, pelo que subestimam o total real — muitos peregrinos não solicitam o documento (as associações estimam números superiores). O Caminho da Geira e dos Arrieiros tem 239 km, parte da Sé de Braga e atravessa Amares, Terras de Bouro e Melgaço até entrar na Galiza pela Portela do Homem. No acumulado 2017–2025:', 'Reading notes: the figures correspond to Compostelas issued by the Pilgrims Office of the Cathedral of Santiago, so they underestimate the real total — many pilgrims do not request the document (associations estimate higher numbers). The Geira e dos Arrieiros route is 239 km long, starts at Braga Cathedral and crosses Amares, Terras de Bouro and Melgaço before entering Galicia via Portela do Homem. Cumulative 2017–2025:')} {fmt(K.acumulado.peregrinos)} {t('peregrinos e', 'pilgrims and')} {fmt(K.acumulado.compostelas)} {t('Compostelas, dos quais', 'Compostelas, of which')} {K.acumulado.pt}{t('% portugueses,', '% Portuguese,')} {K.acumulado.es}{t('% espanhóis e', '% Spanish and')} {K.acumulado.outros}{t('% de outras nacionalidades.', '% of other nationalities.')}
      </p>
    </div>
  );
}