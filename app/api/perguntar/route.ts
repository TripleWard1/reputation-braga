import { NextRequest, NextResponse } from 'next/server';
import {
  MESES, DORMIDAS_BRAGA, HOSPEDES_BRAGA, DORMIDAS_ANUAL, HOSPEDES_ANUAL, ESTADA_MEDIA, HEADLINE, RESIDENTES,
  SEMESTRE_2026, ADR_ANUAL, REVPAR_MENSAL, TAXA_TURISTICA, BALCAO, SUSTENTABILIDADE, CAPACIDADE_CAMAS,
  QUARTOS, ALOJAMENTO_FREGUESIA, DORMIDAS_NORTE, DORMIDAS_PORTUGAL,
} from '@/app/lib/observatorio-dados';
import { DIGITAL, DIGITAL_POS, SEARCH_CONSOLE } from '@/app/lib/audiencia-digital-dados';
import { ACESSIBILIDADE } from '@/app/lib/acessibilidade-meteo-dados';
import { CAMINHOS } from '@/app/lib/caminhos-santiago-dados';
import { BILHETEIRA, BILHETEIRA_FONTE } from '@/app/lib/bilheteira-dados';
import { SIBS_PAISES, SIBS_SETORES, SIBS_CONCELHOS, SIBS_PERIODO } from '@/app/lib/sibs-dados';
import { AL_BRAGA, AEROPORTO_PORTO } from '@/app/lib/alojamento-aeroporto-dados';
import { LOJAS_HISTORIA, LOJAS_HISTORIA_META } from '@/app/lib/lojas-historia-dados';
import { RNAAT, RNAAT_FONTE } from '@/app/lib/rnaat-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { FERRAMENTAS_DIGITAIS } from '@/app/lib/ferramentas-digitais-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { estimativaDormidas } from '@/app/lib/estimativa';
import { TUB } from '@/app/lib/tub-dados';
import { UNESCO_BOM_JESUS } from '@/app/lib/unesco-bom-jesus';
import { DATAS as CALENDARIO_MERCADOS, MERCADOS as CAL_MERCADOS } from '@/app/lib/calendario-mercados-dados';
import { MOB_URBANA, BAIRROS, GEO_VISITAS } from '@/app/lib/mobilidade-bairros-dados';

// "Pergunte ao Observatório": responde a perguntas com os dados da plataforma.
// Para não esgotar o limite do Groq, envia só os blocos de dados relevantes para cada pergunta (máx. ~14 000 caracteres).
// A chave e o modelo são os mesmos da rota /api/groq (GROQ_KEY e GROQ_MODEL na Vercel).
export const runtime = 'nodejs';

const MODELO_PADRAO = 'openai/gpt-oss-120b';
const LIMITE_BLOCO = 7000;
const LIMITE_TOTAL = 14000;
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const somaH1 = (serie: any, ano: string) => (MESES as unknown as string[]).slice(0, 6).reduce((a, m) => a + (serie?.[m]?.[ano] ?? 0), 0);

interface Bloco { id: string; titulo: string; separador: string; fonte: string; palavras: string[]; dados: (q: string) => unknown }

// Calendário compacto: só os mercados referidos na pergunta (ou todos, se nenhum for referido), sem traduções,
// para caber no limite do bloco sem cortar regiões.
const CAL_ALIAS: Record<string, string[]> = { galiza: ['galiza', 'galicia', 'vigo', 'corunha', 'coruna'], espanha: ['espanha', 'espanh'], madrid: ['madrid'], catalunha: ['catalunha', 'barcelona'], paisbasco: ['pais basco', 'bilbau', 'bilbao'], valencia: ['valencia', 'alicante'], andaluzia: ['andaluzia', 'sevilha', 'malaga', 'granada'], asturias: ['asturias', 'oviedo'], baleares: ['baleares', 'maiorca', 'palma'], canarias: ['canarias'], portugal: ['portugal', 'portugues', 'nacional'], franca: ['franca', 'frances', 'paris'], reinounido: ['reino unido', 'ingl', 'britan', 'londres'] };
function calendarioCompacto(q: string) {
  const pedidos = Object.keys(CAL_ALIAS).filter((m) => CAL_ALIAS[m].some((w) => q.includes(w)));
  const MES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const meses = MES.map((m, i) => (q.includes(m) ? String(i + 1).padStart(2, '0') : '')).filter(Boolean);
  const hoje = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
  let lista = (CALENDARIO_MERCADOS as any[]).filter((d) => !pedidos.length || pedidos.indexOf(d.mercado) >= 0);
  if (meses.length) lista = lista.filter((d) => meses.indexOf(String(d.ini).slice(5, 7)) >= 0 || (d.fim && meses.indexOf(String(d.fim).slice(5, 7)) >= 0));
  else if (!pedidos.length) lista = lista.filter((d) => (d.fim || d.ini) >= hoje && d.ini <= limite);
  const voos: Record<string, unknown> = {};
  for (const m of Object.keys(CAL_MERCADOS)) if ((CAL_MERCADOS as any)[m].voo && (!pedidos.length || pedidos.indexOf(m) >= 0)) voos[m] = (CAL_MERCADOS as any)[m].voo;
  return { nota: 'tipo f = feriado, e = férias escolares; r = feriado só da região. Sábados e domingos sem traslado não constam. Sem mercado nem mês na pergunta, só os próximos meses; o calendário completo vai até dezembro de 2027.', voosDiretosParaOPorto: voos, datas: lista.map((d) => [d.mercado, d.tipo === 'feriado' ? 'f' : 'e', d.ini, d.fim || '', d.nome.pt, d.regional ? 'r' : '']) };
}

const BLOCOS: Bloco[] = [
  {
    id: 'dormidas', titulo: 'Dormidas e hóspedes em Braga (por mês e por ano)', separador: 'procura', fonte: 'INE/TravelBI',
    palavras: ['dormid', 'hosped', 'procura', 'noite', 'estada', 'turistas', 'visitantes', 'vieram', 'quantos', 'cresc', 'semestre', 'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro', 'sazonal', 'residentes', 'norte', 'portugal', 'pais'],
    dados: () => ({
      dormidasPorMes: DORMIDAS_BRAGA, hospedesPorMes: HOSPEDES_BRAGA, dormidasPorAno: DORMIDAS_ANUAL, hospedesPorAno: HOSPEDES_ANUAL, estadaMedia: ESTADA_MEDIA,
      residentesVsNaoResidentes: RESIDENTES,
      primeiroSemestre: {
        braga: { 2025: somaH1(DORMIDAS_BRAGA, '2025'), 2026: somaH1(DORMIDAS_BRAGA, '2026') },
        norte: { 2025: somaH1(DORMIDAS_NORTE, '2025'), 2026: somaH1(DORMIDAS_NORTE, '2026') },
        portugal: { 2025: somaH1(DORMIDAS_PORTUGAL, '2025'), 2026: somaH1(DORMIDAS_PORTUGAL, '2026') },
      },
      destaque: HEADLINE,
    }),
  },
  {
    id: 'mercados', titulo: 'Mercados: dormidas e hóspedes por país de residência (1.º semestre de 2026)', separador: 'mercados', fonte: 'INE/TravelBI',
    palavras: ['mercad', 'espanh', 'galeg', 'franc', 'alem', 'brasil', 'ingles', 'reino unido', 'eua', 'estados unidos', 'americ', 'italian', 'holand', 'pais', 'paises', 'estrangeir', 'nacionalidade', 'origem', 'internacion'],
    dados: () => SEMESTRE_2026,
  },
  {
    id: 'economia', titulo: 'Economia do alojamento: proveitos, RevPAR, preço médio (ADR) e ocupação', separador: 'economia', fonte: 'INE/TravelBI',
    palavras: ['receita', 'provei', 'revpar', 'adr', 'preco', 'ocupac', 'quarto', 'econom', 'euros', 'faturac', 'rendimento'],
    dados: () => ({ semestre2026: { periodo: (SEMESTRE_2026 as any).periodo, adr: (SEMESTRE_2026 as any).adr, revpar: (SEMESTRE_2026 as any).revpar, proveitos: (SEMESTRE_2026 as any).proveitos, ocupCama: (SEMESTRE_2026 as any).ocupCama, ocupQuarto: (SEMESTRE_2026 as any).ocupQuarto }, adrPorAno: ADR_ANUAL, revparPorMes: REVPAR_MENSAL }),
  },
  {
    id: 'estimativa', titulo: 'Estimativa da plataforma para as dormidas do ano em curso', separador: 'estimativa', fonte: 'Estimativa da plataforma com base no INE/TravelBI (não é um dado oficial)',
    palavras: ['estimat', 'previs', 'prever', 'fechar', 'fecho', 'final do ano', 'ate ao fim', 'futuro', 'tendencia'],
    dados: () => { const e = estimativaDormidas(); return e ? { ano: e.ano, ultimoMesPublicado: (MESES as unknown as string[])[e.ultimoMes], crescimentoUsado: e.g, intervalo: [e.gMin, e.gMax], totalEstimado: e.total, minimo: e.totalMin, maximo: e.totalMax, anoAnterior: e.totalAnterior, meses: e.meses.filter((m) => m.est != null).map((m) => ({ mes: m.mes, estimativa: m.est, min: m.min, max: m.max })) } : null; },
  },
  {
    id: 'cartoes', titulo: 'Gastos com cartões estrangeiros no concelho de Braga (SIBS)', separador: 'cartoes', fonte: 'SIBS Analytics',
    palavras: ['cartao', 'cartoes', 'gast', 'sibs', 'compra', 'despesa', 'pagament', 'consumo', 'diaspora', 'emigrant', 'franceses', 'dinheiro'],
    dados: () => { const p = [...(SIBS_PAISES as any[])].sort((a, b) => b.valor - a.valor); return { periodo: SIBS_PERIODO, totalEstrangeiro: p.reduce((a, x) => a + (x.valor || 0), 0), paises: p.slice(0, 20), setores: SIBS_SETORES, concelhosVizinhos: (SIBS_CONCELHOS as any[]).filter((c) => ['braga', 'guimarães', 'porto', 'viana do castelo', 'barcelos', 'vila nova de famalicão'].indexOf(String(c.concelho).trim().toLowerCase()) >= 0).map((c) => ({ concelho: c.concelho, n: c.n, valor: c.valor, medio: c.medio })), notas: 'Valores = todas as operações registadas pela SIBS (pagamentos e levantamentos), 13 meses. O país é o do emissor do cartão. Para evolução no tempo usar só o ficheiro mensal (pagamentos eletrónicos +6% a +19% em termos homólogos; numerário −1% a −7%).' }; },
  },
  {
    id: 'emprego', titulo: 'Emprego e ganho médio no alojamento e restauração', separador: 'emprego', fonte: 'INE (SCIE e Quadros de Pessoal) / PORDATA',
    palavras: ['empreg', 'trabalh', 'salari', 'ganho', 'ordenado', 'pessoas ao servico', 'restaurac', 'postos de trabalho', 'remunera'],
    dados: () => EMPREGO,
  },
  {
    id: 'hotelaria', titulo: 'Hotelaria: hotéis, capacidade, quartos adaptados e certificações ambientais', separador: 'hotelaria', fonte: 'visitbraga.travel; listas Green Key e Biosphere',
    palavras: ['hotel', 'hoteis', 'hotelaria', 'quartos adaptad', 'mobilidade reduzida', 'acessiv', 'cadeira de rodas', 'green key', 'certific', 'estrelas', 'capacidade'],
    dados: () => ({ ...HOTELARIA, certificados: SETOR_SUSTENTAVEL.certificados }),
  },
  {
    id: 'alojamento', titulo: 'Alojamento Local ativo (base municipal da taxa turística) e oferta por freguesia', separador: 'alojamento', fonte: 'Plataforma municipal da taxa turística; INE',
    palavras: ['alojamento local', ' al ', 'apartament', 'freguesia', 'cessad', 'airbnb', 'centro historico', 'camas', 'oferta'],
    dados: () => { const A: any = AL_BRAGA; return { fonte: A.fonte, ativos: A.total, camas: A.camas, quartos: A.quartos, estados: A.estados, camasCessadas: A.camasCessadas, modalidades: A.modalidades, freguesias: (A.freguesias as any[]).slice(0, 12), porAnoDeInicio: (A.porAno as any[]).filter((x: any) => +x.ano >= 1990), capacidadeCamasINE: CAPACIDADE_CAMAS, quartosINE: QUARTOS, alojamentoPorFreguesiaINE: (ALOJAMENTO_FREGUESIA as any[]).slice(0, 12) }; },
  },
  {
    id: 'mobilidade', titulo: 'Autocarros TUB nas linhas com interesse turístico (entradas, horários, velocidade e atrasos)', separador: 'mobilidade', fonte: 'TUB – Transportes Urbanos de Braga (jan–set 2026)',
    palavras: ['autocarro', 'tub', 'linha', 'paragem', 'transporte', 'sameiro', 'bom jesus', 'estacao', 'comboio', 'estadio', 'campismo', 'circuito', 'domingo', 'sabado', 'fim de semana', 'atras', 'velocidade', 'mobilidade', 'como chegar', 'ir ao', 'ir para'],
    dados: () => { const T: any = TUB; return { fonte: T.fonte, meses: T.meses, linhas: (T.linhas as any[]).map((l) => ({ linha: l.linha, nome: l.nome, nota: l.nota, entradas: l.total, mediaPorDia: l.mediaDia, paragensMaisUsadas: (l.topParagens as any[]).slice(0, 4) })), destinosTuristicos: T.turismo, operacao: T.operacao ? Object.fromEntries(Object.entries(T.operacao as Record<string, any>).map(([k, v]) => [k, { viagensDia: v.viagensDia, passageirosPorViagem: v.paxViagem, velocidadeMediana: v.velMediana, pctViagensComAtraso: v.pctViagensAtraso, atrasoMedianoMin: v.atrasoMediano, veiculosDia: v.veiculosDia, passageirosPorVeiculoDia: v.paxVeiculoDia }])) : null, notas: 'As entradas contam quem entra no autocarro (validações). mediaPorDia: util = dia útil, sab = sábado, dom = domingo.' }; },
  },
  {
    id: 'aeroporto', titulo: 'Passageiros desembarcados no Aeroporto do Porto', separador: 'aeroporto', fonte: 'INE',
    palavras: ['aeroporto', 'voo', 'aviao', 'desembarc', 'aerea'],
    dados: () => AEROPORTO_PORTO,
  },
  {
    id: 'perfil', titulo: 'Perfil do turista (inquérito com 336 respostas, exportação de 7/5/2025; n varia por pergunta)', separador: 'perfil', fonte: 'Estudo de Perfil do Turista',
    palavras: ['perfil', 'idade', 'motiv', 'inquerit', 'gasto diario', 'gastam por dia', 'pernoit', 'primeira vez', 'inteligencia artificial', 'como planeiam', 'transporte usado', 'companhia', 'gostaram', 'queix'],
    dados: () => PERFIL_TURISTA,
  },
  {
    id: 'animacao', titulo: 'Empresas de animação turística (RNAAT)', separador: 'animacao', fonte: RNAAT_FONTE,
    palavras: ['animac', 'empresa', 'atividade', 'tour', 'experienc', 'guia', 'operador', 'rnaat', 'passeio'],
    dados: () => { const E = RNAAT as any[]; const cat = (k: string) => E.filter((e) => e.atividades[k].length).length; return { total: E.length, porTipo: { cultural: cat('cultural'), natureza: cat('natureza'), maritimo: cat('maritimo'), reconhecidasTurismoNatureza: cat('reconhecidas') }, empresas: E.map((e) => ({ nome: e.marca || e.nome, desde: e.ano })) }; },
  },
  {
    id: 'lojas', titulo: 'Lojas com História', separador: 'lojas', fonte: 'Município de Braga',
    palavras: ['loja', 'comercio tradicional', 'centenari', 'historic', 'antig', 'pastelaria', 'cafe'],
    dados: () => ({ meta: LOJAS_HISTORIA_META, lojas: (LOJAS_HISTORIA as any[]).map((l) => ({ nome: l.nome, ano: l.ano, setor: l.setor })) }),
  },
  {
    id: 'cultura', titulo: 'Bilheteira cultural (Theatro Circo, gnration, BMA)', separador: 'cultura', fonte: BILHETEIRA_FONTE,
    palavras: ['theatro', 'teatro', 'circo', 'gnration', 'bilhete', 'espetacul', 'concerto', 'cultura', 'bma'],
    dados: () => Object.fromEntries(Object.entries(BILHETEIRA as Record<string, any>).map(([k, v]) => [k, { entidade: v.entidade, meses: v.meses, tipos: k === 'bma' ? undefined : v.tipos, topEventos: (v.topEventos || []).slice(0, 3) }])),
  },
  {
    id: 'balcao', titulo: 'Posto de Turismo: atendimentos e acessibilidade', separador: 'balcao', fonte: 'Posto de Turismo de Braga',
    palavras: ['posto', 'balcao', 'atendiment', 'informacao turistica', 'necessidades especiais', 'peregrin', 'grupos'],
    dados: () => ({ balcao: BALCAO, acessibilidade: ACESSIBILIDADE }),
  },
  {
    id: 'taxa', titulo: 'Taxa turística (faturação mensal; abr–jun 2026 provisórios)', separador: 'taxa', fonte: 'Município de Braga',
    palavras: ['taxa turistica', 'taxa'],
    dados: () => ({ notas: '1,50 € por dormida, até 4 noites seguidas, hóspedes com 16 ou mais anos (Regulamento n.º 927/2025). Até julho de 2025 cobrada de março a outubro; desde o fim de julho de 2025, todo o ano. Até março de 2026: faturação emitida (pode incluir faturas anuladas depois); abril a junho de 2026: valores cobrados até 30/06/2026, provisórios. Cada valor está no mês da fatura, não no mês da dormida. O salto de 2026 deve-se sobretudo à cobrança todo o ano.', serie: TAXA_TURISTICA }),
  },
  {
    id: 'sustentabilidade', titulo: 'Sustentabilidade: certificação, perceção dos residentes e negócios certificados', separador: 'sustentabilidade', fonte: 'Green Destinations; Barómetro de Perceção dos Residentes 2026',
    palavras: ['sustentab', 'green destinations', 'certific', 'residentes', 'barometro', 'percec', 'ambient', 'pegada', 'reciclag'],
    dados: () => ({ ...(SUSTENTABILIDADE as any), setor: SETOR_SUSTENTAVEL }),
  },
  {
    id: 'digital', titulo: 'Audiência digital (visitbraga.travel, Google) e ferramentas digitais (TOMI, SmartGuide)', separador: 'digital', fonte: 'Google Analytics, Search Console, TOMI, SmartGuide',
    palavras: ['site', 'visitbraga', 'digital', 'google', 'pesquis', 'online', 'tomi', 'mupi', 'smartguide', 'guia audio', 'app', 'utilizadores', 'redes'],
    dados: () => ({ notas: 'Os utilizadores da China são sobretudo tráfego automático (envolvimento perto de 0%); não os contar como audiência. Os canais referem-se ao canal do primeiro acesso. TOMI: a contagem de peões de 2025 mais do que duplica a partir de setembro (mudança na contagem), não comparar 2026 com a média de 2025.', site: DIGITAL, sitePosAtaque: DIGITAL_POS, pesquisaGoogle: SEARCH_CONSOLE, ferramentas: { tomi: (FERRAMENTAS_DIGITAIS as any).tomi, smartguide: (FERRAMENTAS_DIGITAIS as any).smartguide } }), // sem o Super Fan (relatório confidencial)
  },
  {
    id: 'caminhos', titulo: 'Caminhos de Santiago em Braga', separador: 'caminhos', fonte: 'Serviço de Peregrinos de Santiago (via Diário do Minho, jan. 2025 e jan. 2026) e Associação do Caminho da Geira e dos Arrieiros',
    palavras: ['caminho', 'santiago', 'peregrin', 'credencial', 'geira'],
    dados: () => CAMINHOS,
  },
  {
    id: 'unesco', titulo: 'Bom Jesus do Monte: Património Mundial da UNESCO', separador: 'geral', fonte: 'UNESCO World Heritage Centre',
    palavras: ['unesco', 'patrimonio mundial', 'bom jesus'],
    dados: () => UNESCO_BOM_JESUS,
  },
  {
    id: 'calendario', titulo: 'Feriados e férias escolares dos mercados emissores (Galiza, Espanha e regiões espanholas com voo direto para o Porto, Portugal, França, Reino Unido), outubro de 2026 a dezembro de 2027', separador: 'calendario', fonte: 'Xunta de Galicia; BORM; BOE; boletins e governos autonómicos (Madrid, Catalunha, País Basco, C. Valenciana, Andaluzia, Astúrias, Baleares, Canárias); Despacho n.º 10430/2026; Código do Trabalho; Ministério da Educação Nacional (França); bank holidays (Inglaterra e País de Gales)',
    palavras: ['feriado', 'ponte', 'ferias escolares', 'galiza', 'galicia', 'calendario', 'oportunidade', 'pascoa', 'carnaval', 'natal', 'fim de semana prolongado', 'feriado regional', 'madrid', 'barcelona', 'catalunha', 'andaluzia', 'pais basco', 'valencia', 'asturias', 'baleares', 'canarias'],
    dados: (q: string) => calendarioCompacto(q),
  },
  {
    id: 'visitas', titulo: 'Visitas ao concelho por dados móveis (Geoanalytics): visitas de um dia e com dormida, nacionais e internacionais, outubro a dezembro de 2025', separador: 'visitas', fonte: 'Braga Smart Retail · Geoanalytics',
    palavras: ['visitantes de um dia', 'excursionista', 'dormida', 'pernoita', 'geoanalytics', 'telemovel', 'operador', 'turistas internacionais', 'visitantes nacionais', 'estadia'],
    dados: () => { const G: any = GEO_VISITAS; const dd: any[] = G.diario || []; let a = 0, b = 0; for (let i = 0; i < dd.length; i++) { a += dd[i][1]; b += dd[i][2]; } return { notas: 'Geoanalytics, 9/10 a 31/12/2025. Contam visitas, não pessoas. 86% das visitas sem dormida (diurnas).', mensal: G.mensal, tipologia: G.tipologia, nacInt: G.nacInt, comDormida: G.comDormida, noites: G.noites, horasDiurna: G.horasDiurna, duracao: G.duracao, totais: { comDormida: a, diurnas: b } }; },
  },
  {
    id: 'urbana', titulo: 'Mobilidade urbana: trânsito, peões, TUB, rotas congestionadas e parques de estacionamento', separador: 'urbana', fonte: 'Braga Smart Retail · Monitorização da Mobilidade Urbana',
    palavras: ['transito', 'congestion', 'peoes', 'estacionamento', 'parque', 'paragem', 'embarques', 'receita tub', 'rotas'],
    dados: () => { const M: any = MOB_URBANA; const pq: any[] = M.parques || []; let sp = 0; for (let i = 0; i < pq.length; i++) sp += pq[i][1]; return { notas: 'As exportações de tráfego, percursos, ritmo horário e TUB não indicam o período; usar só como percentagens e rankings, dizendo que o período não está indicado. Parques (Invipo): 22/06 a 08/10/2026. Depois das 19h os contadores de peões e trânsito quase não registam (possível horário dos sensores, a confirmar).', composicao: M.composicao, totalContagens: M.totalContagens, ritmo: M.ritmo, ofertaProcura: M.ofertaProcura, receitaLinhasPct: M.receitaLinhas, embarquesTop: (M.embarques && M.embarques.top || []).slice(0, 10), passagens: { util: M.passagens.util, sab: M.passagens.sab, dom: M.passagens.dom, paragens: M.passagens.paragens, autocarros: M.passagens.autocarros, top: (M.passagens.top || []).slice(0, 10) }, rotasTop: (M.rotas || []).slice(0, 12).map((r: any) => ({ percurso: r.nome, tempoExtraPct: Math.round((r.lent - 1) * 100), piores10Pct: Math.round((r.p90 - 1) * 100), classe: r.classe })), nRotas: (M.rotas || []).length, parques: { dias: pq.length, de: pq[0] && pq[0][0], ate: pq.length ? pq[pq.length - 1][0] : null, mediaPct: pq.length ? Math.round((sp / pq.length) * 10) / 10 : null } }; },
  },
  {
    id: 'bairros', titulo: 'Bairros Comerciais Digitais: dispositivos na rede Wi-Fi do centro, zonas, duração das ligações e autocarros que chegam ao Centro Coordenador de Transportes', separador: 'bairros', fonte: 'Braga Smart Retail · Pessoas no Bairro',
    palavras: ['bairro', 'wi-fi', 'wifi', 'rua do souto', 'centro historico', 'permanencia', 'autocarros de fora', 'terminal', 'expresso', 'comercio'],
    dados: () => { const B: any = BAIRROS; const d: any[] = B.diario || []; let s = 0; for (let i = 0; i < d.length; i++) s += Number(d[i][1]) || 0; return { notas: 'Wi-Fi de 1/1 a 7/10/2026. Contam dispositivos, não pessoas. Média diária calculada = soma/dias com registo (o painel da plataforma Braga Smart Retail indica 356, calculado de outra forma). Zonas = soma das contagens diárias (não dispositivos diferentes). cmbraga_bcd = nome da rede sem zona. LISTA BRANCA = categoria do ficheiro, significado por confirmar, só aparece desde janeiro de 2026. Autocarros CCTTB: 9/10/2025 a 7/10/2026. Telemóveis (Geoanalytics) só out–dez 2025.', mediaDispositivosDia: d.length ? Math.round(s / d.length) : null, diasComRegisto: d.length, mensal: B.mensal, semana: B.semana, hora: B.hora, zonasTotal: B.zonasTotal, sessaoPorZona: (B.zonas || []).map((z: any) => [z.zona, z.sessao]), sessaoSemana: B.sessaoSemana, semanaGeoWifi: B.semanaGeoWifi, autocarros: B.autocarros }; },
  },
];
const IDS_SEPARADORES = ['geral', 'procura', 'estimativa', 'mercados', 'aeroporto', 'caminhos', 'perfil', 'balcao', 'economia', 'emprego', 'cartoes', 'taxa', 'hotelaria', 'alojamento', 'animacao', 'cultura', 'lojas', 'digital', 'ferramentas', 'sustentabilidade', 'mobilidade', 'acessibilidade', 'meteo', 'cruzamentos', 'calendario', 'urbana', 'bairros', 'visitas'];
const PALAVRAS_REPUTACAO = ['reputa', 'avalia', 'estrela', 'google maps', 'comentari', 'critica', 'elogi', 'indice do destino', 'nota', 'opiniao', 'review', 'satisfac'];

function escolherBlocos(pergunta: string) {
  const q = ` ${norm(pergunta)} `;
  const pont = BLOCOS.map((b) => ({ b, p: b.palavras.reduce((a, w) => a + (q.includes(w) ? 1 : 0), 0) })).filter((x) => x.p > 0).sort((a, b) => b.p - a.p);
  const escolhidos: { b: Bloco; txt: string }[] = [];
  let total = 0;
  for (const { b } of pont) {
    if (escolhidos.length >= 4) break;
    let txt = '';
    try { txt = JSON.stringify(b.dados(q)); } catch { continue; }
    if (txt.length > LIMITE_BLOCO) txt = txt.slice(0, LIMITE_BLOCO) + '…(cortado)';
    if (total + txt.length > LIMITE_TOTAL && escolhidos.length > 0) continue;
    escolhidos.push({ b, txt }); total += txt.length;
  }
  return escolhidos;
}

async function chamarGroq(apiKey: string, model: string, messages: any[], jsonMode: boolean) {
  const payload: Record<string, unknown> = { model, messages, temperature: 0.1, max_tokens: 900 };
  if (model.startsWith('openai/gpt-oss')) payload.reasoning_effort = 'low';
  if (jsonMode) payload.response_format = { type: 'json_object' };
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(payload),
  });
}

// Limite por pessoa (versão pública): evita que alguém esgote o limite gratuito do Groq.
// É em memória (por instância do servidor): simples e suficiente para uso normal; o administrador não tem limite.
const PEDIDOS = new Map<string, number[]>();
const MAX_PEDIDOS = 8;
const JANELA_MS = 10 * 60 * 1000;
function excedeLimite(chave: string): boolean {
  const agora = Date.now();
  // Apaga os endereços sem pedidos nos últimos 10 minutos (nenhum IP fica guardado mais tempo do que isso)
  PEDIDOS.forEach((v, k) => { const r = v.filter((x) => agora - x < JANELA_MS); if (r.length) PEDIDOS.set(k, r); else PEDIDOS.delete(k); });
  const lista = (PEDIDOS.get(chave) || []).filter((x) => agora - x < JANELA_MS);
  if (lista.length >= MAX_PEDIDOS) { PEDIDOS.set(chave, lista); return true; }
  lista.push(agora);
  PEDIDOS.set(chave, lista);
  return false;
}

export async function POST(req: NextRequest) {
  const TOKEN = process.env.APP_SESSION_TOKEN;
  const admin = !process.env.APP_PASSWORD || !TOKEN || req.cookies.get('rb_session')?.value === TOKEN;
  if (!admin) {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anonimo';
    if (excedeLimite(ip)) return NextResponse.json({ erro: 'Fez muitas perguntas seguidas. Tente de novo dentro de alguns minutos. / Too many questions in a row. Please try again in a few minutes.' }, { status: 429 });
  }
  const apiKey = process.env.GROQ_KEY || process.env.NEXT_PUBLIC_GROQ_KEY;
  if (!apiKey) return NextResponse.json({ erro: 'GROQ_KEY não está configurada no servidor.' }, { status: 500 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 }); }
  const pergunta = typeof body?.pergunta === 'string' ? body.pergunta.trim().slice(0, 400) : '';
  const en = body?.lingua === 'en';
  const es = body?.lingua === 'es';
  const reputacao = typeof body?.reputacao === 'string' ? body.reputacao.slice(0, 6000) : '';
  if (pergunta.length < 3) return NextResponse.json({ erro: es ? 'Escriba una pregunta.' : en ? 'Write a question.' : 'Escreva uma pergunta.' }, { status: 400 });

  const blocos = escolherBlocos(pergunta);
  const qn = norm(pergunta);
  const usaReputacao = !!reputacao && (PALAVRAS_REPUTACAO.some((w) => qn.includes(w)) || blocos.length === 0);
  const indice = BLOCOS.map((b) => `- ${b.titulo}`).join('\n') + '\n- Reputação online dos locais (Google Maps)';
  const partes = blocos.map(({ b, txt }) => `[${b.id}] ${b.titulo} · fonte: ${b.fonte}\n${txt}`);
  if (usaReputacao) partes.push(`[reputacao] Reputação online dos locais (comentários do Google Maps, últimos 3 anos) · fonte: Google Maps, análise da plataforma\n${reputacao}`);

  const sistemaES = 'Eres el asistente del Observatorio de Turismo de Braga (Ayuntamiento de Braga). Respondes SOLO con los datos de los BLOQUES. Reglas: (1) Usa solo números que estén en los bloques; nunca inventes ni adivines valores. Puedes hacer cálculos sencillos con ellos, indicando que es un cálculo. (2) Si los datos no responden a la pregunta, di claramente que la plataforma no tiene ese dato e indica el dato más cercano disponible. (3) Indica el periodo de cada número. (4) Responde en español de España, de forma directa, en 1 a 4 frases o una lista corta. (5) Devuelve SOLO JSON: {"resposta": string, "fontes": [ids de los bloques usados], "separador": id de la pestaña más útil o null}.';
  const sistema = es ? sistemaES : en
    ? 'You are the assistant of the Braga Tourism Observatory (Braga City Council). Answer ONLY with the data in the BLOCKS. Rules: (1) Use only numbers present in the blocks; never invent or guess values. You may do simple arithmetic with them, saying it is a calculation. (2) If the data does not answer the question, say clearly that the platform does not have that data and mention the closest available data. (3) State the period of each number. (4) Answer in English, directly, in 1–4 sentences or a short list. (5) Return ONLY JSON: {"resposta": string, "fontes": [block ids used], "separador": id of the most useful tab or null}.'
    : 'És o assistente do Observatório de Turismo de Braga (Município de Braga). Respondes APENAS com os dados dos BLOCOS. Regras: (1) Usa só números que estejam nos blocos; nunca inventes nem adivinhes valores. Podes fazer contas simples com eles, dizendo que é um cálculo. (2) Se os dados não respondem à pergunta, diz claramente que a plataforma não tem esse dado e indica o dado mais próximo que existe. (3) Indica o período de cada número. (4) Responde em português de Portugal, de forma direta, em 1 a 4 frases ou numa lista curta; números com espaço nos milhares e vírgula decimal. (5) Devolve SÓ JSON: {"resposta": string, "fontes": [ids dos blocos usados], "separador": id do separador mais útil ou null}.';
  const utilizador = `${en ? 'QUESTION' : 'PERGUNTA'}: ${pergunta}\n\n${en ? 'TOPICS AVAILABLE ON THE PLATFORM' : 'TEMAS DISPONÍVEIS NA PLATAFORMA'}:\n${indice}\n\n${en ? 'VALID TAB IDS' : 'IDS DE SEPARADOR VÁLIDOS'}: ${IDS_SEPARADORES.join(', ')}\n\nBLOCOS:\n${partes.length ? partes.join('\n\n') : (en ? '(no block matched the question)' : '(nenhum bloco corresponde à pergunta)')}`;
  const model = process.env.GROQ_MODEL || MODELO_PADRAO;
  const messages = [{ role: 'system', content: sistema }, { role: 'user', content: utilizador }];

  try {
    let res = await chamarGroq(apiKey, model, messages, true);
    if (res.status === 400) res = await chamarGroq(apiKey, model, messages, false); // modelo sem modo JSON
    if (res.status === 429) {
      return NextResponse.json({ erro: en ? 'The AI usage limit was reached. Try again in a minute.' : 'Atingiu-se o limite de utilização da IA. Tente dentro de um minuto.', espera: Number(res.headers.get('retry-after')) || 60 }, { status: 429 });
    }
    if (!res.ok) return NextResponse.json({ erro: `Groq ${res.status}` }, { status: 502 });
    const data = await res.json();
    const txt: string = data?.choices?.[0]?.message?.content || '';
    let obj: any = null;
    try { obj = JSON.parse(txt); } catch { const m = txt.match(/\{[\s\S]*\}/); if (m) { try { obj = JSON.parse(m[0]); } catch { obj = null; } } }
    const resposta = obj && typeof obj.resposta === 'string' ? obj.resposta.trim() : txt.trim();
    if (!resposta) return NextResponse.json({ erro: en ? 'Empty answer.' : 'Resposta vazia.' }, { status: 502 });
    const enviados = new Map(blocos.map(({ b }) => [b.id, b] as [string, Bloco]));
    const fontes = (Array.isArray(obj?.fontes) ? obj.fontes : [])
      .filter((id: unknown): id is string => typeof id === 'string' && (enviados.has(id) || (id === 'reputacao' && usaReputacao)))
      .map((id: string) => (id === 'reputacao' ? { id, titulo: en ? 'Online reputation (Google Maps)' : 'Reputação online (Google Maps)', separador: null, fonte: 'Google Maps' } : { id, titulo: enviados.get(id)!.titulo, separador: enviados.get(id)!.separador, fonte: enviados.get(id)!.fonte }));
    const separador = typeof obj?.separador === 'string' && IDS_SEPARADORES.includes(obj.separador) ? obj.separador : (fontes.find((f: any) => f.separador)?.separador || null);
    return NextResponse.json({ resposta, fontes, separador });
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message || 'Erro ao contactar a IA.' }, { status: 502 });
  }
}
