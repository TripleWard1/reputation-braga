// ═══════════════════════════════════════════════════════════════════════════
// AUDIÊNCIA DIGITAL - visitbraga.travel (Google Analytics 4 + Google Search Console)
// Todos os valores reais (exports GA4 e Search Console de 24/09/2026).
//
// Contexto: em 2026 o site foi alvo de um ciberataque e esteve fora do ar vários meses.
// O Search Console mostra atividade normal até abril, quebra em maio, quase nula em
// junho–julho e retoma no final de agosto. As medições GA4 foram retomadas no final
// de agosto de 2026.
//
// Três recortes:
//  • DIGITAL        - período de referência antes do ataque: 28 jul 2025 – 10 mar 2026
//                     (data da exportação anterior; o site funcionou normalmente até ~maio).
//  • DIGITAL_POS    - retoma: 1 jul – 23 set 2026 (dados efetivos desde o final de agosto).
//  • DIGITAL_TOTAL  - desde o lançamento: 28 jul 2025 – 24 set 2026.
// Os três recortes não são somáveis entre si (utilizadores únicos por período).
// ═══════════════════════════════════════════════════════════════════════════

export const DIGITAL = {
  periodo: '28 jul 2025 – 10 mar 2026',
  kpis: {
    utilizadores: 61900,
    novos: 62463,
    visualizacoes: 173331,
    taxaEnvolvimento: 66.38,   // %
    tempoMedioSeg: 45,         // segundos
    pagsPorUtilizador: 2.80,
    eventos: 483750,
  },
  // Canais de aquisição (novos utilizadores, primeiro toque)
  canais: [
    ['Pesquisa orgânica', 39152],
    ['Direto', 18858],
    ['Redes sociais', 1653],
    ['Referência', 1644],
    ['Não atribuído', 668],
  ] as [string, number][],
  // Categoria de dispositivo (export 31 jul 2025 – 10 mar 2026)
  dispositivos: [
    ['Telemóvel', 44904],
    ['Computador', 15416],
    ['Tablet', 464],
  ] as [string, number][],
  // Top países (utilizadores ativos)
  paises: [
    ['Portugal', 48706],
    ['França', 3061],
    ['Espanha', 3012],
    ['China', 1253],
    ['EUA', 945],
    ['Brasil', 812],
    ['Alemanha', 739],
    ['Reino Unido', 495],
    ['Suíça', 445],
    ['Itália', 399],
    ['Países Baixos', 390],
  ] as [string, number][],
  // Top idiomas do navegador (export 31 jul 2025 – 10 mar 2026)
  idiomas: [
    ['Português', 42088],
    ['Inglês', 8051],
    ['Francês', 4144],
    ['Espanhol', 3319],
    ['Chinês', 847],
    ['Alemão', 836],
    ['Italiano', 470],
    ['Neerlandês', 298],
  ] as [string, number][],
  // Top cidades (export 31 jul 2025 – 10 mar 2026; excluídas "(not set)" e tráfego automático)
  cidades: [
    ['Lisboa', 14627],
    ['Braga', 11473],
    ['Porto', 9748],
    ['Montijo', 1783],
    ['Guimarães', 943],
    ['Paris', 721],
    ['V. N. de Gaia', 601],
    ['Madrid', 576],
    ['Póvoa de Varzim', 445],
    ['Vigo', 426],
  ] as [string, number][],
  // Top páginas (visualizações)
  paginas: [
    ['Página inicial', 21952],
    ['Passagem de Ano', 17637],
    ['Luzes de Natal (inauguração)', 11583],
    ['Agenda Braga', 9463],
    ['Comércio Local', 2959],
    ['Feira Semanal de Braga', 2603],
    ['Monumentos', 2107],
    ['Página inicial (EN)', 1941],
    ['Braga Cidade', 1805],
    ['Parada de Natal', 1793],
    ['Feira dos Passarinhos', 1425],
    ['Experiências', 1186],
  ] as [string, number][],
};

// ─── Retoma após o ataque ───
export const DIGITAL_POS = {
  periodo: '1 jul – 23 set 2026',
  diasEstimados: 30, // dados efetivos desde o final de agosto (estimativa)
  kpis: {
    utilizadores: 1050,
    novos: 1024,
    visualizacoes: 3243,
    taxaEnvolvimento: 62.96,
    tempoMedioSeg: 60,
    pagsPorUtilizador: 3.09,
    eventos: 9218,
    sessoesChatGPT: 65,
  },
  canais: [
    ['Direto', 761],
    ['Pesquisa orgânica', 219],
    ['Assistentes de IA', 40],
    ['Redes sociais', 3],
    ['Referência', 1],
  ] as [string, number][],
  // Origem das sessões
  origens: [
    ['Google', 298],
    ['ChatGPT', 65],
    ['Códigos QR', 12],
    ['Bing', 8],
    ['Facebook', 3],
  ] as [string, number][],
  paises: [
    ['Portugal', 547],
    ['Espanha', 166],
    ['China', 103],
    ['França', 83],
    ['EUA', 33],
    ['Alemanha', 25],
    ['Reino Unido', 17],
    ['Países Baixos', 14],
    ['Brasil', 11],
    ['Bélgica', 10],
  ] as [string, number][],
  idiomas: [
    ['Português', 403],
    ['Inglês', 264],
    ['Espanhol', 177],
    ['Francês', 106],
    ['Alemão', 35],
    ['Neerlandês', 17],
    ['Chinês', 16],
    ['Italiano', 11],
  ] as [string, number][],
  // excluídas "(not set)" e cidades chinesas com tráfego automático
  cidades: [
    ['Lisboa', 206],
    ['Braga', 143],
    ['Porto', 45],
    ['Montijo', 35],
    ['Paris', 32],
    ['Barcelona', 25],
    ['Madrid', 25],
    ['Vigo', 21],
    ['Valência', 16],
  ] as [string, number][],
  paginas: [
    ['Página inicial', 337],
    ['Agenda Braga', 107],
    ['Monumentos', 69],
    ['Feira Semanal (FR)', 52],
    ['Página inicial (EN)', 49],
    ['Monumentos (EN)', 47],
    ['Mapas e roteiros', 43],
    ['Ana Moura – Noite Branca (ES)', 36],
    ['Feira Semanal (ES)', 32],
    ['Comboio Turístico (ES)', 31],
  ] as [string, number][],
};

// ─── Desde o lançamento ───
export const DIGITAL_TOTAL = {
  periodo: '28 jul 2025 – 24 set 2026',
  kpis: {
    utilizadores: 81310,
    novos: 81702,
    taxaEnvolvimento: 63.72,
    tempoMedioSeg: 44,
    eventos: 622059,
  },
  canais: [
    ['Pesquisa orgânica', 49692],
    ['Direto', 26951],
    ['Referência', 2109],
    ['Redes sociais', 2005],
    ['Não atribuído', 833],
    ['Assistentes de IA', 43],
  ] as [string, number][],
  dispositivos: [
    ['Telemóvel', 57656],
    ['Computador', 23333],
    ['Tablet', 654],
  ] as [string, number][],
  paises: [
    ['Portugal', 60289],
    ['Espanha', 4385],
    ['França', 3939],
    ['China', 3487],
    ['EUA', 1492],
    ['Alemanha', 1331],
    ['Brasil', 1107],
    ['Reino Unido', 726],
    ['Suíça', 602],
    ['Países Baixos', 547],
  ] as [string, number][],
};

// ─── Google Search Console (pesquisa web) - 28 jul 2025 – 23 set 2026 ───
export const SEARCH_CONSOLE = {
  periodo: '28 jul 2025 – 23 set 2026',
  cliques: 89668,
  impressoes: 6123497,
  // [mês, cliques, impressões] - jul/25 começa a 28; set/26 termina a 23
  mensal: [
    ['jul/25', 807, 61719],
    ['ago/25', 8591, 525845],
    ['set/25', 7486, 438111],
    ['out/25', 5600, 425228],
    ['nov/25', 7726, 423495],
    ['dez/25', 18403, 560481],
    ['jan/26', 6047, 587952],
    ['fev/26', 5909, 502027],
    ['mar/26', 8977, 691387],
    ['abr/26', 10413, 1093607],
    ['mai/26', 3977, 375834],
    ['jun/26', 603, 66592],
    ['jul/26', 373, 44896],
    ['ago/26', 1116, 115016],
    ['set/26', 3640, 211307],
  ] as [string, number, number][],
  dispositivosCliques: [
    ['Telemóvel', 66396],
    ['Computador', 22304],
    ['Tablet', 968],
  ] as [string, number][],
  consultas: [
    ["braga", 4195],
    ["passagem de ano braga", 1795],
    ["visit braga", 1331],
    ["luzes natal braga 2025", 734],
    ["passagem de ano em braga 2026", 475],
    ["passagem de ano braga 2026", 445],
    ["ano novo braga", 438],
    ["luzes de natal braga", 433],
    ["agenda cultural braga", 404],
    ["turismo braga", 390],
  ] as [string, number][],
  paisesCliques: [
    ["Portugal", 75613],
    ["Espanha", 4476],
    ["França", 3539],
    ["Alemanha", 899],
    ["Brasil", 832],
    ["Suíça", 561],
    ["Reino Unido", 497],
    ["Itália", 478],
  ] as [string, number][],
};
