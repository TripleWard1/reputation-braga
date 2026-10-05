'use client';

import { useState } from 'react';
import { t, getLang } from '@/app/lib/i18n';
import { FEIRAS, PROJETOS, DISTINCOES, TIPOS_PROJETO, type Distincao, type Evento, type Texto3, type TipoDistincao, type TipoProjeto } from '@/app/lib/braga-mundo-dados';

// "Braga no mundo": distinções do destino, feiras e projetos de cooperação (2023–2027), em PT, EN e ES.
type Aba = 'distincoes' | 'feiras' | 'projetos';
const L = (x: string | Texto3): string => (typeof x === 'string' ? x : x[getLang() as 'pt' | 'en' | 'es'] || x.pt);
const locale = () => (getLang() === 'en' ? 'en-GB' : getLang() === 'es' ? 'es-ES' : 'pt-PT');
const dataLocal = (iso: string) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
function intervalo(ini: string, fim?: string): string {
  const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(locale(), o);
  const a = dataLocal(ini);
  if (!fim || fim === ini) return f(a, { day: 'numeric', month: 'short', year: 'numeric' });
  const b = dataLocal(fim);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return `${f(a, { day: 'numeric', month: 'short' })} – ${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
function nomePais(cod: string): string {
  try { return new Intl.DisplayNames([locale()], { type: 'region' }).of(cod.toUpperCase()) || cod.toUpperCase(); } catch { return cod.toUpperCase(); }
}
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const futuro = (e: Evento) => (e.fim || e.ini) >= hoje();
const anoDe = (e: Evento) => Number(e.ini.slice(0, 4));
function naoFuturo(e: Evento) { return !futuro(e); }
function emEspanha(e: Evento) { return e.pais === 'es'; }
function eEuropeu(e: Evento) { return e.tipo === 'europeu'; }
function noEstrangeiro(e: Evento) { return e.pais !== 'pt'; }
function emBraga(e: Evento) { return e.cidade === 'Braga'; }

// Filtros e contagens com ciclos simples: o compressor do Next.js (SWC) trocava os nomes das variáveis
// em funções pequenas aninhadas, o que partia a secção em produção ("a.indexOf is not a function").
function contarTipos(lista: TipoDistincao[]): number {
  let n = 0;
  for (let i = 0; i < DISTINCOES.length; i++) { if (lista.indexOf(DISTINCOES[i].tipo) >= 0) n++; }
  return n;
}
function contarEntidade(entidade: string): number {
  let n = 0;
  for (let i = 0; i < DISTINCOES.length; i++) { if (DISTINCOES[i].entidade === entidade) n++; }
  return n;
}
function distincoesDoAno(ano: number): Distincao[] {
  const r: Distincao[] = [];
  for (let i = 0; i < DISTINCOES.length; i++) { if (DISTINCOES[i].ano === ano) r.push(DISTINCOES[i]); }
  return r;
}
function todosOsLogos(): { src: string; alt: string }[] {
  const r: { src: string; alt: string }[] = [];
  for (let i = 0; i < DISTINCOES.length; i++) {
    const lista = DISTINCOES[i].logos || [];
    for (let j = 0; j < lista.length; j++) r.push({ src: lista[j], alt: L(DISTINCOES[i].titulo) });
  }
  return r;
}
function filtrarEventos(lista: Evento[], ano: number | null, tipo: TipoProjeto | null): Evento[] {
  const r: Evento[] = [];
  for (let i = 0; i < lista.length; i++) {
    const e = lista[i];
    if (ano !== null && anoDe(e) !== ano) continue;
    if (tipo !== null && e.tipo !== tipo) continue;
    r.push(e);
  }
  return r;
}
function contarEventos(lista: Evento[], teste: (e: Evento) => boolean): number {
  let n = 0;
  for (let i = 0; i < lista.length; i++) { if (teste(lista[i])) n++; }
  return n;
}

const COR: Record<TipoDistincao, string> = { vencedora: '#E9C46A', certificacao: '#7CC79A', titulo: '#8AB0E6', finalista: '#C9CDD3', emCurso: '#EDA06B', anfitria: '#B79CF0', ativo: '#6FC2D0' };
const ROTULO: Record<TipoDistincao, Texto3> = {
  vencedora: { pt: 'Vencedora', en: 'Winner', es: 'Ganadora' },
  certificacao: { pt: 'Certificação', en: 'Certification', es: 'Certificación' },
  titulo: { pt: 'Título UNESCO', en: 'UNESCO title', es: 'Título UNESCO' },
  finalista: { pt: 'Finalista', en: 'Finalist', es: 'Finalista' },
  emCurso: { pt: 'Finalista · decisão em curso', en: 'Finalist · decision pending', es: 'Finalista · decisión pendiente' },
  anfitria: { pt: 'Anfitriã', en: 'Host', es: 'Anfitriona' },
  ativo: { pt: 'Distinção de um monumento ou espaço', en: 'Distinction of a monument or site', es: 'Distinción de un monumento o espacio' },
};

function Indicador({ valor, rotulo, cor }: { valor: number | string; rotulo: string; cor: string }) {
  return (
    <div className="bm-kpi">
      <div className="bm-kpi-v" style={{ color: cor }}>{valor}</div>
      <div className="bm-kpi-r">{rotulo}</div>
    </div>
  );
}

function ListaEventos({ eventos, comTipo }: { eventos: Evento[]; comTipo?: boolean }) {
  const anos = Array.from(new Set(eventos.map(anoDe))).sort((a, b) => b - a);
  return (
    <>
      {anos.map((ano) => {
        const doAno = filtrarEventos(eventos, ano, null).sort((x, y) => x.ini.localeCompare(y.ini));
        return (
          <section key={ano} className="bm-ano" aria-labelledby={`bm-ano-${ano}`}>
            <h3 id={`bm-ano-${ano}`} className="bm-ano-t">{ano}<span>{doAno.length}</span></h3>
            <ul className="bm-lista">
              {doAno.map((e, i) => (
                <li key={`${e.ini}-${i}`} className={`bm-ev${futuro(e) ? ' prevista' : ''}`}>
                  <img className="bm-band" src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={28} height={20} loading="lazy" />
                  <div className="bm-ev-c">
                    <div className="bm-ev-n">{L(e.nome)}</div>
                    <div className="bm-ev-l">{e.cidade ? `${e.cidade} · ` : ''}{nomePais(e.pais)}</div>
                    <div className="bm-ev-tags">
                      {comTipo && e.tipo && <span className="bm-tag">{L(TIPOS_PROJETO[e.tipo])}</span>}
                      {futuro(e) && <span className="bm-tag prev">{t('Prevista', 'Planned')}</span>}
                      {e.aConfirmar && <span className="bm-tag conf">{L(e.aConfirmar)}</span>}
                    </div>
                  </div>
                  <div className="bm-ev-d">{intervalo(e.ini, e.fim)}</div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export default function BragaMundo() {
  const [aba, setAba] = useState<Aba>('distincoes');
  const [anoF, setAnoF] = useState<number | null>(null);
  const [tipoP, setTipoP] = useState<TipoProjeto | null>(null);
  const feitas = FEIRAS.filter(naoFuturo);
  const paises = new Set(feitas.map((e) => e.pais));
  const anosF = Array.from(new Set(FEIRAS.map(anoDe))).sort();
  const anosP = Array.from(new Set(PROJETOS.map(anoDe))).sort();
  const logos = todosOsLogos();
  const anosD = Array.from(new Set(DISTINCOES.map((d) => d.ano))).sort((a, b) => b - a);
  const ABAS: [Aba, string][] = [['distincoes', t('Distinções', 'Distinctions')], ['feiras', t('Feiras', 'Trade fairs')], ['projetos', t('Projetos e cooperação', 'Projects and cooperation')]];
  const mudar = (a: Aba) => { setAba(a); setAnoF(null); setTipoP(null); };
  return (
    <div className="bm">
      <style>{CSS}</style>
      <header className="bm-topo">
        <div className="bm-kicker">{t('Promoção, cooperação e reconhecimento', 'Promotion, cooperation and recognition')}</div>
        <h1 className="bm-h1">{t('Braga no mundo', 'Braga in the world')}</h1>
        <p className="bm-sub">{t('As distinções do destino, as feiras onde Braga se promoveu e os projetos de cooperação desde 2023.', 'The destination’s distinctions, the trade fairs where Braga promoted itself and its cooperation projects since 2023.')}</p>
        <div className="bm-abas" role="tablist" aria-label={t('Secções', 'Sections')}>
          {ABAS.map(([id, nome]) => (
            <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'on' : ''} onClick={() => mudar(id)}>{nome}</button>
          ))}
        </div>
      </header>

      {aba === 'distincoes' && (
        <div className="bm-corpo">
          <div className="bm-kpis">
            <Indicador valor={contarTipos(['vencedora'])} rotulo={t('títulos internacionais ganhos', 'international titles won')} cor={COR.vencedora} />
            <Indicador valor={contarTipos(['certificacao'])} rotulo={t('certificação de destino sustentável', 'sustainable destination certification')} cor={COR.certificacao} />
            <Indicador valor={contarTipos(['finalista', 'emCurso'])} rotulo={t('vezes finalista em concursos europeus', 'times a finalist in European competitions')} cor={COR.finalista} />
            <Indicador valor={contarEntidade('UNESCO')} rotulo={t('marcos UNESCO: cidade criativa, Património Mundial e conferência mundial', 'UNESCO milestones: creative city, World Heritage and world conference')} cor={COR.titulo} />
          </div>
          {logos.length > 0 && (
            <ul className="bm-logos" aria-label={t('Selos e logótipos das distinções', 'Distinction seals and logos')}>
              {logos.map((l) => <li key={l.src}><img src={l.src} alt={l.alt} loading="lazy" /></li>)}
            </ul>
          )}
          {anosD.map((ano) => (
            <section key={ano} className="bm-ano" aria-labelledby={`bm-d-${ano}`}>
              <h3 id={`bm-d-${ano}`} className="bm-ano-t">{ano}</h3>
              <ul className="bm-dist">
                {distincoesDoAno(ano).map((d) => (
                  <li key={d.titulo.pt} className="bm-d" style={{ borderLeftColor: COR[d.tipo] }}>
                    <div className="bm-d-top">
                      <span className="bm-d-tipo" style={{ color: COR[d.tipo], borderColor: `${COR[d.tipo]}66` }}>{L(ROTULO[d.tipo])}</span>
                      <span className="bm-d-ent">{d.entidade}</span>
                    </div>
                    <div className="bm-d-t">{L(d.titulo)}</div>
                    <p className="bm-d-x">{L(d.texto)}</p>
                    <a className="bm-d-f" href={d.fonte} target="_blank" rel="noopener noreferrer">{t('Fonte', 'Source')} <span aria-hidden="true">↗</span></a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="bm-nota">{t('Só constam distinções confirmadas em fontes públicas, com a ligação para cada uma. Finalistas e nomeações não são apresentados como vitórias, e as distinções de monumentos ou praias estão identificadas como tal.', 'Only distinctions confirmed in public sources are listed, each with its link. Finalists and nominations are not presented as wins, and distinctions of monuments or beaches are labelled as such.')}</p>
        </div>
      )}

      {aba === 'feiras' && (
        <div className="bm-corpo">
          <div className="bm-kpis">
            <Indicador valor={feitas.length} rotulo={t('feiras realizadas desde 2023', 'trade fairs attended since 2023')} cor="#8AB0E6" />
            <Indicador valor={paises.size} rotulo={t('países', 'countries')} cor="#7CC79A" />
            <Indicador valor={`${Math.round((contarEventos(feitas, emEspanha) / Math.max(1, feitas.length)) * 100)}%`} rotulo={t('em Espanha, o maior mercado externo', 'in Spain, the largest foreign market')} cor="#E9C46A" />
            <Indicador valor={FEIRAS.length - feitas.length} rotulo={t('feiras previstas', 'planned fairs')} cor="#EDA06B" />
          </div>
          <div className="bm-filtros" role="group" aria-label={t('Filtrar por ano', 'Filter by year')}>
            <button type="button" className={anoF === null ? 'on' : ''} aria-pressed={anoF === null} onClick={() => setAnoF(null)}>{t('Todos', 'All')}</button>
            {anosF.map((a) => <button key={a} type="button" className={anoF === a ? 'on' : ''} aria-pressed={anoF === a} onClick={() => setAnoF(a)}>{a}</button>)}
          </div>
          <ListaEventos eventos={filtrarEventos(FEIRAS, anoF, null)} />
        </div>
      )}

      {aba === 'projetos' && (
        <div className="bm-corpo">
          <div className="bm-kpis">
            <Indicador valor={PROJETOS.length} rotulo={t('projetos, encontros e ações desde 2023', 'projects, meetings and actions since 2023')} cor="#8AB0E6" />
            <Indicador valor={contarEventos(PROJETOS, eEuropeu)} rotulo={t('reuniões de projetos europeus', 'EU project meetings')} cor="#7CC79A" />
            <Indicador valor={contarEventos(PROJETOS, noEstrangeiro)} rotulo={t('no estrangeiro', 'abroad')} cor="#E9C46A" />
            <Indicador valor={contarEventos(PROJETOS, emBraga)} rotulo={t('em Braga, com parceiros de fora', 'in Braga, with visiting partners')} cor="#B79CF0" />
          </div>
          <div className="bm-filtros" role="group" aria-label={t('Filtrar por tipo', 'Filter by type')}>
            <button type="button" className={tipoP === null ? 'on' : ''} aria-pressed={tipoP === null} onClick={() => setTipoP(null)}>{t('Todos', 'All')}</button>
            {(Object.keys(TIPOS_PROJETO) as TipoProjeto[]).map((k) => <button key={k} type="button" className={tipoP === k ? 'on' : ''} aria-pressed={tipoP === k} onClick={() => setTipoP(k)}>{L(TIPOS_PROJETO[k])}</button>)}
          </div>
          <div className="bm-filtros" role="group" aria-label={t('Filtrar por ano', 'Filter by year')}>
            <button type="button" className={anoF === null ? 'on' : ''} aria-pressed={anoF === null} onClick={() => setAnoF(null)}>{t('Todos', 'All')}</button>
            {anosP.map((a) => <button key={a} type="button" className={anoF === a ? 'on' : ''} aria-pressed={anoF === a} onClick={() => setAnoF(a)}>{a}</button>)}
          </div>
          <ListaEventos comTipo eventos={filtrarEventos(PROJETOS, anoF, tipoP)} />
        </div>
      )}
    </div>
  );
}

const CSS = `
.bm { color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.bm-topo { padding: 40px 40px 0; max-width: 1400px; margin: 0 auto; }
.bm-kicker { font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #8AB0E6; }
.bm-h1 { font-size: clamp(30px, 4vw, 46px); line-height: 1.1; letter-spacing: -0.02em; margin: 8px 0 10px; }
.bm-sub { margin: 0 0 22px; font-size: 15.5px; color: #A3A8B1; max-width: 760px; line-height: 1.6; }
.bm-abas { display: flex; gap: 8px; flex-wrap: wrap; padding-bottom: 18px; border-bottom: 1px solid #2D3139; }
.bm-abas button { height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid #3A404B; background: rgba(255,255,255,.04); color: #C9CDD3; font: 600 14px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.bm-abas button.on { background: #8AB0E6; border-color: #8AB0E6; color: #0F1216; }
.bm-corpo { padding: 24px 40px 48px; max-width: 1400px; margin: 0 auto; }
.bm-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 22px; }
.bm-kpi { padding: 16px 18px; border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-kpi-v { font-size: 34px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
.bm-kpi-r { margin-top: 4px; font-size: 13.5px; color: #A3A8B1; line-height: 1.45; }
.bm-logos { list-style: none; margin: 0 0 26px; padding: 18px; display: flex; flex-wrap: wrap; gap: 18px; align-items: center; justify-content: center; border-radius: 14px; background: #F4F4F2; }
.bm-logos li { display: flex; align-items: center; }
.bm-logos img { height: 92px; width: auto; max-width: 260px; object-fit: contain; display: block; }
.bm-ano { margin-bottom: 22px; }
.bm-ano-t { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 10px; letter-spacing: -0.01em; }
.bm-ano-t span { font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 999px; background: #22262D; color: #A3A8B1; }
.bm-dist { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.bm-d { padding: 16px 18px; border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; border-left: 4px solid; display: flex; flex-direction: column; gap: 6px; }
.bm-d-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
.bm-d-tipo { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid; }
.bm-d-ent { font-size: 12.5px; color: #A3A8B1; }
.bm-d-t { font-size: 15.5px; font-weight: 700; line-height: 1.35; }
.bm-d-x { margin: 0; font-size: 13.5px; color: #C9CDD3; line-height: 1.55; flex: 1; }
.bm-d-f { align-self: flex-start; font-size: 12.5px; color: #8AB0E6; text-decoration: none; }
.bm-d-f:hover { text-decoration: underline; }
.bm-filtros { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.bm-filtros button { height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #C9CDD3; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.bm-filtros button.on { background: rgba(138,176,230,.16); border-color: #8AB0E6; color: #ECEDEF; }
.bm-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 8px; }
.bm-ev { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 12px 14px; border-radius: 10px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-ev.prevista { border-style: dashed; }
.bm-band { width: 28px; height: 20px; object-fit: cover; border-radius: 3px; margin-top: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-ev-n { font-size: 14.5px; font-weight: 700; line-height: 1.35; }
.bm-ev-l { font-size: 13px; color: #A3A8B1; margin-top: 2px; }
.bm-ev-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.bm-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #22262D; color: #C9CDD3; }
.bm-tag.prev { background: rgba(237,160,107,.15); color: #EDA06B; }
.bm-tag.conf { background: rgba(239,138,123,.15); color: #EF8A7B; }
.bm-ev-d { font-size: 12.5px; font-weight: 600; color: #C9CDD3; white-space: nowrap; text-align: right; }
.bm-nota { margin-top: 18px; font-size: 13px; color: #A3A8B1; line-height: 1.6; max-width: 900px; }
.bm button:focus-visible, .bm a:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
@media (max-width: 760px) {
  .bm-topo { padding: 24px 16px 0; } .bm-corpo { padding: 18px 16px 32px; }
  .bm-lista, .bm-dist { grid-template-columns: 1fr; }
  .bm-ev { grid-template-columns: 28px minmax(0, 1fr); } .bm-ev-d { grid-column: 2; text-align: left; }
  .bm-logos img { height: 64px; }
}
`;
