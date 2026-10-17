// Índice da pesquisa global: tudo o que se pode abrir na plataforma, para resultados instantâneos enquanto se escreve.
// Só lê os dados (nomes, títulos, descrições); nenhum valor é alterado.
import { t } from '@/app/lib/i18n';
import { PRODUTOS } from '@/app/lib/produtos-dados';
import { DISTINCOES, FEIRAS, PROJETOS } from '@/app/lib/braga-mundo-dados';
import { AREAS } from '@/app/lib/insto-areas';

export type Destino =
  | { tipo: 'vista'; vista: string; ancora?: string }
  | { tipo: 'separador'; separador: string }
  | { tipo: 'local'; id: string };

export interface Entrada {
  id: string;
  grupo: string;
  titulo: string;
  sub?: string;
  icone: string; // caminho SVG (24×24)
  destino: Destino;
  texto: string; // texto normalizado onde se procura
}

export const norm = (s: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const ICONES = {
  pagina: 'M4 5h16v14H4zM4 9h16',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  produto: 'M4 4h12l4 4v12H4zM16 4v4h4',
  premio: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3a3 3 0 01-3 4M7 5H4a3 3 0 003 4',
  feira: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
  projeto: 'M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z',
  insto: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20',
  local: 'M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
};

// Separadores do Observatório (nome e palavras que as pessoas costumam usar)
const SEPARADORES: [string, [string, string], string][] = [
  ['geral', ['Visão Geral do Observatório', 'Observatory overview'], 'resumo sinais leituras populacao demografia'],
  ['procura', ['Procura (INE)', 'Demand (INE)'], 'dormidas hospedes estada media sazonalidade ine travelbi turistas'],
  ['estimativa', ['Estimativa 2026', '2026 estimate'], 'previsao projecao ano'],
  ['mercados', ['Mercados', 'Markets'], 'paises estrangeiros espanha franca brasil nacionalidade'],
  ['calendario', ['Calendário de oportunidades', 'Opportunity calendar'], 'feriados ferias escolares galiza espanha pontes'],
  ['aeroporto', ['Aeroporto', 'Airport'], 'porto passageiros voos'],
  ['caminhos', ['Caminhos de Santiago', 'Camino de Santiago'], 'peregrinos credencial geira'],
  ['perfil', ['Perfil do turista', 'Visitor profile'], 'inquerito idade motivo gasto'],
  ['visitas', ['Visitas ao concelho', 'Visits to the municipality'], 'telemovel geoanalytics excursionistas'],
  ['balcao', ['Atendimento Balcão', 'Front Desk'], 'posto de turismo atendimentos'],
  ['economia', ['Economia', 'Economy'], 'proveitos revpar adr ocupacao preco'],
  ['emprego', ['Emprego', 'Employment'], 'trabalhadores restauracao salario ganho'],
  ['cartoes', ['Gastos com cartão', 'Card spending'], 'sibs pagamentos despesa'],
  ['taxa', ['Taxa Turística', 'Tourist Tax'], 'receita cobranca'],
  ['hotelaria', ['Hotelaria', 'Hotels'], 'hoteis camas quartos'],
  ['alojamento', ['Alojamento Local', 'Short-term rentals'], 'al freguesias'],
  ['animacao', ['Animação turística', 'Tourism activities'], 'rnaat empresas'],
  ['cultura', ['Cultura', 'Culture'], 'bilheteira theatro circo gnration'],
  ['lojas', ['Lojas com História', 'Historic Shops'], 'comercio tradicional'],
  ['digital', ['Audiência Digital', 'Digital Audience'], 'site visitbraga google pesquisas'],
  ['ferramentas', ['Ferramentas digitais', 'Digital tools'], 'tomi smartguide'],
  ['sustentabilidade', ['Sustentabilidade', 'Sustainability'], 'residentes barometro green destinations certificacao'],
  ['mobilidade', ['Mobilidade (TUB)', 'Mobility (TUB)'], 'autocarros linhas horarios sameiro'],
  ['urbana', ['Mobilidade urbana', 'Urban mobility'], 'transito peoes estacionamento parques'],
  ['bairros', ['Bairros Comerciais Digitais', 'Digital Commercial Districts'], 'wifi centro historico'],
  ['acessibilidade', ['Acessibilidade', 'Accessibility'], 'mobilidade reduzida'],
  ['meteo', ['Meteorologia', 'Weather'], 'tempo chuva temperatura clima'],
  ['cruzamentos', ['Cruzamentos', 'Cross-analysis'], 'reputacao procura'],
  ['eventos', ['Impacto de eventos', 'Event impact'], 'festas sao joao semana santa'],
  ['metodologia', ['Fontes e metodologia', 'Sources and methodology'], 'fontes notas correcoes'],
];

// Páginas principais
const PAGINAS: [string, [string, string], [string, string], string][] = [
  ['overview', ['Visão Geral', 'Overview'], ['O destino num relance', 'The destination at a glance'], 'inicio capa video braga em numeros'],
  ['observatorio', ['Observatório', 'Observatory'], ['Todos os indicadores de turismo', 'All tourism indicators'], 'dados estatisticas'],
  ['insto', ['Rede INSTO', 'INSTO network'], ['As 11 áreas da ONU Turismo', 'The 11 UN Tourism areas'], 'onu sustentavel relatorio anual'],
  ['produtos', ['Produtos turísticos', 'Tourism products'], ['Mapas, brochuras e roteiros', 'Maps, brochures and itineraries'], 'pdf descarregar folhetos'],
  ['mundo', ['Internacionalização', 'Internationalisation'], ['Distinções, feiras e projetos europeus', 'Awards, trade fairs and European projects'], 'premios feiras cooperacao'],
  ['locais', ['Locais', 'Places'], ['Reputação de cada local', 'Reputation of each place'], 'avaliacoes google comentarios indice'],
  ['mapa', ['Mapa de reputação', 'Reputation map'], ['Os locais no mapa', 'Places on the map'], 'mapa localizacao'],
  ['mercados', ['Mercados', 'Markets'], ['Procura e satisfação por língua', 'Demand and satisfaction by language'], 'linguas paises satisfacao'],
];

/** Nome do separador do Observatório na língua atual (ou null se não existir). */
export function nomeSeparador(id: string): string | null { const x = SEPARADORES.find((s) => s[0] === id); return x ? t(x[1][0], x[1][1]) : null; }

const tx = (x: any) => (typeof x === 'string' ? x : t(x?.pt || '', x?.en || x?.pt || ''));

export function construirIndice(locais: { id: string; name: string; category?: string }[]): Entrada[] {
  const out: Entrada[] = [];
  const add = (e: Omit<Entrada, 'texto'>, extra = '') => out.push({ ...e, texto: norm(`${e.titulo} ${e.sub || ''} ${extra}`) });
  PAGINAS.forEach(([id, n, d, kw]) => add({ id: `p-${id}`, grupo: t('Páginas', 'Pages'), titulo: t(n[0], n[1]), sub: t(d[0], d[1]), icone: ICONES.pagina, destino: { tipo: 'vista', vista: id } }, `${n[0]} ${n[1]} ${kw}`));
  SEPARADORES.forEach(([id, n, kw]) => add({ id: `s-${id}`, grupo: t('Observatório', 'Observatory'), titulo: t(n[0], n[1]), sub: t('Separador do Observatório', 'Observatory tab'), icone: ICONES.grafico, destino: { tipo: 'separador', separador: id } }, `${n[0]} ${n[1]} ${kw}`));
  AREAS.forEach((a, i) => add({ id: `i-${i}`, grupo: 'Rede INSTO', titulo: t(a.pt, a.en), sub: t(a.tem[0], a.tem[1]), icone: ICONES.insto, destino: a.separador ? { tipo: 'separador', separador: a.separador } : { tipo: 'vista', vista: 'insto', ancora: 'insto-ambiente' } }, `${a.pt} ${a.en} insto`));
  PRODUTOS.forEach((p) => add({ id: `pr-${p.id}`, grupo: t('Produtos turísticos', 'Tourism products'), titulo: p.nome, sub: `${p.tipo} · ${t(p.descricao[0], p.descricao[1])}`, icone: ICONES.produto, destino: { tipo: 'vista', vista: 'produtos' } }, p.linguas.join(' ')));
  DISTINCOES.forEach((d, i) => add({ id: `d-${i}`, grupo: t('Distinções', 'Awards'), titulo: tx(d.titulo), sub: `${d.ano} · ${d.entidade}`, icone: ICONES.premio, destino: { tipo: 'vista', vista: 'mundo', ancora: 'bm-reconhecimento' } }, `${d.ano} premio distincao`));
  const feiras = new Map<string, { nome: string; local: string; anos: Set<string> }>();
  FEIRAS.forEach((f) => {
    const nome = tx(f.nome);
    const x = feiras.get(nome) || { nome, local: [f.cidade, f.pais].filter(Boolean).join(' · '), anos: new Set<string>() };
    x.anos.add(f.ini.slice(0, 4)); feiras.set(nome, x);
  });
  Array.from(feiras.values()).forEach((f, i) => add({ id: `f-${i}`, grupo: t('Feiras', 'Trade fairs'), titulo: f.nome, sub: `${f.local} · ${Array.from(f.anos).sort().join(', ')}`, icone: ICONES.feira, destino: { tipo: 'vista', vista: 'mundo', ancora: 'bm-feiras' } }, 'feira'));
  PROJETOS.forEach((p, i) => add({ id: `pj-${i}`, grupo: t('Cooperação europeia', 'European cooperation'), titulo: tx(p.nome), sub: [p.cidade, p.pais, p.ini.slice(0, 4)].filter(Boolean).join(' · '), icone: ICONES.projeto, destino: { tipo: 'vista', vista: 'mundo', ancora: 'bm-cooperacao' } }, 'projeto europeu'));
  locais.forEach((l) => add({ id: `l-${l.id}`, grupo: t('Locais', 'Places'), titulo: l.name, sub: l.category, icone: ICONES.local, destino: { tipo: 'local', id: l.id } }, 'local reputacao'));
  return out;
}

/** Procura no índice: todas as palavras têm de aparecer; títulos que começam pela pesquisa ficam primeiro. */
export function procurar(indice: Entrada[], q: string, max = 9): Entrada[] {
  const nq = norm(q).trim();
  if (nq.length < 2) return [];
  const palavras = nq.split(/\s+/).filter((w) => w.length > 1 && !['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'o', 'a', 'e', 'os', 'as', 'que', 'qual', 'quais', 'como', 'quanto', 'quantos', 'quantas', 'the', 'of', 'in'].includes(w));
  // "Braga" está em quase tudo: só conta quando é a única palavra
  if (palavras.length > 1) { const sem = palavras.filter((w) => w !== 'braga' && w !== 'houve' && w !== 'existem' && w !== 'ha'); if (sem.length) palavras.splice(0, palavras.length, ...sem); }
  if (!palavras.length) return [];
  const pont = indice.map((e) => {
    const tit = norm(e.titulo);
    let p = 0; let n = 0;
    for (const w of palavras) {
      const raiz = w.length > 5 ? w.slice(0, w.length - 1) : w; // tolera singular/plural (mercado/mercados)
      if (tit.startsWith(raiz)) { p += 6; n++; }
      else if (new RegExp(`\\b${raiz.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(tit)) { p += 4; n++; }
      else if (tit.includes(raiz)) { p += 3; n++; }
      else if (e.texto.includes(raiz)) { p += 1; n++; }
    }
    // Todas as palavras encontradas ficam à frente; com várias palavras aceita correspondências parciais
    return { e, p: n === palavras.length ? p + 20 : palavras.length > 1 && n > 0 ? p : 0 };
  }).filter((x) => x.p > 0).sort((a, b) => b.p - a.p);
  return pont.slice(0, max).map((x) => x.e);
}
