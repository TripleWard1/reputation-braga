// Calendário de oportunidades por mercado: feriados e férias escolares dos mercados emissores,
// outubro de 2026 a dezembro de 2027. Só datas confirmadas em fontes oficiais ou em duas fontes coincidentes.
// Os fins de semana prolongados e as pontes são calculados pela plataforma a partir do dia da semana de cada feriado.

export type Mercado = 'galiza' | 'espanha' | 'madrid' | 'catalunha' | 'paisbasco' | 'valencia' | 'andaluzia' | 'asturias' | 'baleares' | 'canarias' | 'portugal' | 'franca' | 'reinounido';
export type Grupo = 'proximo' | 'regioes' | 'outros';
export interface Texto3 { pt: string; en: string; es: string }
// regional = feriado próprio da região (ou trasladado por ela), que não é comum a toda a Espanha.
export interface Data { mercado: Mercado; tipo: 'feriado' | 'escolar'; nome: Texto3; ini: string; fim?: string; fonte: string; regional?: boolean }
export interface Voo { aeroportos: string; companhias: string; sazonal?: boolean; nota?: Texto3 }

const t3 = (pt: string, en: string, es: string): Texto3 => ({ pt, en, es });

export const FONTES: Record<string, { nome: string; url: string }> = {
  xunta2026: { nome: 'Xunta de Galicia · calendário laboral 2026', url: 'https://www.xunta.gal/es/notas-de-prensa/-/nova/014100/xunta-publica-calendario-laboral-para-2026-fija-como-festivos-propios-19-marzo' },
  xunta2027: { nome: 'Xunta de Galicia · calendário laboral 2027', url: 'https://www.xunta.gal/es/notas-de-prensa/-/nova/026293/xunta-galicia-aprueba-calendario-laboral-para-2027-con-19-marzo-17-mayo-como' },
  xuntaEscolar: { nome: 'Xunta de Galicia · Orde do calendário escolar 2026/27', url: 'https://www.edu.xunta.gal/centros/cpicovaterrena/system/files/OrdeCalendario2627.pdf' },
  espanha2027: { nome: 'BORM · calendário de festas laborais 2027 (lista nacional)', url: 'https://www.borm.es/services/anuncio/844400/pdf' },
  portugalEscolar: { nome: 'Despacho n.º 10430/2026 · calendário escolar 2026/27', url: 'https://postal.pt/nacional/calendario-escolar-2026-2027-ja-oficial-conheca-datas-inicio-aulas-em-dias-calham-ferias/' },
  portugalFeriados: { nome: 'Código do Trabalho, art. 234.º · feriados obrigatórios', url: 'https://executivedigest.sapo.pt/?p=809012' },
  franca: { nome: 'Calendário escolar francês 2026-2027 (Ministério da Educação Nacional)', url: 'https://www.letudiant.fr/lifestyle/vacances-scolaires-2026-2027-et-jours-feries-le-calendrier-devoile-avec-toutes-les-dates.html' },
  reinounido: { nome: 'Bank holidays de Inglaterra e País de Gales', url: 'https://www.centralbedfordshire.gov.uk/bank-holiday' },
  espanha2026: { nome: 'BOE · Resolução de 17/10/2025, festas laborais de 2026 (traslados de 2/11 e 7/12 por comunidade)', url: 'https://www.laboral-social.com/sites/laboral-social.com/files/Fiestas-boe-2026.pdf' },
  espanha2026b: { nome: 'El Derecho · calendário laboral 2026 por comunidade', url: 'https://elderecho.com/el-calendario-laboral-para-2026-fija-nueve-festivos-comunes-en-toda-espana' },
  madrid2026: { nome: 'BOCM · Decreto 75/2025 (festas laborais de 2026, Comunidade de Madrid)', url: 'https://www.laboral-social.com/sites/laboral-social.com/files/FIESTAS-COMUNIDAD-MADRID-2026.pdf' },
  madrid2027: { nome: 'Calendário laboral 2027 da Comunidade de Madrid (aprovado em Conselho de Governo)', url: 'https://www.timeout.es/madrid/es/noticias/asi-sera-el-calendario-laboral-de-madrid-en-2027-14-dias-festivos-el-puente-de-san-jose-y-todas-las-fechas-clave-100126' },
  catalunha2027: { nome: 'Generalitat de Catalunya · calendário de festas laborais 2027', url: 'https://govern.cat/salapremsa/notes-premsa/808352/govern-publica-calendari-festes-laborals-al-2027' },
  barcelona2027: { nome: 'Ajuntament de Barcelona · festas locais 2027 (Gaseta Municipal)', url: 'https://beteve.cat/economia/calendari-laboral-2027-catalunya-barcelona-festius-ponts/' },
  paisbasco2027: { nome: 'BOPV n.º 134 · Decreto 90/2026 (festas laborais 2027, País Basco)', url: 'https://www.euskadi.eus/bopv2/datos/2026/07/2603215a.shtml' },
  valencia2027: { nome: 'Generalitat Valenciana · calendário laboral 2027', url: 'https://www.elespanol.com/valencia/20260321/oficial-calendario-laboral-valenciano-puentes-dias-festivos-inhabiles-trt/1003744177913_0.amp.html' },
  andaluzia2027: { nome: 'BOJA · Decreto 84/2026 (festas laborais 2027, Andaluzia)', url: 'https://www.juntadeandalucia.es/eboja/2026/84/BOJA26-084-00002-5812-01_00337048.pdf' },
  asturias2027: { nome: 'BOPA · Decreto 7/2026 (Dia das Astúrias 2027)', url: 'https://www.laboral-social.com/sites/laboral-social.com/files/Calendario-laboral-asturias-2027.pdf' },
  baleares2027: { nome: 'Govern de les Illes Balears · calendário laboral 2027 (BOIB n.º 33, 14/03/2026)', url: 'https://www.menorca.info/balears/noticias/2026/03/13/2588403/confirmado-por-govern-estos-son-todos-dias-festivos-2027-baleares.html' },
  canarias2027: { nome: 'Gobierno de Canarias · calendário laboral 2027 e festas insulares', url: 'https://www3.gobiernodecanarias.org/noticias/el-gobierno-aprueba-el-calendario-laboral-de-canarias-para-2027-y-abre-el-plazo-para-fijar-las-fiestas-locales/' },
  voos: { nome: 'Aeroporto do Porto · rotas e companhias (Wikipedia, cruzado com eSky)', url: 'https://en.wikipedia.org/wiki/Porto_Airport' },
};

export const MERCADOS: Record<Mercado, { nome: Texto3; bandeira: string; grupo: Grupo; voo?: Voo }> = {
  galiza: { nome: t3('Galiza', 'Galicia', 'Galicia'), bandeira: 'es-ga', grupo: 'proximo' },
  espanha: { nome: t3('Espanha (feriados nacionais)', 'Spain (national holidays)', 'España (festivos nacionales)'), bandeira: 'es', grupo: 'proximo' },
  madrid: { nome: t3('Madrid', 'Madrid', 'Madrid'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'MAD', companhias: 'Iberia, Air Europa, Ryanair' } },
  catalunha: { nome: t3('Catalunha', 'Catalonia', 'Cataluña'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'BCN', companhias: 'Vueling, Ryanair' } },
  paisbasco: { nome: t3('País Basco', 'Basque Country', 'País Vasco'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'BIO', companhias: 'Vueling, Volotea' } },
  valencia: { nome: t3('Comunidade Valenciana', 'Valencian Community', 'Comunitat Valenciana'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'VLC · ALC', companhias: 'Ryanair', nota: t3('Castellón (CDT) só na época de verão', 'Castellón (CDT) summer season only', 'Castellón (CDT) solo en temporada de verano') } },
  andaluzia: { nome: t3('Andaluzia', 'Andalusia', 'Andalucía'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'SVQ · AGP · GRX', companhias: 'Ryanair, Volotea', nota: t3('Granada (Volotea) a partir de 3 de novembro de 2026', 'Granada (Volotea) from 3 November 2026', 'Granada (Volotea) desde el 3 de noviembre de 2026') } },
  asturias: { nome: t3('Astúrias', 'Asturias', 'Asturias'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'OVD', companhias: 'Volotea' } },
  baleares: { nome: t3('Baleares', 'Balearic Islands', 'Illes Balears'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'PMI · IBZ · MAH', companhias: 'Ryanair, easyJet, Vueling', sazonal: true } },
  canarias: { nome: t3('Canárias', 'Canary Islands', 'Canarias'), bandeira: 'es', grupo: 'regioes', voo: { aeroportos: 'LPA · TFS', companhias: 'Ryanair', sazonal: true } },
  portugal: { nome: t3('Portugal (mercado interno)', 'Portugal (domestic)', 'Portugal (mercado interno)'), bandeira: 'pt', grupo: 'outros' },
  franca: { nome: t3('França', 'France', 'Francia'), bandeira: 'fr', grupo: 'outros' },
  reinounido: { nome: t3('Reino Unido', 'United Kingdom', 'Reino Unido'), bandeira: 'gb', grupo: 'outros' },
};

export const DATAS: Data[] = [
  // ── Galiza ──
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Festa Nacional de Espanha', 'Spain’s National Day', 'Fiesta Nacional de España'), ini: '2026-10-12', fonte: 'xunta2026' },
  { mercado: 'galiza', tipo: 'escolar', nome: t3('Ponte da Imaculada (Dia do Ensino e feriado)', 'Immaculate Conception long weekend (Teaching Day and holiday)', 'Puente de la Inmaculada (Día de la Enseñanza y festivo)'), ini: '2026-12-05', fim: '2026-12-08', fonte: 'xuntaEscolar' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Natal', 'Christmas', 'Navidad'), ini: '2026-12-25', fonte: 'xunta2026' },
  { mercado: 'galiza', tipo: 'escolar', nome: t3('Férias escolares de Natal', 'Christmas school holidays', 'Vacaciones escolares de Navidad'), ini: '2026-12-22', fim: '2027-01-07', fonte: 'xuntaEscolar' },
  { mercado: 'galiza', tipo: 'escolar', nome: t3('Entroido (Carnaval)', 'Entroido (Carnival)', 'Entroido (Carnaval)'), ini: '2027-02-06', fim: '2027-02-10', fonte: 'xuntaEscolar' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('São José', 'Saint Joseph’s Day', 'San José'), ini: '2027-03-19', fonte: 'xunta2027' },
  { mercado: 'galiza', tipo: 'escolar', nome: t3('Férias escolares da Páscoa', 'Easter school holidays', 'Vacaciones escolares de Semana Santa'), ini: '2027-03-20', fim: '2027-03-29', fonte: 'xuntaEscolar' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Dia das Letras Galegas', 'Galician Literature Day', 'Día de las Letras Gallegas'), ini: '2027-05-17', fonte: 'xunta2027' },
  { mercado: 'galiza', tipo: 'escolar', nome: t3('Início das férias escolares de verão', 'Start of the summer school holidays', 'Inicio de las vacaciones escolares de verano'), ini: '2027-06-22', fonte: 'xuntaEscolar' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Festa Nacional de Espanha', 'Spain’s National Day', 'Fiesta Nacional de España'), ini: '2027-10-12', fonte: 'xunta2027' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Todos os Santos', 'All Saints’ Day', 'Todos los Santos'), ini: '2027-11-01', fonte: 'xunta2027' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Dia da Constituição', 'Constitution Day', 'Día de la Constitución'), ini: '2027-12-06', fonte: 'xunta2027' },
  { mercado: 'galiza', tipo: 'feriado', nome: t3('Imaculada Conceição', 'Immaculate Conception', 'Inmaculada Concepción'), ini: '2027-12-08', fonte: 'xunta2027' },
  // ── Espanha (feriados nacionais, comuns a todo o país) ──
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Festa Nacional de Espanha', 'Spain’s National Day', 'Fiesta Nacional de España'), ini: '2026-10-12', fonte: 'xunta2026' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Imaculada Conceição', 'Immaculate Conception', 'Inmaculada Concepción'), ini: '2026-12-08', fonte: 'xunta2026' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Natal', 'Christmas', 'Navidad'), ini: '2026-12-25', fonte: 'xunta2026' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Ano Novo', 'New Year’s Day', 'Año Nuevo'), ini: '2027-01-01', fonte: 'espanha2027' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Sexta-feira Santa', 'Good Friday', 'Viernes Santo'), ini: '2027-03-26', fonte: 'espanha2027' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Festa Nacional de Espanha', 'Spain’s National Day', 'Fiesta Nacional de España'), ini: '2027-10-12', fonte: 'espanha2027' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Todos os Santos', 'All Saints’ Day', 'Todos los Santos'), ini: '2027-11-01', fonte: 'espanha2027' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Dia da Constituição', 'Constitution Day', 'Día de la Constitución'), ini: '2027-12-06', fonte: 'espanha2027' },
  { mercado: 'espanha', tipo: 'feriado', nome: t3('Imaculada Conceição', 'Immaculate Conception', 'Inmaculada Concepción'), ini: '2027-12-08', fonte: 'espanha2027' },
  // ── Portugal (mercado interno) ──
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Restauração da Independência', 'Restoration of Independence', 'Restauración de la Independencia'), ini: '2026-12-01', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Imaculada Conceição', 'Immaculate Conception', 'Inmaculada Concepción'), ini: '2026-12-08', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'escolar', nome: t3('Interrupção letiva do Natal', 'Christmas school break', 'Vacaciones escolares de Navidad'), ini: '2026-12-16', fim: '2027-01-03', fonte: 'portugalEscolar' },
  { mercado: 'portugal', tipo: 'escolar', nome: t3('Interrupção letiva do Carnaval', 'Carnival school break', 'Vacaciones escolares de Carnaval'), ini: '2027-02-06', fim: '2027-02-10', fonte: 'portugalEscolar' },
  { mercado: 'portugal', tipo: 'escolar', nome: t3('Interrupção letiva da Páscoa', 'Easter school break', 'Vacaciones escolares de Semana Santa'), ini: '2027-03-20', fim: '2027-04-04', fonte: 'portugalEscolar' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Corpo de Deus', 'Corpus Christi', 'Corpus Christi'), ini: '2027-05-27', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Dia de Portugal', 'Portugal Day', 'Día de Portugal'), ini: '2027-06-10', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Implantação da República', 'Republic Day', 'Implantación de la República'), ini: '2027-10-05', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Todos os Santos', 'All Saints’ Day', 'Todos los Santos'), ini: '2027-11-01', fonte: 'portugalFeriados' },
  { mercado: 'portugal', tipo: 'feriado', nome: t3('Restauração da Independência', 'Restoration of Independence', 'Restauración de la Independencia'), ini: '2027-12-01', fonte: 'portugalFeriados' },
  // ── França (férias escolares; zona A: Lyon, Bordeaux; zona B: Lille, Nantes, Marselha; zona C: Paris, Toulouse) ──
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias do Dia de Todos os Santos', 'All Saints’ school holidays', 'Vacaciones de Todos los Santos'), ini: '2026-10-17', fim: '2026-11-02', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias de Natal', 'Christmas holidays', 'Vacaciones de Navidad'), ini: '2026-12-19', fim: '2027-01-04', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias de inverno · zona C (Paris, Toulouse)', 'Winter holidays · zone C (Paris, Toulouse)', 'Vacaciones de invierno · zona C (París, Toulouse)'), ini: '2027-02-06', fim: '2027-02-22', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias de inverno · zona A (Lyon, Bordeaux)', 'Winter holidays · zone A (Lyon, Bordeaux)', 'Vacaciones de invierno · zona A (Lyon, Burdeos)'), ini: '2027-02-13', fim: '2027-03-01', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias de inverno · zona B (Lille, Nantes, Marselha)', 'Winter holidays · zone B (Lille, Nantes, Marseille)', 'Vacaciones de invierno · zona B (Lille, Nantes, Marsella)'), ini: '2027-02-20', fim: '2027-03-08', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias da primavera · zona C (Paris, Toulouse)', 'Spring holidays · zone C (Paris, Toulouse)', 'Vacaciones de primavera · zona C (París, Toulouse)'), ini: '2027-04-03', fim: '2027-04-19', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias da primavera · zona A (Lyon, Bordeaux)', 'Spring holidays · zone A (Lyon, Bordeaux)', 'Vacaciones de primavera · zona A (Lyon, Burdeos)'), ini: '2027-04-10', fim: '2027-04-26', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Férias da primavera · zona B (Lille, Nantes, Marselha)', 'Spring holidays · zone B (Lille, Nantes, Marseille)', 'Vacaciones de primavera · zona B (Lille, Nantes, Marsella)'), ini: '2027-04-17', fim: '2027-05-03', fonte: 'franca' },
  { mercado: 'franca', tipo: 'escolar', nome: t3('Ponte da Ascensão', 'Ascension long weekend', 'Puente de la Ascensión'), ini: '2027-05-05', fim: '2027-05-09', fonte: 'franca' },
  // ── Reino Unido (Inglaterra e País de Gales) ──
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Natal e Boxing Day', 'Christmas and Boxing Day', 'Navidad y Boxing Day'), ini: '2026-12-25', fim: '2026-12-28', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Ano Novo', 'New Year’s Day', 'Año Nuevo'), ini: '2027-01-01', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Páscoa (Sexta-feira Santa a Segunda-feira de Páscoa)', 'Easter (Good Friday to Easter Monday)', 'Pascua (Viernes Santo a Lunes de Pascua)'), ini: '2027-03-26', fim: '2027-03-29', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Early May bank holiday', 'Early May bank holiday', 'Early May bank holiday'), ini: '2027-05-03', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Spring bank holiday', 'Spring bank holiday', 'Spring bank holiday'), ini: '2027-05-31', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Summer bank holiday', 'Summer bank holiday', 'Summer bank holiday'), ini: '2027-08-30', fonte: 'reinounido' },
  { mercado: 'reinounido', tipo: 'feriado', nome: t3('Natal e Boxing Day', 'Christmas and Boxing Day', 'Navidad y Boxing Day'), ini: '2027-12-25', fim: '2027-12-28', fonte: 'reinounido' },
];

// ── Regiões espanholas com voo direto para o Porto ──
// Cada região leva a lista completa (feriados nacionais + autonómicos), para que o filtro por região mostre o calendário real.
// Sábados e domingos sem traslado ficam de fora (não criam janela). Festas locais só quando publicadas oficialmente (Barcelona).
const N = {
  hisp: t3('Festa Nacional de Espanha', 'Spain’s National Day', 'Fiesta Nacional de España'),
  todos2: t3('Traslado de Todos os Santos', 'All Saints’ Day (moved)', 'Traslado de Todos los Santos'),
  todos: t3('Todos os Santos', 'All Saints’ Day', 'Todos los Santos'),
  const7: t3('Traslado do Dia da Constituição', 'Constitution Day (moved)', 'Traslado del Día de la Constitución'),
  const: t3('Dia da Constituição', 'Constitution Day', 'Día de la Constitución'),
  imac: t3('Imaculada Conceição', 'Immaculate Conception', 'Inmaculada Concepción'),
  natal: t3('Natal', 'Christmas', 'Navidad'),
  ano: t3('Ano Novo', 'New Year’s Day', 'Año Nuevo'),
  reis: t3('Dia de Reis', 'Epiphany', 'Día de Reyes'),
  sjose: t3('São José', 'Saint Joseph’s Day', 'San José'),
  quinta: t3('Quinta-feira Santa', 'Maundy Thursday', 'Jueves Santo'),
  sexta: t3('Sexta-feira Santa', 'Good Friday', 'Viernes Santo'),
  segPascoa: t3('Segunda-feira de Páscoa', 'Easter Monday', 'Lunes de Pascua'),
  assuncao: t3('Traslado da Assunção', 'Assumption Day (moved)', 'Traslado de la Asunción'),
};
type Linha = [string, Texto3, string, boolean?];
function regiao(m: Mercado, linhas: Linha[]): Data[] {
  const r: Data[] = [];
  for (let i = 0; i < linhas.length; i++) r.push({ mercado: m, tipo: 'feriado', ini: linhas[i][0], nome: linhas[i][1], fonte: linhas[i][2], regional: !!linhas[i][3] });
  return r;
}
const NAC_2026: Linha[] = [['2026-10-12', N.hisp, 'espanha2026'], ['2026-12-08', N.imac, 'espanha2026'], ['2026-12-25', N.natal, 'espanha2026']];
function nac2027(f: string): Linha[] {
  return [['2027-01-01', N.ano, f], ['2027-03-26', N.sexta, f], ['2027-10-12', N.hisp, f], ['2027-11-01', N.todos, f], ['2027-12-06', N.const, f], ['2027-12-08', N.imac, f]];
}

const REGIOES: Data[] = ([] as Data[]).concat(
  regiao('madrid', ([] as Linha[]).concat(NAC_2026, nac2027('madrid2027'), [
    ['2026-11-02', N.todos2, 'madrid2026', true], ['2026-12-07', N.const7, 'madrid2026', true],
    ['2027-01-06', N.reis, 'madrid2027'], ['2027-03-19', N.sjose, 'madrid2027', true], ['2027-03-25', N.quinta, 'madrid2027', true],
    ['2027-08-16', N.assuncao, 'madrid2027', true],
  ])),
  regiao('catalunha', ([] as Linha[]).concat(NAC_2026, nac2027('catalunha2027'), [
    ['2027-01-06', N.reis, 'catalunha2027'], ['2027-03-29', N.segPascoa, 'catalunha2027', true],
    ['2027-05-17', t3('Segunda-feira de Pentecostes (feriado local de Barcelona)', 'Whit Monday (Barcelona local holiday)', 'Segunda Pascua (festivo local de Barcelona)'), 'barcelona2027', true],
    ['2027-06-24', t3('São João', 'Saint John’s Day', 'San Juan'), 'catalunha2027', true],
    ['2027-09-24', t3('La Mercè (feriado local de Barcelona)', 'La Mercè (Barcelona local holiday)', 'La Mercè (festivo local de Barcelona)'), 'barcelona2027', true],
  ])),
  regiao('paisbasco', ([] as Linha[]).concat(NAC_2026, nac2027('paisbasco2027'), [
    ['2027-01-06', N.reis, 'paisbasco2027'], ['2027-03-25', N.quinta, 'paisbasco2027', true], ['2027-03-29', N.segPascoa, 'paisbasco2027', true],
    ['2027-10-07', t3('Aniversário do primeiro Governo Basco', 'Anniversary of the first Basque Government', 'Aniversario del primer Gobierno Vasco'), 'paisbasco2027', true],
  ])),
  regiao('valencia', ([] as Linha[]).concat(NAC_2026, nac2027('valencia2027'), [
    ['2026-10-09', t3('Dia da Comunidade Valenciana', 'Valencian Community Day', 'Día de la Comunitat Valenciana'), 'espanha2026', true],
    ['2027-01-06', N.reis, 'valencia2027'], ['2027-03-19', N.sjose, 'valencia2027', true], ['2027-03-29', N.segPascoa, 'valencia2027', true],
    ['2027-10-09', t3('Dia da Comunidade Valenciana', 'Valencian Community Day', 'Día de la Comunitat Valenciana'), 'valencia2027', true],
  ])),
  regiao('andaluzia', ([] as Linha[]).concat(NAC_2026, nac2027('andaluzia2027'), [
    ['2026-11-02', N.todos2, 'espanha2026b', true], ['2026-12-07', N.const7, 'espanha2026b', true],
    ['2027-01-06', N.reis, 'andaluzia2027'], ['2027-03-01', t3('Dia da Andaluzia (traslado)', 'Andalusia Day (moved)', 'Día de Andalucía (traslado)'), 'andaluzia2027', true],
    ['2027-03-25', N.quinta, 'andaluzia2027', true], ['2027-08-16', N.assuncao, 'andaluzia2027', true],
  ])),
  regiao('asturias', ([] as Linha[]).concat(NAC_2026, nac2027('espanha2027'), [
    ['2026-11-02', N.todos2, 'espanha2026b', true], ['2026-12-07', N.const7, 'espanha2026b', true],
    ['2027-09-08', t3('Dia das Astúrias', 'Asturias Day', 'Día de Asturias'), 'asturias2027', true],
  ])),
  regiao('baleares', ([] as Linha[]).concat(NAC_2026, nac2027('baleares2027'), [
    ['2027-01-06', N.reis, 'baleares2027'], ['2027-03-01', t3('Dia das Ilhas Baleares', 'Balearic Islands Day', 'Día de las Illes Balears'), 'baleares2027', true],
    ['2027-03-25', N.quinta, 'baleares2027', true], ['2027-03-29', N.segPascoa, 'baleares2027', true],
  ])),
  regiao('canarias', ([] as Linha[]).concat(NAC_2026, nac2027('canarias2027'), [
    ['2026-11-02', N.todos2, 'espanha2026b', true],
    ['2027-01-06', N.reis, 'canarias2027'], ['2027-02-02', t3('Virgem da Candelária (só Tenerife)', 'Our Lady of Candelaria (Tenerife only)', 'Virgen de Candelaria (solo Tenerife)'), 'canarias2027', true],
    ['2027-03-25', N.quinta, 'canarias2027', true], ['2027-08-16', N.assuncao, 'canarias2027', true],
    ['2027-09-08', t3('Nossa Senhora do Pino (só Gran Canaria)', 'Our Lady of El Pino (Gran Canaria only)', 'Nuestra Señora del Pino (solo Gran Canaria)'), 'canarias2027', true],
  ])),
);
for (let i = 0; i < REGIOES.length; i++) DATAS.push(REGIOES[i]);

