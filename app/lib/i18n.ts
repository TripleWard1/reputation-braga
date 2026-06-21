// ═══════════════════════════════════════════════════════════════════════════
// i18n - motor de tradução PT/EN do Observatório Visit Braga
// Usa uma variável de módulo (singleton) para que o mesmo t() funcione tanto
// em componentes React como em funções de módulo (geradores de PDF, helpers).
// O toggle atualiza esta variável E o estado React (para forçar re-render).
// ═══════════════════════════════════════════════════════════════════════════

export type Lang = 'pt' | 'en';

let LANG: Lang = 'pt';

export function getLang(): Lang {
  return LANG;
}

export function setLangGlobal(l: Lang): void {
  LANG = l;
}

/** Devolve a string no idioma ativo. Ex.: t('Visão Geral', 'Overview') */
export function t(pt: string, en: string): string {
  return LANG === 'en' ? en : pt;
}

// Dicionário de rótulos vindos dos ficheiros de dados (categorias de gráficos).
// Nomes próprios (cidades, URLs, rotas) não constam - passam intactos.
const DL_EN: Record<string, string> = {
  // Canais de aquisição
  'Pesquisa orgânica': 'Organic search', 'Direto': 'Direct', 'Redes sociais': 'Social', 'Referência': 'Referral', 'Não atribuído': 'Unassigned',
  // Dispositivos
  'Telemóvel': 'Mobile', 'Computador': 'Desktop', 'Tablet': 'Tablet',
  // Transporte / dieta / resíduos / climatização
  'Carro': 'Car', 'Avião': 'Plane', 'Comboio': 'Train',
  'Mista': 'Mixed', 'Tradicional': 'Traditional', 'Carne': 'Meat',
  'Baixo': 'Low', 'Baixa': 'Low', 'Ligeira': 'Light', 'Médio': 'Medium', 'Média': 'Medium', 'Nenhuma': 'None',
  // Alojamento
  'Hotel': 'Hotel', 'Alojamento Local': 'Local Accommodation', 'Sem alojamento': 'No accommodation',
  // Dimensões IGPT
  'Economia e Desenvolvimento': 'Economy and Development', 'Cultura e Património': 'Culture and Heritage',
  'Qualidade de Vida e Pressão Urbana': 'Quality of Life and Urban Pressure', 'Sustentabilidade Ambiental': 'Environmental Sustainability',
  'Governança e Participação': 'Governance and Participation',
  // Resultados IGPT
  'Muito positiva': 'Very positive', 'Moderadamente positiva': 'Moderately positive', 'Moderadamente reduzida': 'Moderately low',
  // Tipos de necessidade (acessibilidade)
  'Motora': 'Motor', 'Cognitiva': 'Cognitive', 'Auditiva': 'Hearing', 'Visual': 'Visual', 'Outra': 'Other',
  // Caminhos - modo
  'A pé': 'On foot', 'Bicicleta': 'Bicycle', 'Central Português': 'Portuguese Central',
  // Países
  'Portugal': 'Portugal', 'França': 'France', 'Espanha': 'Spain', 'Chéquia': 'Czechia', 'Alemanha': 'Germany',
  'Itália': 'Italy', 'Reino Unido': 'United Kingdom', 'Estados Unidos': 'United States', 'EUA': 'USA', 'Brasil': 'Brazil',
  'Países Baixos': 'Netherlands', 'Polónia': 'Poland', 'Bélgica': 'Belgium', 'Suíça': 'Switzerland', 'Irlanda': 'Ireland',
  'Áustria': 'Austria', 'Canadá': 'Canada', 'Hungria': 'Hungary', 'Coreia do Sul': 'South Korea', 'China': 'China', 'Japão': 'Japan',
  // Idiomas
  'Português': 'Portuguese', 'Inglês': 'English', 'Francês': 'French', 'Espanhol': 'Spanish', 'Alemão': 'German', 'Italiano': 'Italian',
  // Meses
  'Janeiro': 'January', 'Fevereiro': 'February', 'Março': 'March', 'Abril': 'April', 'Maio': 'May', 'Junho': 'June',
  'Julho': 'July', 'Agosto': 'August', 'Setembro': 'September', 'Outubro': 'October', 'Novembro': 'November', 'Dezembro': 'December',
  // Meses abreviados (acessibilidade)
  'fev/26': 'Feb/26', 'mar/26': 'Mar/26', 'abr/26': 'Apr/26', 'mai/26': 'May/26', 'jun/26': 'Jun/26',
  // Meses abreviados (eixos de gráficos)
  'Fev': 'Feb', 'Abr': 'Apr', 'Mai': 'May', 'Ago': 'Aug', 'Set': 'Sep', 'Out': 'Oct', 'Dez': 'Dec',
  // Idiomas / países adicionais
  'Chinês': 'Chinese', 'Neerlandês': 'Dutch', 'Roménia': 'Romania', 'Austrália': 'Australia', 'Argentina': 'Argentina',
  'Lisboa': 'Lisbon', 'Norte': 'North',
  // Genéricos
  'Outros': 'Others', 'Outro': 'Other',
  // Balcão - interesses
  'Informação Turística de Braga': 'Braga tourist information',
  'Programação cultural ou publicações': 'Cultural programming or publications',
  'Informação Transportes': 'Transport information',
  'Localização ruas (Mapas)': 'Street locations (Maps)',
  'Informação Turística de outros destinos': 'Tourist information for other destinations',
  'Gastronomia': 'Gastronomy', 'Vendas de Produtos': 'Product sales', 'Lazer': 'Leisure',
  'Animação Nocturna': 'Nightlife', 'Caminhos de Santiago': 'Camino de Santiago',
  'Compras ou comércio': 'Shopping or retail', 'Eventos e Festividades': 'Events and Festivities',
  'Loja': 'Shop', 'Restauração/Gastronomia': 'Dining/Gastronomy', 'Património/Museus': 'Heritage/Museums',
  // Balcão - meio de chegada
  'Autocarro': 'Bus', 'Autocaravana': 'Motorhome', 'A pé / Bicicleta': 'On foot / Bicycle',
  'Motociclo': 'Motorcycle', 'Cruzeiro (Porto de Leixões)': 'Cruise (Port of Leixões)',
  // Balcão - alojamento
  'Apartamento (AL)': 'Apartment (AL)', 'Parque de Campismo/Caravanismo': 'Camping/Caravan park',
  'Apartamento Turístico': 'Tourist apartment', 'Pousada da Juventude': 'Youth Hostel',
  'Estabelecimento de Hospedagem (Hostel) (AL)': 'Hostel (AL)', 'Albergue (Peregrinos)': 'Pilgrim hostel',
  'Moradia (AL)': 'House (AL)',
  // Balcão - perfil
  'Visitante Individual / Família': 'Individual visitor / Family', 'Turista Individual / Família': 'Individual tourist / Family',
  'Guia Turístico': 'Tour guide', 'Professor / Escola': 'Teacher / School', 'Operador Turístico': 'Tour operator',
  // Audiência digital - páginas
  'Página inicial': 'Homepage', 'Passagem de Ano': 'New Year', 'Luzes de Natal (inauguração)': 'Christmas Lights (opening)',
  'Comércio Local': 'Local Commerce', 'Feira Semanal de Braga': 'Braga Weekly Market', 'Monumentos': 'Monuments',
  'Página inicial (EN)': 'Homepage (EN)', 'Parada de Natal': 'Christmas Parade', 'Comboio Turístico': 'Tourist Train',
  'Braga Cidade': 'Braga City',
};

/** Traduz um rótulo de dados conhecido; se não constar, devolve-o tal como está. */
export function dl(label: string): string {
  return t(label, DL_EN[label] ?? label);
}