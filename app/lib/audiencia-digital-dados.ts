// ═══════════════════════════════════════════════════════════════════════════
// AUDIÊNCIA DIGITAL - visitbraga.travel (Google Analytics 4)
// Período: 28 jul 2025 – 10 mar 2026. Todos os valores reais (export GA4).
// ═══════════════════════════════════════════════════════════════════════════

export const DIGITAL = {
    periodo: '28 jul 2025 – 10 mar 2026',
    kpis: {
      utilizadores: 61739,
      novos: 62313,
      visualizacoes: 172884,
      taxaEnvolvimento: 66.25,   // %
      tempoMedioSeg: 44,         // segundos
      pagsPorUtilizador: 2.80,
      eventos: 482484,
    },
    // Canais de aquisição (primeiro toque)
    canais: [
      ['Pesquisa orgânica', 39152],
      ['Direto', 18858],
      ['Redes sociais', 1653],
      ['Referência', 1644],
      ['Não atribuído', 668],
    ] as [string, number][],
    // Categoria de dispositivo
    dispositivos: [
      ['Telemóvel', 44904],
      ['Computador', 15416],
      ['Tablet', 464],
    ] as [string, number][],
    // Top países (utilizadores ativos)
    paises: [
      ['Portugal', 47423],
      ['França', 3021],
      ['Espanha', 2975],
      ['China', 1253],
      ['EUA', 929],
      ['Brasil', 803],
      ['Alemanha', 734],
      ['Reino Unido', 483],
      ['Suíça', 437],
      ['Itália', 396],
      ['Países Baixos', 385],
    ] as [string, number][],
    // Top idiomas do navegador
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
    // Top cidades (excluída "(not set)")
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
      ['Página inicial', 21920],
      ['Passagem de Ano', 17637],
      ['Luzes de Natal (inauguração)', 11583],
      ['Agenda Braga', 9441],
      ['Comércio Local', 2959],
      ['Feira Semanal de Braga', 2588],
      ['Monumentos', 2100],
      ['Página inicial (EN)', 1941],
      ['Braga Cidade', 1799],
      ['Parada de Natal', 1793],
      ['Feira dos Passarinhos', 1423],
      ['Comboio Turístico', 1176],
    ] as [string, number][],
  };