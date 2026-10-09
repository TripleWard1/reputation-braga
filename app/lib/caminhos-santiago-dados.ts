// ═══════════════════════════════════════════════════════════════════════════
// CAMINHOS DE SANTIAGO COM PARTIDA EM BRAGA
// Fonte principal: Serviço de Peregrinos da Catedral de Santiago de Compostela
// (Compostelas emitidas a quem iniciou na Sé de Braga). Complementos: Associação
// Transfronteiriça do Caminho da Geira e dos Arrieiros; estudo USC/IDEGA (Galiza).
// ═══════════════════════════════════════════════════════════════════════════

export const CAMINHOS = {
  fonte: 'Serviço de Peregrinos da Catedral de Santiago',
  km: 239,
  municipios: ['Braga', 'Amares', 'Terras de Bouro'],
  rankingNacional: 8,      // posição de Braga como ponto de partida (2025)
  liderNacional: 'Porto',  // 51.774 partidas

  // Compostelas a quem partiu da Sé de Braga, por ano
  partidasBraga: [['2022', 1039], ['2023', 1098], ['2024', 1124], ['2025', 1130]] as [string, number][],

  // Partidas de Braga por caminho (evolução) — a história do "sorpasso" da Geira
  evolucao: [
    { ano: '2023', Geira: 403, Central: 674 },
    { ano: '2024', Geira: 509, Central: 608 },
    { ano: '2025', Geira: 567, Central: 550 },
  ],

  // Repartição por caminho em 2025 (partidas de Braga)
  porCaminho2025: [
    ['Geira e Arrieiros', 567],
    ['Central Português', 550],
    ['Minhoto Ribeiro', 12],
    ['São Rosendo', 1],
  ] as [string, number][],

  // Perfil do peregrino do Caminho da Geira (2025)
  cga2025: {
    nacionalidades: [['Portugal', 63.1], ['Espanha', 18.7], ['Chéquia', 5.5]] as [string, number][],
    outrosPaises: 23,
    modo: [['A pé', 84.6], ['Bicicleta', 15.4]] as [string, number][],
    meses: [['Maio', 31], ['Junho', 21.5], ['Outubro', 10.4]] as [string, number][],
    inicioBraga: 75,       // % do CGA que começa em Braga
    homens: 63,            // % aproximada
    motivoReligioso: 56,   // % só religiosos (394 de cerca de 700); com «religiosos e outros» seriam cerca de 85 %
  },

  // Acumulado do Caminho da Geira desde a apresentação (2017–2025), segundo a Associação Transfronteiriça
  // do Caminho da Geira e dos Arrieiros (Diário do Minho, 05/01/2026).
  acumulado: { peregrinos: 7785, compostelas: 3176 },
  // Fontes públicas dos números acima: Diário do Minho, 05/01/2025 e 05/01/2026 (estatísticas do Serviço de Peregrinos
  // e relatório da Associação). Os valores de anos anteriores podem ser revistos pelo Serviço de Peregrinos
  // (ex.: 2024 aparece como 1 124 numa publicação e cerca de 1 118 na seguinte).

  // Sinal interno: balcão do Posto de Turismo (Visit Braga)
  // Mesma base do separador Atendimento Balcão: registos de visitantes, exportação de 24/09/2026.
  balcao: { peregrinos2025: 0, peregrinos2026: 124, interesse2025: 6, interesse2026: 141 },

  // Enquadramento económico (estudo USC/IDEGA, Galiza) — indicativo, não Braga
  // Primeiras conclusões, publicadas a 20/04/2018 (Cluster Turismo Galicia); «até» 11 % e «até» 18 %.
  economia: { fatorTurista: 2.3, maisProduto: 11, maisEmprego: 18 },
};
