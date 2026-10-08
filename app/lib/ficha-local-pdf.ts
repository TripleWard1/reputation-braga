import { t } from '@/app/lib/i18n';
import { UNESCO_BOM_JESUS } from '@/app/lib/unesco-bom-jesus';
import {
  gerarDocumento, kpis, seccao, subtitulo, tabela, paragrafo, lista, numerada, citacao, duas, caixa, barras, colunas, aviso, etiqueta, esc, type Celula, type Kpi, type Barra, type Coluna,
} from '@/app/lib/documento-pdf';

// Ficha de um local (Reputação) em PDF: documento A4 construído a partir dos dados da ficha,
// com as mesmas secções do ecrã, sem botões, menus nem fundos escuros.

export interface TemaPdf { nome: string; estado: string; tom: 'forte' | 'persistente' | 'novo' | 'deixou'; nota: string }
export interface ProblemaPdf { problema: string; detalhe: string; estado: string }
export interface CriticaPdf { tema: string; pr: number; nr: number; pp: number; np: number; tend: 'pior' | 'melhor' | 'igual' }
export interface MercadoPdf { nome: string; n: number; avg: number; neg: number; valoriza: string[]; critica: string[] }
export interface DadosFicha {
  nome: string; categoria: string; meta: string; bomJesus: boolean;
  kpis: Kpi[]; alerta: string | null;
  tituloResumo: string; resumo: string;
  tituloTemas: string; temas: TemaPdf[];
  fortes: string[]; problemas: string[]; citPos: { texto: string; rodape: string }[]; citNeg: { texto: string; rodape: string }[];
  periodos: { titulo: string; recentes: ProblemaPdf[]; anteriores: ProblemaPdf[]; baseR: number; baseP: number; criticas: CriticaPdf[] } | null;
  dimensoes: { nome: string; valor: number | null; mencoes: number | null }[];
  tituloEvolucao: string; trimestres: { q: string; avg: number; n: number; negPct?: number }[];
  tituloDist: string; dist: number[] | null;
  afluencia: { titulo: string; detalhe: string[] } | null;
  wiki: { titulo: string; artigo: string; linhas: { lingua: string; a: number; v: number | null }[] } | null;
  google: { horario: string[]; secoes: { titulo: string; sim: string[]; nao: string[] }[]; notas: string[] } | null;
  tituloMercados: string; idiomas: { nome: string; n: number; avg: number }[]; baseIdiomas: number; semTexto: number | null; mercados: MercadoPdf[];
  sugestoes: { titulo: string; texto: string }[];
  fonte: string;
}

function f1(v: number, d: number): string { return v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d }); }
function corTema(tom: TemaPdf['tom']): [string, string] {
  return tom === 'forte' ? ['#3B5B8C', '#EEF3FA'] : tom === 'persistente' ? ['#FFFFFF', '#C2410C'] : tom === 'novo' ? ['#C2410C', '#FDF1E7'] : ['#5A6270', '#EEF1F5'];
}
function corProblema(e: string): Celula {
  if (e === 'novo') return { html: etiqueta(t('Novo', 'New'), '#C2410C', '#FDF1E7') };
  if (e === 'persiste') return { html: etiqueta(t('Persiste', 'Persists'), '#FFFFFF', '#C2410C') };
  if (e === 'deixou') return { html: etiqueta(t('Deixou de ser referido', 'No longer mentioned'), '#5A6270', '#EEF1F5') };
  return '';
}
function rotuloTrimestre(q: string): string { const p = q.split('-T'); return `T${p[1]} ${p[0].slice(2)}`; }
function blocoProblemas(itens: ProblemaPdf[]): string {
  if (!itens.length) return `<p class="fonte">${esc(t('Sem problemas referidos neste período.', 'No issues mentioned in this period.'))}</p>`;
  const linhas: Celula[][] = [];
  for (let i = 0; i < itens.length; i++) {
    const p = itens[i];
    linhas.push([String(i + 1), { html: `<b>${esc(p.problema)}</b>${p.detalhe ? `<br><span style="color:#3A3F48">${esc(p.detalhe)}</span>` : ''}` }, corProblema(p.estado)]);
  }
  return tabela(['#', t('Problema', 'Issue'), ''], linhas, { larguras: ['6%', '', '24%'], compacta: true });
}

function seccaoUnesco(): string {
  const U: any = UNESCO_BOM_JESUS;
  const L = t('pt', 'en') as 'pt' | 'en';
  let h = seccao(t('Património Mundial da UNESCO desde 2019', 'UNESCO World Heritage since 2019'), t('Paisagem cultural inscrita pelos critérios (ii) e (iv) · o que a UNESCO avalia e pede ao Estado Português', 'Cultural landscape inscribed under criteria (ii) and (iv) · what UNESCO assesses and asks of Portugal'));
  const ficha: Celula[][] = [];
  for (let i = 0; i < U.ficha.length; i++) ficha.push([{ html: `<b>${esc(U.ficha[i][L][0])}</b>` }, U.ficha[i][L][1]]);
  ficha.push([{ html: `<b>${esc(t('Área protegida', 'Protected area'))}</b>` }, t(`${U.areas.total} ha (bem inscrito ${U.areas.bem} ha · zona tampão ${U.areas.tampao} ha)`, `${U.areas.total} ha (inscribed property ${U.areas.bem} ha · buffer zone ${U.areas.tampao} ha)`)]);
  h += tabela([t('Inscrição', 'Inscription'), ''], ficha, { larguras: ['30%', ''], compacta: true });
  const pedidos: string[] = [];
  for (let i = 0; i < U.pedidos.length; i++) pedidos.push(U.pedidos[i][L]);
  const acoes: Celula[][] = [];
  for (let i = 0; i < U.acoes.length; i++) {
    const a = U.acoes[i];
    acoes.push([a[L], a.estado === 'feito' ? { html: etiqueta(t('Concluído', 'Completed'), '#2E7D4F', '#E6F4EC') } : `${t('Previsto', 'Scheduled')}: ${a.quando}`]);
  }
  h += subtitulo(t('O que o Comité do Património Mundial pede (decisão 47 COM 7B.122, 2025)', 'What the World Heritage Committee requests (decision 47 COM 7B.122, 2025)'));
  h += lista(pedidos);
  h += subtitulo(t('Obras e intervenções', 'Works and interventions'));
  h += tabela([t('Intervenção', 'Intervention'), t('Estado', 'Status')], acoes, { larguras: ['', '36%'], compacta: true, nota: `${t('Fonte', 'Source')}: ${U.fonte}` });
  return h;
}

export function exportarFichaLocal(d: DadosFicha): void {
  let c = kpis(d.kpis);
  if (d.alerta) c += aviso(t('Alerta', 'Alert'), d.alerta);
  if (d.resumo) c += seccao(d.tituloResumo) + paragrafo(d.resumo);
  if (d.bomJesus) c += seccaoUnesco();

  if (d.temas.length) {
    c += seccao(d.tituloTemas, t('Comparação entre os últimos 12 meses e os 12–36 meses anteriores', 'Comparison between the last 12 months and the previous 12–36 months'));
    const linhas: Celula[][] = [];
    for (let i = 0; i < d.temas.length; i++) {
      const z = d.temas[i]; const cor = corTema(z.tom);
      linhas.push([{ html: `<b>${esc(z.nome)}</b>` }, { html: etiqueta(z.estado, cor[0], cor[1]) }, z.nota]);
    }
    c += tabela([t('Tema', 'Theme'), t('Estado', 'Status'), t('O que os visitantes dizem', 'What visitors say')], linhas, { larguras: ['22%', '16%', ''] });
  }

  if (d.fortes.length || d.problemas.length) {
    c += seccao(t('Pontos fortes e problemas', 'Strengths and issues'));
    let e = lista(d.fortes, '+', '#2E7D4F');
    for (let i = 0; i < d.citPos.length; i++) e += citacao(d.citPos[i].texto, d.citPos[i].rodape, '#2E7D4F');
    let r = lista(d.problemas, '−', '#B42318');
    for (let i = 0; i < d.citNeg.length; i++) r += citacao(d.citNeg[i].texto, d.citNeg[i].rodape, '#B42318');
    c += duas(caixa(e, t('Pontos fortes', 'Strengths'), '#2E7D4F'), caixa(r, t('Problemas identificados', 'Issues identified'), '#B42318'));
  }

  if (d.periodos) {
    const p = d.periodos;
    c += seccao(p.titulo, t('O que os visitantes apontaram nos últimos 12 meses, comparado com os 12–36 meses anteriores', 'What visitors pointed out in the last 12 months, compared with the previous 12–36 months'));
    c += subtitulo(`${t('Últimos 12 meses', 'Last 12 months')}${p.baseR ? ` · ${t(`${p.baseR} comentários com texto`, `${p.baseR} reviews with text`)}` : ''}`);
    c += blocoProblemas(p.recentes);
    c += subtitulo(`${t('12 a 36 meses atrás', '12 to 36 months ago')}${p.baseP ? ` · ${t(`${p.baseP} comentários com texto`, `${p.baseP} reviews with text`)}` : ''}`);
    c += blocoProblemas(p.anteriores);
    if (p.criticas.length) {
      c += subtitulo(t('Críticas por tema nos dois períodos', 'Criticism by theme in both periods'));
      const linhas: Celula[][] = [];
      for (let i = 0; i < p.criticas.length; i++) {
        const z = p.criticas[i];
        const tend = z.tend === 'pior' ? { html: `<b style="color:#B42318">↑ ${esc(t('A agravar', 'Worsening'))}</b>` } : z.tend === 'melhor' ? { html: `<b style="color:#2E7D4F">↓ ${esc(t('A melhorar', 'Improving'))}</b>` } : { html: `<span style="color:#5A6270">→ ${esc(t('Estável', 'Stable'))}</span>` };
        linhas.push([{ html: `<b>${esc(z.tema)}</b>` }, `${f1(z.pr, 1)}% · ${z.nr}`, `${f1(z.pp, 1)}% · ${z.np}`, tend]);
      }
      c += tabela([t('Tema', 'Theme'), t('Últimos 12 meses (% · menções)', 'Last 12 months (% · mentions)'), t('12 a 36 meses atrás (% · menções)', '12 to 36 months ago (% · mentions)'), t('Tendência', 'Trend')], linhas, { num: [1, 2], larguras: ['26%', '25%', '25%', ''], nota: t('Percentagem dos comentários com texto de cada período que critica o tema · tendência: diferença de 1 ponto percentual ou mais', 'Share of each period’s reviews with text criticising the theme · trend: a difference of 1 percentage point or more') });
    }
  }

  if (d.dimensoes.length) {
    c += seccao(t('Dimensões de avaliação', 'Rating dimensions'), t('De 0 a 10 · a partir dos elogios e críticas nos comentários · Experiência = índice global', '0 to 10 · from praise and criticism in reviews · Experience = overall index'));
    const bs: Barra[] = [];
    for (let i = 0; i < d.dimensoes.length; i++) {
      const z = d.dimensoes[i];
      bs.push({ rotulo: z.nome, valor: z.valor == null ? 0 : z.valor, texto: z.valor == null ? t('menções insuficientes', 'not enough mentions') : `${f1(z.valor, 1)}/10${z.mencoes != null ? ` · ${z.mencoes} ${t('menções', 'mentions')}` : ''}`, cor: z.valor != null && z.valor < 7 ? '#C2410C' : '#3B5B8C' });
    }
    c += barras(bs, 10);
  }

  if (d.trimestres.length >= 2 || d.dist) {
    let ev = '';
    if (d.trimestres.length >= 2) {
      let mn = 5;
      for (let i = 0; i < d.trimestres.length; i++) if (d.trimestres[i].avg < mn) mn = d.trimestres[i].avg;
      const cols: Coluna[] = [];
      for (let i = 0; i < d.trimestres.length; i++) cols.push({ rotulo: rotuloTrimestre(d.trimestres[i].q), valor: d.trimestres[i].avg, texto: f1(d.trimestres[i].avg, 2) });
      ev = `<h4>${esc(d.tituloEvolucao)}</h4>${colunas(cols, Math.max(0, Math.floor((mn - 0.3) * 10) / 10))}<p class="fonte">${esc(t('Média de estrelas por trimestre (eixo a partir de', 'Average stars per quarter (axis from'))} ${f1(Math.max(0, Math.floor((mn - 0.3) * 10) / 10), 1)})</p>`;
    }
    let ds = '';
    if (d.dist) {
      let n = 0; for (let i = 0; i < 5; i++) n += d.dist[i] || 0;
      const bs: Barra[] = [];
      for (let e = 5; e >= 1; e--) { const v = d.dist[e - 1] || 0; bs.push({ rotulo: `${e} ★`, valor: v, texto: `${f1(n ? (v / n) * 100 : 0, 1)}% · ${v}`, cor: e >= 4 ? '#2E7D4F' : e === 3 ? '#9AA1AC' : '#B42318' }); }
      ds = `<h4>${esc(d.tituloDist)}</h4>${barras(bs)}<p class="fonte">${esc(t('Percentagem de avaliações com cada número de estrelas, últimos 3 anos', 'Share of reviews by number of stars, last 3 years'))}</p>`;
    }
    c += seccao(t('Evolução e distribuição das estrelas', 'Trend and star distribution'));
    c += ev && ds ? duas(ev, ds) : ev + ds;
    if (d.trimestres.length >= 2) {
      const linhas: Celula[][] = [];
      for (let i = 0; i < d.trimestres.length; i++) { const z = d.trimestres[i]; linhas.push([rotuloTrimestre(z.q), f1(z.avg, 2), String(z.n), z.negPct == null ? '-' : `${f1(z.negPct, 1)}%`]); }
      c += tabela([t('Trimestre', 'Quarter'), t('Média (estrelas)', 'Average (stars)'), t('Avaliações', 'Reviews'), t('% negativas', '% negative')], linhas, { num: [1, 2, 3], compacta: true });
    }
  }

  if (d.afluencia) c += seccao(d.afluencia.titulo, t('Afluência habitual por dia e hora, segundo o Google Maps', 'Usual busyness by day and hour, according to Google Maps')) + lista(d.afluencia.detalhe);

  if (d.wiki && d.wiki.linhas.length) {
    c += seccao(d.wiki.titulo, t(`Visualizações do artigo "${d.wiki.artigo}" na Wikipédia nos últimos 12 meses, por língua · só pessoas, sem robôs`, `Views of the "${d.wiki.artigo}" Wikipedia article in the last 12 months, by language · people only, no bots`));
    let tot = 0; for (let i = 0; i < d.wiki.linhas.length; i++) tot += d.wiki.linhas[i].a;
    const linhas: Celula[][] = [];
    for (let i = 0; i < d.wiki.linhas.length; i++) {
      const z = d.wiki.linhas[i];
      linhas.push([{ html: `<b>${esc(z.lingua)}</b>` }, z.a.toLocaleString(t('pt-PT', 'en-GB')), `${f1(tot ? (z.a / tot) * 100 : 0, 0)}%`, z.v == null ? t('sem ano anterior', 'no previous year') : { html: `<b style="color:${z.v >= 0 ? '#2E7D4F' : '#B42318'}">${z.v >= 0 ? '+' : ''}${f1(z.v, 0)}%</b>` }]);
    }
    c += tabela([t('Língua', 'Language'), t('Visualizações', 'Views'), t('Quota', 'Share'), t('Vs ano anterior', 'Vs previous year')], linhas, { num: [1, 2, 3], compacta: true, nota: t('Fonte: Wikimedia (API pública)', 'Source: Wikimedia (public API)') });
  }

  if (d.google) {
    c += seccao(t('O que o Google diz sobre o local', 'What Google says about the place'), t('Informação declarada no separador "Acerca de" do Google Maps, não verificada', 'Information declared in the Google Maps "About" tab, not verified'));
    for (let i = 0; i < d.google.notas.length; i++) c += aviso(t('Atenção', 'Note'), d.google.notas[i]);
    const linhas: Celula[][] = [];
    if (d.google.horario.length) linhas.push([{ html: `<b>${esc(t('Horário', 'Opening hours'))}</b>` }, d.google.horario.join(' · '), '']);
    for (let i = 0; i < d.google.secoes.length; i++) { const sc = d.google.secoes[i]; linhas.push([{ html: `<b>${esc(sc.titulo)}</b>` }, sc.sim.join(' · '), sc.nao.join(' · ')]); }
    c += tabela(['', t('Tem', 'Has'), t('Não tem', 'Does not have')], linhas, { larguras: ['20%', '', '30%'], compacta: true });
  }

  if (d.idiomas.length || d.mercados.length) {
    c += seccao(d.tituloMercados, t('Idioma dos comentários como indicador do mercado de origem', 'Review language as an indicator of the source market'));
    if (d.idiomas.length) {
      const linhas: Celula[][] = [];
      for (let i = 0; i < d.idiomas.length; i++) { const z = d.idiomas[i]; linhas.push([{ html: `<b>${esc(z.nome)}</b>` }, z.n.toLocaleString(t('pt-PT', 'en-GB')), `${f1(d.baseIdiomas ? (z.n / d.baseIdiomas) * 100 : 0, 1)}%`, f1(z.avg, 2)]); }
      c += tabela([t('Idioma', 'Language'), t('Avaliações', 'Reviews'), t('Quota', 'Share'), t('Média (estrelas)', 'Average (stars)')], linhas, { num: [1, 2, 3], compacta: true, nota: d.semTexto ? t(`${f1(d.semTexto, 1)}% das avaliações são só estrelas, sem texto: contam para a média, mas não dizem de onde vem o visitante.`, `${f1(d.semTexto, 1)}% of reviews are stars only, without text: they count towards the average but do not reveal where the visitor is from.`) : undefined });
    }
    if (d.mercados.length) {
      c += subtitulo(t('O que cada mercado valoriza e critica', 'What each market values and criticises'));
      const linhas: Celula[][] = [];
      for (let i = 0; i < d.mercados.length; i++) {
        const m = d.mercados[i];
        linhas.push([{ html: `<b>${esc(m.nome)}</b><br><span style="color:#6F747D;font-size:9.5px">${m.n} · ${f1(m.avg, 2)} ★ · ${f1(m.neg, 1)}% ${esc(t('negativos', 'negative'))}</span>` }, { html: `<span style="color:#2E7D4F">${esc(m.valoriza.join(' · ') || '-')}</span>` }, { html: `<span style="color:#B42318">${esc(m.critica.join(' · ') || t('sem críticas relevantes', 'no relevant criticism'))}</span>` }]);
      }
      c += tabela([t('Mercado', 'Market'), t('Valoriza', 'Values'), t('Critica', 'Criticises')], linhas, { larguras: ['26%', '', ''], compacta: true });
    }
  }

  if (d.sugestoes.length) {
    c += seccao(t('O que os comentários sugerem', 'What the reviews suggest'), t('Possíveis melhorias identificadas pela IA a partir dos comentários dos visitantes · a título indicativo', 'Possible improvements identified by AI from visitor reviews · for guidance only'));
    c += numerada(d.sugestoes);
  }
  c += `<p class="fonte" style="margin-top:16px">${esc(d.fonte)}</p>`;

  gerarDocumento({
    eyebrow: `${t('Reputação', 'Reputation')} · ${d.categoria}`,
    titulo: d.nome,
    subtitulo: d.meta,
    ficheiro: `${d.nome} - ${t('Reputação', 'Reputation')}`,
    corpo: c,
  });
}
