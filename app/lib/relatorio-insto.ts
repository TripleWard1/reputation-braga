import { getLang } from '@/app/lib/i18n';
import { abrirJanelaDocumento } from '@/app/lib/abrir-documento';
import { MESES, DORMIDAS_BRAGA, DORMIDAS_NORTE, DORMIDAS_PORTUGAL, DORMIDAS_ANUAL, HOSPEDES_ANUAL, ESTADA_MEDIA, ADR_ANUAL, CAPACIDADE_CAMAS, SEMESTRE_2026, TAXA_TURISTICA, SUSTENTABILIDADE, BALCAO, RESIDENTES } from '@/app/lib/observatorio-dados';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { INSTO_DADOS } from '@/app/lib/insto-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { SIBS_PAISES, SIBS_PERIODO } from '@/app/lib/sibs-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { AEROPORTO_PORTO } from '@/app/lib/alojamento-aeroporto-dados';
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

// ── Estatísticas usadas na caracterização (métodos descritos na secção de metodologia) ──
function gini(xs: number[]): number | null {
  const v = xs.filter((x) => typeof x === 'number' && x > 0).sort((a, b) => a - b); const n = v.length; if (n < 2) return null;
  let s = 0, si = 0; for (let i = 0; i < n; i++) { s += v[i]; si += (i + 1) * v[i]; }
  return (2 * si) / (n * s) - (n + 1) / n;
}
function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length); if (n < 6) return null;
  let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  return va && vb ? c / Math.sqrt(va * vb) : null;
}
function mesesDe(serie: any, ano: number): number[] { const r: number[] = []; for (let i = 0; i < 12; i++) r.push((serie?.[M[i]]?.[String(ano)] as number) || 0); return r; }
function mesesDoAno(ano: number): number[] { const r: number[] = []; for (let i = 0; i < 12; i++) r.push(((DORMIDAS_BRAGA as any)[M[i]]?.[String(ano)] as number) || 0); return r; }

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
  const POP_CENSOS = 193333; // INE, Censos 2021 (resultados provisórios)
  const pop = POP_CENSOS;
  const ago = (DORMIDAS_BRAGA as any)['Agosto']?.[String(ANO)] || 0;
  const pMedia = DA[String(ANO)] / 365 / pop * 100; const pAgo = ago / 31 / pop * 100;
  const P = S?.percecao || {}; const SD = S?.destino || {};
  const b25 = B?.['2025'] || {}; const b26 = B?.['2026'] || {};

  // ── Indicadores de investigação ──
  const cagr = (Math.pow(DA['2025'] / DA['2019'], 1 / 6) - 1) * 100;
  const recup = (DA['2025'] / DA['2019'] - 1) * 100;
  const gini19 = gini(mesesDoAno(2019)); const gini25 = gini(mesesDoAno(ANO));
  const giniN = gini(mesesDe(DORMIDAS_NORTE, ANO)); const giniP = gini(mesesDe(DORMIDAS_PORTUGAL, ANO));
  const difGini = gini19 !== null && gini25 !== null ? Math.round(gini25 * 100) - Math.round(gini19 * 100) : 0;
  const merc: [string, number, number][] = (SE?.mercadosDormidas || []).map((x: any[]) => [String(x[0]), Number(x[1]) || 0, Number(x[2]) || 0]);
  merc.sort((a, b) => b[2] - a[2]);
  const totM = merc.reduce((s2, x) => s2 + x[2], 0);
  const hhi = totM ? merc.reduce((s2, x) => s2 + Math.pow((x[2] / totM) * 100, 2), 0) : null;
  const nMerc = merc.length;
  const top3 = totM ? ((merc[0]?.[2] || 0) + (merc[1]?.[2] || 0) + (merc[2]?.[2] || 0)) / totM * 100 : null;
  const camasTot = ((CAPACIDADE_CAMAS as any)?.Braga?.['2025']?.hotelaria || 0) + (A.camas || 0);
  const defert = camasTot / pop * 100;
  const intensidade = DA[String(ANO)] / pop;
  const infl: number[] = E?.inflacao?.taxas || []; const inflAnos: number[] = E?.inflacao?.anos || [];
  let fator = 1; for (let i = 0; i < inflAnos.length; i++) if (inflAnos[i] >= 2022 && inflAnos[i] <= 2024) fator *= 1 + infl[i] / 100;
  const adrNom = (ADR['2024'] / ADR['2021'] - 1) * 100; const adrReal = ((ADR['2024'] / ADR['2021']) / fator - 1) * 100;
  const aeroMeses: any[] = (AEROPORTO_PORTO as any)?.meses || []; const xa: number[] = [], xb: number[] = [];
  for (let i = 0; i < aeroMeses.length; i++) { const [aa, mm] = String(aeroMeses[i].mes).split('-').map(Number); const d = (DORMIDAS_BRAGA as any)[M[mm - 1]]?.[String(aa)]; if (typeof d === 'number') { xa.push(aeroMeses[i].n); xb.push(d); } }
  const rAero = pearson(xa, xb);
  const revPT25 = SE?.revpar?.Portugal?.['2025'] as number[] | undefined; const revPT26 = SE?.revpar?.Portugal?.['2026'] as number[] | undefined;
  const revCres = media(revB25) && media(revB26) ? ((media(revB26) as number) / (media(revB25) as number) - 1) * 100 : null;
  const revCresPT = media(revPT25) && media(revPT26) ? ((media(revPT26) as number) / (media(revPT25) as number) - 1) * 100 : null;
  const R19 = (RESIDENTES as any)?.['2019'] || {}; const R25 = (RESIDENTES as any)?.[String(ANO)] || {};
  const nr19 = R19.dormidasRes ? R19.dormidasNaoRes / (R19.dormidasRes + R19.dormidasNaoRes) * 100 : null;
  const nr25 = R25.dormidasRes ? R25.dormidasNaoRes / (R25.dormidasRes + R25.dormidasNaoRes) * 100 : null;
  const gan = E?.ganho || {}; const difSal = gan.total ? (gan.turismo / gan.total - 1) * 100 : null;
  const empVar = sTur.length >= 2 ? (sTur[sTur.length - 1] / sTur[0] - 1) * 100 : null;
  const fregs: any[] = (A?.freguesias || []).slice().sort((a: any, b: any) => b.n - a.n);
  const centro = fregs.filter((x: any) => x.centro).reduce((s2: number, x: any) => s2 + x.n, 0);
  const PF: any = PERFIL_TURISTA;

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
  const lista = (xs: Texto[]) => `<ul class="res">${xs.map((x) => `<li>${esc(R(x))}</li>`).join('')}</ul>`;
  const par = (x: Texto) => `<p>${esc(R(x))}</p>`;
  const indice: Texto[] = [['Resumo / Abstract', 'Abstract'], ['1. Introdução', '1. Introduction'], ['2. Enquadramento teórico e normativo', '2. Theoretical and policy framework'], ['3. Metodologia', '3. Methodology'], ['4. Caracterização do destino', '4. Destination profile'], ['5. As 11 áreas de monitorização INSTO', '5. The 11 INSTO monitoring areas'], ['6. Peso do turismo no consumo de recursos', '6. Tourism’s share of resource use'], ['7. Discussão', '7. Discussion'], ['8. Conclusões e recomendações', '8. Conclusions and recommendations'], ['9. Limitações e plano de melhoria da informação', '9. Limitations and data improvement plan'], ['Referências bibliográficas', 'References'], ['Anexo A. Matriz de indicadores INSTO', 'Annex A. INSTO indicator matrix'], ['Anexo B. Glossário', 'Annex B. Glossary'], ['Fontes de dados', 'Data sources']];
  const refs = [
    'Ap, J. (1992). Residents’ perceptions on tourism impacts. Annals of Tourism Research, 19(4), 665–690.',
    'Butler, R. W. (1980). The concept of a tourist area cycle of evolution: Implications for management of resources. Canadian Geographer, 24(1), 5–12.',
    'Defert, P. (1988). Nouvelles réflexions sur le taux de fonction touristique. Téoros, 7(3).',
    'Doxey, G. V. (1975). A causation theory of visitor–resident irritants: Methodology and research inferences. In Sixth Annual Conference Proceedings of the Travel Research Association (pp. 195–198). San Diego: Travel Research Association.',
    'European Commission (2016). The European Tourism Indicator System: ETIS toolkit for sustainable destination management. Luxembourg: Publications Office of the European Union.',
    'Global Sustainable Tourism Council (2019). GSTC Destination Criteria, version 2.0.',
    'Lundtorp, S. (2001). Measuring tourism seasonality. In T. Baum & S. Lundtorp (Eds.), Seasonality in Tourism. Oxford: Pergamon.',
    'UNWTO (2004). Indicators of Sustainable Development for Tourism Destinations: A Guidebook. Madrid: World Tourism Organization.',
    'U.S. Department of Justice & Federal Trade Commission (2023). Merger Guidelines. Washington, DC.',
    'UNWTO & UNEP (2005). Making Tourism More Sustainable: A Guide for Policy Makers. Madrid / Paris: World Tourism Organization / United Nations Environment Programme.',
  ];
  const fontesMetodo = tabela([R(['Fonte', 'Source']), R(['Indicadores', 'Indicators']), R(['Periodicidade', 'Frequency']), R(['Escala', 'Scale'])], [
    ['INE / TravelBI', R(['Dormidas, hóspedes, estada média, proveitos, ADR, RevPAR, mercados', 'Overnight stays, guests, length of stay, revenue, ADR, RevPAR, markets']), R(['Mensal', 'Monthly']), R(['Concelho', 'Municipality'])],
    ['INE (SCIE) / PORDATA', R(['Emprego por setor', 'Employment by sector']), R(['Anual', 'Annual']), R(['Concelho', 'Municipality'])],
    ['INE / MTSSS-GEP', R(['Ganho médio mensal', 'Average monthly earnings']), R(['Anual', 'Annual']), R(['Região Norte', 'North region'])],
    ['INE (DGEG, INAAS)', R(['Energia, água, águas residuais, resíduos', 'Energy, water, wastewater, waste']), R(['Anual', 'Annual']), R(['Concelho', 'Municipality'])],
    [R(['Município de Braga', 'Braga City Council']), R(['Taxa turística, alojamento local, Posto de Turismo', 'Tourist tax, short-term rentals, Tourist Office']), R(['Mensal / contínua', 'Monthly / continuous']), R(['Concelho e freguesia', 'Municipality and parish'])],
    [R(['Barómetro dos Residentes', 'Residents’ Barometer']), R(['Perceção dos impactos do turismo', 'Perception of tourism impacts']), R(['Anual (prevista; 1.ª edição em 2026)', 'Annual (planned; 1st edition in 2026)']), R(['Concelho', 'Municipality'])],
    [R(['Inquérito ao visitante', 'Visitor survey']), R(['Perfil, motivação, alojamento, transporte', 'Profile, motivation, accommodation, transport']), R(['Pontual', 'One-off']), R(['Destino', 'Destination'])],
    ['SIBS Analytics', R(['Gasto com cartões estrangeiros', 'Foreign card spending']), R(['Mensal', 'Monthly']), R(['Concelho', 'Municipality'])],
    [R(['PAESC de Braga', 'Braga SECAP']), R(['Emissões de CO₂ por setor', 'CO₂ emissions by sector']), R(['Bienal', 'Biennial']), R(['Concelho', 'Municipality'])],
    ['Green Destinations', R(['Sazonalidade, recolha seletiva, certificação', 'Seasonality, separate collection, certification']), R(['Ciclo de certificação', 'Certification cycle']), R(['Destino', 'Destination'])],
  ]);
  const metodos: Texto[] = [
    ['Variação homóloga: comparação de um período com o mesmo período do ano anterior, para neutralizar a sazonalidade.', 'Year-on-year change: comparison of a period with the same period of the previous year, to neutralise seasonality.'],
    [`Taxa de crescimento anual composta (TCAC): (V₂₀₂₅ / V₂₀₁₉)^(1/6) − 1.`, `Compound annual growth rate (CAGR): (V₂₀₂₅ / V₂₀₁₉)^(1/6) − 1.`],
    ['Coeficiente de Gini da sazonalidade (Lundtorp, 2001): G = 2·Σ(i·xᵢ) / (n·Σxᵢ) − (n+1)/n, com as dormidas mensais xᵢ ordenadas por ordem crescente (n = 12). Mede a desigualdade da distribuição mensal: 0 = procura igual em todos os meses; quanto maior, mais concentrada. Lê-se por comparação com o Norte e Portugal.', 'Seasonality Gini coefficient (Lundtorp, 2001): G = 2·Σ(i·xᵢ) / (n·Σxᵢ) − (n+1)/n, with monthly overnight stays xᵢ sorted in ascending order (n = 12). It measures the inequality of the monthly distribution: 0 = equal demand every month; the higher, the more concentrated. Read by comparison with the North and Portugal.'],
    ['Índice de Herfindahl-Hirschman (IHH): IHH = Σ sᵢ², em que sᵢ é a quota (%) de cada mercado emissor. Varia entre perto de 0 (muitos mercados pequenos) e 10 000 (um único mercado). As orientações de concorrência dos EUA (U.S. Department of Justice & Federal Trade Commission, 2023) consideram elevada a concentração acima de 1 800; o limiar é usado apenas como referência.', 'Herfindahl-Hirschman Index (HHI): HHI = Σ sᵢ², where sᵢ is each source market’s share (%). It ranges from near 0 (many small markets) to 10,000 (a single market). The US competition guidelines (U.S. Department of Justice & Federal Trade Commission, 2023) treat concentration above 1,800 as high; the threshold is used only as a reference.'],
    ['Taxa de função turística de Defert: T(f) = camas turísticas ÷ população residente × 100 (definida por Defert em 1967; ver Defert, 1988). Intensidade turística: dormidas ÷ população residente. População: Censos 2021 (provisórios).', 'Defert tourist function rate: T(f) = tourist beds ÷ resident population × 100 (defined by Defert in 1967; see Defert, 1988). Tourism intensity: overnight stays ÷ resident population. Population: 2021 Census (provisional).'],
    ['Preço médio real: variação do ADR entre 2021 e 2024 a dividir pelo fator de inflação acumulada, (1 + π₂₀₂₂)·(1 + π₂₀₂₃)·(1 + π₂₀₂₄), com as taxas de variação média anual do Índice de Preços no Consumidor (INE).', 'Real average rate: change in ADR between 2021 and 2024 divided by the cumulative inflation factor, (1 + π₂₀₂₂)·(1 + π₂₀₂₃)·(1 + π₂₀₂₄), using the annual average change of the Consumer Price Index (INE).'],
    ['Coeficiente de correlação de Pearson: r = Σ(xᵢ − x̄)(yᵢ − ȳ) / √[Σ(xᵢ − x̄)²·Σ(yᵢ − ȳ)²], entre os passageiros desembarcados no Aeroporto do Porto e as dormidas mensais de Braga, nos meses com as duas séries.', 'Pearson correlation coefficient: r = Σ(xᵢ − x̄)(yᵢ − ȳ) / √[Σ(xᵢ − x̄)²·Σ(yᵢ − ȳ)²], between arriving passengers at Porto Airport and Braga’s monthly overnight stays, over the months covered by both series.'],
  ];
  const cmp = (x: number | null, a: Texto, b: Texto) => (x === null ? '' : R(x >= 0 ? a : b));
  const caract = `
<h3 class="h3s">${R(['4.1 Procura: evolução e recuperação', '4.1 Demand: trends and recovery'])}</h3>
${par([`Entre 2019 e ${ANO}, as dormidas passaram de ${n0(DA['2019'])} para ${n0(DA[String(ANO)])}, uma variação de ${pc(recup)} e uma taxa de crescimento anual composta de ${pc(cagr)}. O destino recuperou integralmente do choque pandémico (${n0(DA['2020'])} dormidas em 2020) e situa-se acima do nível pré-pandemia. Os hóspedes cresceram ${pc((HA[String(ANO)] / HA['2019'] - 1) * 100)} e a estada média passou de ${n2(EM['2019'])} para ${n2(EM[String(ANO)])} noites (${pc((EM[String(ANO)] / EM['2019'] - 1) * 100)}): o crescimento das dormidas resulta, em partes semelhantes, de mais hóspedes e de estadas um pouco mais longas.`, `Between 2019 and ${ANO}, overnight stays went from ${n0(DA['2019'])} to ${n0(DA[String(ANO)])}, a change of ${pc(recup)} and a compound annual growth rate of ${pc(cagr)}. The destination fully recovered from the pandemic shock (${n0(DA['2020'])} overnight stays in 2020) and stands above its pre-pandemic level. Guests grew ${pc((HA[String(ANO)] / HA['2019'] - 1) * 100)} and the average stay went from ${n2(EM['2019'])} to ${n2(EM[String(ANO)])} nights (${pc((EM[String(ANO)] / EM['2019'] - 1) * 100)}): growth in overnight stays comes, in similar parts, from more guests and slightly longer stays.`])}
${tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [[R(['Recuperação face a 2019', 'Recovery vs 2019']), pc(recup)], [R(['Taxa de crescimento anual composta 2019–2025', 'Compound annual growth rate 2019–2025']), pc(cagr)], [R([`Intensidade turística (dormidas por habitante, ${ANO})`, `Tourism intensity (overnight stays per inhabitant, ${ANO})`]), n2(intensidade)], [R(['Quota de dormidas de não residentes, 2019 → ' + ANO, 'Share of non-resident overnight stays, 2019 → ' + ANO]), `${n1(nr19)}% → ${n1(nr25)}%`]], R(['Cálculo da plataforma sobre dados do INE/TravelBI.', 'Platform calculation on INE/TravelBI data.']))}
<h3 class="h3s">${R(['4.2 Sazonalidade', '4.2 Seasonality'])}</h3>
${par([`O coeficiente de Gini da distribuição mensal das dormidas foi de ${n2(gini19 as number)} em 2019 e de ${n2(gini25 as number)} em ${ANO}. ${difGini === 0 ? 'A distribuição mantém-se estável.' : difGini < 0 ? 'A redução indica uma procura mais bem repartida ao longo do ano.' : 'O aumento indica uma procura ligeiramente mais concentrada.'} Como o coeficiente não tem limiares universais, a leitura faz-se por comparação: no mesmo ano, o Gini foi de ${n2(giniN as number)} na Região Norte e de ${n2(giniP as number)} em Portugal. ${giniP !== null && gini25 !== null && gini25 < giniP ? 'A procura em Braga é, portanto, menos sazonal do que a média nacional, o que é coerente com o índice de sazonalidade da Green Destinations.' : 'A procura em Braga não é menos sazonal do que a média nacional.'}`, `The Gini coefficient of the monthly distribution of overnight stays was ${n2(gini19 as number)} in 2019 and ${n2(gini25 as number)} in ${ANO}. ${difGini === 0 ? 'The distribution remains stable.' : difGini < 0 ? 'The decrease indicates demand more evenly spread across the year.' : 'The increase indicates slightly more concentrated demand.'} As the coefficient has no universal thresholds, it is read by comparison: in the same year, the Gini was ${n2(giniN as number)} in the North region and ${n2(giniP as number)} in Portugal. ${giniP !== null && gini25 !== null && gini25 < giniP ? 'Demand in Braga is therefore less seasonal than the national average, consistent with the Green Destinations seasonality index.' : 'Demand in Braga is not less seasonal than the national average.'}`])}
<h3 class="h3s">${R(['4.3 Mercados emissores', '4.3 Source markets'])}</h3>
${tabela([R(['Mercado', 'Market']), R(['Dormidas 1.º sem. 2025', 'Overnight stays H1 2025']), R(['Dormidas 1.º sem. 2026', 'Overnight stays H1 2026']), R(['Variação', 'Change']), R(['Quota', 'Share'])], merc.slice(0, 12).map((x) => [x[0], x[1], x[2], pc(x[1] ? (x[2] / x[1] - 1) * 100 : null), `${n1(totM ? (x[2] / totM) * 100 : null)}%`]), R(['Mercados de não residentes. Fonte: INE/TravelBI. Quota calculada sobre os mercados listados.', 'Non-resident markets. Source: INE/TravelBI. Share calculated over the listed markets.']))}
${par([`Calculado sobre os ${nMerc} mercados que o INE publica para Braga, o índice de Herfindahl-Hirschman é de ${n0(hhi)}, e os três principais concentram ${n1(top3)}% das dormidas desses mercados. Como os restantes mercados ficam de fora, o valor sobrestima a concentração real. Mesmo assim, fica abaixo do limiar de 1 800 que a análise da concorrência considera elevada concentração (U.S. Department of Justice & Federal Trade Commission, 2023), um limiar que aqui serve apenas de referência indicativa.`, `Calculated over the ${nMerc} markets INE publishes for Braga, the Herfindahl-Hirschman index is ${n0(hhi)}, and the top three account for ${n1(top3)}% of those markets’ overnight stays. As the remaining markets are left out, the value overstates actual concentration. Even so, it is below the 1,800 threshold that competition analysis treats as high concentration (U.S. Department of Justice & Federal Trade Commission, 2023), used here only as an indicative reference.`])}
<h3 class="h3s">${R(['4.4 Oferta de alojamento', '4.4 Accommodation supply'])}</h3>
${tabela([R(['Indicador', 'Indicator']), R(['Valor', 'Value'])], [[R(['Camas em estabelecimentos hoteleiros (INE, 2025)', 'Beds in hotel establishments (INE, 2025)']), n0((CAPACIDADE_CAMAS as any)?.Braga?.['2025']?.hotelaria)], [R(['Camas em alojamento local ativo', 'Beds in active short-term rentals']), n0(A.camas)], [R(['Taxa de função turística de Defert (camas por 100 habitantes)', 'Defert tourist function rate (beds per 100 inhabitants)']), n2(defert)], [R(['Alojamentos locais ativos / cessados', 'Short-term rentals active / ceased']), `${n0(A.estados?.ativos)} / ${n0((A.estados?.cessadosPermanente || 0) + (A.estados?.cessadosTemporario || 0))}`], [R(['Quota do alojamento local nas freguesias do centro histórico', 'Share of short-term rentals in historic-centre parishes']), `${n1(A.total ? (centro / A.total) * 100 : null)}%`]], R(['Fontes: INE; plataforma municipal da taxa turística.', 'Sources: INE; municipal tourist tax platform.']))}
${tabela([R(['Freguesia', 'Parish']), R(['Alojamentos', 'Units']), R(['Camas', 'Beds'])], fregs.slice(0, 6).map((x: any) => [String(x.freguesia), x.n, x.camas]), R(['Alojamento local ativo por freguesia (6 com mais registos).', 'Active short-term rentals by parish (top 6).']))}
${par([`Com ${n2(defert)} camas por 100 habitantes, Braga tem uma função turística baixa, característica de cidades com economia diversificada, em que o turismo complementa, sem dominar, a base económica. O alojamento local concentra-se no centro histórico (${n1(A.total ? (centro / A.total) * 100 : null)}% dos registos), o que justifica acompanhar a sua relação com a habitação nessas freguesias.`, `With ${n2(defert)} beds per 100 inhabitants, Braga has a low tourist function, typical of cities with a diversified economy where tourism complements rather than dominates the economic base. Short-term rentals concentrate in the historic centre (${n1(A.total ? (centro / A.total) * 100 : null)}% of registrations), which warrants monitoring their relationship with housing in those parishes.`])}
<h3 class="h3s">${R(['4.5 Preços e rendimento', '4.5 Prices and yield'])}</h3>
${par([`Entre 2021 e 2024, o preço médio por quarto ocupado subiu ${pc(adrNom)} em termos nominais e ${pc(adrReal)} em termos reais, descontada a inflação acumulada de ${pc((fator - 1) * 100)}. A subida real confirma uma valorização efetiva da oferta, e não apenas um efeito de preços. O ganho médio no alojamento e restauração na Região Norte (${n0(gan.turismo)} €) é ${n1(difSal !== null ? Math.abs(difSal) : null)}% ${cmp(difSal, ['superior', 'higher'], ['inferior', 'lower'])} ao da média da economia (${n0(gan.total)} €), o que coloca a qualidade do emprego no centro da agenda.`, `Between 2021 and 2024, the average daily rate rose ${pc(adrNom)} in nominal terms and ${pc(adrReal)} in real terms, after cumulative inflation of ${pc((fator - 1) * 100)}. The real rise confirms a genuine increase in the value of the offer, not just a price effect. Average earnings in accommodation and food services in the North (€${n0(gan.turismo)}) are ${n1(difSal !== null ? Math.abs(difSal) : null)}% ${cmp(difSal, ['higher', 'higher'], ['lower', 'lower'])} than the economy-wide average (€${n0(gan.total)}), placing job quality at the centre of the agenda.`])}
<h3 class="h3s">${R(['4.6 Perfil do visitante', '4.6 Visitor profile'])}</h3>
${tabela([R(['Dimensão', 'Dimension']), R(['Principais resultados', 'Main results'])], [
  [R(['Origem', 'Origin']), (PF.origem || []).slice().sort((x: any, y: any) => y[1] - x[1]).slice(0, 3).map((x: any) => `${x[0]} ${n1(x[1])}%`).join(' · ')],
  [R(['Motivação', 'Motivation']), (PF.motivacao || []).slice(0, 3).map((x: any) => `${x[0]} ${n1(x[1])}%`).join(' · ')],
  [R(['Alojamento', 'Accommodation']), (PF.alojamento || []).slice(0, 3).map((x: any) => `${x[0]} ${n1(x[1])}%`).join(' · ')],
  [R(['Transporte', 'Transport']), (PF.transporte || []).slice(0, 3).map((x: any) => `${x[0]} ${n1(x[1])}%`).join(' · ')],
  [R(['Idade', 'Age']), (PF.idade || []).map((x: any) => `${x[0]} ${n1(x[1])}%`).join(' · ')],
  [R(['Primeira visita / recorrentes', 'First visit / repeat']), `${n1(PF.primeiraVisita)}% / ${n1(PF.recorrentes)}%`],
], R([`Estudo de perfil do turista (n = ${PF.amostra}); amostra não probabilística.`, `Visitor profile study (n = ${PF.amostra}); non-probability sample.`]))}
${par([`O visitante é sobretudo de proximidade (Galiza e Norte de Portugal) e de lazer. ${n1((PF.alojamento || [])[0]?.[1])}% não pernoitaram, o que confirma o peso dos visitantes de um dia, que as estatísticas de alojamento não captam.`, `Visitors are mostly from nearby (Galicia and Northern Portugal) and travel for leisure. ${n1((PF.alojamento || [])[0]?.[1])}% did not stay overnight, confirming the weight of day visitors, which accommodation statistics do not capture.`])}
<h3 class="h3s">${R(['4.7 Conectividade aérea', '4.7 Air connectivity'])}</h3>
${par([`A correlação entre os passageiros desembarcados no Aeroporto do Porto e as dormidas mensais de Braga é de r = ${n2(rAero)} (${xa.length} meses). ${rAero !== null && rAero >= 0.7 ? 'Uma associação forte: o aeroporto funciona como porta de entrada e indicador antecipado da procura.' : 'Uma associação moderada: o aeroporto explica parte, mas não a totalidade, da variação da procura.'} Correlação não implica causalidade: ambas as séries partilham a mesma sazonalidade.`, `The correlation between arriving passengers at Porto Airport and Braga’s monthly overnight stays is r = ${n2(rAero)} (${xa.length} months). ${rAero !== null && rAero >= 0.7 ? 'A strong association: the airport works as a gateway and a leading indicator of demand.' : 'A moderate association: the airport explains part, but not all, of the variation in demand.'} Correlation does not imply causation: both series share the same seasonality.`])}
<h3 class="h3s">${R(['4.8 Emprego e gasto', '4.8 Employment and spending'])}</h3>
${par([`O emprego no alojamento e restauração em Braga cresceu ${pc(empVar)} entre ${sAnos[0]} e ${sAnos[sAnos.length - 1]}. O gasto com cartões estrangeiros atingiu ${n0(sibsTotal)} € (${SIBS_PERIODO}), liderado por ${sibs.slice(0, 3).map((x) => x.pais).join(', ')}, o que evidencia o peso da diáspora e do mercado espanhol no consumo local.`, `Employment in accommodation and food services in Braga grew ${pc(empVar)} between ${sAnos[0]} and ${sAnos[sAnos.length - 1]}. Foreign card spending reached €${n0(sibsTotal)} (${SIBS_PERIODO}), led by ${sibs.slice(0, 3).map((x) => x.pais).join(', ')}, highlighting the weight of the diaspora and the Spanish market in local consumption.`])}`;

  const discussao: Texto[] = [
    [`Crescimento sem pressão excessiva. A procura cresce (${pc(cagr)} ao ano desde 2019) com uma sazonalidade inferior à média nacional (Gini ${n2(gini25 as number)}, contra ${n2(giniP as number)} em Portugal) e uma função turística baixa (${n2(defert)} camas por 100 habitantes). À luz do ciclo de vida de Butler (1980), que não tem critérios quantitativos de fase, os indicadores não mostram sinais de estagnação: a procura cresce e a pressão sobre o território é baixa, embora alguns mercados estejam em queda e devam ser acompanhados.`, `Growth without excessive pressure. Demand is growing (${pc(cagr)} a year since 2019) with seasonality below the national average (Gini ${n2(gini25 as number)}, against ${n2(giniP as number)} in Portugal) and a low tourist function (${n2(defert)} beds per 100 inhabitants). In light of Butler’s (1980) life cycle, which has no quantitative stage criteria, the indicators show no signs of stagnation: demand is growing and pressure on the territory is low, although some markets are declining and should be monitored.`],
    [`Aceitação social elevada, com sinais a acompanhar. ${n1(P.positiva)}% dos residentes avaliam o turismo positivamente, o que, à luz do índice de irritação de Doxey (1975), é compatível com as fases iniciais do modelo (euforia ou apatia), antes da irritação e do antagonismo. Mas a preocupação com a sobrelotação (${n1(P.sobrelotacao)}%) e o custo de vida (${n1(P.custoVida)}%) são sinais precoces que a teoria da troca social (Ap, 1992) associa à perceção de que os custos começam a pesar face aos benefícios.`, `High social acceptance, with signals to watch. ${n1(P.positiva)}% of residents view tourism positively, which, in light of Doxey’s (1975) irritation index, is consistent with the model’s early stages (euphoria or apathy), before annoyance and antagonism. But concern about overcrowding (${n1(P.sobrelotacao)}%) and cost of living (${n1(P.custoVida)}%) are early signals that social exchange theory (Ap, 1992) associates with costs starting to weigh against benefits.`],
    [`Valor acima do volume. O preço médio real subiu ${pc(adrReal)} entre 2021 e 2024, e a receita por quarto disponível do 1.º semestre de 2026 cresceu ${pc(revCres)} em Braga, contra ${pc(revCresPT)} em Portugal. A estratégia de valor é visível, mas não se transmite ainda aos salários do setor (${n1(difSal !== null ? Math.abs(difSal) : null)}% abaixo da média regional).`, `Value over volume. The real average rate rose ${pc(adrReal)} between 2021 and 2024, and revenue per available room in H1 2026 grew ${pc(revCres)} in Braga, against ${pc(revCresPT)} in Portugal. The value strategy is visible, but has not yet reached sector wages (${n1(difSal !== null ? Math.abs(difSal) : null)}% below the regional average).`],
    [`Pegada ambiental proporcionada. Os consumos de energia, água e resíduos por habitante estão abaixo das médias nacionais, e o turismo equivale a cerca de ${n1(pMedia)}% da população média. A principal alavanca climática está nos transportes (${n1((cl.setores[0][3] / cl.total[2]) * 100)}% das emissões), onde se inclui a deslocação dos visitantes.`, `Proportionate environmental footprint. Energy, water and waste use per inhabitant are below national averages, and tourism is equivalent to about ${n1(pMedia)}% of the average population. The main climate lever is transport (${n1((cl.setores[0][3] / cl.total[2]) * 100)}% of emissions), which includes visitor travel.`],
  ];
  const recomendacoes: Texto[] = [
    ['Constituir formalmente o grupo de trabalho local INSTO, com representação dos residentes, respondendo ao défice de participação identificado no Barómetro.', 'Formally set up the INSTO local working group with resident representation, addressing the participation gap identified in the Barometer.'],
    ['Integrar as dormidas mensais declaradas na taxa turística, para medir o alojamento local com menos de 10 camas e completar a medição da sazonalidade.', 'Integrate the monthly overnight stays declared under the tourist tax, to measure short-term rentals under 10 beds and complete the seasonality measurement.'],
    ['Medir os visitantes de um dia (dados agregados de operadores móveis), dado o seu peso no perfil do visitante.', 'Measure day visitors (aggregated mobile operator data), given their weight in the visitor profile.'],
    ['Acompanhar a relação entre alojamento local e habitação nas freguesias do centro histórico, onde se concentra a oferta.', 'Monitor the relationship between short-term rentals and housing in the historic-centre parishes, where supply is concentrated.'],
    ['Reforçar a acessibilidade da oferta hoteleira, com metas de quartos adaptados.', 'Strengthen the accessibility of hotel supply, with targets for adapted rooms.'],
    ['Diversificar mercados de época baixa e acompanhar os mercados em queda identificados pelos sinais do Observatório.', 'Diversify low-season markets and track the declining markets flagged by the Observatory signals.'],
    ['Estimar a pegada carbónica das deslocações dos visitantes e integrá-la no PAESC.', 'Estimate the carbon footprint of visitor travel and integrate it into the SECAP.'],
  ];
  const matriz = tabela([R(['Área INSTO', 'INSTO area']), R(['Indicador principal', 'Main indicator']), R(['Fonte', 'Source']), R(['Periodicidade', 'Frequency'])], [
    [R(['Sazonalidade', 'Seasonality']), R(['Dormidas mensais; Gini; índice de sazonalidade', 'Monthly overnight stays; Gini; seasonality index']), 'INE', R(['Mensal', 'Monthly'])],
    [R(['Emprego', 'Employment']), R(['Pessoal ao serviço no alojamento e restauração', 'Persons employed in accommodation and food']), 'INE / PORDATA', R(['Anual', 'Annual'])],
    [R(['Benefícios económicos', 'Economic benefits']), R(['ADR, RevPAR, proveitos, taxa turística, gasto com cartões', 'ADR, RevPAR, revenue, tourist tax, card spending']), 'INE · CMB · SIBS', R(['Mensal', 'Monthly'])],
    [R(['Satisfação dos residentes', 'Local satisfaction']), R(['Perceção dos impactos', 'Perception of impacts']), R(['Barómetro', 'Barometer']), R(['Anual (prevista; 1.ª edição em 2026)', 'Annual (planned; 1st edition in 2026)'])],
    [R(['Acessibilidade', 'Accessibility']), R(['Quartos adaptados', 'Adapted rooms']), 'visitbraga.travel', R(['Anual (prevista)', 'Annual (planned)'])],
    [R(['Governança', 'Governance']), R(['Mecanismos de participação e planeamento', 'Participation and planning mechanisms']), 'CMB', R(['Anual (prevista)', 'Annual (planned)'])],
    [R(['Energia', 'Energy']), R(['Consumo por habitante e por tipo', 'Use per inhabitant and by type']), 'INE (DGEG)', R(['Anual', 'Annual'])],
    [R(['Água', 'Water']), R(['Água distribuída por habitante', 'Water supplied per inhabitant']), 'INE (INAAS)', R(['Anual', 'Annual'])],
    [R(['Águas residuais', 'Wastewater']), R(['Nível de tratamento', 'Treatment level']), 'INE (INAAS)', R(['Anual', 'Annual'])],
    [R(['Resíduos', 'Waste']), R(['Resíduos por habitante; recolha seletiva', 'Waste per inhabitant; separate collection']), 'INE · Green Destinations', R(['Anual', 'Annual'])],
    [R(['Ação climática', 'Climate action']), R(['Emissões de CO₂ por setor', 'CO₂ emissions by sector']), R(['PAESC', 'SECAP']), R(['Bienal', 'Biennial'])],
  ]);
  const glossario: Texto[] = [
    ['ADR: preço médio por quarto ocupado.', 'ADR: average daily rate per occupied room.'], ['RevPAR: receita por quarto disponível.', 'RevPAR: revenue per available room.'],
    ['Dormida: noite passada por um hóspede num estabelecimento de alojamento turístico.', 'Overnight stay: a night spent by a guest in tourist accommodation.'],
    ['Hóspede: pessoa que pernoita pelo menos uma noite num estabelecimento.', 'Guest: a person staying at least one night in an establishment.'],
    ['Estada média: dormidas a dividir por hóspedes.', 'Average stay: overnight stays divided by guests.'],
    ['Variação homóloga: comparação com o mesmo período do ano anterior.', 'Year-on-year change: comparison with the same period of the previous year.'],
    ['PAESC: Plano de Ação para a Energia Sustentável e o Clima.', 'SECAP: Sustainable Energy and Climate Action Plan.'],
  ];

  const html = `<!doctype html><html lang="${EN() ? 'en' : 'pt-PT'}"><head><meta charset="utf-8"><title>${esc(R([`Relatório Anual INSTO ${ANO} · Braga`, `INSTO Annual Report ${ANO} · Braga`]))}</title>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} body{margin:0;font-family:'Public Sans',Arial,sans-serif;color:#1C1F24;background:#fff;font-size:11.5px;line-height:1.6;width:794px}
.pag{padding:40px 50px} .quebra{page-break-before:always}
.capa{height:1150px;display:flex;flex-direction:column;justify-content:space-between;padding:60px 56px;background:#15171B;color:#fff}
.capa .marca{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8AB0E6;font-weight:700}
.capa h1{font-size:42px;line-height:1.08;margin:0 0 14px;letter-spacing:-.02em} .capa h2{font-size:17px;font-weight:600;color:#C9CDD3;margin:0}
.capa .faixa{height:6px;background:linear-gradient(90deg,#E2231A 0 22%,#8AB0E6 22% 60%,#E9C46A 60% 78%,#7CC79A 78%)}
.capa .pe{font-size:12px;color:#A3A8B1}
h2.sec{font-size:21px;margin:0 0 8px;color:#15171B;letter-spacing:-.01em;padding-bottom:6px;border-bottom:3px solid #3B5B8C} .sub{color:#5A6270;margin:0 0 16px}
h3{font-size:15px;margin:0} h3.h3s{font-size:14px;margin:18px 0 6px;color:#3B5B8C} h4{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#3B5B8C;margin:12px 0 5px}
p{margin:0 0 9px;text-align:justify}
table{width:100%;border-collapse:collapse;margin:6px 0 4px;font-size:10.6px} th{background:#3B5B8C;color:#fff;text-align:left;padding:6px 8px;font-weight:700} td{padding:5px 8px;border-bottom:1px solid #E1E6EE;vertical-align:top} td.n{text-align:right;font-variant-numeric:tabular-nums} tr:nth-child(even) td{background:#F4F7FB}
.fonte{font-size:9.5px;color:#6F747D;margin:2px 0 10px;text-align:left}
.area{padding:14px 0 10px;border-top:2px solid #E1E6EE} .area-cab{display:flex;gap:12px;align-items:center}
.area-n{width:34px;height:34px;border-radius:8px;background:#15171B;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
.estado{display:inline-block;margin-top:3px;font-size:9.5px;font-weight:700;color:#2E7D4F;background:#E6F4EC;border-radius:999px;padding:1px 8px}
ul.res,ol.res{padding-left:18px;margin:0 0 10px} ul.res li,ol.res li{margin-bottom:6px} .ficha td:first-child{font-weight:700;width:34%}
.destaque{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0} .destaque div{border:1px solid #E1E6EE;border-left:4px solid #3B5B8C;border-radius:8px;padding:10px 12px} .destaque b{display:block;font-size:20px;color:#15171B} .destaque span{font-size:10px;color:#5A6270}
.abstract{border:1px solid #E1E6EE;border-radius:8px;padding:14px 16px;margin-bottom:12px;background:#F8FAFD} .kw{font-size:10.5px;color:#3B5B8C;margin:6px 0 0}
.refs li{margin-bottom:7px;text-align:left}
</style></head><body>
<div class="capa"><div><div class="marca">${R(['Município de Braga · Observatório de Turismo de Braga', 'Braga City Council · Braga Tourism Observatory'])}</div></div>
<div><h1>${R([`Relatório Anual de Monitorização ${ANO}`, `Annual Monitoring Report ${ANO}`])}</h1><h2>${R(['Rede Internacional de Observatórios de Turismo Sustentável (INSTO) · ONU Turismo', 'International Network of Sustainable Tourism Observatories (INSTO) · UN Tourism'])}</h2></div>
<div><div class="faixa"></div><p class="pe">Braga, Portugal · ${esc(hoje)}</p></div></div>

<div class="pag quebra"><h2 class="sec">${R(['Ficha técnica', 'Technical record'])}</h2>
${tabela([R(['Campo', 'Field']), R(['Informação', 'Information'])], [[R(['Título', 'Title']), R([`Relatório Anual de Monitorização ${ANO}`, `Annual Monitoring Report ${ANO}`])], [R(['Entidade', 'Organisation']), CONTACTOS.entidade], [R(['Unidade responsável', 'Responsible unit']), R(['Divisão de Atividades Económicas e Turismo', 'Economic Activities and Tourism Division'])], [R(['Ano de referência', 'Reference year']), `${ANO} (${R(['com dados de 2026 quando disponíveis', 'with 2026 data where available'])})`], [R(['Data de emissão', 'Issue date']), hoje], [R(['Contacto', 'Contact']), CONTACTOS.emailAcessibilidade || CONTACTOS.site], [R(['Plataforma', 'Platform']), origem], [R(['Citação sugerida', 'Suggested citation']), R([`Município de Braga (${new Date().getFullYear()}). Relatório Anual de Monitorização ${ANO}. Observatório de Turismo de Braga.`, `Braga City Council (${new Date().getFullYear()}). Annual Monitoring Report ${ANO}. Braga Tourism Observatory.`])]]).replace('<table>', '<table class="ficha">')}
<h2 class="sec" style="margin-top:22px">${R(['Índice', 'Contents'])}</h2>${lista(indice)}</div>

<div class="pag quebra"><h2 class="sec">${R(['Resumo', 'Abstract'])}</h2>
<div class="abstract"><p>${esc(R([`Este relatório apresenta a monitorização anual do destino Braga nas 11 áreas obrigatórias da Rede Internacional de Observatórios de Turismo Sustentável (INSTO) da ONU Turismo, com base em dados oficiais, administrativos e de inquérito. Em ${ANO}, o destino registou ${n0(DA[String(ANO)])} dormidas (${pc(recup)} face a 2019; taxa de crescimento anual composta de ${pc(cagr)}), com sazonalidade inferior à média nacional (coeficiente de Gini de ${n2(gini25 as number)}, contra ${n2(giniP as number)} em Portugal), uma concentração de mercados abaixo do limiar de concentração elevada (IHH = ${n0(hhi)}, calculado sobre os ${nMerc} mercados publicados) e uma função turística baixa (${n2(defert)} camas por 100 habitantes). ${n1(P.positiva)}% dos residentes avaliam o turismo positivamente, mas a sobrelotação e o custo de vida emergem como preocupações. Os consumos de recursos por habitante situam-se abaixo das médias nacionais, e as emissões de CO₂ do concelho baixaram ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% desde ${cl.anoBase}. O relatório conclui que Braga cresce sem pressão excessiva e identifica a participação dos residentes, a medição do alojamento local e dos visitantes de um dia, e a qualidade do emprego como prioridades.`, `This report presents the annual monitoring of the Braga destination across the 11 mandatory issue areas of UN Tourism’s International Network of Sustainable Tourism Observatories (INSTO), based on official, administrative and survey data. In ${ANO}, the destination recorded ${n0(DA[String(ANO)])} overnight stays (${pc(recup)} vs 2019; compound annual growth of ${pc(cagr)}), with seasonality below the national average (Gini coefficient of ${n2(gini25 as number)}, against ${n2(giniP as number)} in Portugal), market concentration below the high-concentration threshold (HHI = ${n0(hhi)}, over the ${nMerc} published markets) and a low tourist function (${n2(defert)} beds per 100 inhabitants). ${n1(P.positiva)}% of residents view tourism positively, but overcrowding and cost of living emerge as concerns. Resource use per inhabitant is below national averages, and municipal CO₂ emissions have fallen ${n1((1 - cl.total[2] / cl.total[0]) * 100)}% since ${cl.anoBase}. The report concludes that Braga is growing without excessive pressure and identifies resident participation, measurement of short-term rentals and day visitors, and job quality as priorities.`]))}</p>
<p class="kw"><b>${R(['Palavras-chave', 'Keywords'])}:</b> ${R(['turismo sustentável; INSTO; indicadores; sazonalidade; perceção dos residentes; Braga', 'sustainable tourism; INSTO; indicators; seasonality; residents’ perception; Braga'])}</p></div>
<div class="destaque"><div><b>11/11</b><span>${R(['áreas INSTO monitorizadas', 'INSTO areas monitored'])}</span></div><div><b>${n0(DA[String(ANO)])}</b><span>${R([`dormidas em ${ANO}`, `overnight stays in ${ANO}`])}</span></div><div><b>${n2(gini25 as number)}</b><span>${R(['Gini da sazonalidade', 'seasonality Gini'])}</span></div><div><b>${n1(P.positiva)}%</b><span>${R(['residentes com perceção positiva', 'residents with a positive view'])}</span></div></div>
<h4>${R(['Principais resultados', 'Key findings'])}</h4><ul class="res">${resumo.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>

<div class="pag quebra"><h2 class="sec">${R(['1. Introdução', '1. Introduction'])}</h2>
${par(['A Rede Internacional de Observatórios de Turismo Sustentável (INSTO) da ONU Turismo reúne destinos que se comprometem a monitorizar regularmente os impactos económicos, ambientais e sociais do turismo, com base em evidência, e a partilhar os resultados com os parceiros locais e com a rede.', 'UN Tourism’s International Network of Sustainable Tourism Observatories (INSTO) brings together destinations committed to regularly monitoring the economic, environmental and social impacts of tourism, based on evidence, and sharing results with local partners and the network.'])}
${par(['Este relatório tem três objetivos: (i) reportar o estado do destino nas 11 áreas obrigatórias da rede; (ii) caracterizar a procura, a oferta e os impactos do turismo em Braga com indicadores comparáveis; e (iii) identificar lacunas de informação e prioridades de gestão.', 'This report has three objectives: (i) to report the state of the destination across the network’s 11 mandatory areas; (ii) to profile demand, supply and tourism impacts in Braga with comparable indicators; and (iii) to identify data gaps and management priorities.'])}
<h4>${R(['Questões orientadoras', 'Guiding questions'])}</h4>${lista([['Como evoluiu a procura turística e qual o grau de recuperação face a 2019?', 'How has tourism demand evolved and how far has it recovered since 2019?'], ['Qual a intensidade e a sazonalidade do turismo, e que pressão exerce sobre o território e os recursos?', 'What are the intensity and seasonality of tourism, and what pressure does it place on the territory and resources?'], ['Como percecionam os residentes o turismo e onde estão os pontos de tensão?', 'How do residents perceive tourism and where are the points of tension?'], ['Que informação falta para uma monitorização completa?', 'What information is missing for complete monitoring?']])}

<h2 class="sec" style="margin-top:22px">${R(['2. Enquadramento teórico e normativo', '2. Theoretical and policy framework'])}</h2>
${par(['O turismo sustentável é definido como o turismo que tem plenamente em conta os seus impactos económicos, sociais e ambientais, atuais e futuros, respondendo às necessidades dos visitantes, da indústria, do ambiente e das comunidades de acolhimento (UNWTO & UNEP, 2005). A sua gestão exige sistemas de indicadores que tornem esses impactos mensuráveis: o guia da ONU Turismo (UNWTO, 2004), o Sistema Europeu de Indicadores de Turismo (European Commission, 2016) e os critérios para destinos do Global Sustainable Tourism Council (GSTC, 2019), que servem de referência às certificações como a Green Destinations.', 'Sustainable tourism is defined as tourism that takes full account of its current and future economic, social and environmental impacts, addressing the needs of visitors, the industry, the environment and host communities (UNWTO & UNEP, 2005). Managing it requires indicator systems that make those impacts measurable: the UN Tourism guidebook (UNWTO, 2004), the European Tourism Indicator System (European Commission, 2016) and the Global Sustainable Tourism Council Destination Criteria (GSTC, 2019), which underpin certifications such as Green Destinations.'])}
${par(['Três quadros teóricos orientam a leitura dos resultados. O modelo do ciclo de vida dos destinos (Butler, 1980) descreve a evolução de um destino da exploração à consolidação e, sem gestão, à estagnação. O índice de irritação de Doxey (1975) e a teoria da troca social (Ap, 1992) explicam como a atitude dos residentes evolui da euforia à irritação quando os custos percebidos superam os benefícios. A sazonalidade, medida pelo coeficiente de Gini (Lundtorp, 2001), condiciona a sustentabilidade do emprego e a pressão sobre os recursos.', 'Three theoretical frameworks guide the reading of the results. The destination life cycle model (Butler, 1980) describes a destination’s evolution from exploration to consolidation and, without management, stagnation. Doxey’s (1975) irritation index and social exchange theory (Ap, 1992) explain how residents’ attitudes move from euphoria to irritation when perceived costs outweigh benefits. Seasonality, measured by the Gini coefficient (Lundtorp, 2001), shapes job sustainability and pressure on resources.'])}</div>

<div class="pag quebra"><h2 class="sec">${R(['3. Metodologia', '3. Methodology'])}</h2>
${par(['O relatório segue uma abordagem quantitativa e descritiva, combinando fontes estatísticas oficiais, dados administrativos do Município e inquéritos próprios. Privilegiam-se séries comparáveis (2019 como ano pré-pandemia de referência) e comparações territoriais com o Cávado, a Região Norte e Portugal. As áreas ambientais são medidas à escala do concelho, como a rede admite, com uma estimativa do peso do turismo.', 'The report follows a quantitative, descriptive approach, combining official statistics, municipal administrative data and own surveys. Comparable series are preferred (2019 as the pre-pandemic reference year), alongside territorial comparisons with Cávado, the North region and Portugal. Environmental areas are measured at municipal level, as the network allows, with an estimate of tourism’s share.'])}
<h4>${R(['Fontes de dados', 'Data sources'])}</h4>${fontesMetodo}
<h4>${R(['Métodos e indicadores calculados', 'Methods and calculated indicators'])}</h4>${lista(metodos)}</div>

<div class="pag quebra"><h2 class="sec">${R(['4. Caracterização do destino', '4. Destination profile'])}</h2>${caract}</div>

<div class="pag quebra"><h2 class="sec">${R(['4.9 O destino em números: séries de referência', '4.9 The destination in figures: reference series'])}</h2>
${tabela([R(['Ano', 'Year']), R(['Dormidas', 'Overnight stays']), R(['Hóspedes', 'Guests']), R(['Estada média (noites)', 'Average stay (nights)']), R(['ADR (€)', 'ADR (€)'])], anosSerie.map((a) => [a, DA[a] ?? '—', HA[a] ?? '—', n2(EM[a]), n2(ADR[a])]), R(['Fonte: INE/TravelBI. 2020–2021 refletem a pandemia.', 'Source: INE/TravelBI. 2020–2021 reflect the pandemic.']))}
${tabela([R(['Oferta', 'Supply']), R(['Valor', 'Value'])], [[R(['Estabelecimentos hoteleiros', 'Hotel establishments']), n0(hot.length)], [R(['Quartos de hotel', 'Hotel rooms']), n0(uni)], [R(['Alojamentos locais ativos (base municipal)', 'Active short-term rentals (municipal register)']), n0(A.total)], [R(['Negócios turísticos com certificação ambiental', 'Tourism businesses with environmental certification']), n0((SS?.certificados || []).length)]], R(['Fontes: INE; visitbraga.travel; plataforma municipal da taxa turística; listas Green Key e Biosphere.', 'Sources: INE; visitbraga.travel; municipal tourist tax platform; Green Key and Biosphere lists.']))}</div>

<div class="pag quebra"><h2 class="sec">${R(['5. As 11 áreas de monitorização INSTO', '5. The 11 INSTO monitoring areas'])}</h2><p class="sub">${R(['Para cada área: indicadores, leitura, limitações e próximos passos.', 'For each area: indicators, interpretation, limitations and next steps.'])}</p>${areas}</div>

<div class="pag quebra"><h2 class="sec">${R(['6. Peso do turismo no consumo de recursos', '6. Tourism’s share of resource use'])}</h2>
${par([`As ${n0(DA[String(ANO)])} dormidas de ${ANO} equivalem, em média, a ${n0(DA[String(ANO)] / 365)} pessoas por dia, face a uma população residente de ${n0(pop)} habitantes (INE, Censos 2021, resultados provisórios). Isto corresponde a ${n1(pMedia)}% da população em média e a ${n1(pAgo)}% em agosto, o mês com mais dormidas. Se os turistas consumirem como os residentes, o seu peso no consumo de água, energia doméstica e resíduos é da mesma ordem de grandeza. A estimativa exclui os visitantes de um dia e diferenças de consumo entre turistas e residentes.`, `The ${n0(DA[String(ANO)])} overnight stays in ${ANO} are on average equivalent to ${n0(DA[String(ANO)] / 365)} people a day, against a resident population of ${n0(pop)} (INE, 2021 Census, provisional results). This is ${n1(pMedia)}% of the population on average and ${n1(pAgo)}% in August, the busiest month. If tourists consume like residents, their share of water, domestic energy and waste is of the same order of magnitude. The estimate excludes day visitors and consumption differences between tourists and residents.`])}

<h2 class="sec" style="margin-top:22px">${R(['7. Discussão', '7. Discussion'])}</h2>${discussao.map((x) => par(x)).join('')}</div>

<div class="pag quebra"><h2 class="sec">${R(['8. Conclusões e recomendações', '8. Conclusions and recommendations'])}</h2>
${par(['Braga reúne as condições para uma monitorização completa nas 11 áreas da rede INSTO. Os resultados mostram um destino em crescimento sustentado, com pressão moderada sobre o território e os recursos, elevada aceitação social e sinais precoces de tensão que justificam acompanhamento. As recomendações seguintes decorrem diretamente da evidência apresentada:', 'Braga meets the conditions for complete monitoring across the 11 INSTO areas. The results show a destination with sustained growth, moderate pressure on territory and resources, high social acceptance and early signs of tension that warrant monitoring. The following recommendations stem directly from the evidence presented:'])}
<ol class="res">${recomendacoes.map((x) => `<li>${esc(R(x))}</li>`).join('')}</ol>
<h2 class="sec" style="margin-top:22px">${R(['9. Limitações e plano de melhoria da informação', '9. Limitations and data improvement plan'])}</h2>
${par(['Os dados do INE não incluem o alojamento local com menos de 10 camas nem os visitantes de um dia; o Barómetro e o inquérito ao visitante usam amostras não probabilísticas; as áreas ambientais não isolam o consumo do setor turístico; e as correlações apresentadas não estabelecem relações causais. O plano de melhoria prevê:', 'INE data exclude short-term rentals with fewer than 10 beds and day visitors; the Barometer and visitor survey use non-probability samples; environmental areas do not isolate the tourism sector’s consumption; and the correlations shown do not establish causal relationships. The improvement plan includes:'])}
${lista(lacunas)}</div>

<div class="pag quebra"><h2 class="sec">${R(['Referências bibliográficas', 'References'])}</h2><ul class="res refs">${refs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
<h2 class="sec" style="margin-top:22px">${R(['Anexo A. Matriz de indicadores INSTO', 'Annex A. INSTO indicator matrix'])}</h2>${matriz}
<h2 class="sec" style="margin-top:22px">${R(['Anexo B. Glossário', 'Annex B. Glossary'])}</h2>${lista(glossario)}
<h2 class="sec" style="margin-top:22px">${R(['Fontes de dados', 'Data sources'])}</h2>
<ul class="res">${fontes.map(([n, u]) => `<li>${esc(n)}${u ? ` · ${esc(u)}` : ''}</li>`).join('')}</ul>
<p class="fonte" style="margin-top:20px">${R(['Documento gerado automaticamente pelo Observatório de Turismo de Braga a partir dos dados publicados na plataforma.', 'Document generated automatically by the Braga Tourism Observatory from the data published on the platform.'])}</p></div>
</body></html>`;
  const w = abrirJanelaDocumento(820, 1100);
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
  // b25 é usado para manter a mesma base nos próximos relatórios (atendimentos 2025)
  void b25;
}
