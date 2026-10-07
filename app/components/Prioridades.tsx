'use client';

import { useState } from 'react';
import { t } from '@/app/lib/i18n';
import { numeros, TEMAS, type LocMin } from '@/app/lib/temas';
import { descarregarDados } from '@/app/lib/exportar-dados';

// Prioridades de gestão (só administração): onde intervir primeiro, com o ganho estimado na reputação.
// Método (explicado na página): para cada local e tema, a quota de comentários dos últimos 12 meses que critica o tema;
// ganho estimado se o problema fosse resolvido, em intervalo (as avaliações críticas valem entre 2 e 3 estrelas);
// impacto no índice do destino ponderado pelo número de avaliações; tendência face aos 12–36 meses anteriores.
const MIN_CRITICAS = 3;
const MIN_COMENTARIOS = 15;
const NOTA_CRITICA_BAIXA = 2.0;
const NOTA_CRITICA_ALTA = 3.0;

interface Intervencao {
  localId: string; local: string; tema: string; temaNome: string; n: number; avg: number; idx: number;
  quota: number; quotaAnt: number | null; criticas: number; textRec: number;
  ganhoMin: number; ganhoMax: number; ganhoMed: number; destino: number; tendencia: 'agrava' | 'melhora' | 'estavel' | 'novo';
  estado: string | null; prioridade: number; avaliacoesEmCausa: number;
}
interface LocalInfo { id: string; nome: string; n: number; idx: number; recs: { titulo: string; texto: string }[]; interv: Intervencao[] }

function nomeTema(id: string) { for (let i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === id) return t(TEMAS[i].pt, TEMAS[i].en); return id; }
function ganho(avg: number, s: number, c: number) {
  if (s <= 0 || s >= 0.95 || avg <= c) return 0;
  const d = (s * (avg - c)) / (1 - s); // subida da média em estrelas se as avaliações críticas passassem a valer como as restantes
  return Math.max(0, Math.min(5 - avg, d)) * 2; // em pontos do índice /10
}
function porPrioridade(a: Intervencao, b: Intervencao) { return b.prioridade - a.prioridade; }
function porDestino(a: [string, Intervencao[], number], b: [string, Intervencao[], number]) { return b[2] - a[2]; }
function porIndice(a: LocalInfo, b: LocalInfo) { return a.idx - b.idx; }

function analisar(locs: LocMin[]) {
  const locais: LocalInfo[] = [];
  let somaN = 0;
  for (let i = 0; i < locs.length; i++) { const x = numeros(locs[i]); if (x && x.robustez !== 'insuficiente') somaN += x.n; }
  const todas: Intervencao[] = [];
  for (let i = 0; i < locs.length; i++) {
    const l: any = locs[i]; const x = numeros(locs[i]);
    const v2 = l.analysis && l.analysis.v2;
    if (!x || x.robustez === 'insuficiente' || !v2 || !Array.isArray(v2.temasTodos)) continue;
    const textRec = Number(v2.textRec) || 0; const textPrev = Number(v2.textPrev) || 0;
    const estados: Record<string, string> = {};
    if (Array.isArray(v2.temas)) for (let j = 0; j < v2.temas.length; j++) if (v2.temas[j] && v2.temas[j].id) estados[v2.temas[j].id] = v2.temas[j].estado;
    const info: LocalInfo = { id: l.id, nome: l.name, n: x.n, idx: x.idx, recs: Array.isArray(v2.recomendacoes) ? v2.recomendacoes : [], interv: [] };
    for (let j = 0; j < v2.temasTodos.length; j++) {
      const z = v2.temasTodos[j];
      if (!z || z.id === 'paisagem') continue; // a paisagem é o motivo da visita, não um problema de gestão
      const criticas = Number(z.recNeg) || 0;
      if (criticas < MIN_CRITICAS || textRec < MIN_COMENTARIOS) continue;
      const s = criticas / textRec;
      const sAnt = textPrev >= MIN_COMENTARIOS ? (Number(z.prevNeg) || 0) / textPrev : null;
      const gMin = ganho(x.avg, s, NOTA_CRITICA_ALTA); const gMax = ganho(x.avg, s, NOTA_CRITICA_BAIXA); const gMed = (gMin + gMax) / 2;
      const dif = sAnt === null ? null : (s - sAnt) * 100;
      const tendencia = sAnt === null || (sAnt === 0 && s > 0) ? 'novo' : dif !== null && dif >= 2 ? 'agrava' : dif !== null && dif <= -2 ? 'melhora' : 'estavel';
      const destino = somaN ? (x.n * (gMed / 2)) / somaN * 2 : 0;
      const fator = tendencia === 'agrava' || tendencia === 'novo' ? 1.25 : tendencia === 'melhora' ? 0.8 : 1;
      const it: Intervencao = {
        localId: l.id, local: l.name, tema: z.id, temaNome: nomeTema(z.id), n: x.n, avg: x.avg, idx: x.idx,
        quota: s * 100, quotaAnt: sAnt === null ? null : sAnt * 100, criticas, textRec,
        ganhoMin: gMin, ganhoMax: gMax, ganhoMed: gMed, destino, tendencia, estado: estados[z.id] || null,
        prioridade: gMed * Math.sqrt(x.n) * fator, avaliacoesEmCausa: Math.round(s * x.n),
      };
      info.interv.push(it); todas.push(it);
    }
    info.interv.sort(porPrioridade);
    locais.push(info);
  }
  todas.sort(porPrioridade);
  // problemas transversais: o mesmo tema em vários locais
  const porTema: Record<string, Intervencao[]> = {};
  for (let i = 0; i < todas.length; i++) { const k = todas[i].tema; if (!porTema[k]) porTema[k] = []; porTema[k].push(todas[i]); }
  const transversais: [string, Intervencao[], number][] = [];
  const ks = Object.keys(porTema);
  for (let i = 0; i < ks.length; i++) { let soma = 0; const l = porTema[ks[i]]; for (let j = 0; j < l.length; j++) soma += l[j].destino; if (l.length >= 2) transversais.push([ks[i], l, soma]); }
  transversais.sort(porDestino);
  let ganhoTotal = 0; for (let i = 0; i < todas.length; i++) ganhoTotal += todas[i].destino;
  locais.sort(porIndice);
  return { todas, transversais, locais, ganhoTotal };
}

const f1 = (v: number) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = (v: number) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function rotuloTendencia(x: Intervencao['tendencia']) {
  if (x === 'agrava') return [t('A agravar', 'Worsening'), '#EF8A7B'];
  if (x === 'melhora') return [t('A melhorar', 'Improving'), '#7CC79A'];
  if (x === 'novo') return [t('Novo', 'New'), '#EDA06B'];
  return [t('Estável', 'Stable'), '#A3A8B1'];
}

function CartaoIntervencao({ it, pos }: { it: Intervencao; pos: number }) {
  const [rt, cor] = rotuloTendencia(it.tendencia);
  return (
    <li className="pr-it">
      <span className="pr-pos">{pos}</span>
      <div className="pr-it-c">
        <div className="pr-it-top"><strong>{it.local}</strong><span className="pr-tema">{it.temaNome}</span></div>
        <div className="pr-it-dados">
          <div><b>{f1(it.quota)}%</b><span>{t('dos comentários (12 meses) criticam', 'of comments (12 months) criticise')}</span></div>
          <div><b style={{ color: cor }}>{rt}</b><span>{it.quotaAnt === null ? t('sem período anterior comparável', 'no comparable earlier period') : t(`${f1(it.quotaAnt)}% nos 12–36 meses anteriores`, `${f1(it.quotaAnt)}% in the previous 12–36 months`)}</span></div>
          <div><b>+{f2(it.ganhoMin)} a +{f2(it.ganhoMax)}</b><span>{t(`no índice do local (atual ${f1(it.idx)})`, `on the place index (now ${f1(it.idx)})`)}</span></div>
          <div><b>+{f2(it.destino)}</b><span>{t('no índice do destino', 'on the destination index')}</span></div>
        </div>
        <p className="pr-it-nota">{t(`${it.criticas} críticas em ${it.textRec} comentários com texto nos últimos 12 meses; cerca de ${it.avaliacoesEmCausa} das ${it.n} avaliações dos últimos 3 anos estarão relacionadas.`, `${it.criticas} criticisms in ${it.textRec} text comments over the last 12 months; about ${it.avaliacoesEmCausa} of the ${it.n} ratings over the last 3 years are likely related.`)}</p>
      </div>
    </li>
  );
}

function DetalheLocal({ l }: { l: LocalInfo }) {
  let potencial = 0; for (let i = 0; i < l.interv.length && i < 3; i++) potencial += l.interv[i].ganhoMed;
  potencial = Math.min(10 - l.idx, potencial);
  return (
    <details className="pr-local">
      <summary>
        <span className="pr-local-n">{l.nome}</span>
        <span className="pr-local-i">{f1(l.idx)}<small>/10</small></span>
        <span className="pr-local-p">{l.interv.length ? t(`até +${f2(potencial)} com os 3 principais`, `up to +${f2(potencial)} with the top 3`) : t('sem críticas relevantes', 'no relevant criticism')}</span>
      </summary>
      {l.interv.length > 0 && (
        <table className="pr-tab">
          <thead><tr><th>{t('Tema', 'Theme')}</th><th>{t('Críticas (12 m)', 'Criticism (12 m)')}</th><th>{t('Tendência', 'Trend')}</th><th>{t('Ganho no índice do local', 'Gain on place index')}</th></tr></thead>
          <tbody>{l.interv.map((it) => <LinhaTema key={it.tema} it={it} />)}</tbody>
        </table>
      )}
      {l.recs.length > 0 && (
        <div className="pr-recs">
          <span className="pr-recs-t">{t('Sugestões da análise dos comentários', 'Suggestions from the comment analysis')}</span>
          <ul>{l.recs.map((r, i) => <li key={i}><strong>{r.titulo}</strong>{r.texto ? ` · ${r.texto}` : ''}</li>)}</ul>
        </div>
      )}
    </details>
  );
}
function LinhaTema({ it }: { it: Intervencao }) {
  const [rt, cor] = rotuloTendencia(it.tendencia);
  return <tr><td data-l={t('Tema', 'Theme')}>{it.temaNome}</td><td data-l={t('Críticas (12 m)', 'Criticism (12 m)')}>{f1(it.quota)}% ({it.criticas})</td><td data-l={t('Tendência', 'Trend')} style={{ color: cor }}>{rt}</td><td data-l={t('Ganho no índice do local', 'Gain on place index')}>+{f2(it.ganhoMin)} a +{f2(it.ganhoMax)}</td></tr>;
}

export default function Prioridades({ locations }: { locations: LocMin[] }) {
  const { todas, transversais, locais, ganhoTotal } = analisar(locations);
  const [mostrar, setMostrar] = useState(10);
  const exportar = () => {
    const linhas = todas.map((it, i) => ({
      [t('Prioridade', 'Priority')]: i + 1, [t('Local', 'Place')]: it.local, [t('Tema', 'Theme')]: it.temaNome,
      [t('% comentários críticos (12 m)', '% critical comments (12 m)')]: Math.round(it.quota * 10) / 10,
      [t('% nos 12–36 meses anteriores', '% in previous 12–36 months')]: it.quotaAnt === null ? null : Math.round(it.quotaAnt * 10) / 10,
      [t('Tendência', 'Trend')]: rotuloTendencia(it.tendencia)[0], [t('Índice atual do local', 'Current place index')]: it.idx,
      [t('Ganho mínimo (índice do local)', 'Minimum gain (place index)')]: Math.round(it.ganhoMin * 100) / 100,
      [t('Ganho máximo (índice do local)', 'Maximum gain (place index)')]: Math.round(it.ganhoMax * 100) / 100,
      [t('Impacto no índice do destino', 'Impact on destination index')]: Math.round(it.destino * 100) / 100,
      [t('Críticas (12 m)', 'Criticism (12 m)')]: it.criticas, [t('Comentários com texto (12 m)', 'Text comments (12 m)')]: it.textRec,
    }));
    descarregarDados(t('Prioridades de gestão', 'Management priorities'), [linhas]);
  };
  return (
    <div className="pr">
      <style>{CSS}</style>
      <header className="pr-cab">
        <span className="pr-kicker">{t('Administração · uso interno', 'Administration · internal use')}</span>
        <h1>{t('Prioridades de gestão', 'Management priorities')}</h1>
        <p>{t('Onde intervir primeiro nos locais monitorizados: os problemas apontados pelos visitantes, ordenados pelo ganho estimado na reputação se fossem resolvidos.', 'Where to act first at the monitored places: the issues raised by visitors, ranked by the estimated reputation gain if they were solved.')}</p>
        <div className="pr-kpis">
          <div><b>{todas.length}</b><span>{t('intervenções identificadas', 'interventions identified')}</span></div>
          <div><b>{transversais.length}</b><span>{t('problemas comuns a vários locais', 'issues shared by several places')}</span></div>
          <div><b>+{f2(ganhoTotal)}</b><span>{t('ganho potencial no índice do destino, se tudo fosse resolvido', 'potential gain on the destination index, if all were solved')}</span></div>
        </div>
      </header>

      <section className="pr-sec">
        <div className="pr-sec-cab"><h2>{t('Intervenções prioritárias', 'Priority interventions')}</h2><button type="button" className="pr-btn" onClick={exportar}>{t('Exportar para Excel', 'Export to Excel')}</button></div>
        <p className="pr-ajuda">{t('A prioridade combina o ganho estimado, a visibilidade do local (número de avaliações) e a tendência: os problemas novos ou a agravar sobem na lista.', 'Priority combines the estimated gain, the place’s visibility (number of ratings) and the trend: new or worsening issues move up the list.')}</p>
        <ol className="pr-lista">{todas.slice(0, mostrar).map((it, i) => <CartaoIntervencao key={`${it.localId}-${it.tema}`} it={it} pos={i + 1} />)}</ol>
        {todas.length > mostrar && <button type="button" className="pr-btn pr-mais" onClick={() => setMostrar(todas.length)}>{t(`Ver todas (${todas.length})`, `See all (${todas.length})`)}</button>}
      </section>

      {transversais.length > 0 && (
        <section className="pr-sec">
          <h2>{t('Problemas comuns a vários locais', 'Issues shared by several places')}</h2>
          <p className="pr-ajuda">{t('O mesmo problema em vários locais aponta para uma questão do destino, que se resolve melhor com uma medida comum do que local a local.', 'The same issue at several places points to a destination-wide matter, better solved with a common measure than place by place.')}</p>
          <ul className="pr-trans">
            {transversais.map(([tema, l, soma]) => <LinhaTransversal key={tema} tema={tema} lista={l} soma={soma} />)}
          </ul>
        </section>
      )}

      <section className="pr-sec">
        <h2>{t('Por local', 'By place')}</h2>
        <p className="pr-ajuda">{t('Do índice mais baixo para o mais alto. Abra cada local para ver todos os temas e as sugestões da análise dos comentários.', 'From the lowest to the highest index. Open each place to see every theme and the suggestions from the comment analysis.')}</p>
        <div className="pr-locais">{locais.map((l) => <DetalheLocal key={l.id} l={l} />)}</div>
      </section>

      <section className="pr-sec pr-met">
        <h2>{t('Método e limitações', 'Method and limitations')}</h2>
        <ol>
          <li>{t(`Para cada local e tema, conta-se a quota de comentários com texto dos últimos 12 meses que critica o tema. Só entram temas com pelo menos ${MIN_CRITICAS} críticas e locais com pelo menos ${MIN_COMENTARIOS} comentários nesse período.`, `For each place and theme, the share of text comments over the last 12 months criticising the theme is counted. Only themes with at least ${MIN_CRITICAS} criticisms and places with at least ${MIN_COMMENTS_EN} comments in that period are included.`)}</li>
          <li>{t(`O ganho estimado supõe que, resolvido o problema, as avaliações que o criticam passariam a valer como as restantes. Como a nota exata dessas avaliações não é conhecida, o ganho é apresentado como intervalo: entre ${NOTA_CRITICA_ALTA.toString().replace('.', ',')} e ${NOTA_CRITICA_BAIXA.toString().replace('.', ',')} estrelas para as avaliações críticas.`, `The estimated gain assumes that, once the issue is solved, the ratings criticising it would be worth the same as the others. As their exact score is unknown, the gain is shown as a range: between ${NOTA_CRITICA_ALTA} and ${NOTA_CRITICA_BAIXA} stars for the critical ratings.`)}</li>
          <li>{t('O impacto no índice do destino pondera o ganho de cada local pelo seu número de avaliações, com a mesma regra do índice do destino.', 'The impact on the destination index weights each place’s gain by its number of ratings, using the same rule as the destination index.')}</li>
          <li>{t('A tendência compara a quota de críticas dos últimos 12 meses com a dos 12 a 36 meses anteriores (diferença de 2 pontos percentuais ou mais).', 'The trend compares the share of criticism over the last 12 months with the previous 12 to 36 months (difference of 2 percentage points or more).')}</li>
          <li>{t('Limitações: a classificação dos temas é automática (IA) e pode errar em comentários ambíguos; os ganhos não são somáveis dentro do mesmo local, porque um comentário pode criticar vários temas; e uma estimativa não substitui a verificação no terreno.', 'Limitations: theme classification is automatic (AI) and can err on ambiguous comments; gains are not additive within the same place, since one comment can criticise several themes; and an estimate does not replace on-site verification.')}</li>
        </ol>
      </section>
    </div>
  );
}
const MIN_COMMENTS_EN = MIN_COMENTARIOS;
function LinhaTransversal({ tema, lista, soma }: { tema: string; lista: Intervencao[]; soma: number }) {
  return (
    <li className="pr-tr">
      <div className="pr-tr-top"><strong>{nomeTema(tema)}</strong><b>+{f2(soma)}</b></div>
      <span className="pr-tr-l">{t(`${lista.length} locais`, `${lista.length} places`)} · {lista.map(nomeLocal).join(', ')}</span>
    </li>
  );
}
function nomeLocal(it: Intervencao) { return it.local; }

const CSS = `
.pr { color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; max-width: 1400px; margin: 0 auto; padding: 36px 40px 56px; }
.pr-cab { padding: 26px 28px; border-radius: 18px; background: radial-gradient(700px 240px at 100% 0%, rgba(237,160,107,.12), transparent 70%), linear-gradient(180deg, #20242B, #1A1D22); border: 1px solid #2D3139; margin-bottom: 26px; }
.pr-kicker { font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #EDA06B; }
.pr-cab h1 { margin: 8px 0 8px; font-size: clamp(28px, 4vw, 40px); letter-spacing: -0.02em; }
.pr-cab p { margin: 0 0 18px; color: #C9CDD3; font-size: 15.5px; line-height: 1.6; max-width: 820px; }
.pr-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.pr-kpis div { padding: 14px 16px; border-radius: 12px; background: rgba(15,17,20,.5); border: 1px solid #2D3139; }
.pr-kpis b { display: block; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
.pr-kpis span { font-size: 13px; color: #A3A8B1; line-height: 1.4; }
.pr-sec { margin-bottom: 30px; }
.pr-sec h2 { margin: 0 0 6px; font-size: 22px; letter-spacing: -0.01em; }
.pr-sec-cab { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.pr-ajuda { margin: 0 0 14px; font-size: 14px; color: #A3A8B1; line-height: 1.55; max-width: 900px; }
.pr-btn { height: 36px; padding: 0 16px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #ECEDEF; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.pr-btn:hover { border-color: #8AB0E6; background: rgba(138,176,230,.12); }
.pr-mais { margin-top: 12px; }
.pr-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.pr-it { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 14px; padding: 16px 18px; border-radius: 14px; background: #1C1F24; border: 1px solid #2D3139; }
.pr-pos { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; background: rgba(237,160,107,.14); color: #EDA06B; }
.pr-it-top { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; margin-bottom: 10px; }
.pr-it-top strong { font-size: 16px; }
.pr-tema { font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 999px; background: #22262D; color: #C9CDD3; }
.pr-it-dados { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.pr-it-dados div { padding: 10px 12px; border-radius: 10px; background: #22262D; }
.pr-it-dados b { display: block; font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
.pr-it-dados span { font-size: 12px; color: #A3A8B1; line-height: 1.35; }
.pr-it-nota { margin: 10px 0 0; font-size: 12.5px; color: #8A909B; line-height: 1.5; }
.pr-trans { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; }
.pr-tr { padding: 14px 16px; border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; }
.pr-tr-top { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; } .pr-tr-top b { color: #EDA06B; font-size: 17px; }
.pr-tr-l { display: block; margin-top: 6px; font-size: 13px; color: #A3A8B1; line-height: 1.5; }
.pr-locais { display: flex; flex-direction: column; gap: 8px; }
.pr-local { border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; }
.pr-local > summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 14px; align-items: center; padding: 12px 16px; }
.pr-local > summary::-webkit-details-marker { display: none; }
.pr-local-n { font-weight: 700; } .pr-local-i { font-weight: 800; font-size: 17px; } .pr-local-i small { font-size: 12px; color: #A3A8B1; font-weight: 600; }
.pr-local-p { font-size: 12.5px; color: #7CC79A; font-weight: 600; }
.pr-local[open] { padding-bottom: 14px; } .pr-local[open] > *:not(summary) { margin: 0 16px; }
.pr-tab { width: calc(100% - 32px); border-collapse: collapse; font-size: 13.5px; margin-bottom: 12px !important; }
.pr-tab th, .pr-tab td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #2D3139; }
.pr-tab th { font-size: 11.5px; color: #8A909B; text-transform: uppercase; letter-spacing: .06em; }
.pr-recs { padding: 12px 14px; border-radius: 10px; background: rgba(138,176,230,.08); border: 1px solid rgba(138,176,230,.25); }
.pr-recs-t { font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8AB0E6; }
.pr-recs ul { margin: 8px 0 0; padding-left: 18px; font-size: 13.5px; color: #C9CDD3; line-height: 1.55; }
.pr-met ol { margin: 0; padding-left: 20px; font-size: 14px; color: #C9CDD3; line-height: 1.65; }
.pr button:focus-visible, .pr summary:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
@media (max-width: 900px) { .pr-it-dados { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pr-kpis { grid-template-columns: 1fr; } }
@media (max-width: 760px) {
  .pr { padding: 22px 16px 36px; } .pr-cab { padding: 18px; }
  .pr-it { grid-template-columns: 1fr; } .pr-pos { width: 34px; height: 34px; }
  .pr-local > summary { grid-template-columns: minmax(0, 1fr) auto; } .pr-local-p { grid-column: 1 / -1; }
  .pr-tab thead { display: none; } .pr-tab, .pr-tab tbody, .pr-tab tr, .pr-tab td { display: block; width: 100%; }
  .pr-tab tr { padding: 8px 0; border-bottom: 1px solid #2D3139; } .pr-tab td { border: 0; padding: 2px 0; }
  .pr-tab td::before { content: attr(data-l) ': '; color: #8A909B; font-size: 12px; }
}
`;
