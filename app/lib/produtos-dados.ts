// Portefólio de produtos turísticos da Divisão (mapas, brochuras, roteiros). Base fixa; links e capas editáveis na página (Firestore).
// Partilhado pela página Produtos turísticos, pela pesquisa global e pela rota /api/perguntar.
export type Lingua = 'pt' | 'es' | 'fr' | 'en' | 'pt-en';
export interface Edicao { pagina?: string; pdf?: string }
export interface ProdutoBase { id: string; nome: string; tipo: string; descricao: [string, string]; linguas: Lingua[]; base: Partial<Record<Lingua, Edicao>> }
export const PRODUTOS: ProdutoBase[] = [
  { id: 'mapa-turistico-oficial', nome: 'Mapa Turístico Oficial de Braga', tipo: 'Mapa', descricao: ['O mapa oficial da cidade, com monumentos, museus e serviços de apoio ao visitante.', 'The official city map, with monuments, museums and visitor services.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/mapa-turistico-oficial-de-braga-portugues/' } } },
  { id: 'brochura-turistica', nome: 'Brochura Turística – Visit Braga', tipo: 'Brochura', descricao: ['A apresentação do destino: património, gastronomia, natureza e experiências.', 'The destination at a glance: heritage, food, nature and experiences.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/brochura-turistica-visit-braga-pt/' } } },
  { id: 'brochura-descobre-a-caminho', nome: 'Brochura Turística – Descobre a caMINHO', tipo: 'Brochura', descricao: ['Brochura bilingue Descobre a caMINHO, em português e inglês.', 'Bilingual Descobre a caMINHO brochure, in Portuguese and English.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/brochura-turistica-descobre-a-caminho-pt-en/' } } },
  { id: 'roteiro-lojas-com-historia', nome: 'Roteiro Lojas com História', tipo: 'Roteiro', descricao: ['Itinerário pelas lojas centenárias e tradicionais reconhecidas pelo Município.', 'Itinerary through the centenary and traditional shops recognised by the Municipality.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-lojas-com-historia-pt-en/' } } },
  { id: 'roteiro-3-dias', nome: 'Roteiro Turístico – Descobrir Braga em 3 Dias', tipo: 'Roteiro', descricao: ['Três dias organizados para conhecer o essencial de Braga.', 'Three days planned to discover the best of Braga.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-descobrir-braga-em-3-dias-pt/' } } },
  { id: 'roteiro-cidade-do-bracvs', nome: 'Roteiro Infantojuvenil – "A Cidade do Bracvs"', tipo: 'Roteiro', descricao: ['Um roteiro pensado para crianças e jovens descobrirem a cidade a brincar.', 'An itinerary designed for children and young people to discover the city through play.'], linguas: ['pt', 'es', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-infantojuvenil-a-cidade-do-bracvs/' } } },
  { id: 'braga-after-dark', nome: 'Braga After Dark', tipo: 'Roteiro', descricao: ['A cidade à noite: cultura, gastronomia e vida noturna.', 'The city by night: culture, food and nightlife.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-braga-after-dark/' } } },
];
