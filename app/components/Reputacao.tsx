'use client';

// ═══════════════════════════════════════════════════════════════════════════
// REPUTAÇÃO — Visão Geral, lista de Locais e Ficha do local
// Segue o mockup aprovado (versão escura). Na impressão/PDF usa a versão clara.
// Todos os números vêm de app/lib/temas.ts → numeros() (fonte única).
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { t } from '@/app/lib/i18n';
import { dispAnalysis } from '@/app/lib/ai-translate';
import { windowStats, langName, cutoffDate, loadWindowReviews, type StoredReview } from '@/app/lib/reviews';
import {
  TEMAS, temaNome, estadoNome, numeros, ranking, alerta, numerosCoerentes, numerosPermitidos, resumoModelo,
  MIN_ROBUSTO, type Estado, type LocMin, type Numeros,
} from '@/app/lib/temas';

export interface Intervencao { id: string; date: string; desc: string }
export interface LocV extends LocMin { coords?: [number, number]; interventions?: Intervencao[] }

// ─── Formatação (formato português único) ───────────────────────────────────
const fmt = (n: number, d = 0) => {
  const [i, dec] = Math.abs(n).toFixed(d).split('.');
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return (n < 0 ? '−' : '') + (dec ? `${g}${t(',', '.')}${dec}` : g);
};
const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mesAno = (ym: string) => { if (!ym) return ''; const [y, m] = ym.split('-'); return `${t(MESES_PT[+m - 1], MESES_EN[+m - 1])} ${y}`; };
const dataCurta = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-PT') : '');
const extenso = (n: number) => (['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'][n] ?? String(n));
const Extenso = (n: number) => { const s = t(extenso(n), String(n)); return s.charAt(0).toUpperCase() + s.slice(1); };
/** Converte **negrito** em <strong>. */
const rico = (s: string): ReactNode[] => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <strong key={i} style={{ color: 'var(--rb-text)', fontWeight: 700 }}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));


// ─── Efeitos (respeitam "reduzir movimento"; na impressão ficam estáticos) ────
const semMovimento = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useVisivel<T extends Element>(): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || vis) return;
    if (typeof IntersectionObserver === 'undefined' || semMovimento()) { setVis(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setVis(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [vis]);
  return [ref, vis];
}

/** Número que conta até ao valor final quando entra no ecrã. */
function Conta({ v, d = 0 }: { v: number; d?: number }) {
  const [ref, vis] = useVisivel<HTMLSpanElement>();
  const [x, setX] = useState(0);
  useEffect(() => {
    const final = () => setX(v);
    window.addEventListener('beforeprint', final);
    return () => window.removeEventListener('beforeprint', final);
  }, [v]);
  useEffect(() => {
    if (!vis) return;
    if (semMovimento()) { setX(v); return; }
    let raf = 0;
    const t0 = performance.now(), dur = 1200;
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - t0) / dur);
      setX(v * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [vis, v]);
  return <span ref={ref}>{fmt(x, d)}</span>;
}

/** Revela secções (.rb-sec, .rb-rise) à medida que entram no ecrã.
 *  Corre a cada renderização: apanha também secções que aparecem depois (ex.: após reanalisar). */
function useRevelar(_dep?: unknown) {
  const ioRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rbx .rb-sec:not(.rb-in), .rbx .rb-rise:not(.rb-in)'));
    if (!els.length) return;
    if (semMovimento() || typeof IntersectionObserver === 'undefined') { els.forEach((e) => e.classList.add('rb-in')); return; }
    if (!ioRef.current) {
      ioRef.current = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('rb-in'); ioRef.current?.unobserve(e.target); }
      }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    els.forEach((e) => ioRef.current!.observe(e));
    const seguranca = window.setTimeout(() => els.forEach((e) => { if (e.getBoundingClientRect().top < window.innerHeight) e.classList.add('rb-in'); }), 1500);
    return () => window.clearTimeout(seguranca);
  });
  useEffect(() => () => { ioRef.current?.disconnect(); }, []);
}

/** Fotografia grande com zoom de entrada e parallax ao descer a página. */
function HeroFoto({ src, altura, children }: { src: string | null; altura: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!src || semMovimento()) return;
    let raf = 0;
    const mexe = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el || !el.parentElement) return;
        const top = el.parentElement.getBoundingClientRect().top;
        el.style.transform = `translate3d(0, ${Math.max(-100, Math.min(140, -top * 0.35))}px, 0)`;
      });
    };
    mexe();
    window.addEventListener('scroll', mexe, { passive: true });
    return () => { window.removeEventListener('scroll', mexe); cancelAnimationFrame(raf); };
  }, [src]);
  return (
    <div className="rb-hero-foto" style={{ height: altura }}>
      {src && <div ref={ref} className="rb-hero-img"><div className="rb-kb" style={{ backgroundImage: `url(${src})` }} /></div>}
      <div className="rb-hero-shade" />
      <div className="rb-hero-in">{children}</div>
    </div>
  );
}

/** Reduz uma imagem no browser (para caber no Firestore). */
async function reduzir(src: string, maxW: number, q: number): Promise<string> {
  const img = new Image();
  await new Promise<void>((ok, ko) => { img.onload = () => ok(); img.onerror = () => ko(new Error('imagem')); img.src = src; });
  const esc = Math.min(1, maxW / img.width);
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * esc); cv.height = Math.round(img.height * esc);
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', q);
}

/** Miniaturas de todos os locais (coleção leve, separada das fotografias grandes). */
function useMiniaturas(): Record<string, string> {
  const [m, setM] = useState<Record<string, string>>({});
  useEffect(() => {
    let vivo = true;
    getDocs(collection(db, 'locationThumbs')).then((snap) => {
      const o: Record<string, string> = {};
      snap.forEach((d) => { const v = (d.data() as any).data; if (v) o[d.id] = v; });
      if (vivo) setM(o);
    }).catch(() => {});
    return () => { vivo = false; };
  }, []);
  return m;
}

function Miniatura({ src }: { src?: string }) {
  return (
    <span className="rb-th" style={{ width: 84, height: 56, borderRadius: 4, overflow: 'hidden', background: 'var(--rb-muted)', flexShrink: 0, display: 'inline-block' }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .6s cubic-bezier(.2,.7,.2,1)' }} /> : null}
    </span>
  );
}

// ─── Tokens (versão escura; clara na impressão) ─────────────────────────────
const ESTILO = `
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
.rbx { --rb-bg:#15171B; --rb-surface:#1C1F24; --rb-text:#ECEDEF; --rb-text2:#A3A8B1; --rb-line:#2D3139; --rb-accent:#8AB0E6; --rb-accent-bg:#22324A;
  --rb-warn:#EDA06B; --rb-warn-bg:#3A2618; --rb-muted:#262A30; --rb-on:#0F1216; --rb-good:#7CC79A; --rb-good-bg:#1D3326; --rb-bad:#EF8A7B; --rb-bad-bg:#3A201D; --rb-star:#F2C14E;
  background: var(--rb-bg); color: var(--rb-text); min-height: 100vh; font-family: 'Public Sans', system-ui, sans-serif; font-variant-numeric: tabular-nums; }
.rbx *, .rbx *::before, .rbx *::after { box-sizing: border-box; }
.rbx a { color: var(--rb-accent); }
.rb-chip, .rbx .rb-link { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid transparent; background: var(--rb-accent-bg); color: var(--rb-accent); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background .2s ease, transform .2s ease, border-color .2s ease, color .2s ease; }
.rb-chip:hover, .rbx .rb-link:hover { transform: translateY(-1px); filter: brightness(1.15); }
.rb-chip .rb-seta { transition: transform .25s ease; }
.rb-chip:hover .rb-seta { transform: translateX(3px); }
.rb-chip.warn { background: var(--rb-warn); color: var(--rb-on); }
.rb-chip.ghost, .rbx .rb-link { background: transparent; border-color: var(--rb-line); color: var(--rb-text2); }
.rb-chip.ghost:hover, .rbx .rb-link:hover { border-color: var(--rb-text2); color: var(--rb-text); filter: none; }
.rb-chip.danger { background: transparent; border-color: var(--rb-bad-bg); color: var(--rb-bad); }
.rb-chip:disabled { opacity: .5; cursor: not-allowed; transform: none; }
.rb-crumb { background: none; border: 0; padding: 0; font: inherit; color: var(--rb-text2); cursor: pointer; transition: color .2s ease; }
.rb-crumb:hover { color: var(--rb-text); }
.rb-glass { background: rgba(21,23,27,.58); border: 1px solid rgba(255,255,255,.08); border-radius: 6px; backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); }
.rb-3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
.rb-carrossel { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 2px 14px; scrollbar-width: thin; scrollbar-color: var(--rb-line) transparent; }
.rb-card { flex: 0 0 264px; height: 352px; scroll-snap-align: start; position: relative; border-radius: 6px; overflow: hidden; cursor: pointer; background: var(--rb-muted); border: 0; padding: 0; text-align: left; color: var(--rb-text); font: inherit; }
.rb-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .9s cubic-bezier(.2,.7,.2,1); }
.rb-card:hover img { transform: scale(1.07); }
.rb-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(15,17,20,.94) 8%, rgba(15,17,20,.25) 55%, rgba(15,17,20,0) 80%); }
.rb-card > div { position: absolute; left: 18px; right: 18px; bottom: 18px; z-index: 1; }
.rb-estrela { display: inline-block; vertical-align: -0.08em; margin-left: 10px; filter: drop-shadow(0 0 12px rgba(242,193,78,.35)); animation: rbPop .8s cubic-bezier(.2,.9,.3,1.35) .35s both; }
@keyframes rbPop { from { opacity: 0; transform: scale(.3) rotate(-35deg); } to { opacity: 1; transform: none; } }
.rb-area { opacity: 0; transition: opacity 1.2s ease 1s; }
.rb-in .rb-area { opacity: 1; }
.rb-split { display: flex; height: 8px; border-radius: 999px; overflow: hidden; gap: 2px; margin-top: 12px; background: var(--rb-muted); }
.rb-tip { position: absolute; top: 0; transform: translate(-50%, -8px); pointer-events: none; background: rgba(21,23,27,.86); border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: 10px 12px; font-size: 13px; line-height: 1.5; white-space: nowrap; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,.35); z-index: 3; }
.rb-quote { border-left: 2px solid var(--rb-line); padding: 2px 0 2px 14px; margin-top: 12px; font-size: 14.5px; line-height: 1.55; font-style: italic; color: var(--rb-text); }
.rb-quote small { display: block; font-style: normal; font-size: 12.5px; color: var(--rb-text2); margin-top: 4px; }
.rb-vbar { transform: scaleY(0); transform-origin: bottom; transition: transform 1s cubic-bezier(.2,.7,.2,1); }
.rb-in .rb-vbar { transform: scaleY(1); }
.rbx button { font-family: inherit; }
.rbx button:focus-visible, .rbx input:focus-visible, .rbx select:focus-visible { outline: 2px solid var(--rb-accent); outline-offset: 2px; }
.rb-wrap { max-width: 1120px; margin: 0 auto; padding: 32px 48px 56px; }
.rb-btn { height: 38px; padding: 0 16px; border-radius: 4px; border: 1px solid var(--rb-line); background: var(--rb-surface); color: var(--rb-text); font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.rb-btn:hover { border-color: var(--rb-text2); }
.rb-btn.p { background: var(--rb-accent); border-color: var(--rb-accent); color: var(--rb-on); font-weight: 600; }
.rb-btn:disabled { opacity: .5; cursor: not-allowed; }
.rb-strip { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); border-top: 1px solid var(--rb-line); border-bottom: 1px solid var(--rb-line); }
.rb-strip > div { padding: 22px 24px 20px; border-left: 1px solid var(--rb-line); }
.rb-strip > div:first-child { border-left: 0; padding-left: 0; }
.rb-lab { font-size: 13px; color: var(--rb-text2); }
.rb-big { font-size: 40px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin-top: 6px; }
.rb-big small { font-size: 17px; font-weight: 500; color: var(--rb-text2); margin-left: 4px; letter-spacing: 0; }
.rb-sub { font-size: 13px; color: var(--rb-text2); margin-top: 6px; line-height: 1.45; }
.rb-h2 { font-size: 26px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.2; margin: 0; }
.rb-cap { font-size: 13px; color: var(--rb-text2); margin: 8px 0 0; line-height: 1.5; }
.rb-sec { padding-top: 48px; scroll-margin-top: 16px; }
.rb-2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 48px; }
.rb-table { width: 100%; border-collapse: collapse; font-size: 15px; }
.rb-table th { text-align: left; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--rb-text2); padding: 12px 12px 12px 0; border-bottom: 1px solid var(--rb-text2); }
.rb-table td { padding: 16px 12px 16px 0; border-bottom: 1px solid var(--rb-line); vertical-align: top; line-height: 1.5; }
.rb-table td.n, .rb-table th.n { text-align: right; }
.rb-row { cursor: pointer; }
.rb-row:hover td { background: rgba(255,255,255,.025); }
.rb-tag { display: inline-block; font-size: 12.5px; font-weight: 700; padding: 3px 9px; border-radius: 4px; white-space: nowrap; }
.rb-field { height: 38px; border-radius: 4px; border: 1px solid var(--rb-line); background: var(--rb-surface); color: var(--rb-text); padding: 0 12px; font-size: 14px; font-family: inherit; }
.rb-sec, .rb-rise { opacity: 0; transform: translateY(22px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); }
.rb-in { opacity: 1 !important; transform: none !important; }
.rb-draw { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1) .25s; }
.rb-in .rb-draw { stroke-dashoffset: 0; }
.rb-dot { opacity: 0; transition: opacity .5s ease 1.6s; }
.rb-in .rb-dot { opacity: 1; }
.rb-bar { transform: scaleX(0); transform-origin: left center; transition: transform 1.1s cubic-bezier(.2,.7,.2,1); }
.rb-in .rb-bar { transform: scaleX(1); }
.rb-enter { animation: rbEnter .8s cubic-bezier(.2,.7,.2,1) both; }
@keyframes rbEnter { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.rb-hero-foto { position: relative; overflow: hidden; background: linear-gradient(160deg, #262A30 0%, #15171B 100%); }
.rb-hero-img { position: absolute; left: 0; right: 0; top: -140px; bottom: -140px; will-change: transform; }
.rb-hero-img > div { position: absolute; inset: 0; background-size: cover; background-position: center; }
.rb-kb { animation: rbKb 2.6s cubic-bezier(.2,.7,.2,1) both; }
@keyframes rbKb { from { transform: scale(1.14); } to { transform: scale(1); } }
.rb-hero-shade { position: absolute; inset: 0; background: linear-gradient(0deg, var(--rb-bg) 0%, rgba(21,23,27,.62) 42%, rgba(21,23,27,.18) 100%); }
.rb-hero-in { position: relative; height: 100%; max-width: 1120px; margin: 0 auto; padding: 0 48px 40px; display: flex; flex-direction: column; justify-content: flex-end; }
.rb-hero-top { position: absolute; top: 24px; left: 48px; right: 48px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.rb-hero-h1 { font-size: clamp(34px, 5vw, 58px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.04; margin: 12px 0 14px; text-shadow: 0 2px 24px rgba(0,0,0,.35); }
.rb-row:hover .rb-th img { transform: scale(1.08); }
@media (prefers-reduced-motion: reduce) {
  .rb-sec, .rb-rise, .rb-dot { opacity: 1 !important; transform: none !important; transition: none !important; }
  .rb-draw { stroke-dashoffset: 0 !important; transition: none !important; }
  .rb-bar { transform: none !important; transition: none !important; }
  .rb-enter, .rb-kb { animation: none !important; }
}
@media (max-width: 900px) {
  .rb-hero-foto { height: 380px !important; }
  .rb-hero-in { padding: 0 20px 24px; }
  .rb-hero-top { left: 20px; right: 20px; top: 16px; }
  .rb-wrap { padding: 24px 20px 48px; }
  .rb-strip { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .rb-strip > div:nth-child(3) { border-left: 0; padding-left: 0; }
  .rb-2, .rb-3, .rb-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
  .rb-card { flex-basis: 220px; height: 300px; }
  .rb-hide-m { display: none; }
}
@media print {
  .rb-sidebar, .rb-noprint, .rb-mobile-bar { display: none !important; }
  .rbx { --rb-bg:#FFFFFF; --rb-surface:#FFFFFF; --rb-text:#16171A; --rb-text2:#52555C; --rb-line:#DDDAD2; --rb-accent:#1B4F8F; --rb-accent-bg:#E3EBF5;
    --rb-warn:#A8480F; --rb-warn-bg:#F8E7DA; --rb-muted:#E9E7E1; --rb-on:#FFFFFF; --rb-good:#2E7D4F; --rb-good-bg:#E3F1E8; --rb-bad:#B3261E; --rb-bad-bg:#F8E1DE; --rb-star:#B8860B; }
  .rb-area { opacity: 1 !important; } .rb-estrela { animation: none !important; }
  .rb-vbar { transform: none !important; } .rb-glass { background: none; border: 0; backdrop-filter: none; }
  .rb-wrap { padding: 0; max-width: none; }
  .rb-sec { break-inside: avoid; }
  .rb-sec, .rb-rise, .rb-dot { opacity: 1 !important; transform: none !important; }
  .rb-draw { stroke-dashoffset: 0 !important; } .rb-bar { transform: none !important; }
  .rb-hero-foto { height: auto !important; background: none !important; } .rb-hero-img, .rb-hero-shade, .rb-hero-top { display: none !important; }
  .rb-hero-in { padding: 0 0 20px; } .rb-hero-h1 { text-shadow: none; }
}
`;

const PATH_ESTRELA = 'M12 2.6l2.85 6.03 6.6.78-4.88 4.53 1.3 6.53L12 17.2l-5.87 3.27 1.3-6.53-4.88-4.53 6.6-.78L12 2.6z';
const Estrela = ({ s = 30 }: { s?: number }) => <svg className="rb-estrela" width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d={PATH_ESTRELA} fill="var(--rb-star)" /></svg>;

const Seta = () => <svg className="rb-seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>;

function Tag({ e }: { e: Estado }) {
  const st: Record<Estado, CSSProperties> = {
    forte: { background: 'var(--rb-accent-bg)', color: 'var(--rb-accent)' },
    persistente: { background: 'var(--rb-warn)', color: 'var(--rb-on)' },
    novo: { border: '1px solid var(--rb-warn)', color: 'var(--rb-warn)', padding: '2px 8px' },
    deixou: { background: 'var(--rb-muted)', color: 'var(--rb-text2)' },
  };
  return <span className="rb-tag" style={st[e]}>{estadoNome(e)}</span>;
}

function Faixa({ x, a }: { x: Numeros | null; a?: any }) {
  if (!x) return null;
  const insuf = x.robustez === 'insuficiente';
  const neu = Math.max(0, 100 - x.pos - x.neg);
  return (
    <div className="rb-strip rb-rise">
      <div>
        <div className="rb-lab">{t('Índice de reputação', 'Reputation index')}</div>
        {insuf ? <div className="rb-big" style={{ color: 'var(--rb-text2)' }}>—</div> : <div className="rb-big"><Conta v={x.idx} d={1} /><small>/10</small></div>}
        <div className="rb-sub">{insuf ? t(`Dados insuficientes · menos de ${MIN_ROBUSTO} avaliações`, `Insufficient data · fewer than ${MIN_ROBUSTO} reviews`) : `${x.robustez === 'alta' ? t('Robustez alta', 'High robustness') : t('Robustez média', 'Medium robustness')} · ${fmt(x.textN)} ${t('com texto', 'with text')}`}{x.basis === 'ia' ? ` · ${t('estimado pela IA', 'AI estimate')}` : ''}</div>
      </div>
      <div>
        <div className="rb-lab">{t('Média Google', 'Google average')}</div>
        <div className="rb-big"><Conta v={x.avg} d={2} /><Estrela /></div>
        <div className="rb-sub">{t('em 5 estrelas · Google Maps', 'out of 5 stars · Google Maps')}</div>
      </div>
      <div>
        <div className="rb-lab">{t('Comentários', 'Reviews')}</div>
        <div className="rb-big"><Conta v={x.n} /></div>
        <div className="rb-sub">{x.from ? `${t('últimos 3 anos', 'last 3 years')} · ${mesAno(x.from)} – ${mesAno(x.to)}` : t('análise anterior', 'previous analysis')}</div>
      </div>
      <div>
        <div className="rb-lab">{t('Positivos e negativos', 'Positive and negative')}</div>
        <div className="rb-big" style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ color: 'var(--rb-good)' }}><Conta v={x.pos} d={1} />%</span>
          <span style={{ color: 'var(--rb-bad)', fontSize: 24 }}><Conta v={x.neg} d={1} />%</span>
        </div>
        <div className="rb-split rb-bar">
          <i style={{ width: `${x.pos}%`, background: 'var(--rb-good)' }} />
          <i style={{ width: `${neu}%`, background: 'var(--rb-text2)', opacity: 0.35 }} />
          <i style={{ width: `${x.neg}%`, background: 'var(--rb-bad)', minWidth: x.neg > 0 ? 3 : 0 }} />
        </div>
        <div className="rb-sub">{t('positivos 4–5★ · negativos 1–2★', 'positive 4–5★ · negative 1–2★')}</div>
      </div>
    </div>
  );
}

function Titulo({ h, cap, id, right }: { h: string; cap?: string; id?: string; right?: ReactNode }) {
  return (
    <div id={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
      <div style={{ maxWidth: 640 }}>
        <h2 className="rb-h2">{h}</h2>
        {cap && <p className="rb-cap">{cap}</p>}
      </div>
      {right}
    </div>
  );
}

// ─── Gráfico de evolução interativo (desenha-se, área, cursor com detalhe) ───
function Evolucao({ q, intervencoes, alertaUltimo }: { q: { q: string; avg: number; n: number; negPct?: number }[]; intervencoes: Intervencao[]; alertaUltimo: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const idRef = useRef(`rbg${Math.random().toString(36).slice(2, 8)}`);
  if (q.length < 2) return <p className="rb-sub">{t('Ainda não há trimestres suficientes para mostrar a evolução.', 'Not enough quarters yet to show the trend.')}</p>;
  const W = 560, H = 250, L = 38, R = 16, T = 24, B = 28;
  const min = Math.min(...q.map((x) => x.avg)), max = Math.max(...q.map((x) => x.avg));
  const lo = Math.max(1, Math.floor((min - 0.15) * 10) / 10), hi = Math.min(5, Math.ceil((max + 0.1) * 10) / 10);
  const X = (i: number) => L + (i * (W - L - R)) / (q.length - 1);
  const Y = (v: number) => T + ((hi - v) / (hi - lo || 1)) * (H - T - B);
  const lab = (s2: string) => { const [y, tq] = s2.split('-T'); return `T${tq} ${y.slice(2)}`; };
  const labLongo = (s2: string) => { const [y, tq] = s2.split('-T'); return t(`${tq}.º trimestre de ${y}`, `Q${tq} ${y}`); };
  const step = Math.ceil(q.length / 7);
  const qIdx = (iso: string) => { const d = new Date(iso); const k = `${d.getFullYear()}-T${Math.floor(d.getMonth() / 3) + 1}`; return q.findIndex((x) => x.q === k); };
  const pts = q.map((x, i) => `${X(i)},${Y(x.avg)}`).join(' ');
  const area = `M ${X(0)} ${H - B} L ${q.map((x, i) => `${X(i)} ${Y(x.avg)}`).join(' L ')} L ${X(q.length - 1)} ${H - B} Z`;
  const ticks = [lo, Math.round(((lo + hi) / 2) * 100) / 100, hi];
  const mexe = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(q.length - 1, Math.round(((px - L) / (W - L - R)) * (q.length - 1)))));
  };
  const h = hover != null ? q[hover] : null;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t('Média de estrelas por trimestre', 'Average stars per quarter')} style={{ display: 'block', overflow: 'visible', cursor: 'crosshair', touchAction: 'pan-y' }}
        onMouseMove={(e) => mexe(e.clientX, e.currentTarget)} onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => mexe(e.touches[0].clientX, e.currentTarget)} onTouchMove={(e) => mexe(e.touches[0].clientX, e.currentTarget)}>
        <defs>
          <linearGradient id={idRef.current} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--rb-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--rb-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--rb-line)" />
            <text x={L - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--rb-text2)">{fmt(v, 1)}</text>
          </g>
        ))}
        <path className="rb-area" d={area} fill={`url(#${idRef.current})`} />
        {intervencoes.map((iv) => {
          const i = qIdx(iv.date);
          if (i < 0) return null;
          return (
            <g key={iv.id}>
              <line x1={X(i)} x2={X(i)} y1={T - 8} y2={H - B} stroke="var(--rb-accent)" strokeDasharray="3 3" />
              <text x={X(i) + 4} y={T - 10} fontSize="10.5" fill="var(--rb-accent)">{iv.desc.slice(0, 22)}</text>
            </g>
          );
        })}
        {alertaUltimo && (
          <g>
            <line x1={X(q.length - 1)} x2={X(q.length - 1)} y1={T - 8} y2={H - B} stroke="var(--rb-warn)" strokeDasharray="2 3" />
            <text x={X(q.length - 1)} y={T - 10} textAnchor="end" fontSize="10.5" fill="var(--rb-warn)">{t('alerta', 'alert')}</text>
          </g>
        )}
        <polyline className="rb-draw" pathLength={1} fill="none" stroke="var(--rb-accent)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" points={pts} />
        {q.map((x, i) => <circle key={x.q} className="rb-dot" cx={X(i)} cy={Y(x.avg)} r={hover === i ? 6 : 3.4} fill={hover === i ? 'var(--rb-bg)' : 'var(--rb-accent)'} stroke="var(--rb-accent)" strokeWidth={hover === i ? 2.5 : 0} style={{ transition: 'r .15s ease' }} />)}
        {hover != null && <line x1={X(hover)} x2={X(hover)} y1={T - 4} y2={H - B} stroke="var(--rb-text2)" strokeOpacity={0.45} />}
        {q.map((x, i) => (i % step === 0 || i === q.length - 1 ? <text key={'l' + x.q} x={X(i)} y={H - 6} textAnchor="middle" fontSize="11" fill={hover === i ? 'var(--rb-text)' : 'var(--rb-text2)'}>{lab(x.q)}</text> : null))}
      </svg>
      {h && (
        <div className="rb-tip" style={{ left: `${(X(hover!) / W) * 100}%`, top: `${(Y(h.avg) / H) * 100}%`, transform: `translate(${hover! > q.length / 2 ? '-105%' : '5%'}, -115%)` }}>
          <div style={{ fontWeight: 700 }}>{labLongo(h.q)}</div>
          <div><span style={{ fontSize: 17, fontWeight: 700 }}>{fmt(h.avg, 2)}</span> <span style={{ color: 'var(--rb-star)' }}>★</span></div>
          <div style={{ color: 'var(--rb-text2)' }}>{fmt(h.n)} {t('avaliações', 'reviews')}{h.negPct != null ? ` · ${fmt(h.negPct, 1)}% ${t('negativas', 'negative')}` : ''}</div>
        </div>
      )}
    </div>
  );
}

function BarrasIdioma({ langs, total }: { langs: { code: string; n: number; avg: number }[]; total: number }) {
  const texto = langs.filter((l) => l.code !== 'none' && l.code !== 'und').slice(0, 6);
  const semT = langs.find((l) => l.code === 'none'), und = langs.find((l) => l.code === 'und');
  const linhas = [...texto, ...(und ? [und] : []), ...(semT ? [semT] : [])];
  const max = Math.max(1, ...linhas.map((l) => l.n));
  return (
    <div>
      {linhas.map((l, li) => {
        const cinza = l.code === 'none' || l.code === 'und';
        return (
          <div key={l.code} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14.5 }}>
              <span style={{ fontWeight: 600, color: cinza ? 'var(--rb-text2)' : undefined }}>{langName(l.code)}</span>
              <span style={{ color: 'var(--rb-text2)' }}>{fmt(l.n)} · {fmt(l.avg, 2)} {t('estrelas', 'stars')}</span>
            </div>
            <div style={{ height: 10, background: 'var(--rb-muted)', borderRadius: 2, marginTop: 6 }}>
              <div className="rb-bar" style={{ width: `${(l.n / max) * 100}%`, height: '100%', borderRadius: 2, background: cinza ? 'var(--rb-text2)' : 'var(--rb-accent)', opacity: cinza ? 0.55 : 1, transitionDelay: `${li * 90}ms` }} />
            </div>
          </div>
        );
      })}
      {total > 0 && <p className="rb-sub" style={{ marginTop: 4 }}>{t(`Base: ${fmt(total)} avaliações.`, `Base: ${fmt(total)} reviews.`)}</p>}
    </div>
  );
}

function tituloIdiomas(langs: { code: string; n: number; avg: number }[]): string {
  const c = langs.filter((l) => l.code !== 'none' && l.code !== 'und' && l.n >= 10);
  if (c.length < 2) return t('Poucos comentários com idioma identificado', 'Few reviews with an identified language');
  const lo = c.reduce((a, b) => (b.avg < a.avg ? b : a)), hi = c.reduce((a, b) => (b.avg > a.avg ? b : a));
  return hi.avg - lo.avg <= 0.15 ? t('Satisfação igual em todos os idiomas', 'Equal satisfaction across languages') : t(`Quem escreve em ${langName(lo.code).toLowerCase()} avalia abaixo dos restantes`, `${langName(lo.code)} speakers rate below the rest`);
}

function tituloEvolucao(q: { avg: number }[]): string {
  if (q.length < 2) return t('Evolução da avaliação', 'Rating trend');
  const min = Math.min(...q.map((x) => x.avg)), d = q[q.length - 1].avg - q[0].avg;
  if (min >= 4.5) return t(`A média está acima de ${fmt(Math.floor(min * 10) / 10, 1)} estrelas em todo o período`, `The average stays above ${fmt(Math.floor(min * 10) / 10, 1)} stars throughout`);
  if (d >= 0.1) return t(`A média subiu ${fmt(d, 2)} estrelas no período`, `The average rose ${fmt(d, 2)} stars over the period`);
  if (d <= -0.1) return t(`A média desceu ${fmt(-d, 2)} estrelas no período`, `The average fell ${fmt(-d, 2)} stars over the period`);
  return t('A média manteve-se estável no período', 'The average stayed stable over the period');
}


// ─── Distribuição das estrelas (1 a 5) ─────────────────────────────────────
function tituloDist(dist: number[]): string {
  const n = dist.reduce((a, b) => a + b, 0) || 1;
  const p5 = dist[4] / n, p1 = dist[0] / n, p45 = (dist[3] + dist[4]) / n;
  if (p5 >= 0.5 && p1 >= 0.1) return t('Opinião dividida: muitos 5 e muitos 1', 'Divided opinion: many 5s and many 1s');
  if (p5 >= 0.75) return t(`${fmt(p5 * 100, 0)}% dão 5 estrelas: uma opinião consensual`, `${fmt(p5 * 100, 0)}% give 5 stars: a consensual opinion`);
  if (p45 >= 0.8) return t('A grande maioria dá 4 ou 5 estrelas', 'The vast majority give 4 or 5 stars');
  return t('Opiniões variadas entre os visitantes', 'Mixed opinions among visitors');
}
function DistEstrelas({ dist }: { dist: number[] }) {
  const n = dist.reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(1, ...dist);
  return (
    <div>
      {[5, 4, 3, 2, 1].map((e, i) => {
        const v = dist[e - 1] || 0;
        const cor = e >= 4 ? 'var(--rb-good)' : e === 3 ? 'var(--rb-text2)' : 'var(--rb-bad)';
        return (
          <div key={e} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) 110px', gap: 14, alignItems: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{e} <span style={{ color: 'var(--rb-star)' }}>★</span></span>
            <div style={{ height: 12, background: 'var(--rb-muted)', borderRadius: 999, overflow: 'hidden' }}>
              <div className="rb-bar" style={{ width: `${(v / max) * 100}%`, height: '100%', borderRadius: 999, background: cor, opacity: e === 3 ? 0.55 : 1, transitionDelay: `${i * 90}ms` }} />
            </div>
            <span style={{ textAlign: 'right', fontSize: 14 }}><strong>{fmt((v / n) * 100, 1)}%</strong> <span style={{ color: 'var(--rb-text2)' }}>· {fmt(v)}</span></span>
          </div>
        );
      })}
    </div>
  );
}

// ─── O que cada mercado valoriza e critica (a partir dos temas de cada comentário) ─
interface Mercado { code: string; n: number; avg: number; neg: number; elogia: { id: string; pct: number }[]; critica: { id: string; pct: number }[] }
function mercadosDe(revs: StoredReview[]): { lista: Mercado[]; temTags: boolean } {
  const txt = revs.filter((r) => r.t && r.t.trim() && r.l !== 'none' && r.l !== 'und');
  const by: Record<string, StoredReview[]> = {};
  txt.forEach((r) => { (by[r.l] = by[r.l] || []).push(r); });
  const temTags = txt.some((r) => r.c);
  const lista = Object.entries(by).filter(([, arr]) => arr.length >= 10).sort((p, q) => q[1].length - p[1].length).slice(0, 6).map(([code, arr]) => {
    const n = arr.length;
    const conta = (sinal: string) => {
      const c: Record<string, number> = {};
      arr.forEach((r) => (r.tg || []).forEach((tg) => { if (tg.endsWith(sinal)) { const id = tg.slice(0, -1); c[id] = (c[id] || 0) + 1; } }));
      return Object.entries(c).map(([id, k]) => ({ id, pct: (k / n) * 100 })).sort((p, q) => q.pct - p.pct);
    };
    return { code, n, avg: arr.reduce((a, r) => a + r.s, 0) / n, neg: (arr.filter((r) => r.s <= 2).length / n) * 100, elogia: conta('+').slice(0, 3), critica: conta('-').filter((z) => z.pct >= 2).slice(0, 3) };
  });
  return { lista, temTags };
}
function tituloMercados(lista: Mercado[]): string {
  let melhor: { code: string; id: string; pct: number } | null = null;
  lista.forEach((m) => m.critica.forEach((c) => { if (!melhor || c.pct > melhor.pct) melhor = { code: m.code, id: c.id, pct: c.pct }; }));
  const mm = melhor as { code: string; id: string; pct: number } | null;
  if (mm && mm.pct >= 5) return t(`Quem escreve em ${langName(mm.code).toLowerCase()} é quem mais aponta ${temaNome(mm.id).toLowerCase()}`, `${langName(mm.code)} speakers point out ${temaNome(mm.id).toLowerCase()} the most`);
  return t('Os mercados valorizam o mesmo e criticam pouco', 'Markets value the same things and criticise little');
}
function MercadosDetalhe({ lista }: { lista: Mercado[] }) {
  const chip = (txt: string, cor: string, fundo: string) => <span key={txt} className="rb-tag" style={{ background: fundo, color: cor, fontWeight: 600, marginRight: 6, marginBottom: 6 }}>{txt}</span>;
  return (
    <div>
      {lista.map((m, i) => (
        <div key={m.code} className="rb-rise" style={{ padding: '16px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none', transitionDelay: `${i * 80}ms` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{langName(m.code)}</span>
            <span style={{ fontSize: 13.5, color: 'var(--rb-text2)' }}>{fmt(m.n)} {t('comentários', 'reviews')} · <strong style={{ color: 'var(--rb-text)' }}>{fmt(m.avg, 2)}</strong> <span style={{ color: 'var(--rb-star)' }}>★</span> · {fmt(m.neg, 1)}% {t('negativos', 'negative')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0,1fr)', gap: '8px 12px', marginTop: 10, alignItems: 'start' }}>
            <span style={{ fontSize: 13, color: 'var(--rb-good)', fontWeight: 700, paddingTop: 3 }}>{t('Valoriza', 'Values')}</span>
            <div>{m.elogia.length ? m.elogia.map((z) => chip(`${temaNome(z.id)} · ${fmt(z.pct, 0)}%`, 'var(--rb-good)', 'var(--rb-good-bg)')) : <span className="rb-sub" style={{ marginTop: 0 }}>—</span>}</div>
            <span style={{ fontSize: 13, color: 'var(--rb-bad)', fontWeight: 700, paddingTop: 3 }}>{t('Critica', 'Criticises')}</span>
            <div>{m.critica.length ? m.critica.map((z) => chip(`${temaNome(z.id)} · ${fmt(z.pct, 0)}%`, 'var(--rb-bad)', 'var(--rb-bad-bg)')) : <span className="rb-sub" style={{ marginTop: 0 }}>{t('sem críticas relevantes', 'no relevant criticism')}</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FICHA DO LOCAL
// ═══════════════════════════════════════════════════════════════════════════
export function FichaLocal(props: {
  loc: LocV; locations: LocV[]; readOnly?: boolean; analyzing?: string | null; copied?: boolean; catLabel: (c: string) => string;
  onReanalyze?: (id: string) => void; onShare?: (id: string) => void; onOpenList?: () => void; onOpen?: (id: string) => void;
  onImport?: () => void; onPaste?: (id: string) => void; onEdit?: (id: string) => void; onDelete?: (id: string) => void;
  onSaveInterventions?: (id: string, list: Intervencao[]) => void;
}) {
  const { loc, locations, readOnly } = props;
  const x = numeros(loc);
  const ws = windowStats(loc.reviewStats);
  const a: any = loc.analysis ? dispAnalysis(loc) : null;
  const v2 = a?.v2;
  const rk = ranking(locations);
  const pos = rk.findIndex((r) => r.id === loc.id) + 1;
  const al = alerta(loc.reviewStats);
  const ivs = loc.interventions || [];
  const [foto, setFoto] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [novaIv, setNovaIv] = useState<{ date: string; desc: string } | null>(null);
  const [revs, setRevs] = useState<StoredReview[]>([]);
  useEffect(() => {
    let vivo = true;
    setRevs([]);
    if (!loc.reviewStats) return;
    loadWindowReviews(loc.id).then((all) => { if (vivo) setRevs(all); }).catch(() => {});
    return () => { vivo = false; };
  }, [loc.id, loc.lastAnalyzed, loc.reviewStats]);
  const citacoes = {
    pos: revs.filter((r) => r.s === 5 && r.t && r.t.trim().length >= 80).slice(0, 2),
    neg: revs.filter((r) => r.s <= 2 && r.t && r.t.trim().length >= 40).slice(0, 2),
  };
  const merc = mercadosDe(revs);
  const fileRef = useRef<HTMLInputElement>(null);

  useRevelar(loc.id);
  useEffect(() => {
    let vivo = true;
    setFoto(null);
    getDoc(doc(db, 'locationPhotos', loc.id)).then(async (d) => {
      if (!vivo || !d.exists()) return;
      const data = (d.data() as any).data || null;
      setFoto(data);
      // cria a miniatura se ainda não existir (fotografias carregadas antes desta versão)
      if (data && !readOnly) {
        const th = await getDoc(doc(db, 'locationThumbs', loc.id));
        if (!th.exists()) await setDoc(doc(db, 'locationThumbs', loc.id), { data: await reduzir(data, 560, 0.74) });
      }
    }).catch(() => {});
    return () => { vivo = false; };
  }, [loc.id, readOnly]);

  const carregarFoto = async (f: File) => {
    setACarregar(true);
    try {
      const url = URL.createObjectURL(f);
      let data = await reduzir(url, 1920, 0.8);
      if (data.length > 900000) data = await reduzir(url, 1600, 0.66);
      URL.revokeObjectURL(url);
      await setDoc(doc(db, 'locationPhotos', loc.id), { data, updatedAt: new Date().toISOString() });
      await setDoc(doc(db, 'locationThumbs', loc.id), { data: await reduzir(data, 560, 0.74) });
      setFoto(data);
    } catch (e) {
      alert(t('Não foi possível carregar a fotografia.', 'Could not upload the photo.'));
    } finally { setACarregar(false); }
  };

  const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Resumo: texto da IA só se os números coincidirem com os calculados; senão, texto-modelo
  const atual = v2 && x && v2.n === x.n;
  const textoIA = atual && typeof a.summaryPT === 'string' && numerosCoerentes(a.summaryPT, numerosPermitidos(x!, [pos, rk.length])) ? a.summaryPT : null;
  const resumo = x ? textoIA || resumoModelo(loc.name, x) : '';
  const tituloResumo = (atual && v2.titulo) || (x ? (x.robustez === 'insuficiente' ? t('Ainda com poucas avaliações para conclusões', 'Still too few reviews for conclusions') : x.avg >= 4.6 ? t('Uma experiência muito bem avaliada pelos visitantes', 'A very highly rated visitor experience') : x.avg >= 4.2 ? t('Bem avaliado, com margem para melhorar', 'Well rated, with room to improve') : t('Avaliação abaixo do habitual no destino', 'Rating below the destination’s usual level')) : '');

  const ORDEM: Estado[] = ['forte', 'persistente', 'novo', 'deixou'];
  const temas: { id: string; estado: Estado; nota: string }[] = v2 && Array.isArray(v2.temas) ? v2.temas.filter((z: any) => z.estado).sort((p: any, q2: any) => ORDEM.indexOf(p.estado) - ORDEM.indexOf(q2.estado)) : [];
  const nPers = temas.filter((z) => z.estado === 'persistente').length, nNovo = temas.filter((z) => z.estado === 'novo').length;
  const tituloTemas = nPers >= 2 ? t(`${Extenso(nPers)} problemas persistem há mais de um ano`, `${nPers} issues have persisted for over a year`)
    : nPers === 1 ? t('Um problema persiste há mais de um ano', 'One issue has persisted for over a year')
      : nNovo >= 1 ? t(`${Extenso(nNovo)} ${nNovo === 1 ? 'problema novo' : 'problemas novos'} no último ano`, `${nNovo} new ${nNovo === 1 ? 'issue' : 'issues'} in the last year`)
        : t('Sem problemas persistentes', 'No persistent issues');
  const recs: { titulo: string; texto: string }[] = v2 && Array.isArray(v2.recomendacoes) && v2.recomendacoes.length
    ? v2.recomendacoes.slice(0, 3) : (a?.actionableInsights || []).slice(0, 3).map((s: string) => ({ titulo: s, texto: '' }));

  const topRk = rk.slice(0, 5);
  const mostraRk = pos > 5 ? [...topRk, rk[pos - 1]] : topRk;
  const qs = ws ? ws.quarters.map((z) => ({ q: z.q, avg: z.avg, n: z.n, negPct: z.negPct })) : [];

  const guardarIv = () => {
    if (!novaIv || !novaIv.date || !novaIv.desc.trim()) return;
    const list = [...ivs, { id: String(Date.now()), date: novaIv.date, desc: novaIv.desc.trim() }].sort((p, q2) => (p.date < q2.date ? -1 : 1));
    props.onSaveInterventions?.(loc.id, list);
    setNovaIv(null);
  };

  return (
    <div className="rbx" key={loc.id}>
      <style>{ESTILO}</style>
      {/* 1 + 2. Fotografia grande (parallax) com navegação, ações, categoria e nome */}
      <HeroFoto src={foto} altura={foto ? 560 : 360}>
        <div className="rb-hero-top">
          <div style={{ fontSize: 14, color: 'var(--rb-text2)' }}>
            {readOnly ? <span>{t('Reputação', 'Reputation')}</span> : <button className="rb-crumb" onClick={props.onOpenList}>{t('Reputação', 'Reputation')}</button>}
            {' / '}
            {readOnly ? <span>{t('Locais', 'Places')}</span> : <button className="rb-crumb" onClick={props.onOpenList}>{t('Locais', 'Places')}</button>}
            {' / '}<span>{props.catLabel(loc.category)}</span>
          </div>
          <div className="rb-noprint" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {!readOnly && <button className="rb-btn" onClick={() => props.onShare?.(loc.id)}>{props.copied ? t('Link copiado', 'Link copied') : t('Link partilhável', 'Shareable link')}</button>}
            <button className="rb-btn" onClick={() => window.print()}>{t('Exportar PDF', 'Export PDF')}</button>
            {!readOnly && <button className="rb-btn p" disabled={!!props.analyzing} onClick={() => props.onReanalyze?.(loc.id)}>{props.analyzing === loc.id ? t('A analisar…', 'Analysing…') : t('Reanalisar', 'Re-analyse')}</button>}
          </div>
        </div>
        <div className="rb-enter" style={{ maxWidth: 820 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>{props.catLabel(loc.category)}</div>
          <h1 className="rb-hero-h1">{loc.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--rb-text2)', lineHeight: 1.5 }}>
            {[loc.coords ? `${loc.coords[0].toFixed(4)}, ${loc.coords[1].toFixed(4)}` : '', 'Google Maps', loc.lastAnalyzed ? t(`analisado a ${dataCurta(loc.lastAnalyzed)}`, `analysed on ${dataCurta(loc.lastAnalyzed)}`) : t('ainda não analisado', 'not analysed yet')].filter(Boolean).join(' · ')}
          </div>
        </div>
      </HeroFoto>
      <div className="rb-wrap rb-enter" style={{ paddingTop: 0, animationDelay: '120ms' }}>
        {!readOnly && (
          <div className="rb-noprint" style={{ display: 'flex', justifyContent: 'flex-end', margin: '-6px 0 14px' }}>
            <button className="rb-chip ghost" disabled={aCarregar} onClick={() => fileRef.current?.click()}>
              {aCarregar ? t('A carregar…', 'Uploading…') : foto ? t('Substituir fotografia', 'Replace photo') : t('Carregar fotografia do local', 'Upload photo of the place')}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) carregarFoto(fl); }} />
          </div>
        )}

        {/* 3. Números */}
        <Faixa x={x} a={a} />
        {!x && <p className="rb-sub">{t('Sem avaliações analisadas. Importa os comentários do Google Maps e reanalisa.', 'No analysed reviews. Import the Google Maps reviews and re-analyse.')}</p>}

        {/* 4. Alerta */}
        {al && (
          <div style={{ marginTop: 24, background: 'var(--rb-warn-bg)', borderRadius: 4, padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap', fontSize: 14.5 }}>
            <strong style={{ color: 'var(--rb-warn)' }}>{t('Alerta', 'Alert')}</strong>
            <span style={{ flex: 1, minWidth: 240 }}>{al}</span>
            <button className="rb-chip warn rb-noprint" onClick={() => ir('rb-evolucao')}>{t('Ver evolução', 'See trend')} <Seta /></button>
          </div>
        )}
        {!readOnly && v2 && x && v2.n !== x.n && (
          <div className="rb-noprint" style={{ marginTop: 16, fontSize: 14, color: 'var(--rb-text2)' }}>
            {t(`Há avaliações novas desde a última análise (${fmt(v2.n)} → ${fmt(x.n)}). Os números estão atualizados; reanalisa para atualizar os textos e os temas.`, `There are new reviews since the last analysis (${fmt(v2.n)} → ${fmt(x.n)}). Numbers are current; re-analyse to update texts and themes.`)}
          </div>
        )}

        {/* 5. Âncoras */}
        <nav className="rb-noprint" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 28, paddingBottom: 12, borderBottom: '1px solid var(--rb-line)', fontSize: 14.5 }}>
          {[['rb-resumo', t('Resumo', 'Summary')], ['rb-temas', t('Temas', 'Themes')], ['rb-comentarios', t('Pontos fortes e problemas', 'Strengths and issues')], ['rb-periodos', t('Problemas por período', 'Issues by period')], ['rb-dimensoes', t('Dimensões', 'Dimensions')], ['rb-evolucao', t('Evolução', 'Trend')], ['rb-estrelas', t('Estrelas', 'Stars')], ['rb-mercados', t('Mercados', 'Markets')], ['rb-recomendacoes', t('Sugestões', 'Suggestions')]].map(([id, lb], i) => (
            <button key={id} onClick={() => ir(id)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: i === 0 ? 'var(--rb-text)' : 'var(--rb-text2)', fontWeight: i === 0 ? 700 : 400, fontSize: 14.5 }}>{lb}</button>
          ))}
        </nav>

        {/* 6. Resumo */}
        {x && (
          <section id="rb-resumo" className="rb-sec rb-2" style={{ gridTemplateColumns: 'minmax(0,.8fr) minmax(0,1.2fr)' }}>
            <h2 className="rb-h2">{tituloResumo}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, margin: 0, color: 'var(--rb-text)' }}>{rico(resumo)}</p>
          </section>
        )}

        {/* 7. Temas */}
        <section id="rb-temas" className="rb-sec">
          <Titulo h={temas.length ? tituloTemas : t('Temas', 'Themes')} cap={t('Comparação entre os últimos 12 meses e os 12–36 meses anteriores', 'Comparison between the last 12 months and the previous 12–36 months')} />
          {temas.length ? (
            <table className="rb-table">
              <thead><tr><th style={{ width: '28%' }}>{t('Tema', 'Theme')}</th><th style={{ width: '20%' }}>{t('Estado', 'Status')}</th><th>{t('O que os visitantes dizem', 'What visitors say')}</th></tr></thead>
              <tbody>{temas.map((z) => <tr key={z.id}><td style={{ fontWeight: 700 }}>{temaNome(z.id)}</td><td><Tag e={z.estado} /></td><td style={{ color: 'var(--rb-text2)' }}>{z.nota}</td></tr>)}</tbody>
            </table>
          ) : (
            <p className="rb-sub" style={{ fontSize: 14.5 }}>{t('Os temas aparecem depois de reanalisar este local: cada comentário com texto é classificado num conjunto fixo de temas.', 'Themes appear after re-analysing this place: each review with text is classified into a fixed set of themes.')}</p>
          )}
        </section>

        {/* Pontos fortes e problemas (como na versão original: verde + / vermelho −) */}
        {a && ((a.keyPraises || []).length > 0 || (a.keyIssues || []).length > 0) && (
          <section id="rb-comentarios" className="rb-sec rb-2" style={{ gap: 16 }}>
            {[
              { titulo: t('Pontos fortes', 'Strengths'), itens: (a.keyPraises || []) as string[], cor: 'var(--rb-good)', fundo: 'var(--rb-good-bg)', sinal: '+', cit: citacoes.pos },
              { titulo: t('Problemas identificados', 'Issues identified'), itens: (a.keyIssues || []) as string[], cor: 'var(--rb-bad)', fundo: 'var(--rb-bad-bg)', sinal: '−', cit: citacoes.neg },
            ].map((col) => (
              <div key={col.titulo} style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 999, background: col.fundo, color: col.cor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{col.sinal}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: col.cor }}>{col.titulo}</span>
                </div>
                {col.itens.length ? col.itens.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none', alignItems: 'flex-start' }}>
                    <span style={{ color: col.cor, fontWeight: 700, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>{col.sinal}</span>
                    <span style={{ fontSize: 15, lineHeight: 1.55 }}>{p}</span>
                  </div>
                )) : <p className="rb-sub">—</p>}
                {col.cit.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--rb-line)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rb-text2)' }}>{t('Nas palavras dos visitantes', 'In visitors’ own words')}</div>
                    {col.cit.map((r) => (
                      <div key={r.id} className="rb-quote" style={{ borderLeftColor: col.cor }}>
                        “{r.t.replace(/\s+/g, ' ').slice(0, 230)}{r.t.length > 230 ? '…' : ''}”
                        <small>{r.s}★ · {mesAno(r.d.slice(0, 7))} · {langName(r.l)}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Problemas por período — detalhe da leitura + números dos temas */}
        {a && (() => {
          const per = v2?.periodos
            ? { recentes: (v2.periodos.recentes || []) as { problema: string; detalhe: string; estado: string }[], anteriores: (v2.periodos.anteriores || []) as { problema: string; detalhe: string; estado: string }[] }
            : { recentes: ((a.issuesRecent || []) as string[]).map((p) => ({ problema: p, detalhe: '', estado: '' })), anteriores: ((a.issuesPrevious || []) as string[]).map((p) => ({ problema: p, detalhe: '', estado: '' })) };
          const tt: { id: string; recNeg: number; prevNeg: number }[] = Array.isArray(v2?.temasTodos) ? v2.temasTodos : [];
          const tR = v2?.textRec || 0, tP = v2?.textPrev || 0;
          const linhasTemas = tt.filter((z) => z.recNeg + z.prevNeg >= 2).map((z) => ({ ...z, pr: tR ? (z.recNeg / tR) * 100 : 0, pp: tP ? (z.prevNeg / tP) * 100 : 0 })).sort((p, q) => q.pr - p.pr || q.recNeg - p.recNeg);
          if (!per.recentes.length && !per.anteriores.length && !linhasTemas.length) return null;
          const maxPct = Math.max(1, ...linhasTemas.map((z) => Math.max(z.pr, z.pp)));
          const nNovo = per.recentes.filter((z) => z.estado === 'novo').length, nDeixou = per.anteriores.filter((z) => z.estado === 'deixou').length;
          const plural = (n: number, s1: string, s2: string) => (n === 1 ? s1 : s2);
          const tituloP = nNovo && nDeixou
            ? t(`${Extenso(nNovo)} ${plural(nNovo, 'problema novo', 'problemas novos')} no último ano; ${extenso(nDeixou)} ${plural(nDeixou, 'deixou', 'deixaram')} de ser ${plural(nDeixou, 'referido', 'referidos')}`, `${nNovo} new ${plural(nNovo, 'issue', 'issues')} in the last year; ${nDeixou} no longer mentioned`)
            : nNovo ? t(`${Extenso(nNovo)} ${plural(nNovo, 'problema novo surgiu', 'problemas novos surgiram')} no último ano`, `${nNovo} new ${plural(nNovo, 'issue', 'issues')} appeared in the last year`)
              : nDeixou ? t(`${Extenso(nDeixou)} ${plural(nDeixou, 'problema deixou', 'problemas deixaram')} de ser ${plural(nDeixou, 'referido', 'referidos')}`, `${nDeixou} ${plural(nDeixou, 'issue is', 'issues are')} no longer mentioned`)
                : t('Os problemas mantêm-se entre os dois períodos', 'Issues remain the same across both periods');
          const tagP = (e: string) => e === 'novo' ? <span className="rb-tag" style={{ border: '1px solid var(--rb-warn)', color: 'var(--rb-warn)', padding: '2px 8px' }}>{t('Novo', 'New')}</span>
            : e === 'persiste' ? <span className="rb-tag" style={{ background: 'var(--rb-warn)', color: 'var(--rb-on)' }}>{t('Persiste', 'Persists')}</span>
              : e === 'deixou' ? <span className="rb-tag" style={{ background: 'var(--rb-muted)', color: 'var(--rb-text2)' }}>{t('Deixou de ser referido', 'No longer mentioned')}</span> : null;
          const coluna = (titulo: string, itens: { problema: string; detalhe: string; estado: string }[], cor: string, fundo: string, base: number) => (
            <div style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: cor, background: fundo, padding: '4px 10px', borderRadius: 999 }}>{titulo}</span>
                {base > 0 && <span style={{ fontSize: 12.5, color: 'var(--rb-text2)' }}>{t(`${fmt(base)} comentários com texto`, `${fmt(base)} reviews with text`)}</span>}
              </div>
              {itens.length ? itens.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 10, padding: '14px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none' }}>
                  <span style={{ color: cor, fontWeight: 700 }}>{i + 1}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.4 }}>{p.problema}</span>
                      {tagP(p.estado)}
                    </div>
                    {p.detalhe && <div style={{ fontSize: 14.5, color: 'var(--rb-text2)', lineHeight: 1.55, marginTop: 5 }}>{p.detalhe}</div>}
                  </div>
                </div>
              )) : <p className="rb-sub">{t('Sem problemas referidos neste período.', 'No issues mentioned in this period.')}</p>}
            </div>
          );
          return (
            <section id="rb-periodos" className="rb-sec">
              <Titulo h={tituloP} cap={t('O que os visitantes apontaram nos últimos 12 meses, comparado com os 12–36 meses anteriores', 'What visitors pointed out in the last 12 months, compared with the previous 12–36 months')} />
              <div className="rb-2" style={{ gap: 16 }}>
                {coluna(t('Últimos 12 meses', 'Last 12 months'), per.recentes, 'var(--rb-bad)', 'var(--rb-bad-bg)', tR)}
                {coluna(t('12 a 36 meses atrás', '12 to 36 months ago'), per.anteriores, 'var(--rb-text2)', 'var(--rb-muted)', tP)}
              </div>
              {linhasTemas.length > 0 && (
                <div className="rb-rise" style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rb-text2)', marginBottom: 6 }}>{t('Críticas por tema nos dois períodos', 'Criticism by theme in both periods')}</div>
                  <table className="rb-table" style={{ fontSize: 14.5 }}>
                    <thead><tr><th style={{ width: '28%' }}>{t('Tema', 'Theme')}</th><th>{t('Últimos 12 meses', 'Last 12 months')}</th><th>{t('12 a 36 meses atrás', '12 to 36 months ago')}</th><th style={{ width: 130 }}>{t('Tendência', 'Trend')}</th></tr></thead>
                    <tbody>{linhasTemas.map((z, i) => {
                      const d = z.pr - z.pp;
                      const tend = d >= 1 ? { txt: t('A agravar', 'Worsening'), cor: 'var(--rb-bad)', seta: '↑' } : d <= -1 ? { txt: t('A melhorar', 'Improving'), cor: 'var(--rb-good)', seta: '↓' } : { txt: t('Estável', 'Stable'), cor: 'var(--rb-text2)', seta: '→' };
                      const celula = (n: number, pct: number, cor: string, op: number) => (
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}><span><strong>{fmt(pct, 1)}%</strong></span><span style={{ color: 'var(--rb-text2)' }}>{fmt(n)} {t(n === 1 ? 'menção' : 'menções', n === 1 ? 'mention' : 'mentions')}</span></div>
                          <div style={{ height: 6, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                            <div className="rb-bar" style={{ width: `${(pct / maxPct) * 100}%`, height: '100%', background: cor, opacity: op, borderRadius: 999, transitionDelay: `${i * 70}ms` }} />
                          </div>
                        </td>
                      );
                      return (
                        <tr key={z.id}>
                          <td style={{ fontWeight: 700 }}>{temaNome(z.id)}</td>
                          {celula(z.recNeg, z.pr, 'var(--rb-bad)', 1)}
                          {celula(z.prevNeg, z.pp, 'var(--rb-text2)', 0.6)}
                          <td style={{ color: tend.cor, fontWeight: 700 }}>{tend.seta} {tend.txt}</td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                  <p className="rb-sub">{t('Percentagem dos comentários com texto de cada período que critica o tema · tendência: diferença de 1 ponto percentual ou mais', 'Share of each period’s reviews with text criticising the theme · trend: a difference of 1 percentage point or more')}</p>
                </div>
              )}
            </section>
          );
        })()}

        {/* Dimensões de avaliação 0–10 */}
        {a && a.dimensions && Object.keys(a.dimensions).length > 0 && (
          <section id="rb-dimensoes" className="rb-sec">
            <Titulo h={t('Dimensões de avaliação', 'Rating dimensions')} cap={t('De 0 a 10 · a partir dos elogios e críticas nos comentários, estabilizado quando há poucas menções · Experiência = índice global', '0 to 10 · from praise and criticism in reviews, stabilised when mentions are few · Experience = overall index')} />
            <div className="rb-2" style={{ gap: '4px 48px' }}>
              {([['localizacao', t('Localização', 'Location')], ['servico', t('Serviço', 'Service')], ['precoQualidade', t('Preço/Qualidade', 'Value for money')], ['limpeza', t('Limpeza', 'Cleanliness')], ['experiencia', t('Experiência', 'Experience')], ['acessibilidade', t('Acessibilidade', 'Accessibility')]] as [string, string][]).map(([k, nome], i) => {
                const v = a.dimensions[k];
                const nm = v2?.dimsN?.[k];
                return (
                  <div key={k} style={{ padding: '14px 0', borderBottom: '1px solid var(--rb-line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontSize: 15.5, fontWeight: 700 }}>{nome}</span>
                      {typeof v === 'number' ? <span style={{ fontSize: 22, fontWeight: 700, color: v < 7 ? 'var(--rb-warn)' : 'var(--rb-text)' }}><Conta v={v} d={1} /><small style={{ fontSize: 13, color: 'var(--rb-text2)', fontWeight: 500 }}>/10</small></span> : <span className="rb-sub" style={{ marginTop: 0 }}>{t('menções insuficientes', 'not enough mentions')}</span>}
                    </div>
                    <div style={{ height: 8, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
                      {typeof v === 'number' && <div className="rb-bar" style={{ width: `${v * 10}%`, height: '100%', borderRadius: 999, background: v < 7 ? 'var(--rb-warn)' : 'var(--rb-accent)', transitionDelay: `${i * 90}ms` }} />}
                    </div>
                    {typeof nm === 'number' && k !== 'experiencia' && <div className="rb-sub" style={{ marginTop: 6 }}>{t(`${fmt(nm)} menções`, `${fmt(nm)} mentions`)}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Evolução + distribuição das estrelas */}
        <div className="rb-2">
          <section id="rb-evolucao" className="rb-sec">
            <Titulo h={tituloEvolucao(qs)} cap={t('Média de estrelas por trimestre · passa o cursor sobre o gráfico', 'Average stars per quarter · hover over the chart')} />
            <Evolucao q={qs} intervencoes={[]} alertaUltimo={!!al} />
          </section>
          <section id="rb-estrelas" className="rb-sec">
            <Titulo h={ws ? tituloDist(ws.dist) : t('Distribuição das estrelas', 'Star distribution')} cap={t('Percentagem de avaliações com cada número de estrelas, últimos 3 anos', 'Share of reviews by number of stars, last 3 years')} />
            {ws ? <DistEstrelas dist={ws.dist} /> : <p className="rb-sub">{t('Disponível depois de importar os comentários.', 'Available after importing reviews.')}</p>}
          </section>
        </div>

        {/* Mercados: quem escreve e o que cada mercado valoriza e critica */}
        <section id="rb-mercados" className="rb-sec">
          <Titulo h={merc.lista.length && merc.temTags ? tituloMercados(merc.lista) : ws ? tituloIdiomas(ws.langs) : t('Mercados', 'Markets')}
            cap={t('Idioma dos comentários como indicador do mercado de origem · percentagens sobre os comentários com texto de cada idioma', 'Review language as an indicator of the source market · percentages of each language’s reviews with text')} />
          <div className="rb-2" style={{ gap: 48, alignItems: 'start' }}>
            <div>
              {ws ? <BarrasIdioma langs={ws.langs} total={ws.n} /> : <p className="rb-sub">{t('Disponível depois de importar os comentários.', 'Available after importing reviews.')}</p>}
              {x && x.semTexto > 0 && <p className="rb-sub">{t(`${fmt(x.semTexto, 1)}% das avaliações são só estrelas, sem texto: contam para a média, mas não dizem de onde vem o visitante.`, `${fmt(x.semTexto, 1)}% of reviews are stars only, without text: they count towards the average but do not reveal where the visitor is from.`)}</p>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rb-text2)', marginBottom: 4 }}>{t('O que cada mercado valoriza e critica', 'What each market values and criticises')}</div>
              {!loc.reviewStats ? <p className="rb-sub">{t('Disponível depois de importar os comentários.', 'Available after importing reviews.')}</p>
                : !revs.length ? <p className="rb-sub">{t('A carregar comentários…', 'Loading reviews…')}</p>
                  : !merc.temTags ? <p className="rb-sub">{t('Reanalisa o local para classificar os comentários por tema.', 'Re-analyse the place to classify reviews by theme.')}</p>
                    : merc.lista.length ? <MercadosDetalhe lista={merc.lista} />
                      : <p className="rb-sub">{t('Nenhum idioma com 10 ou mais comentários com texto.', 'No language with 10 or more reviews with text.')}</p>}
            </div>
          </div>
        </section>

        {/* 10. Sugestões (indicativas — o Município não gere o local) */}
        <section id="rb-recomendacoes" className="rb-sec">
          <Titulo h={t('O que os comentários sugerem', 'What the reviews suggest')} cap={t('Possíveis melhorias identificadas pela IA a partir dos comentários dos visitantes · a título indicativo', 'Possible improvements identified by AI from visitor reviews · for guidance only')} />
          {recs.length ? (
            <div className="rb-3">
              {recs.map((r, i) => (
                <div key={i} className="rb-rise" style={{ border: '1px solid var(--rb-line)', borderRadius: 6, padding: '22px 22px 24px', background: 'var(--rb-surface)', transitionDelay: `${i * 120}ms` }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--rb-accent)', letterSpacing: '-0.02em' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.35, marginTop: 10 }}>{r.titulo}</div>
                  {r.texto && <div style={{ fontSize: 14.5, color: 'var(--rb-text2)', marginTop: 8, lineHeight: 1.55 }}>{r.texto}</div>}
                </div>
              ))}
            </div>
          ) : <p className="rb-sub">{t('As sugestões aparecem depois da análise.', 'Suggestions appear after the analysis.')}</p>}
        </section>

        {/* Gestão do local */}
        {!readOnly && (
          <div className="rb-noprint" style={{ marginTop: 48, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 }}>
            <span style={{ color: 'var(--rb-text2)', marginRight: 6 }}>{t('Gestão do local:', 'Manage place:')}</span>
            <button className="rb-chip ghost" onClick={props.onImport}>{t('Importar comentários', 'Import reviews')}</button>
            <button className="rb-chip ghost" onClick={() => props.onPaste?.(loc.id)}>{t('Colar comentários', 'Paste reviews')}</button>
            <button className="rb-chip ghost" onClick={() => props.onEdit?.(loc.id)}>{t('Editar local', 'Edit place')}</button>
            <button className="rb-chip danger" onClick={() => { if (window.confirm(t(`Apagar "${loc.name}" e todos os seus comentários?`, `Delete "${loc.name}" and all its reviews?`))) props.onDelete?.(loc.id); }}>{t('Apagar local', 'Delete place')}</button>
          </div>
        )}

        {/* 12. Rodapé */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid var(--rb-line)', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--rb-text2)', lineHeight: 1.5 }}>
          <span>{t('Fonte: Google Maps', 'Source: Google Maps')}{x?.from ? `, ${mesAno(x.from)} – ${mesAno(x.to)}` : ''}{loc.reviewStats ? ` · ${t('importado a', 'imported on')} ${dataCurta(loc.reviewStats.lastImport)}` : ''} · {t('índice /10 = média de estrelas × 2', 'index /10 = average stars × 2')}</span>
          <span>{t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTA DE LOCAIS
// ═══════════════════════════════════════════════════════════════════════════
export function LocaisLista(props: {
  locations: LocV[]; analyzing: string | null; batchRun: { i: number; total: number; name: string } | null; catLabel: (c: string) => string;
  onOpen: (id: string) => void; onImport: () => void; onAnalyzeAll: () => void; onAdd: () => void;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const mini = useMiniaturas();
  useRevelar(props.locations.length);
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cats = Array.from(new Set(props.locations.map((l) => l.category))).sort();
  const linhas = props.locations
    .filter((l) => (!cat || l.category === cat) && (!q || norm(l.name).includes(norm(q))))
    .map((l) => ({ l, x: numeros(l), al: alerta(l.reviewStats) }))
    .sort((a, b) => a.l.name.localeCompare(b.l.name, 'pt'));
  const temImportados = props.locations.some((l) => l.reviewStats);
  const situacao = (o: { l: LocV; x: Numeros | null; al: string | null }): ReactNode => {
    if (!o.x) return <span style={{ color: 'var(--rb-text2)' }}>{t('Sem avaliações', 'No reviews')}</span>;
    if (o.x.robustez === 'insuficiente') return <span style={{ color: 'var(--rb-text2)' }}>{t('Dados insuficientes', 'Insufficient data')}</span>;
    if (o.al) return <span style={{ color: 'var(--rb-warn)' }}>{o.al}</span>;
    if (!o.l.analysis?.v2) return <span style={{ color: 'var(--rb-text2)' }}>{t('Por reanalisar com temas', 'Re-analyse for themes')}</span>;
    return <span style={{ color: 'var(--rb-text2)' }}>{t('Sem alertas', 'No alerts')}</span>;
  };
  return (
    <div className="rbx">
      <style>{ESTILO}</style>
      <div className="rb-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--rb-text2)' }}>{t('Reputação', 'Reputation')}</div>
            <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: '8px 0 0' }}>{t('Locais', 'Places')}</h1>
            <p className="rb-cap" style={{ fontSize: 14 }}>{t(`${props.locations.length} locais monitorizados · por ordem alfabética · locais com menos de ${MIN_ROBUSTO} avaliações não têm índice`, `${props.locations.length} places monitored · alphabetical order · places with fewer than ${MIN_ROBUSTO} reviews have no index`)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="rb-btn" onClick={props.onImport}>{t('Importar comentários', 'Import reviews')}</button>
            <button className="rb-btn" disabled={!!props.analyzing || !!props.batchRun || !temImportados} onClick={props.onAnalyzeAll}>{t('Analisar todos', 'Analyse all')}</button>
            <button className="rb-btn p" onClick={props.onAdd}>{t('Adicionar local', 'Add place')}</button>
          </div>
        </div>
        {props.batchRun && (
          <div style={{ marginTop: 20, background: 'var(--rb-accent-bg)', borderRadius: 4, padding: '12px 16px', fontSize: 14.5 }}>
            {t('A analisar', 'Analysing')} {props.batchRun.i} {t('de', 'of')} {props.batchRun.total}: <strong>{props.batchRun.name}</strong>. {t('Mantém esta página aberta até ao fim.', 'Keep this page open until it finishes.')}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '28px 0 8px' }}>
          <input className="rb-field" style={{ flex: '1 1 260px', maxWidth: 360 }} placeholder={t('Pesquisar local', 'Search place')} aria-label={t('Pesquisar local', 'Search place')} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="rb-field" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t('Categoria', 'Category')}>
            <option value="">{t('Todas as categorias', 'All categories')}</option>
            {cats.map((c) => <option key={c} value={c}>{props.catLabel(c)}</option>)}
          </select>
        </div>
        <table className="rb-table rb-rise">
          <thead><tr>
            <th>{t('Local', 'Place')}</th><th className="n">{t('Índice', 'Index')}</th><th className="n rb-hide-m">{t('Média', 'Average')}</th>
            <th className="n rb-hide-m">{t('Comentários', 'Reviews')}</th><th className="rb-hide-m" style={{ paddingLeft: 24 }}>{t('Situação', 'Status')}</th>
          </tr></thead>
          <tbody>
            {linhas.map((o) => {
              const insuf = !o.x || o.x.robustez === 'insuficiente';
              return (
                <tr key={o.l.id} className="rb-row" onClick={() => props.onOpen(o.l.id)}>
                  <td><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><Miniatura src={mini[o.l.id]} /><div><div style={{ fontWeight: 700 }}>{o.l.name}</div><div style={{ fontSize: 13, color: 'var(--rb-text2)' }}>{props.catLabel(o.l.category)}{props.analyzing === o.l.id ? ` · ${t('a analisar…', 'analysing…')}` : ''}</div></div></div></td>
                  <td className="n" style={{ fontWeight: 700, fontSize: 17 }}>{insuf ? <span style={{ color: 'var(--rb-text2)', fontWeight: 400, fontSize: 15 }}>—</span> : fmt(o.x!.idx, 1)}</td>
                  <td className="n rb-hide-m">{o.x ? fmt(o.x.avg, 2) : '—'}</td>
                  <td className="n rb-hide-m">{o.x ? fmt(o.x.n) : '—'}</td>
                  <td className="rb-hide-m" style={{ paddingLeft: 24, fontSize: 14 }}>{situacao(o)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {linhas.length === 0 && <p className="rb-sub">{t('Nenhum local corresponde à pesquisa.', 'No place matches the search.')}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VISÃO GERAL — o destino num relance (sem rankings)
// ═══════════════════════════════════════════════════════════════════════════
const MES_LONGO_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MES_LONGO_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function VisaoGeral(props: { locations: LocV[]; onOpen: (id: string) => void; onOpenList: () => void; onImport: () => void }) {
  const { locations } = props;
  const mini = useMiniaturas();
  const [fundo, setFundo] = useState<string | null>(null);
  const [aCarregarF, setACarregarF] = useState(false);
  const fundoRef = useRef<HTMLInputElement>(null);
  const carrosselRef = useRef<HTMLDivElement>(null);
  useRevelar(locations.length);
  const nMini = Object.keys(mini).length;

  const dados = locations.map((l) => ({ l, x: numeros(l), al: alerta(l.reviewStats), a: l.analysis ? (dispAnalysis(l) as any) : null }));
  const robustos = dados.filter((d) => d.x && d.x.robustez !== 'insuficiente');

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const d = await getDoc(doc(db, 'locationPhotos', '__braga'));
        if (d.exists()) { if (vivo) setFundo((d.data() as any).data || null); return; }
        const comFoto = [...dados].filter((z) => mini[z.l.id]).sort((p, q) => (q.x?.n ?? 0) - (p.x?.n ?? 0))[0];
        if (comFoto) {
          const d2 = await getDoc(doc(db, 'locationPhotos', comFoto.l.id));
          if (vivo && d2.exists()) setFundo((d2.data() as any).data || null);
        }
      } catch { /* sem fotografia de fundo */ }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.length, nMini]);

  const carregarFundo = async (f: File) => {
    setACarregarF(true);
    try {
      const url = URL.createObjectURL(f);
      let data = await reduzir(url, 2200, 0.8);
      if (data.length > 900000) data = await reduzir(url, 1800, 0.66);
      URL.revokeObjectURL(url);
      await setDoc(doc(db, 'locationPhotos', '__braga'), { data, updatedAt: new Date().toISOString() });
      setFundo(data);
    } catch { alert(t('Não foi possível carregar a fotografia.', 'Could not upload the photo.')); } finally { setACarregarF(false); }
  };

  const topoFoto = (
    <div className="rb-hero-top">
      <div style={{ fontSize: 14, color: 'var(--rb-text2)' }}>{t('Reputação · Visão geral', 'Reputation · Overview')}</div>
      <div className="rb-noprint">
        <button className="rb-chip ghost" style={{ background: 'rgba(21,23,27,.5)' }} disabled={aCarregarF} onClick={() => fundoRef.current?.click()}>{aCarregarF ? t('A carregar…', 'Uploading…') : t('Fotografia de fundo', 'Background photo')}</button>
        <input ref={fundoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) carregarFundo(fl); }} />
      </div>
    </div>
  );

  if (!robustos.length) {
    return (
      <div className="rbx"><style>{ESTILO}</style>
        <HeroFoto src={fundo} altura={fundo ? 560 : 380}>
          {topoFoto}
          <div className="rb-enter" style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>Braga</div>
            <h1 className="rb-hero-h1">{t('Ainda sem dados suficientes', 'Not enough data yet')}</h1>
            <p style={{ fontSize: 16, color: 'var(--rb-text2)', lineHeight: 1.6, margin: '0 0 20px' }}>{t(`Importa os comentários do Google Maps e analisa os locais. A partir de ${MIN_ROBUSTO} avaliações por local, o destino aparece aqui.`, `Import the Google Maps reviews and analyse the places. From ${MIN_ROBUSTO} reviews per place, the destination appears here.`)}</p>
            <button className="rb-chip warn" onClick={props.onImport}>{t('Importar comentários', 'Import reviews')} <Seta /></button>
          </div>
        </HeroFoto>
      </div>
    );
  }

  // ── Números do destino (ponderados pelo n.º de avaliações) ──
  const N = robustos.reduce((s, d) => s + d.x!.n, 0);
  const w = (fn: (x: Numeros) => number) => robustos.reduce((s, d) => s + fn(d.x!) * d.x!.n, 0) / N;
  const avg = w((x) => x.avg), pos = w((x) => x.pos), neg = w((x) => x.neg);
  const totalN = dados.reduce((s, d) => s + (d.x?.n ?? 0), 0);
  const alertas = dados.filter((d) => d.al && d.x && d.x.robustez !== 'insuficiente');
  const titulo = alertas.length
    ? t(`Braga mantém ${fmt(avg, 2)} estrelas; ${alertas.length} ${alertas.length === 1 ? 'local mudou' : 'locais mudaram'} no último trimestre`, `Braga holds ${fmt(avg, 2)} stars; ${alertas.length} ${alertas.length === 1 ? 'place changed' : 'places changed'} last quarter`)
    : t(`Braga mantém ${fmt(avg, 2)} estrelas nos locais monitorizados`, `Braga holds ${fmt(avg, 2)} stars across monitored places`);

  // ── Evolução do destino (trimestral, ponderada) ──
  const qa: Record<string, { n: number; s: number }> = {};
  const qneg: Record<string, number> = {};
  dados.forEach((d) => windowStats(d.l.reviewStats)?.quarters.forEach((q) => { if (!qa[q.q]) qa[q.q] = { n: 0, s: 0 }; qa[q.q].n += q.n; qa[q.q].s += q.avg * q.n; qneg[q.q] = (qneg[q.q] || 0) + (q.negPct / 100) * q.n; }));
  const serie = Object.keys(qa).sort().map((q) => ({ q, avg: qa[q].s / qa[q].n, n: qa[q].n, negPct: (qneg[q] / qa[q].n) * 100 })).filter((z) => z.n >= 5);

  // ── Sazonalidade: avaliações por mês do ano (aproxima a afluência) ──
  const corte = cutoffDate().toISOString().slice(0, 7);
  const porMes = Array(12).fill(0) as number[];
  dados.forEach((d) => Object.entries(d.l.reviewStats?.byMonth || {}).forEach(([m, st]) => { if (m >= corte) porMes[+m.slice(5, 7) - 1] += st.n; }));
  const maxMes = Math.max(1, ...porMes);
  const pico = porMes.indexOf(Math.max(...porMes));
  const vale = porMes.indexOf(Math.min(...porMes));
  const temMeses = porMes.some((v) => v > 0);

  // ── O que elogiam / criticam (temas agregados; recurso: listas antigas) ──
  const agreg = (estados: string[], antigos: 'topThemesPositive' | 'topThemesNegative') => {
    const porTema = TEMAS.map((tm) => {
      const ls = dados.filter((d) => d.a?.v2?.temas?.some((z: any) => z.id === tm.id && estados.includes(z.estado)));
      const nota = ls.map((d) => d.a.v2.temas.find((z: any) => z.id === tm.id)?.nota).find((z: any) => !!z) as string | undefined;
      return { chave: tm.id, nome: temaNome(tm.id), n: ls.length, nomes: ls.map((d) => d.l.name), nota };
    }).filter((z) => z.n > 0);
    if (porTema.length) return porTema.sort((p, q) => q.n - p.n).slice(0, 4);
    const cont: Record<string, { nome: string; nomes: string[] }> = {};
    dados.forEach((d) => ((d.a?.[antigos] as string[]) || []).forEach((s) => { const k = s.toLowerCase().trim(); if (!cont[k]) cont[k] = { nome: s, nomes: [] }; cont[k].nomes.push(d.l.name); }));
    return Object.entries(cont).map(([k, v]) => ({ chave: k, nome: v.nome, n: v.nomes.length, nomes: v.nomes, nota: undefined as string | undefined })).sort((p, q) => q.n - p.n).slice(0, 4);
  };
  const elogios = agreg(['forte'], 'topThemesPositive');
  const criticas = agreg(['persistente', 'novo'], 'topThemesNegative');

  // ── Idiomas (uma barra) ──
  const lg: Record<string, { n: number; sum: number }> = {};
  dados.forEach((d) => windowStats(d.l.reviewStats)?.langs.forEach((l) => { if (!lg[l.code]) lg[l.code] = { n: 0, sum: 0 }; lg[l.code].n += l.n; lg[l.code].sum += l.avg * l.n; }));
  const comTexto = Object.entries(lg).filter(([c]) => c !== 'none' && c !== 'und').map(([code, v]) => ({ code, n: v.n, avg: v.sum / v.n })).sort((p, q) => q.n - p.n);
  const nTexto = comTexto.reduce((s, l) => s + l.n, 0);
  const principais = comTexto.slice(0, 5);
  const outros = comTexto.slice(5).reduce((s, l) => s + l.n, 0);
  const semTextoN = lg.none?.n ?? 0, nTodos = Object.values(lg).reduce((s, v) => s + v.n, 0);
  const tons = [1, 0.78, 0.58, 0.42, 0.3, 0.2];

  const ordenados = [...dados].sort((p, q) => p.l.name.localeCompare(q.l.name, 'pt'));
  const desliza = (dir: number) => carrosselRef.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });

  const coluna = ({ titulo: tt, itens, cor, fundoCor, sinal, vazio }: { titulo: string; itens: typeof elogios; cor: string; fundoCor: string; sinal: string; vazio: string }) => (
    <div className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '24px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: fundoCor, color: cor, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 }}>{sinal}</span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: cor }}>{tt}</span>
      </div>
      {itens.length ? itens.map((z, i) => (
        <div key={z.chave} style={{ padding: '14px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}><span style={{ color: cor, marginRight: 8 }}>{sinal}</span>{z.nome}</span>
            <span style={{ fontSize: 13, color: 'var(--rb-text2)', whiteSpace: 'nowrap' }}>{t(`em ${z.n} ${z.n === 1 ? 'local' : 'locais'}`, `at ${z.n} ${z.n === 1 ? 'place' : 'places'}`)}</span>
          </div>
          {z.nota && <div style={{ fontSize: 14.5, color: 'var(--rb-text2)', lineHeight: 1.55, marginTop: 6 }}>{z.nota}</div>}
          <div style={{ fontSize: 12.5, color: 'var(--rb-text2)', marginTop: 6, opacity: 0.8 }}>{z.nomes.slice(0, 4).join(' · ')}{z.nomes.length > 4 ? ` · +${z.nomes.length - 4}` : ''}</div>
        </div>
      )) : <p className="rb-sub">{vazio}</p>}
    </div>
  );

  return (
    <div className="rbx">
      <style>{ESTILO}</style>

      {/* Fotografia de Braga + números do destino em vidro */}
      <HeroFoto src={fundo} altura={fundo ? 660 : 460}>
        {topoFoto}
        <div className="rb-enter" style={{ maxWidth: 880 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>Braga</div>
          <h1 className="rb-hero-h1">{titulo}</h1>
          <p style={{ fontSize: 15, color: 'var(--rb-text2)', lineHeight: 1.55, margin: 0, maxWidth: 680 }}>{t(`Avaliações do Google Maps nos últimos 3 anos · médias ponderadas pelo número de avaliações de cada local.`, `Google Maps reviews over the last 3 years · averages weighted by each place’s number of reviews.`)}</p>
        </div>
        <div className="rb-glass rb-enter" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', animationDelay: '220ms' }}>
          {[
            { l: t('Índice do destino', 'Destination index'), v: <><Conta v={Math.round(avg * 20) / 10} d={1} /><small>/10</small></>, s: t(`${robustos.length} locais com dados suficientes`, `${robustos.length} places with enough data`) },
            { l: t('Média Google', 'Google average'), v: <><Conta v={Math.round(avg * 100) / 100} d={2} /><Estrela /></>, s: t('em 5 estrelas', 'out of 5 stars') },
            { l: t('Avaliações analisadas', 'Reviews analysed'), v: <Conta v={totalN} />, s: t(`${locations.length} locais monitorizados`, `${locations.length} places monitored`) },
            { l: t('Positivos e negativos', 'Positive and negative'), v: <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}><span style={{ color: 'var(--rb-good)' }}><Conta v={Math.round(pos * 10) / 10} d={1} />%</span><span style={{ color: 'var(--rb-bad)', fontSize: 24 }}><Conta v={Math.round(neg * 10) / 10} d={1} />%</span></span>, s: t('positivos 4–5★ · negativos 1–2★', 'positive 4–5★ · negative 1–2★') },
          ].map((k, i) => (
            <div key={i} style={{ padding: '20px 24px', borderLeft: i ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
              <div className="rb-lab">{k.l}</div>
              <div className="rb-big">{k.v}</div>
              <div className="rb-sub">{k.s}</div>
            </div>
          ))}
        </div>
      </HeroFoto>

      <div className="rb-wrap" style={{ paddingTop: 20 }}>
        {/* O que mudou */}
        {alertas.length > 0 && (
          <section className="rb-sec" style={{ paddingTop: 28 }}>
            <Titulo h={t('O que mudou no último trimestre', 'What changed last quarter')} cap={t('Mudanças relevantes face ao trimestre anterior, detetadas automaticamente', 'Relevant changes versus the previous quarter, detected automatically')} />
            <div className="rb-3">
              {alertas.map((d, i) => (
                <div key={d.l.id} className="rb-rise" style={{ background: 'var(--rb-warn-bg)', borderRadius: 6, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, transitionDelay: `${i * 100}ms` }}>
                  <div style={{ fontSize: 16.5, fontWeight: 700 }}>{d.l.name}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.5, flex: 1 }}>{d.al}</div>
                  <div><button className="rb-chip warn" onClick={() => props.onOpen(d.l.id)}>{t('Abrir ficha', 'Open profile')} <Seta /></button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Galeria de locais */}
        <section className="rb-sec">
          <Titulo h={t(`${locations.length} locais monitorizados`, `${locations.length} places monitored`)} cap={t('Desliza para ver todos · por ordem alfabética', 'Scroll to see them all · alphabetical order')}
            right={<div className="rb-noprint" style={{ display: 'flex', gap: 8 }}>
              <button className="rb-chip ghost" aria-label={t('Anteriores', 'Previous')} onClick={() => desliza(-1)} style={{ width: 38, padding: 0, justifyContent: 'center' }}><span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><Seta /></span></button>
              <button className="rb-chip ghost" aria-label={t('Seguintes', 'Next')} onClick={() => desliza(1)} style={{ width: 38, padding: 0, justifyContent: 'center' }}><Seta /></button>
              <button className="rb-chip" onClick={props.onOpenList}>{t('Ver lista', 'See list')} <Seta /></button>
            </div>} />
          <div ref={carrosselRef} className="rb-carrossel">
            {ordenados.map((d, i) => {
              const insuf = !d.x || d.x.robustez === 'insuficiente';
              return (
                <button key={d.l.id} className="rb-card rb-rise" style={{ transitionDelay: `${Math.min(i, 6) * 70}ms` }} onClick={() => props.onOpen(d.l.id)}>
                  {mini[d.l.id] && <img src={mini[d.l.id]} alt="" />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>{d.l.category}</div>
                    <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, margin: '6px 0 10px' }}>{d.l.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14 }}>
                      {d.x ? <span style={{ fontWeight: 700 }}>{fmt(d.x.avg, 2)} <span style={{ color: 'var(--rb-text2)', fontWeight: 400 }}>{t('estrelas', 'stars')}</span></span> : <span style={{ color: 'var(--rb-text2)' }}>{t('Sem avaliações', 'No reviews')}</span>}
                      {insuf && d.x && <span className="rb-tag" style={{ background: 'var(--rb-muted)', color: 'var(--rb-text2)' }}>{t('Dados insuficientes', 'Insufficient data')}</span>}
                      {d.al && !insuf && <span className="rb-tag" style={{ background: 'var(--rb-warn)', color: 'var(--rb-on)' }}>{t('Alerta', 'Alert')}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Evolução + sazonalidade */}
        <div className="rb-2">
          <section className="rb-sec">
            <Titulo h={tituloEvolucao(serie)} cap={t('Média de estrelas do destino, por trimestre', 'Destination average stars, by quarter')} />
            <Evolucao q={serie} intervencoes={[]} alertaUltimo={false} />
          </section>
          <section className="rb-sec">
            <Titulo h={temMeses ? t(`${MES_LONGO_PT[pico]} é o mês com mais avaliações`, `${MES_LONGO_EN[pico]} is the month with the most reviews`) : t('Sazonalidade', 'Seasonality')}
              cap={temMeses ? t(`Avaliações por mês do ano, nos últimos 3 anos · ${MES_LONGO_PT[vale].toLowerCase()} é o mais calmo · indicador aproximado da afluência`, `Reviews by month of the year, last 3 years · ${MES_LONGO_EN[vale]} is the quietest · approximate indicator of visitor flow`) : undefined} />
            {temMeses && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 6, alignItems: 'end', height: 200 }}>
                {porMes.map((v, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: i === pico ? 'var(--rb-text)' : 'var(--rb-text2)', fontWeight: i === pico ? 700 : 400 }}>{fmt(v)}</span>
                    <div className="rb-vbar" style={{ width: '100%', height: `${Math.max(3, (v / maxMes) * 150)}px`, background: 'var(--rb-accent)', opacity: i === pico ? 1 : 0.45, borderRadius: '3px 3px 0 0', transitionDelay: `${i * 60}ms` }} />
                    <span style={{ fontSize: 11.5, color: 'var(--rb-text2)' }}>{t(MESES_PT[i], MESES_EN[i])}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* O que elogiam / o que criticam */}
        <section className="rb-sec">
          <Titulo h={t('O que os visitantes dizem do destino', 'What visitors say about the destination')} cap={t('Temas mais referidos nos comentários de todos os locais', 'Themes most mentioned in reviews across all places')} />
          <div className="rb-2" style={{ gap: 16 }}>
            {coluna({ titulo: t('O que mais elogiam', 'Most praised'), itens: elogios, cor: 'var(--rb-good)', fundoCor: 'var(--rb-good-bg)', sinal: '+', vazio: t('Aparece depois de analisar os locais.', 'Appears after analysing the places.') })}
            {coluna({ titulo: t('O que mais criticam', 'Most criticised'), itens: criticas, cor: 'var(--rb-bad)', fundoCor: 'var(--rb-bad-bg)', sinal: '−', vazio: t('Sem críticas recorrentes nos locais analisados.', 'No recurring criticism in the analysed places.') })}
          </div>
        </section>

        {/* Distribuição das estrelas no destino */}
        {(() => {
          const dist = [0, 0, 0, 0, 0];
          dados.forEach((d) => windowStats(d.l.reviewStats)?.dist.forEach((v, i) => { dist[i] += v; }));
          if (!dist.some((v) => v > 0)) return null;
          return (
            <section className="rb-sec" style={{ maxWidth: 760 }}>
              <Titulo h={tituloDist(dist)} cap={t('Percentagem de avaliações com cada número de estrelas, em todos os locais', 'Share of reviews by number of stars, across all places')} />
              <DistEstrelas dist={dist} />
            </section>
          );
        })()}

        {/* De onde vêm as vozes */}
        {nTexto > 0 && (
          <section className="rb-sec">
            <Titulo h={t(`${langName(principais[0].code)} é a língua mais ouvida nos comentários`, `${langName(principais[0].code)} is the most common review language`)}
              cap={t('Comentários com texto, por idioma · a média de cada idioma entre parênteses', 'Reviews with text, by language · each language’s average in brackets')} />
            <div style={{ display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden', background: 'var(--rb-muted)' }}>
              <div className="rb-bar" style={{ display: 'flex', width: '100%', height: '100%' }}>
                {principais.map((l, i) => <div key={l.code} title={langName(l.code)} style={{ width: `${(l.n / nTexto) * 100}%`, background: 'var(--rb-accent)', opacity: tons[i], borderRight: '2px solid var(--rb-bg)' }} />)}
                {outros > 0 && <div style={{ width: `${(outros / nTexto) * 100}%`, background: 'var(--rb-text2)', opacity: 0.35 }} />}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 28px', marginTop: 16 }}>
              {principais.map((l, i) => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--rb-accent)', opacity: tons[i] }} />
                  <span style={{ fontWeight: 600 }}>{langName(l.code)}</span>
                  <span style={{ color: 'var(--rb-text2)' }}>{fmt((l.n / nTexto) * 100, 0)}% ({fmt(l.avg, 2)})</span>
                </div>
              ))}
              {outros > 0 && <div style={{ fontSize: 14.5, color: 'var(--rb-text2)' }}>{t('Outros', 'Others')} {fmt((outros / nTexto) * 100, 0)}%</div>}
            </div>
            {semTextoN > 0 && <p className="rb-sub" style={{ marginTop: 14 }}>{t(`Além destes, ${fmt((semTextoN / nTodos) * 100, 0)}% das avaliações são só estrelas, sem texto.`, `In addition, ${fmt((semTextoN / nTodos) * 100, 0)}% of reviews are stars only, without text.`)}</p>}
          </section>
        )}

        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid var(--rb-line)', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--rb-text2)' }}>
          <span>{t('Fonte: Google Maps, últimos 3 anos · índice /10 = média de estrelas × 2', 'Source: Google Maps, last 3 years · index /10 = average stars × 2')}</span>
          <span>{t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}</span>
        </div>
      </div>
    </div>
  );
}
