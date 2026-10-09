// Eventos avaliados no separador «Impacto de eventos» e feriados excluídos da base de comparação.
// Datas confirmadas em fontes públicas (ligação em cada evento). Para acrescentar um evento, basta juntar uma linha.
export interface T3 { pt: string; en: string; es: string }
// Estudo externo sobre o evento (ex.: impacto económico). «medido» = valor contado na fonte; «estimativa» = modelo da entidade.
export interface EstudoEvento { entidade: T3; periodo: T3; fonte: string; fonteNome: string; itens: { rot: T3; valor: string; tipo: 'medido' | 'estimativa'; nota?: T3 }[]; notas: T3[] }
export interface Evento { id: string; nome: T3; ini: string; fim: string; fonte: string; nota?: T3; estudo?: EstudoEvento }

export const EVENTOS: Evento[] = [
  { id: 'semana-santa', nome: { pt: 'Semana Santa', en: 'Holy Week', es: 'Semana Santa' }, ini: '2026-03-29', fim: '2026-04-05',
    fonte: 'https://www.exoticca.com/uk/blog/faith-and-pageantry-experiencing-semana-santa-in-portugal-2026/',
    nota: { pt: 'Coincide com as férias escolares da Páscoa e com dois feriados (3 e 5 de abril).', en: 'Overlaps Easter school holidays and two public holidays (3 and 5 April).', es: 'Coincide con las vacaciones escolares de Semana Santa y con dos festivos (3 y 5 de abril).' } },
  { id: 'braga-romana', nome: { pt: 'Braga Romana', en: 'Braga Romana', es: 'Braga Romana' }, ini: '2026-05-20', fim: '2026-05-24',
    fonte: 'https://www.rum.pt/braga-romana-2026-regressa-esta-quarta-feira-com-tres-palcos-e-72-horas-de-programacao' },
  { id: 'sao-joao', nome: { pt: 'São João de Braga', en: 'São João de Braga', es: 'San Juan de Braga' }, ini: '2026-06-17', fim: '2026-06-24',
    fonte: 'https://www.viralagenda.com/pt/events/1813413/8-dia-festas-de-sao-joao-de-braga-de-2026',
    nota: { pt: 'Os dias principais são 23 e 24 de junho (24 é feriado municipal).', en: 'The main days are 23 and 24 June (24 is a municipal holiday).', es: 'Los días principales son el 23 y el 24 de junio (el 24 es festivo municipal).' } },
  { id: 'noite-branca', nome: { pt: 'Noite Branca', en: 'Noite Branca', es: 'Noite Branca' }, ini: '2026-09-04', fim: '2026-09-06',
    fonte: 'https://observador.pt/2026/08/04/noite-branca-de-braga-regressa-em-setembro-com-ana-moura-gnr-e-barbara-tinoco-e-uma-nova-identidade-visual/',
    estudo: {
      entidade: { pt: 'Associação Empresarial de Braga (AEB) · estudo de impacto económico com dados da SIBS', en: 'Braga Business Association (AEB) · economic impact study with SIBS data', es: 'Asociación Empresarial de Braga (AEB) · estudio de impacto económico con datos de SIBS' },
      periodo: { pt: 'Pagamentos eletrónicos de 31 de agosto a 6 de setembro de 2026 (7 dias)', en: 'Electronic payments from 31 August to 6 September 2026 (7 days)', es: 'Pagos electrónicos del 31 de agosto al 6 de septiembre de 2026 (7 días)' },
      fonte: 'https://ominho.pt/noite-branca-de-braga-deixou-em-braga-mais-de-11-milhoes-de-euros/',
      fonteNome: 'O Minho, 08/10/2026',
      itens: [
        { rot: { pt: 'Volume de negócios (pagamentos eletrónicos)', en: 'Turnover (electronic payments)', es: 'Volumen de negocio (pagos electrónicos)' }, valor: '55,48 M€', tipo: 'medido' },
        { rot: { pt: 'Gasto com cartões emitidos fora de Braga', en: 'Spending with cards issued outside Braga', es: 'Gasto con tarjetas emitidas fuera de Braga' }, valor: '25,42 M€', tipo: 'medido', nota: { pt: '+21,3% face a 2025', en: '+21.3% vs 2025', es: '+21,3 % frente a 2025' } },
        { rot: { pt: 'Ganho face a períodos normais do ano', en: 'Gain vs normal periods of the year', es: 'Ganancia frente a periodos normales del año' }, valor: '11,25 M€', tipo: 'estimativa', nota: { pt: 'estimativa da AEB; o método não foi publicado', en: 'AEB estimate; method not published', es: 'estimación de la AEB; el método no se ha publicado' } },
      ],
      notas: [
        { pt: 'Repartição do gasto: cartões de Braga 54,2%; de outros concelhos portugueses 38,7% (+22,8%); estrangeiros 7,1% (+13,8%). 91,4% do aumento do gasto veio de cartões de fora de Braga.', en: 'Spending split: Braga cards 54.2%; other Portuguese municipalities 38.7% (+22.8%); foreign 7.1% (+13.8%). 91.4% of the increase came from cards issued outside Braga.', es: 'Reparto del gasto: tarjetas de Braga 54,2 %; de otros municipios portugueses 38,7 % (+22,8 %); extranjeras 7,1 % (+13,8 %). El 91,4 % del aumento vino de tarjetas de fuera de Braga.' },
        { pt: 'Principais origens: Guimarães (11,9%), Vila Nova de Famalicão (9%) e Barcelos (8,3%) entre os concelhos portugueses; França (28,4%), Espanha (12,3%) e EUA (7,9%) entre os estrangeiros.', en: 'Main origins: Guimarães (11.9%), Vila Nova de Famalicão (9%) and Barcelos (8.3%) among Portuguese municipalities; France (28.4%), Spain (12.3%) and the USA (7.9%) among foreign cards.', es: 'Principales orígenes: Guimarães (11,9 %), Vila Nova de Famalicão (9 %) y Barcelos (8,3 %) entre los municipios portugueses; Francia (28,4 %), España (12,3 %) y EE. UU. (7,9 %) entre los extranjeros.' },
      ],
    } },
];

// Feriados nacionais e municipal (Braga, 24 de junho) de 2026, excluídos da base de comparação.
// Inclui o Carnaval (17 de fevereiro), dia de tolerância habitual.
export const FERIADOS_2026: string[] = ['2026-01-01', '2026-02-17', '2026-04-03', '2026-04-05', '2026-04-25', '2026-05-01', '2026-06-04', '2026-06-10', '2026-06-24', '2026-08-15', '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25'];
