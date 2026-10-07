'use client';

import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAdmin } from './modo';
import { t, getLang } from '@/app/lib/i18n';
import { FEIRAS, PROJETOS, DISTINCOES, TIPOS_PROJETO, MOSAICO, type Distincao, type Evento, type Texto3, type TipoDistincao, type TipoProjeto } from '@/app/lib/braga-mundo-dados';

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

// ── Galeria "Momentos": fotografias com legenda, independentes das feiras (Firestore: internacionalGaleria) ──
function comprimirImagem(ficheiro: File): Promise<string> {
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onerror = () => falha(new Error('leitura'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => falha(new Error('imagem'));
      img.onload = () => {
        const max = 1400; const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        const g = c.getContext('2d'); if (!g) { falha(new Error('canvas')); return; }
        g.drawImage(img, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(ficheiro);
  });
}
interface Momento { id?: string; src: string; legenda: string; criado?: string }
function ordenarMomentos(a: Momento, b: Momento) { return (b.criado || '').localeCompare(a.criado || ''); }

function Galeria({ admin, semTitulo }: { admin: boolean; semTitulo?: boolean }) {
  const [enviados, setEnviados] = useState<Momento[]>([]);
  const [aGravar, setAGravar] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => {
    getDocs(collection(db, 'internacionalGaleria')).then((snap) => {
      const r: Momento[] = [];
      snap.forEach((d) => { const x = d.data() as { img?: string; legenda?: string; criado?: string }; if (x && x.img) r.push({ id: d.id, src: x.img, legenda: x.legenda || '', criado: x.criado }); });
      r.sort(ordenarMomentos); setEnviados(r);
    }).catch(() => { /* sem fotografias acrescentadas */ });
  }, []);
  const acrescentar = async (lista: FileList | null) => {
    const f = lista && lista[0]; if (!f) return;
    const legenda = window.prompt(t('Legenda da fotografia (ex.: FITUR 2024 · Madrid)', 'Photo caption (e.g. FITUR 2024 · Madrid)')) || '';
    setAGravar(true);
    try {
      const img = await comprimirImagem(f);
      const criado = new Date().toISOString();
      const ref = await addDoc(collection(db, 'internacionalGaleria'), { img, legenda, criado });
      const novo: Momento = { id: ref.id, src: img, legenda, criado };
      setEnviados([novo, ...enviados]);
    } catch { alert(t('Não foi possível guardar a fotografia.', 'Could not save the photo.')); }
    finally { setAGravar(false); if (entrada.current) entrada.current.value = ''; }
  };
  const remover = async (m: Momento) => {
    if (!m.id || !confirm(t('Remover esta fotografia?', 'Remove this photo?'))) return;
    try { await deleteDoc(doc(db, 'internacionalGaleria', m.id)); setEnviados(semMomento(enviados, m.id)); }
    catch { alert(t('Não foi possível remover a fotografia.', 'Could not remove the photo.')); }
  };
  const todos: Momento[] = [...enviados, ...MOSAICO];
  return (
    <section className="bm-gal" aria-label={t('Momentos', 'Moments')}>
      <div className="bm-gal-cab">
        {!semTitulo && <h2 id="bm-gal-t" className="bm-h2">{t('Momentos', 'Moments')}</h2>}
        {admin && (
          <>
            <input ref={entrada} type="file" accept="image/*" hidden onChange={(ev) => acrescentar(ev.target.files)} />
            <button type="button" className="bm-gal-add" onClick={() => entrada.current?.click()} disabled={aGravar}>{aGravar ? t('A guardar…', 'Saving…') : t('+ Acrescentar fotografia', '+ Add photo')}</button>
          </>
        )}
      </div>
      <ul className="bm-gal-faixa">
        {todos.map((m, i) => (
          <li key={m.id || m.src + i} className="bm-gal-it">
            <img src={m.src} alt={m.legenda} loading="lazy" />
            {m.legenda && <span className="bm-gal-leg">{m.legenda}</span>}
            {admin && m.id && <button type="button" className="bm-gal-x" onClick={() => remover(m)} aria-label={t('Remover esta fotografia?', 'Remove this photo?')}>×</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
function semMomento(lista: Momento[], id: string): Momento[] {
  const r: Momento[] = [];
  for (let i = 0; i < lista.length; i++) if (lista[i].id !== id) r.push(lista[i]);
  return r;
}

function presencasPorPais(): [string, number][] {
  const lista: Evento[] = [];
  for (let i = 0; i < FEIRAS.length; i++) if (!futuro(FEIRAS[i])) lista.push(FEIRAS[i]);
  for (let i = 0; i < PROJETOS.length; i++) if (!futuro(PROJETOS[i])) lista.push(PROJETOS[i]);
  return paisesComContagem(lista);
}
function Indicador({ valor, rotulo }: { valor: number | string; rotulo: string }) {
  return (<div className="bm-num"><div className="bm-num-v">{valor}</div><div className="bm-num-r">{rotulo}</div></div>);
}

// ── Feiras: grelha feira × ano (as feiras repetem-se todos os anos) ──
interface LinhaFeira { chave: string; exemplo: Evento; pais: string; porAno: Record<number, Evento[]>; total: number }
function nomeBase(e: Evento): string { return typeof e.nome === 'string' ? e.nome : e.nome.pt; }
function chaveFeira(e: Evento): string { const n = nomeBase(e); if (n.indexOf('BTL') >= 0) return 'BTL'; return n.replace(/\s+20\d\d$/, '').trim(); }
function matrizFeiras(): LinhaFeira[] {
  const m: Record<string, LinhaFeira> = {};
  for (let i = 0; i < FEIRAS.length; i++) {
    const e = FEIRAS[i]; const k = chaveFeira(e); const a = anoDe(e);
    if (!m[k]) m[k] = { chave: k, exemplo: e, pais: e.pais, porAno: {}, total: 0 };
    if (!m[k].porAno[a]) m[k].porAno[a] = [];
    m[k].porAno[a].push(e); m[k].total++;
    if (e.ini > m[k].exemplo.ini) m[k].exemplo = e;
  }
  const r: LinhaFeira[] = [];
  const ks = Object.keys(m); for (let i = 0; i < ks.length; i++) r.push(m[ks[i]]);
  r.sort(ordenarLinhas);
  return r;
}
function ordenarLinhas(a: LinhaFeira, b: LinhaFeira) { return b.total - a.total || a.chave.localeCompare(b.chave); }
function nomeLinha(l: LinhaFeira): string {
  if (l.chave === 'BTL') return 'BTL · Lisboa';
  if (/^AGRO/.test(l.chave)) return 'AGRO · Braga';
  return typeof l.exemplo.nome === 'string' ? l.chave : L(l.exemplo.nome).replace(/\s+20\d\d$/, '');
}
function diasCurtos(e: Evento): string {
  const a = dataLocal(e.ini); const b = e.fim ? dataLocal(e.fim) : a;
  const f = (d: Date) => d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' }).replace('.', '');
  if (a.getMonth() === b.getMonth()) return a.getDate() === b.getDate() ? f(a) : `${a.getDate()}–${f(b)}`;
  return `${f(a)} – ${f(b)}`;
}
function cidadesDistintas(l: LinhaFeira): boolean {
  let primeira = ''; const anos = Object.keys(l.porAno);
  for (let i = 0; i < anos.length; i++) { const lista = l.porAno[Number(anos[i])]; for (let j = 0; j < lista.length; j++) { const c = lista[j].cidade || ''; if (!primeira) primeira = c; else if (c !== primeira) return true; } }
  return false;
}
function anosDasFeiras(): number[] { return Array.from(new Set(FEIRAS.map(anoDe))).sort(); }

function MatrizFeiras() {
  const linhas = matrizFeiras(); const anos = anosDasFeiras();
  return (
    <div className="bm-mat-wrap">
      <table className="bm-mat">
        <caption className="bm-sr">{t('Feiras por ano', 'Fairs by year')}</caption>
        <thead><tr><th scope="col">{t('Feira', 'Fair')}</th>{anos.map((a) => <th key={a} scope="col">{a}</th>)}</tr></thead>
        <tbody>
          {linhas.map((l) => <LinhaMatriz key={l.chave} l={l} anos={anos} />)}
        </tbody>
      </table>
    </div>
  );
}
function LinhaMatriz({ l, anos }: { l: LinhaFeira; anos: number[] }) {
  const varia = cidadesDistintas(l);
  return (
    <tr>
      <th scope="row">
        <span className="bm-mat-nome"><img src={`https://flagcdn.com/${l.pais}.svg`} alt="" width={20} height={14} loading="lazy" />{nomeLinha(l)}</span>
        <span className="bm-mat-sub">{varia ? nomePais(l.pais) : `${l.exemplo.cidade ? l.exemplo.cidade + ' · ' : ''}${nomePais(l.pais)}`}</span>
      </th>
      {anos.map((a) => <CelulaMatriz key={a} ano={a} lista={l.porAno[a]} varia={varia} />)}
    </tr>
  );
}
function CelulaMatriz({ ano, lista, varia }: { ano: number; lista?: Evento[]; varia: boolean }) {
  if (!lista || !lista.length) return <td data-l={ano} className="vazia"><span aria-label={t('sem participação', 'no participation')}>-</span></td>;
  const e = lista[0];
  return (
    <td data-l={ano} className={futuro(e) ? 'prevista' : 'feita'}>
      <span className="bm-mat-d">{diasCurtos(e)}</span>
      {varia && e.cidade && <span className="bm-mat-c">{e.cidade}</span>}
      {futuro(e) && <span className="bm-mat-p">{t('Prevista', 'Planned')}</span>}
    </td>
  );
}

// ── Projetos: agrupados por projeto europeu, candidaturas e outras ações ──
function grupoDe(e: Evento): string {
  const n = nomeBase(e);
  if (n.indexOf('POST') >= 0) return 'POST';
  if (n.indexOf('SCT-HUB') >= 0) return 'SCT-HUB';
  if (n.indexOf('IURC') >= 0) return 'IURC';
  if (n.indexOf('URBACT') >= 0) return 'URBACT Cities After Dark';
  if (n.indexOf('SYSTEMEU') >= 0) return 'SYSTEMEU';
  if (e.tipo === 'candidatura') return '__cand';
  return '__outras';
}
function projetosDoGrupo(g: string): Evento[] {
  const r: Evento[] = [];
  for (let i = 0; i < PROJETOS.length; i++) if (grupoDe(PROJETOS[i]) === g) r.push(PROJETOS[i]);
  r.sort(porData); return r;
}
function gruposEuropeus(): string[] {
  const m: Record<string, boolean> = {}; const r: string[] = [];
  for (let i = 0; i < PROJETOS.length; i++) { const g = grupoDe(PROJETOS[i]); if (g.indexOf('__') !== 0 && !m[g]) { m[g] = true; r.push(g); } }
  return r;
}
function anosTexto(lista: Evento[]): string { if (!lista.length) return ''; const a = anoDe(lista[0]), b = anoDe(lista[lista.length - 1]); return a === b ? String(a) : `${a}–${b}`; }
function paisesDe(lista: Evento[]): string[] { const m: Record<string, boolean> = {}; const r: string[] = []; for (let i = 0; i < lista.length; i++) if (!m[lista[i].pais]) { m[lista[i].pais] = true; r.push(lista[i].pais); } return r; }

function GrupoProjeto({ nome, lista, acoes }: { nome: string; lista: Evento[]; acoes?: boolean }) {
  return (
    <article className="bm-grp">
      <header>
        <h3>{nome === 'POST' || nome === 'SCT-HUB' || nome === 'IURC' || nome === 'SYSTEMEU' ? `${t('Projeto', 'Project')} ${nome}` : nome}</h3>
        <span>{lista.length} {acoes ? (lista.length === 1 ? t('ação', 'action') : t('ações', 'actions')) : (lista.length === 1 ? t('reunião', 'meeting') : t('reuniões', 'meetings'))} · {anosTexto(lista)}</span>
      </header>
      <ol className="bm-grp-l">
        {lista.map((e, i) => (
          <li key={`${e.ini}-${i}`} className={futuro(e) ? 'prevista' : ''}>
            <span className="bm-grp-d">{intervalo(e.ini, e.fim)}</span>
            <span className="bm-grp-n">{L(e.nome).replace(/^(Projeto|Project|Proyecto)\s+\S+\s*·\s*/, '').replace(/^Eixo Atlântico · |^Eixo Atlántico · /, '')}</span>
            <span className="bm-grp-c"><img src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={16} height={11} loading="lazy" />{e.cidade || nomePais(e.pais)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
function TabelaAcoes({ lista }: { lista: Evento[] }) {
  return (
    <div className="bm-mat-wrap">
      <table className="bm-acoes">
        <caption className="bm-sr">{t('Outras ações', 'Other actions')}</caption>
        <thead><tr><th scope="col">{t('Data', 'Date')}</th><th scope="col">{t('Ação', 'Action')}</th><th scope="col">{t('Local', 'Place')}</th><th scope="col">{t('Tipo', 'Type')}</th></tr></thead>
        <tbody>
          {lista.map((e, i) => (
            <tr key={`${e.ini}-${i}`} className={futuro(e) ? 'prevista' : ''}>
              <td data-l={t('Data', 'Date')}>{intervalo(e.ini, e.fim)}</td>
              <td data-l={t('Ação', 'Action')} className="bm-acoes-n">{L(e.nome)}{e.aConfirmar ? <span className="bm-tag conf">{L(e.aConfirmar)}</span> : null}</td>
              <td data-l={t('Local', 'Place')}><img src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={16} height={11} loading="lazy" />{e.cidade ? `${e.cidade} · ` : ''}{nomePais(e.pais)}</td>
              <td data-l={t('Tipo', 'Type')}>{e.tipo ? L(TIPOS_PROJETO[e.tipo]) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function decrescente(a: number, b: number) { return b - a; }
function porData(a: Evento, b: Evento) { return a.ini.localeCompare(b.ini); }
function porDataDesc(a: Evento, b: Evento) { return b.ini.localeCompare(a.ini); }
function anoDaDistincao(d: Distincao) { return d.ano; }

// ── Efeitos: números que contam e capítulos que entram ao descer (respeitam o movimento reduzido) ──
function movimentoReduzido() { return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function Contador({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (movimentoReduzido() || typeof IntersectionObserver === 'undefined') { setV(valor); return; }
    let raf = 0;
    const animar = () => { let ini = 0; const passo = (ts: number) => { if (!ini) ini = ts; const x = Math.min(1, (ts - ini) / 1200); setV(Math.round(valor * (1 - Math.pow(1 - x, 3)))); if (x < 1) raf = requestAnimationFrame(passo); }; raf = requestAnimationFrame(passo); };
    const obs = new IntersectionObserver((ents) => { if (ents[0] && ents[0].isIntersecting) { animar(); obs.disconnect(); } }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [valor]);
  return <span ref={ref}>{v}</span>;
}
function Capitulo({ id, kicker, titulo, resumo, children }: { id: string; kicker: string; titulo: string; resumo: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (movimentoReduzido() || typeof IntersectionObserver === 'undefined') { setVisivel(true); return; }
    const obs = new IntersectionObserver((ents) => { if (ents[0] && ents[0].isIntersecting) { setVisivel(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={`bm-capt${visivel ? ' in' : ''}`} aria-labelledby={`${id}-t`}>
      <div className="bm-capt-cab">
        <span className="bm-capt-n" aria-hidden="true">{kicker}</span>
        <div>
          <h2 id={`${id}-t`}>{titulo}</h2>
          <p className="bm-resumo">{resumo}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function irPara(id: string) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: movimentoReduzido() ? 'auto' : 'smooth', block: 'start' }); }

function BarrasPaises({ lista }: { lista: [string, number][] }) {
  const max = lista.length ? lista[0][1] : 1;
  return (
    <ul className="bm-barras">
      {lista.map((p) => (
        <li key={p[0]}>
          <span className="bm-barras-n"><img src={`https://flagcdn.com/${p[0]}.svg`} alt="" width={22} height={15} loading="lazy" />{nomePais(p[0])}</span>
          <span className="bm-barras-t" aria-hidden="true"><span style={{ width: `${Math.max(4, (p[1] / max) * 100)}%` }} /></span>
          <b>{p[1]}</b>
        </li>
      ))}
    </ul>
  );
}


// ── Distinções: cartões com ano, título, entidade e selo ──
function separarDistincoes(principais: boolean): Distincao[] {
  const r: Distincao[] = [];
  for (let i = 0; i < DISTINCOES.length; i++) {
    const fin = DISTINCOES[i].tipo === 'finalista' || DISTINCOES[i].tipo === 'emCurso';
    if (principais !== fin) r.push(DISTINCOES[i]);
  }
  r.sort(porAnoDistincao);
  return r;
}
function porAnoDistincao(a: Distincao, b: Distincao) { return b.ano - a.ano; }
function CartaoDistincao({ d, pequeno }: { d: Distincao; pequeno?: boolean }) {
  const logo = d.logos && d.logos.length ? d.logos[0] : null;
  return (
    <li className={`bm-dc bm-dc-${d.tipo}${pequeno ? ' pequeno' : ''}`}>
      <div className="bm-dc-top">
        <span className="bm-dc-ano">{d.ano}</span>
        {logo && !pequeno && <span className="bm-dc-logo"><img src={logo} alt="" loading="lazy" /></span>}
      </div>
      <span className="bm-dc-tipo" style={{ color: COR[d.tipo] }}>{L(ROTULO[d.tipo])}</span>
      <h3 className="bm-dc-t">{L(d.titulo)}</h3>
      <p className="bm-dc-x">{L(d.texto)}</p>
      <div className="bm-dc-pe"><span>{d.entidade}</span><a href={d.fonte} target="_blank" rel="noopener noreferrer">{t('Fonte', 'Source')} <span aria-hidden="true">↗</span></a></div>
    </li>
  );
}

// ── Síntese anual: um ano de cada vez, com um clique ──
const FOTO_ANO: Record<number, string> = { 2026: '/internacional/fitur-2026.jpg', 2025: '/internacional/ecst-final-2025.jpg', 2024: '/internacional/fitur-2024.jpg', 2023: '/internacional/btl-2023.jpg' };
function eventosDoAno(lista: Evento[], ano: number): Evento[] {
  const r: Evento[] = [];
  for (let i = 0; i < lista.length; i++) if (anoDe(lista[i]) === ano) r.push(lista[i]);
  r.sort(porData); return r;
}
function contarPaisesRealizados(lista: Evento[]): number {
  const m: Record<string, boolean> = {};
  for (let i = 0; i < lista.length; i++) if (!futuro(lista[i])) m[lista[i].pais] = true;
  return Object.keys(m).length;
}
function contarRealizados(lista: Evento[]): number { let n = 0; for (let i = 0; i < lista.length; i++) if (!futuro(lista[i])) n++; return n; }
function contarEuropeus(lista: Evento[]): number { let n = 0; for (let i = 0; i < lista.length; i++) if (lista[i].tipo === 'europeu') n++; return n; }
function anosTodos(): number[] { return Array.from(new Set(FEIRAS.map(anoDe).concat(PROJETOS.map(anoDe)))).sort(); }
function LinhaEvento({ e, comTipo }: { e: Evento; comTipo?: boolean }) {
  return (
    <li className={`bm-le${futuro(e) ? ' prevista' : ''}`}>
      <span className="bm-le-d">{diasCurtos(e)}</span>
      <span className="bm-le-n">{L(e.nome)}{comTipo && e.tipo ? <em>{L(TIPOS_PROJETO[e.tipo])}</em> : null}</span>
      <span className="bm-le-l"><img src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={18} height={13} loading="lazy" />{e.cidade || nomePais(e.pais)}</span>
      {futuro(e) && <span className="bm-le-p">{t('Prevista', 'Planned')}</span>}
    </li>
  );
}
function SinteseAnual() {
  const anos = anosTodos();
  const [ano, setAno] = useState<number>(anos.indexOf(2026) >= 0 ? 2026 : anos[anos.length - 1]);
  const feiras = eventosDoAno(FEIRAS, ano);
  const projetos = eventosDoAno(PROJETOS, ano);
  const dist = distincoesDoAno(ano);
  const foto = FOTO_ANO[ano];
  return (
    <div className="bm-sa">
      <div className="bm-sa-anos" role="tablist" aria-label={t('Escolher o ano', 'Choose the year')}>
        {anos.map((a) => <button key={a} type="button" role="tab" aria-selected={a === ano} className={a === ano ? 'on' : ''} onClick={() => setAno(a)}>{a}</button>)}
      </div>
      <div key={ano} className="bm-sa-painel" role="tabpanel">
        <div className="bm-sa-capa">
          {foto ? <img src={foto} alt="" /> : <span className="bm-sa-tipo" aria-hidden="true">{ano}</span>}
          <div className="bm-sa-capa-t"><span>{ano}</span>{ano > new Date().getFullYear() && <em>{t('Previsto', 'Planned')}</em>}</div>
        </div>
        <div className="bm-sa-info">
          <div className="bm-sa-nums">
            <div><b>{contarRealizados(feiras)}</b><span>{t('feiras realizadas', 'fairs attended')}</span></div>
            <div><b>{contarPaisesRealizados(feiras.concat(projetos))}</b><span>{t('países', 'countries')}</span></div>
            <div><b>{contarEuropeus(projetos)}</b><span>{t('reuniões de projetos europeus', 'EU project meetings')}</span></div>
          </div>
          <h4 className="bm-sa-h">{t('Distinções', 'Distinctions')}</h4>
          {dist.length ? <ul className="bm-sa-dist">{dist.map((d) => <li key={d.titulo.pt}><i style={{ background: COR[d.tipo] }} aria-hidden="true" /><span>{L(d.titulo)}</span><em>{L(ROTULO[d.tipo])}</em></li>)}</ul> : <p className="bm-sa-vazio">{t('Sem distinções neste ano.', 'No distinctions this year.')}</p>}
        </div>
      </div>
      <div key={`l-${ano}`} className="bm-sa-listas">
        <div><h4 className="bm-sa-h">{t('Feiras', 'Trade fairs')} <span>{feiras.length}</span></h4>{feiras.length ? <ul className="bm-le-l-ul">{feiras.map((e, i) => <LinhaEvento key={`${e.ini}-${i}`} e={e} />)}</ul> : <p className="bm-sa-vazio">-</p>}</div>
        <div><h4 className="bm-sa-h">{t('Projetos e ações', 'Projects and actions')} <span>{projetos.length}</span></h4>{projetos.length ? <ul className="bm-le-l-ul">{projetos.map((e, i) => <LinhaEvento key={`${e.ini}-${i}`} e={e} comTipo />)}</ul> : <p className="bm-sa-vazio">-</p>}</div>
      </div>
    </div>
  );
}

// ── Feiras: cada feira com a sua presença ao longo dos anos (pontos) ──
function SeriesFeiras() {
  const linhas = matrizFeiras(); const anos = anosDasFeiras();
  return (
    <ul className="bm-series">
      {linhas.map((l) => <SerieFeira key={l.chave} l={l} anos={anos} />)}
    </ul>
  );
}
function SerieFeira({ l, anos }: { l: LinhaFeira; anos: number[] }) {
  let feitas = 0; const ks = Object.keys(l.porAno);
  for (let i = 0; i < ks.length; i++) { const lista = l.porAno[Number(ks[i])]; for (let j = 0; j < lista.length; j++) if (!futuro(lista[j])) feitas++; }
  return (
    <li className="bm-serie">
      <div className="bm-serie-cab"><img src={`https://flagcdn.com/${l.pais}.svg`} alt="" width={22} height={15} loading="lazy" /><strong>{nomeLinha(l)}</strong></div>
      <span className="bm-serie-l">{cidadesDistintas(l) ? nomePais(l.pais) : `${l.exemplo.cidade ? l.exemplo.cidade + ' · ' : ''}${nomePais(l.pais)}`}</span>
      <div className="bm-serie-pts">{anos.map((a) => <PontoAno key={a} ano={a} lista={l.porAno[a]} />)}</div>
      <span className="bm-serie-n">{feitas} {feitas === 1 ? t('participação', 'participation') : t('participações', 'participations')}</span>
    </li>
  );
}
function PontoAno({ ano, lista }: { ano: number; lista?: Evento[] }) {
  const e = lista && lista.length ? lista[0] : null;
  const estado = !e ? 'vazio' : futuro(e) ? 'prev' : 'ok';
  const dica = e ? `${ano} · ${diasCurtos(e)}${e.cidade ? ' · ' + e.cidade : ''}` : `${ano} · ${t('sem participação', 'no participation')}`;
  return <span className={`bm-pt ${estado}`} title={dica} aria-label={dica}><i aria-hidden="true" /><small>{String(ano).slice(2)}</small></span>;
}

// ── Cooperação: projetos europeus e outras ações por tipo, sem tabelas ──
function acoesPorTipo(lista: Evento[]): [TipoProjeto, Evento[]][] {
  const m: Partial<Record<TipoProjeto, Evento[]>> = {};
  for (let i = 0; i < lista.length; i++) { const k = (lista[i].tipo || 'evento') as TipoProjeto; if (!m[k]) m[k] = []; (m[k] as Evento[]).push(lista[i]); }
  const r: [TipoProjeto, Evento[]][] = [];
  const ks = Object.keys(m) as TipoProjeto[];
  for (let i = 0; i < ks.length; i++) r.push([ks[i], (m[ks[i]] as Evento[]).sort(porDataDesc)]);
  return r;
}

// ── Cooperação europeia: lista à esquerda, detalhe do que estiver escolhido à direita ──
interface GrupoCoop { id: string; nome: string; lista: Evento[]; acoes: boolean; seccao: string }
function gruposCooperacao(): GrupoCoop[] {
  const r: GrupoCoop[] = [];
  const eu = gruposEuropeus();
  for (let i = 0; i < eu.length; i++) r.push({ id: eu[i], nome: eu[i] === 'URBACT Cities After Dark' ? eu[i] : `${t('Projeto', 'Project')} ${eu[i]}`, lista: projetosDoGrupo(eu[i]), acoes: false, seccao: 'eu' });
  r.sort(maisReunioes);
  r.push({ id: '__cand', nome: t('Candidaturas, prémios e certificação', 'Bids, awards and certification'), lista: projetosDoGrupo('__cand'), acoes: true, seccao: 'cand' });
  const outras = acoesPorTipo(projetosDoGrupo('__outras'));
  for (let i = 0; i < outras.length; i++) r.push({ id: `__${outras[i][0]}`, nome: L(TIPOS_PROJETO[outras[i][0]]), lista: outras[i][1].slice().sort(porData), acoes: true, seccao: 'outras' });
  return r;
}
function Cooperacao() {
  const grupos = gruposCooperacao();
  const [sel, setSel] = useState<string>(grupos.length ? grupos[0].id : '');
  let g: GrupoCoop | null = null;
  for (let i = 0; i < grupos.length; i++) if (grupos[i].id === sel) g = grupos[i];
  const SECOES: [string, string][] = [['eu', t('Projetos europeus', 'EU projects')], ['cand', t('Candidaturas', 'Bids')], ['outras', t('Outras ações', 'Other actions')]];
  return (
    <div className="bm-coop">
      <div className="bm-coop-lista" role="tablist" aria-label={t('Projetos e ações', 'Projects and actions')}>
        {SECOES.map(([sec, rotulo]) => <ListaSeccao key={sec} rotulo={rotulo} grupos={grupos} seccao={sec} sel={sel} aoEscolher={setSel} />)}
      </div>
      {g && (
        <div key={g.id} className="bm-coop-det" role="tabpanel">
          <div className="bm-coop-cab">
            <h3>{g.nome}</h3>
            <div className="bm-coop-meta">
              <span><b>{g.lista.length}</b> {g.acoes ? (g.lista.length === 1 ? t('ação', 'action') : t('ações', 'actions')) : (g.lista.length === 1 ? t('reunião', 'meeting') : t('reuniões', 'meetings'))}</span>
              <span><b>{anosTexto(g.lista)}</b></span>
              <span className="bm-coop-band">{paisesDe(g.lista).map(bandeiraPais)}</span>
            </div>
          </div>
          <ol className="bm-coop-tl">
            {g.lista.map((e, i) => (
              <li key={`${e.ini}-${i}`} className={futuro(e) ? 'prevista' : ''}>
                <span className="bm-coop-d">{intervalo(e.ini, e.fim)}</span>
                <span className="bm-coop-n">{L(e.nome).replace(/^(Projeto|Project|Proyecto)\s+\S+\s*·\s*/, '').replace(/^Eixo Atlântico · |^Eixo Atlántico · /, '')}</span>
                <span className="bm-coop-l"><img src={`https://flagcdn.com/${e.pais}.svg`} alt="" width={18} height={13} loading="lazy" />{e.cidade ? `${e.cidade} · ` : ''}{nomePais(e.pais)}{futuro(e) ? <em>{t('Prevista', 'Planned')}</em> : null}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
function maisReunioes(a: GrupoCoop, b: GrupoCoop) { return b.lista.length - a.lista.length; }
function bandeiraPais(c: string) { return <img key={c} src={`https://flagcdn.com/${c}.svg`} alt="" width={20} height={14} loading="lazy" />; }
function ListaSeccao({ rotulo, grupos, seccao, sel, aoEscolher }: { rotulo: string; grupos: GrupoCoop[]; seccao: string; sel: string; aoEscolher: (id: string) => void }) {
  const doGrupo: GrupoCoop[] = [];
  for (let i = 0; i < grupos.length; i++) if (grupos[i].seccao === seccao) doGrupo.push(grupos[i]);
  return (
    <div className="bm-coop-sec">
      <span className="bm-coop-sec-t">{rotulo}</span>
      {doGrupo.map((g) => <BotaoGrupo key={g.id} g={g} ativo={g.id === sel} aoEscolher={aoEscolher} />)}
    </div>
  );
}
function BotaoGrupo({ g, ativo, aoEscolher }: { g: GrupoCoop; ativo: boolean; aoEscolher: (id: string) => void }) {
  return (
    <button type="button" role="tab" aria-selected={ativo} className={ativo ? 'on' : ''} onClick={() => aoEscolher(g.id)}>
      <span>{g.nome}</span><b>{g.lista.length}</b>
    </button>
  );
}

export default function BragaMundo() {
  const admin = useAdmin();
  const feitas = FEIRAS.filter(naoFuturo);
  const principais = separarDistincoes(true);
  const finalistas = separarDistincoes(false);
  const paisesF = paisesComContagem(feitas);
  const grupos = gruposEuropeus();
  const cand = projetosDoGrupo('__cand');
  const nEu = contarTipoProjeto('europeu');
  const pctEs = Math.round((contarEventos(feitas, emEspanha) / Math.max(1, feitas.length)) * 100);
  const nPaises = presencasPorPais().length;
  const CAPS: [string, string][] = [['bm-reconhecimento', t('Distinções', 'Distinctions')], ['bm-anos', t('Síntese anual', 'Annual summary')], ['bm-feiras', t('Feiras', 'Trade fairs')], ['bm-cooperacao', t('Cooperação europeia', 'European cooperation')], ['bm-momentos', t('Registo fotográfico', 'Photo record')]];
  return (
    <div className="bm">
      <style>{CSS}</style>
      <header className="bm-hero">
        <div className="bm-mosaico" aria-hidden="true">
          {MOSAICO.slice(0, 5).map((m) => <div key={m.src} className="bm-mos"><img src={m.src} alt="" /></div>)}
        </div>
        <div className="bm-hero-in">
          <div className="bm-kicker">{t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}</div>
          <h1 className="bm-h1">{t('Internacionalização', 'Internationalisation')}</h1>
          <p className="bm-sub">{t('Participação em feiras de turismo, projetos de cooperação europeia e distinções do destino, de 2023 a 2026.', 'Participation in tourism fairs, European cooperation projects and destination distinctions, from 2023 to 2026.')}</p>
          <div className="bm-nums">
            <div className="bm-num"><div className="bm-num-v"><Contador valor={contarTipos(['vencedora'])} /></div><div className="bm-num-r">{t('títulos internacionais', 'international titles')}</div></div>
            <div className="bm-num"><div className="bm-num-v"><Contador valor={feitas.length} /></div><div className="bm-num-r">{t('participações em feiras', 'trade fair participations')}</div></div>
            <div className="bm-num"><div className="bm-num-v"><Contador valor={nPaises} /></div><div className="bm-num-r">{t('países', 'countries')}</div></div>
            <div className="bm-num"><div className="bm-num-v"><Contador valor={grupos.length} /></div><div className="bm-num-r">{t('projetos europeus', 'EU projects')}</div></div>
          </div>
        </div>
      </header>
      <nav className="bm-abas-wrap" aria-label={t('Secções', 'Sections')}>
        <div className="bm-abas">{CAPS.map(([id, nome]) => <button key={id} type="button" onClick={() => irPara(id)}>{nome}</button>)}</div>
      </nav>

      <div className="bm-corpo">
        <Capitulo id="bm-reconhecimento" kicker="01" titulo={t('Distinções', 'Distinctions')}
          resumo={t(`${contarTipos(['vencedora'])} títulos internacionais, uma certificação de destino sustentável reconhecida pelo GSTC e ${finalistas.length} candidaturas finalistas.`, `${contarTipos(['vencedora'])} international titles, a GSTC-recognised sustainable destination certification and ${finalistas.length} finalist bids.`)}>
          <ul className="bm-dcs">{principais.map((d) => <CartaoDistincao key={d.titulo.pt} d={d} />)}</ul>
          <h3 className="bm-sub-h">{t('Candidaturas finalistas', 'Finalist bids')}</h3>
          <ul className="bm-dcs pequenos">{finalistas.map((d) => <CartaoDistincao key={d.titulo.pt} d={d} pequeno />)}</ul>
          <p className="bm-nota">{t('Só constam distinções confirmadas em fontes públicas, com a ligação para cada uma. Finalistas e nomeações não são apresentados como vitórias, e as distinções de monumentos ou praias estão identificadas como tal.', 'Only distinctions confirmed in public sources are listed, each with its link. Finalists and nominations are not presented as wins, and distinctions of monuments or beaches are labelled as such.')}</p>
        </Capitulo>

        <Capitulo id="bm-anos" kicker="02" titulo={t('Síntese anual', 'Annual summary')} resumo={t('Distinções, feiras e projetos de cada ano. Escolha o ano.', 'Distinctions, fairs and projects for each year. Choose the year.')}>
          <SinteseAnual />
        </Capitulo>

        <Capitulo id="bm-feiras" kicker="03" titulo={t('Feiras', 'Trade fairs')}
          resumo={t(`${feitas.length} participações em feiras de turismo desde 2023, em ${paisesF.length} países. Espanha concentra ${pctEs}% das participações.`, `${feitas.length} tourism fair participations since 2023, in ${paisesF.length} countries. Spain accounts for ${pctEs}% of participations.`)}>
          <BarrasPaises lista={paisesF} />
          <h3 className="bm-sub-h">{t('Presença em cada feira', 'Presence at each fair')}</h3>
          <div className="bm-legenda-pts" aria-hidden="true"><span><i className="ok" />{t('Presente', 'Attended')}</span><span><i className="prev" />{t('Prevista', 'Planned')}</span><span><i className="vazio" />{t('Sem participação', 'No participation')}</span></div>
          <SeriesFeiras />
        </Capitulo>

        <Capitulo id="bm-cooperacao" kicker="04" titulo={t('Cooperação europeia', 'European cooperation')}
          resumo={t(`${grupos.length} projetos europeus, com ${nEu} reuniões, e ${cand.length} candidaturas e processos de certificação.`, `${grupos.length} EU projects, with ${nEu} meetings, and ${cand.length} bids and certification processes.`)}>
          <Cooperacao />
        </Capitulo>

        <Capitulo id="bm-momentos" kicker="05" titulo={t('Registo fotográfico', 'Photo record')} resumo={t('Fotografias das participações em feiras e eventos.', 'Photographs of participations in fairs and events.')}>
          <Galeria admin={admin} semTitulo />
        </Capitulo>
      </div>
    </div>
  );
}

const CSS = `
.bm { color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.bm-hero { position: relative; overflow: hidden; background: #15171B; }
.bm-mosaico { position: absolute; inset: 0; display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 3px; }
.bm-mos { overflow: hidden; } .bm-mos:first-child { grid-row: span 2; }
.bm-mos img { width: 100%; height: 100%; object-fit: cover; display: block; transform: scale(1.04); animation: bmZoom 18s ease-in-out infinite alternate; }
@keyframes bmZoom { to { transform: scale(1.12); } }
.bm-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(21,23,27,.94) 0%, rgba(21,23,27,.78) 45%, rgba(21,23,27,.35) 100%), linear-gradient(0deg, #15171B 0%, rgba(21,23,27,0) 40%); }
.bm-hero-in { position: relative; z-index: 1; }
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
.bm-mapa { height: 340px; border-radius: 14px; overflow: hidden; border: 1px solid #2D3139; margin-bottom: 14px; background: #1C1F24; }
.bm-caps { display: flex; flex-direction: column; gap: 30px; }
.bm-cap-cab { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #2D3139; }
.bm-cap-cab h3 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.bm-cap-cab > span { font-size: 13.5px; color: #A3A8B1; font-weight: 600; }
.bm-cap-band { display: inline-flex; gap: 4px; margin-left: auto; } .bm-cap-band img { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; grid-auto-flow: dense; }
.bm-ev { display: flex; flex-direction: column; border-radius: 14px; background: #1C1F24; border: 1px solid #2D3139; overflow: hidden; }
.bm-ev.com-foto { grid-column: span 2; }
.bm-ev-img { aspect-ratio: 16 / 9; overflow: hidden; background: #22262D; }
.bm-ev-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .6s ease; }
.bm-ev.com-foto:hover .bm-ev-img img { transform: scale(1.04); }
.bm-ev-corpo { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 14px; align-items: start; padding: 12px 14px; }
.bm-ev-admin { display: flex; gap: 6px; margin-top: 8px; }
.bm-ev-admin button { height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #C9CDD3; font: 600 12px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
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
  .bm-hero-in { padding: 36px 16px 22px; } .bm-corpo { padding: 20px 16px 36px; }
  .bm-abas { padding: 8px 16px; flex-wrap: nowrap; overflow-x: auto; gap: 6px; scrollbar-width: none; }
  .bm-abas::-webkit-scrollbar { display: none; }
  .bm-abas button { flex: 0 0 auto; height: 34px; padding: 0 14px; font-size: 13px; }
  .bm-num { padding: 14px; } .bm-num-v { font-size: 30px; }
  .bm-lista, .bm-dist, .bm-trofeus { grid-template-columns: 1fr; } .bm-ev.com-foto { grid-column: auto; }
  .bm-mosaico { grid-template-columns: 1fr 1fr; } .bm-mos:nth-child(n+4) { display: none; } .bm-mapa { height: 240px; } .bm-cap-band { margin-left: 0; }
  .bm-tl { padding-left: 0; } .bm-tl::before { display: none; }
  .bm-tl-marca { position: static; width: auto; flex-direction: row; align-items: baseline; gap: 8px; margin-bottom: 10px; }
  .bm-d-ponto { display: none; }
  .bm-logos img { height: 60px; }
}
.bm-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.bm-ajuda { margin: -6px 0 12px; font-size: 13.5px; color: #A3A8B1; }
.bm-duo { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; margin-bottom: 26px; }
.bm-duo .bm-paises { flex-direction: column; flex-wrap: nowrap; }
.bm-duo .bm-paises li { justify-content: space-between; border-radius: 10px; } .bm-duo .bm-paises li span { flex: 1; }
.bm-mat-wrap { margin-bottom: 30px; border-radius: 14px; border: 1px solid #2D3139; overflow: hidden; }
.bm-mat, .bm-acoes { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.bm-mat th, .bm-mat td, .bm-acoes th, .bm-acoes td { padding: 11px 12px; border-bottom: 1px solid #2D3139; text-align: left; vertical-align: top; }
.bm-mat thead th, .bm-acoes thead th { background: #22262D; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #A3A8B1; }
.bm-mat thead th:not(:first-child) { text-align: center; }
.bm-mat tbody tr:nth-child(odd), .bm-acoes tbody tr:nth-child(odd) { background: #1C1F24; }
.bm-mat tbody th { font-weight: 700; min-width: 210px; }
.bm-mat-nome { display: flex; align-items: center; gap: 8px; font-size: 14px; } .bm-mat-nome img, .bm-acoes img { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; margin-right: 6px; vertical-align: -2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-mat-sub { display: block; font-size: 12px; color: #A3A8B1; font-weight: 500; margin-top: 3px; padding-left: 28px; }
.bm-mat td { text-align: center; white-space: nowrap; }
.bm-mat td.feita .bm-mat-d { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(138,176,230,.16); color: #ECEDEF; font-weight: 600; font-size: 12.5px; }
.bm-mat td.prevista .bm-mat-d { display: inline-block; padding: 3px 9px; border-radius: 999px; border: 1px dashed #EDA06B; color: #EDA06B; font-weight: 600; font-size: 12.5px; }
.bm-mat td.vazia { color: #4A505B; }
.bm-mat-c, .bm-mat-p { display: block; font-size: 11px; color: #A3A8B1; margin-top: 3px; } .bm-mat-p { color: #EDA06B; }
.bm-grps { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; margin-bottom: 28px; }
.bm-grp { padding: 16px 18px; border-radius: 14px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-grp header { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.bm-grp h3 { margin: 0; font-size: 16.5px; } .bm-grp header span { font-size: 12.5px; color: #A3A8B1; font-weight: 600; }
.bm-grp-l { list-style: none; margin: 0; padding: 0 0 0 14px; border-left: 2px solid #3A404B; display: flex; flex-direction: column; gap: 10px; }
.bm-grp-l li { position: relative; display: grid; grid-template-columns: 1fr; gap: 2px; }
.bm-grp-l li::before { content: ''; position: absolute; left: -20px; top: 5px; width: 10px; height: 10px; border-radius: 999px; background: #8AB0E6; box-shadow: 0 0 0 3px #1C1F24; }
.bm-grp-l li.prevista::before { background: transparent; border: 2px dashed #EDA06B; width: 6px; height: 6px; }
.bm-grp-d { font-size: 12px; color: #A3A8B1; font-weight: 600; } .bm-grp-n { font-size: 14px; font-weight: 600; line-height: 1.35; }
.bm-grp-c { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #C9CDD3; } .bm-grp-c img { width: 16px; height: 11px; object-fit: cover; border-radius: 2px; }
.bm-acoes tbody tr.prevista td { color: #EDA06B; }
.bm-acoes-n { font-weight: 600; } .bm-acoes-n .bm-tag { margin-left: 8px; }
.bm-gal { margin-top: 10px; }
.bm-gal-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.bm-gal-add { height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #C9CDD3; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.bm-gal-faixa { list-style: none; margin: 0; padding: 2px 0 10px; display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: #3A404B transparent; }
.bm-gal-it { position: relative; flex: 0 0 auto; width: clamp(240px, 30vw, 380px); aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; scroll-snap-align: start; background: #22262D; }
.bm-gal-it img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bm-gal-leg { position: absolute; left: 0; right: 0; bottom: 0; padding: 26px 12px 10px; font-size: 13px; font-weight: 600; background: linear-gradient(0deg, rgba(10,11,13,.85), rgba(10,11,13,0)); }
.bm-gal-x { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 999px; border: 0; background: rgba(10,11,13,.75); color: #fff; font-size: 18px; cursor: pointer; }
@media (max-width: 900px) { .bm-duo { grid-template-columns: 1fr; } .bm-duo .bm-paises { flex-direction: row; flex-wrap: wrap; } }
@media (max-width: 760px) {
  .bm-mat-wrap { border: 0; border-radius: 0; overflow: visible; }
  .bm-mat thead, .bm-acoes thead { display: none; }
  .bm-mat, .bm-mat tbody, .bm-acoes, .bm-acoes tbody { display: block; }
  .bm-mat tr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 12px; margin-bottom: 10px; border-radius: 12px; background: #1C1F24 !important; border: 1px solid #2D3139; }
  .bm-mat tbody th { grid-column: 1 / -1; min-width: 0; border: 0; padding: 0 0 6px; }
  .bm-mat td { border: 0; padding: 6px 4px; border-radius: 8px; background: #22262D; white-space: normal; }
  .bm-mat td::before { content: attr(data-l); display: block; font-size: 11px; font-weight: 700; color: #A3A8B1; margin-bottom: 4px; }
  .bm-mat td.vazia { opacity: .55; }
  .bm-acoes tr { display: block; padding: 12px; margin-bottom: 10px; border-radius: 12px; background: #1C1F24 !important; border: 1px solid #2D3139; }
  .bm-acoes td { display: block; border: 0; padding: 3px 0; }
  .bm-acoes td::before { content: attr(data-l); display: block; font-size: 11px; font-weight: 700; color: #A3A8B1; }
  .bm-grps { grid-template-columns: 1fr; }
  .bm-gal-it { width: 78vw; }
}
.bm-capt { padding: 34px 0 10px; opacity: 0; transform: translateY(26px); transition: opacity .7s ease, transform .7s ease; scroll-margin-top: 70px; }
.bm-capt.in { opacity: 1; transform: none; }
.bm-capt + .bm-capt { border-top: 1px solid #2D3139; margin-top: 18px; }
.bm-capt-cab h2 { font-size: clamp(26px, 3.4vw, 38px); letter-spacing: -0.02em; margin: 6px 0 8px; }
.bm-resumo { margin: 0 0 20px; font-size: 17px; line-height: 1.55; color: #C9CDD3; max-width: 820px; }
.bm-h3 { font-size: 18px; margin: 8px 0 8px; }
.bm-abas button { background: transparent; }
.bm-abas button:hover { border-color: #8AB0E6; color: #ECEDEF; background: rgba(138,176,230,.12); }
.bm-trofeus { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 2px 12px; scrollbar-width: thin; scrollbar-color: #3A404B transparent; }
.bm-trofeus .bm-trofeu { flex: 0 0 300px; scroll-snap-align: start; position: relative; overflow: hidden; transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
.bm-trofeus .bm-trofeu::after { content: ''; position: absolute; inset: -40% auto -40% -60%; width: 40%; transform: rotate(18deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent); animation: bmBrilho 6s ease-in-out infinite; }
.bm-trofeus .bm-trofeu:hover { transform: translateY(-3px); border-color: rgba(233,196,106,.6); box-shadow: 0 14px 32px -16px rgba(233,196,106,.5); }
@keyframes bmBrilho { 0%, 60% { left: -60%; } 100% { left: 130%; } }
.bm-mais { margin-top: 6px; border: 1px solid #2D3139; border-radius: 14px; background: #1A1D22; }
.bm-mais > summary { cursor: pointer; list-style: none; padding: 14px 18px; font-weight: 700; font-size: 14.5px; color: #8AB0E6; display: flex; align-items: center; gap: 10px; }
.bm-mais > summary::-webkit-details-marker { display: none; }
.bm-mais > summary::before { content: '+'; display: inline-flex; width: 22px; height: 22px; border-radius: 999px; align-items: center; justify-content: center; border: 1px solid #8AB0E6; font-size: 15px; }
.bm-mais[open] > summary::before { content: '−'; }
.bm-mais[open] > *:not(summary) { margin-left: 18px; margin-right: 18px; }
.bm-mais[open] { padding-bottom: 14px; }
.bm-duo .bm-mapa { margin: 0; height: 100%; min-height: 340px; }
.bm-pulso { animation: bmPulso 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
@keyframes bmPulso { 0%, 100% { stroke-opacity: 1; stroke-width: 2; } 50% { stroke-opacity: .35; stroke-width: 9; } }
.bm-grp { transition: transform .25s ease, border-color .25s ease; } .bm-grp:hover { transform: translateY(-2px); border-color: #3A404B; }
.bm-num { transition: transform .3s ease; } .bm-num:hover { transform: translateY(-2px); }
.bm-capt-cab { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 18px; align-items: start; margin-bottom: 18px; }
.bm-capt-n { font-size: 15px; font-weight: 800; color: #8AB0E6; padding: 6px 10px; border: 1px solid rgba(138,176,230,.4); border-radius: 10px; line-height: 1; margin-top: 8px; font-variant-numeric: tabular-nums; }
.bm-capt-cab h2 { margin-top: 0; }
.bm-resumo { font-size: 15.5px; margin-bottom: 0; }
.bm-anos { list-style: none; margin: 0; padding: 4px 2px 14px; display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; scrollbar-color: #3A404B transparent; }
.bm-ano-p { flex: 0 0 300px; scroll-snap-align: start; border-radius: 16px; overflow: hidden; background: #1C1F24; border: 1px solid #2D3139; display: flex; flex-direction: column; transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
.bm-ano-p:hover { transform: translateY(-4px); border-color: #3A404B; box-shadow: 0 18px 40px -22px rgba(0,0,0,.9); }
.bm-ano-capa { position: relative; height: 150px; overflow: hidden; background: linear-gradient(135deg, #22324A, #1C2433); }
.bm-ano-capa img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .8s ease; }
.bm-ano-p:hover .bm-ano-capa img { transform: scale(1.05); }
.bm-ano-capa::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(15,17,20,.85) 0%, rgba(15,17,20,0) 60%); }
.bm-ano-tipo { position: absolute; right: -6px; bottom: -22px; font-size: 120px; font-weight: 800; letter-spacing: -0.05em; color: rgba(138,176,230,.14); line-height: 1; }
.bm-ano-n { position: absolute; left: 16px; bottom: 12px; z-index: 1; font-size: 32px; font-weight: 800; letter-spacing: -0.03em; }
.bm-ano-dl { margin: 0; padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
.bm-ano-dl dt { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8A909B; margin-bottom: 3px; }
.bm-ano-dl dd { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; }
.bm-ano-dl ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.bm-ano-dl ul li { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; }
.bm-ano-dl ul li i { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; transform: translateY(-1px); }
.bm-ano-nada { color: #4A505B; } .bm-ano-prev { display: block; font-size: 12px; font-weight: 600; color: #EDA06B; margin-top: 2px; }
.bm-barras { list-style: none; margin: 0 0 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; border-radius: 16px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-barras li { display: grid; grid-template-columns: 190px minmax(0, 1fr) 40px; gap: 14px; align-items: center; }
.bm-barras-n { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 600; }
.bm-barras-n img { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-barras-t { height: 10px; border-radius: 999px; background: #262A31; overflow: hidden; }
.bm-barras-t span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5E86C2, #8AB0E6); transform-origin: left; animation: bmCresce 1s ease both; }
@keyframes bmCresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.bm-barras b { text-align: right; font-size: 15px; font-variant-numeric: tabular-nums; }
.bm-selos { list-style: none; margin: 0 0 16px; padding: 26px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; border-radius: 16px; background: #F4F4F2; }
.bm-selos li { display: flex; align-items: center; justify-content: center; height: 120px; padding: 10px; border-radius: 12px; background: #fff; box-shadow: 0 1px 0 rgba(0,0,0,.04), 0 6px 18px -12px rgba(0,0,0,.25); transition: transform .3s ease; }
.bm-selos li:hover { transform: translateY(-3px); }
.bm-selos img { max-width: 100%; max-height: 100%; object-fit: contain; }
@media (max-width: 760px) {
  .bm-ano-p { flex-basis: 84%; } .bm-barras li { grid-template-columns: minmax(0, 1fr) 70px 32px; gap: 8px; } .bm-barras { padding: 14px; }
  .bm-capt-cab { grid-template-columns: 1fr; gap: 8px; } .bm-capt-n { justify-self: start; margin-top: 0; }
  .bm-selos { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px; } .bm-selos li { height: 96px; }
}
.bm-corpo { position: relative; }
.bm-corpo::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 900px; pointer-events: none; background: radial-gradient(700px 360px at 85% 0%, rgba(233,196,106,.07), transparent 70%), radial-gradient(600px 400px at 0% 40%, rgba(138,176,230,.06), transparent 70%); }
.bm-sub-h { font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #8A909B; margin: 26px 0 12px; }
.bm-dcs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.bm-dc { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 20px 20px 16px; border-radius: 18px; background: linear-gradient(180deg, #20242B, #1A1D22); border: 1px solid #2D3139; overflow: hidden; transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
.bm-dc::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, #8AB0E6, transparent); }
.bm-dc-vencedora::before { background: linear-gradient(90deg, #E9C46A, #F6E3A6 40%, transparent); }
.bm-dc-vencedora { border-color: rgba(233,196,106,.35); }
.bm-dc-certificacao::before { background: linear-gradient(90deg, #7CC79A, transparent); }
.bm-dc:hover { transform: translateY(-4px); box-shadow: 0 22px 44px -24px rgba(0,0,0,.9); }
.bm-dc-vencedora:hover { box-shadow: 0 22px 44px -22px rgba(233,196,106,.35); }
.bm-dc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.bm-dc-ano { font-size: 40px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; background: linear-gradient(180deg, #FFFFFF, #A3A8B1); -webkit-background-clip: text; background-clip: text; color: transparent; }
.bm-dc-vencedora .bm-dc-ano { background: linear-gradient(180deg, #F6E3A6, #C9A042); -webkit-background-clip: text; background-clip: text; }
.bm-dc-logo { width: 62px; height: 62px; border-radius: 14px; background: rgba(255,255,255,.95); display: flex; align-items: center; justify-content: center; padding: 6px; flex-shrink: 0; box-shadow: 0 6px 16px -8px rgba(0,0,0,.6); }
.bm-dc-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.bm-dc-tipo { font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin-top: 6px; }
.bm-dc-t { margin: 0; font-size: 17px; line-height: 1.3; letter-spacing: -0.01em; }
.bm-dc-x { margin: 2px 0 0; font-size: 13.5px; color: #A3A8B1; line-height: 1.55; flex: 1; }
.bm-dc-pe { display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #2D3139; font-size: 12.5px; color: #8A909B; }
.bm-dc-pe a { color: #8AB0E6; text-decoration: none; font-weight: 600; } .bm-dc-pe a:hover { text-decoration: underline; }
.bm-dcs.pequenos { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.bm-dc.pequeno { padding: 14px 16px 12px; border-radius: 14px; } .bm-dc.pequeno .bm-dc-ano { font-size: 24px; } .bm-dc.pequeno .bm-dc-t { font-size: 14.5px; } .bm-dc.pequeno .bm-dc-x { font-size: 12.5px; }
.bm-sa-anos { display: inline-flex; gap: 4px; padding: 5px; border-radius: 999px; background: #1C1F24; border: 1px solid #2D3139; margin-bottom: 16px; flex-wrap: wrap; }
.bm-sa-anos button { height: 38px; padding: 0 20px; border-radius: 999px; border: 0; background: transparent; color: #A3A8B1; font: 700 14.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; font-variant-numeric: tabular-nums; transition: background .25s ease, color .25s ease; }
.bm-sa-anos button:hover { color: #ECEDEF; } .bm-sa-anos button.on { background: #8AB0E6; color: #0F1216; }
.bm-sa-painel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); border-radius: 18px; overflow: hidden; border: 1px solid #2D3139; background: #1C1F24; animation: bmTroca .45s ease both; }
@keyframes bmTroca { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.bm-sa-capa { position: relative; min-height: 260px; background: radial-gradient(circle at 30% 30%, #2A3A55, #171B22 70%); overflow: hidden; }
.bm-sa-capa img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bm-sa-capa::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(14,16,19,.85), rgba(14,16,19,0) 55%); }
.bm-sa-tipo { position: absolute; right: -10px; bottom: -40px; font-size: 200px; font-weight: 800; letter-spacing: -0.06em; color: rgba(138,176,230,.12); line-height: 1; }
.bm-sa-capa-t { position: absolute; left: 22px; bottom: 18px; z-index: 1; display: flex; align-items: baseline; gap: 10px; }
.bm-sa-capa-t span { font-size: 54px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.bm-sa-capa-t em { font-style: normal; font-size: 12px; font-weight: 700; color: #EDA06B; border: 1px solid #EDA06B; border-radius: 999px; padding: 2px 9px; }
.bm-sa-info { padding: 22px 24px; }
.bm-sa-nums { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
.bm-sa-nums div { padding: 12px 14px; border-radius: 12px; background: #22262D; }
.bm-sa-nums b { display: block; font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.bm-sa-nums span { font-size: 12.5px; color: #A3A8B1; line-height: 1.35; }
.bm-sa-h { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #8A909B; margin: 0 0 10px; }
.bm-sa-h span { font-size: 11px; padding: 1px 8px; border-radius: 999px; background: #2D3139; color: #ECEDEF; letter-spacing: 0; }
.bm-sa-dist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.bm-sa-dist li { display: grid; grid-template-columns: 10px minmax(0, 1fr) auto; gap: 10px; align-items: baseline; font-size: 14px; font-weight: 600; }
.bm-sa-dist li i { width: 10px; height: 10px; border-radius: 999px; transform: translateY(1px); }
.bm-sa-dist li em { font-style: normal; font-size: 11.5px; color: #8A909B; font-weight: 600; white-space: nowrap; }
.bm-sa-vazio { margin: 0; color: #6F747D; font-size: 13.5px; }
.bm-sa-listas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 14px; animation: bmTroca .45s .05s ease both; }
.bm-sa-listas > div { padding: 18px 20px; border-radius: 18px; background: #1C1F24; border: 1px solid #2D3139; }
.bm-le-l-ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.bm-le { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 4px 12px; padding: 10px 0; border-top: 1px solid #262A31; }
.bm-le:first-child { border-top: 0; }
.bm-le-d { grid-row: span 2; font-size: 12.5px; font-weight: 700; color: #8AB0E6; font-variant-numeric: tabular-nums; padding-top: 1px; }
.bm-le-n { font-size: 14px; font-weight: 600; line-height: 1.35; }
.bm-le-n em { display: inline-block; margin-left: 8px; font-style: normal; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: #22262D; color: #A3A8B1; vertical-align: 1px; }
.bm-le-l { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #A3A8B1; }
.bm-le-l img { width: 18px; height: 13px; object-fit: cover; border-radius: 2px; }
.bm-le-p { grid-column: 2; justify-self: start; font-size: 11px; font-weight: 700; color: #EDA06B; }
.bm-le.prevista .bm-le-d { color: #EDA06B; }
.bm-legenda-pts { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12.5px; color: #A3A8B1; margin: -4px 0 12px; }
.bm-legenda-pts span { display: inline-flex; align-items: center; gap: 6px; }
.bm-legenda-pts i, .bm-pt i { width: 12px; height: 12px; border-radius: 999px; display: inline-block; }
.bm-pt.ok i, .bm-legenda-pts i.ok { background: #8AB0E6; box-shadow: 0 0 0 3px rgba(138,176,230,.18); }
.bm-pt.prev i, .bm-legenda-pts i.prev { border: 2px dashed #EDA06B; width: 8px; height: 8px; }
.bm-pt.vazio i, .bm-legenda-pts i.vazio { background: #2D3139; }
.bm-series { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.bm-serie { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 16px; background: #1C1F24; border: 1px solid #2D3139; transition: transform .25s ease, border-color .25s ease; }
.bm-serie:hover { transform: translateY(-3px); border-color: #3A404B; }
.bm-serie-cab { display: flex; align-items: center; gap: 9px; } .bm-serie-cab strong { font-size: 15.5px; }
.bm-serie-cab img { width: 22px; height: 15px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-serie-l { font-size: 12.5px; color: #A3A8B1; }
.bm-serie-pts { display: flex; gap: 12px; margin-top: 6px; }
.bm-pt { display: flex; flex-direction: column; align-items: center; gap: 4px; } .bm-pt small { font-size: 10.5px; font-weight: 700; color: #8A909B; }
.bm-serie-n { margin-top: 4px; font-size: 12.5px; font-weight: 700; color: #C9CDD3; }
@media (max-width: 900px) { .bm-sa-painel { grid-template-columns: 1fr; } .bm-sa-capa { min-height: 180px; } .bm-sa-listas { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .bm-sa-dist li { grid-template-columns: 10px minmax(0, 1fr); row-gap: 2px; } .bm-sa-dist li em { grid-column: 2; white-space: normal; } .bm-sa-anos { display: flex; flex-wrap: nowrap; overflow-x: auto; } .bm-sa-anos button { flex: 0 0 auto; padding: 0 16px; } .bm-sa-nums b { font-size: 24px; } .bm-dc-ano { font-size: 32px; } .bm-le { grid-template-columns: 82px minmax(0, 1fr); } }
.bm-hero::after { background: linear-gradient(90deg, rgba(16,19,26,.92) 0%, rgba(16,19,26,.7) 38%, rgba(16,19,26,.15) 75%, rgba(16,19,26,0) 100%), linear-gradient(0deg, #15171B 0%, rgba(21,23,27,0) 35%) !important; }
.bm-hero::before { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; z-index: 2; background: linear-gradient(90deg, #E2231A 0%, #E2231A 22%, #8AB0E6 22%, #8AB0E6 60%, #E9C46A 60%, #E9C46A 78%, #7CC79A 78%); }
.bm-mos img { filter: saturate(1.15) contrast(1.05); }
.bm-kicker { color: #FF8A80; }
.bm-h1 { background: linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 55%, #C8DAF5 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.bm-num { position: relative; overflow: hidden; background: rgba(16,19,26,.6); border-color: rgba(255,255,255,.14); }
.bm-num::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.bm-num:nth-child(1)::before { background: #E9C46A; } .bm-num:nth-child(2)::before { background: #E2231A; } .bm-num:nth-child(3)::before { background: #8AB0E6; } .bm-num:nth-child(4)::before { background: #7CC79A; }
.bm-num:nth-child(1) .bm-num-v { color: #F6E3A6; } .bm-num:nth-child(2) .bm-num-v { color: #FF9C94; } .bm-num:nth-child(3) .bm-num-v { color: #B9D0F2; } .bm-num:nth-child(4) .bm-num-v { color: #A8DDBC; }

.bm-dcs { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important; gap: 12px !important; }
.bm-dc { padding: 14px 16px 12px !important; border-radius: 14px !important; gap: 4px !important; }
.bm-dc-ano { font-size: 26px !important; }
.bm-dc-logo { width: 44px !important; height: 44px !important; border-radius: 10px !important; padding: 4px !important; }
.bm-dc-tipo { font-size: 10.5px !important; margin-top: 4px !important; }
.bm-dc-t { font-size: 14.5px !important; }
.bm-dc-x { font-size: 12.5px !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.bm-dc-pe { margin-top: 6px !important; padding-top: 8px !important; font-size: 11.5px !important; }
.bm-dc.pequeno .bm-dc-ano { font-size: 20px !important; } .bm-dc.pequeno .bm-dc-t { font-size: 13.5px !important; }

.bm-coop { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; align-items: start; }
.bm-coop-lista { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 80px; }
.bm-coop-sec { display: flex; flex-direction: column; gap: 4px; }
.bm-coop-sec-t { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #8A909B; padding: 0 4px 4px; }
.bm-coop-lista button { display: flex; justify-content: space-between; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: #C9CDD3; font: 600 14px 'Public Sans', system-ui, sans-serif; text-align: left; cursor: pointer; transition: background .2s ease, border-color .2s ease, color .2s ease; }
.bm-coop-lista button b { font-size: 12px; min-width: 26px; text-align: center; padding: 2px 8px; border-radius: 999px; background: #22262D; color: #ECEDEF; }
.bm-coop-lista button:hover { background: #1C1F24; color: #ECEDEF; }
.bm-coop-lista button.on { background: linear-gradient(90deg, rgba(138,176,230,.18), rgba(138,176,230,.04)); border-color: rgba(138,176,230,.45); color: #ECEDEF; }
.bm-coop-lista button.on b { background: #8AB0E6; color: #0F1216; }
.bm-coop-det { padding: 22px 24px; border-radius: 18px; background: linear-gradient(180deg, #20242B, #1A1D22); border: 1px solid #2D3139; animation: bmTroca .4s ease both; min-height: 320px; }
.bm-coop-cab { padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid #2D3139; }
.bm-coop-cab h3 { margin: 0 0 8px; font-size: 22px; letter-spacing: -0.01em; }
.bm-coop-meta { display: flex; gap: 18px; flex-wrap: wrap; align-items: center; font-size: 13px; color: #A3A8B1; }
.bm-coop-meta b { color: #ECEDEF; font-size: 15px; }
.bm-coop-band { display: inline-flex; gap: 5px; } .bm-coop-band img { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
.bm-coop-tl { list-style: none; margin: 0; padding: 0 0 0 22px; position: relative; display: flex; flex-direction: column; gap: 16px; }
.bm-coop-tl::before { content: ''; position: absolute; left: 6px; top: 6px; bottom: 6px; width: 2px; background: linear-gradient(#8AB0E6, #2D3139); border-radius: 2px; }
.bm-coop-tl li { position: relative; display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 2px 16px; }
.bm-coop-tl li::before { content: ''; position: absolute; left: -21px; top: 4px; width: 12px; height: 12px; border-radius: 999px; background: #8AB0E6; box-shadow: 0 0 0 4px #1D2026; }
.bm-coop-tl li.prevista::before { background: #1D2026; border: 2px dashed #EDA06B; width: 8px; height: 8px; }
.bm-coop-d { grid-row: span 2; font-size: 13px; font-weight: 700; color: #8AB0E6; font-variant-numeric: tabular-nums; }
.bm-coop-tl li.prevista .bm-coop-d { color: #EDA06B; }
.bm-coop-n { font-size: 15px; font-weight: 700; line-height: 1.35; }
.bm-coop-l { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #A3A8B1; flex-wrap: wrap; }
.bm-coop-l img { width: 18px; height: 13px; object-fit: cover; border-radius: 2px; }
.bm-coop-l em { font-style: normal; font-size: 11px; font-weight: 700; color: #EDA06B; border: 1px solid #EDA06B; border-radius: 999px; padding: 0 7px; }
@media (max-width: 900px) {
  .bm-coop { grid-template-columns: 1fr; }
  .bm-coop-lista { position: static; flex-direction: row; overflow-x: auto; gap: 6px; scrollbar-width: none; }
  .bm-coop-lista::-webkit-scrollbar { display: none; }
  .bm-coop-sec { flex-direction: row; gap: 6px; } .bm-coop-sec-t { display: none; }
  .bm-coop-lista button { width: auto; flex: 0 0 auto; border-color: #2D3139; white-space: nowrap; }
  .bm-coop-tl li { grid-template-columns: 1fr; } .bm-coop-d { grid-row: auto; }
}
@media (prefers-reduced-motion: reduce) { .bm-coop-det { animation: none !important; } .bm-sa-painel, .bm-sa-listas { animation: none !important; } .bm-barras-t span { animation: none !important; } .bm-capt { opacity: 1; transform: none; } .bm * { transition: none !important; animation: none !important; } }
.bm .leaflet-container { background: #1C1F24; font-family: 'Public Sans', system-ui, sans-serif; }
.bm .leaflet-control-attribution { background: rgba(21,23,27,.7) !important; color: #8A909B !important; }
.bm .leaflet-control-attribution a { color: #A3A8B1 !important; }
`;
