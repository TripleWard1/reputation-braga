// Estudo de Perfil do Turista (Braga) - exportação completa do inquérito no SurveyMonkey («Perfil turístico de Braga»),
// com 336 respostas, exportada a 7 de maio de 2025 («Inquéritos perfil do turista Braga.pdf»). Base oficial do Observatório.
// Inquérito feito em Braga, em 2025 (confirmado pelo Município). Percentagens tal como constam da exportação, arredondadas a uma casa decimal. «n» = quem respondeu a cada pergunta.
// O relatório anterior do estudo usava só as 112 respostas de 1 a 4 de março de 2025.
export const PERFIL_TURISTA: any = {
  fonte: 'Estudo de Perfil do Turista · Projeto de Criação de Experiências Turísticas Sustentáveis · inquérito «Perfil turístico de Braga» · 336 respostas · exportação de 7 de maio de 2025',
  amostra: 336,
  primeiraVisita: 53.0, recorrentes: 47.0, nPrimeira: 336,
  voltaramMenos2Anos: 74.0, nVoltaram: 127,
  // P50 · n=304. Ordem: os 4 primeiros são de fora de Portugal.
  origem: [['Galiza', 24.0], ['Resto de Espanha', 10.5], ['Resto da Europa', 13.2], ['Fora da Europa', 2.6], ['Resto da Região Norte', 27.3], ['Resto de Portugal', 22.4]], nOrigem: 304,
  // P9 · n=317 · várias respostas
  motivacao: [['Lazer', 73.2], ['Cultura / educação', 39.7], ['Religião', 26.8], ['Motivos pessoais', 12.3], ['Saúde / bem-estar', 6.9], ['Trabalho / negócios', 2.5], ['Outros', 0.6]], nMotivacao: 317,
  // P7 · n=318
  companhia: [['Família', 28.0], ['Casal', 27.0], ['Amigos', 22.6], ['Sozinho', 13.8], ['Grupo organizado', 8.5]], nCompanhia: 318,
  // P48 · n=303 ; P49 · n=301
  idade: [['16–24', 22.8], ['25–34', 19.1], ['35–44', 24.8], ['45–54', 18.8], ['55–64', 7.6], ['65 ou mais', 6.9]], nIdade: 303,
  genero: { homens: 49.8, mulheres: 50.2 },
  // P21 · n=304 · o primeiro elemento é «não pernoitou»
  alojamento: [['Não pernoitou', 18.1], ['Hotel 3 a 5 estrelas', 31.3], ['Apartamento turístico', 15.1], ['Pensão', 8.2], ['Casa de familiares ou amigos', 7.6], ['Turismo rural', 6.9], ['Albergue', 5.3], ['Hotel 1 ou 2 estrelas', 2.6], ['Parque de campismo', 2.0], ['Segunda casa', 2.0], ['Casa arrendada', 1.0]], nAlojamento: 304,
  // P4 (concelho de alojamento) não é usada: ninguém escolheu «não estou alojado», o que contradiz os 18,1% que não pernoitaram (P21).
  // P15 · n=313 · várias respostas
  transporte: [['Carro próprio', 53.4], ['Avião', 18.5], ['Autocarro de linha', 14.7], ['Comboio', 11.2], ['Autocarro de excursão', 8.3], ['Carro alugado', 5.1], ['A pé (peregrino)', 3.8], ['Táxi', 2.2], ['Moto', 1.0], ['Bicicleta (peregrino)', 0.6]], nTransporte: 313,
  // P12 · n=310
  organizacao: [['Por conta própria, reservando diretamente', 65.8], ['Sem reserva prévia', 15.2], ['Agência com pacote', 8.7], ['Viagem organizada (grupo)', 5.8], ['Agência sem pacote', 4.5]], nOrganizacao: 310,
  // P11 · n=263 · várias respostas
  fontes: [['Sites de reserva (Booking, Airbnb, TripAdvisor)', 57.4], ['Amigos e familiares', 45.2], ['Site de turismo de Braga', 29.3], ['Instagram', 27.8], ['Inteligência artificial', 22.8], ['TikTok', 18.6], ['Facebook', 15.6], ['Agências de viagem', 8.7], ['Guias impressos', 4.9], ['Imprensa', 2.3], ['YouTube', 1.9], ['Twitter (X)', 1.9], ['Televisão', 0.8], ['Rádio', 0.4]], nFontes: 263,
  naoProcurou: 16.4, // P10 · n=317 · «Eu não procurei informação»
  // P13 · n=267 · várias respostas
  reservas: [['Alojamento', 73.8], ['Transporte até Braga', 36.0], ['Atividades ou visitas guiadas', 18.4], ['Refeições', 16.5], ['Transporte em Braga', 10.5]], nReservas: 267,
  // P5 · n=320 ; P6 · n=166 (sem a opção «Braga»)
  outrosDestinos: { soBraga: 55.0, comOutros: 45.0, lista: [['Porto', 67.5], ['Guimarães', 41.6], ['Fafe', 13.3], ['Celorico de Basto', 10.8], ['Esposende', 10.2]], n: 166 },
  // P17 · n=308
  infoNoDestino: [['Não pediu / não recebeu informações', 50.6], ['No alojamento', 20.5], ['Nos postos de turismo', 18.5], ['Na rua, a outras pessoas', 18.2], ['Outro', 9.4]], nInfo: 308,
  // P40 · n=300 · várias respostas
  locais: [['Sé de Braga', 79.7], ['Avenida da Liberdade e Praça da República', 64.7], ['Jardim de Santa Bárbara', 63.3], ['Arco da Porta Nova', 61.3], ['Santuário do Bom Jesus do Monte', 58.0], ['Palácio do Raio', 45.3], ['Santuário do Sameiro', 35.3], ['Igreja de Santa Cruz', 30.3], ['Braga Parque', 20.7], ['Adegas e vinhedos', 8.7], ['Museu D. Diogo de Sousa', 8.7], ['Mosteiro de Tibães', 8.0], ['Termas Romanas do Alto da Cividade', 7.7], ['Museu dos Biscainhos', 6.3], ['Museu Pio XII', 2.7]], nLocais: 300,
  // P38 · n=304 · várias respostas
  positivos: [['Monumentos', 73.4], ['Gastronomia', 53.3], ['Atividades culturais', 43.8], ['Paisagens', 43.1], ['Hospitalidade', 38.5], ['Qualidade-preço', 18.8], ['Natureza e ambiente', 17.8], ['Segurança', 16.1], ['Clima', 14.5], ['Espetáculos', 13.8]], nPositivos: 304,
  // P39 · n=157 (de 304 que avaliaram a visita) · várias respostas
  nQueixas: 157, nBaseQueixas: 304,
  negativos: [['Clima', 31.2], ['Ruído', 17.2], ['Serviços públicos', 17.2], ['Estradas', 16.6], ['Praias (ausência)', 8.9], ['Sinalização', 8.3], ['Insegurança', 7.6], ['Espetáculos (falta)', 7.0], ['Qualidade-preço', 5.1], ['Atividades culturais (falta)', 4.5]],
  // P44 · n=304 ; P45 · n=302 ; P46 · n=301
  expectativas: { melhor: 58.6, igual: 37.8, pior: 2.6 },
  voltar: 85.4, recomendaria: 96.4,
  // P30–P37: a exportação só traz resumos em texto (sem médias exatas). 75,1% responderam por pessoa e 24,9% por grupo (P30, n=225).
  gastos: [['Refeições', 'maioria entre 20 e 30 €'], ['Pequeno-almoço fora', 'maioria entre 5 e 10 €'], ['Visitas, atividades e lazer', 'maioria entre 10 e 15 €'], ['Compras', 'maioria cerca de 20 €'], ['Cafés e pequenas refeições', 'cerca de 10 €'], ['Outras (alimentação, combustível)', 'entre 10 e 30 €']],
  gastoDiario: [70, 100], porPessoa: 75.1,
  estudo2019: { gasto: 173, nota: 'inclui alojamento' },
};
