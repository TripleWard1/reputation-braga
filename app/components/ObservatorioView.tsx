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

const LOGO = 'https://i.imgur.com/Vij12Qd.png';

// Formatação para documentos (pt-PT)
const dNum = (n: number) => n.toLocaleString('pt-PT');
const dDec = (v: number) => String(v).replace('.', ',');
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
    { id: 'geral', label: 'Visão Geral' },
    { id: 'procura', label: 'Procura (INE)' },
    { id: 'economia', label: 'Economia' },
    { id: 'mercados', label: 'Mercados' },
    { id: 'balcao', label: 'Atendimento Balcão' },
    { id: 'taxa', label: 'Taxa Turística' },
    { id: 'sustentabilidade', label: 'Sustentabilidade' },
    { id: 'digital', label: 'Audiência Digital' },
    { id: 'acessibilidade', label: 'Acessibilidade' },
    { id: 'meteo', label: 'Meteorologia' },
    { id: 'caminhos', label: 'Caminhos de Santiago' },
    { id: 'cruzamentos', label: 'Cruzamentos' },
  ];
  const tabLabel = TABS.find((t) => t.id === tab)?.label || '';

  const exportProcura = () => {
    const H = HEADLINE;
    const nf = (n: number) => n.toLocaleString('pt-PT');
    const dec = (v: number) => String(v).replace('.', ',');
    const pct = (v: number) => (v >= 0 ? '+' : '') + dec(v) + '%';
    const anos = ['2019', '2020', '2021', '2022', '2023', '2024'];
    const dormBars = anos.map((y) => ({ label: y, value: DORMIDAS_ANUAL[y] || 0, display: nf(DORMIDAS_ANUAL[y] || 0) }));
    dormBars.push({ label: '2025 *', value: H.dormidas2025, display: nf(H.dormidas2025) + ' (prelim.)' });

    const Ds = SUSTENTABILIDADE.destino;
    const sazVals = MESES.map((m) => DORMIDAS_BRAGA[m]?.['2024'] ?? 0);
    const sazTotal = sazVals.reduce((s, v) => s + v, 0);
    let pkI = 0, trI = 0;
    sazVals.forEach((v, i) => { if (v > sazVals[pkI]) pkI = i; if (v < sazVals[trI]) trI = i; });
    const pkShare = sazTotal ? (sazVals[pkI] / sazTotal) * 100 : 0;
    const pkRatio = sazVals[trI] ? sazVals[pkI] / sazVals[trI] : 0;

    const sections: Section[] = [
      { kind: 'prose', paras: [
        `Dados preliminares do INE/TravelBI relativos a ${H.periodo}. No acumulado, Braga registou ${nf(H.dormidas2025)} dormidas (${pct(H.dormidasVar)} face ao período homólogo) e ${nf(H.hospedes2025)} hóspedes (${pct(H.hospedesVar)}).`,
        `O crescimento das dormidas em Braga (${pct(H.dormidasVar)}) acompanha o do país (${pct(H.dormidasPTVar)}), ficando abaixo do conjunto da Região Norte (${pct(H.dormidasNorteVar)}).`,
      ] },
      { kind: 'bars', title: 'Dormidas anuais em Braga (2019–2025)', data: dormBars,
        note: 'A quebra de 2020–2021 reflete a pandemia; recuperação plena a partir de 2022. (*) 2025 com dados preliminares (jan–nov), sujeitos a revisão do INE.' },
      { kind: 'table', title: 'Braga no contexto regional e nacional', head: ['Indicador', 'Braga', 'Norte', 'Portugal'],
        rows: [
          ['Ocupação por quarto', dec(H.ocupQuarto.Braga) + '%', dec(H.ocupQuarto.Norte) + '%', dec(H.ocupQuarto.Portugal) + '%'],
          ['Ocupação por cama', dec(H.ocupCama.Braga) + '%', dec(H.ocupCama.Norte) + '%', dec(H.ocupCama.Portugal) + '%'],
          ['Estada média (noites)', dec(H.estadaMedia.Braga), dec(H.estadaMedia.Norte), dec(H.estadaMedia.Portugal)],
          ['Variação das dormidas (homóloga)', pct(H.dormidasVar), pct(H.dormidasNorteVar), pct(H.dormidasPTVar)],
        ],
        emphasizeRow: 0,
        note: 'Fonte: INE/TravelBI. Indicadores do período mais recente consolidado.' },
      { kind: 'stats', title: 'Sazonalidade da procura', items: [
        { label: 'Índice de sazonalidade (Braga)', value: dec(Ds.sazonalidade) + '%', sub: 'menor = mais equilibrado' },
        { label: 'Média nacional', value: dec(Ds.sazonalidadeNacional) + '%' },
        { label: 'Mês de pico (2024)', value: MESES[pkI], sub: dec(+pkShare.toFixed(1)) + '% do ano' },
        { label: 'Rácio pico / vale', value: dec(+pkRatio.toFixed(1)) + '×', sub: MESES[pkI] + ' vs ' + MESES[trI] },
      ] },
      { kind: 'prose', title: 'Leitura', paras: [
        `A ocupação por quarto em Braga (${dec(H.ocupQuarto.Braga)}%) supera a média da Região Norte e aproxima-se da nacional, sinal de uma procura sólida apesar da estada curta.`,
        `A estada média de ${dec(H.estadaMedia.Braga)} noites (${dec(H.estadaMedia.naoResidentes)} entre não residentes) confirma Braga como destino de curtas estadias e porta de entrada do Minho, com margem para estratégias que aumentem o número de noites.`,
        `Braga é menos sazonal do que a média nacional (${dec(Ds.sazonalidade)}% vs ${dec(Ds.sazonalidadeNacional)}%): a procura está mais distribuída ao longo do ano. O pico mantém-se no verão (${MESES[pkI]}), pelo que há margem para reforçar a época baixa.`,
        'Os valores de 2025 são preliminares: o INE consolida com um desfasamento habitual de cerca de três meses, pelo que os totais anuais poderão ser revistos em alta.',
      ] },
    ];

    openPremiumDoc({
      logo: LOGO,
      eyebrow: 'Município de Braga · Observatório',
      title: 'Procura Turística',
      subtitle: H.periodo,
      kpis: [
        { label: 'Dormidas 2025', value: nf(H.dormidas2025), sub: pct(H.dormidasVar) + ' homólogo' },
        { label: 'Hóspedes 2025', value: nf(H.hospedes2025), sub: pct(H.hospedesVar) + ' homólogo' },
        { label: 'Ocupação / quarto', value: dec(H.ocupQuarto.Braga) + '%', sub: 'Braga · Norte ' + dec(H.ocupQuarto.Norte) + '%' },
        { label: 'Estada média', value: dec(H.estadaMedia.Braga) + ' noites', sub: dec(H.estadaMedia.naoResidentes) + ' não residentes' },
      ],
      sections,
      footerR: 'Procura Turística · Fonte INE/TravelBI',
    });
  };

  const exportEconomia = () => {
    const H = HEADLINE;
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Observatório',
      title: 'Economia do Alojamento', subtitle: 'INE/TravelBI · indicadores 2024',
      kpis: [
        { label: 'RevPAR Braga', value: dEur(H.revpar2024.Braga), sub: '2024' },
        { label: 'ADR Braga', value: dEur(H.adr2024.Braga), sub: '2024' },
        { label: 'Ocupação / quarto', value: dDec(H.ocupQuarto.Braga) + '%', sub: 'Braga' },
        { label: 'Proveitos 2024', value: dDec(H.proveitos.Braga2024) + ' M€', sub: dPct(H.proveitos.varBraga) + ' face a 2023' },
      ],
      sections: [
        { kind: 'table', title: 'Desempenho hoteleiro 2024 — Braga vs Norte vs Portugal',
          head: ['Indicador', 'Braga', 'Norte', 'Portugal'],
          rows: [
            ['RevPAR (rendimento por quarto disponível)', dEur(H.revpar2024.Braga), dEur(H.revpar2024.Norte), dEur(H.revpar2024.Portugal)],
            ['ADR (rendimento por quarto ocupado)', dEur(H.adr2024.Braga), dEur(H.adr2024.Norte), dEur(H.adr2024.Portugal)],
            ['Ocupação por quarto', dDec(H.ocupQuarto.Braga) + '%', dDec(H.ocupQuarto.Norte) + '%', dDec(H.ocupQuarto.Portugal) + '%'],
            ['Ocupação por cama', dDec(H.ocupCama.Braga) + '%', dDec(H.ocupCama.Norte) + '%', dDec(H.ocupCama.Portugal) + '%'],
          ], emphasizeRow: 0,
          note: 'Fonte: INE/TravelBI, 2024.' },
        { kind: 'bars', title: 'Variação dos proveitos do alojamento (2023 → 2024)',
          data: [
            { label: 'Braga', value: H.proveitos.varBraga, display: dPct(H.proveitos.varBraga) },
            { label: 'Norte', value: H.proveitos.varNorte, display: dPct(H.proveitos.varNorte) },
            { label: 'Portugal', value: H.proveitos.varPortugal, display: dPct(H.proveitos.varPortugal) },
          ],
          note: `Proveitos de alojamento em Braga: ${dDec(H.proveitos.Braga2023)} M€ (2023) para ${dDec(H.proveitos.Braga2024)} M€ (2024).` },
        { kind: 'prose', title: 'Leitura', paras: [
          `Braga apresenta RevPAR e ADR abaixo das médias regional e nacional — preços médios mais baixos — mas uma ocupação por quarto (${dDec(H.ocupQuarto.Braga)}%) superior à da Região Norte e próxima da nacional.`,
          'A combinação de ocupação elevada com preço médio contido aponta margem para estratégias de valorização do preço médio (qualificação da oferta, eventos âncora, captação de segmentos de maior valor), sem dependência de aumentar volumes.',
        ] },
      ],
      footerR: 'Economia do Alojamento · Fonte INE/TravelBI',
    });
  };

  const exportMercados = () => {
    const b25 = BALCAO['2025']; const b26 = BALCAO['2026'];
    const top = HEADLINE.mercados2025;
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Observatório',
      title: 'Mercados Emissores', subtitle: 'INE 2025 · Atendimento de Balcão',
      kpis: [
        { label: 'Principal mercado', value: top[0], sub: 'INE · por dormidas' },
        { label: 'Nacionalidade #1 (balcão)', value: b26.nacionalidades[0][0], sub: dNum(b26.nacionalidades[0][1]) + ' em 2026' },
        { label: 'Cidade #1 (balcão)', value: b26.cidades[0][0], sub: dNum(b26.cidades[0][1]) + ' em 2026' },
        { label: 'Mercados no top', value: String(top.length), sub: 'internacionais (INE)' },
      ],
      sections: [
        { kind: 'table', title: 'Principais mercados internacionais (INE 2025, por dormidas)',
          head: ['#', 'Mercado'], rows: top.map((m, i) => [String(i + 1), m]), emphasizeRow: 0,
          note: 'Espanha lidera, seguida de Brasil, França e Reino Unido.' },
        { kind: 'bars', title: 'Nacionalidades no balcão (2026, top 10)',
          data: b26.nacionalidades.slice(0, 10).map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: 'Cidades de origem dos visitantes (balcão 2026, top 10)',
          data: b26.cidades.slice(0, 10).map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
        { kind: 'prose', title: 'Leitura', paras: [
          'O domínio ibérico é claro: Espanha encabeça tanto as dormidas (INE) como o atendimento físico no balcão, reforçada por cidades como Madrid, Vigo, A Coruña e Bilbao no topo das origens.',
          `Para referência, em 2025 o balcão registou ${dNum(b25.nacionalidades[0][1])} atendimentos a espanhóis; em 2026 (ano em curso) já vai em ${dNum(b26.nacionalidades[0][1])}.`,
        ] },
      ],
      footerR: 'Mercados Emissores · INE / Balcão',
    });
  };

  const exportBalcao = () => {
    const b = BALCAO['2026'];
    const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Posto de Turismo',
      title: 'Atendimento de Balcão', subtitle: '2026 (ano em curso, até junho)',
      kpis: [
        { label: 'Atendimentos', value: dNum(b.atendimentos) },
        { label: 'Pessoas (pax)', value: dNum(b.pax) },
        { label: 'Visitantes', value: pctVisit + '%', sub: dNum(b.visitantes) + ' turistas' },
        { label: 'Peregrinos', value: dNum(b.peregrinos), sub: 'Caminhos de Santiago' },
      ],
      sections: [
        { kind: 'bars', title: 'O que procuram (interesses, top 10)',
          data: b.interesses.slice(0, 10).map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
        { kind: 'bars', title: 'Meio de chegada',
          data: b.meioChegada.map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'table', title: 'Nacionalidades (top 10)',
          head: ['Nacionalidade', 'Atendimentos'], rows: b.nacionalidades.slice(0, 10).map((x: [string, number]) => [x[0], dNum(x[1])]) },
        { kind: 'prose', title: 'Nota', paras: [
          'Cada registo corresponde a um atendimento no Posto de Turismo. Os dados de 2026 são do ano em curso (até junho), pelo que os totais anuais serão superiores.',
        ] },
      ],
      footerR: 'Atendimento de Balcão · Posto de Turismo',
    });
  };

  const exportTaxa = () => {
    const t = TAXA_TURISTICA;
    const anos = ['2021', '2022', '2023', '2024', '2025'];
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Observatório',
      title: 'Taxa Municipal Turística', subtitle: 'Receita 2021–2026',
      kpis: [
        { label: 'Receita 2025', value: dEur(t['2025'].Total), sub: dPct(((t['2025'].Total - t['2024'].Total) / t['2024'].Total) * 100) + ' vs 2024' },
        { label: 'Receita 2024', value: dEur(t['2024'].Total) },
        { label: 'Empreendimentos', value: dNum(INFRA.empreendimentos), sub: 'hotéis e similares' },
        { label: 'Alojamento Local', value: dNum(INFRA.alojamentoLocal), sub: 'registos AL' },
      ],
      sections: [
        { kind: 'bars', title: 'Receita anual total (€)',
          data: anos.map((y) => ({ label: y, value: t[y].Total, display: dEur(t[y].Total) })),
          note: 'Crescimento sustentado desde a retoma pós-pandemia.' },
        { kind: 'prose', title: 'Enquadramento', paras: [
          'Regulamento n.º 927/2025: 1,50 € por dormida, até ao máximo de 4 noites, aplicável a hóspedes com mais de 16 anos.',
          `A receita de 2025 totalizou ${dEur(t['2025'].Total)}, mais ${dPct(((t['2025'].Total - t['2024'].Total) / t['2024'].Total) * 100)} do que em 2024. O arranque de 2026 reflete a entrada em vigor do novo valor da taxa (janeiro: ${dEur(t['2026'].Janeiro)}).`,
        ] },
      ],
      footerR: 'Taxa Municipal Turística',
    });
  };

  const exportSustentabilidade = () => {
    const S = SUSTENTABILIDADE; const P = S.percecao; const D = S.destino;
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Green Destinations',
      title: 'Sustentabilidade do Destino', subtitle: `Certificação ${D.certificacao} · perceção e indicadores`,
      kpis: [
        { label: 'Certificação', value: 'Platinum', sub: 'Green Destinations' },
        { label: 'Perceção positiva', value: dDec(P.positiva) + '%', sub: `residentes · n=${P.n}` },
        { label: 'Sazonalidade', value: dDec(D.sazonalidade) + '%', sub: `nacional ${dDec(D.sazonalidadeNacional)}%` },
        { label: 'Frota TUB verde', value: dDec(D.frotaVerde) + '%', sub: `${D.autocarrosEletricos} elétricos` },
      ],
      sections: [
        { kind: 'bars', title: 'Perceção dos residentes — sinais positivos',
          data: [
            { label: 'O turismo beneficia a economia', value: P.beneficiaEconomia, display: dDec(P.beneficiaEconomia) + '%' },
            { label: 'Valoriza a cultura local', value: P.valorizaCultura, display: dDec(P.valorizaCultura) + '%' },
            { label: 'Respeito pela cultura local', value: P.respeitaCultura, display: dDec(P.respeitaCultura) + '%' },
            { label: 'Melhora a vida dos residentes', value: P.melhoraVida, display: dDec(P.melhoraVida) + '%' },
          ], color: '#34d399' },
        { kind: 'bars', title: 'Tensões percebidas',
          data: [
            { label: 'Aumenta o custo de vida', value: P.custoVida, display: dDec(P.custoVida) + '%' },
            { label: 'Impactos ambientais', value: P.impactosAmbientais, display: dDec(P.impactosAmbientais) + '%' },
            { label: 'Causa sobrelotação', value: P.sobrelotacao, display: dDec(P.sobrelotacao) + '%' },
            { label: 'Não se sentem ouvidos', value: P.naoOuvidos, display: dDec(P.naoOuvidos) + '%' },
          ], color: '#f87171' },
        { kind: 'table', title: 'Indicadores de sustentabilidade do destino',
          head: ['Indicador', 'Valor'], rows: [
            ['Sazonalidade (concentração no verão)', dDec(D.sazonalidade) + '%'],
            ['Turistas por habitante (pico)', dDec(D.turistasPorHabitante)],
            ['Frota TUB amiga do ambiente', dDec(D.frotaVerde) + '%'],
            ['Iluminação pública em LED', dDec(D.iluminacaoLED) + '%'],
            ['Economia turística gerida por locais', '>' + dDec(D.economiaLocal) + '%'],
            ['Rede de percursos pedestres', dNum(D.redePedestre) + ' km'],
          ],
          note: `Fontes: Barómetro de Perceção dos Residentes 2026 (n=${P.n}, amostra não probabilística) e Green Destinations Tourism Impact Assessment Braga 2025.` },
        { kind: 'prose', title: 'Leitura', paras: [
          `A perceção global é muito positiva (${dDec(P.positiva)}%), com economia e cultura como dimensões mais fortes. A dimensão a reforçar é a governança e participação: apenas ${dDec(P.ouvidos)}% dos residentes sentem que são ouvidos nas decisões sobre turismo.`,
        ] },
      ],
      footerR: 'Sustentabilidade · Green Destinations',
    });
  };

  const exportDigital = () => {
    const k = DIGITAL.kpis;
    const totalCanais = DIGITAL.canais.reduce((s, x) => s + x[1], 0);
    const totalDisp = DIGITAL.dispositivos.reduce((s, x) => s + x[1], 0);
    const pctOrg = Math.round((DIGITAL.canais[0][1] / totalCanais) * 100);
    const pctMob = Math.round((DIGITAL.dispositivos[0][1] / totalDisp) * 100);
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · visitbraga.travel',
      title: 'Audiência Digital', subtitle: `Google Analytics · ${DIGITAL.periodo}`,
      kpis: [
        { label: 'Utilizadores', value: dNum(k.utilizadores) },
        { label: 'Visualizações', value: dNum(k.visualizacoes) },
        { label: 'Envolvimento', value: dDec(k.taxaEnvolvimento) + '%' },
        { label: 'Páginas / utilizador', value: dDec(k.pagsPorUtilizador) },
      ],
      sections: [
        { kind: 'bars', title: 'Canais de aquisição',
          data: DIGITAL.canais.map((x) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'bars', title: 'Top países (utilizadores)',
          data: DIGITAL.paises.slice(0, 8).map((x) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: 'Páginas mais vistas',
          data: DIGITAL.paginas.slice(0, 8).map((x) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#a78bfa' },
        { kind: 'prose', title: 'Leitura estratégica', paras: [
          `${pctOrg}% dos utilizadores chegam por pesquisa orgânica — o que reforça a prioridade da estratégia SEO/GEO para o Visit Braga.`,
          `${pctMob}% acede por telemóvel: a experiência mobile é determinante.`,
          'Os picos de tráfego coincidem com eventos sazonais (Luzes de Natal, Passagem de Ano), que dominam as páginas mais vistas. Cidades por deteção aproximada de IP; entradas sem cidade definida excluídas dos tops.',
        ] },
      ],
      footerR: 'Audiência Digital · GA4 visitbraga.travel',
    });
  };

  const exportAcessibilidade = () => {
    const A = ACESSIBILIDADE;
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Posto de Turismo',
      title: 'Acessibilidade no Atendimento', subtitle: 'Necessidades especiais registadas no balcão',
      kpis: [
        { label: 'Atendimentos registados', value: dNum(A.total) },
        { label: 'Pessoas abrangidas', value: dNum(A.pax) },
        { label: '% do total de atendimentos', value: dDec(A.pct) + '%' },
      ],
      sections: [
        { kind: 'prose', title: 'Amostra reduzida — leitura cautelosa', paras: [
          `O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado (${A.total} em ${dNum(A.totalAtendimentos)} atendimentos). Os números abaixo são um ponto de partida e não refletem a procura real.`,
          'O valor deste indicador cresce com o registo sistemático no balcão — vale a pena reforçar essa prática junto da equipa de atendimento.',
        ] },
        { kind: 'bars', title: 'Por tipo de necessidade',
          data: A.tipos.map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: 'Por mês (2026)',
          data: A.porMes.map((x: [string, number]) => ({ label: x[0], value: x[1], display: dNum(x[1]) })), color: '#c9a84c' },
      ],
      footerR: 'Acessibilidade no Atendimento',
    });
  };

  const exportCaminhos = () => {
    const K = CAMINHOS;
    openPremiumDoc({
      logo: LOGO, eyebrow: 'Município de Braga · Observatório',
      title: 'Caminhos de Santiago', subtitle: 'Partidas de Braga · Serviço de Peregrinos da Catedral de Santiago',
      kpis: [
        { label: 'Partidas de Braga 2025', value: dNum(K.partidasBraga[K.partidasBraga.length - 1][1]), sub: 'recorde' },
        { label: 'Posição nacional', value: K.rankingNacional + '.ª', sub: `líder: ${K.liderNacional}` },
        { label: 'Caminho da Geira 2025', value: dNum(K.porCaminho2025[0][1]), sub: 'lidera pela 1.ª vez' },
        { label: 'Acumulado da Geira', value: dNum(K.acumulado.peregrinos), sub: 'desde 2017' },
      ],
      sections: [
        { kind: 'table', title: 'Partidas de Braga por caminho (2023–2025)',
          head: ['Ano', 'Geira e Arrieiros', 'Central Português'],
          rows: K.evolucao.map((e) => [e.ano, dNum(e.Geira), dNum(e.Central)]), emphasizeRow: 2,
          note: 'Em 2025 o Caminho da Geira ultrapassou pela primeira vez o Central nas partidas de Braga.' },
        { kind: 'bars', title: 'Repartição por caminho (2025)',
          data: K.porCaminho2025.map((x) => ({ label: x[0], value: x[1], display: dNum(x[1]) })) },
        { kind: 'bars', title: 'Origem dos peregrinos do Caminho da Geira (2025)',
          data: K.cga2025.nacionalidades.map((x) => ({ label: x[0], value: x[1], display: dDec(x[1]) + '%' })), color: '#60a5fa' },
        { kind: 'prose', title: 'Leitura', paras: [
          `Braga registou ${dNum(K.partidasBraga[K.partidasBraga.length - 1][1])} partidas em 2025 (o valor mais elevado de que há registo) e subiu à ${K.rankingNacional}.ª posição nacional como ponto de partida. ${dDec(K.cga2025.inicioBraga)}% dos peregrinos do Caminho da Geira iniciam na Sé de Braga.`,
          'Os valores correspondem a Compostelas emitidas, pelo que subestimam o total real (muitos peregrinos não solicitam o documento). As associações estimam números superiores.',
        ] },
      ],
      footerR: 'Caminhos de Santiago · Serviço de Peregrinos',
    });
  };

  const exportarPDF = () => {
    const node = document.getElementById('obs-print-area');
    if (!node) return;
    const win = window.open('', '_blank', 'width=1180,height=860');
    if (!win) { alert('Permita pop-ups para exportar o PDF.'); return; }
    const hoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const html =
      '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">' +
      '<title>Observatório de Turismo de Braga — ' + tabLabel + '</title>' +
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
      '<div class="meta"><h1>Observatório de Turismo de Braga</h1><div class="sub">' + tabLabel + ' · ' + hoje + '</div></div></div>' +
      '<div class="content">' + node.innerHTML + '</div>' +
      '<footer><span>Município de Braga · Divisão de Atividades Económicas e Turismo</span>' +
      '<span>Fontes: INE/TravelBI · Taxa Municipal Turística · Atendimento de Balcão</span></footer>' +
      '<script>setTimeout(function(){window.focus();window.print();},700);</script>' +
      '</body></html>';
    win.document.open(); win.document.write(html); win.document.close();
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: C.text }}>Observatório de Turismo de Braga</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Análise integrada de dados reais — INE/TravelBI · Atendimento de Balcão · Taxa Municipal Turística</p>
        </div>
        <button onClick={() => {
          const map: Record<string, () => void> = {
            procura: exportProcura, economia: exportEconomia, mercados: exportMercados,
            balcao: exportBalcao, taxa: exportTaxa, sustentabilidade: exportSustentabilidade,
            digital: exportDigital, acessibilidade: exportAcessibilidade, caminhos: exportCaminhos,
          };
          (map[tab] || exportarPDF)();
        }} style={{
          padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accentBg,
          color: C.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        }}>⬇ Exportar PDF</button>
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
function Chips({ options, sel, toggle, single }: { options: string[]; sel: string[]; toggle: (o: string) => void; single?: boolean }) {
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
          }}>{o}</button>
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
  const f = a < 0.2 ? 'muito fraca' : a < 0.4 ? 'fraca' : a < 0.6 ? 'moderada' : 'forte';
  return `${r >= 0 ? '+' : ''}${r.toFixed(2)} (${f})`;
};

function HBars({ data, color }: { data: [string, number][]; color?: string }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map(([k, v], i) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: C.text }}>{k}</span>
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
            <span style={{ width: 64, fontSize: 11, color: C.textMuted }}>{k}</span>
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
        <KPI label="Dormidas 2025" value={fmt(HEADLINE.dormidas2025)} sub={`+${HEADLINE.dormidasVar}% homólogo`} color={HEADLINE.dormidasVar >= 0 ? C.positive : C.negative} />
        <KPI label="Hóspedes 2025" value={fmt(HEADLINE.hospedes2025)} sub={`+${HEADLINE.hospedesVar}% homólogo`} color={C.accentLight} />
        <KPI label="Taxa Turística 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="receita municipal" color={C.accent} />
        <KPI label="Atendimentos Balcão 2025" value={fmt(BALCAO['2025'].atendimentos)} sub={`${fmt(BALCAO['2025'].pax)} pax`} color={C.info} />
        <KPI label="Estada Média" value={`${HEADLINE.estadaMedia.Braga}`} sub="noites (INE 2024)" color={C.purple} />
        <KPI label="Ocupação-quarto" value={`${HEADLINE.ocupQuarto.Braga}%`} sub="líquida (INE 2024)" color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Dormidas anuais em Braga (INE/TravelBI)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dormDataAnual} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), 'Dormidas']} />
              <Bar dataKey="dormidas" radius={[4, 4, 0, 0]}>
                {dormDataAnual.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Receita da Taxa Municipal Turística (€/ano)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taxaAnual} margin={{ top: 6, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), 'Receita']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {taxaAnual.map((d) => <Cell key={d.ano} fill={d.ano === '2026' ? C.textDim : C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>2026 parcial (jan–mar). O salto reflete a entrada em vigor da taxa de 1,50 €/dormida.</p>
        </Card>
      </div>

      <Card title="◈ Cruzamento Reputação Online × Procura Real">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Cruz label="Reputação média (plataforma)" value={rep != null ? `${rep.toFixed(1)}/10` : '—'} color={C.accent} nota={`${repL ?? 0} locais · ${fmt(repR ?? 0)} reviews`} />
          <Cruz label="Dormidas 2025 (INE)" value={fmt(HEADLINE.dormidas2025)} color={C.info} nota={`+${HEADLINE.dormidasVar}% homólogo`} />
          <Cruz label="Atendimentos balcão 2025" value={fmt(BALCAO['2025'].atendimentos)} color={C.positive} nota={`${fmt(BALCAO['2025'].pax)} visitantes`} />
          <Cruz label="Receita taxa 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} color={C.purple} nota="dado próprio do Município" />
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '14px 0 0', lineHeight: 1.6 }}>
          Três fontes independentes a triangular a mesma realidade: o que as pessoas <strong>dizem</strong> (reputação), onde <strong>dormem</strong> (INE + taxa) e o que <strong>procuram</strong> ao balcão. Quando a reputação de um POI âncora cai, costuma anteceder quebras na procura — e a receita da taxa permite quantificar o retorno de cada intervenção.
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
  const [anos, setAnos] = useState<string[]>(['2023', '2024', '2025']);
  const src = metric === 'dormidas' ? DORMIDAS_BRAGA : HOSPEDES_BRAGA;
  const data = MESES.map((m, i) => {
    const row: any = { mes: MESES_CURTO[i] };
    anos.forEach((y) => { row[y] = src[m]?.[y] ?? null; });
    return row;
  });
  const todosAnos = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const toggleAno = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const anual = metric === 'dormidas' ? DORMIDAS_ANUAL : HOSPEDES_ANUAL;
  const anualData = Object.entries(anual).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, v: v as number }));

  return (
    <>
      <Card title={`${metric === 'dormidas' ? 'Dormidas' : 'Hóspedes'} mensais em Braga — comparação plurianual`}
        right={<div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chips options={['dormidas', 'hospedes']} sel={[metric]} toggle={(o) => setMetric(o as any)} single />
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
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>Fonte: INE / TravelBI. Dados de 2025 disponíveis até onde o INE consolidou (lag habitual de ~3 meses).</p>
      </Card>

      <Card title={`Total anual de ${metric === 'dormidas' ? 'dormidas' : 'hóspedes'} (anos completos)`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={anualData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), metric === 'dormidas' ? 'Dormidas' : 'Hóspedes']} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>{anualData.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>Nota: a quebra de 2020–2021 reflete a pandemia. Recuperação plena a partir de 2022.</p>
      </Card>

      {(() => {
        const sazAno = '2024';
        const sazVals = MESES.map((m) => DORMIDAS_BRAGA[m]?.[sazAno] ?? 0);
        const sazTotal = sazVals.reduce((s, v) => s + v, 0);
        let peakI = 0, troughI = 0;
        sazVals.forEach((v, i) => { if (v > sazVals[peakI]) peakI = i; if (v < sazVals[troughI]) troughI = i; });
        const peakShare = sazTotal ? (sazVals[peakI] / sazTotal) * 100 : 0;
        const ratio = sazVals[troughI] ? sazVals[peakI] / sazVals[troughI] : 0;
        const Ds = SUSTENTABILIDADE.destino;
        const fdec = (v: number) => String(v).replace('.', ',');
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
          <Card title="Sazonalidade da procura">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22, alignItems: 'center' }}>
              <div>
                {bar('Braga', Ds.sazonalidade, C.positive)}
                {bar('Média nacional', Ds.sazonalidadeNacional, C.textMuted)}
                <p style={{ fontSize: 11, color: C.textDim, margin: '4px 0 0' }}>Índice de sazonalidade: quanto menor, mais equilibrada é a procura ao longo do ano.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{MESES_CURTO[peakI]}</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6 }}>mês de pico · {fdec(+peakShare.toFixed(1))}% do ano</div>
                </div>
                <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.info, lineHeight: 1 }}>{fdec(+ratio.toFixed(1))}×</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 6 }}>rácio pico/vale ({MESES_CURTO[peakI]} vs {MESES_CURTO[troughI]})</div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, margin: '16px 0 0' }}>
              Braga é menos sazonal do que a média nacional ({fdec(Ds.sazonalidade)}% vs {fdec(Ds.sazonalidadeNacional)}%), sinal de uma procura mais distribuída ao longo do ano. Ainda assim, agosto concentra o pico e o inverno regista os vales, pelo que há margem para reforçar a procura na época baixa (eventos, turismo cultural, Caminhos de Santiago). Fonte do índice: Green Destinations · curva mensal: INE/TravelBI ({sazAno}).
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
    const row: any = { mes: MESES_CURTO[i] };
    ['2022', '2023', '2024'].forEach((y) => { row[y] = REVPAR_MENSAL[m]?.[y] ?? null; });
    return row;
  });
  const adrData = Object.entries(ADR_ANUAL).map(([y, v]) => ({ ano: y, adr: v }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
        <CompareBars title="RevPAR 2024 — rendimento por quarto disponível (€)" vals={HEADLINE.revpar2024} unit="€" />
        <CompareBars title="ADR 2024 — rendimento por quarto ocupado (€)" vals={HEADLINE.adr2024} unit="€" />
        <CompareBars title="Taxa líquida de ocupação-quarto 2024 (%)" vals={HEADLINE.ocupQuarto} unit="%" />
        <CompareBars title="Taxa líquida de ocupação-cama 2024 (%)" vals={HEADLINE.ocupCama} unit="%" />
      </div>

      <Card title="RevPAR mensal em Braga (€) — 2022 a 2024">
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
        <Card title="ADR anual em Braga (€) — 2018 a 2024">
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
        <Card title="Proveitos do alojamento (variação 2023→2024)">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.accent }}>{fmtE(HEADLINE.proveitos.Braga2024 * 1e6)}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Braga 2024 · de {HEADLINE.proveitos.Braga2023} M€ em 2023</div>
          </div>
          <CompareBars title="Variação dos proveitos 2023–2024 (%)" vals={{ Braga: HEADLINE.proveitos.varBraga, Norte: HEADLINE.proveitos.varNorte, Portugal: HEADLINE.proveitos.varPortugal }} unit="%" />
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
        <Card title={`Nacionalidades no balcão — ${ano}`}>
          <HBars data={b.nacionalidades.slice(0, 12)} />
        </Card>
        <Card title={`Cidades de origem dos visitantes — ${ano}`}>
          <HBars data={b.cidades.slice(0, 12)} color={C.info} />
        </Card>
      </div>
      <Card title="Principais mercados emissores internacionais (INE 2025, por dormidas)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HEADLINE.mercados2025.map((m, i) => (
            <span key={m} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i < 4 ? C.accentBg : C.bg, color: i < 4 ? C.accentLight : C.textMuted, border: `1px solid ${C.border}` }}>
              {i + 1}. {m}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: '12px 0 0', lineHeight: 1.5 }}>
          Espanha é o principal mercado internacional, seguida de Brasil, França e Reino Unido. O balcão confirma o domínio ibérico (Espanha + cidades como Madrid, Vigo, A Coruña, Bilbao no topo).
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
    return { mes: MESES_CURTO[i], atendimentos: v ? v[0] : null, pax: v ? v[1] : null };
  });
  const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          Dados do Posto de Turismo — cada registo é um atendimento ao balcão. {ano === '2026' ? 'Ano em curso (até junho).' : 'Ano completo.'}
        </p>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label="Atendimentos" value={fmt(b.atendimentos)} color={C.accent} />
        <KPI label="Pessoas (pax)" value={fmt(b.pax)} color={C.accentLight} />
        <KPI label="Visitantes" value={`${pctVisit}%`} sub={`${fmt(b.visitantes)} de turistas`} color={C.info} />
        <KPI label="Peregrinos" value={fmt(b.peregrinos)} sub="Caminhos de Santiago" color={C.purple} />
        <KPI label="Grupos" value={fmt(b.grupos)} color={C.cyan} />
        <KPI label="Com crianças" value={fmt(b.criancas)} color={C.pink} />
      </div>

      <Card title={`Atendimentos e pessoas por mês — ${ano}`}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={mensal} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="atendimentos" name="Atendimentos" fill={C.accent} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="pax" name="Pessoas (pax)" stroke={C.info} strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`O que procuram (interesses) — ${ano}`}><HBars data={b.interesses.slice(0, 10)} color={C.accent} /></Card>
        <Card title={`Nacionalidades — ${ano}`}><HBars data={b.nacionalidades.slice(0, 10)} color={C.info} /></Card>
        {b.meioChegada.length > 0 && <Card title={`Meio de chegada — ${ano}`}><HBars data={b.meioChegada} color={C.positive} /></Card>}
        {b.alojamento.length > 0 && <Card title={`Tipo de alojamento — ${ano}`}><HBars data={b.alojamento} color={C.purple} /></Card>}
      </div>

      {ano === '2025' && (
        <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}30`, borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          Nota: em 2025 o registo de “meio de chegada” e parte dos interesses ainda não era sistemático, daí os totais mais baixos nessas dimensões. A partir de 2026 a recolha é muito mais completa.
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
  const rows = data.map(([name, value], i) => ({ name, value, fill: SUS_PAL[i % SUS_PAL.length] }));
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
          <div style={{ fontSize: 17, fontWeight: 700, color: C.positive }}>Green Destinations — Certificação {D.certificacao}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>Monitorização da sustentabilidade turística, qualidade de vida e governação do destino · em progresso para a certificação Full</div>
        </div>
      </div>

      {/* A) Perceção dos residentes */}
      <SectionTitle sub={`Barómetro de Perceção dos Residentes · ${P.n} respostas · ${P.periodo}`}>Perceção dos Residentes sobre o Turismo</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <Badge icon="👍" value={`${P.positiva}%`} label="perceção global positiva" color={C.positive} />
        <Badge icon="💶" value={`${P.beneficiaEconomia}%`} label="o turismo beneficia a economia" color={C.accent} />
        <Badge icon="🎭" value={`${P.valorizaCultura}%`} label="valoriza a cultura local" color={C.purple} />
        <Badge icon="🏠" value={`${P.melhoraVida}%`} label="melhora a vida dos residentes" color={C.info} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title="Sinais positivos vs tensões percebidas">
          <HBars data={[['Beneficia a economia', P.beneficiaEconomia], ['Valoriza a cultura', P.valorizaCultura], ['Respeito pela cultura local', P.respeitaCultura], ['Melhora a vida dos residentes', P.melhoraVida]]} color={C.positive} />
          <div style={{ height: 1, background: C.border, margin: '14px 0' }} />
          <HBars data={[['Aumenta o custo de vida', P.custoVida], ['Impactos ambientais', P.impactosAmbientais], ['Causa sobrelotação', P.sobrelotacao], ['Não se sentem ouvidos', P.naoOuvidos]]} color={C.negative} />
        </Card>
        <Card title="Índice Global de Perceção do Turismo (IGPT)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {P.igpt.map((d) => (
              <div key={d.dim} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.text }}>{d.dim}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: nivelCor(d.nivel), background: `${nivelCor(d.nivel)}1a`, padding: '3px 10px', borderRadius: 7, whiteSpace: 'nowrap' }}>{d.resultado}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: C.textDim, margin: '12px 0 0' }}>Governança e participação é a dimensão a reforçar: só {P.ouvidos}% sentem que são ouvidos nas decisões sobre turismo.</p>
        </Card>
      </div>

      {/* B) Pegada do visitante — App Eco */}
      <SectionTitle sub={`App Eco · Posto de Turismo · piloto com ${A.submissoes} submissões`}>Pegada Ambiental do Visitante</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <Badge icon="🌍" value={`${A.pegadaMedia}`} label="kg CO₂e por visitante (pegada média)" color={C.accent} />
        <Badge icon="♻️" value={`${A.taxaReciclagem}%`} label="dos visitantes reciclam" color={C.positive} />
        <Badge icon="📝" value={`${A.submissoes}`} label="submissões no piloto" color={C.info} hint="amostra reduzida — projeto em arranque" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title="Meio de chegada do visitante (App Eco)"><MiniPie data={A.transporte} /></Card>
        <Card title="Alojamento escolhido (App Eco)"><MiniPie data={A.alojamento} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 4 }}>
        <Card title="Nível de resíduos"><HBars data={A.residuos} color={C.positive} /></Card>
        <Card title="Regime alimentar"><HBars data={A.dieta} color={C.accent} /></Card>
        <Card title="Uso de climatização"><HBars data={A.climatizacao} color={C.info} /></Card>
      </div>

      {/* C) Indicadores do destino — Green Destinations TIA */}
      <SectionTitle sub="Green Destinations — Tourism Impact Assessment Braga 2025">Indicadores de Sustentabilidade do Destino</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="📅" value={`${D.sazonalidade}%`} label={`sazonalidade (nacional ${D.sazonalidadeNacional}%)`} color={C.positive} hint="abaixo da média nacional = mais equilibrado" />
        <Badge icon="👥" value={`${D.turistasPorHabitante}`} label="turistas por habitante (pico)" color={C.info} />
        <Badge icon="🚌" value={`${D.frotaVerde}%`} label="frota TUB amiga do ambiente" color={C.positive} hint={`${D.autocarrosEletricos} autocarros elétricos`} />
        <Badge icon="💡" value={`${D.iluminacaoLED}%`} label="iluminação pública em LED" color={C.accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Badge icon="🍃" value={`+${D.biorresiduosVar}%`} label="biorresíduos recolhidos (2021→2023)" color={C.positive} />
        <Badge icon="🤝" value={`>${D.economiaLocal}%`} label="economia turística gerida por locais" color={C.purple} />
        <Badge icon="🌱" value={`${D.pegadaConcelho.toLocaleString('pt-PT')}`} label="kg CO₂e/pessoa/ano (concelho)" color={C.cyan} hint="DECO · 1.230 testes" />
        <Badge icon="🚶" value={`${D.redePedestre} km`} label="rede de percursos pedestres" color={C.accent} hint={`+ ${D.redeCiclavel} km de ciclovias`} />
      </div>
      <p style={{ fontSize: 11, color: C.textDim, margin: '14px 0 0', lineHeight: 1.6 }}>
        Fontes: Barómetro de Perceção dos Residentes 2026 (n={P.n}, amostra não probabilística), App Eco do Posto de Turismo (piloto, {A.submissoes} submissões) e Green Destinations Tourism Impact Assessment Braga 2025. Os dados da App Eco refletem uma amostra ainda reduzida e devem ser lidos como tendência inicial.
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
        <KPI label="Receita 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="+23% vs 2024" color={C.positive} />
        <KPI label="Receita 2024" value={fmtE(TAXA_TURISTICA['2024'].Total)} color={C.accent} />
        <KPI label="Empreendimentos" value={fmt(INFRA.empreendimentos)} sub="hotéis e similares" color={C.info} />
        <KPI label="Alojamento Local" value={fmt(INFRA.alojamentoLocal)} sub="registos AL" color={C.purple} />
      </div>

      <Card title="Receita mensal da Taxa Municipal Turística (€)"
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
          Reg. n.º 927/2025 · 1,50 €/dormida · até 4 noites · hóspedes &gt; 16 anos. O salto de 2026 (jan: {fmtE(TAXA_TURISTICA['2026'].Janeiro)}) reflete a entrada em vigor do novo valor da taxa.
        </p>
      </Card>

      <Card title="Receita anual total (€)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={totais} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), 'Receita']} />
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
      <SectionTitle sub={`Google Analytics · ${DIGITAL.periodo}`}>Audiência Digital — visitbraga.travel</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label="Utilizadores" value={fmt(k.utilizadores)} color={C.accent} />
        <KPI label="Novos utilizadores" value={fmt(k.novos)} color={C.info} />
        <KPI label="Visualizações" value={fmt(k.visualizacoes)} color={C.positive} />
        <KPI label="Taxa de envolvimento" value={`${k.taxaEnvolvimento.toLocaleString('pt-PT')}%`} color={C.purple} />
        <KPI label="Tempo médio" value={`${k.tempoMedioSeg}s`} sub="por utilizador" color={C.cyan} />
        <KPI label="Páginas / utilizador" value={k.pagsPorUtilizador.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} color={C.orange} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title="Canais de aquisição"><MiniPie data={DIGITAL.canais} /></Card>
        <Card title="Dispositivo"><MiniPie data={DIGITAL.dispositivos} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title="Top países"><HBars data={DIGITAL.paises} color={C.info} /></Card>
        <Card title="Top idiomas"><HBars data={DIGITAL.idiomas} color={C.positive} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title="Top cidades"><HBars data={DIGITAL.cidades} color={C.accent} /></Card>
        <Card title="Páginas mais vistas"><HBars data={DIGITAL.paginas} color={C.purple} /></Card>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Leitura estratégica</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: C.text, fontSize: 13, lineHeight: 1.7 }}>
          <li><strong>63%</strong> dos utilizadores chegam por <strong>pesquisa orgânica</strong> — reforça a prioridade da estratégia SEO/GEO para o Visit Braga.</li>
          <li><strong>74%</strong> acede por <strong>telemóvel</strong> — a experiência mobile é determinante.</li>
          <li>Mercados internacionais com mais tráfego: <strong>França, Espanha, China, EUA e Brasil</strong> — alinhado com os mercados emissores físicos do balcão.</li>
          <li>Os picos de tráfego coincidem com <strong>eventos sazonais</strong> (Luzes de Natal, Passagem de Ano), que dominam as páginas mais vistas.</li>
        </ul>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        Fonte: Google Analytics 4 (propriedade visitbraga.travel), período {DIGITAL.periodo}. As cidades resultam de deteção aproximada por IP; entradas sem cidade definida foram excluídas dos tops.
      </p>
    </div>
  );
}

// ─── Acessibilidade no Atendimento (balcão) ───
function Acessibilidade() {
  const A = ACESSIBILIDADE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub="Necessidades especiais registadas no balcão de turismo">Acessibilidade no Atendimento</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label="Atendimentos registados" value={fmt(A.total)} color={C.accent} />
        <KPI label="Pessoas abrangidas" value={fmt(A.pax)} color={C.info} />
        <KPI label="% do total de atendimentos" value={`${A.pct.toLocaleString('pt-PT')}%`} color={C.purple} />
      </div>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>⚠ Amostra reduzida — leitura cautelosa</div>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
          O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado ({A.total} em {fmt(A.totalAtendimentos)} atendimentos). Os números abaixo são um ponto de partida e não refletem a procura real. O valor deste módulo cresce com o registo sistemático no balcão — vale a pena reforçar essa prática junto da equipa de atendimento.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title="Por tipo de necessidade"><HBars data={A.tipos} color={C.info} /></Card>
        <Card title="Por mês (2026)"><HBars data={A.porMes} color={C.accent} /></Card>
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
    return <div style={{ padding: '50px 0', textAlign: 'center', color: C.textDim, fontSize: 14 }}>A obter dados meteorológicos (open-meteo)…</div>;
  }
  if (status === 'error' || !wx) {
    return (
      <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}40`, borderRadius: 10, padding: '16px 18px', color: C.negative, fontSize: 13 }}>
        Não foi possível obter os dados meteorológicos. Detalhe: {err}. A API open-meteo é gratuita e sem chave — confirma a ligação e tenta novamente.
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
      <SectionTitle sub={`Atendimentos do balcão × meteorologia · ${BALCAO_DIARIO.length} dias`}>Meteorologia e Afluência</SectionTitle>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>Leitura exploratória</div>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
          A afluência ao balcão depende sobretudo da época do ano, do dia da semana e de eventos — não só do tempo. Além disso, 2026 tem um nível de registo muito superior a 2025. Por isso a análise é feita <strong>separadamente por ano</strong> e deve ser lida como exploratória, não como prova de causa-efeito.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {perYear.map((y) => {
          const mx = Math.max(y.dryAvg, y.rainyAvg, 1);
          return (
            <Card key={y.ano} title={`${y.ano} · ${y.n} dias com dados`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>☀ Dias secos ({y.dryN})</span>
                    <span style={{ color: C.textMuted }}>{y.dryAvg.toFixed(1)} atend./dia</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div style={{ width: `${(y.dryAvg / mx) * 100}%`, height: '100%', background: C.accent }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>🌧 Dias de chuva ({y.rainyN})</span>
                    <span style={{ color: C.textMuted }}>{y.rainyAvg.toFixed(1)} atend./dia</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div style={{ width: `${(y.rainyAvg / mx) * 100}%`, height: '100%', background: C.info }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>
                  <span>Correlação c/ temperatura: <strong style={{ color: C.text }}>{corrLabel(y.corrTemp)}</strong></span>
                </div>
                <div style={{ fontSize: 11.5, color: C.textMuted }}>
                  Correlação c/ precipitação: <strong style={{ color: C.text }}>{corrLabel(y.corrPrec)}</strong>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card title="Evolução semanal — atendimento médio vs temperatura máxima média">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={weekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="sem" stroke={C.textDim} tick={{ fontSize: 9, fill: C.textMuted }} interval={9} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}°`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(v: any, name: any) => [name === 'temp' ? `${v}°C` : v, name === 'temp' ? 'Temp. máx. média' : 'Atend./dia (média)']} />
            <Bar yAxisId="l" dataKey="atend" fill={C.accent} radius={[3, 3, 0, 0]} opacity={0.85} />
            <Line yAxisId="r" dataKey="temp" stroke={C.orange} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        Fonte meteorológica: open-meteo.com (arquivo histórico, gratuito, sem chave), coordenadas {BALCAO_LAT}, {BALCAO_LON}. Dia de chuva = precipitação ≥ 1 mm. Atendimento = registos do balcão por dia.
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
      <SectionTitle sub="Os mesmos mercados vistos por três fontes independentes">Cruzamentos de Dados</SectionTitle>

      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.textMuted, flexWrap: 'wrap' }}>
        <span><span style={dot(C.accent)} />Balcão — presença física</span>
        <span><span style={dot(C.info)} />Digital — interesse online</span>
        <span style={{ color: C.textDim }}>#n = posição no ranking INE (dormidas)</span>
      </div>

      <Card title="Mercados emissores · presença física vs interesse digital (quota %, excluindo Portugal)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {rows.map((r) => (
            <div key={r.m} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 52px', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: C.text }}>{r.m}</span>
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
        <Card title="Mais interesse online que presença física">
          {digitalOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {digitalOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{r.m}</span>
                  <span style={{ color: C.info, fontWeight: 600 }}>+{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>Sem divergências relevantes.</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>Mercados com curiosidade online ainda por converter em visita — ou tráfego de pesquisa/bots a validar.</div>
        </Card>
        <Card title="Mais presença física que pegada online">
          {fisicoOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fisicoOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{r.m}</span>
                  <span style={{ color: C.accent, fontWeight: 600 }}>{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>Sem divergências relevantes.</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>Chegam sem passar tanto pelo site — há margem para os captar em canais digitais.</div>
        </Card>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        As três fontes medem coisas diferentes: INE = dormidas reais; balcão = apenas quem entra no posto de turismo (fatia pequena e auto-selecionada, dados de 2026); digital = audiência do site (inclui investigação e possível tráfego automatizado, p. ex. valores elevados da China). Portugal foi excluído por ser mercado doméstico. Lê isto como indício para investigar, não como prova.
      </p>
    </div>
  );
}

function Caminhos() {
  const K = CAMINHOS;
  const somaNac = K.cga2025.nacionalidades.reduce((s, [, v]) => s + v, 0);
  const nacPie: [string, number][] = [
    ...K.cga2025.nacionalidades,
    ['Outros (23 países)', +(100 - somaNac).toFixed(1)],
  ];
  const partInicio = K.partidasBraga[0][1];
  const partFim = K.partidasBraga[K.partidasBraga.length - 1][1];
  const geira2025 = K.porCaminho2025[0][1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub="Compostelas emitidas a quem iniciou a peregrinação na Sé de Braga. Fonte: Serviço de Peregrinos da Catedral de Santiago de Compostela.">
        Caminhos de Santiago
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <Badge icon="🥾" value={fmt(partFim)} label={`partidas de Braga em 2025 (recorde; eram ${fmt(partInicio)} em 2022)`} color={C.accent} />
        <Badge icon="🏅" value={`${K.rankingNacional}.ª`} label={`posição nacional como ponto de partida (líder: ${K.liderNacional})`} color={C.info} />
        <Badge icon="🧭" value={fmt(geira2025)} label="partidas pelo Caminho da Geira em 2025 — lidera pela 1.ª vez" color={C.positive} />
        <Badge icon="📜" value={fmt(K.acumulado.peregrinos)} label="peregrinos no Caminho da Geira desde 2017" color={C.purple} />
      </div>

      <Card title="Partidas de Braga por caminho (2023–2025)">
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={K.evolucao} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="ano" tick={{ fill: C.textMuted, fontSize: 12 }} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 12 }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Geira" name="Geira e Arrieiros" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Central" name="Central Português" stroke={C.info} strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, marginTop: 8 }}>
          Em 2025, o Caminho da Geira e dos Arrieiros (567) ultrapassou pela primeira vez o Caminho Central Português (550) nas partidas de Braga. A Geira subiu de 403 (2023) para 567 (2025), enquanto o Central recuou de 674 para 550 no mesmo período.
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Repartição por caminho (2025)">
          <HBars data={K.porCaminho2025} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>Partidas de Braga, por itinerário (nº de Compostelas).</p>
        </Card>
        <Card title="Origem dos peregrinos do Caminho da Geira (2025)">
          <MiniPie data={nacPie} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Como percorrem o Caminho da Geira (2025)">
          <MiniPie data={K.cga2025.modo} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{K.cga2025.inicioBraga}% inicia o percurso na própria Sé de Braga.</p>
        </Card>
        <Card title="Meses de maior procura — Caminho da Geira (% dos peregrinos)">
          <HBars data={K.cga2025.meses} color={C.purple} />
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>Maioria entre os 46 e 65 anos; cerca de {K.cga2025.homens}% são homens.</p>
        </Card>
      </div>

      <Card title="Sinal no balcão Visit Braga">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Peregrinos atendidos no posto</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: C.textDim }}>{K.balcao.peregrinos2025} em 2025</span>
              <span style={{ color: C.textDim }}>→</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.positive }}>{K.balcao.peregrinos2026}</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>em 2026*</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Interesse «Caminhos de Santiago» registado</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 14, color: C.textDim }}>{K.balcao.interesse2025} em 2025</span>
              <span style={{ color: C.textDim }}>→</span>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>{K.balcao.interesse2026}</span>
              <span style={{ fontSize: 13, color: C.textMuted }}>em 2026*</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>*Dados de 2026 parciais (até meados de junho). O salto reflete sobretudo o registo mais sistemático deste interesse a partir de 2026, mas é coerente com a procura crescente pela rota.</p>
      </Card>

      <Card title="Valor económico do peregrino">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
          <Cruz label="impacto de cada peregrino" value={`${String(K.economia.fatorTurista).replace('.', ',')}×`} color={C.accent} nota="equivalente a turistas convencionais" />
          <Cruz label="mais produto" value={`+${K.economia.maisProduto}%`} color={C.positive} nota="por cada euro gasto pelo peregrino" />
          <Cruz label="mais emprego" value={`+${K.economia.maisEmprego}%`} color={C.info} nota="por cada euro gasto pelo peregrino" />
        </div>
        <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, lineHeight: 1.6 }}>
          Estimativas do estudo da Universidade de Santiago de Compostela (USC/IDEGA) sobre o Caminho na Galiza — não específico de Braga. Servem de enquadramento sobre o peso económico do peregrino, não como medição local.
        </p>
      </Card>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
        Notas de leitura: os valores correspondem a Compostelas emitidas pelo Serviço de Peregrinos da Catedral de Santiago, pelo que subestimam o total real — muitos peregrinos não solicitam o documento (as associações estimam números superiores). O Caminho da Geira e dos Arrieiros tem 239 km, parte da Sé de Braga e atravessa Amares, Terras de Bouro e Melgaço até entrar na Galiza pela Portela do Homem. No acumulado 2017–2025: {fmt(K.acumulado.peregrinos)} peregrinos e {fmt(K.acumulado.compostelas)} Compostelas, dos quais {K.acumulado.pt}% portugueses, {K.acumulado.es}% espanhóis e {K.acumulado.outros}% de outras nacionalidades.
      </p>
    </div>
  );
}