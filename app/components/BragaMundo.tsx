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

function Galeria({ admin }: { admin: boolean }) {
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
      setEnviados([{ id: ref.id, src: img, legenda, criado }].concat(enviados));
    } catch { alert(t('Não foi possível guardar a fotografia.', 'Could not save the photo.')); }
    finally { setAGravar(false); if (entrada.current) entrada.current.value = ''; }
  };
  const remover = async (m: Momento) => {
    if (!m.id || !confirm(t('Remover esta fotografia?', 'Remove this photo?'))) return;
    try { await deleteDoc(doc(db, 'internacionalGaleria', m.id)); setEnviados(semMomento(enviados, m.id)); }
    catch { alert(t('Não foi possível remover a fotografia.', 'Could not remove the photo.')); }
  };
  const todos: Momento[] = enviados.concat(MOSAICO);
  return (
    <section className="bm-gal" aria-labelledby="bm-gal-t">
      <div className="bm-gal-cab">
        <h2 id="bm-gal-t" className="bm-h2">{t('Momentos', 'Moments')}</h2>
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

// ── Mapa-múndi (Leaflet, carregado só aqui) ──
const CENTROS: Record<string, [number, number]> = { es: [40.2, -3.7], pt: [39.6, -8.1], fr: [46.6, 2.4], be: [50.6, 4.6], de: [51.2, 10.4], ch: [46.8, 8.2], nl: [52.2, 5.3], si: [46.1, 14.9], ro: [45.9, 24.9], pl: [52.1, 19.4], us: [38.5, -92.0], ie: [53.3, -7.8], gb: [52.5, -1.5], it: [42.8, 12.6] };
function carregarLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  return new Promise((ok, falha) => {
    const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.async = true;
    sc.onload = () => ok(w.L); sc.onerror = () => falha(new Error('leaflet')); document.head.appendChild(sc);
  });
}
function presencasPorPais(): [string, number][] {
  const lista: Evento[] = [];
  for (let i = 0; i < FEIRAS.length; i++) if (!futuro(FEIRAS[i])) lista.push(FEIRAS[i]);
  for (let i = 0; i < PROJETOS.length; i++) if (!futuro(PROJETOS[i])) lista.push(PROJETOS[i]);
  return paisesComContagem(lista);
}
function MapaPresenca() {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: any = null; let ativo = true;
    carregarLeaflet().then((L) => {
      if (!ativo || !caixa.current) return;
      mapa = L.map(caixa.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, worldCopyJump: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap © CARTO', maxZoom: 8 }).addTo(mapa);
      const pres = presencasPorPais(); const pontos: [number, number][] = [];
      for (let i = 0; i < pres.length; i++) {
        const c = CENTROS[pres[i][0]]; if (!c) continue; pontos.push(c);
        L.circleMarker(c, { radius: Math.max(7, Math.min(26, 5 + Math.sqrt(pres[i][1]) * 4)), color: '#8AB0E6', weight: 2, fillColor: '#8AB0E6', fillOpacity: 0.35 })
          .bindTooltip(`${nomePais(pres[i][0])} · ${pres[i][1]}`, { direction: 'top' }).addTo(mapa);
      }
      L.circleMarker([41.5503, -8.4201], { radius: 6, color: '#ECEDEF', weight: 2, fillColor: '#EF4135', fillOpacity: 1 }).bindTooltip('Braga', { permanent: false }).addTo(mapa);
      if (pontos.length) mapa.fitBounds(pontos, { padding: [30, 30], maxZoom: 4 });
    }).catch(() => { /* sem mapa: a lista de países abaixo mostra a mesma informação */ });
    return () => { ativo = false; if (mapa) mapa.remove(); };
  }, []);
  return <div ref={caixa} className="bm-mapa" role="img" aria-label={t('Mapa dos países com presença de Braga', 'Map of the countries where Braga was present')} />;
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
  if (!lista || !lista.length) return <td data-l={ano} className="vazia"><span aria-label={t('sem participação', 'no participation')}>—</span></td>;
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

function GrupoProjeto({ nome, lista }: { nome: string; lista: Evento[] }) {
  return (
    <article className="bm-grp">
      <header>
        <h3>{nome === 'POST' || nome === 'SCT-HUB' || nome === 'IURC' ? `${t('Projeto', 'Project')} ${nome}` : nome}</h3>
        <span>{lista.length} {lista.length === 1 ? t('reunião', 'meeting') : t('reuniões', 'meetings')} · {anosTexto(lista)}</span>
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

export default function BragaMundo() {
  const admin = useAdmin();
  const [aba, setAba] = useState<Aba>('distincoes');
  const feitas = FEIRAS.filter(naoFuturo);
  const logos = todosOsLogos();
  const topo = destaques();
  const anosD = Array.from(new Set(DISTINCOES.map(anoDaDistincao))).sort(decrescente);
  const pres = presencasPorPais();
  const grupos = gruposEuropeus();
  const cand = projetosDoGrupo('__cand');
  const outras = projetosDoGrupo('__outras').sort(porDataDesc);
  const ABAS: [Aba, string][] = [['distincoes', t('Distinções', 'Distinctions')], ['feiras', t('Feiras', 'Trade fairs')], ['projetos', t('Projetos e cooperação', 'Projects and cooperation')]];
  return (
    <div className="bm">
      <style>{CSS}</style>
      <header className="bm-hero">
        <div className="bm-mosaico" aria-hidden="true">
          {MOSAICO.slice(0, 5).map((m) => <div key={m.src} className="bm-mos"><img src={m.src} alt="" /></div>)}
        </div>
        <div className="bm-hero-in">
          <div className="bm-kicker">{t('Promoção, cooperação e reconhecimento', 'Promotion, cooperation and recognition')}</div>
          <h1 className="bm-h1">{t('Internacionalização', 'Internationalisation')}</h1>
          <p className="bm-sub">{t('Como Braga se afirma lá fora: as distinções do destino, as feiras onde se promove e os projetos de cooperação europeia, desde 2023.', 'How Braga makes its mark abroad: the destination’s distinctions, the trade fairs where it promotes itself and its European cooperation projects, since 2023.')}</p>
          <div className="bm-nums">
            <Indicador valor={contarTipos(['vencedora'])} rotulo={t('títulos internacionais ganhos', 'international titles won')} />
            <Indicador valor={feitas.length} rotulo={t('feiras de turismo desde 2023', 'tourism fairs since 2023')} />
            <Indicador valor={pres.length} rotulo={t('países com presença de Braga', 'countries where Braga was present')} />
            <Indicador valor={contarTipoProjeto('europeu')} rotulo={t('reuniões de projetos europeus', 'EU project meetings')} />
          </div>
        </div>
      </header>
      <div className="bm-abas-wrap">
        <div className="bm-abas" role="tablist" aria-label={t('Secções', 'Sections')}>
          {ABAS.map(([id, nome]) => <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? 'on' : ''} onClick={() => setAba(id)}>{nome}</button>)}
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
          {logos.length > 0 && <ul className="bm-logos" aria-label={t('Selos e logótipos das distinções', 'Distinction seals and logos')}>{logos.map((l) => <li key={l.src}><img src={l.src} alt={l.alt} loading="lazy" /></li>)}</ul>}
          <h2 className="bm-h2">{t('Percurso completo', 'Full record')}</h2>
          <div className="bm-legenda" aria-hidden="true">{(Object.keys(ROTULO) as TipoDistincao[]).map((k) => <span key={k}><i style={{ background: COR[k] }} />{L(ROTULO[k])}</span>)}</div>
          <div className="bm-tl">
            {anosD.map((ano) => (
              <section key={ano} className="bm-tl-ano" aria-labelledby={`bm-d-${ano}`}>
                <h3 id={`bm-d-${ano}`} className="bm-tl-marca"><span>{ano}</span></h3>
                <ul className="bm-dist">
                  {distincoesDoAno(ano).map((d) => (
                    <li key={d.titulo.pt} className="bm-d">
                      <i className="bm-d-ponto" style={{ background: COR[d.tipo] }} aria-hidden="true" />
                      <div className="bm-d-top"><span className="bm-d-tipo" style={{ color: COR[d.tipo], borderColor: `${COR[d.tipo]}66` }}>{L(ROTULO[d.tipo])}</span><span className="bm-d-ent">{d.entidade}</span></div>
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
          <div className="bm-duo">
            <div>
              <h2 className="bm-h2">{t('Onde estivemos', 'Where we have been')}</h2>
              <MapaPresenca />
            </div>
            <div>
              <h2 className="bm-h2">{t('Feiras por país', 'Fairs by country')}</h2>
              <ul className="bm-paises">{paisesComContagem(feitas).map((p) => <li key={p[0]}><img src={`https://flagcdn.com/${p[0]}.svg`} alt="" width={26} height={18} loading="lazy" /><span>{nomePais(p[0])}</span><b>{p[1]}</b></li>)}</ul>
            </div>
          </div>
          <h2 className="bm-h2">{t('Presença ano a ano', 'Year by year')}</h2>
          <p className="bm-ajuda">{t('Cada linha é uma feira; cada coluna, um ano. As feiras que se repetem aparecem primeiro.', 'Each row is a fair; each column, a year. Recurring fairs come first.')}</p>
          <MatrizFeiras />
          <Galeria admin={admin} />
        </div>
      )}

      {aba === 'projetos' && (
        <div className="bm-corpo">
          <h2 className="bm-h2">{t('Projetos europeus', 'EU projects')}</h2>
          <div className="bm-grps">{grupos.map((g) => <GrupoProjeto key={g} nome={g} lista={projetosDoGrupo(g)} />)}</div>
          <h2 className="bm-h2">{t('Candidaturas, prémios e certificação', 'Bids, awards and certification')}</h2>
          <div className="bm-grps"><GrupoProjeto nome={t('Candidaturas, prémios e certificação', 'Bids, awards and certification')} lista={cand} /></div>
          <h2 className="bm-h2">{t('Outras ações', 'Other actions')}</h2>
          <TabelaAcoes lista={outras} />
          <Galeria admin={admin} />
        </div>
      )}
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
@media (prefers-reduced-motion: reduce) { .bm * { transition: none !important; animation: none !important; } }
.bm .leaflet-container { background: #1C1F24; font-family: 'Public Sans', system-ui, sans-serif; }
.bm .leaflet-control-attribution { background: rgba(21,23,27,.7) !important; color: #8A909B !important; }
.bm .leaflet-control-attribution a { color: #A3A8B1 !important; }
`;
