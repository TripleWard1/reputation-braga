'use client';

import { useState } from 'react';
import { MESES, DORMIDAS_BRAGA } from '@/app/lib/observatorio-dados';
import { t, getLang } from '@/app/lib/i18n';
import { C, Card } from './comum';
import { descarregarDados } from '@/app/lib/exportar-dados';
import { gerarDocumento, kpis, seccao, subtitulo, tabela, paragrafo, lista, fontes as listaFontes, etiqueta, aviso, type Celula } from '@/app/lib/documento-pdf';
import { DATAS, MERCADOS, FONTES, type Mercado, type Data, type Texto3, type Grupo } from '@/app/lib/calendario-mercados-dados';

// Calendário de oportunidades por mercado.
// 1) Cada feriado isolado é convertido numa janela de viagem a partir do dia da semana
//    (segunda → sábado a segunda; sexta → sexta a domingo; terça → ponte de sábado a terça; quinta → ponte de quinta a domingo).
// 2) Janelas sobrepostas do mesmo mercado são fundidas.
// 3) Cada janela é cruzada com a procura de Braga nesse mês (índice de sazonalidade das dormidas, média 2023–2025).
// Funções de topo, sem funções aninhadas que usem parâmetros de fora (o compressor do Next.js parte esse padrão).

const DIA = 86400000;
const ANOS_BASE = ['2023', '2024', '2025'];
const LIMIAR_BAIXA = 0.9;
const LIMIAR_ALTA = 1.15;
const SEMANAS_ANTECEDENCIA = 6;
const ORDEM: Mercado[] = ['galiza', 'espanha', 'madrid', 'catalunha', 'paisbasco', 'valencia', 'andaluzia', 'asturias', 'baleares', 'canarias', 'portugal', 'franca', 'reinounido'];
const GRUPOS: Grupo[] = ['proximo', 'regioes', 'outros'];
const COR: Record<Mercado, string> = {
  galiza: '#3B82F6', espanha: '#E0A526', madrid: '#F97316', catalunha: '#EAB308', paisbasco: '#10B981', valencia: '#F43F5E',
  andaluzia: '#84CC16', asturias: '#0EA5E9', baleares: '#A855F7', canarias: '#14B8A6', portugal: '#22A06B', franca: '#8B5CF6', reinounido: '#E5484D',
};

type TipoJanela = 'fimsemana' | 'ponte' | 'isolado' | 'ferias' | 'inicio';
interface Janela { mercado: Mercado; ini: number; fim: number; nomes: string[]; tipo: TipoJanela; fontes: string[]; feriado: boolean; regional: boolean }

function dia(s: string): number { const p = s.split('-'); return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
function nomeLang(n: Texto3): string { const l = getLang() as string; return l === 'en' ? n.en : l === 'es' ? n.es : n.pt; }
const MES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
function mesCurto(m: number): string { const l = getLang() as string; return l === 'en' ? MES_EN[m] : l === 'es' ? MES_ES[m] : MES_PT[m]; }
function loc(): string { const l = getLang() as string; return l === 'en' ? 'en-GB' : l === 'es' ? 'es-ES' : 'pt-PT'; }
function fmtDia(ms: number): string { const d = new Date(ms); return `${d.getUTCDate()} ${mesCurto(d.getUTCMonth())}`; }
function fmtDiaSemana(ms: number): string { return new Date(ms).toLocaleDateString(loc(), { weekday: 'short', timeZone: 'UTC' }).replace('.', ''); }
function fmtMesAno(ano: number, mes: number): string { const s = new Date(Date.UTC(ano, mes, 1)).toLocaleDateString(loc(), { month: 'long', year: 'numeric', timeZone: 'UTC' }); return s.charAt(0).toUpperCase() + s.slice(1); }
function intervalo(j: Janela): string { return j.fim === j.ini ? `${fmtDiaSemana(j.ini)}, ${fmtDia(j.ini)}` : `${fmtDia(j.ini)} – ${fmtDia(j.fim)}`; }
function dias(j: Janela): number { return Math.round((j.fim - j.ini) / DIA) + 1; }
function rotuloDias(j: Janela): string { const n = dias(j); return n === 1 ? t('1 dia', '1 day') : `${n} ${t('dias', 'days')}`; }

// Índice de sazonalidade: dormidas médias do mês ÷ média mensal (2023–2025).
function indiceMensal(): number[] {
  const medias: number[] = [];
  for (let m = 0; m < 12; m++) {
    let s = 0; let n = 0;
    const linha = DORMIDAS_BRAGA[MESES[m]] || {};
    for (let a = 0; a < ANOS_BASE.length; a++) { const v = linha[ANOS_BASE[a]]; if (typeof v === 'number') { s += v; n++; } }
    medias.push(n ? s / n : 0);
  }
  let tot = 0; for (let m = 0; m < 12; m++) tot += medias[m];
  const media = tot / 12 || 1;
  const r: number[] = []; for (let m = 0; m < 12; m++) r.push(medias[m] / media);
  return r;
}

function janelaDe(d: Data): Janela {
  const ini = dia(d.ini);
  const nome = nomeLang(d.nome);
  if (d.fim) return { mercado: d.mercado, ini, fim: dia(d.fim), nomes: [nome], tipo: d.tipo === 'escolar' ? 'ferias' : 'fimsemana', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  if (d.tipo === 'escolar') return { mercado: d.mercado, ini, fim: ini, nomes: [nome], tipo: 'inicio', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  const ds = new Date(ini).getUTCDay(); // 0 domingo … 6 sábado
  if (ds === 1) return { mercado: d.mercado, ini: ini - 2 * DIA, fim: ini, nomes: [nome], tipo: 'fimsemana', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  if (ds === 5) return { mercado: d.mercado, ini, fim: ini + 2 * DIA, nomes: [nome], tipo: 'fimsemana', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  if (ds === 2) return { mercado: d.mercado, ini: ini - 3 * DIA, fim: ini, nomes: [nome], tipo: 'ponte', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  if (ds === 4) return { mercado: d.mercado, ini, fim: ini + 3 * DIA, nomes: [nome], tipo: 'ponte', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
  return { mercado: d.mercado, ini, fim: ini, nomes: [nome], tipo: 'isolado', fontes: [d.fonte], feriado: !d.fim, regional: !!d.regional };
}
function porInicio(a: Janela, b: Janela) { return a.ini - b.ini || b.fim - a.fim; }
function juntar(lista: string[], extra: string[]) { for (let i = 0; i < extra.length; i++) if (lista.indexOf(extra[i]) < 0) lista.push(extra[i]); }
function prioridadeTipo(x: TipoJanela) { return x === 'ferias' ? 4 : x === 'ponte' ? 3 : x === 'fimsemana' ? 2 : x === 'inicio' ? 1 : 0; }

function construirJanelas(): Janela[] {
  const r: Janela[] = [];
  for (let k = 0; k < ORDEM.length; k++) {
    const m = ORDEM[k];
    const lista: Janela[] = [];
    for (let i = 0; i < DATAS.length; i++) if (DATAS[i].mercado === m) lista.push(janelaDe(DATAS[i]));
    lista.sort(porInicio);
    let atual: Janela | null = null;
    for (let i = 0; i < lista.length; i++) {
      const j = lista[i];
      // Só se funde um feriado com outra janela; períodos de férias distintos (ex.: zonas escolares francesas) ficam separados.
      // Dois feriados separados por um só dia útil (ex.: segunda 6 e quarta 8 de dezembro) formam uma ponte.
      const ponteUmDia = !!atual && atual.feriado && j.feriado && j.ini === atual.fim + 2 * DIA;
      if (atual && ((j.ini <= atual.fim + DIA && (j.feriado || atual.feriado)) || ponteUmDia)) {
        if (ponteUmDia) atual.tipo = 'ponte';
        if (j.fim > atual.fim) atual.fim = j.fim;
        juntar(atual.nomes, j.nomes); juntar(atual.fontes, j.fontes);
        if (prioridadeTipo(j.tipo) > prioridadeTipo(atual.tipo)) atual.tipo = j.tipo;
        atual.feriado = atual.feriado && j.feriado;
        atual.regional = atual.regional || j.regional;
      } else {
        if (atual) r.push(atual);
        atual = { mercado: j.mercado, ini: j.ini, fim: j.fim, nomes: j.nomes.slice(), tipo: j.tipo, fontes: j.fontes.slice(), feriado: j.feriado, regional: j.regional };
      }
    }
    if (atual) r.push(atual);
  }
  r.sort(porInicio);
  return r;
}

// Índice da procura na janela: média do índice dos meses que a janela toca, ponderada pelos dias.
function indiceJanela(j: Janela, idx: number[]): number {
  let s = 0; let n = 0;
  for (let d = j.ini; d <= j.fim; d += DIA) { s += idx[new Date(d).getUTCMonth()]; n++; }
  return n ? s / n : 1;
}
function ehOportunidade(j: Janela, idx: number[]) { return dias(j) >= 3 && indiceJanela(j, idx) < LIMIAR_BAIXA; }
function nivel(v: number): 'baixa' | 'media' | 'alta' { return v < LIMIAR_BAIXA ? 'baixa' : v >= LIMIAR_ALTA ? 'alta' : 'media'; }
function corNivel(n: 'baixa' | 'media' | 'alta') { return n === 'baixa' ? C.cyan : n === 'alta' ? C.orange : C.textMuted; }
function nomeNivel(n: 'baixa' | 'media' | 'alta') { return n === 'baixa' ? t('Procura baixa', 'Low demand') : n === 'alta' ? t('Procura alta', 'High demand') : t('Procura média', 'Average demand'); }
function nomeTipo(x: TipoJanela) {
  return x === 'ferias' ? t('Férias escolares', 'School holidays')
    : x === 'ponte' ? t('Ponte', 'Bridge')
    : x === 'fimsemana' ? t('Fim de semana prolongado', 'Long weekend')
    : x === 'inicio' ? t('Início de férias', 'Start of holidays')
    : t('Feriado isolado', 'Single holiday');
}
function nomeMercado(m: Mercado) { return nomeLang(MERCADOS[m].nome); }
function mercadosNoMes(js: Janela[], ano: number, mes: number): Janela[] {
  const a = Date.UTC(ano, mes, 1); const b = Date.UTC(ano, mes + 1, 1) - DIA;
  const r: Janela[] = [];
  for (let i = 0; i < js.length; i++) if (js[i].ini <= b && js[i].fim >= a) r.push(js[i]);
  return r;
}
// Na vista «Todos», uma região só aparece quando a janela tem um feriado próprio dela; o resto já está em «Espanha (feriados nacionais)».
function visivelEmTodos(j: Janela) { return MERCADOS[j.mercado].grupo !== 'regioes' || j.regional; }
function nomeGrupo(g: Grupo) {
  return g === 'proximo' ? t('Proximidade', 'Nearby')
    : g === 'regioes' ? t('Regiões espanholas com voo direto para o Porto', 'Spanish regions with direct flights to Porto')
    : t('Outros mercados', 'Other markets');
}
function textoVoo(m: Mercado): string {
  const v = MERCADOS[m].voo;
  if (!v) return '';
  return `${v.aeroportos} · ${v.companhias}${v.sazonal ? ' · ' + t('rota sazonal', 'seasonal route') : ''}`;
}
function Voo({ m }: { m: Mercado }) {
  const v = MERCADOS[m].voo;
  if (!v) return null;
  return (
    <span className={`cal-voo${v.sazonal ? ' saz' : ''}`} title={v.nota ? nomeLang(v.nota) : undefined}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
      {textoVoo(m)}
    </span>
  );
}
function mercadosDoGrupo(g: Grupo): Mercado[] { const r: Mercado[] = []; for (let i = 0; i < ORDEM.length; i++) if (MERCADOS[ORDEM[i]].grupo === g) r.push(ORDEM[i]); return r; }
function contarMercados(js: Janela[]): number { const v: string[] = []; for (let i = 0; i < js.length; i++) if (v.indexOf(js[i].mercado) < 0) v.push(js[i].mercado); return v.length; }

function Bandeira({ m }: { m: Mercado }) {
  if (m === 'galiza') {
    return (
      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" style={{ borderRadius: 2, flexShrink: 0, boxShadow: '0 0 0 1px rgba(0,0,0,.15)' }}>
        <rect width="18" height="12" fill="#fff" /><path d="M0 0 L3.2 0 L18 9.8 L18 12 L14.8 12 L0 2.2 Z" fill="#0099CC" />
      </svg>
    );
  }
  return <img src={`https://flagcdn.com/${MERCADOS[m].bandeira}.svg`} alt="" width={18} height={12} loading="lazy" style={{ borderRadius: 2, flexShrink: 0, objectFit: 'cover' }} />;
}

// Filtro escolhido no ecrã, para o botão «Exportar PDF» do topo exportar o mesmo que se está a ver
let filtroAtual: Mercado | 'todos' = 'todos';

export default function Calendario() {
  const [filtro, setFiltro] = useState<Mercado | 'todos'>('todos');
  filtroAtual = filtro;
  const [soOport, setSoOport] = useState(false);
  const idx = indiceMensal();
  const hoje = Date.now() - DIA;
  const todas = construirJanelas();
  const futuras: Janela[] = [];
  for (let i = 0; i < todas.length; i++) if (todas[i].fim >= hoje && (filtro !== 'todos' || visivelEmTodos(todas[i]))) futuras.push(todas[i]);
  const visiveis: Janela[] = [];
  for (let i = 0; i < futuras.length; i++) {
    const j = futuras[i];
    if (filtro !== 'todos' && j.mercado !== filtro) continue;
    if (soOport && !ehOportunidade(j, idx)) continue;
    visiveis.push(j);
  }
  const oport: Janela[] = [];
  for (let i = 0; i < futuras.length; i++) if (ehOportunidade(futuras[i], idx) && (filtro === 'todos' || futuras[i].mercado === filtro)) oport.push(futuras[i]);
  const proximas = oport.slice(0, 4);

  const meses: { ano: number; mes: number }[] = [];
  const agora = new Date();
  let ano = agora.getFullYear(); let mes = agora.getMonth();
  if (ano < 2026 || (ano === 2026 && mes < 9)) { ano = 2026; mes = 9; }
  while (ano < 2027 || (ano === 2027 && mes <= 11)) { meses.push({ ano, mes }); mes++; if (mes > 11) { mes = 0; ano++; } }

  const exportar = () => {
    const linhas = visiveis.map(function (j) {
      return {
        [t('Mercado', 'Market')]: nomeMercado(j.mercado),
        [t('Início', 'Start')]: new Date(j.ini).toISOString().slice(0, 10),
        [t('Fim', 'End')]: new Date(j.fim).toISOString().slice(0, 10),
        [t('Dias', 'Days')]: dias(j),
        [t('Tipo', 'Type')]: nomeTipo(j.tipo),
        [t('Motivo', 'Reason')]: j.nomes.join(' + '),
        [t('Índice de procura em Braga', 'Braga demand index')]: Math.round(indiceJanela(j, idx) * 100) / 100,
        [t('Oportunidade em época baixa', 'Low-season opportunity')]: ehOportunidade(j, idx) ? t('Sim', 'Yes') : t('Não', 'No'),
        [t('Comunicar até (sugestão)', 'Communicate by (suggestion)')]: new Date(j.ini - SEMANAS_ANTECEDENCIA * 7 * DIA).toISOString().slice(0, 10),
        [t('Voo direto para o Porto', 'Direct flight to Porto')]: textoVoo(j.mercado),
        [t('Fonte', 'Source')]: j.fontes.map(nomeFonte).join(' · '),
      };
    });
    descarregarDados(t('Calendário de oportunidades', 'Opportunity calendar'), [linhas]);
  };

  return (
    <>
      <style>{CSS}</style>
      <Card title={t('Calendário de oportunidades por mercado', 'Opportunity calendar by market')} right={<span style={{ display: 'inline-flex', gap: 6 }}><button type="button" className="cal-exp" onClick={() => exportarCalendarioPdf(filtro)}>PDF</button><button type="button" className="cal-exp" onClick={exportar}>{t('Dados', 'Data')}</button></span>}>
        <p className="cal-intro">{t('Feriados e férias escolares dos mercados emissores de outubro de 2026 a dezembro de 2027, incluindo os feriados regionais das regiões espanholas com voo direto para o Porto, cruzados com a procura de Braga em cada mês. Uma janela de 3 ou mais dias que cai num mês de procura baixa é uma oportunidade para captar visitantes fora da época alta.', 'Public holidays and school holidays in source markets from October 2026 to December 2027, including regional holidays in the Spanish regions with direct flights to Porto, cross-referenced with demand in Braga each month. A window of 3 or more days falling in a low-demand month is an opportunity to attract visitors outside the peak season.')}</p>

        <div className="cal-filtros" role="group" aria-label={t('Filtrar por mercado', 'Filter by market')}>
          <div className="cal-frow">
            <button type="button" className={filtro === 'todos' ? 'on' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>{t('Todos', 'All')}</button>
            <label className="cal-so"><input type="checkbox" checked={soOport} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSoOport(e.target.checked)} />{t('Só oportunidades em época baixa', 'Low-season opportunities only')}</label>
          </div>
          {GRUPOS.map((g) => (
            <div key={g} className="cal-frow">
              <span className="cal-glab">{nomeGrupo(g)}</span>
              {mercadosDoGrupo(g).map((m) => (
                <button key={m} type="button" className={filtro === m ? 'on' : ''} aria-pressed={filtro === m} onClick={() => setFiltro(m)} title={textoVoo(m) || undefined}><Bandeira m={m} />{nomeMercado(m)}{MERCADOS[m].voo && MERCADOS[m].voo!.sazonal ? <sup>*</sup> : null}</button>
              ))}
            </div>
          ))}
          {filtro !== 'todos' && MERCADOS[filtro].voo && (
            <p className="cal-voo-info">
              <Voo m={filtro} />
              {MERCADOS[filtro].voo!.nota && <span> · {nomeLang(MERCADOS[filtro].voo!.nota!)}</span>}
              {MERCADOS[filtro].voo!.sazonal && <span> · {t('Rota só em parte do ano: confirme se há voos nas datas antes de investir em promoção.', 'Route operates only part of the year: check flights exist on the dates before investing in promotion.')}</span>}
            </p>
          )}
        </div>

        <div className="cal-kpis">
          <div><b>{oport.length}</b><span>{t('janelas de 3 ou mais dias em meses de procura baixa', 'windows of 3 or more days in low-demand months')}</span></div>
          <div><b>{proximas.length ? intervalo(proximas[0]) : '-'}</b><span>{proximas.length ? `${t('próxima oportunidade', 'next opportunity')} · ${nomeMercado(proximas[0].mercado)}` : t('sem oportunidades no período', 'no opportunities in the period')}</span></div>
          <div><b>{mesesBaixos(idx)}</b><span>{t('meses de procura baixa em Braga (índice abaixo de 0,9)', 'low-demand months in Braga (index below 0.9)')}</span></div>
        </div>

        {proximas.length > 0 && (
          <>
            <h3 className="cal-h">{t('Próximas oportunidades', 'Upcoming opportunities')}</h3>
            <div className="cal-cards">
              {proximas.map((j) => (
                <article key={`${j.mercado}-${j.ini}`} className="cal-card" style={{ borderTopColor: COR[j.mercado] }}>
                  <header><Bandeira m={j.mercado} /><span>{nomeMercado(j.mercado)}</span></header>
                  <b className="cal-data">{intervalo(j)}</b>
                  <p>{j.nomes.join(' + ')}</p>
                  <div className="cal-meta">
                    <Voo m={j.mercado} />
                    <span>{nomeTipo(j.tipo)} · {rotuloDias(j)}</span>
                    <span style={{ color: C.cyan }}>{t('Procura em Braga', 'Demand in Braga')}: {fmtIdx(indiceJanela(j, idx))}</span>
                    <span>{t('Comunicar até', 'Communicate by')} {fmtDia(j.ini - SEMANAS_ANTECEDENCIA * 7 * DIA)}*</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <h3 className="cal-h">{t('Mês a mês', 'Month by month')}</h3>
        <div className="cal-linha">
          {meses.map((mm) => {
            const doMes = mercadosNoMes(visiveis, mm.ano, mm.mes);
            const nv = nivel(idx[mm.mes]);
            return (
              <section key={`${mm.ano}-${mm.mes}`} className="cal-mes">
                <div className="cal-mes-h">
                  <b>{fmtMesAno(mm.ano, mm.mes)}</b>
                  <span className="cal-nivel" style={{ color: corNivel(nv), borderColor: corNivel(nv) }}>{nomeNivel(nv)} · {fmtIdx(idx[mm.mes])}</span>
                  {contarMercados(doMes) >= 4 && <span className="cal-conv">{t('Vários mercados em simultâneo', 'Several markets at once')}</span>}
                </div>
                {doMes.length === 0 ? <p className="cal-vazio">{t('Sem datas relevantes nos mercados selecionados.', 'No relevant dates in the selected markets.')}</p> : (
                  <ul>
                    {doMes.map((j) => (
                      <li key={`${j.mercado}-${j.ini}`} className={ehOportunidade(j, idx) ? 'op' : ''}>
                        <i style={{ background: COR[j.mercado] }} aria-hidden="true" />
                        <span className="cal-li-d">{intervalo(j)}</span>
                        <span className="cal-li-m" title={textoVoo(j.mercado) || undefined}><Bandeira m={j.mercado} />{nomeMercado(j.mercado)}{MERCADOS[j.mercado].voo && MERCADOS[j.mercado].voo!.sazonal ? <sup className="cal-saz">*</sup> : null}</span>
                        <span className="cal-li-n">{j.nomes.join(' + ')} <em>· {nomeTipo(j.tipo)} · {rotuloDias(j)}</em></span>
                        {ehOportunidade(j, idx) && <span className="cal-tag">{t('Oportunidade', 'Opportunity')}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <details className="cal-met">
          <summary>{t('Como é calculado, limitações e fontes', 'How it is calculated, limitations and sources')}</summary>
          <ul>
            <li>{t('Índice de procura = dormidas médias do mês em Braga ÷ média mensal, 2023 a 2025 (INE). Abaixo de 0,9 é procura baixa; a partir de 1,15 é procura alta.', 'Demand index = average overnight stays in Braga in the month ÷ monthly average, 2023 to 2025 (INE). Below 0.9 is low demand; 1.15 or above is high demand.')}</li>
            <li>{t('Os fins de semana prolongados e as pontes são calculados pela plataforma a partir do dia da semana do feriado: segunda ou sexta dão 3 dias; terça ou quinta dão uma ponte de 4 dias; dois feriados separados por um só dia útil também formam uma ponte. Nem todos gozam as pontes.', 'Long weekends and bridges are calculated by the platform from the weekday of the holiday: Monday or Friday give 3 days; Tuesday or Thursday give a 4-day bridge; two holidays one working day apart also form a bridge. Not everyone takes bridges.')}</li>
            <li>{t('* «Comunicar até» é uma sugestão da plataforma (6 semanas antes do início), não uma regra de mercado.', '* “Communicate by” is a platform suggestion (6 weeks before the start), not a market rule.')}</li>
            <li>{t('Espanha inclui só os feriados nacionais comuns a todas as comunidades; os feriados regionais e locais variam. Em França, as férias de inverno e da primavera dependem da zona escolar. Reino Unido: Inglaterra e País de Gales. As férias de verão em França foram omitidas por falta de duas fontes coincidentes.', 'Spain includes only the national holidays common to all regions; regional and local holidays vary. In France, winter and spring holidays depend on the school zone. United Kingdom: England and Wales. Summer holidays in France were omitted for lack of two matching sources.')}</li>
            <li>{t('Regiões espanholas: só as que têm voo direto para o Porto. Cada região mostra os feriados nacionais e os autonómicos; na vista «Todos» aparecem apenas as janelas com um feriado próprio da região. Festas locais: só as de Barcelona, publicadas na Gaseta Municipal; as dos outros municípios não estão incluídas. Astúrias: falta a decisão sobre os feriados nacionais substituíveis de 2027.', 'Spanish regions: only those with direct flights to Porto. Each region shows national and regional holidays; the “All” view shows only windows with a holiday specific to the region. Local holidays: only Barcelona’s, published in its Gaseta Municipal; those of other municipalities are not included. Asturias: the decision on the substitutable national holidays for 2027 is still pending.')}</li>
            <li>{t('* Rotas sazonais (Baleares e Canárias): só operam em parte do ano. Voos e companhias segundo a lista de rotas do Aeroporto do Porto; podem mudar de época para época.', '* Seasonal routes (Balearic and Canary Islands): they only operate part of the year. Flights and airlines from the Porto Airport route list; they may change from season to season.')}</li>
            <li>{t('Calendários publicados podem ser alterados pelas autoridades; confirme antes de campanhas.', 'Published calendars may be changed by the authorities; confirm before campaigns.')}</li>
          </ul>
          <ul className="cal-fontes">
            {Object.keys(FONTES).map((k) => <li key={k}><a href={FONTES[k].url} target="_blank" rel="noopener noreferrer">{FONTES[k].nome}</a></li>)}
          </ul>
        </details>
      </Card>
    </>
  );
}
// ─── Exportação em PDF: documento A4 construído a partir dos dados (não é uma fotografia do ecrã) ───
function janelasPara(filtro: Mercado | 'todos'): Janela[] {
  const hoje = Date.now() - DIA;
  const todas = construirJanelas();
  const r: Janela[] = [];
  for (let i = 0; i < todas.length; i++) {
    const j = todas[i];
    if (j.fim < hoje) continue;
    if (filtro === 'todos' ? !visivelEmTodos(j) : j.mercado !== filtro) continue;
    r.push(j);
  }
  return r;
}
function celulaOport(j: Janela, idx: number[]): Celula {
  return ehOportunidade(j, idx) ? { html: etiqueta(t('Oportunidade', 'Opportunity'), '#0E7490', '#E0F2F7') } : '';
}
function celulaMercado(m: Mercado): Celula {
  const v = MERCADOS[m].voo;
  return { html: `<b>${nomeMercado(m).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</b>${v ? `<br><span style="color:#6F747D;font-size:9.5px">✈ ${v.aeroportos}${v.sazonal ? ' · ' + t('sazonal', 'seasonal') : ''}</span>` : ''}` };
}
export function exportarCalendarioPdf(filtro?: Mercado | 'todos'): void {
  const f = filtro || filtroAtual;
  const idx = indiceMensal();
  const js = janelasPara(f);
  const oport: Janela[] = [];
  for (let i = 0; i < js.length; i++) if (ehOportunidade(js[i], idx)) oport.push(js[i]);
  const mercadosUsados: Mercado[] = [];
  for (let i = 0; i < js.length; i++) if (mercadosUsados.indexOf(js[i].mercado) < 0) mercadosUsados.push(js[i].mercado);

  let corpo = kpis([
    { rotulo: t('Oportunidades em época baixa', 'Low-season opportunities'), valor: String(oport.length), nota: t('janelas de 3 ou mais dias em meses de procura baixa', 'windows of 3 or more days in low-demand months'), cor: '#0E7490' },
    { rotulo: t('Próxima oportunidade', 'Next opportunity'), valor: oport.length ? intervalo(oport[0]) : '-', nota: oport.length ? nomeMercado(oport[0].mercado) : '' },
    { rotulo: t('Meses de procura baixa', 'Low-demand months'), valor: mesesBaixos(idx), nota: t('índice abaixo de 0,9 (dormidas 2023–2025)', 'index below 0.9 (overnight stays 2023–2025)') },
    { rotulo: t('Mercados', 'Markets'), valor: String(mercadosUsados.length), nota: f === 'todos' ? t('todos os mercados', 'all markets') : nomeMercado(f as Mercado) },
  ]);
  corpo += paragrafo(t('Feriados e férias escolares dos mercados emissores, cruzados com a procura de Braga em cada mês. Uma janela de 3 ou mais dias num mês de procura baixa é uma oportunidade para captar visitantes fora da época alta. «Comunicar até» é uma sugestão da plataforma: 6 semanas antes do início.', 'Public and school holidays in source markets, cross-referenced with demand in Braga each month. A window of 3 or more days in a low-demand month is an opportunity to attract visitors outside the peak season. “Communicate by” is a platform suggestion: 6 weeks before the start.'));
  if (f !== 'todos' && MERCADOS[f as Mercado].voo) {
    const v = MERCADOS[f as Mercado].voo!;
    corpo += aviso(t('Voo direto para o Porto', 'Direct flight to Porto'), `${v.aeroportos} · ${v.companhias}${v.nota ? ' · ' + nomeLang(v.nota) : ''}${v.sazonal ? ' · ' + t('rota só em parte do ano: confirme se há voos nas datas.', 'route only part of the year: check flights on the dates.') : ''}`, 'info');
  }

  if (oport.length) {
    corpo += seccao(t('Próximas oportunidades', 'Upcoming opportunities'), t('Janelas de 3 ou mais dias em meses de procura baixa, por ordem de data', 'Windows of 3 or more days in low-demand months, by date'));
    const linhas: Celula[][] = [];
    for (let i = 0; i < oport.length && i < 12; i++) {
      const j = oport[i];
      linhas.push([{ html: `<b>${intervalo(j)}</b>` }, celulaMercado(j.mercado), j.nomes.join(' + '), `${nomeTipo(j.tipo)} · ${rotuloDias(j)}`, fmtIdx(indiceJanela(j, idx)), fmtDia(j.ini - SEMANAS_ANTECEDENCIA * 7 * DIA)]);
    }
    corpo += tabela([t('Datas', 'Dates'), t('Mercado', 'Market'), t('Motivo', 'Reason'), t('Tipo', 'Type'), t('Procura', 'Demand'), t('Comunicar até', 'Communicate by')], linhas, { num: [4], larguras: ['14%', '19%', '', '17%', '9%', '12%'] });
  }

  corpo += seccao(t('Mês a mês', 'Month by month'), t('Cada janela aparece no mês em que começa · procura de Braga = índice de sazonalidade das dormidas (1,00 = mês médio)', 'Each window appears in the month it starts · Braga demand = seasonality index of overnight stays (1.00 = average month)'));
  const agora = new Date();
  let ano = agora.getFullYear(); let mes = agora.getMonth();
  if (ano < 2026 || (ano === 2026 && mes < 9)) { ano = 2026; mes = 9; }
  let primeiro = true;
  while (ano < 2027 || (ano === 2027 && mes <= 11)) {
    const a = Date.UTC(ano, mes, 1); const b = Date.UTC(ano, mes + 1, 1) - DIA;
    const doMes: Janela[] = [];
    for (let i = 0; i < js.length; i++) {
      const j = js[i];
      if ((j.ini >= a && j.ini <= b) || (primeiro && j.ini < a && j.fim >= a)) doMes.push(j);
    }
    const nv = nivel(idx[mes]);
    const corNv = nv === 'baixa' ? '#0E7490' : nv === 'alta' ? '#C2410C' : '#5A6270';
    const fundoNv = nv === 'baixa' ? '#E0F2F7' : nv === 'alta' ? '#FDF1E7' : '#EEF1F5';
    corpo += `<div class="mes">${subtitulo(fmtMesAno(ano, mes)).replace('</h3>', ` ${etiqueta(`${nomeNivel(nv)} · ${fmtIdx(idx[mes])}`, corNv, fundoNv)}</h3>`)}`;
    if (!doMes.length) corpo += `<p class="fonte">${t('Sem datas relevantes nos mercados selecionados.', 'No relevant dates in the selected markets.')}</p>`;
    else {
      const linhas: Celula[][] = [];
      for (let i = 0; i < doMes.length; i++) {
        const j = doMes[i];
        linhas.push([{ html: `<b>${intervalo(j)}</b>` }, celulaMercado(j.mercado), j.nomes.join(' + '), `${nomeTipo(j.tipo)} · ${rotuloDias(j)}`, celulaOport(j, idx)]);
      }
      corpo += tabela([t('Datas', 'Dates'), t('Mercado', 'Market'), t('Motivo', 'Reason'), t('Tipo', 'Type'), ''], linhas, { larguras: ['15%', '21%', '', '22%', '13%'], compacta: true });
    }
    corpo += '</div>';
    primeiro = false;
    mes++; if (mes > 11) { mes = 0; ano++; }
  }

  // Voos diretos (regiões espanholas)
  const lv: Celula[][] = [];
  for (let i = 0; i < ORDEM.length; i++) {
    const m = ORDEM[i]; const v = MERCADOS[m].voo;
    if (!v) continue;
    if (f !== 'todos' && f !== m) continue;
    lv.push([nomeMercado(m), v.aeroportos, v.companhias, `${v.sazonal ? t('Rota sazonal', 'Seasonal route') : t('Todo o ano', 'Year-round')}${v.nota ? ' · ' + nomeLang(v.nota) : ''}`]);
  }
  if (lv.length) {
    corpo += seccao(t('Voos diretos para o Porto', 'Direct flights to Porto'), t('Regiões espanholas incluídas no calendário', 'Spanish regions included in the calendar'));
    corpo += tabela([t('Região', 'Region'), t('Aeroportos', 'Airports'), t('Companhias', 'Airlines'), t('Operação', 'Operation')], lv, { larguras: ['20%', '18%', '30%', ''] });
  }

  corpo += seccao(t('Como é calculado e limitações', 'How it is calculated and limitations'));
  corpo += lista([
    t('Índice de procura = dormidas médias do mês em Braga ÷ média mensal, 2023 a 2025 (INE). Abaixo de 0,9 é procura baixa; a partir de 1,15 é procura alta.', 'Demand index = average overnight stays in Braga in the month ÷ monthly average, 2023 to 2025 (INE). Below 0.9 is low demand; 1.15 or above is high demand.'),
    t('Os fins de semana prolongados e as pontes são calculados pela plataforma a partir do dia da semana do feriado: segunda ou sexta dão 3 dias; terça ou quinta dão uma ponte de 4 dias; dois feriados separados por um só dia útil também formam uma ponte. Nem todos gozam as pontes.', 'Long weekends and bridges are calculated by the platform from the weekday of the holiday: Monday or Friday give 3 days; Tuesday or Thursday give a 4-day bridge; two holidays one working day apart also form a bridge. Not everyone takes bridges.'),
    t('Regiões espanholas: só as que têm voo direto para o Porto. Cada região mostra os feriados nacionais e os autonómicos; na vista «Todos» aparecem apenas as janelas com um feriado próprio da região. Festas locais: só as de Barcelona, publicadas na Gaseta Municipal; as dos outros municípios não estão incluídas. Astúrias: falta a decisão sobre os feriados nacionais substituíveis de 2027.', 'Spanish regions: only those with direct flights to Porto. Each region shows national and regional holidays; the “All” view shows only windows with a holiday specific to the region. Local holidays: only Barcelona’s, published in its Gaseta Municipal; those of other municipalities are not included. Asturias: the decision on the substitutable national holidays for 2027 is still pending.'),
    t('Espanha inclui só os feriados nacionais comuns a todas as comunidades; os feriados regionais e locais variam. Em França, as férias de inverno e da primavera dependem da zona escolar. Reino Unido: Inglaterra e País de Gales. As férias de verão em França foram omitidas por falta de duas fontes coincidentes.', 'Spain includes only the national holidays common to all regions; regional and local holidays vary. In France, winter and spring holidays depend on the school zone. United Kingdom: England and Wales. Summer holidays in France were omitted for lack of two matching sources.'),
    t('Calendários publicados podem ser alterados pelas autoridades; confirme antes de campanhas.', 'Published calendars may be changed by the authorities; confirm before campaigns.'),
  ]);
  const fs: { nome: string; url?: string }[] = [];
  const chaves = Object.keys(FONTES);
  for (let i = 0; i < chaves.length; i++) fs.push({ nome: FONTES[chaves[i]].nome, url: FONTES[chaves[i]].url });
  corpo += seccao(t('Fontes', 'Sources'));
  corpo += listaFontes(fs);

  gerarDocumento({
    eyebrow: t('Observatório de Turismo de Braga · Procura', 'Braga Tourism Observatory · Demand'),
    titulo: t('Calendário de oportunidades por mercado', 'Opportunity calendar by market'),
    subtitulo: `${t('Outubro de 2026 a dezembro de 2027', 'October 2026 to December 2027')} · ${f === 'todos' ? t('todos os mercados', 'all markets') : nomeMercado(f as Mercado)}`,
    ficheiro: `${t('Calendário de oportunidades', 'Opportunity calendar')}${f === 'todos' ? '' : ' - ' + nomeMercado(f as Mercado)}`,
    corpo,
  });
}

function mesesBaixos(idx: number[]) { const r: string[] = []; for (let m = 0; m < 12; m++) if (idx[m] < LIMIAR_BAIXA) r.push(mesCurto(m)); return r.join(' · '); }
function nomeFonte(k: string) { return FONTES[k] ? FONTES[k].nome : k; }
function fmtIdx(v: number) { return v.toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const CSS = `
.cal-intro { margin: 0 0 14px; font-size: 13.5px; color: ${C.textMuted}; line-height: 1.6; max-width: 900px; }
.cal-filtros { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.cal-frow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.cal-glab { width: 100%; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: ${C.textDim}; margin-top: 2px; }
.cal-saz { color: ${C.orange}; }
.cal-filtros sup { color: ${C.orange}; margin-left: -3px; }
.cal-voo { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: ${C.accentLight}; }
.cal-voo.saz { color: ${C.orange}; }
.cal-voo-info { margin: 2px 0 0; font-size: 12.5px; color: ${C.textMuted}; line-height: 1.5; }
.cal-filtros button { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMuted}; font: 600 12.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.cal-filtros button.on { background: ${C.accentBg}; border-color: ${C.accent}; color: ${C.text}; }
.cal-so { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: ${C.textMuted}; margin-left: 10px; cursor: pointer; }
.cal-so input { accent-color: ${C.accent}; width: 16px; height: 16px; }
.cal-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
.cal-kpis div { padding: 12px 14px; border-radius: 10px; background: ${C.cardAlt}; }
.cal-kpis b { display: block; font-size: 18px; color: ${C.text}; letter-spacing: -0.01em; }
.cal-kpis span { font-size: 12px; color: ${C.textMuted}; line-height: 1.4; }
.cal-h { margin: 6px 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: ${C.textMuted}; }
.cal-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; margin-bottom: 20px; }
.cal-card { padding: 12px 14px; border-radius: 10px; background: ${C.cardAlt}; border-top: 3px solid; display: flex; flex-direction: column; gap: 6px; }
.cal-card header { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: ${C.textMuted}; }
.cal-data { font-size: 17px; color: ${C.text}; }
.cal-card p { margin: 0; font-size: 13px; color: ${C.text}; line-height: 1.45; }
.cal-meta { display: flex; flex-direction: column; gap: 2px; font-size: 11.5px; color: ${C.textMuted}; }
.cal-linha { display: flex; flex-direction: column; gap: 8px; }
.cal-mes { border: 1px solid ${C.border}; border-radius: 10px; padding: 10px 14px; }
.cal-mes-h { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 6px; }
.cal-mes-h b { font-size: 14px; color: ${C.text}; min-width: 140px; }
.cal-nivel { font-size: 11px; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 2px 8px; }
.cal-conv { font-size: 11px; font-weight: 700; color: ${C.accent}; }
.cal-vazio { margin: 0; font-size: 12.5px; color: ${C.textDim}; }
.cal-mes ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.cal-mes li { display: grid; grid-template-columns: 8px 130px 170px minmax(0, 1fr) auto; align-items: center; gap: 10px; font-size: 12.5px; color: ${C.textMuted}; padding: 4px 0; }
.cal-mes li.op { color: ${C.text}; }
.cal-mes li i { width: 8px; height: 8px; border-radius: 50%; display: block; }
.cal-li-d { font-weight: 700; color: ${C.text}; font-variant-numeric: tabular-nums; }
.cal-li-m { display: inline-flex; align-items: center; gap: 6px; }
.cal-li-n em { font-style: normal; color: ${C.textDim}; }
.cal-tag { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: ${C.cyan}; border: 1px solid ${C.cyan}; border-radius: 999px; padding: 1px 8px; white-space: nowrap; }
.cal-met { margin-top: 14px; border-top: 1px solid ${C.border}; padding-top: 10px; }
.cal-met summary { cursor: pointer; font-size: 13px; font-weight: 700; color: ${C.accent}; }
.cal-met ul { margin: 8px 0 0; padding-left: 18px; font-size: 12.5px; color: ${C.textMuted}; line-height: 1.6; }
.cal-fontes a { color: ${C.accentLight}; }
.cal-exp { height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid ${C.border}; background: transparent; color: ${C.textMuted}; font: 600 12px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.cal-exp:hover { border-color: ${C.accent}; color: ${C.text}; }
@media (max-width: 760px) {
  .cal-kpis { grid-template-columns: 1fr; }
  .cal-mes li { grid-template-columns: 8px minmax(0, 1fr) auto; row-gap: 2px; }
  .cal-li-d { grid-column: 2; } .cal-tag { grid-column: 3; grid-row: 1; }
  .cal-li-m, .cal-li-n { grid-column: 2 / 4; }
  .cal-so { margin-left: 0; width: 100%; }
}
`;
