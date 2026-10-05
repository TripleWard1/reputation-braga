'use client';

import { useState } from 'react';
import { t, getLang } from '@/app/lib/i18n';
import { FEIRAS, PROJETOS, DISTINCOES, TIPOS_PROJETO, type Distincao, type Evento, type Texto3, type TipoDistincao, type TipoProjeto } from '@/app/lib/braga-mundo-dados';

// "Internacionalização": distinções do destino, feiras e projetos de cooperação (2023–2027), em PT, EN e ES.
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

// Mais auxiliares (ciclos simples, sem funções aninhadas: o compressor do Next.js partia-as em produção)
function paisesComContagem(lista: Evento[]): [string, number][] {
  const m: Record<string, number> = {};
  for (let i = 0; i < lista.length; i++) { const c = lista[i].pais; m[c] = (m[c] || 0) + 1; }
  const r: [string, number][] = [];
  const chaves = Object.keys(m);
  for (let i = 0; i < chaves.length; i++) r.push([chaves[i], m[chaves[i]]]);
  r.sort(ordenarContagem);
  return r;
}
function ordenarContagem(a: [string, number], b: [string, number]) { return b[1] - a[1]; }
function contarTipoProjeto(tipo: TipoProjeto): number {
  let n = 0;
  for (let i = 0; i < PROJETOS.length; i++) { if (PROJETOS[i].tipo === tipo) n++; }
  return n;
}
function destaques(): Distincao[] {
  const r: Distincao[] = [];
  for (let i = 0; i < DISTINCOES.length; i++) { const d = DISTINCOES[i]; if (d.tipo === 'vencedora' || d.tipo === 'titulo' || d.tipo === 'certificacao') r.push(d); }
  return r;
}
function paisesTodos(): number {
  const m: Record<string, boolean> = {};
  for (let i = 0; i < FEIRAS.length; i++) { if (!futuro(FEIRAS[i])) m[FEIRAS[i].pais] = true; }
  for (let i = 0; i < PROJETOS.length; i++) { if (!futuro(PROJETOS[i])) m[PROJETOS[i].pais] = true; }
  return Object.keys(m).length;
}
function mesCurto(iso: string): string { return dataLocal(iso).toLocaleDateString(locale(), { month: 'short' }).replace('.', ''); }

function Indicador({ valor, rotulo }: { valor: number | string; rotulo: string }) {
  return (
    <div className="bm-num">
      <div className="bm-num-v">{valor}</div>
      <div className="bm-num-r">{rotulo}</div>
    </div>
  );
}

function ListaEventos({ eventos, comTipo }: { eventos: Evento[]; comTipo?: boolean }) {
  const anos = Array.from(new Set(eventos.map(anoDe))).sort(decrescente);
  return (
    <div className="bm-tl">
      {anos.map((ano) => {
        const doAno = filtrarEventos(eventos, ano, null).sort(porData);
        return (
          <section key={ano} className="bm-tl-ano" aria-labelledby={`bm-ano-${ano}`}>
            <h3 id={`bm-ano-${ano}`} className="bm-tl-marca"><span>{ano}</span><small>{doAno.length}</small></h3>
            <ul className="bm-lista">
              {doAno.map((e, i) => (
                <li key={`${e.ini}-${i}`} className={`bm-ev${futuro(e) ? ' prevista' : ''}`}>
                  <div className="bm-cal" aria-hidden="true"><b>{dataLocal(e.ini).getDate()}</b><span>{mesCurto(e.ini)}</span></div>
                  <div className="bm-ev-c">
                    <div className="bm-ev-n">{L(e.nome)}</div>
                    <div className="bm-ev-l"><img className="bm-band" src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={18} height={13} loading="lazy" />{e.cidade ? `${e.cidade} · ` : ''}{nomePais(e.pais)}</div>
                    <div className="bm-ev-d">{intervalo(e.ini, e.fim)}</div>
                    {(comTipo || futuro(e) || e.aConfirmar) && (
                      <div className="bm-ev-tags">
                        {comTipo && e.tipo && <span className="bm-tag">{L(TIPOS_PROJETO[e.tipo])}</span>}
                        {futuro(e) && <span className="bm-tag prev">{t('Prevista', 'Planned')}</span>}
                        {e.aConfirmar && <span className="bm-tag conf">{L(e.aConfirmar)}</span>}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
function decrescente(a: number, b: number) { return b - a; }
function porData(a: Evento, b: Evento) { return a.ini.localeCompare(b.ini); }

export default function BragaMundo() {
  const [aba, setAba] = useState<Aba>('distincoes');
  const [anoF, setAnoF] = useState<number | null>(null);
  const [tipoP, setTipoP] = useState<TipoProjeto | null>(null);
  const feitas = FEIRAS.filter(naoFuturo);
  const anosF = Array.from(new Set(FEIRAS.map(anoDe))).sort();
  const anosP = Array.from(new Set(PROJETOS.map(anoDe))).sort();
  const logos = todosOsLogos();
  const topo = destaques();
  const anosD = Array.from(new Set(DISTINCOES.map(anoDaDistincao))).sort(decrescente);
  const paisesF = paisesComContagem(feitas);
  const ABAS: [Aba, string][] = [['distincoes', t('Distinções', 'Distinctions')], ['feiras', t('Feiras', 'Trade fairs')], ['projetos', t('Projetos e cooperação', 'Projects and cooperation')]];
  const mudar = (a: Aba) => { setAba(a); setAnoF(null); setTipoP(null); };
  return (
    <div className="bm">
      <style>{CSS}</style>
      <header className="bm-hero">
        <div className="bm-hero-in">
          <div className="bm-kicker">{t('Promoção, cooperação e reconhecimento', 'Promotion, cooperation and recognition')}</div>
          <h1 className="bm-h1">{t('Internacionalização', 'Internationalisation')}</h1>
          <p className="bm-sub">{t('Como Braga se afirma lá fora: as distinções do destino, as feiras onde se promove e os projetos de cooperação europeia, desde 2023.', 'How Braga makes its mark abroad: the destination’s distinctions, the trade fairs where it promotes itself and its European cooperation projects, since 2023.')}</p>
          <div className="bm-nums">
            <Indicador valor={contarTipos(['vencedora'])} rotulo={t('títulos internacionais ganhos', 'international titles won')} />
            <Indicador valor={feitas.length} rotulo={t('feiras de turismo desde 2023', 'tourism fairs since 2023')} />
            <Indicador valor={paisesTodos()} rotulo={t('países com presença de Braga', 'countries where Braga was present')} />
            <Indicador valor={contarTipoProjeto('europeu')} rotulo={t('reuniões de projetos europeus', 'EU project meetings')} />
          </div>
        </div>
      </header>
      <div className="bm-abas-wrap">
        <div className="bm-abas" role="tablist" aria-label={t('Secções', 'Sections')}>
          {ABAS.map(([id, nome]) => (
            <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'on' : ''} onClick={() => mudar(id)}>{nome}</button>
          ))}
        </div>
      </div>

      {aba === 'distincoes' && (
        <div className="bm-corpo">
          <h2 className="bm-h2">{t('Títulos conquistados', 'Titles won')}</h2>
          <ul className="bm-trofeus">
            {topo.map((d) => (
              <li key={d.titulo.pt} className="bm-trofeu">
                <div className="bm-trofeu-logo">{d.logos && d.logos.length ? <img src={d.logos[0]} alt="" loading="lazy" /> : <span className="bm-trofeu-ano">{d.ano}</span>}</div>
                <div className="bm-trofeu-c">
                  <span className="bm-trofeu-a" style={{ color: COR[d.tipo] }}>{d.ano} · {L(ROTULO[d.tipo])}</span>
                  <strong>{L(d.titulo)}</strong>
                  <span className="bm-trofeu-e">{d.entidade}</span>
                </div>
              </li>
            ))}
          </ul>
          {logos.length > 0 && (
            <ul className="bm-logos" aria-label={t('Selos e logótipos das distinções', 'Distinction seals and logos')}>
              {logos.map((l) => <li key={l.src}><img src={l.src} alt={l.alt} loading="lazy" /></li>)}
            </ul>
          )}
          <h2 className="bm-h2">{t('Percurso completo', 'Full record')}</h2>
          <div className="bm-legenda" aria-hidden="true">
            {(Object.keys(ROTULO) as TipoDistincao[]).map((k) => <span key={k}><i style={{ background: COR[k] }} />{L(ROTULO[k])}</span>)}
          </div>
          <div className="bm-tl">
            {anosD.map((ano) => (
              <section key={ano} className="bm-tl-ano" aria-labelledby={`bm-d-${ano}`}>
                <h3 id={`bm-d-${ano}`} className="bm-tl-marca"><span>{ano}</span></h3>
                <ul className="bm-dist">
                  {distincoesDoAno(ano).map((d) => (
                    <li key={d.titulo.pt} className="bm-d">
                      <i className="bm-d-ponto" style={{ background: COR[d.tipo] }} aria-hidden="true" />
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
          </div>
          <p className="bm-nota">{t('Só constam distinções confirmadas em fontes públicas, com a ligação para cada uma. Finalistas e nomeações não são apresentados como vitórias, e as distinções de monumentos ou praias estão identificadas como tal.', 'Only distinctions confirmed in public sources are listed, each with its link. Finalists and nominations are not presented as wins, and distinctions of monuments or beaches are labelled as such.')}</p>
        </div>
      )}

      {aba === 'feiras' && (
        <div className="bm-corpo">
          <h2 className="bm-h2">{t('Onde estivemos', 'Where we have been')}</h2>
          <ul className="bm-paises">
            {paisesF.map(([c, n]) => (
              <li key={c}><img src={`https://flagcdn.com/${c}.svg`} alt="" width={26} height={18} loading="lazy" /><span>{nomePais(c)}</span><b>{n}</b></li>
            ))}
          </ul>
          <div className="bm-filtros" role="group" aria-label={t('Filtrar por ano', 'Filter by year')}>
            <button type="button" className={anoF === null ? 'on' : ''} aria-pressed={anoF === null} onClick={() => setAnoF(null)}>{t('Todos', 'All')}</button>
            {anosF.map((a) => <button key={a} type="button" className={anoF === a ? 'on' : ''} aria-pressed={anoF === a} onClick={() => setAnoF(a)}>{a}</button>)}
          </div>
          <ListaEventos eventos={filtrarEventos(FEIRAS, anoF, null)} />
        </div>
      )}

      {aba === 'projetos' && (
        <div className="bm-corpo">
          <div className="bm-filtros" role="group" aria-label={t('Filtrar por tipo', 'Filter by type')}>
            <button type="button" className={tipoP === null ? 'on' : ''} aria-pressed={tipoP === null} onClick={() => setTipoP(null)}>{t('Todos', 'All')} <b>{PROJETOS.length}</b></button>
            {(Object.keys(TIPOS_PROJETO) as TipoProjeto[]).map((k) => <button key={k} type="button" className={tipoP === k ? 'on' : ''} aria-pressed={tipoP === k} onClick={() => setTipoP(k)}>{L(TIPOS_PROJETO[k])} <b>{contarTipoProjeto(k)}</b></button>)}
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
function anoDaDistincao(d: Distincao) { return d.ano; }

const CSS = `
.bm { color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.bm-hero { position: relative; background: linear-gradient(180deg, rgba(21,23,27,.55) 0%, rgba(21,23,27,.82) 60%, #15171B 100%), url(/visao-geral.jpg) center 40% / cover no-repeat; }
.bm-hero-in { max-width: 1400px; margin: 0 auto; padding: 64px 40px 30px; }
.bm-kicker { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #8AB0E6; }
.bm-h1 { font-size: clamp(34px, 5vw, 58px); line-height: 1.05; letter-spacing: -0.025em; margin: 10px 0 12px; }
.bm-sub { margin: 0 0 28px; font-size: 16.5px; color: #C9CDD3; max-width: 780px; line-height: 1.6; }
.bm-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.bm-num { padding: 18px 20px; border-radius: 14px; background: rgba(21,23,27,.55); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.bm-num-v { font-size: 40px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.bm-num-r { margin-top: 8px; font-size: 13.5px; color: #C9CDD3; line-height: 1.4; }
.bm-abas-wrap { position: sticky; top: 0; z-index: 20; background: rgba(21,23,27,.94); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #2D3139; }
.bm-abas { max-width: 1400px; margin: 0 auto; padding: 12px 40px; display: flex; gap: 8px; flex-wrap: wrap; }
.bm-abas button { height: 40px; padding: 0 18px; border-radius: 999px; border: 1px solid #3A404B; background: rgba(255,255,255,.04); color: #C9CDD3; font: 600 14px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.bm-abas button.on { background: #8AB0E6; border-color: #8AB0E6; color: #0F1216; }
.bm-corpo { padding: 28px 40px 56px; max-width: 1400px; margin: 0 auto; }
.bm-h2 { font-size: 21px; letter-spacing: -0.01em; margin: 6px 0 14px; }
.bm-trofeus { list-style: none; margin: 0 0 22px; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.bm-trofeu { display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 14px; background: linear-gradient(135deg, #22262D, #1C1F24); border: 1px solid #2D3139; }
.bm-trofeu-logo { flex: 0 0 76px; height: 76px; border-radius: 12px; background: #F4F4F2; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.bm-trofeu-logo img { max-width: 68px; max-height: 68px; object-fit: contain; }
.bm-trofeu-ano { color: #15171B; font-weight: 800; font-size: 20px; }
.bm-trofeu-c { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.bm-trofeu-a { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.bm-trofeu-c strong { font-size: 14.5px; line-height: 1.35; }
.bm-trofeu-e { font-size: 12.5px; color: #A3A8B1; }
.bm-logos { list-style: none; margin: 0 0 30px; padding: 18px; display: flex; flex-wrap: wrap; gap: 22px; align-items: center; justify-content: center; border-radius: 14px; background: #F4F4F2; }
.bm-logos img { height: 84px; width: auto; max-width: 260px; object-fit: contain; display: block; }
.bm-legenda { display: flex; gap: 14px; flex-wrap: wrap; margin: 0 0 16px; font-size: 12.5px; color: #A3A8B1; }
.bm-legenda span { display: inline-flex; align-items: center; gap: 6px; }
.bm-legenda i { width: 9px; height: 9px; border-radius: 999px; display: inline-block; }
.bm-tl { position: relative; padding-left: 92px; }
.bm-tl::before { content: ''; position: absolute; left: 70px; top: 6px; bottom: 6px; width: 2px; background: linear-gradient(#3A404B, #2D3139); border-radius: 2px; }
.bm-tl-ano { position: relative; margin-bottom: 26px; }
.bm-tl-marca { position: absolute; left: -92px; top: 0; width: 60px; margin: 0; text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
.bm-tl-marca span { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
.bm-tl-marca small { font-size: 11.5px; color: #A3A8B1; font-weight: 600; }
.bm-dist { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.bm-d { position: relative; padding: 16px 18px; border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; display: flex; flex-direction: column; gap: 6px; }
.bm-d-ponto { position: absolute; left: -27px; top: 20px; width: 12px; height: 12px; border-radius: 999px; box-shadow: 0 0 0 4px #15171B; }
.bm-dist .bm-d:not(:first-child) .bm-d-ponto { display: none; }
.bm-d-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
.bm-d-tipo { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid; }
.bm-d-ent { font-size: 12.5px; color: #A3A8B1; }
.bm-d-t { font-size: 15.5px; font-weight: 700; line-height: 1.35; }
.bm-d-x { margin: 0; font-size: 13.5px; color: #C9CDD3; line-height: 1.55; flex: 1; }
.bm-d-f { align-self: flex-start; font-size: 12.5px; color: #8AB0E6; text-decoration: none; }
.bm-d-f:hover { text-decoration: underline; }
.bm-paises { list-style: none; margin: 0 0 20px; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; }
.bm-paises li { display: inline-flex; align-items: center; gap: 9px; padding: 8px 14px 8px 10px; border-radius: 999px; background: #1C1F24; border: 1px solid #2D3139; font-size: 14px; }
.bm-paises img { width: 26px; height: 18px; object-fit: cover; border-radius: 3px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-paises b { font-size: 15px; color: #8AB0E6; }
.bm-filtros { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
.bm-filtros button { height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #C9CDD3; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.bm-filtros button b { font-size: 11.5px; padding: 1px 7px; border-radius: 999px; background: #2D3139; color: #ECEDEF; }
.bm-filtros button.on { background: rgba(138,176,230,.16); border-color: #8AB0E6; color: #ECEDEF; }
.bm-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 10px; }
.bm-ev { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 14px; align-items: start; padding: 12px 14px; border-radius: 12px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-ev.prevista { border-style: dashed; background: transparent; }
.bm-cal { width: 56px; border-radius: 10px; overflow: hidden; text-align: center; background: #22262D; border: 1px solid #3A404B; }
.bm-cal b { display: block; font-size: 22px; line-height: 1; padding: 8px 0 4px; }
.bm-cal span { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; padding: 3px 0 5px; background: #8AB0E6; color: #0F1216; }
.bm-ev-n { font-size: 14.5px; font-weight: 700; line-height: 1.35; }
.bm-ev-l { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #A3A8B1; margin-top: 3px; }
.bm-band { width: 18px; height: 13px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-ev-d { font-size: 12.5px; font-weight: 600; color: #C9CDD3; margin-top: 4px; }
.bm-ev-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 7px; }
.bm-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #22262D; color: #C9CDD3; }
.bm-tag.prev { background: rgba(237,160,107,.15); color: #EDA06B; }
.bm-tag.conf { background: rgba(239,138,123,.15); color: #EF8A7B; }
.bm-nota { margin-top: 18px; font-size: 13px; color: #A3A8B1; line-height: 1.6; max-width: 900px; }
.bm button:focus-visible, .bm a:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
@media (max-width: 900px) { .bm-nums { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) {
  .bm-hero-in { padding: 36px 16px 22px; } .bm-abas { padding: 10px 16px; } .bm-corpo { padding: 20px 16px 36px; }
  .bm-num { padding: 14px; } .bm-num-v { font-size: 30px; }
  .bm-lista, .bm-dist, .bm-trofeus { grid-template-columns: 1fr; }
  .bm-tl { padding-left: 0; } .bm-tl::before { display: none; }
  .bm-tl-marca { position: static; width: auto; flex-direction: row; align-items: baseline; gap: 8px; margin-bottom: 10px; }
  .bm-d-ponto { display: none; }
  .bm-logos img { height: 60px; }
}
@media (prefers-reduced-motion: reduce) { .bm * { transition: none !important; animation: none !important; } }
`;
