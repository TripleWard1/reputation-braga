// ═══════════════════════════════════════════════════════════════════════════
// CAMINHOS DE SANTIAGO COM PARTIDA EM BRAGA
// Fonte principal: Serviço de Peregrinos da Catedral de Santiago de Compostela
// (Compostelas emitidas a quem iniciou na Sé de Braga). Complementos: Associação
// Transfronteiriça do Caminho da Geira e dos Arrieiros; estudo USC/IDEGA (Galiza).
// ═══════════════════════════════════════════════════════════════════════════

export const CAMINHOS = {
    fonte: 'Serviço de Peregrinos da Catedral de Santiago',
    km: 239,
    municipios: ['Braga', 'Amares', 'Terras de Bouro', 'Melgaço'],
    rankingNacional: 8,      // posição de Braga como ponto de partida (2025)
    liderNacional: 'Porto',  // 51.774 partidas
  
    // Compostelas a quem partiu da Sé de Braga, por ano
    partidasBraga: [['2022', 1039], ['2023', 1098], ['2024', 1124], ['2025', 1130]] as [string, number][],
  
    // Partidas de Braga por caminho (evolução) - a história do "sorpasso" da Geira
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
      motivoReligioso: 56,   // % (religiosos + religiosos/outros, aprox.)
    },
  
    // Acumulado do Caminho da Geira desde a apresentação (2017–2025)
    acumulado: { peregrinos: 6847, compostelas: 2730, pt: 70, es: 16, outros: 14 },
  
    // Sinal interno: balcão do Posto de Turismo (Visit Braga)
    balcao: { peregrinos2025: 2, peregrinos2026: 90, interesse2025: 8, interesse2026: 146 },
  
    // Enquadramento económico (estudo USC/IDEGA, Galiza) - indicativo, não Braga
    economia: { fatorTurista: 2.3, maisProduto: 11, maisEmprego: 18 },
  };