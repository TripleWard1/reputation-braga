import { getLang } from '@/app/lib/i18n';
import { abrirJanelaDocumento } from '@/app/lib/abrir-documento';
import { MESES, DORMIDAS_BRAGA, DORMIDAS_NORTE, DORMIDAS_PORTUGAL, DORMIDAS_ANUAL, HOSPEDES_ANUAL, ESTADA_MEDIA, ADR_ANUAL, CAPACIDADE_CAMAS, SEMESTRE_2026, TAXA_TURISTICA, SUSTENTABILIDADE, BALCAO, RESIDENTES } from '@/app/lib/observatorio-dados';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { INSTO_DADOS } from '@/app/lib/insto-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { SIBS_PAISES, SIBS_PERIODO } from '@/app/lib/sibs-dados';
import { CONTACTOS } from '@/app/lib/contactos';

// Relatório Anual de Monitorização INSTO: documento institucional completo, gerado com os dados da plataforma.
// Português ou inglês (língua habitual nos relatórios à ONU Turismo); em espanhol sai em português.
type Texto = [string, string];
const EN = () => getLang() === 'en';
const R = (x: Texto) => (EN() ? x[1] : x[0]);
const LOC = () => (EN() ? 'en-GB' : 'pt-PT');
const n0 = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? Math.round(v).toLocaleString(LOC()) : '—');
const n1 = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString(LOC(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
const n2 = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString(LOC(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
const pc = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? `${v >= 0 ? '+' : ''}${n1(v)}%` : '—');
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const M = MESES as unknown as string[];
const mesN = (i: number) => new Date(2026, i, 1).toLocaleDateString(LOC(), { month: 'long' });

function tabela(cab: string[], linhas: (string | number)[][], nota?: string): string {
  return `<table><thead><tr>${cab.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((v, i) => `<td class="${i ? 'n' : ''}">${typeof v === 'number' ? n0(v) : esc(String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table>${nota ? `<p class="fonte">${esc(nota)}</p>` : ''}`;
}
function area(num: number, titulo: Texto, estado: Texto, indicadores: string, leitura: Texto, limites: Texto): string {
  return `<section class="area"><div class="area-cab"><span class="area-n">${num}</span><div><h3>${esc(R(titulo))}</h3><span class="estado">${esc(R(estado))}</span></div></div>
  <h4>${R(['Indicadores', 'Indicators'])}</h4>${indicadores}
  <h4>${R(['Leitura', 'Interpretation'])}</h4><p>${esc(R(leitura))}</p>
  <h4>${R(['Limitações e próximos passos', 'Limitations and next steps'])}</h4><p>${esc(R(limites))}</p></section>`;
}
function soma(serie: any, ano: number, ate = 11) { let s = 0; for (let i = 0; i <= ate; i++) s += (serie?.[M[i]]?.[String(ano)] as number) || 0; return s; }
function ultimoMes(serie: any, ano: number) { let u = -1; for (let i = 0; i < 12; i++) if (typeof serie?.[M[i]]?.[String(ano)] === 'number') u = i; return u; }

export function gerarRelatorioInsto() {
  const ANO = 2025; // último ano completo
  const hoje = new Date().toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' });
  const origem = typeof window !== 'undefined' ? window.location.origin : '';
  const D: any = INSTO_DADOS; const S: any = SUSTENTABILIDADE; const E: any = EMPREGO; const H: any = HOTELARIA; const A: any = AL_BRAGA; const SE: any = SEMESTRE_2026; const T: any = TAXA_TURISTICA; const B: any = BALCAO; const SS: any = SETOR_SUSTENTAVEL;
  const DA = DORMIDAS_ANUAL as unknown as Record<string, number>; const HA = HOSPEDES_ANUAL as unknown as Record<string, number>; const EM = ESTADA_MEDIA as unknown as Record<string, number>; const ADR = ADR_ANUAL as unknown as Record<string, number>;
  const anosSerie = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  // Sazonalidade
  const mesesAno: number[] = []; for (let i = 0; i < 12; i++) mesesAno.push((DORMIDAS_BRAGA as any)[M[i]]?.[String(ANO)] || 0);
  let iMax = 0, iMin = 0; for (let i = 1; i < 12; i++) { if (mesesAno[i] > mesesAno[iMax]) iMax = i; if (mesesAno[i] < mesesAno[iMin]) iMin = i; }
  const pico = mesesAno[iMin] ? mesesAno[iMax] / mesesAno[iMin] : null;
  const u26 = Math.min(ultimoMes(DORMIDAS_BRAGA, 2026), ultimoMes(DORMIDAS_NORTE, 2026), ultimoMes(DORMIDAS_PORTUGAL, 2026));
  const vB = u26 >= 0 ? (soma(DORMIDAS_BRAGA, 2026, u26) / soma(DORMIDAS_BRAGA, 2025, u26) - 1) * 100 : null;
  const vN = u26 >= 0 ? (soma(DORMIDAS_NORTE, 2026, u26) / soma(DORMIDAS_NORTE, 2025, u26) - 1) * 100 : null;
  const vP = u26 >= 0 ? (soma(DORMIDAS_PORTUGAL, 2026, u26) / soma(DORMIDAS_PORTUGAL, 2025, u26) - 1) * 100 : null;
  // Emprego
  const RB = E?.regioes?.Braga || {}; const RC = E?.regioes?.['Cávado'] || {}; const RN = E?.regioes?.Norte || {}; const RP = E?.regioes?.Portugal || {};
  const quota = (x: any) => (x && x.total ? (x.turismo / x.total) * 100 : null);
  const serie = E?.serieBraga || {}; const sAnos: any[] = serie.anos || []; const sTur: number[] = serie.turismo || [];
  // Economia
  const prov25 = SE?.proveitos?.Braga?.['2025'] as number[] | undefined; const prov26 = SE?.proveitos?.Braga?.['2026'] as number[] | undefined;
  const sumA = (a?: number[]) => (a ? a.reduce((x, y) => x + y, 0) : null);
  const revB25 = SE?.revpar?.Braga?.['2025'] as number[] | undefined; const revB26 = SE?.revpar?.Braga?.['2026'] as number[] | undefined;
  const media = (a?: number[]) => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const taxaAnos = Object.keys(T || {}).sort();
  const sibs = [...(SIBS_PAISES as any[])].sort((a, b) => b.valor - a.valor); const sibsTotal = sibs.reduce((s, x) => s + (x.valor || 0), 0);
  // Oferta
  const hot = [...(H?.hoteis || []), ...(H?.outros || [])];
  const uni = hot.reduce((s: number, x: any) => s + (x.unidades || 0), 0); const adapt = hot.reduce((s: number, x: any) => s + (x.adaptadas || 0), 0);
  const camasHot = hot.reduce((s: number, x: any) => s + (x.camas || x.lugares || 0), 0);
  // Ambiente
  const en = D.energia; const ag = D.agua; const ar = D.aguasResiduais.Braga; const re = D.residuos; const cl = D.clima;
  const pop = en.porTipoBraga.total / en.porHab.Braga;
  const ago = (DORMIDAS_BRAGA as any)['Agosto']?.[String(ANO)] || 0;
  const pMedia = DA[String(ANO)] / 365 / pop * 100; const pAgo = ago / 31 / pop * 100;
  const P = S?.percecao || {}; const SD = S?.destino || {};
  const b25 = B?.['2025'] || {}; const b26 = B?.['2026'] || {};

  const resumo = [
    R([`Braga monitoriza as 11 áreas obrigatórias da rede INSTO, com dados públicos e fonte identificada para cada indicador.`, `Braga monitors all 11 mandatory INSTO issue areas, with public data and an identified source for every indicator.`]),
    R([`Em ${ANO}, o destino registou ${n0(DA[String(ANO)])} dormidas (${pc((DA[String(ANO)] / DA[String(ANO - 1)] - 1) * 100)} face a ${ANO - 1}) e ${n0(HA[String(ANO)])} hóspedes, com uma estada média de ${n2(EM[String(ANO)])} noites.`, `In ${ANO}, the destination recorded ${n0(DA[String(ANO)])} overnight stays (${pc((DA[String(ANO)] / DA[String(ANO - 1)] - 1) * 100)} vs ${ANO - 1}) and ${n0(HA[String(ANO)])} guests, with an average stay of ${n2(EM[String(ANO)])} nights.`]),
    R([`A sazonalidade de Braga (${n1(SD.sazonalidade)}%) é inferior à média nacional (${n1(SD.sazonalidadeNacional)}%): a procura está mais repartida ao longo do ano.`, `Braga’s seasonality (${n1(SD.sazonalidade)}%) is below the national average (${n1(SD.sazonalidadeNacional)}%): demand is spread more evenly across the year.`]),
    R([`${n1(P.positiva)}% dos residentes avaliam o turismo de forma positiva, mas ${n1(P.naoOuvidos)}% sentem que não são ouvidos nas decisões: a participação é a principal área de melhoria.`, `${n1(P.positiva)}% of residents view tourism positively, but ${n1(P.naoOuvidos)}% feel they are not heard in decisions: participation is the main area for improvement.`]),
    R([`As emissões de CO₂ do concelho baixaram ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% entre ${cl.anoBase} e 2024; a meta é −${cl.meta2030}% em 2030 e a neutralidade climática em ${cl.neutralidade}.`, `Municipal CO₂ emissions fell ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% between ${cl.anoBase} and 2024; the target is −${cl.meta2030}% by 2030 and climate neutrality by ${cl.neutralidade}.`]),
    R([`Os turistas que pernoitam equivalem a cerca de ${n1(pMedia)}% da população média do concelho (${n1(pAgo)}% em agosto): o peso do turismo no consumo de água, energia e resíduos é reduzido.`, `Overnight tourists are equivalent to about ${n1(pMedia)}% of the municipality’s average population (${n1(pAgo)}% in August): tourism’s share of water, energy and waste use is small.`]),
  ];

  const areas = [
    area(1, ['Sazonalidade', 'Tourism seasonality'], ['Monitorizada', 'Monitored'],
      tabela([R(['Mês', 'Month']), String(ANO - 1), String(ANO), '2026'], M.map((m, i) => [mesN(i), (DORMIDAS_BRAGA as any)[m]?.[String(ANO - 1)] ?? '—', (DORMIDAS_BRAGA as any)[m]?.[String(ANO)] ?? '—', (DORMIDAS_BRAGA as any)[m]?.['2026'] ?? '—']), R(['Dormidas nos estabelecimentos de alojamento turístico. Fonte: INE/TravelBI.', 'Overnight stays in tourist accommodation. Source: INE/TravelBI.']))
      + tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [[R(['Índice de sazonalidade, Braga', 'Seasonality index, Braga']), `${n1(SD.sazonalidade)}%`], [R(['Índice de sazonalidade, Portugal', 'Seasonality index, Portugal']), `${n1(SD.sazonalidadeNacional)}%`], [R([`Relação entre o mês mais forte (${mesN(iMax)}) e o mais fraco (${mesN(iMin)}) em ${ANO}`, `Ratio between the strongest (${mesN(iMax)}) and weakest (${mesN(iMin)}) month in ${ANO}`]), pico ? `${n2(pico)}×` : '—'], [R([`Dormidas, janeiro a ${mesN(Math.max(0, u26))} de 2026 face a 2025: Braga / Norte / Portugal`, `Overnight stays, January to ${mesN(Math.max(0, u26))} 2026 vs 2025: Braga / North / Portugal`]), `${pc(vB)} / ${pc(vN)} / ${pc(vP)}`]], R(['Índice de sazonalidade: Green Destinations (estudo de impacto). Restantes: cálculo da plataforma sobre dados do INE.', 'Seasonality index: Green Destinations (impact study). Others: platform calculation on INE data.'])),
      [`A procura é menos concentrada no verão do que a média nacional. O pico mantém-se em ${mesN(iMax)}, e o mês mais fraco é ${mesN(iMin)}, com uma diferença de ${pico ? n2(pico) : '—'} vezes entre ambos.`, `Demand is less concentrated in summer than the national average. The peak remains in ${mesN(iMax)} and the weakest month is ${mesN(iMin)}, with a ${pico ? n2(pico) : '—'}-fold difference between them.`],
      ['Os dados do INE não incluem o alojamento local com menos de 10 camas nem os visitantes de um dia. Próximo passo: integrar as dormidas declaradas na taxa turística, por mês.', 'INE data exclude short-term rentals with fewer than 10 beds and day visitors. Next step: integrate the overnight stays declared under the tourist tax, by month.']),
    area(2, ['Emprego', 'Employment'], ['Monitorizada', 'Monitored'],
      tabela([R(['Território', 'Territory']), R(['Alojamento e restauração', 'Accommodation and food']), R(['Total das empresas', 'All companies']), R(['Peso', 'Share'])], [['Braga', RB.turismo ?? '—', RB.total ?? '—', `${n1(quota(RB))}%`], ['Cávado', RC.turismo ?? '—', RC.total ?? '—', `${n1(quota(RC))}%`], ['Norte', RN.turismo ?? '—', RN.total ?? '—', `${n1(quota(RN))}%`], ['Portugal', RP.turismo ?? '—', RP.total ?? '—', `${n1(quota(RP))}%`]], R([`Pessoal ao serviço nas empresas não financeiras, ${E.ano}. Fonte: INE (Sistema de Contas Integradas das Empresas).`, `Persons employed in non-financial companies, ${E.ano}. Source: INE (Integrated Business Accounts System).`]))
      + (sAnos.length ? tabela([R(['Ano', 'Year']), R(['Pessoal ao serviço, alojamento e restauração, Braga', 'Persons employed, accommodation and food, Braga'])], sAnos.map((a: any, i: number) => [String(a), sTur[i] ?? '—']), R(['Fonte: PORDATA, com base no INE.', 'Source: PORDATA, based on INE.'])) : ''),
      [`Pelo menos ${n0(RB.turismo)} pessoas trabalham no alojamento e na restauração em Braga, ${n1(quota(RB))}% do emprego das empresas, um peso inferior ao do país (${n1(quota(RP))}%), próprio de uma economia diversificada.`, `At least ${n0(RB.turismo)} people work in accommodation and food services in Braga, ${n1(quota(RB))}% of company employment, a lower share than the national figure (${n1(quota(RP))}%), typical of a diversified economy.`],
      ['O INE conta o emprego pela sede da empresa, por isso o valor é um mínimo; a restauração também serve residentes. Próximo passo: emprego sazonal e qualificações no setor.', 'INE counts employment by company headquarters, so the figure is a minimum; food services also serve residents. Next step: seasonal employment and skills in the sector.']),
    area(3, ['Benefícios económicos do destino', 'Destination economic benefits'], ['Monitorizada', 'Monitored'],
      tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [
        [R([`Preço médio por quarto ocupado (ADR), ${ANO}`, `Average daily rate (ADR), ${ANO}`]), `${n2(ADR[String(ANO)])} €`],
        [R([`Preço médio por quarto ocupado (ADR), ${ANO - 1}`, `Average daily rate (ADR), ${ANO - 1}`]), `${n2(ADR[String(ANO - 1)])} €`],
        [R(['Proveitos do alojamento, 1.º semestre 2025 / 2026', 'Accommodation revenue, H1 2025 / 2026']), `${n0(sumA(prov25))} € / ${n0(sumA(prov26))} €`],
        [R(['Receita por quarto disponível (RevPAR), média do 1.º semestre 2025 / 2026', 'Revenue per available room (RevPAR), H1 average 2025 / 2026']), `${n2(media(revB25))} € / ${n2(media(revB26))} €`],
        [R([`Gasto com cartões estrangeiros (${SIBS_PERIODO})`, `Foreign card spending (${SIBS_PERIODO})`]), `${n0(sibsTotal)} €`],
      ], R(['Fontes: INE/TravelBI; SIBS Analytics.', 'Sources: INE/TravelBI; SIBS Analytics.']))
      + tabela([R(['Ano', 'Year']), R(['Receita da taxa turística municipal', 'Municipal tourist tax revenue'])], taxaAnos.map((a) => { const meses = Object.keys(T[a] || {}).filter((k) => k !== 'Total'); const parcial = meses.length < 12; return [parcial ? `${a} (${R([`${mesN(0)} a ${mesN(meses.length - 1)}, provisório`, `${mesN(0)} to ${mesN(meses.length - 1)}, provisional`])})` : a, `${n0(T[a]?.Total ?? meses.reduce((x, k) => x + (T[a][k] || 0), 0))} €`]; }), R(['Fonte: Município de Braga. O valor de 2026 reflete o novo montante de 1,50 € por noite (Regulamento n.º 927/2025).', 'Source: Braga City Council. The 2026 figure reflects the new rate of €1.50 per night (Regulation 927/2025).']))
      + tabela([R(['País do cartão', 'Card country']), R(['Gasto', 'Spending'])], sibs.slice(0, 8).map((x) => [String(x.pais), `${n0(x.valor)} €`]), R(['Fonte: SIBS Analytics. País do emissor do cartão, não a nacionalidade de quem paga.', 'Source: SIBS Analytics. Country of the card issuer, not the payer’s nationality.'])),
      [`O preço médio subiu de ${n2(ADR[String(ANO - 1)])} € para ${n2(ADR[String(ANO)])} €, sinal de valorização da oferta. O gasto com cartões estrangeiros evidencia o peso da diáspora (França, Suíça, Luxemburgo), que os dados do alojamento não captam.`, `The average rate rose from €${n2(ADR[String(ANO - 1)])} to €${n2(ADR[String(ANO)])}, a sign of the offer gaining value. Foreign card spending highlights the weight of the diaspora (France, Switzerland, Luxembourg), which accommodation data do not capture.`],
      ['Falta o gasto médio por visitante a partir de inquérito regular e o valor acrescentado do turismo (conta satélite regional). Próximo passo: repetir o inquérito ao visitante em época alta.', 'Missing: average spending per visitor from a regular survey and tourism value added (regional satellite account). Next step: repeat the visitor survey in high season.']),
    area(4, ['Satisfação dos residentes', 'Local satisfaction'], ['Monitorizada', 'Monitored'],
      tabela([R(['Indicador', 'Indicator']), '%'], [
        [R(['Perceção global positiva do turismo', 'Overall positive perception of tourism']), n1(P.positiva)], [R(['Perceção negativa', 'Negative perception']), n1(P.negativa)],
        [R(['O turismo beneficia a economia', 'Tourism benefits the economy']), n1(P.beneficiaEconomia)], [R(['O turismo valoriza a cultura local', 'Tourism enhances local culture']), n1(P.valorizaCultura)],
        [R(['O turismo melhora a vida dos residentes', 'Tourism improves residents’ lives']), n1(P.melhoraVida)], [R(['Preocupação com o custo de vida', 'Concern about cost of living']), n1(P.custoVida)],
        [R(['Preocupação com a sobrelotação', 'Concern about overcrowding']), n1(P.sobrelotacao)], [R(['Preocupação com impactos ambientais', 'Concern about environmental impacts']), n1(P.impactosAmbientais)],
        [R(['Sentem que não são ouvidos nas decisões', 'Feel they are not heard in decisions']), n1(P.naoOuvidos)],
      ], R([`Barómetro de Perceção dos Residentes 2026 (n = ${P.n}, ${P.periodo}); amostra não probabilística.`, `Residents’ Perception Barometer 2026 (n = ${P.n}, ${P.periodo}); non-probability sample.`])),
      [`A perceção é claramente positiva (${n1(P.positiva)}%). As preocupações concentram-se no custo de vida (${n1(P.custoVida)}%) e na sobrelotação (${n1(P.sobrelotacao)}%), e a participação nas decisões é o ponto mais fraco.`, `Perception is clearly positive (${n1(P.positiva)}%). Concerns focus on cost of living (${n1(P.custoVida)}%) and overcrowding (${n1(P.sobrelotacao)}%), and participation in decisions is the weakest point.`],
      ['Amostra não probabilística. Próximo passo: repetir o barómetro anualmente, com amostragem estratificada por freguesia, e criar o grupo de trabalho local com residentes.', 'Non-probability sample. Next step: repeat the barometer annually with sampling stratified by parish, and set up the local working group including residents.']),
    area(5, ['Acessibilidade', 'Accessibility'], ['Monitorizada', 'Monitored'],
      tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [
        [R(['Quartos de hotel adaptados a mobilidade reduzida', 'Hotel rooms adapted for reduced mobility']), `${n0(adapt)} / ${n0(uni)} (${n1(uni ? (adapt / uni) * 100 : null)}%)`],
        [R(['Estabelecimentos hoteleiros sem nenhum quarto adaptado', 'Hotel establishments with no adapted room']), n0(hot.filter((x: any) => !x.adaptadas).length)],
        [R(['Atendimentos com necessidades especiais no Posto de Turismo (2026)', 'Tourist office services to visitors with special needs (2026)']), n0(b26.necEspeciais)],
      ], R(['Fontes: visitbraga.travel; Posto de Turismo de Braga.', 'Sources: visitbraga.travel; Braga Tourist Office.'])),
      [`Só ${n1(uni ? (adapt / uni) * 100 : null)}% dos quartos de hotel estão adaptados, o principal défice de acessibilidade da oferta.`, `Only ${n1(uni ? (adapt / uni) * 100 : null)}% of hotel rooms are adapted, the main accessibility gap in the offer.`],
      ['O registo de necessidades especiais no Posto de Turismo começou em 2026 e ainda é parcial. Próximo passo: auditoria de acessibilidade aos principais monumentos e percursos.', 'Recording of special needs at the Tourist Office started in 2026 and is still partial. Next step: an accessibility audit of the main monuments and routes.']),
    area(6, ['Governança', 'Governance'], ['Monitorizada', 'Monitored'],
      tabela([R(['Mecanismo', 'Mechanism']), R(['Descrição', 'Description'])], (D.governanca as string[][]).map((g) => [EN() ? g[2] : g[0], EN() ? g[3] : g[1]])),
      [`O destino dispõe de vários mecanismos de planeamento e participação. O Barómetro mostra que ${n1(P.naoOuvidos)}% dos residentes não se sentem ouvidos: o grupo de trabalho local INSTO, com residentes, é a resposta natural.`, `The destination has several planning and participation mechanisms. The Barometer shows that ${n1(P.naoOuvidos)}% of residents do not feel heard: the INSTO local working group, including residents, is the natural response.`],
      ['Próximo passo: constituir formalmente o grupo de trabalho local INSTO e publicar as suas reuniões e conclusões.', 'Next step: formally set up the INSTO local working group and publish its meetings and conclusions.']),
    area(7, ['Gestão de energia', 'Energy management'], ['Monitorizada (escala concelhia)', 'Monitored (municipal level)'],
      tabela([R(['Território', 'Territory']), R([`Consumo de energia elétrica por habitante, ${en.ano} (kWh)`, `Electricity consumption per inhabitant, ${en.ano} (kWh)`])], ['Braga', 'Cávado', 'Norte', 'Portugal'].map((x) => [x, n1(en.porHab[x])]), R(['Fonte: INE (DGEG).', 'Source: INE (DGEG).']))
      + tabela([R(['Tipo de consumo, Braga', 'Type of use, Braga']), 'kWh', '%'], [[R(['Doméstico', 'Domestic']), en.porTipoBraga.domestico, `${n1((en.porTipoBraga.domestico / en.porTipoBraga.total) * 100)}%`], [R(['Não doméstico (comércio, serviços e turismo)', 'Non-domestic (retail, services and tourism)']), en.porTipoBraga.naoDomestico, `${n1((en.porTipoBraga.naoDomestico / en.porTipoBraga.total) * 100)}%`], [R(['Indústria', 'Industry']), en.porTipoBraga.industria, `${n1((en.porTipoBraga.industria / en.porTipoBraga.total) * 100)}%`], [R(['Iluminação pública', 'Street lighting']), en.porTipoBraga.iluminacaoPublica, `${n1((en.porTipoBraga.iluminacaoPublica / en.porTipoBraga.total) * 100)}%`], [R(['Total', 'Total']), en.porTipoBraga.total, '100%']]),
      [`O consumo por habitante é ${n1((1 - en.porHab.Braga / en.porHab.Portugal) * 100)}% inferior à média nacional. ${n1(SD.iluminacaoLED)}% da iluminação pública já é LED.`, `Consumption per inhabitant is ${n1((1 - en.porHab.Braga / en.porHab.Portugal) * 100)}% below the national average. ${n1(SD.iluminacaoLED)}% of street lighting is already LED.`],
      ['Os dados não isolam o consumo do setor turístico. Próximo passo: recolher o consumo energético dos alojamentos (questionário anual ou dados das certificações ambientais).', 'Data do not isolate the tourism sector’s consumption. Next step: collect accommodation energy use (annual questionnaire or environmental certification data).']),
    area(8, ['Gestão da água', 'Water management'], ['Monitorizada (escala concelhia)', 'Monitored (municipal level)'],
      tabela([R(['Território', 'Territory']), R([`Água distribuída por habitante, ${ag.ano} (m³)`, `Water supplied per inhabitant, ${ag.ano} (m³)`])], ['Braga', 'Cávado', 'Norte', 'Portugal'].map((x) => [x, n1(ag.porHab[x])]), R(['Fonte: INE (INAAS).', 'Source: INE (INAAS).'])),
      [`Braga consome ${n1(ag.porHab.Braga)} m³ por habitante, abaixo da média nacional (${n1(ag.porHab.Portugal)} m³).`, `Braga uses ${n1(ag.porHab.Braga)} m³ per inhabitant, below the national average (${n1(ag.porHab.Portugal)} m³).`],
      ['Próximo passo: perdas na rede e consumo dos alojamentos (dados da AGERE e das certificações).', 'Next step: network losses and accommodation water use (AGERE and certification data).']),
    area(9, ['Águas residuais', 'Wastewater (sewage) management'], ['Monitorizada (escala concelhia)', 'Monitored (municipal level)'],
      tabela([R(['Nível de tratamento, Braga', 'Treatment level, Braga']), 'm³', '%'], [[R(['Secundário', 'Secondary']), ar.secundario, `${n1((ar.secundario / ar.total) * 100)}%`], [R(['Terciário', 'Tertiary']), ar.terciario, `${n1((ar.terciario / ar.total) * 100)}%`], [R(['Total tratado', 'Total treated']), ar.total, '100%']], R([`Águas residuais tratadas, ${D.aguasResiduais.ano}. Fonte: INE (INAAS).`, `Wastewater treated, ${D.aguasResiduais.ano}. Source: INE (INAAS).`])),
      [`${n1((ar.terciario / ar.total) * 100)}% das águas residuais recebem tratamento terciário, o nível mais exigente.`, `${n1((ar.terciario / ar.total) * 100)}% of wastewater receives tertiary treatment, the most advanced level.`],
      ['Próximo passo: população servida e qualidade das massas de água a jusante (ERSAR e APA).', 'Next step: population served and downstream water body quality (ERSAR and APA).']),
    area(10, ['Gestão de resíduos sólidos', 'Solid waste management'], ['Monitorizada (escala concelhia)', 'Monitored (municipal level)'],
      tabela([R(['Território', 'Territory']), R([`Resíduos urbanos por habitante, ${re.ano} (kg)`, `Municipal waste per inhabitant, ${re.ano} (kg)`])], ['Braga', 'Cávado', 'Norte', 'Portugal'].map((x) => [x, n0(re.porHab[x])]), R(['Fonte: INE.', 'Source: INE.']))
      + tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [[R(['Alojamentos com ecoponto a menos de 100 m (200 m em zona rural)', 'Accommodation with a recycling point within 100 m (200 m in rural areas)']), `${n1(SD.recolhaSeletiva)}%`], [R(['Variação dos biorresíduos recolhidos (2021→2023)', 'Change in bio-waste collected (2021→2023)']), `+${n0(SD.biorresiduosVar)}%`]], R(['Fonte: Green Destinations, estudo de impacto 2025.', 'Source: Green Destinations, 2025 impact study.'])),
      [`Braga produz ${n0(re.porHab.Braga)} kg por habitante, abaixo do Norte (${n0(re.porHab.Norte)} kg) e do país (${n0(re.porHab.Portugal)} kg).`, `Braga generates ${n0(re.porHab.Braga)} kg per inhabitant, below the North (${n0(re.porHab.Norte)} kg) and the country (${n0(re.porHab.Portugal)} kg).`],
      ['Falta a proporção de recolha seletiva no concelho (INE). Próximo passo: resíduos dos alojamentos e dos eventos.', 'Missing: the municipal separate collection rate (INE). Next step: waste from accommodation and events.']),
    area(11, ['Ação climática', 'Climate action'], ['Monitorizada', 'Monitored'],
      tabela([R(['Setor', 'Sector']), String(cl.anoBase), '2022', '2024', R(['Variação', 'Change'])], (cl.setores as [string, number, number, number][]).map((x) => [x[0], x[1], x[2], x[3], pc((x[3] / x[1] - 1) * 100)]).concat([[R(['Total', 'Total']), cl.total[0], cl.total[1], cl.total[2], pc((cl.total[2] / cl.total[0] - 1) * 100)]]), R([`Emissões de CO₂ (t). ${cl.fonte}.`, `CO₂ emissions (t). ${cl.fonte}.`])),
      [`Redução de ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% face a ${cl.anoBase}. Meta do Pacto de Autarcas: −${cl.meta2030}% em 2030 (ambição −${cl.ambicao2030}%) e neutralidade climática em ${cl.neutralidade}. Os transportes representam ${n1((cl.setores[0][3] / cl.total[2]) * 100)}% das emissões; ${n1(SD.frotaVerde)}% da frota dos TUB é de baixas emissões.`, `A ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% reduction vs ${cl.anoBase}. Covenant of Mayors target: −${cl.meta2030}% by 2030 (ambition −${cl.ambicao2030}%) and climate neutrality by ${cl.neutralidade}. Transport accounts for ${n1((cl.setores[0][3] / cl.total[2]) * 100)}% of emissions; ${n1(SD.frotaVerde)}% of the TUB bus fleet is low-emission.`],
      ['Falta a pegada carbónica específica do turismo (transporte dos visitantes). Próximo passo: estimar as emissões das deslocações a partir dos mercados de origem e do meio de transporte.', 'Missing: tourism’s own carbon footprint (visitor travel). Next step: estimate travel emissions from source markets and transport mode.']),
  ].join('');

  const lacunas: Texto[] = [
    ['Dormidas declaradas na taxa turística, por mês (inclui o alojamento local com menos de 10 camas).', 'Overnight stays declared under the tourist tax, by month (includes short-term rentals with fewer than 10 beds).'],
    ['Visitantes de um dia, a partir de dados agregados de operadores móveis.', 'Day visitors, from aggregated mobile operator data.'],
    ['Inquérito ao visitante em época alta, para o gasto médio e a satisfação.', 'High-season visitor survey, for average spending and satisfaction.'],
    ['Consumos de energia, água e resíduos dos alojamentos turísticos.', 'Energy, water and waste use by tourist accommodation.'],
    ['Proporção de recolha seletiva no concelho (INE).', 'Municipal separate collection rate (INE).'],
    ['Pegada carbónica das deslocações dos visitantes.', 'Carbon footprint of visitor travel.'],
    ['Constituição formal do grupo de trabalho local INSTO, com residentes.', 'Formal set-up of the INSTO local working group, including residents.'],
  ];
  const fontes: [string, string][] = [
    ['INE · Instituto Nacional de Estatística', 'https://www.ine.pt'], ['TravelBI · Turismo de Portugal', 'https://travelbi.turismodeportugal.pt'], ['PORDATA', 'https://www.pordata.pt'],
    ['SIBS Analytics', 'https://www.sibs.com'], ['Green Destinations', 'https://www.greendestinations.org'], ['UN Tourism · INSTO', 'https://www.unwto.org/sustainable-development/unwto-international-network-of-sustainable-tourism-observatories'],
    [R(['PAESC de Braga, 2.º Relatório de Monitorização (maio de 2026)', 'Braga SECAP, 2nd Monitoring Report (May 2026)']), ''], [R(['Barómetro de Perceção dos Residentes 2026', 'Residents’ Perception Barometer 2026']), ''],
    [R(['Observatório de Turismo de Braga', 'Braga Tourism Observatory']), origem],
  ];
  const indice: Texto[] = [['Sumário executivo', 'Executive summary'], ['1. Enquadramento', '1. Background'], ['2. O destino em números', '2. The destination in figures'], ['3. As 11 áreas de monitorização', '3. The 11 monitoring areas'], ['4. Peso do turismo no consumo de recursos', '4. Tourism’s share of resource use'], ['5. Lacunas de informação e plano de melhoria', '5. Data gaps and improvement plan'], ['6. Fontes', '6. Sources']];

  const html = `<!doctype html><html lang="${EN() ? 'en' : 'pt-PT'}"><head><meta charset="utf-8"><title>${esc(R([`Relatório Anual INSTO ${ANO} · Braga`, `INSTO Annual Report ${ANO} · Braga`]))}</title>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} body{margin:0;font-family:'Public Sans',Arial,sans-serif;color:#1C1F24;background:#fff;font-size:11.5px;line-height:1.55;width:794px}
.pag{padding:46px 54px} .quebra{page-break-before:always}
.capa{height:1060px;display:flex;flex-direction:column;justify-content:space-between;padding:60px 56px;background:#15171B;color:#fff}
.capa .marca{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8AB0E6;font-weight:700}
.capa h1{font-size:44px;line-height:1.08;margin:0 0 14px;letter-spacing:-.02em} .capa h2{font-size:18px;font-weight:600;color:#C9CDD3;margin:0}
.capa .faixa{height:6px;background:linear-gradient(90deg,#E2231A 0 22%,#8AB0E6 22% 60%,#E9C46A 60% 78%,#7CC79A 78%)}
.capa .pe{font-size:12px;color:#A3A8B1}
h2.sec{font-size:22px;margin:0 0 6px;color:#15171B;letter-spacing:-.01em} .sub{color:#5A6270;margin:0 0 18px}
h3{font-size:15px;margin:0} h4{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#3B5B8C;margin:14px 0 6px}
table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:10.8px} th{background:#3B5B8C;color:#fff;text-align:left;padding:6px 8px;font-weight:700} td{padding:5px 8px;border-bottom:1px solid #E1E6EE} td.n{text-align:right;font-variant-numeric:tabular-nums} tr:nth-child(even) td{background:#F4F7FB}
.fonte{font-size:9.5px;color:#6F747D;margin:2px 0 8px}
.area{padding:16px 0 12px;border-top:2px solid #E1E6EE;page-break-inside:avoid} .area-cab{display:flex;gap:12px;align-items:center}
.area-n{width:34px;height:34px;border-radius:8px;background:#15171B;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.estado{display:inline-block;margin-top:3px;font-size:9.5px;font-weight:700;color:#2E7D4F;background:#E6F4EC;border-radius:999px;padding:1px 8px}
ul.res{padding-left:18px} ul.res li{margin-bottom:6px} .ficha td:first-child{font-weight:700;width:34%}
.destaque{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0} .destaque div{border:1px solid #E1E6EE;border-radius:8px;padding:10px 12px} .destaque b{display:block;font-size:22px;color:#15171B} .destaque span{font-size:10px;color:#5A6270}
</style></head><body>
<div class="capa"><div><div class="marca">${R(['Município de Braga · Observatório de Turismo de Braga', 'Braga City Council · Braga Tourism Observatory'])}</div></div>
<div><h1>${R([`Relatório Anual de Monitorização ${ANO}`, `Annual Monitoring Report ${ANO}`])}</h1><h2>${R(['Rede Internacional de Observatórios de Turismo Sustentável (INSTO) · ONU Turismo', 'International Network of Sustainable Tourism Observatories (INSTO) · UN Tourism'])}</h2></div>
<div><div class="faixa"></div><p class="pe">${R(['Braga, Portugal', 'Braga, Portugal'])} · ${esc(hoje)}</p></div></div>

<div class="pag quebra"><h2 class="sec">${R(['Ficha técnica', 'Technical record'])}</h2>
${tabela([R(['Campo', 'Field']), R(['Informação', 'Information'])], [[R(['Entidade', 'Organisation']), CONTACTOS.entidade], [R(['Unidade responsável', 'Responsible unit']), R(['Divisão de Atividades Económicas e Turismo', 'Economic Activities and Tourism Division'])], [R(['Ano de referência', 'Reference year']), `${ANO} (${R(['com dados de 2026 quando disponíveis', 'with 2026 data where available'])})`], [R(['Data de emissão', 'Issue date']), hoje], [R(['Contacto', 'Contact']), CONTACTOS.emailAcessibilidade || CONTACTOS.site], [R(['Plataforma', 'Platform']), origem]]).replace('<table>', '<table class="ficha">')}
<h2 class="sec" style="margin-top:26px">${R(['Índice', 'Contents'])}</h2><ul class="res">${indice.map((x) => `<li>${esc(R(x))}</li>`).join('')}</ul>
<h2 class="sec" style="margin-top:26px">${R(['Sumário executivo', 'Executive summary'])}</h2>
<div class="destaque"><div><b>11/11</b><span>${R(['áreas INSTO monitorizadas', 'INSTO areas monitored'])}</span></div><div><b>${n0(DA[String(ANO)])}</b><span>${R([`dormidas em ${ANO}`, `overnight stays in ${ANO}`])}</span></div><div><b>${n1(P.positiva)}%</b><span>${R(['residentes com perceção positiva', 'residents with a positive perception'])}</span></div></div>
<ul class="res">${resumo.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>

<div class="pag quebra"><h2 class="sec">${R(['1. Enquadramento', '1. Background'])}</h2>
<p>${esc(R(['A INSTO (International Network of Sustainable Tourism Observatories) é a rede de observatórios de turismo sustentável da ONU Turismo. Os membros comprometem-se a monitorizar 11 áreas obrigatórias, a manter um grupo de trabalho local com os parceiros do destino e a reportar anualmente os resultados.', 'INSTO (International Network of Sustainable Tourism Observatories) is UN Tourism’s network of sustainable tourism observatories. Members commit to monitoring 11 mandatory issue areas, keeping a local working group with destination partners and reporting results annually.']))}</p>
<p>${esc(R(['O Observatório de Turismo de Braga é uma plataforma pública do Município, que reúne num só lugar os dados da procura, da economia, da oferta, da reputação online, da mobilidade e da sustentabilidade do destino, com a fonte e o período de cada indicador.', 'The Braga Tourism Observatory is a public municipal platform bringing together data on demand, economy, supply, online reputation, mobility and sustainability, with the source and period of each indicator.']))}</p>
<h4>${R(['Metodologia', 'Methodology'])}</h4><ul class="res">
<li>${esc(R(['Fontes oficiais (INE, TravelBI, PORDATA) sempre que existem; dados administrativos do Município; estudos próprios (Barómetro, perfil do turista); dados de parceiros (SIBS, TUB, Green Destinations).', 'Official sources (INE, TravelBI, PORDATA) where available; municipal administrative data; own studies (Barometer, visitor profile); partner data (SIBS, TUB, Green Destinations).']))}</li>
<li>${esc(R(['As áreas ambientais são medidas à escala do concelho, como a rede admite, com uma estimativa do peso do turismo (secção 4).', 'Environmental areas are measured at municipal level, as the network allows, with an estimate of tourism’s share (section 4).']))}</li>
<li>${esc(R(['Cada indicador indica a fonte e o período. As estimativas da plataforma estão identificadas como tal.', 'Every indicator states its source and period. Platform estimates are identified as such.']))}</li></ul></div>

<div class="pag quebra"><h2 class="sec">${R(['2. O destino em números', '2. The destination in figures'])}</h2>
${tabela([R(['Ano', 'Year']), R(['Dormidas', 'Overnight stays']), R(['Hóspedes', 'Guests']), R(['Estada média (noites)', 'Average stay (nights)']), R(['ADR (€)', 'ADR (€)'])], anosSerie.map((a) => [a, DA[a] ?? '—', HA[a] ?? '—', n2(EM[a]), n2(ADR[a])]), R(['Fonte: INE/TravelBI. 2020–2021 refletem a pandemia.', 'Source: INE/TravelBI. 2020–2021 reflect the pandemic.']))}
${tabela([R(['Oferta', 'Supply']), R(['Valor', 'Value'])], [[R(['Estabelecimentos hoteleiros', 'Hotel establishments']), n0(hot.length)], [R(['Quartos de hotel', 'Hotel rooms']), n0(uni)], [R(['Camas em estabelecimentos hoteleiros (INE, 2025)', 'Beds in hotel establishments (INE, 2025)']), n0((CAPACIDADE_CAMAS as any)?.Braga?.['2025']?.hotelaria)], [R(['Alojamentos locais ativos (base municipal)', 'Active short-term rentals (municipal register)']), n0(A.total)], [R(['Camas em alojamento local ativo', 'Beds in active short-term rentals']), n0(A.camas)], [R(['Negócios turísticos com certificação ambiental', 'Tourism businesses with environmental certification']), n0((SS?.certificados || []).length)]], R(['Fontes: INE; visitbraga.travel; plataforma municipal da taxa turística; listas Green Key e Biosphere.', 'Sources: INE; visitbraga.travel; municipal tourist tax platform; Green Key and Biosphere lists.']))}
${tabela([R(['Residência', 'Residence']), R([`Dormidas ${ANO}`, `Overnight stays ${ANO}`])], [[R(['Residentes em Portugal', 'Residents in Portugal']), (RESIDENTES as any)?.[String(ANO)]?.dormidasRes ?? '—'], [R(['Não residentes', 'Non-residents']), (RESIDENTES as any)?.[String(ANO)]?.dormidasNaoRes ?? '—']], R(['Fonte: INE/TravelBI.', 'Source: INE/TravelBI.']))}
</div>

<div class="pag quebra"><h2 class="sec">${R(['3. As 11 áreas de monitorização', '3. The 11 monitoring areas'])}</h2><p class="sub">${R(['Para cada área: indicadores, leitura, limitações e próximos passos.', 'For each area: indicators, interpretation, limitations and next steps.'])}</p>${areas}</div>

<div class="pag quebra"><h2 class="sec">${R(['4. Peso do turismo no consumo de recursos', '4. Tourism’s share of resource use'])}</h2>
<p>${esc(R([`As ${n0(DA[String(ANO)])} dormidas de ${ANO} equivalem, em média, a ${n0(DA[String(ANO)] / 365)} pessoas por dia, face a uma população de cerca de ${n0(Math.round(pop / 100) * 100)} habitantes (implícita nos dados do INE sobre energia). Isto corresponde a ${n1(pMedia)}% da população em média e a ${n1(pAgo)}% em agosto, o mês com mais dormidas.`, `The ${n0(DA[String(ANO)])} overnight stays in ${ANO} are on average equivalent to ${n0(DA[String(ANO)] / 365)} people a day, against a population of about ${n0(Math.round(pop / 100) * 100)} (implied by INE energy data). This is ${n1(pMedia)}% of the population on average and ${n1(pAgo)}% in August, the busiest month.`]))}</p>
<p>${esc(R(['Se os turistas consumirem como os residentes, o seu peso no consumo de água, energia doméstica e resíduos é da mesma ordem de grandeza. A estimativa não inclui os visitantes de um dia nem diferenças de consumo entre turistas e residentes.', 'If tourists consume like residents, their share of water, domestic energy and waste is of the same order of magnitude. The estimate excludes day visitors and differences in consumption between tourists and residents.']))}</p></div>

<div class="pag quebra"><h2 class="sec">${R(['5. Lacunas de informação e plano de melhoria', '5. Data gaps and improvement plan'])}</h2>
<ul class="res">${lacunas.map((x) => `<li>${esc(R(x))}</li>`).join('')}</ul>
<h2 class="sec" style="margin-top:26px">${R(['6. Fontes', '6. Sources'])}</h2>
<ul class="res">${fontes.map(([n, u]) => `<li>${esc(n)}${u ? ` · <a href="${esc(u)}">${esc(u)}</a>` : ''}</li>`).join('')}</ul>
<p class="fonte" style="margin-top:22px">${R(['Documento gerado automaticamente pelo Observatório de Turismo de Braga a partir dos dados publicados na plataforma.', 'Document generated automatically by the Braga Tourism Observatory from the data published on the platform.'])}</p></div>
</body></html>`;
  const w = abrirJanelaDocumento(820, 1100);
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
  // b25 é usado para manter a mesma base nos próximos relatórios (atendimentos 2025)
  void b25;
}
