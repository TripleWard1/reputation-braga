// Braga no mundo: feiras, projetos e cooperação, e distinções do destino.
// Feiras e projetos: lista da Divisão de Atividades Económicas e Turismo (2023–2027), revista linha a linha.
// Distinções: só as confirmadas em fontes públicas (indicadas em "fonte"). Não incluir nada sem fonte.
// Datas no formato AAAA-MM-DD; a plataforma escreve-as em cada língua e sabe o que já aconteceu.

export type Texto3 = { pt: string; en: string; es: string };
export interface Evento { nome: string | Texto3; cidade?: string; pais: string; ini: string; fim?: string; tipo?: TipoProjeto; aConfirmar?: Texto3; foto?: string }
export type TipoProjeto = 'europeu' | 'conferencia' | 'visita' | 'imprensa' | 'evento' | 'candidatura';

export const TIPOS_PROJETO: Record<TipoProjeto, Texto3> = {
  europeu: { pt: 'Projeto europeu', en: 'EU project', es: 'Proyecto europeo' },
  conferencia: { pt: 'Conferência e redes', en: 'Conference and networks', es: 'Conferencia y redes' },
  visita: { pt: 'Visita e intercâmbio', en: 'Visit and exchange', es: 'Visita e intercambio' },
  imprensa: { pt: 'Imprensa e operadores', en: 'Press and operators', es: 'Prensa y operadores' },
  evento: { pt: 'Evento e presença', en: 'Event and presence', es: 'Evento y presencia' },
  candidatura: { pt: 'Candidatura europeia', en: 'European bid', es: 'Candidatura europea' },
};

const t3 = (pt: string, en: string, es: string): Texto3 => ({ pt, en, es });

export const FEIRAS: Evento[] = [
  // 2023
  { nome: 'FITUR', cidade: 'Madrid', pais: 'es', ini: '2023-01-17', fim: '2023-01-22' },
  { nome: 'NavarTur', cidade: 'Pamplona', pais: 'es', ini: '2023-02-23', fim: '2023-02-26' },
  { nome: t3('Bolsa de Turismo de Lisboa (BTL)', 'Lisbon Tourism Fair (BTL)', 'Bolsa de Turismo de Lisboa (BTL)'), cidade: 'Lisboa', pais: 'pt', ini: '2023-03-01', fim: '2023-03-05', foto: '/internacional/btl-2023.jpg' },
  { nome: t3('Feira de Lyon', 'Lyon Fair', 'Feria de Lyon'), cidade: 'Lyon', pais: 'fr', ini: '2023-03-02', fim: '2023-03-05' },
  { nome: 'Salon Mondial du Tourisme', cidade: 'Paris', pais: 'fr', ini: '2023-03-15', fim: '2023-03-19' },
  { nome: 'B-Travel', cidade: 'Barcelona', pais: 'es', ini: '2023-03-23', fim: '2023-03-26' },
  { nome: 'AGRO 2023', cidade: 'Braga', pais: 'pt', ini: '2023-03-30', fim: '2023-04-02' },
  { nome: 'ExpoVacaciones', cidade: 'Bilbao', pais: 'es', ini: '2023-05-04', fim: '2023-05-07' },
  { nome: 'TurExpo', cidade: 'Silleda', pais: 'es', ini: '2023-06-07', fim: '2023-06-11' },
  { nome: 'ExpoCidades', cidade: 'Valongo', pais: 'pt', ini: '2023-09-05', fim: '2023-09-10' },
  { nome: 'Fairway', cidade: 'Santiago de Compostela', pais: 'es', ini: '2023-10-31', fim: '2023-11-03' },
  { nome: 'Xantar', cidade: 'Ourense', pais: 'es', ini: '2023-11-01', fim: '2023-11-05' },
  // 2024
  { nome: 'FITUR', cidade: 'Madrid', pais: 'es', ini: '2024-01-23', fim: '2024-01-29', foto: '/internacional/fitur-2024.jpg' },
  { nome: t3('Feira de Bruxelas', 'Brussels Fair', 'Feria de Bruselas'), cidade: 'Bruxelas', pais: 'be', ini: '2024-01-31', fim: '2024-02-05' },
  { nome: 'NavarTur', cidade: 'Pamplona', pais: 'es', ini: '2024-02-22', fim: '2024-02-25' },
  { nome: t3('XI Workshop de Turismo Religioso', '11th Religious Tourism Workshop', 'XI Workshop de Turismo Religioso'), pais: 'pt', ini: '2024-02-22', fim: '2024-02-23' },
  { nome: t3('Bolsa de Turismo de Lisboa (BTL)', 'Lisbon Tourism Fair (BTL)', 'Bolsa de Turismo de Lisboa (BTL)'), cidade: 'Lisboa', pais: 'pt', ini: '2024-02-27', fim: '2024-03-03' },
  { nome: t3('Gala dos World Travel Awards e ITB', 'World Travel Awards gala and ITB', 'Gala de los World Travel Awards e ITB'), cidade: 'Berlim', pais: 'de', ini: '2024-03-05', fim: '2024-03-07' },
  { nome: 'B-Travel', cidade: 'Barcelona', pais: 'es', ini: '2024-03-14', fim: '2024-03-18' },
  { nome: 'AGRO 2024', cidade: 'Braga', pais: 'pt', ini: '2024-03-21', fim: '2024-03-24' },
  { nome: 'ExpoVacaciones', cidade: 'Bilbao', pais: 'es', ini: '2024-05-09', fim: '2024-05-13' },
  { nome: t3('Fórum do Peregrino', 'Pilgrim Forum', 'Foro del Peregrino'), cidade: 'Viana do Castelo', pais: 'pt', ini: '2024-05-16', fim: '2024-05-17' },
  { nome: 'TurExpo', cidade: 'Silleda', pais: 'es', ini: '2024-05-29', fim: '2024-06-03' },
  { nome: 'Xantar', cidade: 'Ourense', pais: 'es', ini: '2024-10-23', fim: '2024-10-27' },
  { nome: 'Swiss International Holiday Exhibition', pais: 'ch', ini: '2024-10-31', fim: '2024-11-04' },
  { nome: 'INTUR', cidade: 'Valladolid', pais: 'es', ini: '2024-11-13', fim: '2024-11-18' },
  // 2025
  { nome: 'Vakantiebeurs', cidade: 'Utrecht', pais: 'nl', ini: '2025-01-08', fim: '2025-01-13', foto: '/internacional/vakantiebeurs-2025.jpg' },
  { nome: 'FITUR', cidade: 'Madrid', pais: 'es', ini: '2025-01-21', fim: '2025-01-27' },
  { nome: 'NavarTur', cidade: 'Pamplona', pais: 'es', ini: '2025-02-20', fim: '2025-02-24' },
  { nome: 'Fiets en Wandelbeurs', cidade: 'Gent', pais: 'be', ini: '2025-02-28', fim: '2025-03-03', foto: '/internacional/gent-2025.jpg' },
  { nome: t3('IWRT · Turismo Religioso', 'IWRT · Religious Tourism', 'IWRT · Turismo Religioso'), cidade: 'Fátima', pais: 'pt', ini: '2025-03-05', fim: '2025-03-07' },
  { nome: t3('Bolsa de Turismo de Lisboa (BTL)', 'Lisbon Tourism Fair (BTL)', 'Bolsa de Turismo de Lisboa (BTL)'), cidade: 'Lisboa', pais: 'pt', ini: '2025-03-11', fim: '2025-03-16' },
  { nome: 'B-Travel', cidade: 'Barcelona', pais: 'es', ini: '2025-03-27', fim: '2025-03-31' },
  { nome: 'AGRO 2025', cidade: 'Braga', pais: 'pt', ini: '2025-04-03', fim: '2025-04-06' },
  { nome: 'ExpoCidades', cidade: 'Sarria', pais: 'es', ini: '2025-05-01', fim: '2025-05-04' },
  { nome: 'ExpoVacaciones', cidade: 'Bilbao', pais: 'es', ini: '2025-05-08', fim: '2025-05-12' },
  { nome: 'TurExpo', cidade: 'Silleda', pais: 'es', ini: '2025-06-04', fim: '2025-06-08' },
  { nome: 'QSP Summit', cidade: 'Matosinhos', pais: 'pt', ini: '2025-07-01', fim: '2025-07-03', foto: '/internacional/qsp-summit-2025.jpg' },
  { nome: 'Fairway', cidade: 'Santiago de Compostela', pais: 'es', ini: '2025-11-08', fim: '2025-11-11' },
  { nome: 'INTUR', cidade: 'Valladolid', pais: 'es', ini: '2025-11-12', fim: '2025-11-17' },
  { nome: 'Xantar', cidade: 'Ourense', pais: 'es', ini: '2025-11-18', fim: '2025-11-23' },
  // 2026
  { nome: 'FITUR', cidade: 'Madrid', pais: 'es', ini: '2026-01-20', fim: '2026-01-26', foto: '/internacional/fitur-2026.jpg' },
  { nome: 'NavarTur', cidade: 'Pamplona', pais: 'es', ini: '2026-02-19', fim: '2026-02-23', foto: '/internacional/navartur-2026.jpg' },
  { nome: 'Better Tourism Lisbon Travel Market (BTL)', cidade: 'Lisboa', pais: 'pt', ini: '2026-02-24', fim: '2026-03-01' },
  { nome: 'B-Travel', cidade: 'Barcelona', pais: 'es', ini: '2026-03-19', fim: '2026-03-23' },
  { nome: 'AGRO 2026', cidade: 'Braga', pais: 'pt', ini: '2026-03-26', fim: '2026-03-29' },
  { nome: 'ExpoCidades', cidade: 'Amarante', pais: 'pt', ini: '2026-05-07', fim: '2026-05-10' },
  { nome: 'ExpoVacaciones', cidade: 'Bilbao', pais: 'es', ini: '2026-05-07', fim: '2026-05-11' },
  { nome: 'TurExpo', cidade: 'Silleda', pais: 'es', ini: '2026-06-03', fim: '2026-06-07' },
  { nome: 'INTUR', cidade: 'Valladolid', pais: 'es', ini: '2026-11-11', fim: '2026-11-16' },
  { nome: 'Xantar', cidade: 'Ourense', pais: 'es', ini: '2026-11-18', fim: '2026-11-22' },
  // 2027
  { nome: 'Washington DC Travel & Adventure Show', cidade: 'Washington DC', pais: 'us', ini: '2027-01-14', fim: '2027-01-19' },
  { nome: 'FITUR', cidade: 'Madrid', pais: 'es', ini: '2027-01-19', fim: '2027-01-27' },
];

export const PROJETOS: Evento[] = [
  // 2023
  { nome: t3('Rampa da Falperra', 'Rampa da Falperra hill climb', 'Rampa da Falperra'), cidade: 'Braga', pais: 'pt', ini: '2023-05-19', fim: '2023-05-21', tipo: 'evento' },
  { nome: t3('Semana do Turismo (AEB)', 'Tourism Week (AEB)', 'Semana del Turismo (AEB)'), cidade: 'Braga', pais: 'pt', ini: '2023-10-20', fim: '2023-10-29', tipo: 'evento' },
  { nome: t3('Conferência Urban Tourism', 'Urban Tourism Conference', 'Conferencia Urban Tourism'), cidade: 'Kranj', pais: 'si', ini: '2023-11-08', fim: '2023-11-10', tipo: 'conferencia' },
  { nome: t3('URBACT Cities After Dark · reunião transnacional', 'URBACT Cities After Dark · transnational meeting', 'URBACT Cities After Dark · reunión transnacional'), cidade: 'Braga', pais: 'pt', ini: '2023-11-14', fim: '2023-11-16', tipo: 'europeu' },
  { nome: t3('Press trip · jornalista francês', 'Press trip · French journalist', 'Viaje de prensa · periodista francés'), cidade: 'Braga', pais: 'pt', ini: '2023-12-14', fim: '2023-12-17', tipo: 'imprensa' },
  // 2024
  { nome: t3('Rampa da Falperra', 'Rampa da Falperra hill climb', 'Rampa da Falperra'), cidade: 'Braga', pais: 'pt', ini: '2024-05-17', fim: '2024-05-19', tipo: 'evento' },
  { nome: t3('Posto de Turismo descentralizado · Fórum Braga (Design Commit)', 'Pop-up tourist office · Fórum Braga (Design Commit)', 'Oficina de turismo descentralizada · Fórum Braga (Design Commit)'), cidade: 'Braga', pais: 'pt', ini: '2024-05-20', fim: '2024-05-22', tipo: 'evento' },
  { nome: 'EUROCITIES', cidade: 'Cluj', pais: 'ro', ini: '2024-05-29', fim: '2024-05-31', tipo: 'conferencia' },
  { nome: t3('16.ª Conferência Anual da Rede de Cidades Criativas da UNESCO (anfitriã)', '16th UNESCO Creative Cities Network Annual Conference (host)', '16.ª Conferencia Anual de la Red de Ciudades Creativas de la UNESCO (anfitriona)'), cidade: 'Braga', pais: 'pt', ini: '2024-07-01', fim: '2024-07-05', tipo: 'conferencia' },
  { nome: t3('Projeto POST · Braga Hackathon', 'POST project · Braga Hackathon', 'Proyecto POST · Braga Hackathon'), cidade: 'Braga', pais: 'pt', ini: '2024-07-09', tipo: 'europeu' },
  { nome: t3('Press trip · Bélgica', 'Press trip · Belgium', 'Viaje de prensa · Bélgica'), cidade: 'Braga', pais: 'pt', ini: '2024-07-31', fim: '2024-08-02', tipo: 'imprensa' },
  { nome: t3('31.º Congresso Internacional de Física · stand móvel Altice', '31st International Physics Congress · Altice mobile stand', '31.º Congreso Internacional de Física · stand móvil Altice'), pais: 'pt', ini: '2024-09-02', fim: '2024-09-04', tipo: 'evento' },
  { nome: t3('Presença institucional · Feira Gastronómica de Santarém', 'Institutional presence · Santarém Food Fair', 'Presencia institucional · Feria Gastronómica de Santarém'), cidade: 'Santarém', pais: 'pt', ini: '2024-10-17', tipo: 'evento' },
  { nome: t3('Eixo Atlântico · projeto POST', 'Eixo Atlântico · POST project', 'Eixo Atlántico · proyecto POST'), cidade: 'Viana do Castelo', pais: 'pt', ini: '2024-11-05', fim: '2024-11-07', tipo: 'europeu' },
  // 2025
  { nome: t3('Conferência «Certificação como fator de diferenciação para Destinos de Excelência»', 'Conference «Certification as a differentiating factor for Destinations of Excellence»', 'Conferencia «La certificación como factor de diferenciación para Destinos de Excelencia»'), cidade: 'Cascais', pais: 'pt', ini: '2025-03-20', tipo: 'conferencia' },
  { nome: 'Historical Cities 3.0', cidade: 'Cracóvia', pais: 'pl', ini: '2025-04-09', fim: '2025-04-12', tipo: 'conferencia' },
  { nome: t3('Rampa da Falperra', 'Rampa da Falperra hill climb', 'Rampa da Falperra'), cidade: 'Braga', pais: 'pt', ini: '2025-05-09', fim: '2025-05-11', tipo: 'evento' },
  { nome: t3('Projeto POST · comité de direção', 'POST project · steering committee', 'Proyecto POST · comité de dirección'), cidade: 'Monforte de Lemos', pais: 'es', ini: '2025-05-19', fim: '2025-05-21', tipo: 'europeu' },
  { nome: 'Music Cities Awards', cidade: 'Fayetteville (Arkansas)', pais: 'us', ini: '2025-09-14', fim: '2025-09-19', tipo: 'candidatura' },
  { nome: t3('Projeto SCT-HUB', 'SCT-HUB project', 'Proyecto SCT-HUB'), cidade: 'Cracóvia', pais: 'pl', ini: '2025-09-22', fim: '2025-09-25', tipo: 'europeu' },
  { nome: 'SYSTEMEU Summit 2025 + Startup Olé', cidade: 'Salamanca', pais: 'es', ini: '2025-10-13', fim: '2025-10-17', tipo: 'europeu' },
  { nome: t3('Projeto IURC-LAC', 'IURC-LAC project', 'Proyecto IURC-LAC'), cidade: 'Barcelona', pais: 'es', ini: '2025-11-03', fim: '2025-11-06', tipo: 'europeu' },
  { nome: t3('Capital Europeia do Turismo Inteligente · final', 'European Capital of Smart Tourism · final', 'Capital Europea del Turismo Inteligente · final'), cidade: 'Bruxelas', pais: 'be', ini: '2025-11-17', fim: '2025-11-20', tipo: 'candidatura', foto: '/internacional/ecst-final-2025.jpg' },
  { nome: t3('Projeto POST · reunião e visita de estudo', 'POST project · meeting and study visit', 'Proyecto POST · reunión y visita de estudio'), cidade: 'Dún Laoghaire', pais: 'ie', ini: '2025-11-17', fim: '2025-11-20', tipo: 'europeu' },
  // 2026
  { nome: t3('Capitais Europeias do Pequeno Comércio · cerimónia', 'European Capitals of Small Retail · ceremony', 'Capitales Europeas del Pequeño Comercio · ceremonia'), cidade: 'Bruxelas', pais: 'be', ini: '2026-01-27', fim: '2026-01-29', tipo: 'candidatura' },
  { nome: t3('Visita de estudo a Braga · Pentágono Urbano', 'Study visit to Braga · Pentágono Urbano', 'Visita de estudio a Braga · Pentágono Urbano'), cidade: 'Braga', pais: 'pt', ini: '2026-02-10', fim: '2026-02-11', tipo: 'visita' },
  { nome: t3('Auditoria Green Destinations', 'Green Destinations audit', 'Auditoría Green Destinations'), cidade: 'Braga', pais: 'pt', ini: '2026-02-12', fim: '2026-02-13', tipo: 'candidatura' },
  { nome: t3('Projeto POST · V Seminário de Intercâmbio de Experiências', 'POST project · 5th Experience Exchange Seminar', 'Proyecto POST · V Seminario de Intercambio de Experiencias'), cidade: 'A Coruña', pais: 'es', ini: '2026-04-16', fim: '2026-04-17', tipo: 'europeu' },
  { nome: t3('Rampa da Falperra', 'Rampa da Falperra hill climb', 'Rampa da Falperra'), cidade: 'Braga', pais: 'pt', ini: '2026-05-16', fim: '2026-05-17', tipo: 'evento', aConfirmar: t3('data a confirmar', 'date to be confirmed', 'fecha por confirmar') },
  { nome: t3('Programa de intercâmbio ECoSR · visita a Caldas da Rainha', 'ECoSR exchange programme · visit to Caldas da Rainha', 'Programa de intercambio ECoSR · visita a Caldas da Rainha'), cidade: 'Caldas da Rainha', pais: 'pt', ini: '2026-06-29', fim: '2026-07-01', tipo: 'visita' },
  { nome: t3('Fam trip · Experiências Turísticas', 'Fam trip · Tourism Experiences', 'Fam trip · Experiencias Turísticas'), cidade: 'Braga', pais: 'pt', ini: '2026-07-14', fim: '2026-07-15', tipo: 'imprensa' },
  { nome: t3('Projeto IURC · reunião transnacional', 'IURC project · transnational meeting', 'Proyecto IURC · reunión transnacional'), cidade: 'Braga', pais: 'pt', ini: '2026-09-05', fim: '2026-09-09', tipo: 'europeu' },
  { nome: t3('Conferência «FORTRESSES: REUSED. Heritage – Community – Tourism»', 'Conference «FORTRESSES: REUSED. Heritage – Community – Tourism»', 'Conferencia «FORTRESSES: REUSED. Heritage – Community – Tourism»'), cidade: 'Cracóvia', pais: 'pl', ini: '2026-09-23', fim: '2026-09-25', tipo: 'conferencia' },
  { nome: t3('Projeto SCT-HUB · visita de estudo a Braga', 'SCT-HUB project · study visit to Braga', 'Proyecto SCT-HUB · visita de estudio a Braga'), cidade: 'Braga', pais: 'pt', ini: '2026-10-13', fim: '2026-10-14', tipo: 'europeu' },
  { nome: t3('Projeto POST · congresso final', 'POST project · final congress', 'Proyecto POST · congreso final'), cidade: 'Cognac', pais: 'fr', ini: '2026-11-03', fim: '2026-11-04', tipo: 'europeu' },
  { nome: t3('Capitais Europeias do Turismo 2027 · apresentação ao júri', 'European Capitals of Tourism 2027 · jury presentation', 'Capitales Europeas del Turismo 2027 · presentación al jurado'), cidade: 'Bruxelas', pais: 'be', ini: '2026-11-17', fim: '2026-11-20', tipo: 'candidatura' },
];

export type TipoDistincao = 'vencedora' | 'certificacao' | 'titulo' | 'finalista' | 'emCurso' | 'anfitria' | 'ativo';
export interface Distincao { ano: number; titulo: Texto3; entidade: string; tipo: TipoDistincao; texto: Texto3; logos?: string[]; fonte: string }

export const DISTINCOES: Distincao[] = [
  { ano: 2026, tipo: 'emCurso', entidade: 'Comissão Europeia', fonte: 'https://www.presseportal.de/pm/182297/6352696',
    titulo: t3('Capitais Europeias do Turismo 2027 · finalista', 'European Capitals of Tourism 2027 · finalist', 'Capitales Europeas del Turismo 2027 · finalista'),
    texto: t3('Uma das 8 finalistas na categoria de cidades com mais de 100 mil habitantes, entre 43 candidatas de 18 países. As vencedoras são anunciadas em novembro de 2026.', 'One of 8 finalists in the category of cities with over 100,000 inhabitants, out of 43 applicants from 18 countries. Winners are announced in November 2026.', 'Una de las 8 finalistas en la categoría de ciudades de más de 100.000 habitantes, entre 43 candidatas de 18 países. Las ganadoras se anuncian en noviembre de 2026.') },
  { ano: 2026, tipo: 'certificacao', entidade: 'Green Destinations · GSTC', fonte: 'https://www.greendestinations.org/', logos: ['/distincoes/green-destinations-certified.png', '/distincoes/gstc-certified.png'],
    titulo: t3('Certificação Green Destinations (reconhecida pelo GSTC)', 'Green Destinations Certification (GSTC-recognised)', 'Certificación Green Destinations (reconocida por el GSTC)'),
    texto: t3('Certificação do destino sustentável após auditoria independente (fevereiro de 2026). Certificado GSTC DGD260103.', 'Sustainable destination certification after an independent audit (February 2026). GSTC certificate DGD260103.', 'Certificación de destino sostenible tras una auditoría independiente (febrero de 2026). Certificado GSTC DGD260103.') },
  { ano: 2026, tipo: 'finalista', entidade: 'Comissão Europeia', fonte: 'https://eismea.ec.europa.eu/news/silandro-caldas-da-rainha-and-barcelona-are-winners-european-capitals-small-retail-awards-2026-2026-01-29_en',
    titulo: t3('Capitais Europeias do Pequeno Comércio 2026 · finalista', 'European Capitals of Small Retail 2026 · finalist', 'Capitales Europeas del Pequeño Comercio 2026 · finalista'),
    texto: t3('Uma das duas cidades em segundo lugar (com Fuenlabrada) na categoria «Vibrant City»; a vencedora da categoria foi Caldas da Rainha. 28 cidades de 13 países candidataram-se.', 'One of the two runners-up (with Fuenlabrada) in the «Vibrant City» category; the category winner was Caldas da Rainha. 28 cities from 13 countries applied.', 'Una de las dos ciudades en segundo puesto (con Fuenlabrada) en la categoría «Vibrant City»; la ganadora de la categoría fue Caldas da Rainha. Se presentaron 28 ciudades de 13 países.') },
  { ano: 2025, tipo: 'finalista', entidade: 'Comissão Europeia', fonte: 'https://www.tampere.fi/en/current/2025/11/20/tampere-wins-title-european-capital-smart-tourism',
    titulo: t3('Capital Europeia do Turismo Inteligente 2026 · finalista', 'European Capital of Smart Tourism 2026 · finalist', 'Capital Europea del Turismo Inteligente 2026 · finalista'),
    texto: t3('Uma das 7 finalistas, entre 32 candidatas de 12 países. A vencedora foi Tampere (Finlândia).', 'One of 7 finalists, out of 32 applicants from 12 countries. The winner was Tampere (Finland).', 'Una de las 7 finalistas, entre 32 candidatas de 12 países. La ganadora fue Tampere (Finlandia).') },
  { ano: 2025, tipo: 'finalista', entidade: 'Music Cities Awards (Sound Diplomacy)', fonte: 'https://www.musiccitiesevents.com/post/meet-the-nominees-of-the-2025-music-cities-awards',
    titulo: t3('Music Cities Awards 2025 · finalista', 'Music Cities Awards 2025 · finalist', 'Music Cities Awards 2025 · finalista'),
    texto: t3('Nomeado na categoria de Melhor Iniciativa de Economia Noturna; a vencedora foi a Monte Olimpa (Cali, Colômbia). Cerimónia a 16 de setembro de 2025, em Fayetteville (Arkansas, EUA).', 'Nominated in the Best Night-Time Economy Initiative category; the winner was Monte Olimpa (Cali, Colombia). Ceremony on 16 September 2025 in Fayetteville (Arkansas, USA).', 'Nominado en la categoría de Mejor Iniciativa de Turismo Musical; la ganadora fue el Queensland Music Festival (Australia). Ceremonia el 16 de septiembre de 2025, en Fayetteville (Arkansas, EE. UU.).') },
  { ano: 2024, tipo: 'vencedora', entidade: 'World Travel Awards', fonte: 'https://www.worldtravelawards.com/award-worlds-leading-emerging-tourism-destination-2024', logos: ['/distincoes/wta-mundo-2024.png'],
    titulo: t3('Melhor Destino Turístico Emergente do Mundo 2024', 'World’s Leading Emerging Tourism Destination 2024', 'Mejor Destino Turístico Emergente del Mundo 2024'),
    texto: t3('Título mundial renovado na gala final, na Madeira (novembro de 2024).', 'World title renewed at the grand final in Madeira (November 2024).', 'Título mundial renovado en la gala final, en Madeira (noviembre de 2024).') },
  { ano: 2024, tipo: 'vencedora', entidade: 'World Travel Awards', fonte: 'https://www.worldtravelawards.com/award-europes-leading-emerging-tourism-destination-2024', logos: ['/distincoes/wta-europa-2024.png'],
    titulo: t3('Melhor Destino Turístico Emergente da Europa 2024', 'Europe’s Leading Emerging Tourism Destination 2024', 'Mejor Destino Turístico Emergente de Europa 2024'),
    texto: t3('Gala europeia em Berlim (março de 2024). Braga sucedeu a Batumi, vencedora de 2019 a 2023.', 'European gala in Berlin (March 2024). Braga succeeded Batumi, the winner from 2019 to 2023.', 'Gala europea en Berlín (marzo de 2024). Braga sucedió a Batumi, ganadora de 2019 a 2023.') },
  { ano: 2024, tipo: 'anfitria', entidade: 'UNESCO', fonte: 'https://forumbraga.com/Detail/Index/064c8bd8-2e25-11ef-b13e-000d3ad7a4dc', logos: ['/distincoes/unesco-cidades-criativas.png'],
    titulo: t3('Anfitriã da 16.ª Conferência Anual das Cidades Criativas da UNESCO', 'Host of the 16th UNESCO Creative Cities Annual Conference', 'Anfitriona de la 16.ª Conferencia Anual de las Ciudades Creativas de la UNESCO'),
    texto: t3('De 1 a 5 de julho de 2024, nos 20 anos da rede. Daqui saiu o Manifesto de Braga sobre cultura e desenvolvimento sustentável.', 'From 1 to 5 July 2024, on the network’s 20th anniversary. It produced the Braga Manifesto on culture and sustainable development.', 'Del 1 al 5 de julio de 2024, en el 20.º aniversario de la red. De ella salió el Manifiesto de Braga sobre cultura y desarrollo sostenible.') },
  { ano: 2023, tipo: 'vencedora', entidade: 'World Travel Awards', fonte: 'https://siviaggia.it/notizie/braga-destinazione-emergente-2024/505976/', logos: ['/distincoes/wta-mundo-2023.png'],
    titulo: t3('Melhor Destino Turístico Emergente do Mundo 2023', 'World’s Leading Emerging Tourism Destination 2023', 'Mejor Destino Turístico Emergente del Mundo 2023'),
    texto: t3('Primeiro título mundial de Braga nos World Travel Awards.', 'Braga’s first world title at the World Travel Awards.', 'Primer título mundial de Braga en los World Travel Awards.') },
  { ano: 2023, tipo: 'vencedora', entidade: 'Green Destinations', fonte: 'https://www.greendestinations.org/', logos: ['/distincoes/green-destinations-platinum.png'],
    titulo: t3('Green Destinations Platinum Award', 'Green Destinations Platinum Award', 'Green Destinations Platinum Award'),
    texto: t3('Atribuído a 25 de setembro de 2023 (certificado GD23-022), pela atratividade, qualidade e esforço de sustentabilidade do destino. Válido por dois anos, deu lugar à certificação de 2026.', 'Awarded on 25 September 2023 (certificate GD23-022) for the destination’s attractiveness, quality and sustainability efforts. Valid for two years, it was followed by the 2026 certification.', 'Otorgado el 25 de septiembre de 2023 (certificado GD23-022) por el atractivo, la calidad y el esfuerzo de sostenibilidad del destino. Válido durante dos años, dio paso a la certificación de 2026.') },
  { ano: 2023, tipo: 'ativo', entidade: 'Green Destinations', fonte: 'https://www.greendestinations.org/category/top-100-2023/page/6/', logos: ['/distincoes/top100-2023.png'],
    titulo: t3('Top 100 Histórias de Destinos Sustentáveis · Bom Jesus do Monte', 'Top 100 Destination Sustainability Stories · Bom Jesus do Monte', 'Top 100 Historias de Destinos Sostenibles · Bom Jesus do Monte'),
    texto: t3('Boa prática selecionada: a gestão e preservação do Bom Jesus do Monte.', 'Selected good practice: the management and preservation of Bom Jesus do Monte.', 'Buena práctica seleccionada: la gestión y preservación del Bom Jesus do Monte.') },
  { ano: 2021, tipo: 'vencedora', entidade: 'European Best Destinations', fonte: 'https://econews.pt/?p=26202', logos: ['/distincoes/ebd-2021.png'],
    titulo: t3('Melhor Destino Europeu 2021', 'European Best Destination 2021', 'Mejor Destino Europeo 2021'),
    texto: t3('1.º lugar com 109 902 votos, 72% de fora de Portugal; Roma ficou em 2.º lugar.', '1st place with 109,902 votes, 72% from outside Portugal; Rome came 2nd.', '1.er puesto con 109.902 votos, el 72% de fuera de Portugal; Roma quedó en 2.º lugar.') },
  { ano: 2019, tipo: 'finalista', entidade: 'European Best Destinations', fonte: 'https://econews.pt/?p=26202',
    titulo: t3('Melhor Destino Europeu 2019 · 2.º lugar', 'European Best Destination 2019 · 2nd place', 'Mejor Destino Europeo 2019 · 2.º puesto'),
    texto: t3('Segundo lugar na votação internacional; Braga foi o único destino português nomeado.', 'Second place in the international vote; Braga was the only Portuguese destination nominated.', 'Segundo puesto en la votación internacional; Braga fue el único destino portugués nominado.') },
  { ano: 2019, tipo: 'ativo', entidade: 'UNESCO', fonte: 'https://whc.unesco.org/en/list/1590', logos: ['/unesco-patrimonio-mundial-preto.png'],
    titulo: t3('Património Mundial da UNESCO · Bom Jesus do Monte', 'UNESCO World Heritage · Bom Jesus do Monte', 'Patrimonio Mundial de la UNESCO · Bom Jesus do Monte'),
    texto: t3('O Santuário do Bom Jesus do Monte foi inscrito na Lista do Património Mundial em julho de 2019. É uma distinção do monumento, não da cidade.', 'The Sanctuary of Bom Jesus do Monte was inscribed on the World Heritage List in July 2019. The distinction belongs to the monument, not the city.', 'El Santuario del Bom Jesus do Monte se inscribió en la Lista del Patrimonio Mundial en julio de 2019. Es una distinción del monumento, no de la ciudad.') },
  { ano: 2017, tipo: 'titulo', entidade: 'UNESCO', fonte: 'https://inl.int/?p=50993', logos: ['/distincoes/unesco-braga-media-arts.png'],
    titulo: t3('Cidade Criativa da UNESCO · Artes Média', 'UNESCO Creative City · Media Arts', 'Ciudad Creativa de la UNESCO · Artes Mediáticas'),
    texto: t3('Membro da Rede de Cidades Criativas da UNESCO desde 2017, a única Cidade das Artes Média da Península Ibérica.', 'Member of the UNESCO Creative Cities Network since 2017, the only City of Media Arts in the Iberian Peninsula.', 'Miembro de la Red de Ciudades Creativas de la UNESCO desde 2017, la única Ciudad de las Artes Mediáticas de la Península Ibérica.') },
  { ano: 2026, tipo: 'ativo', entidade: 'ABAE · Bandeira Azul', fonte: 'https://www.theportugalnews.com/br/noticias/2026-07-14/portugal-investira-1-milhao-em-nova-praia-fluvial-para-lazer-de-verao-em-braga/1055378', logos: ['/distincoes/bandeira-azul.png'],
    titulo: t3('Bandeira Azul · praias fluviais de Adaúfe e Ponte do Bico', 'Blue Flag · Adaúfe and Ponte do Bico river beaches', 'Bandera Azul · playas fluviales de Adaúfe y Ponte do Bico'),
    texto: t3('Galardão de qualidade da água, segurança e gestão ambiental na época balnear de 2026 (lista da ABAE). Ponte do Bico tem Bandeira Azul desde 2022.', 'Award for water quality, safety and environmental management in the 2026 bathing season (ABAE list). Ponte do Bico has held the Blue Flag since 2022.', 'Galardón de calidad del agua, seguridad y gestión ambiental en la temporada de baño de 2026 (lista de ABAE). Ponte do Bico tiene Bandera Azul desde 2022.') },
];

// Fotografias do topo da Internacionalização (mosaico). As que não têm ano confirmado entram só aqui.
export const MOSAICO: { src: string; legenda: string }[] = [
  { src: '/internacional/fitur-2026.jpg', legenda: 'FITUR 2026 · Madrid' },
  { src: '/internacional/fitur-2024.jpg', legenda: 'FITUR 2024 · Madrid' },
  { src: '/internacional/btl-2023.jpg', legenda: 'BTL 2023 · Lisboa' },
  { src: '/internacional/vakantiebeurs-2025.jpg', legenda: 'Vakantiebeurs 2025 · Utrecht' },
  { src: '/internacional/qsp-summit-2025.jpg', legenda: 'QSP Summit 2025 · Matosinhos' },
  { src: '/internacional/navartur-2026.jpg', legenda: 'NavarTur 2026 · Pamplona' },
  { src: '/internacional/btl.jpg', legenda: 'BTL · Lisboa' },
  { src: '/internacional/b-travel.jpg', legenda: 'B-Travel · Barcelona' },
  { src: '/internacional/gent-2025.jpg', legenda: 'Fiets en Wandelbeurs 2025 · Gent' },
  { src: '/internacional/ecst-final-2025.jpg', legenda: 'European Capital of Smart Tourism 2025 · Bruxelas' },
  { src: '/internacional/expovacaciones.jpg', legenda: 'ExpoVacaciones · Bilbao' },
];
