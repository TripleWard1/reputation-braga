// Nota metodológica de cada separador do Observatório e registo de correções.
// Fonte, período, data de extração e estado dos dados, tal como constam dos ficheiros usados.
// Quando a data de extração não vem no ficheiro, fica "não indicada" (não se inventa).
import { getLang } from '@/app/lib/i18n';

export interface T3 { pt: string; en: string; es: string }
export interface Nota { fontes: T3; periodo: T3; extracao: T3; estado: T3; notas?: T3 }
const T = (pt: string, en: string, es: string): T3 => ({ pt, en, es });
export function tx(x: T3 | undefined): string {
  if (!x) return '';
  const l = getLang() as string;
  return l === 'en' ? x.en : l === 'es' ? x.es : x.pt;
}

const NI = T('não indicada no ficheiro', 'not stated in the file', 'no indicada en el fichero');
const PROV = T('Provisório (INE)', 'Provisional (INE)', 'Provisional (INE)');

export const METODOLOGIA: Record<string, Nota> = {
  geral: {
    fontes: T('INE/TravelBI; Taxa Municipal Turística (faturação); Atendimento de Balcão; avaliações do Google Maps importadas pela plataforma', 'INE/TravelBI; Municipal Tourist Tax (invoicing); Front Desk; Google Maps reviews imported by the platform', 'INE/TravelBI; Tasa Municipal Turística (facturación); Oficina de Turismo; reseñas de Google Maps importadas por la plataforma'),
    periodo: T('Dormidas e hóspedes: 2025. Ocupação e estada média: 2024. Taxa: 2021 a junho de 2026. Balcão: 2025', 'Stays and guests: 2025. Occupancy and length of stay: 2024. Tax: 2021 to June 2026. Front desk: 2025', 'Pernoctaciones y huéspedes: 2025. Ocupación y estancia media: 2024. Tasa: 2021 a junio de 2026. Oficina: 2025'),
    extracao: T('Ficheiros INE 2019–2025 e 1.º semestre de 2026; balcão exportado a 24/09/2026', 'INE files 2019–2025 and 1st half 2026; front desk exported 24/09/2026', 'Ficheros INE 2019–2025 y 1.er semestre 2026; oficina exportada el 24/09/2026'),
    estado: PROV,
    notas: T('O total anual de 2025 (692 238) é o publicado no ficheiro INE 2019–2025; os meses de jan–jun de 2025 seguem a revisão publicada com os dados de 2026, por isso a soma mensal difere em 356 dormidas.', 'The 2025 annual total (692,238) is the one in the INE 2019–2025 file; Jan–Jun 2025 follow the revision published with the 2026 data, so the monthly sum differs by 356 stays.', 'El total anual de 2025 (692 238) es el del fichero INE 2019–2025; ene–jun de 2025 siguen la revisión publicada con los datos de 2026, por lo que la suma mensual difiere en 356 pernoctaciones.'),
  },
  cruzamentos: {
    fontes: T('INE/TravelBI (mercados), Atendimento de Balcão (nacionalidades e cidades), Google Analytics do visitbraga.travel', 'INE/TravelBI (markets), Front Desk (nationalities and cities), Google Analytics of visitbraga.travel', 'INE/TravelBI (mercados), Oficina de Turismo (nacionalidades y ciudades), Google Analytics de visitbraga.travel'),
    periodo: T('INE 2025 e 1.º semestre de 2026; balcão 2026 (até 24/09); digital 28/07/2025 a 23/09/2026', 'INE 2025 and 1st half 2026; front desk 2026 (to 24/09); digital 28/07/2025 to 23/09/2026', 'INE 2025 y 1.er semestre 2026; oficina 2026 (hasta 24/09); digital 28/07/2025 a 23/09/2026'),
    extracao: T('Ver cada separador de origem', 'See each source tab', 'Ver cada pestaña de origen'),
    estado: PROV,
    notas: T('As três fontes medem coisas diferentes (dormidas, quem entra no posto de turismo, audiência digital); a comparação é indicativa.', 'The three sources measure different things (stays, people entering the tourist office, digital audience); the comparison is indicative.', 'Las tres fuentes miden cosas distintas (pernoctaciones, quien entra en la oficina, audiencia digital); la comparación es indicativa.'),
  },
  procura: {
    fontes: T('INE/TravelBI: dormidas e hóspedes nos estabelecimentos de alojamento turístico (Braga, Norte, Portugal)', 'INE/TravelBI: stays and guests in tourist accommodation (Braga, North, Portugal)', 'INE/TravelBI: pernoctaciones y huéspedes en alojamiento turístico (Braga, Norte, Portugal)'),
    periodo: T('Janeiro de 2019 a junho de 2026', 'January 2019 to June 2026', 'Enero de 2019 a junio de 2026'),
    extracao: T('Estatística_Turismo_Braga_2019-2025 e Estatística_Turismo_2026 (1.º semestre, ficheiro de 26/08/2026)', 'Estatística_Turismo_Braga_2019-2025 and Estatística_Turismo_2026 (1st half, file of 26/08/2026)', 'Estatística_Turismo_Braga_2019-2025 y Estatística_Turismo_2026 (1.er semestre, fichero del 26/08/2026)'),
    estado: T('2019–2024 definitivos; 2025 e 2026 provisórios (INE)', '2019–2024 final; 2025 and 2026 provisional (INE)', '2019–2024 definitivos; 2025 y 2026 provisionales (INE)'),
    notas: T('Índice de sazonalidade: % das dormidas do ano feitas de julho a setembro (INE, 2024).', 'Seasonality index: % of the year’s stays in July–September (INE, 2024).', 'Índice de estacionalidad: % de las pernoctaciones del año de julio a septiembre (INE, 2024).'),
  },
  estimativa: {
    fontes: T('Cálculo da plataforma sobre as dormidas do INE/TravelBI', 'Platform calculation on INE/TravelBI stays', 'Cálculo de la plataforma sobre las pernoctaciones del INE/TravelBI'),
    periodo: T('Real até junho de 2026; julho a dezembro estimados', 'Actual to June 2026; July to December estimated', 'Real hasta junio de 2026; julio a diciembre estimados'),
    extracao: T('Igual ao separador Procura', 'Same as the Demand tab', 'Igual a la pestaña Demanda'),
    estado: T('Projeção, não é um dado oficial', 'Projection, not official data', 'Proyección, no es un dato oficial'),
    notas: T('Mês em falta = mesmo mês de 2025 × (1 + crescimento acumulado de jan–jun). Intervalo: mês mais fraco e mais forte do ano.', 'Missing month = same month of 2025 × (1 + Jan–Jun cumulative growth). Range: weakest and strongest month of the year.', 'Mes que falta = mismo mes de 2025 × (1 + crecimiento acumulado ene–jun). Intervalo: mes más débil y más fuerte del año.'),
  },
  mercados: {
    fontes: T('INE/TravelBI (dormidas e hóspedes por país de residência); Atendimento de Balcão', 'INE/TravelBI (stays and guests by country of residence); Front Desk', 'INE/TravelBI (pernoctaciones y huéspedes por país de residencia); Oficina de Turismo'),
    periodo: T('INE: 2025 e 1.º semestre de 2026; balcão: 2026 até 24/09', 'INE: 2025 and 1st half 2026; front desk: 2026 to 24/09', 'INE: 2025 y 1.er semestre 2026; oficina: 2026 hasta 24/09'),
    extracao: T('Ficheiros INE; balcão exportado a 24/09/2026', 'INE files; front desk exported 24/09/2026', 'Ficheros INE; oficina exportada el 24/09/2026'),
    estado: PROV,
  },
  calendario: {
    fontes: T('Calendários oficiais de feriados e férias escolares (ver lista de fontes no separador) e rotas do Aeroporto do Porto', 'Official holiday and school calendars (see source list in the tab) and Porto Airport routes', 'Calendarios oficiales de festivos y vacaciones escolares (ver fuentes en la pestaña) y rutas del Aeropuerto de Oporto'),
    periodo: T('Outubro de 2026 a dezembro de 2027', 'October 2026 to December 2027', 'Octubre de 2026 a diciembre de 2027'),
    extracao: T('Consultado em outubro de 2026', 'Checked in October 2026', 'Consultado en octubre de 2026'),
    estado: T('Datas oficiais; as rotas aéreas podem mudar', 'Official dates; air routes may change', 'Fechas oficiales; las rutas aéreas pueden cambiar'),
  },
  aeroporto: {
    fontes: T('INE, Inquérito aos aeroportos: passageiros desembarcados no Aeroporto do Porto', 'INE airport survey: passengers landed at Porto Airport', 'INE, encuesta a aeropuertos: pasajeros desembarcados en el Aeropuerto de Oporto'),
    periodo: T('Agosto de 2023 a julho de 2026', 'August 2023 to July 2026', 'Agosto de 2023 a julio de 2026'),
    extracao: T('Quadro INE extraído a 28/09/2026 (atualizado pelo INE a 14/09/2026)', 'INE table extracted 28/09/2026 (updated by INE 14/09/2026)', 'Cuadro INE extraído el 28/09/2026 (actualizado por el INE el 14/09/2026)'),
    estado: PROV,
  },
  caminhos: {
    fontes: T('Serviço de Peregrinos da Catedral de Santiago (via Diário do Minho), Associação do Caminho da Geira e dos Arrieiros, Atendimento de Balcão, estudo USC/IDEGA (2018)', 'Santiago Pilgrim Office (via Diário do Minho), Geira and Arrieiros Way Association, Front Desk, USC/IDEGA study (2018)', 'Oficina del Peregrino (vía Diário do Minho), Asociación del Camino de la Geira y de los Arrieiros, Oficina de Turismo, estudio USC/IDEGA (2018)'),
    periodo: T('2022 a 2025 (partidas de Braga); balcão 2025–2026', '2022 to 2025 (departures from Braga); front desk 2025–2026', '2022 a 2025 (salidas desde Braga); oficina 2025–2026'),
    extracao: T('Publicações de 05/01/2025 e 05/01/2026; balcão exportado a 24/09/2026', 'Publications of 05/01/2025 and 05/01/2026; front desk exported 24/09/2026', 'Publicaciones del 05/01/2025 y 05/01/2026; oficina exportada el 24/09/2026'),
    estado: T('Compostelas emitidas (subestima o total de peregrinos)', 'Compostelas issued (underestimates total pilgrims)', 'Compostelas expedidas (subestima el total de peregrinos)'),
  },
  perfil: {
    fontes: T('Estudo de Perfil do Turista (Projeto de Criação de Experiências Turísticas Sustentáveis)', 'Visitor Profile Study (Sustainable Tourism Experiences project)', 'Estudio de Perfil del Turista (proyecto de Experiencias Turísticas Sostenibles)'),
    periodo: T('2025 · inquérito feito em Braga', '2025 · survey carried out in Braga', '2025 · encuesta realizada en Braga'),
    extracao: T('Exportação do SurveyMonkey de 07/05/2025 (336 respostas)', 'SurveyMonkey export of 07/05/2025 (336 answers)', 'Exportación de SurveyMonkey del 07/05/2025 (336 respuestas)'),
    estado: T('Base oficial: 336 respostas. Amostra não probabilística; o número de respostas varia por pergunta', 'Official base: 336 answers. Non-probability sample; the number of answers varies by question', 'Base oficial: 336 respuestas. Muestra no probabilística; el número de respuestas varía según la pregunta'),
    notas: T('O relatório anterior do estudo usava só as 112 respostas de 1 a 4 de março de 2025. A pergunta sobre o concelho de alojamento não é apresentada por ser incoerente com a pergunta sobre pernoita. Os gastos só existem como resumos em texto.', 'The earlier study report used only the 112 answers of 1–4 March 2025. The question on the municipality of stay is not shown because it is inconsistent with the overnight-stay question. Spending is only available as text summaries.', 'El informe anterior del estudio usaba solo las 112 respuestas del 1 al 4 de marzo de 2025. La pregunta sobre el municipio de alojamiento no se presenta por ser incoherente con la pregunta sobre la pernoctación. Los gastos solo existen como resúmenes de texto.'),
  },
  visitas: {
    fontes: T('Braga Smart Retail · Geoanalytics (geolocalização agregada e anónima)', 'Braga Smart Retail · Geoanalytics (aggregated, anonymous geolocation)', 'Braga Smart Retail · Geoanalytics (geolocalización agregada y anónima)'),
    periodo: T('9 de outubro a 31 de dezembro de 2025', '9 October to 31 December 2025', '9 de octubre a 31 de diciembre de 2025'),
    extracao: T('Exportado a 08/10/2026', 'Exported 08/10/2026', 'Exportado el 08/10/2026'),
    estado: T('Série curta; conta visitas, não pessoas', 'Short series; counts visits, not people', 'Serie corta; cuenta visitas, no personas'),
    notas: T('A exportação não tem dados de geolocalização a partir de 1/1/2026. «Passar a noite no concelho» inclui qualquer tipo de alojamento e não equivale a dormidas turísticas: em nov.–dez. de 2025 foram 421 028 visitas contra 56 802 hóspedes INE.', 'The export has no geolocation data from 1/1/2026. «Spending the night in the municipality» includes any type of lodging and is not equivalent to tourist overnight stays: in Nov–Dec 2025 there were 421,028 visits vs 56,802 INE guests.', 'La exportación no tiene datos de geolocalización desde el 1/1/2026. «Pasar la noche en el municipio» incluye cualquier tipo de alojamiento y no equivale a pernoctaciones turísticas: en nov.–dic. de 2025 hubo 421 028 visitas frente a 56 802 huéspedes del INE.'),
  },
  balcao: {
    fontes: T('Registo de atendimento do Posto de Turismo (Visit Braga)', 'Tourist Office front-desk records (Visit Braga)', 'Registro de atención de la Oficina de Turismo (Visit Braga)'),
    periodo: T('1 de janeiro de 2025 a 24 de setembro de 2026', '1 January 2025 to 24 September 2026', '1 de enero de 2025 a 24 de septiembre de 2026'),
    extracao: T('Exportado a 24/09/2026', 'Exported 24/09/2026', 'Exportado el 24/09/2026'),
    estado: T('2026 parcial; 2025 com registo incompleto', '2026 partial; 2025 incompletely recorded', '2026 parcial; 2025 con registro incompleto'),
  },
  economia: {
    fontes: T('INE/TravelBI (proveitos, RevPAR, ADR, ocupação, capacidade); listagens municipais de AL e empreendimentos turísticos', 'INE/TravelBI (revenue, RevPAR, ADR, occupancy, capacity); municipal lists of short-term rentals and tourist establishments', 'INE/TravelBI (ingresos, RevPAR, ADR, ocupación, capacidad); listados municipales de AL y establecimientos turísticos'),
    periodo: T('2017 a 2025 e 1.º semestre de 2026', '2017 to 2025 and 1st half 2026', '2017 a 2025 y 1.er semestre 2026'),
    extracao: T('Ficheiros INE; listagens municipais até março de 2026', 'INE files; municipal lists to March 2026', 'Ficheros INE; listados municipales hasta marzo de 2026'),
    estado: PROV,
  },
  emprego: {
    fontes: T('INE (SCIE) e PORDATA: pessoal ao serviço; INE/MTSSS-GEP (Quadros de Pessoal): ganho médio', 'INE (SCIE) and PORDATA: persons employed; INE/MTSSS-GEP: average earnings', 'INE (SCIE) y PORDATA: personal ocupado; INE/MTSSS-GEP: ganancia media'),
    periodo: T('2022 a 2024 (emprego); 2021 a 2024 (ganho)', '2022 to 2024 (employment); 2021 to 2024 (earnings)', '2022 a 2024 (empleo); 2021 a 2024 (ganancia)'),
    extracao: T('INE atualizado a 11/12/2025 e 27/03/2026; PORDATA a 24/12/2025; quadros extraídos a 01/10/2026', 'INE updated 11/12/2025 and 27/03/2026; PORDATA 24/12/2025; tables extracted 01/10/2026', 'INE actualizado el 11/12/2025 y 27/03/2026; PORDATA el 24/12/2025; cuadros extraídos el 01/10/2026'),
    estado: T('Definitivo (último ano publicado)', 'Final (latest published year)', 'Definitivo (último año publicado)'),
  },
  cartoes: {
    fontes: T('SIBS Analytics: operações com cartões no concelho de Braga', 'SIBS Analytics: card operations in Braga', 'SIBS Analytics: operaciones con tarjeta en Braga'),
    periodo: T('Janeiro de 2025 a janeiro de 2026 (13 meses)', 'January 2025 to January 2026 (13 months)', 'Enero de 2025 a enero de 2026 (13 meses)'),
    extracao: T('Exportado a 28/09/2026', 'Exported 28/09/2026', 'Exportado el 28/09/2026'),
    estado: T('Valores arredondados pela SIBS; faltam meses no ficheiro mensal', 'Values rounded by SIBS; months missing in the monthly file', 'Valores redondeados por SIBS; faltan meses en el fichero mensual'),
    notas: T('A evolução no tempo usa o ficheiro mensal (pagamentos eletrónicos +6% a +19% em termos homólogos; numerário −1% a −7%). A variação anual do ficheiro de concelhos (−1% para Braga) não coincide com o ficheiro mensal e não é mostrada.', 'Trends over time use the monthly file (electronic payments +6% to +19% year on year; cash −1% to −7%). The annual change in the municipalities file (−1% for Braga) does not match the monthly file and is not shown.', 'La evolución en el tiempo usa el fichero mensual (pagos electrónicos +6 % a +19 % interanual; efectivo −1 % a −7 %). La variación anual del fichero de municipios (−1 % para Braga) no coincide con el fichero mensual y no se muestra.'),
  },
  taxa: {
    fontes: T('Município de Braga: faturação da Taxa Municipal Turística; Regulamento n.º 927/2025', 'Braga City Council: Municipal Tourist Tax invoicing; Regulation no. 927/2025', 'Ayuntamiento de Braga: facturación de la Tasa Municipal Turística; Reglamento n.º 927/2025'),
    periodo: T('2021 a junho de 2026', '2021 to June 2026', '2021 a junio de 2026'),
    extracao: NI,
    estado: T('Até março de 2026: faturação emitida; abril a junho de 2026: cobrado até 30/06/2026 (provisório)', 'To March 2026: invoices issued; April–June 2026: collected to 30/06/2026 (provisional)', 'Hasta marzo de 2026: facturación emitida; abril a junio de 2026: cobrado hasta el 30/06/2026 (provisional)'),
  },
  hotelaria: {
    fontes: T('visitbraga.travel · Meet Braga · lista de alojamento', 'visitbraga.travel · Meet Braga · accommodation list', 'visitbraga.travel · Meet Braga · lista de alojamiento'),
    periodo: T('Situação em setembro de 2026', 'Status in September 2026', 'Situación en septiembre de 2026'),
    extracao: T('Consultado a 30/09/2026', 'Checked 30/09/2026', 'Consultado el 30/09/2026'),
    estado: T('Lista promocional, não é um censo oficial', 'Promotional list, not an official census', 'Lista promocional, no es un censo oficial'),
  },
  alojamento: {
    fontes: T('Plataforma municipal da taxa turística (base de estabelecimentos); RNAL/TravelBI (coordenadas do mapa); INE Censos 2021', 'Municipal tourist tax platform (establishments); RNAL/TravelBI (map coordinates); INE Census 2021', 'Plataforma municipal de la tasa turística; RNAL/TravelBI (coordenadas); INE Censos 2021'),
    periodo: T('Situação em outubro de 2026', 'Status in October 2026', 'Situación en octubre de 2026'),
    extracao: T('Exportação de outubro de 2026', 'October 2026 export', 'Exportación de octubre de 2026'),
    estado: T('Coordenadas marcadas como não fiáveis na origem', 'Coordinates flagged as unreliable at source', 'Coordenadas marcadas como no fiables en origen'),
  },
  animacao: {
    fontes: T('RNAAT · base de dados do Município de Braga', 'RNAAT · Braga City Council database', 'RNAAT · base de datos del Ayuntamiento de Braga'),
    periodo: T('Registos até 2025', 'Registrations up to 2025', 'Registros hasta 2025'),
    extracao: NI,
    estado: T('O ficheiro não indica se as empresas estão ativas', 'The file does not say whether companies are active', 'El fichero no indica si las empresas están activas'),
  },
  cultura: {
    fontes: T('FazCultura: bilheteira do Theatro Circo, gnration e BMA', 'FazCultura: ticketing for Theatro Circo, gnration and BMA', 'FazCultura: taquilla de Theatro Circo, gnration y BMA'),
    periodo: T('Janeiro de 2025 a abril de 2026 (BMA: sem registos em ago 2025, mar e abr 2026)', 'January 2025 to April 2026 (BMA: no records Aug 2025, Mar and Apr 2026)', 'Enero de 2025 a abril de 2026 (BMA: sin registros en ago 2025, mar y abr 2026)'),
    extracao: NI,
    estado: T('Sessões online excluídas', 'Online sessions excluded', 'Sesiones online excluidas'),
  },
  lojas: {
    fontes: T('Município de Braga · brochura Lojas com História', 'Braga City Council · Historic Shops brochure', 'Ayuntamiento de Braga · folleto Tiendas con Historia'),
    periodo: T('Edição em vigor da brochura', 'Current brochure edition', 'Edición vigente del folleto'),
    extracao: NI,
    estado: T('Nem todas as fichas indicam o ano de fundação', 'Not every entry gives a founding year', 'No todas las fichas indican el año de fundación'),
  },
  digital: {
    fontes: T('Google Analytics 4 e Google Search Console do visitbraga.travel', 'Google Analytics 4 and Google Search Console of visitbraga.travel', 'Google Analytics 4 y Google Search Console de visitbraga.travel'),
    periodo: T('28/07/2025 a 10/03/2026 (antes do ataque) e 01/07 a 23/09/2026 (retoma); Search Console até 24/09/2026', '28/07/2025 to 10/03/2026 (before the attack) and 01/07 to 23/09/2026 (recovery); Search Console to 24/09/2026', '28/07/2025 a 10/03/2026 (antes del ataque) y 01/07 a 23/09/2026 (recuperación); Search Console hasta 24/09/2026'),
    extracao: NI,
    estado: T('Tráfego da China tratado como automático', 'Traffic from China treated as automated', 'Tráfico de China tratado como automático'),
  },
  ferramentas: {
    fontes: T('TOMI Analytics (mupis), SmartGuide Analytics e relatório Super Fan (confidencial, só administração)', 'TOMI Analytics (kiosks), SmartGuide Analytics and Super Fan report (confidential, admin only)', 'TOMI Analytics (mupis), SmartGuide Analytics e informe Super Fan (confidencial, solo administración)'),
    periodo: T('TOMI: 2025 e 1 jan a 29 mai 2026; SmartGuide: 1 jan a 28 mai 2026', 'TOMI: 2025 and 1 Jan–29 May 2026; SmartGuide: 1 Jan–28 May 2026', 'TOMI: 2025 y 1 ene–29 may 2026; SmartGuide: 1 ene–28 may 2026'),
    extracao: NI,
    estado: T('A contagem de peões do TOMI muda a partir de setembro de 2025', 'TOMI pedestrian counting changes from September 2025', 'El conteo de peatones de TOMI cambia a partir de septiembre de 2025'),
  },
  sustentabilidade: {
    fontes: T('Barómetro de Perceção dos Residentes 2026; App Eco (piloto); Green Destinations · Tourism Impact Assessment 2025; INE; PAESC', 'Residents Perception Barometer 2026; App Eco (pilot); Green Destinations TIA 2025; INE; SECAP', 'Barómetro de Percepción de los Residentes 2026; App Eco (piloto); Green Destinations TIA 2025; INE; PACES'),
    periodo: T('Barómetro: 29/04 a 10/05/2026; TIA: 2025; PAESC: 2008–2024', 'Barometer: 29/04–10/05/2026; TIA: 2025; SECAP: 2008–2024', 'Barómetro: 29/04–10/05/2026; TIA: 2025; PACES: 2008–2024'),
    extracao: NI,
    estado: T('Barómetro com amostra não probabilística; App Eco com 15 submissões', 'Barometer with non-probabilistic sample; App Eco with 15 submissions', 'Barómetro con muestra no probabilística; App Eco con 15 envíos'),
  },
  mobilidade: {
    fontes: T('TUB – Transportes Urbanos de Braga: validações por paragem e relatórios de operação', 'TUB: validations by stop and operating reports', 'TUB: validaciones por parada e informes de operación'),
    periodo: T('1 de janeiro a 30 de setembro de 2026', '1 January to 30 September 2026', '1 de enero a 30 de septiembre de 2026'),
    extracao: NI,
    estado: T('Entradas (validações), não pessoas diferentes', 'Boardings (validations), not distinct people', 'Subidas (validaciones), no personas distintas'),
  },
  urbana: {
    fontes: T('Braga Smart Retail · Monitorização da Mobilidade Urbana; Invipo (parques)', 'Braga Smart Retail · Urban Mobility Monitoring; Invipo (car parks)', 'Braga Smart Retail · Monitorización de la Movilidad Urbana; Invipo (aparcamientos)'),
    periodo: T('Tráfego, percursos e TUB: período não indicado na exportação; parques: 22/06 a 08/10/2026', 'Traffic, routes and TUB: period not stated in the export; car parks: 22/06–08/10/2026', 'Tráfico, recorridos y TUB: periodo no indicado en la exportación; aparcamientos: 22/06–08/10/2026'),
    extracao: T('Exportado a 08/10/2026', 'Exported 08/10/2026', 'Exportado el 08/10/2026'),
    estado: T('Apresentado em percentagens e rankings', 'Shown as percentages and rankings', 'Presentado en porcentajes y rankings'),
  },
  bairros: {
    fontes: T('Braga Smart Retail · Pessoas no Bairro (Wi-Fi) e chegadas ao Centro Coordenador de Transportes', 'Braga Smart Retail · People in the District (Wi-Fi) and coach station arrivals', 'Braga Smart Retail · Personas en el Barrio (wifi) y llegadas al Centro Coordinador de Transportes'),
    periodo: T('Wi-Fi: 1/1 a 7/10/2026; autocarros: 9/10/2025 a 7/10/2026', 'Wi-Fi: 1/1–7/10/2026; coaches: 9/10/2025–7/10/2026', 'Wifi: 1/1–7/10/2026; autobuses: 9/10/2025–7/10/2026'),
    extracao: T('Exportado a 08/10/2026', 'Exported 08/10/2026', 'Exportado el 08/10/2026'),
    estado: T('Conta dispositivos, não pessoas', 'Counts devices, not people', 'Cuenta dispositivos, no personas'),
  },
  acessibilidade: {
    fontes: T('Registo de atendimento do Posto de Turismo (campo «necessidades especiais»)', 'Tourist Office records («special needs» field)', 'Registro de la Oficina de Turismo (campo «necesidades especiales»)'),
    periodo: T('1 de janeiro a 24 de setembro de 2026', '1 January to 24 September 2026', '1 de enero a 24 de septiembre de 2026'),
    extracao: T('Exportado a 24/09/2026', 'Exported 24/09/2026', 'Exportado el 24/09/2026'),
    estado: T('Campo pouco preenchido; ponto de partida', 'Field rarely filled in; starting point', 'Campo poco cumplimentado; punto de partida'),
  },
  meteo: {
    fontes: T('Open-Meteo (arquivo meteorológico) e atendimentos diários do balcão', 'Open-Meteo (weather archive) and daily front-desk visits', 'Open-Meteo (archivo meteorológico) y atenciones diarias de la oficina'),
    periodo: T('2 de janeiro de 2025 a 16 de junho de 2026', '2 January 2025 to 16 June 2026', '2 de enero de 2025 a 16 de junio de 2026'),
    extracao: T('Balcão: relatórios de 16/06/2026; meteorologia obtida no momento', 'Front desk: reports of 16/06/2026; weather fetched live', 'Oficina: informes del 16/06/2026; meteorología obtenida en el momento'),
    estado: T('Correlação, não causalidade', 'Correlation, not causation', 'Correlación, no causalidad'),
  },
  eventos: {
    fontes: T('Séries diárias: Wi-Fi e autocarros (Braga Smart Retail), validações TUB, parques (Invipo); datas dos eventos em fontes públicas; Noite Branca: estudo de impacto económico da AEB com dados da SIBS (O Minho, 08/10/2026; Correio do Minho, 09/10/2026)', 'Daily series: Wi-Fi and coaches (Braga Smart Retail), TUB validations, car parks (Invipo); event dates from public sources; Noite Branca: AEB economic impact study with SIBS data (O Minho, 08/10/2026; Correio do Minho, 09/10/2026)', 'Series diarias: wifi y autobuses (Braga Smart Retail), validaciones TUB, aparcamientos (Invipo); fechas de eventos en fuentes públicas; Noite Branca: estudio de impacto económico de la AEB con datos de SIBS (O Minho, 08/10/2026; Correio do Minho, 09/10/2026)'),
    periodo: T('2026 (cada série com o seu período)', '2026 (each series with its own period)', '2026 (cada serie con su periodo)'),
    extracao: T('Braga Smart Retail exportado a 08/10/2026; TUB até 30/09/2026', 'Braga Smart Retail exported 08/10/2026; TUB to 30/09/2026', 'Braga Smart Retail exportado el 08/10/2026; TUB hasta el 30/09/2026'),
    estado: T('Comparação indicativa; não isola o efeito do evento de outros fatores', 'Indicative comparison; does not isolate the event from other factors', 'Comparación indicativa; no aísla el efecto del evento de otros factores'),
  },
};

// Registo de correções feitas aos dados e textos (mais recentes primeiro).
export interface Correcao { data: string; separador: string; texto: T3 }
export const REGISTO_CORRECOES: Correcao[] = [
  { data: '2026-10-09', separador: 'visitas', texto: T('«Com dormida» passou a «com noite no concelho», com comparação com os hóspedes do INE, para não ser confundido com dormidas turísticas.', '«Overnight» renamed «with a night in the municipality», with a comparison against INE guests, so it is not mistaken for tourist overnight stays.', '«Con pernoctación» pasa a «con noche en el municipio», con comparación con los huéspedes del INE, para no confundirlo con pernoctaciones turísticas.') },
  { data: '2026-10-09', separador: 'cartoes', texto: T('A variação anual do ficheiro de concelhos da SIBS (−1% para Braga) deixou de ser mostrada; a evolução usa só o ficheiro mensal, mais detalhado.', 'The annual change in SIBS’s municipalities file (−1% for Braga) is no longer shown; trends use only the more detailed monthly file.', 'La variación anual del fichero de municipios de SIBS (−1 % para Braga) deja de mostrarse; la evolución usa solo el fichero mensual, más detallado.') },
  { data: '2026-10-09', separador: 'eventos', texto: T('Noite Branca: acrescentado o método da AEB para os 11,25 M€ (comparação com a média das semanas anteriores e com períodos homólogos, dados SIBS) e os dados da restauração.', 'Noite Branca: AEB method for the €11.25M added (comparison with the average of previous weeks and equivalent periods, SIBS data) and restaurant data.', 'Noite Branca: se añade el método de la AEB para los 11,25 M€ (comparación con la media de las semanas anteriores y con periodos homólogos, datos de SIBS) y los datos de restauración.') },
  { data: '2026-10-09', separador: 'perfil', texto: T('Perfil do turista passa a usar a exportação completa do inquérito (336 respostas, 7/5/2025) em vez das 112 respostas de março de 2025; acrescentados satisfação, locais visitados e informação no destino; a pergunta sobre o concelho de alojamento não é usada por ser incoerente.', 'Visitor profile now uses the full survey export (336 answers, 7/5/2025) instead of the 112 answers of March 2025; satisfaction, places visited and information at the destination added; the question on the municipality of stay is not used because it is inconsistent.', 'El perfil del turista pasa a usar la exportación completa de la encuesta (336 respuestas, 7/5/2025) en lugar de las 112 respuestas de marzo de 2025; se añaden satisfacción, lugares visitados e información en destino; la pregunta sobre el municipio de alojamiento no se usa por ser incoherente.') },
  { data: '2026-10-09', separador: 'procura', texto: T('Dormidas de 2025 corrigidas para 692 238 (+2,0%), conforme o ficheiro INE 2019–2025; julho a dezembro de 2025 repostos a partir do mesmo ficheiro.', '2025 stays corrected to 692,238 (+2.0%), per the INE 2019–2025 file; July–December 2025 restored from the same file.', 'Pernoctaciones de 2025 corregidas a 692 238 (+2,0 %), según el fichero INE 2019–2025; julio a diciembre de 2025 repuestos del mismo fichero.') },
  { data: '2026-10-09', separador: 'mercados', texto: T('Ordem dos mercados de 2025 corrigida (Espanha, Reino Unido, Brasil, França…).', '2025 market order corrected (Spain, United Kingdom, Brazil, France…).', 'Orden de los mercados de 2025 corregido (España, Reino Unido, Brasil, Francia…).') },
  { data: '2026-10-09', separador: 'economia', texto: T('Ocupação-cama 2024 (47,3%) e proveitos 2024 (39,0 M€) corrigidos; possível quebra de série no ADR assinalada.', '2024 bed occupancy (47.3%) and 2024 revenue (€39.0M) corrected; possible ADR series break flagged.', 'Ocupación por plaza 2024 (47,3 %) e ingresos 2024 (39,0 M€) corregidos; posible ruptura de serie del ADR señalada.') },
  { data: '2026-10-09', separador: 'taxa', texto: T('Regras confirmadas no Regulamento n.º 927/2025: hóspedes com 16 ou mais anos; valores designados como faturação.', 'Rules confirmed in Regulation no. 927/2025: guests aged 16 or over; values labelled as invoicing.', 'Reglas confirmadas en el Reglamento n.º 927/2025: huéspedes de 16 años o más; valores designados como facturación.') },
  { data: '2026-10-09', separador: 'caminhos', texto: T('Percurso da Geira corrigido (sem Melgaço); acumulado atualizado para 7 785 peregrinos; números do balcão alinhados com o separador Balcão.', 'Geira route corrected (no Melgaço); cumulative updated to 7,785 pilgrims; front-desk figures aligned with the Front Desk tab.', 'Recorrido de la Geira corregido (sin Melgaço); acumulado actualizado a 7 785 peregrinos; cifras de la oficina alineadas con la pestaña Oficina.') },
  { data: '2026-10-09', separador: 'sustentabilidade', texto: T('Retiradas as afirmações «1.ª cidade portuguesa» e «uma de 5 no mundo» (sem fonte); frota TUB recalculada a partir do TIA (48%).', 'Removed the unsourced claims «1st Portuguese city» and «one of 5 worldwide»; TUB fleet recalculated from the TIA (48%).', 'Retiradas las afirmaciones sin fuente «1.ª ciudad portuguesa» y «una de 5 en el mundo»; flota TUB recalculada a partir del TIA (48 %).') },
  { data: '2026-10-09', separador: 'cartoes', texto: T('Interpretação sobre a diáspora passou a hipótese; períodos diferentes de SIBS e INE assinalados.', 'Diaspora interpretation turned into a hypothesis; different SIBS and INE periods flagged.', 'La interpretación sobre la diáspora pasó a hipótesis; periodos distintos de SIBS e INE señalados.') },
  { data: '2026-10-09', separador: 'bairros', texto: T('«Pessoas» passou a «dispositivos»; média diária recalculada (346); zonas descritas como soma de contagens diárias.', '«People» became «devices»; daily average recalculated (346); zones described as sum of daily counts.', '«Personas» pasó a «dispositivos»; media diaria recalculada (346); zonas descritas como suma de conteos diarios.') },
  { data: '2026-10-09', separador: 'urbana', texto: T('Exportações sem período assinaladas em cada gráfico.', 'Exports without a period flagged on each chart.', 'Exportaciones sin periodo señaladas en cada gráfico.') },
  { data: '2026-10-09', separador: 'acessibilidade', texto: T('Atualizado com a exportação de 24/09/2026 (30 registos).', 'Updated with the 24/09/2026 export (30 records).', 'Actualizado con la exportación del 24/09/2026 (30 registros).') },
  { data: '2026-10-09', separador: 'calendario', texto: T('Acrescentados feriados em falta (Portugal e Galiza 2027); retirado um feriado de Valência que calha a um sábado.', 'Missing holidays added (Portugal and Galicia 2027); a Valencia holiday falling on a Saturday removed.', 'Añadidos festivos que faltaban (Portugal y Galicia 2027); retirado un festivo de Valencia que cae en sábado.') },
  { data: '2026-10-09', separador: 'geral', texto: T('Frases de causa-efeito sem suporte nos dados reformuladas como hipóteses.', 'Cause-and-effect sentences without data support reworded as hypotheses.', 'Frases de causa-efecto sin apoyo en los datos reformuladas como hipótesis.') },
];
