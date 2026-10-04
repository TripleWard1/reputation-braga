'use client';

// ═══════════════════════════════════════════════════════════════════════════
// REPUTAÇÃO — Visão Geral, lista de Locais e Ficha do local
// Segue o mockup aprovado (versão escura). Na impressão/PDF usa a versão clara.
// Todos os números vêm de app/lib/temas.ts → numeros() (fonte única).
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from './modo';
import { t } from '@/app/lib/i18n';
import { dispAnalysis } from '@/app/lib/ai-translate';
import { limparFotoBraga } from '@/app/lib/foto-braga';
import { windowStats, langName, cutoffDate, loadWindowReviews, parseReviewFile, groupByPlace, buildStats, type StoredReview, type ReviewStats } from '@/app/lib/reviews';
import { SEMESTRE_2026, BALCAO, DORMIDAS_BRAGA, DORMIDAS_PORTUGAL, MESES } from '@/app/lib/observatorio-dados';
import { BILHETEIRA, BILHETEIRA_FONTE, type Bilheteira } from '@/app/lib/bilheteira-dados';
import { UNESCO_BOM_JESUS } from '@/app/lib/unesco-bom-jesus';
import {
  TEMAS, temaNome, estadoNome, numeros, ranking, alerta, numerosCoerentes, numerosPermitidos, resumoModelo,
  MIN_ROBUSTO, type Estado, type LocMin, type Numeros,
} from '@/app/lib/temas';

export interface Intervencao { id: string; date: string; desc: string }
export interface Afluencia { dias: (number | null)[][]; ordem?: string; fonte?: string; recolhidoEm?: string }
export interface Atributos { secoes: { titulo: string; itens: { texto: string; sim: boolean }[] }[]; horario?: string[] | null; recolhidoEm?: string }
export interface WikiDados { titulo: string; idiomas: { lang: string; titulo: string }[]; vistas: Record<string, Record<string, number>>; atualizadoEm: string }
export interface LocV extends LocMin { coords?: [number, number]; interventions?: Intervencao[]; afluencia?: Afluencia; atributos?: Atributos; wiki?: WikiDados }

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
function HeroFoto({ src, altura, children, mini }: { src: string | null; altura: number; children: ReactNode; mini?: string }) {
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
      {src && <div ref={ref} className="rb-hero-img"><div className="rb-kb" style={{ backgroundImage: mini ? `url(${src}), url(${mini})` : `url(${src})` }} /></div>}
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
.rb-hero-top > div:first-child { color: #ECEDEF !important; background: rgba(21,23,27,.62); border: 1px solid rgba(255,255,255,.14); border-radius: 999px; padding: 6px 14px; font-size: 13.5px !important; font-weight: 600; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 6px 18px -8px rgba(0,0,0,.6); }
.rb-hero-top > div:first-child .rb-crumb { color: #ECEDEF; text-decoration: underline; text-decoration-color: rgba(236,237,239,.35); text-underline-offset: 3px; }
.rb-hero-top > div:first-child .rb-crumb:hover { text-decoration-color: #ECEDEF; }
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
.rb-vg-logo { position: absolute; top: 96px; left: 0; right: 0; display: flex; justify-content: center; pointer-events: none; }
.rb-vg-logo img { width: clamp(240px, 34vw, 480px); height: auto; display: block; filter: drop-shadow(0 4px 18px rgba(0,0,0,.25)); }
@media (max-width: 900px) { .rb-vg-logo { position: relative; top: auto; margin: 4px 0 22px; } .rb-vg-logo img { width: 220px; } }
@media print { .rb-vg-logo { display: none; } }
.rb-vg-placa { display: none; }
@media (max-width: 900px) {
  /* Telemóvel: logótipo centrado numa placa branca; sem o "BRAGA" (repetia o logótipo e não se lia sobre o céu) */
  .rb-vg-top { margin-bottom: 40px !important; justify-content: center !important; }
  .rb-vg-top > div:first-child { display: none !important; }
  .rb-vg-placa { display: flex; align-items: center; justify-content: center; gap: 16px; width: 100%; }
  .rb-vg-placa::before, .rb-vg-placa::after { content: ''; flex: 0 1 36px; height: 1px; background: rgba(236,237,239,.45); }
  .rb-vg-placa img { height: 28px; width: auto; display: block; filter: drop-shadow(0 2px 10px rgba(0,0,0,.45)); animation: rbFadeUp .7s ease both; }
  .rb-vg-logo { display: none !important; }
  .rb-kicker { display: none !important; }
  /* Texto legível sobre fotografias claras (céu, nuvens) */
  .rb-hero-shade { background: linear-gradient(180deg, rgba(21,23,27,.55) 0%, rgba(21,23,27,0) 24%), linear-gradient(0deg, var(--rb-bg) 0%, rgba(21,23,27,.78) 45%, rgba(21,23,27,.5) 75%, rgba(21,23,27,.35) 100%) !important; }
}
.rb-only-m { display: none; }
@media (prefers-reduced-motion: reduce) {
  .rb-sec, .rb-rise, .rb-dot { opacity: 1 !important; transform: none !important; transition: none !important; }
  .rb-draw { stroke-dashoffset: 0 !important; transition: none !important; }
  .rb-bar { transform: none !important; transition: none !important; }
  .rb-enter, .rb-kb { animation: none !important; }
}
@media (max-width: 900px) {
  .rb-hero-foto { height: auto !important; min-height: 360px; }
  .rb-hero-in { padding: 16px 20px 28px; justify-content: flex-start; }
  .rb-hero-top { position: static; margin-bottom: 64px; gap: 12px; }
  .rb-hero-top .rb-btn, .rb-hero-top .rb-chip { height: 34px; padding: 0 12px; font-size: 13px; }
  .rb-hero-h1 { font-size: 32px; margin: 10px 0 12px; }
  .rb-big { font-size: 30px; white-space: nowrap; }
  .rb-big small { font-size: 14px; }
  .rb-big .rb-sec2 { font-size: 18px !important; }
  .rb-estrela { width: 22px; height: 22px; margin-left: 6px; }
  .rb-strip > div { padding: 16px 14px 16px 16px; }
  .rb-strip > div:nth-child(n+3) { border-top: 1px solid var(--rb-line); }
  .rb-anc { flex-wrap: nowrap !important; overflow-x: auto; white-space: nowrap; gap: 20px !important; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .rb-anc::-webkit-scrollbar { display: none; }
  .rb-stack thead { display: none; }
  .rb-stack tr { display: block; padding: 14px 0; border-bottom: 1px solid var(--rb-line); }
  .rb-stack td { display: block; border: 0 !important; padding: 4px 0 !important; width: auto !important; }
  .rb-stack td[data-l]::before { content: attr(data-l); display: block; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--rb-text2); margin: 6px 0 4px; }
  .rb-kpis { grid-template-columns: 1fr 1fr !important; }
  .rb-kpis > div { padding: 14px 14px 16px !important; border-left: 0 !important; border-top: 1px solid rgba(255,255,255,.08); }
  .rb-kpis > div:nth-child(-n+2) { border-top: 0; }
  .rb-kpis > div:nth-child(even) { border-left: 1px solid rgba(255,255,255,.08) !important; }
  .rb-h2 { font-size: 23px; }
  .rb-wrap { padding: 24px 20px 48px; }
  .rb-strip { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .rb-strip > div:nth-child(3) { border-left: 0; padding-left: 0; }
  .rb-2, .rb-3, .rb-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
  .rb-card { flex-basis: 220px; height: 300px; }
  .rb-hide-m { display: none; }
  .rb-only-m { display: block; }
  .rb-h1-m { font-size: 34px !important; }
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
  .rb-unesco-ecra { display: none !important; } .rb-unesco-print { display: block !important; }
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
          <span className="rb-sec2" style={{ color: 'var(--rb-bad)', fontSize: 24 }}><Conta v={x.neg} d={1} />%</span>
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
  const caixa = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(560);
  useEffect(() => {
    const el = caixa.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (el.clientWidth) setCw(Math.round(el.clientWidth)); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (q.length < 2) return <p className="rb-sub">{t('Ainda não há trimestres suficientes para mostrar a evolução.', 'Not enough quarters yet to show the trend.')}</p>;
  const W = Math.max(300, cw), H = cw < 500 ? 220 : 250, L = 38, R = 16, T = 24, B = 28;
  const min = Math.min(...q.map((x) => x.avg)), max = Math.max(...q.map((x) => x.avg));
  const lo = Math.max(1, Math.floor((min - 0.15) * 10) / 10), hi = Math.min(5, Math.ceil((max + 0.1) * 10) / 10);
  const X = (i: number) => L + (i * (W - L - R)) / (q.length - 1);
  const Y = (v: number) => T + ((hi - v) / (hi - lo || 1)) * (H - T - B);
  const lab = (s2: string) => { const [y, tq] = s2.split('-T'); return `T${tq} ${y.slice(2)}`; };
  const labLongo = (s2: string) => { const [y, tq] = s2.split('-T'); return t(`${tq}.º trimestre de ${y}`, `Q${tq} ${y}`); };
  const step = Math.ceil(q.length / Math.max(3, Math.floor((W - L - R) / 72)));
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
    <div ref={caixa} style={{ position: 'relative' }}>
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


// ─── AFLUÊNCIA HABITUAL (gráfico do Google Maps recolhido pelo extrator) ────
const DIAS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DIAS_CURTO_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_CURTO_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function resumoAfluencia(a: Afluencia) {
  let pico = { d: -1, h: -1, v: -1 };
  const somaDia = a.dias.map((hs) => hs.reduce((s2: number, v) => s2 + (v || 0), 0));
  a.dias.forEach((hs, d) => hs.forEach((v, h) => { if (v != null && v > pico.v) pico = { d, h, v }; }));
  const comDados = somaDia.map((v, d) => ({ v, d })).filter((z) => z.v > 0);
  const calmo = comDados.length ? comDados.reduce((p, q) => (q.v < p.v ? q : p)) : null;
  const forte = comDados.length ? comDados.reduce((p, q) => (q.v > p.v ? q : p)) : null;
  // janela de pico: horas contíguas ≥ 80% do máximo no dia de pico
  let ini = pico.h, fim = pico.h;
  if (pico.d >= 0) { const hs = a.dias[pico.d]; while (ini > 0 && (hs[ini - 1] || 0) >= pico.v * 0.8) ini--; while (fim < 23 && (hs[fim + 1] || 0) >= pico.v * 0.8) fim++; }
  return { pico, ini, fim, calmo, forte };
}
function AfluenciaMapa({ a }: { a: Afluencia }) {
  const hs = Array.from({ length: 17 }, (_, i) => i + 7); // 7h–23h
  const max = Math.max(1, ...a.dias.flatMap((d) => d.map((v) => v || 0)));
  const nomes = t('pt', 'en') === 'pt' ? DIAS_CURTO_PT : DIAS_CURTO_EN;
  return (
    <div className="rb-scroll-x">
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${hs.length}, minmax(22px, 1fr))`, gap: 3, minWidth: 560, alignItems: 'center' }}>
        <span />
        {hs.map((h) => <span key={h} style={{ fontSize: 10.5, color: 'var(--rb-text2)', textAlign: 'center' }}>{h % 3 === 0 ? `${h}h` : ''}</span>)}
        {a.dias.map((d, di) => (
          <div key={di} style={{ display: 'contents' }}>
            <span style={{ fontSize: 12, color: 'var(--rb-text2)', fontWeight: 600 }}>{nomes[di] || di + 1}</span>
            {hs.map((h, hi) => {
              const v = d[h] || 0;
              return <span key={h} className="rb-rise" title={`${nomes[di]} ${h}h · ${v}%`} style={{ height: 26, borderRadius: 3, background: v ? `rgba(138,176,230,${0.08 + (v / max) * 0.85})` : 'var(--rb-muted)', transitionDelay: `${(di * 17 + hi) * 6}ms`, boxShadow: v === max ? '0 0 0 2px var(--rb-star) inset' : 'none' }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, color: 'var(--rb-text2)', marginTop: 10 }}>
        <span>{t('menos movimento', 'quieter')}</span>
        <span style={{ display: 'inline-flex', gap: 2 }}>{[0.1, 0.3, 0.5, 0.7, 0.93].map((o) => <span key={o} style={{ width: 18, height: 10, borderRadius: 2, background: `rgba(138,176,230,${o})` }} />)}</span>
        <span>{t('mais movimento', 'busier')}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}><span style={{ width: 12, height: 10, borderRadius: 2, boxShadow: '0 0 0 2px var(--rb-star) inset' }} />{t('pico da semana', 'weekly peak')}</span>
      </div>
    </div>
  );
}



// ─── PATRIMÓNIO MUNDIAL (só no Bom Jesus) — informação técnica, sem história ─────
const eBomJesus = (nome: string) => /bom jesus/i.test(nome);
function LogoUnesco({ tam = 56 }: { tam?: number }) {
  return (
    <>
      <img className="rb-unesco-ecra" src="/unesco-patrimonio-mundial.png" alt={t('Património Mundial da UNESCO', 'UNESCO World Heritage')} width={tam} height={tam} style={{ display: 'block' }} />
      <img className="rb-unesco-print" src="/unesco-patrimonio-mundial-preto.png" alt="" width={tam} height={tam} style={{ display: 'none' }} />
    </>
  );
}
function SecaoUnesco() {
  const U: any = UNESCO_BOM_JESUS;
  const [aba, setAba] = useState<'ficha' | 'conservacao' | 'acoes'>('ficha');
  useRevelar(aba); // revela o conteúdo do separador escolhido (sem isto ficava invisível)
  const L = t('pt', 'en') as 'pt' | 'en';
  const feitas = U.acoes.filter((a: any) => a.estado === 'feito').length;
  const abas: [typeof aba, string][] = [['ficha', t('Inscrição', 'Inscription')], ['conservacao', t('Estado de conservação 2025', 'State of conservation 2025')], ['acoes', t(`Ações e planos · ${feitas}/${U.acoes.length} concluídas`, `Actions and plans · ${feitas}/${U.acoes.length} completed`)]];
  const caixa = { background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '16px 18px' } as CSSProperties;
  return (
    <section id="rb-unesco" className="rb-sec">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <LogoUnesco tam={64} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 className="rb-h2" style={{ margin: 0 }}>{t('Património Mundial da UNESCO desde 2019', 'UNESCO World Heritage since 2019')}</h2>
          <p className="rb-cap" style={{ marginTop: 6 }}>{t('Paisagem cultural inscrita pelos critérios (ii) e (iv) · o que a UNESCO avalia e pede ao Estado Português', 'Cultural landscape inscribed under criteria (ii) and (iv) · what UNESCO assesses and asks of Portugal')}</p>
        </div>
      </div>
      <div className="rb-noprint" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {abas.map(([id, nome]) => <button key={id} className={`rb-chip${aba === id ? '' : ' ghost'}`} onClick={() => setAba(id)}>{nome}</button>)}
      </div>

      {aba === 'ficha' && (
        <div className="rb-rise rb-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 16 }}>
          <div style={caixa}>
            {U.ficha.map((x: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none', fontSize: 14 }}>
                <span style={{ color: 'var(--rb-text2)' }}>{x[L][0]}</span><span style={{ fontWeight: 600 }}>{x[L][1]}</span>
              </div>
            ))}
          </div>
          <div style={caixa}>
            <div className="rb-lab">{t('Área protegida', 'Protected area')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0 14px' }}><span className="rb-big" style={{ fontSize: 40 }}><Conta v={U.areas.total} /></span><span style={{ color: 'var(--rb-text2)' }}>{t('hectares', 'hectares')}</span></div>
            <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', background: 'var(--rb-muted)' }}>
              <div className="rb-bar" style={{ width: `${(U.areas.bem / U.areas.total) * 100}%`, background: 'var(--rb-star)' }} />
              <div className="rb-bar" style={{ width: `${(U.areas.tampao / U.areas.total) * 100}%`, background: 'rgba(138,176,230,.55)', transitionDelay: '150ms' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, marginTop: 10 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--rb-star)', marginRight: 6 }} />{t('Bem inscrito', 'Inscribed property')}: <strong>{U.areas.bem} ha</strong></span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(138,176,230,.55)', marginRight: 6 }} />{t('Zona tampão', 'Buffer zone')}: <strong>{U.areas.tampao} ha</strong></span>
            </div>
            <p className="rb-sub" style={{ marginTop: 14 }}>{t('A zona tampão é 9 vezes maior do que o bem: qualquer obra nessa área pode ter de ser avaliada quanto ao impacto no Património Mundial.', 'The buffer zone is 9 times larger than the property: any works there may require a heritage impact assessment.')}</p>
          </div>
        </div>
      )}

      {aba === 'conservacao' && (
        <div className="rb-rise" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={caixa}>
            <div className="rb-lab" style={{ marginBottom: 10 }}>{t('Fatores que afetam o bem (2025)', 'Factors affecting the property (2025)')}</div>
            {U.fatores2025[L].map((x: string) => <div key={x} style={{ display: 'flex', gap: 10, padding: '7px 0', fontSize: 14 }}><span style={{ color: 'var(--rb-warn)', fontWeight: 700 }}>!</span>{x}</div>)}
            <div className="rb-lab" style={{ margin: '16px 0 8px' }}>{t('Visitantes', 'Visitors')}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{U.visitantes[L]}</div>
            <div className="rb-lab" style={{ margin: '16px 0 8px' }}>{t('Prevenção de incêndios', 'Fire prevention')}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{t(`Associação Sacromontes de Braga e Guimarães: cerca de ${fmt(U.incendios.sacromontes_ha)} ha de área florestal envolvente. Faixas de gestão de combustível: ${fmt(U.incendios.faixas_ha, 1)} ha.`, `Sacromontes Association of Braga and Guimarães: about ${fmt(U.incendios.sacromontes_ha)} ha of surrounding forest. Fuel management strips: ${fmt(U.incendios.faixas_ha, 1)} ha.`)}</div>
          </div>
          <div style={caixa}>
            <div className="rb-lab" style={{ marginBottom: 10 }}>{t('O que o Comité do Património Mundial pede (decisão 47 COM 7B.122, 2025)', 'What the World Heritage Committee requests (decision 47 COM 7B.122, 2025)')}</div>
            {U.pedidos.map((x: any, i: number) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, padding: '8px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none', fontSize: 14, lineHeight: 1.5 }}><span style={{ color: 'var(--rb-accent)', fontWeight: 700 }}>{i + 1}</span>{x[L]}</div>)}
          </div>
          <div style={{ ...caixa, gridColumn: '1 / -1', background: 'var(--rb-accent-bg)', border: '1px solid rgba(138,176,230,.3)' }}>
            <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{t('Esta plataforma já responde a parte do pedido 6: os temas "Gestão de fluxos", "Acesso e estacionamento" e "Limpeza e conservação", a afluência e a evolução dos comentários desta ficha são indicadores do impacto da visitação, atualizados a partir das avaliações dos visitantes.', 'This platform already addresses part of request 6: the "Visitor flow", "Access and parking" and "Cleanliness and upkeep" themes, busyness and the review trend on this page are indicators of visitor impact, updated from visitor reviews.')}</div>
            <div className="rb-sub" style={{ marginTop: 8 }}>{t('Grupos de indicadores em desenvolvimento para o parque e a mata: ', 'Indicator groups being developed for the park and woodland: ')}{U.indicadores[L].join(' · ')}</div>
          </div>
        </div>
      )}

      {aba === 'acoes' && (
        <div className="rb-rise" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={caixa}>
            <div className="rb-lab" style={{ marginBottom: 10 }}>{t('Obras e intervenções', 'Works and interventions')}</div>
            {U.acoes.map((a: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr)', gap: 10, padding: '9px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none' }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, marginTop: 5, background: a.estado === 'feito' ? 'var(--rb-good)' : 'transparent', border: `2px solid ${a.estado === 'feito' ? 'var(--rb-good)' : 'var(--rb-warn)'}` }} />
                <div><div style={{ fontSize: 14, fontWeight: 600 }}>{a[L]}</div><div style={{ fontSize: 12.5, color: a.estado === 'feito' ? 'var(--rb-good)' : 'var(--rb-text2)', marginTop: 2 }}>{a.estado === 'feito' ? t('Concluído', 'Completed') : `${t('Previsto', 'Scheduled')}: ${a.quando}`}</div></div>
              </div>
            ))}
          </div>
          <div style={caixa}>
            <div className="rb-lab" style={{ marginBottom: 10 }}>{t('Planos e documentos', 'Plans and documents')}</div>
            {U.planos.map((p: any, i: number) => (
              <div key={i} style={{ padding: '9px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p[L]}</div><div style={{ fontSize: 12.5, color: 'var(--rb-text2)', marginTop: 2 }}>{p.quando}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="rb-sub">{t('Datas segundo o relatório de Portugal à UNESCO (janeiro de 2025) e a decisão do Comité (2025); confirma o ponto de situação atual com a Confraria. ', 'Dates according to Portugal’s report to UNESCO (January 2025) and the Committee decision (2025); check current status with the Confraternity. ')}{t('Fonte', 'Source')}: {U.fonte}</p>
    </section>
  );
}

// ─── ENTRADAS E BILHETEIRA (dados enviados pelas entidades) ────────────────
const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MES_CURTO_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mesRot = (m: string) => `${t(MES_CURTO[+m.slice(5, 7) - 1], MES_CURTO_EN[+m.slice(5, 7) - 1])} ${m.slice(2, 4)}`;
function bilheteiraDe(nome: string): Bilheteira | null {
  const n = nome.toLowerCase();
  if (/theatro circo/.test(n)) return BILHETEIRA['theatro circo'] || null;
  if (/gnration/.test(n)) return BILHETEIRA['gnration'] || null;
  if (/\bbma\b|braga media arts/.test(n)) return BILHETEIRA['bma'] || null;
  return null;
}
function SecaoBilheteira({ b, stats }: { b: Bilheteira; stats: any }) {
  const meses = Object.keys(b.meses).sort();
  const tot = meses.reduce((s2, m) => s2 + b.meses[m].bilhetes, 0);
  const sess = meses.reduce((s2, m) => s2 + b.meses[m].sessoes, 0);
  const rec = meses.reduce((s2, m) => s2 + b.meses[m].receita, 0);
  const conv = meses.reduce((s2, m) => s2 + b.meses[m].convites, 0);
  const comLot = meses.filter((m) => b.meses[m].lotacao);
  const ocup = comLot.length ? (comLot.reduce((s2, m) => s2 + (b.meses[m].ocupados || 0), 0) / comLot.reduce((s2, m) => s2 + (b.meses[m].lotacao || 0), 0)) * 100 : null;
  const max = Math.max(1, ...meses.map((m) => b.meses[m].bilhetes));
  const pico = meses.reduce((p, m) => (b.meses[m].bilhetes > b.meses[p].bilhetes ? m : p), meses[0]);
  // cruzamento com os comentários: estrelas do mês (só meses com 3 ou mais avaliações)
  const est = (m: string) => { const z = stats?.byMonth?.[m]; return z && z.n >= 3 ? { avg: z.sum / z.n, n: z.n } : null; };
  const comEst = meses.filter((m) => est(m));
  let cruz: string | null = null;
  if (comEst.length >= 6) {
    const ord = [...comEst].sort((p, q) => b.meses[q].bilhetes - b.meses[p].bilhetes);
    const terco = Math.max(2, Math.floor(ord.length / 3));
    const media = (ms: string[]) => { const n = ms.reduce((s2, m) => s2 + est(m)!.n, 0); return ms.reduce((s2, m) => s2 + est(m)!.avg * est(m)!.n, 0) / n; };
    const alto = media(ord.slice(0, terco)), baixo = media(ord.slice(-terco));
    const d = alto - baixo;
    cruz = Math.abs(d) < 0.05
      ? t(`A satisfação não muda com a afluência: ${fmt(alto, 2)} estrelas nos meses com mais público e ${fmt(baixo, 2)} nos meses com menos.`, `Satisfaction does not change with attendance: ${fmt(alto, 2)} stars in the busiest months and ${fmt(baixo, 2)} in the quietest.`)
      : d < 0 ? t(`A satisfação desce quando há mais gente: ${fmt(alto, 2)} estrelas nos meses com mais público, contra ${fmt(baixo, 2)} nos meses com menos.`, `Satisfaction drops when it is busier: ${fmt(alto, 2)} stars in the busiest months vs ${fmt(baixo, 2)} in the quietest.`)
        : t(`A satisfação até sobe quando há mais gente: ${fmt(alto, 2)} estrelas nos meses com mais público, contra ${fmt(baixo, 2)} nos meses com menos.`, `Satisfaction even rises when it is busier: ${fmt(alto, 2)} stars in the busiest months vs ${fmt(baixo, 2)} in the quietest.`);
  }
  const tipos = Object.entries(b.tipos).sort((p, q) => q[1] - p[1]).slice(0, 6);
  const maxT = Math.max(1, ...tipos.map((x) => x[1]));
  return (
    <section id="rb-bilheteira" className="rb-sec">
      <Titulo h={t(`${fmt(tot)} bilhetes em ${meses.length} meses; o mês mais forte foi ${mesRot(pico)}`, `${fmt(tot)} tickets in ${meses.length} months; the strongest month was ${mesRot(pico)}`)} cap={`${b.entidade} · ${BILHETEIRA_FONTE}`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { l: t('Bilhetes', 'Tickets'), v: <Conta v={tot} />, s: t(`${fmt((conv / Math.max(1, tot)) * 100, 0)}% convites`, `${fmt((conv / Math.max(1, tot)) * 100, 0)}% complimentary`) },
          { l: t('Sessões', 'Sessions'), v: <Conta v={sess} />, s: t(`${fmt(tot / Math.max(1, sess), 0)} bilhetes por sessão`, `${fmt(tot / Math.max(1, sess), 0)} tickets per session`) },
          { l: t('Receita', 'Revenue'), v: <><Conta v={Math.round(rec / 100) / 10} d={1} /><small>mil €</small></>, s: t('montante total de bilheteira', 'total box office') },
          ...(ocup != null ? [{ l: t('Ocupação média', 'Average occupancy'), v: <><Conta v={Math.round(ocup * 10) / 10} d={1} /><small>%</small></>, s: t('meses com lotação registada (2026)', 'months with recorded capacity (2026)') }] : []),
        ].map((k, i) => (
          <div key={i} className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '16px 18px', transitionDelay: `${i * 70}ms` }}>
            <div className="rb-lab">{k.l}</div><div className="rb-big" style={{ fontSize: 30 }}>{k.v}</div><div className="rb-sub">{k.s}</div>
          </div>
        ))}
      </div>
      <div className="rb-scroll-x">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${meses.length}, minmax(34px, 1fr))`, gap: 6, alignItems: 'end', height: 230, minWidth: meses.length * 40 }}>
          {meses.map((m, i) => { const e = est(m); return (
            <div key={m} title={`${mesRot(m)} · ${fmt(b.meses[m].bilhetes)} ${t('bilhetes', 'tickets')}${e ? ` · ${fmt(e.avg, 2)} ★ (${e.n})` : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: e ? (e.avg >= 4.5 ? 'var(--rb-star)' : 'var(--rb-warn)') : 'transparent' }}>{e ? fmt(e.avg, 1) : '·'}</span>
              <div className="rb-vbar" style={{ width: '100%', height: `${Math.max(3, (b.meses[m].bilhetes / max) * 150)}px`, background: m === pico ? 'var(--rb-accent)' : 'rgba(138,176,230,.5)', borderRadius: '3px 3px 0 0', transitionDelay: `${i * 45}ms` }} />
              <span style={{ fontSize: 10.5, color: 'var(--rb-text2)', whiteSpace: 'nowrap' }}>{mesRot(m)}</span>
            </div>
          ); })}
        </div>
      </div>
      <p className="rb-sub">{t('Barras: bilhetes por mês · número por cima: média de estrelas dos comentários do Google nesse mês (só meses com 3 ou mais avaliações)', 'Bars: tickets per month · number on top: average Google review stars that month (only months with 3+ reviews)')}</p>
      {cruz && <p style={{ fontSize: 15, lineHeight: 1.6, margin: '12px 0 0', padding: '12px 16px', background: 'var(--rb-accent-bg)', borderRadius: 4 }}>{cruz}</p>}
      <div className="rb-2" style={{ marginTop: 26, gap: '20px 48px' }}>
        <div>
          <div className="rb-lab" style={{ marginBottom: 8 }}>{t('Bilhetes por tipo de espetáculo', 'Tickets by type of show')}</div>
          {tipos.map(([tp, v], i) => (
            <div key={tp} style={{ margin: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>{tp}</span><strong>{fmt(v)}</strong></div>
              <div style={{ height: 7, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}><div className="rb-bar" style={{ width: `${(v / maxT) * 100}%`, height: '100%', background: 'var(--rb-accent)', borderRadius: 999, transitionDelay: `${i * 80}ms` }} /></div>
            </div>
          ))}
        </div>
        <div>
          <div className="rb-lab" style={{ marginBottom: 8 }}>{t('Espetáculos com mais público', 'Shows with the largest audiences')}</div>
          {b.topEventos.slice(0, 8).map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none', fontSize: 14 }}>
              <span style={{ minWidth: 0 }}>{e.evento}<span style={{ color: 'var(--rb-text2)', fontSize: 12 }}> · {e.periodo.split(' a ').map(mesRot).join(' a ')}</span></span><strong style={{ whiteSpace: 'nowrap' }}>{fmt(e.bilhetes)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── INTERESSE ONLINE (visualizações da Wikipédia por língua) ──────────────
const WIKI_LINGUAS = ['pt', 'en', 'es', 'fr', 'de', 'it', 'nl', 'pl'];
async function recolherWiki(nome: string, tituloPt?: string): Promise<WikiDados | null> {
  let titulo = tituloPt;
  if (!titulo) {
    const r = await fetch(`https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(nome)}&limit=1&namespace=0&format=json&origin=*`).then((x) => x.json());
    titulo = r?.[1]?.[0];
    if (!titulo) return null;
  }
  const ll = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(titulo)}&lllimit=500&redirects=1&format=json&origin=*`).then((x) => x.json());
  const pag: any = Object.values(ll?.query?.pages || {})[0];
  if (!pag || pag.missing !== undefined) return null;
  const idiomas = [{ lang: 'pt', titulo: pag.title as string }, ...((pag.langlinks || []) as any[]).filter((l) => WIKI_LINGUAS.includes(l.lang)).map((l) => ({ lang: l.lang as string, titulo: l['*'] as string }))];
  const fim = new Date(); fim.setDate(1); fim.setDate(0); // último dia do mês passado
  const ini = new Date(fim.getFullYear() - 3, fim.getMonth() + 1, 1);
  const d8 = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}00`;
  const vistas: Record<string, Record<string, number>> = {};
  for (const i of idiomas) {
    try {
      const r = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${i.lang}.wikipedia/all-access/user/${encodeURIComponent(i.titulo.replace(/ /g, '_'))}/monthly/${d8(ini)}/${d8(fim)}`).then((x) => (x.ok ? x.json() : null));
      const o: Record<string, number> = {};
      (r?.items || []).forEach((it: any) => { o[`${String(it.timestamp).slice(0, 4)}-${String(it.timestamp).slice(4, 6)}`] = it.views; });
      if (Object.keys(o).length) vistas[i.lang] = o;
    } catch { /* língua sem dados */ }
  }
  return { titulo: pag.title, idiomas, vistas, atualizadoEm: new Date().toISOString() };
}
const CORES_LINGUA: Record<string, string> = { pt: '#8AB0E6', en: '#7CC79A', es: '#EDA06B', fr: '#C9A0E6', de: '#E9C46A', it: '#E39AC0', nl: '#6FC8D6', pl: '#A3A8B1' };
function SecaoWiki({ loc, readOnly, onSave }: { loc: LocV; readOnly?: boolean; onSave?: (w: WikiDados) => Promise<void> | void }) {
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const w = loc.wiki;
  const ligar = async (atualizar: boolean) => {
    setErro(null);
    let tit = atualizar ? w?.titulo : undefined;
    if (!atualizar) {
      const sug = await fetch(`https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(loc.name)}&limit=1&namespace=0&format=json&origin=*`).then((x) => x.json()).catch(() => null);
      const r = window.prompt(t('Título do artigo na Wikipédia em português (confirma ou corrige):', 'Article title on the Portuguese Wikipedia (confirm or correct):'), sug?.[1]?.[0] || loc.name);
      if (!r) return;
      tit = r.trim();
    }
    setACarregar(true);
    try {
      const d = await recolherWiki(loc.name, tit);
      if (!d) { setErro(t('Não encontrei esse artigo na Wikipédia em português.', 'Article not found on the Portuguese Wikipedia.')); return; }
      await onSave?.(d);
    } catch (e: any) { setErro(t('Não foi possível ligar à Wikipédia: ', 'Could not reach Wikipedia: ') + (e?.message || '')); } finally { setACarregar(false); }
  };
  if (!w) {
    if (readOnly) return null;
    return (
      <section id="rb-wiki" className="rb-sec">
        <Titulo h={t('Interesse online', 'Online interest')} cap={t('Visualizações mensais do artigo na Wikipédia, por língua · gratuito e automático', 'Monthly article views on Wikipedia, by language · free and automatic')} />
        <button className="rb-btn p" disabled={aCarregar} onClick={() => ligar(false)}>{aCarregar ? t('A recolher…', 'Collecting…') : t('Ligar à Wikipédia', 'Connect to Wikipedia')}</button>
        {erro && <p className="rb-sub" style={{ color: 'var(--rb-warn)' }}>{erro}</p>}
      </section>
    );
  }
  const todosMeses = Array.from(new Set(Object.values(w.vistas).flatMap((o) => Object.keys(o)))).sort();
  const ult12 = todosMeses.slice(-12), ant12 = todosMeses.slice(-24, -12);
  const linhas = Object.entries(w.vistas).map(([lg, o]) => {
    const a = ult12.reduce((s2, m) => s2 + (o[m] || 0), 0), b = ant12.reduce((s2, m) => s2 + (o[m] || 0), 0);
    return { lg, a, b, v: b ? ((a - b) / b) * 100 : null };
  }).sort((p, q) => q.a - p.a);
  const totA = linhas.reduce((s2, z) => s2 + z.a, 0);
  const estr = linhas.filter((z) => z.lg !== 'pt' && z.v != null && z.b >= 300).sort((p, q) => (q.v || 0) - (p.v || 0));
  const top = estr[0];
  const titulo = top && top.v! > 5 ? t(`O interesse em ${langName(top.lg).toLowerCase()} subiu ${fmt(top.v!, 0)}% no último ano`, `Interest in ${langName(top.lg)} rose ${fmt(top.v!, 0)}% in the last year`)
    : t(`${fmt(totA)} visualizações na Wikipédia nos últimos 12 meses`, `${fmt(totA)} Wikipedia views in the last 12 months`);
  const series = linhas.slice(0, 5).map((z) => ({ nome: langName(z.lg), cor: CORES_LINGUA[z.lg] || '#A3A8B1', q: todosMeses.map((m) => ({ q: m, avg: w.vistas[z.lg]?.[m] || 0, n: 1 })) }));
  return (
    <section id="rb-wiki" className="rb-sec">
      <Titulo h={titulo} cap={t(`Visualizações mensais do artigo "${w.titulo}" na Wikipédia, por língua · atualizado a ${dataCurta(w.atualizadoEm)}`, `Monthly views of the "${w.titulo}" article on Wikipedia, by language · updated ${dataCurta(w.atualizadoEm)}`)}
        right={!readOnly ? <button className="rb-chip ghost" disabled={aCarregar} onClick={() => ligar(true)}>{aCarregar ? t('A atualizar…', 'Updating…') : t('Atualizar', 'Update')}</button> : undefined} />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13.5, marginBottom: 12 }}>
        {series.map((sr) => <span key={sr.nome} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: sr.cor }} />{sr.nome}</span>)}
      </div>
      <LinhasComparadas series={series} rotulo={mesRot} casas={0} zero />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 20 }}>
        {linhas.map((z, i) => (
          <div key={z.lg} className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '12px 14px', transitionDelay: `${i * 50}ms` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: CORES_LINGUA[z.lg] || '#A3A8B1' }} />{langName(z.lg)}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{fmt(z.a)}</div>
            <div className="rb-sub" style={{ marginTop: 2 }}>{fmt(totA ? (z.a / totA) * 100 : 0, 0)}% · {z.v == null ? t('sem ano anterior', 'no previous year') : <span style={{ color: z.v >= 0 ? 'var(--rb-good)' : 'var(--rb-bad)', fontWeight: 700 }}>{z.v >= 0 ? '+' : ''}{fmt(z.v, 0)}% {t('vs ano anterior', 'vs previous year')}</span>}</div>
          </div>
        ))}
      </div>
      {erro && <p className="rb-sub" style={{ color: 'var(--rb-warn)' }}>{erro}</p>}
      <p className="rb-sub">{t('Só pessoas (sem robôs), todos os dispositivos · Fonte: Wikimedia (API pública)', 'People only (no bots), all devices · Source: Wikimedia (public API)')}</p>
    </section>
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
  onSaveWiki?: (id: string, w: WikiDados) => Promise<void> | void;
}) {
  const { loc, locations, readOnly } = props;
  // Botões de alteração só para o administrador (o modo só leitura dos links públicos continua igual)
  const admin = useAdmin();
  const soLeitura = !!readOnly || !admin;
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
      if (data && !soLeitura) {
        const th = await getDoc(doc(db, 'locationThumbs', loc.id));
        if (!th.exists()) await setDoc(doc(db, 'locationThumbs', loc.id), { data: await reduzir(data, 560, 0.74) });
      }
    }).catch(() => {});
    return () => { vivo = false; };
  }, [loc.id, soLeitura]);

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
            {!soLeitura && <button className="rb-btn" onClick={() => props.onShare?.(loc.id)}>{props.copied ? t('Link copiado', 'Link copied') : t('Link partilhável', 'Shareable link')}</button>}
            <button className="rb-btn" onClick={() => window.print()}>{t('Exportar PDF', 'Export PDF')}</button>
            {!soLeitura && <button className="rb-btn p" disabled={!!props.analyzing} onClick={() => props.onReanalyze?.(loc.id)}>{props.analyzing === loc.id ? t('A analisar…', 'Analysing…') : t('Reanalisar', 'Re-analyse')}</button>}
          </div>
        </div>
        <div className="rb-enter" style={{ maxWidth: 820 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>{props.catLabel(loc.category)}</div>
          <h1 className="rb-hero-h1">{loc.name}</h1>
          <div style={{ fontSize: 14, color: 'var(--rb-text2)', lineHeight: 1.5 }}>
            {[loc.coords ? `${loc.coords[0].toFixed(4)}, ${loc.coords[1].toFixed(4)}` : '', 'Google Maps', loc.lastAnalyzed ? t(`analisado a ${dataCurta(loc.lastAnalyzed)}`, `analysed on ${dataCurta(loc.lastAnalyzed)}`) : t('ainda não analisado', 'not analysed yet')].filter(Boolean).join(' · ')}
          </div>
          {eBomJesus(loc.name) && (
            <a href="#rb-unesco" onClick={(e) => { e.preventDefault(); document.getElementById('rb-unesco')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="rb-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '8px 16px 8px 8px', textDecoration: 'none', color: 'var(--rb-text)', borderRadius: 999 }}>
              <LogoUnesco tam={36} />
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{t('Património Mundial da UNESCO', 'UNESCO World Heritage')}<span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--rb-text2)' }}>{t('desde 2019 · paisagem cultural', 'since 2019 · cultural landscape')}</span></span>
            </a>
          )}
        </div>
      </HeroFoto>
      <div className="rb-wrap rb-enter" style={{ paddingTop: 0, animationDelay: '120ms' }}>
        {!soLeitura && (
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
        {!soLeitura && v2 && x && v2.n !== x.n && (
          <div className="rb-noprint" style={{ marginTop: 16, fontSize: 14, color: 'var(--rb-text2)' }}>
            {t(`Há avaliações novas desde a última análise (${fmt(v2.n)} → ${fmt(x.n)}). Os números estão atualizados; reanalisa para atualizar os textos e os temas.`, `There are new reviews since the last analysis (${fmt(v2.n)} → ${fmt(x.n)}). Numbers are current; re-analyse to update texts and themes.`)}
          </div>
        )}

        {/* 5. Âncoras */}
        <nav className="rb-noprint rb-anc" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 28, paddingBottom: 12, borderBottom: '1px solid var(--rb-line)', fontSize: 14.5 }}>
          {[['rb-resumo', t('Resumo', 'Summary')], ...(eBomJesus(loc.name) ? [['rb-unesco', 'UNESCO']] : []), ['rb-temas', t('Temas', 'Themes')], ['rb-comentarios', t('Pontos fortes e problemas', 'Strengths and issues')], ['rb-periodos', t('Problemas por período', 'Issues by period')], ['rb-dimensoes', t('Dimensões', 'Dimensions')], ['rb-evolucao', t('Evolução', 'Trend')], ['rb-estrelas', t('Estrelas', 'Stars')], ...(loc.afluencia?.dias?.length ? [['rb-afluencia', t('Afluência', 'Busyness')]] : []), ...(bilheteiraDe(loc.name) ? [['rb-bilheteira', t('Bilheteira', 'Box office')]] : []), ['rb-wiki', t('Interesse online', 'Online interest')], ...(loc.atributos ? [['rb-google', t('Google', 'Google')]] : []), ['rb-mercados', t('Mercados', 'Markets')], ['rb-recomendacoes', t('Sugestões', 'Suggestions')]].map(([id, lb], i) => (
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
        {eBomJesus(loc.name) && <SecaoUnesco />}

        <section id="rb-temas" className="rb-sec">
          <Titulo h={temas.length ? tituloTemas : t('Temas', 'Themes')} cap={t('Comparação entre os últimos 12 meses e os 12–36 meses anteriores', 'Comparison between the last 12 months and the previous 12–36 months')} />
          {temas.length ? (
            <table className="rb-table rb-stack">
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
                  <table className="rb-table rb-stack" style={{ fontSize: 14.5 }}>
                    <thead><tr><th style={{ width: '28%' }}>{t('Tema', 'Theme')}</th><th>{t('Últimos 12 meses', 'Last 12 months')}</th><th>{t('12 a 36 meses atrás', '12 to 36 months ago')}</th><th style={{ width: 130 }}>{t('Tendência', 'Trend')}</th></tr></thead>
                    <tbody>{linhasTemas.map((z, i) => {
                      const d = z.pr - z.pp;
                      const tend = d >= 1 ? { txt: t('A agravar', 'Worsening'), cor: 'var(--rb-bad)', seta: '↑' } : d <= -1 ? { txt: t('A melhorar', 'Improving'), cor: 'var(--rb-good)', seta: '↓' } : { txt: t('Estável', 'Stable'), cor: 'var(--rb-text2)', seta: '→' };
                      const celula = (n: number, pct: number, cor: string, op: number, rot: string) => (
                        <td data-l={rot}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14 }}><span><strong>{fmt(pct, 1)}%</strong></span><span style={{ color: 'var(--rb-text2)' }}>{fmt(n)} {t(n === 1 ? 'menção' : 'menções', n === 1 ? 'mention' : 'mentions')}</span></div>
                          <div style={{ height: 6, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                            <div className="rb-bar" style={{ width: `${(pct / maxPct) * 100}%`, height: '100%', background: cor, opacity: op, borderRadius: 999, transitionDelay: `${i * 70}ms` }} />
                          </div>
                        </td>
                      );
                      return (
                        <tr key={z.id}>
                          <td style={{ fontWeight: 700 }}>{temaNome(z.id)}</td>
                          {celula(z.recNeg, z.pr, 'var(--rb-bad)', 1, t('Últimos 12 meses', 'Last 12 months'))}
                          {celula(z.prevNeg, z.pp, 'var(--rb-text2)', 0.6, t('12 a 36 meses atrás', '12 to 36 months ago'))}
                          <td data-l={t('Tendência', 'Trend')} style={{ color: tend.cor, fontWeight: 700 }}>{tend.seta} {tend.txt}</td>
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
            <Titulo h={tituloEvolucao(qs)} cap={t('Média de estrelas por trimestre · passa o cursor ou toca no gráfico', 'Average stars per quarter · hover or tap the chart')} />
            <Evolucao q={qs} intervencoes={[]} alertaUltimo={!!al} />
          </section>
          <section id="rb-estrelas" className="rb-sec">
            <Titulo h={ws ? tituloDist(ws.dist) : t('Distribuição das estrelas', 'Star distribution')} cap={t('Percentagem de avaliações com cada número de estrelas, últimos 3 anos', 'Share of reviews by number of stars, last 3 years')} />
            {ws ? <DistEstrelas dist={ws.dist} /> : <p className="rb-sub">{t('Disponível depois de importar os comentários.', 'Available after importing reviews.')}</p>}
          </section>
        </div>

        {/* Afluência habitual */}
        {loc.afluencia && loc.afluencia.dias?.length > 0 && (() => {
          const r = resumoAfluencia(loc.afluencia!);
          const dn = t('pt', 'en') === 'pt' ? DIAS_PT : DIAS_EN;
          const critFluxos = temas.filter((z) => (z.id === 'fluxos' || z.id === 'acesso') && (z.estado === 'persistente' || z.estado === 'novo'));
          return (
            <section id="rb-afluencia" className="rb-sec">
              <Titulo h={r.pico.d >= 0 ? t(`Mais movimento ${dn[r.pico.d] === 'Sábado' || dn[r.pico.d] === 'Domingo' ? 'ao' : 'à'} ${dn[r.pico.d].toLowerCase()}, entre as ${r.ini}h e as ${r.fim + 1}h`, `Busiest on ${dn[r.pico.d]}, between ${r.ini}:00 and ${r.fim + 1}:00`) : t('Afluência habitual', 'Usual busyness')}
                cap={t('Afluência habitual por dia e hora, segundo o Google Maps', 'Usual busyness by day and hour, according to Google Maps')} />
              <AfluenciaMapa a={loc.afluencia!} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {r.forte && <span className="rb-tag" style={{ background: 'var(--rb-accent-bg)', color: 'var(--rb-accent)', padding: '6px 12px' }}>{t('Dia mais movimentado', 'Busiest day')}: {dn[r.forte.d]}</span>}
                {r.calmo && <span className="rb-tag" style={{ background: 'var(--rb-muted)', color: 'var(--rb-text2)', padding: '6px 12px' }}>{t('Dia mais calmo', 'Quietest day')}: {dn[r.calmo.d]}</span>}
              </div>
              {critFluxos.length > 0 && (
                <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: '14px 0 0', padding: '12px 16px', background: 'var(--rb-warn-bg)', borderRadius: 4 }}>
                  {t(`As críticas a ${critFluxos.map((z) => temaNome(z.id).toLowerCase()).join(' e ')} tendem a concentrar-se nestes picos. Informar os visitantes sobre as horas mais calmas pode aliviar a pressão.`, `Criticism of ${critFluxos.map((z) => temaNome(z.id).toLowerCase()).join(' and ')} tends to concentrate at these peaks. Telling visitors about quieter hours may ease the pressure.`)}
                </p>
              )}
              {loc.afluencia!.recolhidoEm && <p className="rb-sub">{t(`Recolhido a ${dataCurta(loc.afluencia!.recolhidoEm)} · padrão habitual, não em tempo real`, `Collected on ${dataCurta(loc.afluencia!.recolhidoEm)} · usual pattern, not real time`)}</p>}
            </section>
          );
        })()}

        {bilheteiraDe(loc.name) && <SecaoBilheteira b={bilheteiraDe(loc.name)!} stats={loc.reviewStats} />}

        <SecaoWiki loc={loc} readOnly={soLeitura} onSave={props.onSaveWiki ? (w) => props.onSaveWiki!(loc.id, w) : undefined} />

        {/* O que o Google diz sobre o local ("Acerca de" e horário) */}
        {loc.atributos && ((loc.atributos.secoes || []).length > 0 || (loc.atributos.horario || []).length > 0) && (() => {
          const limpa = (x: string) => x.replace(/[\uE000-\uF8FF\u2713\u2714\u2715\u2716\u2717\u2718\u00D7\u25A1\u25AF\uFFFD]/g, '').replace(/\s+/g, ' ').trim();
          const MENUS_MAPA = /map tools|map type|ferramentas do mapa|tipo de mapa|camadas|layers|map details|detalhes do mapa/i;
          const TIT: Record<string, string> = { accessibility: 'Acessibilidade', 'service options': 'Opções de serviço', amenities: 'Comodidades', parking: 'Estacionamento', children: 'Crianças', payments: 'Pagamentos', planning: 'Planeamento', highlights: 'Destaques', crowd: 'Público', offerings: 'Oferta', atmosphere: 'Ambiente', 'from the business': 'Da entidade', pets: 'Animais' };
          const at0 = loc.atributos!;
          const at = { ...at0, horario: (at0.horario || []).map(limpa).filter(Boolean), secoes: (at0.secoes || []).filter((sc) => !MENUS_MAPA.test(sc.titulo)).map((sc) => ({ titulo: t(TIT[limpa(sc.titulo).toLowerCase()] || limpa(sc.titulo), limpa(sc.titulo)), itens: sc.itens.map((i) => ({ ...i, texto: limpa(i.texto) })).filter((i) => i.texto) })).filter((sc) => sc.itens.length) };
          const todos = at.secoes.flatMap((sc) => sc.itens);
          const tem = (re: RegExp) => todos.some((i) => i.sim && re.test(i.texto));
          const prob = (id: string) => temas.some((z) => z.id === id && (z.estado === 'persistente' || z.estado === 'novo'));
          const notas: string[] = [];
          if (prob('acessibilidade') && tem(/cadeira de rodas|wheelchair/i)) notas.push(t('O local declara acesso para cadeira de rodas, mas há críticas de acessibilidade nos comentários. Vale a pena confirmar no terreno.', 'The place declares wheelchair access, but reviews criticise accessibility. Worth checking on site.'));
          if (prob('servicos') && !tem(/casa de banho|casas de banho|wc|toilet|restroom/i)) notas.push(t('Há críticas a serviços e equipamentos, e o Google não indica casas de banho neste local.', 'Services and facilities are criticised, and Google lists no toilets at this place.'));
          if (prob('acesso') && !tem(/estacionamento|parking/i)) notas.push(t('Há críticas ao acesso e estacionamento, e o Google não indica estacionamento neste local.', 'Access and parking are criticised, and Google lists no parking at this place.'));
          return (
            <section id="rb-google" className="rb-sec">
              <Titulo h={t('O que o Google diz sobre o local', 'What Google says about the place')} cap={t('Informação declarada no separador "Acerca de" do Google Maps', 'Information declared in the Google Maps "About" tab')} />
              {notas.map((n, i) => <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, margin: '0 0 10px', padding: '12px 16px', background: 'var(--rb-warn-bg)', borderRadius: 4 }}>{n}</p>)}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {(at.horario || []).length > 0 && (
                  <div className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--rb-accent)', marginBottom: 8 }}>{t('Horário', 'Opening hours')}</div>
                    {(at.horario || []).map((h, i) => <div key={i} style={{ fontSize: 14, padding: '4px 0', borderTop: i ? '1px solid var(--rb-line)' : 'none' }}>{h}</div>)}
                  </div>
                )}
                {(at.secoes || []).map((sc, si) => (
                  <div key={sc.titulo} className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '16px 18px', transitionDelay: `${si * 60}ms` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--rb-accent)', marginBottom: 8 }}>{sc.titulo}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {sc.itens.map((it, i) => (
                        <span key={i} className="rb-tag" style={{ background: it.sim ? 'var(--rb-good-bg)' : 'var(--rb-muted)', color: it.sim ? 'var(--rb-good)' : 'var(--rb-text2)', fontWeight: 600, padding: '5px 10px', textDecoration: it.sim ? 'none' : 'line-through' }}>{it.sim ? '✓ ' : '✕ '}{it.texto}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {at.recolhidoEm && <p className="rb-sub">{t(`Recolhido a ${dataCurta(at.recolhidoEm)} · informação declarada pelo local no Google, não verificada`, `Collected on ${dataCurta(at.recolhidoEm)} · information declared by the place on Google, not verified`)}</p>}
            </section>
          );
        })()}

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
        {!soLeitura && (
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
  onOpen: (id: string) => void; onImport: () => void; onAnalyzeAll: () => void; onAdd: () => void; onStopBatch?: () => void; pendentesLote?: number; onContinueBatch?: () => void;
}) {
  const admin = useAdmin();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const mini = useMiniaturas();
  useRevelar(props.locations.length);
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cats = Array.from(new Set(props.locations.map((l) => l.category))).sort();
  const linhas = props.locations
    .filter((l) => (!cat || l.category === cat) && (!q || norm(l.name).includes(norm(q))))
    .map((l) => ({ l, x: numeros(l), al: alerta(l.reviewStats) }))
    .sort((a, b) => {
      const ra = a.x && a.x.robustez !== 'insuficiente' ? 1 : 0, rb = b.x && b.x.robustez !== 'insuficiente' ? 1 : 0;
      return rb - ra || (b.x?.idx ?? -1) - (a.x?.idx ?? -1) || (b.x?.n ?? 0) - (a.x?.n ?? 0) || a.l.name.localeCompare(b.l.name, 'pt');
    });
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
            <h1 className="rb-h1-m" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: '8px 0 0' }}>{t('Locais', 'Places')}</h1>
            <p className="rb-cap" style={{ fontSize: 14 }}>{t(`${props.locations.length} locais monitorizados · do índice mais alto para o mais baixo · locais com menos de ${MIN_ROBUSTO} avaliações ficam no fim, sem índice`, `${props.locations.length} places monitored · highest to lowest index · places with fewer than ${MIN_ROBUSTO} reviews are listed last, without an index`)}</p>
          </div>
          {admin && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="rb-btn" onClick={props.onImport}>{t('Importar comentários', 'Import reviews')}</button>
            {props.batchRun ? (
              <button className="rb-btn" onClick={props.onStopBatch} style={{ borderColor: 'var(--rb-warn)', color: 'var(--rb-warn)' }}>{t(`Parar (${props.batchRun.i}/${props.batchRun.total})`, `Stop (${props.batchRun.i}/${props.batchRun.total})`)}</button>
            ) : (
              <>
                {!!props.pendentesLote && <button className="rb-btn p" disabled={!!props.analyzing} onClick={props.onContinueBatch}>{t(`Continuar (faltam ${props.pendentesLote})`, `Continue (${props.pendentesLote} left)`)}</button>}
                <button className="rb-btn" disabled={!!props.analyzing || !temImportados} onClick={props.onAnalyzeAll}>{t('Reanalisar todos', 'Re-analyse all')}</button>
              </>
            )}
            <button className="rb-btn p" onClick={props.onAdd}>{t('Adicionar local', 'Add place')}</button>
          </div>}
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
                  <td><div style={{ display: 'flex', gap: 16, alignItems: 'center' }}><Miniatura src={mini[o.l.id]} /><div><div style={{ fontWeight: 700 }}>{o.l.name}</div><div style={{ fontSize: 13, color: 'var(--rb-text2)' }}>{props.catLabel(o.l.category)}{props.analyzing === o.l.id ? ` · ${t('a analisar…', 'analysing…')}` : ''}</div><div className="rb-only-m" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{situacao(o)}</div></div></div></td>
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

// Fotografia da Visão Geral: Avenida da Liberdade (public/visao-geral.jpg) + miniatura instantânea
const FOTO_VISAO = '/visao-geral.jpg';
const FOTO_VISAO_MINI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAARACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCZJVlMbpGY1Y8DOc1sGWC7tWijRiqnnADHP1rkbIagpj+UBVx94D15rThtryJi6XioTknC5qlWaepLpJrQTUoreDCQMXlZcndxtOeuPzrFe2mkVpPtO3H8AJBP0q9Jb3LtMftG+QMc7h9446/SqUltc4wJSvIwBnp/n+dROrKT3KhTjFbGzF0px70UVkaFQ/8AH4f+uY/nT3oooA//2Q==';

export function VisaoGeral(props: { locations: LocV[]; onOpen: (id: string) => void; onOpenList: () => void; onImport: () => void; onObservatorio?: () => void }) {
  const admin = useAdmin();
  const { locations } = props;
  const mini = useMiniaturas();
  const [fundo, setFundo] = useState<string | null>(FOTO_VISAO);
  const [aCarregarF, setACarregarF] = useState(false);
  const fundoRef = useRef<HTMLInputElement>(null);
  const carrosselRef = useRef<HTMLDivElement>(null);
  const alertasRef = useRef<HTMLDivElement>(null);
  useRevelar(locations.length);
  const nMini = Object.keys(mini).length;

  const dados = locations.map((l) => ({ l, x: numeros(l), al: alerta(l.reviewStats), a: l.analysis ? (dispAnalysis(l) as any) : null }));
  const robustos = dados.filter((d) => d.x && d.x.robustez !== 'insuficiente');


  const carregarFundo = async (f: File) => {
    setACarregarF(true);
    try {
      const url = URL.createObjectURL(f);
      let data = await reduzir(url, 2200, 0.8);
      if (data.length > 900000) data = await reduzir(url, 1800, 0.66);
      URL.revokeObjectURL(url);
      await setDoc(doc(db, 'locationPhotos', '__braga'), { data, updatedAt: new Date().toISOString() });
      limparFotoBraga();
      setFundo(data);
    } catch { alert(t('Não foi possível carregar a fotografia.', 'Could not upload the photo.')); } finally { setACarregarF(false); }
  };

  const topoFoto = (
    <div className="rb-hero-top rb-vg-top">
      <div style={{ fontSize: 14, color: 'var(--rb-text2)' }}>{t('Reputação · Visão geral', 'Reputation · Overview')}</div>
      <div className="rb-vg-placa"><img src="/visit-braga-logo-negativo.png" alt="Visit Braga" /></div>
    </div>
  );

  if (!robustos.length) {
    return (
      <div className="rbx"><style>{ESTILO}</style>
        <HeroFoto src={fundo} mini={FOTO_VISAO_MINI} altura={fundo ? 560 : 380}>
          {topoFoto}
          <div className="rb-enter" style={{ maxWidth: 760 }}>
            <div className="rb-kicker" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>Braga</div>
            <h1 className="rb-hero-h1">{t('Ainda sem dados suficientes', 'Not enough data yet')}</h1>
            <p style={{ fontSize: 16, color: 'var(--rb-text2)', lineHeight: 1.6, margin: '0 0 20px' }}>{t(`Importa os comentários do Google Maps e analisa os locais. A partir de ${MIN_ROBUSTO} avaliações por local, o destino aparece aqui.`, `Import the Google Maps reviews and analyse the places. From ${MIN_ROBUSTO} reviews per place, the destination appears here.`)}</p>
            {admin && <button className="rb-chip warn" onClick={props.onImport}>{t('Importar comentários', 'Import reviews')} <Seta /></button>}
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
      <HeroFoto src={fundo} mini={FOTO_VISAO_MINI} altura={fundo ? 660 : 460}>
        {topoFoto}
        <div className="rb-vg-logo"><img className="rb-enter" src="/visit-braga-logo.png" alt="Visit Braga" /></div>
        <div className="rb-enter" style={{ maxWidth: 880 }}>
          <div className="rb-kicker" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>Braga</div>
          <h1 className="rb-hero-h1">{titulo}</h1>
          <p style={{ fontSize: 15, color: 'var(--rb-text2)', lineHeight: 1.55, margin: 0, maxWidth: 680 }}>{t(`Avaliações do Google Maps nos últimos 3 anos · médias ponderadas pelo número de avaliações de cada local.`, `Google Maps reviews over the last 3 years · averages weighted by each place’s number of reviews.`)}</p>
        </div>
        <div className="rb-glass rb-kpis rb-enter" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', animationDelay: '220ms' }}>
          {[
            { l: t('Índice do destino', 'Destination index'), v: <><Conta v={Math.round(avg * 20) / 10} d={1} /><small>/10</small></>, s: t(`${robustos.length} locais com dados suficientes`, `${robustos.length} places with enough data`) },
            { l: t('Média Google', 'Google average'), v: <><Conta v={Math.round(avg * 100) / 100} d={2} /><Estrela /></>, s: t('em 5 estrelas', 'out of 5 stars') },
            { l: t('Avaliações analisadas', 'Reviews analysed'), v: <Conta v={totalN} />, s: t(`${locations.length} locais monitorizados`, `${locations.length} places monitored`) },
            { l: t('Positivos e negativos', 'Positive and negative'), v: <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}><span style={{ color: 'var(--rb-good)' }}><Conta v={Math.round(pos * 10) / 10} d={1} />%</span><span className="rb-sec2" style={{ color: 'var(--rb-bad)', fontSize: 24 }}><Conta v={Math.round(neg * 10) / 10} d={1} />%</span></span>, s: t('positivos 4–5★ · negativos 1–2★', 'positive 4–5★ · negative 1–2★') },
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
        {/* Turismo em Braga — o essencial do Observatório (mesmas contas; os dados não são alterados) */}
        {(() => {
          const S: any = SEMESTRE_2026 as any;
          const H1 = (MESES as any[]).slice(0, 6);
          const somaH1 = (serie: any, y: string) => H1.reduce((acc: number, m: any) => acc + (serie?.[m]?.[y] ?? 0), 0);
          const soma = (v: number[]) => v.reduce((a2, b2) => a2 + b2, 0);
          const media = (v: number[]) => soma(v) / v.length;
          const varP = (a2: number, b2: number) => Math.round((b2 / a2 - 1) * 1000) / 10;
          const dorm = somaH1(DORMIDAS_BRAGA, '2026'), dormV = varP(somaH1(DORMIDAS_BRAGA, '2025'), dorm), dormPT = varP(somaH1(DORMIDAS_PORTUGAL, '2025'), somaH1(DORMIDAS_PORTUGAL, '2026'));
          const prov = soma(S.proveitos.Braga['2026']), provV = varP(soma(S.proveitos.Braga['2025']), prov);
          const revpar = media(S.revpar.Braga['2026']), revparV = varP(media(S.revpar.Braga['2025']), revpar);
          const est = S.residencia.dormidas.Estrangeiro, res = S.residencia.dormidas.Portugal;
          const topM = [...S.mercadosDormidas].sort((x: any[], y: any[]) => y[2] - x[2])[0];
          const anosB = Object.keys(BALCAO as any).sort(); const anoB = anosB[anosB.length - 1]; const balc = (BALCAO as any)[anoB];
          if (!dorm) return null;
          const sinal = (v: number) => `${v >= 0 ? '+' : ''}${fmt(v, 1)}%`;
          const cartoes = [
            { l: t('Dormidas · jan–jun 2026', 'Overnight stays · Jan–Jun 2026'), v: <Conta v={dorm} />, s: t(`${sinal(dormV)} face a 2025 · Portugal ${sinal(dormPT)}`, `${sinal(dormV)} vs 2025 · Portugal ${sinal(dormPT)}`), c: dormV >= dormPT ? 'var(--rb-good)' : 'var(--rb-text2)' },
            { l: t('Proveitos do alojamento', 'Accommodation revenue'), v: <><Conta v={Math.round(prov / 10000) / 100} d={2} /><small>M€</small></>, s: t(`${sinal(provV)} face a 2025`, `${sinal(provV)} vs 2025`), c: provV >= 0 ? 'var(--rb-good)' : 'var(--rb-bad)' },
            { l: 'RevPAR', v: <><Conta v={Math.round(revpar * 10) / 10} d={1} /><small>€</small></>, s: t(`${sinal(revparV)} face a 2025 · média dos 6 meses`, `${sinal(revparV)} vs 2025 · 6-month average`), c: revparV >= 0 ? 'var(--rb-good)' : 'var(--rb-bad)' },
            { l: t('Dormidas de estrangeiros', 'Foreign overnight stays'), v: <><Conta v={Math.round((est / (est + res)) * 1000) / 10} d={1} /><small>%</small></>, s: topM ? t(`Maior mercado: ${topM[0]} (${fmt((topM[2] / est) * 100, 1)}%)`, `Largest market: ${topM[0]} (${fmt((topM[2] / est) * 100, 1)}%)`) : '', c: 'var(--rb-text2)' },
            ...(balc ? [{ l: t(`Atendimentos no Posto · ${anoB}`, `Tourist Office visits · ${anoB}`), v: <Conta v={balc.atendimentos} />, s: t(`${fmt(balc.pax)} pessoas atendidas`, `${fmt(balc.pax)} people served`), c: 'var(--rb-text2)' }] : []),
          ];
          return (
            <section className="rb-sec" style={{ paddingTop: 28 }}>
              <Titulo h={dormV >= dormPT ? t(`As dormidas em Braga crescem ${sinal(dormV)}, acima do país (${sinal(dormPT)})`, `Overnight stays in Braga grow ${sinal(dormV)}, above the country (${sinal(dormPT)})`) : t(`As dormidas em Braga variam ${sinal(dormV)} (país: ${sinal(dormPT)})`, `Overnight stays in Braga change ${sinal(dormV)} (country: ${sinal(dormPT)})`)}
                cap={t('O essencial do Observatório de Turismo · INE/TravelBI, 1.º semestre de 2026 · Posto de Turismo', 'The essentials from the Tourism Observatory · INE/TravelBI, 1st half 2026 · Tourist Office')}
                right={props.onObservatorio ? <button className="rb-chip" onClick={props.onObservatorio}>{t('Abrir Observatório', 'Open Observatory')} <Seta /></button> : undefined} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {cartoes.map((k, i) => (
                  <div key={i} className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '18px 20px', transitionDelay: `${i * 70}ms` }}>
                    <div className="rb-lab">{k.l}</div>
                    <div className="rb-big" style={{ fontSize: 32 }}>{k.v}</div>
                    <div className="rb-sub" style={{ color: k.c }}>{k.s}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* O que mudou */}
        {alertas.length > 0 && (
          <section className="rb-sec" style={{ paddingTop: 28 }}>
            <Titulo h={t(`O que mudou no último trimestre · ${alertas.length} ${alertas.length === 1 ? 'local' : 'locais'}`, `What changed last quarter · ${alertas.length} ${alertas.length === 1 ? 'place' : 'places'}`)} cap={t('Mudanças relevantes face ao trimestre anterior, detetadas automaticamente · desliza para ver todas', 'Relevant changes versus the previous quarter, detected automatically · scroll to see them all')}
              right={alertas.length > 3 ? <div className="rb-noprint" style={{ display: 'flex', gap: 8 }}>
                <button className="rb-chip ghost" aria-label={t('Anteriores', 'Previous')} onClick={() => alertasRef.current?.scrollBy({ left: -620, behavior: 'smooth' })} style={{ width: 38, padding: 0, justifyContent: 'center' }}><span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><Seta /></span></button>
                <button className="rb-chip ghost" aria-label={t('Seguintes', 'Next')} onClick={() => alertasRef.current?.scrollBy({ left: 620, behavior: 'smooth' })} style={{ width: 38, padding: 0, justifyContent: 'center' }}><Seta /></button>
              </div> : undefined} />
            <div ref={alertasRef} className="rb-carrossel">
              {alertas.map((d, i) => (
                <div key={d.l.id} className="rb-rise" style={{ flex: '0 0 300px', scrollSnapAlign: 'start', background: 'var(--rb-warn-bg)', borderRadius: 6, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, transitionDelay: `${Math.min(i, 5) * 80}ms` }}>
                  <div style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.3 }}>{d.l.name}</div>
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
              <button className="rb-chip ghost rb-hide-m" aria-label={t('Anteriores', 'Previous')} onClick={() => desliza(-1)} style={{ width: 38, padding: 0, justifyContent: 'center' }}><span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><Seta /></span></button>
              <button className="rb-chip ghost rb-hide-m" aria-label={t('Seguintes', 'Next')} onClick={() => desliza(1)} style={{ width: 38, padding: 0, justifyContent: 'center' }}><Seta /></button>
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
                    <span className={i === pico ? undefined : 'rb-hide-m'} style={{ fontSize: 11, color: i === pico ? 'var(--rb-text)' : 'var(--rb-text2)', fontWeight: i === pico ? 700 : 400 }}>{fmt(v)}</span>
                    <div className="rb-vbar" style={{ width: '100%', height: `${Math.max(3, (v / maxMes) * 150)}px`, background: 'var(--rb-accent)', opacity: i === pico ? 1 : 0.45, borderRadius: '3px 3px 0 0', transitionDelay: `${i * 60}ms` }} />
                    <span style={{ fontSize: 11.5, color: 'var(--rb-text2)' }}>{t(MESES_PT[i], MESES_EN[i])}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Quando há mais gente (afluência habitual dos locais com dados) */}
        {(() => {
          const comA = dados.filter((d) => d.l.afluencia?.dias?.length);
          if (!comA.length) return null;
          const soma: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
          comA.forEach((d) => d.l.afluencia!.dias.forEach((hs, di) => hs.forEach((v, h) => { if (di < 7) soma[di][h] += v || 0; })));
          const destinoA: Afluencia = { dias: soma.map((hs) => hs.map((v) => Math.round(v / comA.length))) };
          const r = resumoAfluencia(destinoA);
          const dn = t('pt', 'en') === 'pt' ? DIAS_PT : DIAS_EN;
          return (
            <section className="rb-sec">
              <Titulo h={r.pico.d >= 0 ? t(`${dn[r.pico.d]} entre as ${r.ini}h e as ${r.fim + 1}h é o período de maior movimento`, `${dn[r.pico.d]} between ${r.ini}:00 and ${r.fim + 1}:00 is the busiest period`) : t('Afluência habitual', 'Usual busyness')}
                cap={t(`Média da afluência habitual em ${comA.length} ${comA.length === 1 ? 'local' : 'locais'}, segundo o Google Maps`, `Average usual busyness across ${comA.length} ${comA.length === 1 ? 'place' : 'places'}, according to Google Maps`)} />
              <AfluenciaMapa a={destinoA} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {comA.map((d) => { const rr = resumoAfluencia(d.l.afluencia!); return rr.pico.d >= 0 ? (
                  <button key={d.l.id} className="rb-chip ghost" onClick={() => props.onOpen(d.l.id)}>{d.l.name}: <strong style={{ color: 'var(--rb-text)' }}>{(t('pt', 'en') === 'pt' ? DIAS_CURTO_PT : DIAS_CURTO_EN)[rr.pico.d]} {rr.pico.h}h</strong></button>
                ) : null; })}
              </div>
            </section>
          );
        })()}

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

// ═══════════════════════════════════════════════════════════════════════════
// SEPARADORES COMPLEMENTARES — Mapa, Comparar, Temas (Problemas) e Relatório
// Mesma identidade da Visão Geral e dos Locais; números da fonte única (numeros()).
// ═══════════════════════════════════════════════════════════════════════════
const ESTILO_EXTRA = `
.rbx .leaflet-container { background: #15171B; font-family: 'Public Sans', system-ui, sans-serif; border-radius: 6px; }
.rbx .leaflet-control-zoom a { background: #1C1F24; color: #ECEDEF; border-color: #2D3139; }
.rbx .rb-osm-escuro { filter: invert(1) hue-rotate(180deg) brightness(.82) contrast(.92) saturate(.4); }
.rbx .leaflet-control-attribution { background: rgba(21,23,27,.7) !important; color: #8A909B !important; }
.rbx .leaflet-control-attribution a { color: #A3A8B1 !important; }
.rbm-pin { position: relative; width: 44px; height: 44px; border-radius: 50%; background: rgba(21,23,27,.9); border: 2px solid var(--c); box-shadow: 0 0 0 4px rgba(0,0,0,.25), 0 0 18px var(--c); display: flex; align-items: center; justify-content: center; color: #ECEDEF; font: 700 13px 'Public Sans', system-ui, sans-serif; transition: transform .2s ease; }
.rbm-pin:hover, .rbm-pin.sel { transform: scale(1.15); }
.rbm-al::after { content: ''; position: absolute; inset: -7px; border-radius: 50%; border: 2px solid #EDA06B; animation: rbmPulso 1.8s ease-out infinite; }
@keyframes rbmPulso { from { transform: scale(.85); opacity: 1; } to { transform: scale(1.35); opacity: 0; } }
.rbm-popup .leaflet-popup-content-wrapper { background: #1C1F24; color: #ECEDEF; border: 1px solid #2D3139; border-radius: 6px; box-shadow: 0 20px 50px rgba(0,0,0,.5); padding: 0; overflow: hidden; }
.rbm-popup .leaflet-popup-tip { background: #1C1F24; }
.rbm-popup .leaflet-popup-content { margin: 0; width: 270px !important; font-family: 'Public Sans', system-ui, sans-serif; }
.rbm-popup a.leaflet-popup-close-button { color: #ECEDEF; }
.rbm-pop img { width: 100%; height: 124px; object-fit: cover; display: block; }
.rbm-pop .rbm-in { padding: 14px 16px 16px; }
.rbm-cat { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8AB0E6; }
.rbm-nome { font-size: 16px; font-weight: 700; margin: 4px 0 8px; line-height: 1.25; }
.rbm-num { font-size: 13.5px; color: #A3A8B1; }
.rbm-num b { color: #ECEDEF; font-size: 15px; }
.rbm-alt { font-size: 12.5px; color: #EDA06B; margin-top: 8px; line-height: 1.4; }
.rbm-btn { margin-top: 12px; height: 32px; padding: 0 14px; border-radius: 999px; border: 0; background: #8AB0E6; color: #0F1216; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.rb-mapa-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 20px; align-items: start; }
.rb-lista-mapa { max-height: 640px; overflow-y: auto; border: 1px solid var(--rb-line); border-radius: 6px; background: var(--rb-surface); }
.rb-lista-mapa button { display: grid; grid-template-columns: 12px minmax(0,1fr) auto; gap: 12px; align-items: center; width: 100%; text-align: left; padding: 12px 14px; background: none; border: 0; border-bottom: 1px solid var(--rb-line); color: var(--rb-text); font: inherit; cursor: pointer; transition: background .2s ease; }
.rb-lista-mapa button:hover, .rb-lista-mapa button.on { background: var(--rb-accent-bg); }
.rb-scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.rb-heat td, .rb-heat th { padding: 10px 8px; text-align: center; border-bottom: 1px solid var(--rb-line); font-size: 13px; white-space: nowrap; }
.rb-heat th { font-size: 11.5px; font-weight: 700; color: var(--rb-text2); letter-spacing: .02em; }
.rb-heat .rb-fixa { position: sticky; left: 0; background: var(--rb-bg); text-align: left; z-index: 1; min-width: 200px; white-space: normal; }
.rb-heat tbody tr { cursor: pointer; }
.rb-heat tbody tr:hover .rb-fixa { color: var(--rb-accent); }
.rb-cel { display: inline-flex; align-items: center; justify-content: center; min-width: 52px; height: 30px; padding: 0 6px; border-radius: 4px; font-weight: 600; font-variant-numeric: tabular-nums; }
.rb-card-tema { background: var(--rb-surface); border: 1px solid var(--rb-line); border-radius: 6px; padding: 18px 20px; cursor: pointer; text-align: left; color: var(--rb-text); font: inherit; transition: border-color .2s ease, transform .2s ease; }
.rb-card-tema:hover { border-color: #3A404B; transform: translateY(-2px); }
.rb-card-tema.on { border-color: var(--rb-accent); }
.rb-pre { font-family: 'Public Sans', system-ui, sans-serif; font-size: 13px; line-height: 1.7; white-space: pre-wrap; margin: 0; color: var(--rb-text); }
@media (max-width: 900px) {
  .rb-mapa-grid { grid-template-columns: 1fr; }
  .rb-mapa-box { height: 58vh !important; }
  .rb-lista-mapa { max-height: none; }
}
`;

function Cabecalho({ kicker, titulo, sub, direita }: { kicker: string; titulo: string; sub?: string; direita?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
      <div style={{ maxWidth: 820 }}>
        <div style={{ fontSize: 14, color: 'var(--rb-text2)' }}>{kicker}</div>
        <h1 className="rb-h1-m" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1.08 }}>{titulo}</h1>
        {sub && <p className="rb-cap" style={{ fontSize: 14.5 }}>{sub}</p>}
      </div>
      {direita}
    </div>
  );
}
const corIndice = (x: Numeros | null) => (!x || x.robustez === 'insuficiente' ? '#6F747D' : x.idx >= 9 ? '#8AB0E6' : x.idx >= 8 ? '#B7CDF0' : '#EDA06B');
const escH = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ─── MAPA ───────────────────────────────────────────────────────────────────
export function MapaView(props: { locations: LocV[]; catLabel: (c: string) => string; onOpen: (id: string) => void; onMove: (id: string, c: [number, number]) => void; coordsDe: (l: LocV) => [number, number] | null }) {
  const admin = useAdmin();
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<any>(null);
  const marcadores = useRef<Record<string, any>>({});
  const [mover, setMover] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const mini = useMiniaturas();
  useRevelar(props.locations.length);
  const dados = props.locations.map((l) => ({ l, x: numeros(l), al: alerta(l.reviewStats), c: props.coordsDe(l) }));
  const comCoords = dados.filter((d) => d.c).sort((p, q) => p.l.name.localeCompare(q.l.name, 'pt'));
  const nMini = Object.keys(mini).length;
  const onOpenRef = useRef(props.onOpen); onOpenRef.current = props.onOpen;
  const onMoveRef = useRef(props.onMove); onMoveRef.current = props.onMove;

  useEffect(() => {
    (window as any).__rbAbrirLocal = (id: string) => onOpenRef.current(id);
    return () => { delete (window as any).__rbAbrirLocal; };
  }, []);

  useEffect(() => {
    let cancelado = false;
    const w = window as any;
    if (!document.getElementById('leaflet-css')) {
      const lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk);
    }
    const pronto = new Promise<any>((ok) => {
      if (w.L) return ok(w.L);
      const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => ok(w.L); document.head.appendChild(sc);
    });
    pronto.then((L: any) => {
      if (cancelado || !caixa.current || !L) return;
      if (mapa.current) { mapa.current.remove(); mapa.current = null; }
      const m = L.map(caixa.current, { center: [41.548, -8.426], zoom: 13 });
      // A CARTO passou a exigir chave (desde o fim de agosto de 2026). Com NEXT_PUBLIC_CARTO_KEY na Vercel usa o mapa escuro
      // da CARTO; sem chave usa o OpenStreetMap (gratuito, sem chave) com um filtro que o escurece.
      const chaveCarto = process.env.NEXT_PUBLIC_CARTO_KEY;
      if (chaveCarto) L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${chaveCarto}`, { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(m);
      else L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19, className: 'rb-osm-escuro' }).addTo(m);
      const lista: any[] = [];
      marcadores.current = {};
      comCoords.forEach((d) => {
        const c = corIndice(d.x);
        const txt = d.x && d.x.robustez !== 'insuficiente' ? fmt(d.x.idx, 1) : '–';
        const icon = L.divIcon({ className: '', html: `<div class="rbm-pin${d.al ? ' rbm-al' : ''}" style="--c:${c}">${txt}</div>`, iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -20] });
        const mk = L.marker(d.c, { icon, draggable: false });
        const foto = mini[d.l.id] ? `<img src="${mini[d.l.id]}" alt="" />` : '';
        const num = d.x ? `<div class="rbm-num"><b>${fmt(d.x.avg, 2)}</b> <span style="color:#F2C14E">★</span> · ${fmt(d.x.n)} ${t('comentários', 'reviews')}${d.x.robustez === 'insuficiente' ? ` · ${t('dados insuficientes', 'insufficient data')}` : ''}</div>` : `<div class="rbm-num">${t('Sem avaliações', 'No reviews')}</div>`;
        mk.bindPopup(`<div class="rbm-pop">${foto}<div class="rbm-in"><div class="rbm-cat">${escH(props.catLabel(d.l.category))}</div><div class="rbm-nome">${escH(d.l.name)}</div>${num}${d.al ? `<div class="rbm-alt">${escH(d.al)}</div>` : ''}<button class="rbm-btn" onclick="window.__rbAbrirLocal && window.__rbAbrirLocal('${d.l.id}')">${t('Abrir ficha', 'Open profile')} →</button></div></div>`, { maxWidth: 300, className: 'rbm-popup' });
        mk.on('dragend', (e: any) => { const ll = e.target.getLatLng(); onMoveRef.current(d.l.id, [ll.lat, ll.lng]); });
        mk.on('click', () => setSel(d.l.id));
        mk.addTo(m); lista.push(mk); marcadores.current[d.l.id] = mk;
      });
      if (lista.length) { const b = L.featureGroup(lista).getBounds(); if (b.isValid()) m.fitBounds(b, { padding: [50, 50], maxZoom: 15 }); }
      mapa.current = m;
      setTimeout(() => m.invalidateSize(), 250);
    });
    return () => { cancelado = true; if (mapa.current) { mapa.current.remove(); mapa.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comCoords.length, nMini]);

  useEffect(() => {
    Object.values(marcadores.current).forEach((mk: any) => { if (mk?.dragging) (mover ? mk.dragging.enable() : mk.dragging.disable()); });
  }, [mover, comCoords.length, nMini]);

  const ir = (id: string) => {
    const mk = marcadores.current[id];
    setSel(id);
    if (mk && mapa.current) { mapa.current.flyTo(mk.getLatLng(), 16, { duration: 0.8 }); setTimeout(() => mk.openPopup(), 850); }
    if (typeof window !== 'undefined' && window.innerWidth < 900) caixa.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const nAl = dados.filter((d) => d.al).length;

  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Reputação', 'Reputation')} titulo={t('Mapa de reputação', 'Reputation map')}
          sub={t(`${comCoords.length} locais no mapa${nAl ? ` · ${nAl} com alerta no último trimestre` : ''} · a nota dentro de cada ponto é o índice /10`, `${comCoords.length} places on the map${nAl ? ` · ${nAl} with an alert last quarter` : ''} · the number in each point is the /10 index`)}
          direita={admin ? <button className={`rb-chip${mover ? ' warn' : ' ghost'}`} onClick={() => setMover((v) => !v)}>{mover ? t('Concluir reposicionamento', 'Finish repositioning') : t('Reposicionar marcadores', 'Reposition markers')}</button> : undefined} />
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: 'var(--rb-text2)', margin: '18px 0 14px' }}>
          {[['#8AB0E6', t('Índice 9 ou mais', 'Index 9 or more')], ['#B7CDF0', t('8 a 9', '8 to 9')], ['#EDA06B', t('Abaixo de 8', 'Below 8')], ['#6F747D', t('Dados insuficientes', 'Insufficient data')]].map(([c, l]) => (
            <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 999, border: `2px solid ${c}`, boxShadow: `0 0 8px ${c}` }} />{l}</span>
          ))}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 999, border: '2px solid #EDA06B', outline: '2px solid rgba(237,160,107,.35)', outlineOffset: 2 }} />{t('Alerta', 'Alert')}</span>
        </div>
        {mover && <p className="rb-sub" style={{ marginTop: 0, marginBottom: 12, color: 'var(--rb-warn)' }}>{t('Arrasta os pontos para a posição correta. As novas coordenadas ficam guardadas.', 'Drag the points to the right position. New coordinates are saved.')}</p>}
        <div className="rb-mapa-grid">
          <div ref={caixa} className="rb-mapa-box" style={{ height: 640, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--rb-line)' }} />
          <div className="rb-lista-mapa">
            {comCoords.map((d) => (
              <button key={d.l.id} className={sel === d.l.id ? 'on' : ''} onClick={() => ir(d.l.id)}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: corIndice(d.x), boxShadow: `0 0 8px ${corIndice(d.x)}` }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.l.name}</span>
                  <span style={{ display: 'block', fontSize: 12, color: d.al ? 'var(--rb-warn)' : 'var(--rb-text2)', marginTop: 2 }}>{d.al ? t('Alerta no último trimestre', 'Alert last quarter') : props.catLabel(d.l.category)}</span>
                </span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{d.x && d.x.robustez !== 'insuficiente' ? fmt(d.x.idx, 1) : '—'}</span>
              </button>
            ))}
            {dados.length > comCoords.length && <div className="rb-sub" style={{ padding: '12px 14px', marginTop: 0 }}>{t(`${dados.length - comCoords.length} locais sem coordenadas (edita o local para as indicar).`, `${dados.length - comCoords.length} places without coordinates (edit the place to add them).`)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARAR ───────────────────────────────────────────────────────────────
const CORES_CMP = ['#8AB0E6', '#7CC79A', '#EDA06B', '#C9A0E6'];
function LinhasComparadas({ series, rotulo, casas = 2, zero = false }: { series: { nome: string; cor: string; q: { q: string; avg: number; n: number }[] }[]; rotulo?: (q: string) => string; casas?: number; zero?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [larg, setLarg] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((es) => { const w = Math.round(es[0].contentRect.width); if (w > 0) setLarg(w); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const qs = Array.from(new Set(series.flatMap((s) => s.q.map((z) => z.q)))).sort();
  if (qs.length < 2) return <p className="rb-sub">{t('Ainda não há trimestres suficientes para comparar.', 'Not enough quarters to compare yet.')}</p>;
  const W = Math.max(300, larg), H = W < 520 ? 240 : 300, L = 40, R = 16, T = 18, B = 30;
  const vals = series.flatMap((s) => s.q.map((z) => z.avg));
  const lo = zero ? 0 : Math.max(1, Math.floor((Math.min(...vals) - 0.15) * 10) / 10), hi = zero ? Math.max(1, Math.max(...vals) * 1.08) : Math.min(5, Math.ceil((Math.max(...vals) + 0.1) * 10) / 10);
  const X = (i: number) => L + (i * (W - L - R)) / (qs.length - 1);
  const Y = (v: number) => T + ((hi - v) / (hi - lo || 1)) * (H - T - B);
  const step = Math.ceil(qs.length / (W < 520 ? 4 : 8));
  const lab = rotulo || ((s2: string) => { const [y, tq] = s2.split('-T'); return `T${tq} ${y.slice(2)}`; });
  const mexe = (cx: number, el: SVGSVGElement) => { const r = el.getBoundingClientRect(); const px = ((cx - r.left) / r.width) * W; setHover(Math.max(0, Math.min(qs.length - 1, Math.round(((px - L) / (W - L - R)) * (qs.length - 1))))); };
  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible', cursor: 'crosshair', touchAction: 'pan-y' }}
        onMouseMove={(e) => mexe(e.clientX, e.currentTarget)} onMouseLeave={() => setHover(null)} onTouchStart={(e) => mexe(e.touches[0].clientX, e.currentTarget)} onTouchMove={(e) => mexe(e.touches[0].clientX, e.currentTarget)}>
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--rb-line)" strokeDasharray="2 6" /><text x={L - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--rb-text2)">{zero ? (v >= 1000 ? `${fmt(v / 1000, 1)}k` : fmt(v, 0)) : fmt(v, 1)}</text></g>
        ))}
        {series.map((s) => {
          const pts = s.q.map((z) => `${X(qs.indexOf(z.q))},${Y(z.avg)}`).join(' ');
          return (
            <g key={s.nome}>
              <polyline className="rb-draw" pathLength={1} fill="none" stroke={s.cor} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" points={pts} style={{ filter: `drop-shadow(0 4px 8px rgba(0,0,0,.4))` }} />
              {s.q.map((z) => <circle key={z.q} className="rb-dot" cx={X(qs.indexOf(z.q))} cy={Y(z.avg)} r={hover === qs.indexOf(z.q) ? 5 : 3} fill={s.cor} stroke="var(--rb-bg)" strokeWidth={1.5} />)}
            </g>
          );
        })}
        {hover != null && <line x1={X(hover)} x2={X(hover)} y1={T - 4} y2={H - B} stroke="var(--rb-text2)" strokeOpacity={0.45} />}
        {qs.map((q, i) => (i % step === 0 || i === qs.length - 1 ? <text key={q} x={X(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--rb-text2)">{lab(q)}</text> : null))}
      </svg>
      {hover != null && (
        <div className="rb-tip" style={{ left: `${(X(hover) / W) * 100}%`, top: 0, transform: `translate(${hover > qs.length / 2 ? '-105%' : '5%'}, 0)` }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{lab(qs[hover])}</div>
          {series.map((s) => { const z = s.q.find((y) => y.q === qs[hover]); return <div key={s.nome} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 8, height: 8, borderRadius: 999, background: s.cor }} /><span style={{ color: 'var(--rb-text2)', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nome}</span><strong style={{ marginLeft: 'auto' }}>{z ? fmt(z.avg, casas) : '—'}</strong></div>; })}
        </div>
      )}
    </div>
  );
}

export function CompararView(props: { locations: LocV[]; catLabel: (c: string) => string; onOpen: (id: string) => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [q, setQ] = useState('');
  useRevelar(ids.join(','));
  const dados = props.locations.map((l) => ({ l, x: numeros(l), a: l.analysis ? (dispAnalysis(l) as any) : null, ws: windowStats(l.reviewStats) })).filter((d) => d.x);
  const padrao = [...dados].filter((d) => d.x!.robustez !== 'insuficiente').sort((p, r) => r.x!.n - p.x!.n).slice(0, 3).map((d) => d.l.id);
  const escolhidos = (ids.length ? ids : padrao).map((id) => dados.find((d) => d.l.id === id)).filter((d): d is (typeof dados)[number] => !!d);
  const corDe = (id: string) => CORES_CMP[escolhidos.findIndex((d) => d.l.id === id)] || '#8AB0E6';
  const alterna = (id: string) => {
    const base = ids.length ? ids : padrao;
    setIds(base.includes(id) ? base.filter((x) => x !== id) : base.length >= 4 ? base : [...base, id]);
  };
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const opcoes = [...dados].sort((p, r) => p.l.name.localeCompare(r.l.name, 'pt')).filter((d) => !q || norm(d.l.name).includes(norm(q)));
  const DIMS: [string, string][] = [['localizacao', t('Localização', 'Location')], ['servico', t('Serviço', 'Service')], ['precoQualidade', t('Preço/Qualidade', 'Value for money')], ['limpeza', t('Limpeza', 'Cleanliness')], ['experiencia', t('Experiência', 'Experience')], ['acessibilidade', t('Acessibilidade', 'Accessibility')]];
  const temasDe = (d: (typeof dados)[number]) => (Array.isArray(d.a?.v2?.temas) ? d.a.v2.temas : []) as { id: string; estado: Estado }[];
  const colMin = Math.max(560, 200 + escolhidos.length * 170);
  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Reputação', 'Reputation')} titulo={t('Comparar locais', 'Compare places')} sub={t('Escolhe até 4 locais. Por defeito aparecem os três com mais avaliações.', 'Pick up to 4 places. By default, the three with the most reviews are shown.')} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '20px 0 8px' }}>
          <input className="rb-field" style={{ flex: '1 1 220px', maxWidth: 300 }} placeholder={t('Procurar local', 'Search place')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Procurar local', 'Search place')} />
          {ids.length > 0 && <button className="rb-chip ghost" onClick={() => setIds([])}>{t('Repor seleção', 'Reset selection')}</button>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {opcoes.map((d) => {
            const on = escolhidos.some((e) => e.l.id === d.l.id);
            const cheio = !on && escolhidos.length >= 4;
            return (
              <button key={d.l.id} className="rb-chip ghost" disabled={cheio} onClick={() => alterna(d.l.id)}
                style={on ? { borderColor: corDe(d.l.id), color: 'var(--rb-text)', background: 'rgba(255,255,255,.04)' } : undefined}>
                {on && <span style={{ width: 8, height: 8, borderRadius: 999, background: corDe(d.l.id) }} />}{d.l.name}
              </button>
            );
          })}
        </div>

        {escolhidos.length === 0 ? <p className="rb-sub">{t('Escolhe pelo menos um local.', 'Pick at least one place.')}</p> : (
          <>
            {/* Números lado a lado */}
            <section className="rb-sec">
              <Titulo h={t('Números lado a lado', 'Numbers side by side')} cap={t('Últimos 3 anos · índice /10 = média de estrelas × 2', 'Last 3 years · index /10 = average stars × 2')} />
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(230px, 1fr))`, gap: 14 }}>
                {escolhidos.map((d, i) => {
                  const insuf = d.x!.robustez === 'insuficiente';
                  return (
                    <div key={d.l.id} className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '20px 22px', position: 'relative', overflow: 'hidden', transitionDelay: `${i * 90}ms` }}>
                      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: CORES_CMP[i] }} />
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: CORES_CMP[i] }}>{props.catLabel(d.l.category)}</div>
                      <button onClick={() => props.onOpen(d.l.id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--rb-text)', font: 'inherit', fontSize: 17, fontWeight: 700, textAlign: 'left', cursor: 'pointer', margin: '6px 0 14px', lineHeight: 1.3 }}>{d.l.name}</button>
                      <div className="rb-lab">{t('Índice', 'Index')}</div>
                      <div className="rb-big">{insuf ? <span style={{ color: 'var(--rb-text2)' }}>—</span> : <><Conta v={d.x!.idx} d={1} /><small>/10</small></>}</div>
                      <div className="rb-sub">{insuf ? t('Dados insuficientes', 'Insufficient data') : ''}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--rb-line)' }}>
                        <div><div className="rb-lab">{t('Média', 'Average')}</div><div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><Conta v={d.x!.avg} d={2} /> <span style={{ color: 'var(--rb-star)', fontSize: 16 }}>★</span></div></div>
                        <div><div className="rb-lab">{t('Comentários', 'Reviews')}</div><div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}><Conta v={d.x!.n} /></div></div>
                      </div>
                      <div className="rb-split rb-bar" style={{ marginTop: 14 }}>
                        <i style={{ width: `${d.x!.pos}%`, background: 'var(--rb-good)' }} />
                        <i style={{ width: `${Math.max(0, 100 - d.x!.pos - d.x!.neg)}%`, background: 'var(--rb-text2)', opacity: 0.35 }} />
                        <i style={{ width: `${d.x!.neg}%`, background: 'var(--rb-bad)', minWidth: d.x!.neg > 0 ? 3 : 0 }} />
                      </div>
                      <div className="rb-sub"><span style={{ color: 'var(--rb-good)' }}>{fmt(d.x!.pos, 1)}%</span> {t('positivas', 'positive')} · <span style={{ color: 'var(--rb-bad)' }}>{fmt(d.x!.neg, 1)}%</span> {t('negativas', 'negative')}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Evolução comparada */}
            <section className="rb-sec">
              <Titulo h={t('Evolução da média, trimestre a trimestre', 'Average rating, quarter by quarter')} cap={t('Passa o cursor sobre o gráfico para ver os valores', 'Hover over the chart to see the values')} />
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13.5, marginBottom: 12 }}>
                {escolhidos.map((d, i) => <span key={d.l.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 3, borderRadius: 2, background: CORES_CMP[i] }} />{d.l.name}</span>)}
              </div>
              <LinhasComparadas series={escolhidos.map((d, i) => ({ nome: d.l.name, cor: CORES_CMP[i], q: d.ws ? d.ws.quarters.map((z) => ({ q: z.q, avg: z.avg, n: z.n })) : [] }))} />
            </section>

            {/* Dimensões */}
            <section className="rb-sec">
              <Titulo h={t('Dimensões de avaliação', 'Rating dimensions')} cap={t('De 0 a 10, a partir dos elogios e críticas nos comentários', '0 to 10, from praise and criticism in the reviews')} />
              <div className="rb-2" style={{ gap: '8px 48px' }}>
                {DIMS.map(([k, nome]) => (
                  <div key={k} style={{ padding: '12px 0', borderBottom: '1px solid var(--rb-line)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{nome}</div>
                    {escolhidos.map((d, i) => {
                      const v = d.a?.dimensions?.[k];
                      return (
                        <div key={d.l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 44px', gap: 10, alignItems: 'center', margin: '6px 0' }}>
                          <div style={{ height: 8, background: 'var(--rb-muted)', borderRadius: 999, overflow: 'hidden' }}>
                            {typeof v === 'number' && <div className="rb-bar" style={{ width: `${v * 10}%`, height: '100%', background: CORES_CMP[i], borderRadius: 999, transitionDelay: `${i * 90}ms` }} />}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{typeof v === 'number' ? fmt(v, 1) : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>

            {/* Temas */}
            <section className="rb-sec">
              <Titulo h={t('Estado dos temas em cada local', 'Theme status at each place')} cap={t('Últimos 12 meses comparados com os 12–36 meses anteriores', 'Last 12 months compared with the previous 12–36 months')} />
              <div className="rb-scroll-x">
                <table className="rb-heat" style={{ borderCollapse: 'collapse', minWidth: colMin, width: '100%' }}>
                  <thead><tr><th className="rb-fixa">{t('Tema', 'Theme')}</th>{escolhidos.map((d, i) => <th key={d.l.id} style={{ color: CORES_CMP[i], whiteSpace: 'normal', maxWidth: 170 }}>{d.l.name}</th>)}</tr></thead>
                  <tbody>{TEMAS.map((tm) => (
                    <tr key={tm.id} style={{ cursor: 'default' }}>
                      <td className="rb-fixa" style={{ fontWeight: 600 }}>{temaNome(tm.id)}</td>
                      {escolhidos.map((d) => { const z = temasDe(d).find((y) => y.id === tm.id); return <td key={d.l.id}>{z && z.estado ? <Tag e={z.estado} /> : <span style={{ color: 'var(--rb-text2)' }}>—</span>}</td>; })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {escolhidos.some((d) => !d.a?.v2) && <p className="rb-sub">{t('Alguns locais ainda não foram reanalisados com os temas.', 'Some places have not yet been re-analysed with themes.')}</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TEMAS NO DESTINO (antigo "Problemas") ─────────────────────────────────
const TEMA_CURTO: Record<string, [string, string]> = {
  paisagem: ['Paisagem', 'Landscape'], acesso: ['Acesso', 'Access'], sinalizacao: ['Sinalização', 'Signage'], fluxos: ['Fluxos', 'Flows'],
  acessibilidade: ['Acessibil.', 'Accessib.'], servicos: ['Serviços', 'Services'], multilingue: ['Multilingue', 'Multilingual'],
  atendimento: ['Atendimento', 'Staff'], preco: ['Preço', 'Price'], limpeza: ['Limpeza', 'Cleanliness'],
};
export function TemasView(props: { locations: LocV[]; catLabel: (c: string) => string; onOpen: (id: string) => void }) {
  const [foco, setFoco] = useState<string | null>(null);
  useRevelar(props.locations.length + (foco || ''));
  const dados = props.locations.map((l) => ({ l, a: l.analysis ? (dispAnalysis(l) as any) : null }));
  const com = dados.filter((d) => Array.isArray(d.a?.v2?.temasTodos) && (d.a.v2.textRec || d.a.v2.textPrev)).sort((p, q) => p.l.name.localeCompare(q.l.name, 'pt'));
  const sem = dados.filter((d) => !com.includes(d) && d.a);
  const stat = (d: (typeof com)[number], id: string) => (d.a.v2.temasTodos as { id: string; recPos: number; recNeg: number; prevPos: number; prevNeg: number }[]).find((z) => z.id === id);
  const estadoDe = (d: (typeof com)[number], id: string) => ((d.a.v2.temas || []) as { id: string; estado: Estado }[]).find((z) => z.id === id)?.estado;
  const resumo = TEMAS.map((tm) => {
    let recNeg = 0, prevNeg = 0, tR = 0, tP = 0;
    const prob: string[] = [], forte: string[] = [];
    com.forEach((d) => {
      const z = stat(d, tm.id); tR += d.a.v2.textRec || 0; tP += d.a.v2.textPrev || 0;
      if (z) { recNeg += z.recNeg; prevNeg += z.prevNeg; }
      const e = estadoDe(d, tm.id);
      if (e === 'persistente' || e === 'novo') prob.push(d.l.name); else if (e === 'forte') forte.push(d.l.name);
    });
    const pr = tR ? (recNeg / tR) * 100 : 0, pp = tP ? (prevNeg / tP) * 100 : 0;
    return { id: tm.id, prob, forte, pr, pp, d: pr - pp };
  }).sort((p, q) => q.prob.length - p.prob.length || q.pr - p.pr);
  const top = resumo.find((z) => z.prob.length > 0);
  const pctCel = (d: (typeof com)[number], id: string) => { const z = stat(d, id); const tR = d.a.v2.textRec || 0; return z && tR ? (z.recNeg / tR) * 100 : 0; };
  const maxCel = Math.max(1, ...com.flatMap((d) => TEMAS.map((tm) => pctCel(d, tm.id))));
  const colunas = foco ? [foco, ...TEMAS.map((x) => x.id).filter((x) => x !== foco)] : TEMAS.map((x) => x.id);
  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Reputação', 'Reputation')}
          titulo={top ? t(`${temaNome(top.id)} é o problema mais transversal do destino`, `${temaNome(top.id)} is the destination's most widespread issue`) : t('Temas no destino', 'Themes across the destination')}
          sub={t(`Críticas e elogios por tema em ${com.length} locais analisados · últimos 12 meses comparados com os 12–36 meses anteriores`, `Criticism and praise by theme across ${com.length} analysed places · last 12 months compared with the previous 12–36 months`)} />
        {com.length === 0 ? <p className="rb-sub" style={{ fontSize: 15 }}>{t('Reanalisa os locais para classificar os comentários por tema.', 'Re-analyse the places to classify reviews by theme.')}</p> : (
          <>
            <section className="rb-sec" style={{ paddingTop: 28 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                {resumo.map((z, i) => {
                  const tend = z.d >= 1 ? { s: '↑', c: 'var(--rb-bad)', l: t('a agravar', 'worsening') } : z.d <= -1 ? { s: '↓', c: 'var(--rb-good)', l: t('a melhorar', 'improving') } : { s: '→', c: 'var(--rb-text2)', l: t('estável', 'stable') };
                  return (
                    <button key={z.id} className={`rb-card-tema rb-rise${foco === z.id ? ' on' : ''}`} style={{ transitionDelay: `${Math.min(i, 8) * 50}ms` }} onClick={() => setFoco(foco === z.id ? null : z.id)}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{temaNome(z.id)}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                        <span style={{ fontSize: 32, fontWeight: 700, color: z.prob.length ? 'var(--rb-warn)' : 'var(--rb-text)' }}><Conta v={z.prob.length} /></span>
                        <span style={{ fontSize: 13, color: 'var(--rb-text2)' }}>{t(z.prob.length === 1 ? 'local com problema' : 'locais com problema', z.prob.length === 1 ? 'place with an issue' : 'places with an issue')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--rb-text2)', marginTop: 6 }}>
                        <strong style={{ color: 'var(--rb-text)' }}>{fmt(z.pr, 1)}%</strong> {t('dos comentários criticam', 'of reviews criticise')} · <span style={{ color: tend.c, fontWeight: 700 }}>{tend.s} {tend.l}</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
                        <div className="rb-bar" style={{ width: `${Math.min(100, (z.pr / Math.max(1, resumo[0] ? Math.max(...resumo.map((y) => y.pr)) : 1)) * 100)}%`, height: '100%', background: 'var(--rb-warn)', borderRadius: 999 }} />
                      </div>
                      {z.forte.length > 0 && <div style={{ fontSize: 12.5, color: 'var(--rb-good)', marginTop: 10 }}>{t(`Ponto forte em ${z.forte.length} ${z.forte.length === 1 ? 'local' : 'locais'}`, `Strength at ${z.forte.length} ${z.forte.length === 1 ? 'place' : 'places'}`)}</div>}
                    </button>
                  );
                })}
              </div>
              {foco && (() => { const z = resumo.find((y) => y.id === foco)!; return (
                <div className="rb-rise" style={{ marginTop: 16, background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '18px 22px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{temaNome(foco)}</div>
                  <div style={{ fontSize: 14, color: 'var(--rb-text2)', marginTop: 8, lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--rb-warn)' }}>{t('Problema em: ', 'Issue at: ')}</strong>{z.prob.length ? z.prob.join(' · ') : '—'}<br />
                    <strong style={{ color: 'var(--rb-good)' }}>{t('Ponto forte em: ', 'Strength at: ')}</strong>{z.forte.length ? z.forte.join(' · ') : '—'}
                  </div>
                </div>
              ); })()}
            </section>

            <section className="rb-sec">
              <Titulo h={t('Mapa de calor: críticas por tema em cada local', 'Heatmap: criticism by theme at each place')} cap={t('% dos comentários com texto dos últimos 12 meses que criticam o tema · clica num local para abrir a ficha', '% of the last 12 months’ reviews with text criticising the theme · click a place to open its profile')} />
              <div className="rb-scroll-x rb-rise">
                <table className="rb-heat" style={{ borderCollapse: 'collapse', minWidth: 980, width: '100%' }}>
                  <thead><tr><th className="rb-fixa">{t('Local', 'Place')}</th>{colunas.map((id) => <th key={id} style={{ color: foco === id ? 'var(--rb-accent)' : undefined }}>{t(TEMA_CURTO[id][0], TEMA_CURTO[id][1])}</th>)}</tr></thead>
                  <tbody>{com.map((d) => (
                    <tr key={d.l.id} onClick={() => props.onOpen(d.l.id)}>
                      <td className="rb-fixa"><div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.l.name}</div><div style={{ fontSize: 11.5, color: 'var(--rb-text2)' }}>{props.catLabel(d.l.category)}</div></td>
                      {colunas.map((id) => {
                        const v = pctCel(d, id), e = estadoDe(d, id), a = v / maxCel;
                        return (
                          <td key={id}>
                            <span className="rb-cel" title={e ? estadoNome(e) : ''} style={{ background: v > 0 ? `rgba(237,160,107,${0.12 + a * 0.6})` : e === 'forte' ? 'rgba(124,199,154,.14)' : 'var(--rb-muted)', color: v > 0 ? (a > 0.55 ? '#1a1206' : 'var(--rb-text)') : e === 'forte' ? 'var(--rb-good)' : 'var(--rb-text2)', outline: e === 'persistente' ? '2px solid #EDA06B' : e === 'novo' ? '1px dashed #EDA06B' : 'none', outlineOffset: -2 }}>
                              {v > 0 ? `${fmt(v, v < 10 ? 1 : 0)}%` : e === 'forte' ? '+' : '·'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--rb-text2)', marginTop: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="rb-cel" style={{ minWidth: 26, height: 18, background: 'rgba(237,160,107,.6)' }} /> {t('mais críticas', 'more criticism')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="rb-cel" style={{ minWidth: 26, height: 18, background: 'rgba(237,160,107,.12)', outline: '2px solid #EDA06B', outlineOffset: -2 }} /> {t('persistente', 'persistent')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="rb-cel" style={{ minWidth: 26, height: 18, background: 'rgba(237,160,107,.12)', outline: '1px dashed #EDA06B', outlineOffset: -2 }} /> {t('novo', 'new')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="rb-cel" style={{ minWidth: 26, height: 18, background: 'rgba(124,199,154,.14)', color: 'var(--rb-good)' }}>+</span> {t('ponto forte', 'strength')}</span>
              </div>
              {sem.length > 0 && <p className="rb-sub">{t(`Por reanalisar com temas: ${sem.map((d) => d.l.name).join(', ')}.`, `Not yet re-analysed with themes: ${sem.map((d) => d.l.name).join(', ')}.`)}</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ─── RELATÓRIOS E PARTILHA ──────────────────────────────────────────────────
export function RelatorioView(props: {
  analisados: LocV[]; catLabel: (c: string) => string;
  relatorioIA: ReactNode | null; gerando: boolean; onGerar: () => void; onExportarPDF: () => void;
  textoConsolidado: (id: string | null) => string; onCopiarConsolidado: (id: string | null) => void; copiado: boolean;
  copiedLinkId: string | null; onCopiarLink: (id: string) => void; onAbrirPagina: (id: string) => void; onOpen: (id: string) => void;
}) {
  const [consId, setConsId] = useState<string | null>(null);
  const [verTexto, setVerTexto] = useState(false);
  const mini = useMiniaturas();
  useRevelar(props.analisados.length);
  const lista = [...props.analisados].sort((p, q) => p.name.localeCompare(q.name, 'pt'));
  const mes = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { month: 'long', year: 'numeric' });
  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Reputação', 'Reputation')} titulo={t('Relatórios e partilha', 'Reports and sharing')} sub={t('Relatório mensal para a chefia, páginas públicas de cada local e relatório consolidado em texto.', 'Monthly report for management, public pages for each place and a consolidated text report.')} />
        {lista.length === 0 ? <p className="rb-sub" style={{ fontSize: 15 }}>{t('Analisa locais para gerar relatórios.', 'Analyse places to generate reports.')}</p> : (
          <>
            <section className="rb-sec" style={{ paddingTop: 28 }}>
              <div className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ padding: '24px 26px', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', background: 'linear-gradient(135deg, rgba(34,50,74,.55) 0%, rgba(28,31,36,0) 70%)', borderBottom: '1px solid var(--rb-line)' }}>
                  <div style={{ maxWidth: 640 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rb-accent)' }}>{t('Relatório mensal executivo', 'Monthly executive report')} · {mes}</div>
                    <h2 className="rb-h2" style={{ marginTop: 8 }}>{t('Síntese da reputação do destino, escrita pela IA', 'Destination reputation summary, written by AI')}</h2>
                    <p className="rb-cap" style={{ fontSize: 14 }}>{t(`Baseado em ${lista.length} locais analisados. Os números usados são os mesmos da plataforma.`, `Based on ${lista.length} analysed places. The numbers used are the same as in the platform.`)}</p>
                  </div>
                  <div className="rb-noprint" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {props.relatorioIA && <button className="rb-btn" onClick={props.onExportarPDF}>{t('Exportar PDF', 'Export PDF')}</button>}
                    <button className="rb-btn p" disabled={props.gerando} onClick={props.onGerar}>{props.gerando ? t('A gerar…', 'Generating…') : props.relatorioIA ? t('Regenerar', 'Regenerate') : t('Gerar relatório', 'Generate report')}</button>
                  </div>
                </div>
                <div style={{ padding: '22px 26px 26px' }}>
                  {props.gerando ? (
                    <div>{[92, 78, 85, 60].map((w, i) => <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 4, background: 'linear-gradient(90deg, var(--rb-muted), #2F343C, var(--rb-muted))', backgroundSize: '200% 100%', animation: 'rbShimmer 1.4s ease-in-out infinite', margin: '10px 0' }} />)}</div>
                  ) : props.relatorioIA ? <div id="ai-report-print">{props.relatorioIA}</div>
                    : <p className="rb-sub" style={{ fontSize: 14.5, marginTop: 0 }}>{t('Clica em "Gerar relatório" para a IA redigir o sumário do mês, com os destaques, os alertas e as recomendações.', 'Click "Generate report" for the AI to write the month’s summary, with highlights, alerts and recommendations.')}</p>}
                </div>
              </div>
            </section>

            <section className="rb-sec">
              <Titulo h={t('Páginas públicas de cada local', 'Public page for each place')} cap={t('Link para partilhar com as entidades gestoras ou parceiros, sem precisar de palavra-passe', 'Link to share with site managers or partners, no password needed')} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {lista.map((l, i) => {
                  const x = numeros(l);
                  const ok = props.copiedLinkId === l.id;
                  return (
                    <div key={l.id} className="rb-rise" style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: 12, transitionDelay: `${Math.min(i, 9) * 40}ms` }}>
                      <Miniatura src={mini[l.id]} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <button onClick={() => props.onOpen(l.id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--rb-text)', font: 'inherit', fontSize: 14.5, fontWeight: 700, textAlign: 'left', cursor: 'pointer', display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</button>
                        <div style={{ fontSize: 12.5, color: 'var(--rb-text2)', marginTop: 2 }}>{x ? <>{x.robustez === 'insuficiente' ? t('Dados insuficientes', 'Insufficient data') : `${fmt(x.idx, 1)}/10`} · {fmt(x.avg, 2)} <span style={{ color: 'var(--rb-star)' }}>★</span></> : props.catLabel(l.category)}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button className="rb-chip ghost" style={{ height: 30, fontSize: 12.5, borderColor: ok ? 'var(--rb-good)' : undefined, color: ok ? 'var(--rb-good)' : undefined }} onClick={() => props.onCopiarLink(l.id)}>{ok ? t('Link copiado', 'Link copied') : t('Copiar link', 'Copy link')}</button>
                          <button className="rb-chip" style={{ height: 30, fontSize: 12.5 }} onClick={() => props.onAbrirPagina(l.id)}>{t('Abrir', 'Open')} <Seta /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rb-sec">
              <Titulo h={t('Relatório consolidado em texto', 'Consolidated text report')} cap={t('Para colar num email ou documento', 'To paste into an email or document')} />
              <div className="rb-rise" style={{ background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '20px 22px' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select className="rb-field" value={consId || ''} onChange={(e) => setConsId(e.target.value || null)} aria-label={t('Local', 'Place')}>
                    <option value="">{t(`Todos os locais (${lista.length})`, `All places (${lista.length})`)}</option>
                    {lista.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button className="rb-btn p" onClick={() => props.onCopiarConsolidado(consId)}>{props.copiado ? t('Copiado', 'Copied') : t('Copiar relatório', 'Copy report')}</button>
                  <button className="rb-chip ghost" onClick={() => setVerTexto((v) => !v)}>{verTexto ? t('Esconder texto', 'Hide text') : t('Pré-visualizar', 'Preview')}</button>
                </div>
                {verTexto && <div style={{ marginTop: 16, maxHeight: 420, overflowY: 'auto', background: 'var(--rb-bg)', border: '1px solid var(--rb-line)', borderRadius: 4, padding: '16px 18px' }}><pre className="rb-pre">{props.textoConsolidado(consId)}</pre></div>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MERCADOS — procura (INE, balcão) × voz e satisfação (comentários)
// Só LÊ os dados do Observatório; não os altera.
// ═══════════════════════════════════════════════════════════════════════════
const LINGUA_PAIS: Record<string, string> = {
  'Portugal': 'pt', 'Brasil': 'pt', 'Angola': 'pt', 'Moçambique': 'pt', 'Cabo Verde': 'pt',
  'Espanha': 'es', 'México': 'es', 'Argentina': 'es', 'Colômbia': 'es', 'Chile': 'es', 'Venezuela': 'es',
  'Reino Unido': 'en', 'Estados Unidos': 'en', 'EUA': 'en', 'Irlanda': 'en', 'Canadá': 'en', 'Austrália': 'en', 'Índia': 'en',
  'França': 'fr', 'Bélgica': 'fr', 'Luxemburgo': 'fr', 'Suíça': 'de', 'Alemanha': 'de', 'Áustria': 'de',
  'Itália': 'it', 'Países Baixos': 'nl', 'Holanda': 'nl', 'Polónia': 'pl', 'China': 'zh', 'Japão': 'ja', 'Coreia do Sul': 'ko',
  'Israel': 'he', 'Rússia': 'ru', 'Ucrânia': 'uk', 'Roménia': 'ro', 'Suécia': 'sv', 'Dinamarca': 'da', 'Noruega': 'no',
  'Finlândia': 'fi', 'Chéquia': 'cs', 'República Checa': 'cs', 'Hungria': 'hu', 'Turquia': 'tr', 'Grécia': 'el',
  'Croácia': 'hr', 'Eslovénia': 'sl', 'Sérvia': 'sr', 'Bulgária': 'bg', 'Eslováquia': 'sk', 'Lituânia': 'lt', 'Letónia': 'lv', 'Estónia': 'et',
};
const LINGUA_EXTRA: Record<string, [string, string]> = { hr: ['Croata', 'Croatian'], sl: ['Esloveno', 'Slovenian'], sr: ['Sérvio', 'Serbian'], bg: ['Búlgaro', 'Bulgarian'], sk: ['Eslovaco', 'Slovak'], lt: ['Lituano', 'Lithuanian'], lv: ['Letão', 'Latvian'], et: ['Estónio', 'Estonian'] };
const nomeLingua = (c: string) => (LINGUA_EXTRA[c] ? t(LINGUA_EXTRA[c][0], LINGUA_EXTRA[c][1]) : langName(c));
export function MercadosView(props: { locations: LocV[] }) {
  const [sel, setSel] = useState<string | null>(null);
  useRevelar(props.locations.length + (sel || ''));
  const S: any = SEMESTRE_2026 as any;
  // Procura (INE, 1.º semestre de 2026): residentes em Portugal + mercados externos
  const dorm: Record<string, { v: number; paises: string[]; porPais: [string, number][] }> = {};
  const soma = (lg: string, v: number, pais: string) => { if (!dorm[lg]) dorm[lg] = { v: 0, paises: [], porPais: [] }; dorm[lg].v += v; if (!dorm[lg].paises.includes(pais)) { dorm[lg].paises.push(pais); dorm[lg].porPais.push([pais, v]); } };
  let maiorPais: { pais: string; v: number; lg: string } | null = null;
  const resPT = Number(S?.residencia?.dormidas?.Portugal) || 0;
  const estTot = Number(S?.residencia?.dormidas?.Estrangeiro) || 0;
  const pctEstrangeiros = resPT + estTot ? (estTot / (resPT + estTot)) * 100 : 0;
  let estMapeado = 0;
  (Array.isArray(S?.mercadosDormidas) ? S.mercadosDormidas : []).forEach((row: any[]) => {
    const pais = String(row[0]); const v = Number(row[2] ?? row[1]) || 0;
    const lg = LINGUA_PAIS[pais] || 'outra'; soma(lg, v, pais); estMapeado += v;
    if (!maiorPais || v > maiorPais.v) maiorPais = { pais, v, lg };
  });
  if (estTot > estMapeado) soma('outra', estTot - estMapeado, t('outros países', 'other countries'));
  const totDorm = estTot || Object.values(dorm).reduce((s, x) => s + x.v, 0);
  // Balcão do Posto de Turismo (ano mais recente)
  const anosB = Object.keys((BALCAO as any) || {}).sort();
  const anoB = anosB[anosB.length - 1];
  const balc: Record<string, number> = {};
  ((BALCAO as any)?.[anoB]?.nacionalidades || []).forEach((row: any[]) => { if (String(row[0]) === 'Portugal') return; const lg = LINGUA_PAIS[String(row[0])] || 'outra'; balc[lg] = (balc[lg] || 0) + (Number(row[1]) || 0); });
  const totBalc = Object.values(balc).reduce((s, x) => s + x, 0);
  // Voz e satisfação (comentários dos últimos 3 anos, com texto)
  const rev: Record<string, { n: number; sum: number }> = {};
  props.locations.forEach((l) => windowStats(l.reviewStats)?.langs.forEach((lg) => { if (lg.code === 'none' || lg.code === 'und') return; const k = rev[lg.code] ? lg.code : lg.code; if (!rev[k]) rev[k] = { n: 0, sum: 0 }; rev[k].n += lg.n; rev[k].sum += lg.avg * lg.n; }));
  const totRevTodos = Object.values(rev).reduce((s, x) => s + x.n, 0);
  const mediaGeral = totRevTodos ? Object.values(rev).reduce((s, x) => s + x.sum, 0) / totRevTodos : 0;
  const totRev = Object.entries(rev).filter(([k]) => k !== 'pt').reduce((s, [, x]) => s + x.n, 0);
  const linguas = Array.from(new Set([...Object.keys(dorm), ...Object.keys(rev)])).filter((lg) => lg !== 'outra');
  const linhas = linguas.map((lg) => ({
    lg, pd: totDorm ? ((dorm[lg]?.v || 0) / totDorm) * 100 : 0, pr: lg === 'pt' ? -1 : totRev ? ((rev[lg]?.n || 0) / totRev) * 100 : 0,
    pb: totBalc ? ((balc[lg] || 0) / totBalc) * 100 : 0, n: rev[lg]?.n || 0, avg: rev[lg] ? rev[lg].sum / rev[lg].n : null, paises: dorm[lg]?.paises || [], porPais: dorm[lg]?.porPais || [],
  })).filter((z) => z.pd >= 0.8 || z.pr >= 0.8).sort((p, q) => q.pd - p.pd || q.pr - p.pr);
  const externos = linhas.filter((z) => z.lg !== 'pt');
  const mp = maiorPais as { pais: string; v: number; lg: string } | null;
  const maior = (mp && externos.find((z) => z.lg === mp.lg)) || externos[0];
  const insights: string[] = [];
  if (mp && maior && maior.avg != null) insights.push(t(`${mp.pais} é o maior mercado externo (${fmt(totDorm ? (mp.v / totDorm) * 100 : 0, 1)}% das dormidas de estrangeiros) e quem escreve em ${nomeLingua(maior.lg).toLowerCase()} avalia ${maior.avg >= mediaGeral ? 'acima' : 'abaixo'} da média (${fmt(maior.avg, 2)} contra ${fmt(mediaGeral, 2)} estrelas).`, `${mp.pais} is the largest foreign market (${fmt(totDorm ? (mp.v / totDorm) * 100 : 0, 1)}% of foreign stays) and ${nomeLingua(maior.lg)} speakers rate ${maior.avg >= mediaGeral ? 'above' : 'below'} average (${fmt(maior.avg, 2)} vs ${fmt(mediaGeral, 2)} stars).`));
  const semVoz = externos.filter((z) => z.pr >= 0 && z.pd >= 2 && z.pr < z.pd * 0.5).sort((p, q) => q.pd - p.pd)[0];
  if (semVoz) insights.push(t(`Quem fala ${nomeLingua(semVoz.lg).toLowerCase()} representa ${fmt(semVoz.pd, 1)}% das dormidas de estrangeiros, mas só ${fmt(semVoz.pr, 1)}% dos comentários em línguas estrangeiras: pouca voz online para o peso que tem.`, `${nomeLingua(semVoz.lg)} speakers are ${fmt(semVoz.pd, 1)}% of stays but only ${fmt(semVoz.pr, 1)}% of reviews: little online voice for their weight.`));
  const pior = linhas.filter((z) => z.n >= 30 && z.avg != null).sort((p, q) => (p.avg! - q.avg!))[0];
  if (pior && pior.avg! < mediaGeral - 0.05) insights.push(t(`Quem escreve em ${nomeLingua(pior.lg).toLowerCase()} é o grupo menos satisfeito (${fmt(pior.avg!, 2)} estrelas): vale a pena ver o que critica nas fichas dos locais.`, `${nomeLingua(pior.lg)} speakers are the least satisfied group (${fmt(pior.avg!, 2)} stars): worth checking what they criticise in each place’s profile.`));
  const procuraInfo = externos.filter((z) => z.pb >= 2 && z.pb > z.pd * 1.5).sort((p, q) => q.pb - p.pb)[0];
  if (procuraInfo) insights.push(t(`No Posto de Turismo, o mercado ${nomeLingua(procuraInfo.lg).toLowerCase()} pede mais informação (${fmt(procuraInfo.pb, 1)}% dos atendimentos) do que o seu peso nas dormidas (${fmt(procuraInfo.pd, 1)}%).`, `At the Tourist Office, the ${nomeLingua(procuraInfo.lg)} market asks for more information (${fmt(procuraInfo.pb, 1)}% of visits) than its share of stays (${fmt(procuraInfo.pd, 1)}%).`));
  const maxPct = Math.max(1, ...linhas.flatMap((z) => [z.pd, Math.max(0, z.pr), z.pb]));
  const lgSel = sel || maior?.lg || linhas[0]?.lg;
  const porLocal = lgSel ? props.locations.map((l) => { const ws = windowStats(l.reviewStats); const x = ws?.langs.find((y) => y.code === lgSel); return x && x.n >= 10 && ws ? { l, n: x.n, avg: x.avg, geral: ws.avg } : null; }).filter((z): z is { l: LocV; n: number; avg: number; geral: number } => !!z).sort((p, q) => (q.avg - q.geral) - (p.avg - p.geral)) : [];
  const barra = (v: number, cor: string) => (
    <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><strong>{fmt(v, 1)}%</strong></div>
      <div style={{ height: 7, background: 'var(--rb-muted)', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}><div className="rb-bar" style={{ width: `${(v / maxPct) * 100}%`, height: '100%', background: cor, borderRadius: 999 }} /></div></div>
  );
  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Reputação × Procura', 'Reputation × Demand')} titulo={mp ? t(`${mp.pais}: o maior mercado externo de Braga`, `${mp.pais}: Braga’s largest foreign market`) : t('Mercados: procura e satisfação', 'Markets: demand and satisfaction')}
          sub={t(`Mercados externos: ${fmt(pctEstrangeiros, 1)}% das dormidas de janeiro a junho de 2026 foram de estrangeiros. Cruza o peso de cada mercado nessas dormidas (INE) e nos atendimentos do Posto de Turismo com a voz e a satisfação nos comentários do Google (últimos 3 anos). Agrupados por língua; os anos completos, com o verão, reforçam o peso do mercado espanhol.`, 'Crosses each market’s share of overnight stays (INE, 1st half 2026) and Tourist Office visits with its voice and satisfaction in Google reviews (last 3 years). Markets are grouped by language.')} />
        {insights.length > 0 && (
          <section className="rb-sec" style={{ paddingTop: 26 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {insights.map((x, i) => <div key={i} className="rb-rise" style={{ background: i === 0 ? 'linear-gradient(135deg, rgba(34,50,74,.6), var(--rb-surface))' : 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '18px 20px', fontSize: 15, lineHeight: 1.6, transitionDelay: `${i * 90}ms` }}>{x}</div>)}
            </div>
          </section>
        )}
        <section className="rb-sec">
          <Titulo h={t('Peso na procura, voz online e satisfação', 'Share of demand, online voice and satisfaction')} cap={t('Clica numa língua para ver como esse mercado avalia cada local', 'Click a language to see how that market rates each place')} />
          <div className="rb-scroll-x">
            <table className="rb-table rb-stack" style={{ fontSize: 14, minWidth: 820 }}>
              <thead><tr><th>{t('Mercado (língua)', 'Market (language)')}</th><th style={{ width: '17%' }}>{t('Dormidas de estrangeiros · jan–jun 2026', 'Foreign stays · Jan–Jun 2026')}</th><th style={{ width: '17%' }}>{t('Comentários em línguas estrangeiras', 'Reviews in foreign languages')}</th><th style={{ width: '17%' }}>{t('Atendimentos a estrangeiros no Posto', 'Foreign visitors at the Tourist Office')}</th><th className="n">{t('Satisfação', 'Satisfaction')}</th></tr></thead>
              <tbody>{linhas.map((z) => (
                <tr key={z.lg} className="rb-row" onClick={() => setSel(z.lg)} style={lgSel === z.lg ? { background: 'var(--rb-accent-bg)' } : undefined}>
                  <td><strong>{nomeLingua(z.lg)}</strong><div style={{ fontSize: 12, color: 'var(--rb-text2)', marginTop: 2 }}>{z.lg === 'pt' ? t(`Brasil e outros lusófonos (sem residentes em Portugal)${z.porPais.length ? ' · ' + z.porPais.map(([p2, v2]) => `${p2} ${fmt(totDorm ? (v2 / totDorm) * 100 : 0, 1)}%`).join(' · ') : ''}`, 'Brazil and other Portuguese-speaking countries (excl. residents in Portugal)') : z.porPais.length ? z.porPais.sort((a2, b2) => b2[1] - a2[1]).slice(0, 4).map(([p2, v2]) => `${p2} ${fmt(totDorm ? (v2 / totDorm) * 100 : 0, 1)}%`).join(' · ') : t('sem dormidas no top do INE', 'not in INE top markets')}</div></td>
                  <td data-label={t('Dormidas de estrangeiros · jan–jun 2026', 'Foreign stays · Jan–Jun 2026')}>{barra(z.pd, '#8AB0E6')}</td>
                  <td data-label={t('Comentários em línguas estrangeiras', 'Reviews in foreign languages')}>{z.pr >= 0 ? barra(z.pr, '#7CC79A') : <span style={{ fontSize: 12.5, color: 'var(--rb-text2)' }}>{t('— (junta residentes em Portugal e brasileiros)', '— (mixes Portuguese residents and Brazilians)')}</span>}</td>
                  <td data-label={t('Atendimentos a estrangeiros no Posto', 'Foreign visitors at the Tourist Office')}>{barra(z.pb, '#E9C46A')}</td>
                  <td className="n" data-label={t('Satisfação', 'Satisfaction')}>{z.avg != null && z.n >= 10 ? <><strong style={{ fontSize: 15 }}>{fmt(z.avg, 2)}</strong> <span style={{ color: 'var(--rb-star)' }}>★</span><div style={{ fontSize: 12, color: z.avg >= mediaGeral ? 'var(--rb-good)' : 'var(--rb-bad)' }}>{z.avg >= mediaGeral ? '+' : ''}{fmt(z.avg - mediaGeral, 2)} {t('vs média', 'vs average')}</div></> : <span style={{ color: 'var(--rb-text2)' }}>—</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>
        {lgSel && (
          <section className="rb-sec">
            <Titulo h={t(`Como avalia o mercado ${nomeLingua(lgSel).toLowerCase()} cada local`, `How the ${nomeLingua(lgSel)} market rates each place`)} cap={t('Locais com pelo menos 10 comentários nesta língua · diferença face à média geral do local', 'Places with at least 10 reviews in this language · difference from the place’s overall average')} />
            {porLocal.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                {porLocal.map(({ l, n, avg, geral }, i) => {
                  const d = avg - geral;
                  return (
                    <div key={l.id} className="rb-rise" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: 'var(--rb-surface)', border: '1px solid var(--rb-line)', borderRadius: 6, padding: '12px 14px', transitionDelay: `${Math.min(i, 10) * 40}ms` }}>
                      <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div><div style={{ fontSize: 12.5, color: 'var(--rb-text2)' }}>{fmt(n)} {t('comentários', 'reviews')} · {fmt(avg, 2)} ★</div></div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: d >= 0.05 ? 'var(--rb-good)' : d <= -0.05 ? 'var(--rb-bad)' : 'var(--rb-text2)', whiteSpace: 'nowrap' }}>{d > 0 ? '+' : ''}{fmt(d, 2)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="rb-sub">{t('Nenhum local com 10 ou mais comentários nesta língua.', 'No place with 10 or more reviews in this language.')}</p>}
          </section>
        )}
        <p className="rb-sub" style={{ marginTop: 32 }}>{t(`Notas: a língua do comentário não é a nacionalidade (o inglês, por exemplo, é usado por muitos visitantes de outros países). Dormidas: INE/TravelBI, 1.º semestre de 2026. Atendimentos: Posto de Turismo, ${anoB || ''}. Comentários: Google Maps, últimos 3 anos, só com texto.`, `Notes: review language is not nationality (English, for instance, is used by many visitors from other countries). Stays: INE/TravelBI, 1st half 2026. Visits: Tourist Office, ${anoB || ''}. Reviews: Google Maps, last 3 years, text only.`)}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUTOS TURÍSTICOS — portefólio da Divisão (mapas, brochuras, roteiros)
// Base fixa aqui; links e capas editáveis na própria página (Firestore: 'produtos', 'produtosCapas').
// ═══════════════════════════════════════════════════════════════════════════
type Lingua = 'pt' | 'es' | 'fr' | 'en' | 'pt-en';
interface Edicao { pagina?: string; pdf?: string }
interface ProdutoBase { id: string; nome: string; tipo: string; descricao: [string, string]; linguas: Lingua[]; base: Partial<Record<Lingua, Edicao>> }
const PRODUTOS: ProdutoBase[] = [
  { id: 'mapa-turistico-oficial', nome: 'Mapa Turístico Oficial de Braga', tipo: 'Mapa', descricao: ['O mapa oficial da cidade, com monumentos, museus e serviços de apoio ao visitante.', 'The official city map, with monuments, museums and visitor services.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/mapa-turistico-oficial-de-braga-portugues/' } } },
  { id: 'brochura-turistica', nome: 'Brochura Turística – Visit Braga', tipo: 'Brochura', descricao: ['A apresentação do destino: património, gastronomia, natureza e experiências.', 'The destination at a glance: heritage, food, nature and experiences.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/brochura-turistica-visit-braga-pt/' } } },
  { id: 'brochura-descobre-a-caminho', nome: 'Brochura Turística – Descobre a caMINHO', tipo: 'Brochura', descricao: ['Brochura bilingue Descobre a caMINHO, em português e inglês.', 'Bilingual Descobre a caMINHO brochure, in Portuguese and English.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/brochura-turistica-descobre-a-caminho-pt-en/' } } },
  { id: 'roteiro-lojas-com-historia', nome: 'Roteiro Lojas com História', tipo: 'Roteiro', descricao: ['Itinerário pelas lojas centenárias e tradicionais reconhecidas pelo Município.', 'Itinerary through the centenary and traditional shops recognised by the Municipality.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-lojas-com-historia-pt-en/' } } },
  { id: 'roteiro-3-dias', nome: 'Roteiro Turístico – Descobrir Braga em 3 Dias', tipo: 'Roteiro', descricao: ['Três dias organizados para conhecer o essencial de Braga.', 'Three days planned to discover the best of Braga.'], linguas: ['pt', 'es', 'fr', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-descobrir-braga-em-3-dias-pt/' } } },
  { id: 'roteiro-cidade-do-bracvs', nome: 'Roteiro Infantojuvenil – "A Cidade do Bracvs"', tipo: 'Roteiro', descricao: ['Um roteiro pensado para crianças e jovens descobrirem a cidade a brincar.', 'An itinerary designed for children and young people to discover the city through play.'], linguas: ['pt', 'es', 'en'],
    base: { pt: { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-infantojuvenil-a-cidade-do-bracvs/' } } },
  { id: 'braga-after-dark', nome: 'Braga After Dark', tipo: 'Roteiro', descricao: ['A cidade à noite: cultura, gastronomia e vida noturna.', 'The city by night: culture, food and nightlife.'], linguas: ['pt-en'],
    base: { 'pt-en': { pagina: 'https://visitbraga.travel/highlights/mapas-roteiros/roteiro-braga-after-dark/' } } },
];
const NOME_LINGUA: Record<Lingua, [string, string]> = { pt: ['Português', 'Portuguese'], es: ['Espanhol', 'Spanish'], fr: ['Francês', 'French'], en: ['Inglês', 'English'], 'pt-en': ['Português e inglês', 'Portuguese and English'] };
const SIGLA: Record<Lingua, string> = { pt: 'PT', es: 'ES', fr: 'FR', en: 'EN', 'pt-en': 'PT · EN' };
// Cor do contorno da cápsula de cada língua (PT e PT·EN mantêm o estilo da plataforma)
const COR_LINGUA: Partial<Record<Lingua, string>> = { es: '#fff116', en: '#ee1d23', fr: '#82d2e8' };
const urlValido = (u: string) => !u || /^https?:\/\/\S+$/i.test(u.trim());

function CartaoProduto({ p, guardado, onGuardar }: { p: ProdutoBase; guardado: Partial<Record<Lingua, Edicao>>; onGuardar: (l: Lingua, e: Edicao) => Promise<void> }) {
  const admin = useAdmin();
  const [capa, setCapa] = useState<string | null | undefined>(undefined);
  const [pronta, setPronta] = useState(false);
  const [aGravarCapa, setAGravarCapa] = useState(false);
  const [editar, setEditar] = useState<Lingua | null>(null);
  const [rasc, setRasc] = useState<Edicao>({});
  const [erro, setErro] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { getDoc(doc(db, 'produtosCapas', p.id)).then((d) => setCapa(d.exists() ? ((d.data() as any).data || null) : null)).catch(() => setCapa(null)); }, [p.id]);
  const carregarCapa = async (fl: File) => {
    setAGravarCapa(true);
    try {
      const url = URL.createObjectURL(fl);
      let d = await reduzir(url, 1000, 0.8);
      if (d.length > 700000) d = await reduzir(url, 900, 0.65);
      URL.revokeObjectURL(url);
      await setDoc(doc(db, 'produtosCapas', p.id), { data: d, atualizadoEm: new Date().toISOString() });
      setPronta(false); setCapa(d);
    } catch { alert(t('Não foi possível carregar a capa.', 'Could not upload the cover.')); } finally { setAGravarCapa(false); }
  };
  const ed = (l: Lingua): Edicao => ({ ...(p.base[l] || {}), ...(guardado[l] || {}) });
  const abrirEdicao = (l: Lingua) => { setEditar(l); setRasc(ed(l)); setErro(null); };
  const gravar = async () => {
    if (!editar) return;
    if (!urlValido(rasc.pdf || '') || !urlValido(rasc.pagina || '')) { setErro(t('Os links têm de começar por http:// ou https://', 'Links must start with http:// or https://')); return; }
    await onGuardar(editar, { pagina: (rasc.pagina || '').trim(), pdf: (rasc.pdf || '').trim() });
    setEditar(null);
  };
  const nPdf = p.linguas.filter((l) => ed(l).pdf).length;
  return (
    <div className="rb-produto rb-rise">
      <div className="rb-produto-capa">
        {capa === undefined && <div className="rb-produto-carrega" />}
        {capa === null && <div className="rb-produto-vazio"><span>{p.tipo}</span></div>}
        {capa && <img src={capa} alt={p.nome} onLoad={() => setPronta(true)} style={{ opacity: pronta ? 1 : 0 }} />}
        <div className="rb-produto-fade" />
        <span className="rb-produto-tipo">{t(p.tipo, p.tipo === 'Mapa' ? 'Map' : p.tipo === 'Brochura' ? 'Brochure' : 'Itinerary')}</span>
        {admin && <button className="rb-produto-btncapa" disabled={aGravarCapa} onClick={() => input.current?.click()}>{aGravarCapa ? t('A guardar…', 'Saving…') : capa ? t('Mudar capa', 'Change cover') : t('+ Capa', '+ Cover')}</button>}
        <input ref={input} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) carregarCapa(fl); }} />
      </div>
      <div className="rb-produto-corpo">
        <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{p.nome}</div>
        <div style={{ fontSize: 13.5, color: 'var(--rb-text2)', lineHeight: 1.5, marginTop: 6 }}>{t(p.descricao[0], p.descricao[1])}</div>
        <div style={{ fontSize: 12, color: nPdf === p.linguas.length ? 'var(--rb-good)' : 'var(--rb-text2)', marginTop: 10, fontWeight: 600 }}>{t(`${nPdf} de ${p.linguas.length} ${p.linguas.length === 1 ? 'edição' : 'edições'} com PDF`, `${nPdf} of ${p.linguas.length} ${p.linguas.length === 1 ? 'edition' : 'editions'} with PDF`)}</div>
        <div style={{ marginTop: 10, borderTop: '1px solid var(--rb-line)' }}>
          {p.linguas.map((l) => {
            const e = ed(l);
            return (
              <div key={l} className="rb-produto-lingua">
                {editar === l ? (
                  <div style={{ display: 'grid', gap: 8, width: '100%' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{SIGLA[l]} · {t(NOME_LINGUA[l][0], NOME_LINGUA[l][1])}</div>
                    <input className="rb-field" placeholder={t('Link do PDF (https://…)', 'PDF link (https://…)')} value={rasc.pdf || ''} onChange={(ev) => setRasc((r) => ({ ...r, pdf: ev.target.value }))} aria-label={t('Link do PDF', 'PDF link')} autoFocus />
                    <input className="rb-field" placeholder={t('Link da página no visitbraga.travel (opcional)', 'Page link on visitbraga.travel (optional)')} value={rasc.pagina || ''} onChange={(ev) => setRasc((r) => ({ ...r, pagina: ev.target.value }))} aria-label={t('Link da página', 'Page link')} />
                    {erro && <div style={{ fontSize: 12.5, color: 'var(--rb-warn)' }}>{erro}</div>}
                    <div style={{ display: 'flex', gap: 6 }}><button className="rb-btn p" onClick={gravar}>{t('Guardar', 'Save')}</button><button className="rb-btn" onClick={() => setEditar(null)}>{t('Cancelar', 'Cancel')}</button></div>
                  </div>
                ) : (
                  <>
                    <span className="rb-produto-sigla" style={{ borderColor: COR_LINGUA[l] || (e.pdf ? 'rgba(124,199,154,.5)' : 'var(--rb-line)'), borderWidth: COR_LINGUA[l] ? 1.5 : 1, color: COR_LINGUA[l] || (e.pdf ? 'var(--rb-good)' : 'var(--rb-text2)') }}>{SIGLA[l]}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                      {e.pdf ? <a className="rb-chip" style={{ height: 30, fontSize: 12.5 }} href={e.pdf} target="_blank" rel="noopener noreferrer">{t('Descarregar PDF', 'Download PDF')} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg></a>
                        : <span style={{ color: 'var(--rb-text2)' }}>{t('PDF por carregar', 'PDF not added yet')}</span>}
                      {e.pagina && <a href={e.pagina} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 10, fontSize: 12.5, color: 'var(--rb-accent)', textDecoration: 'none' }}>{t('Página', 'Page')} ↗</a>}
                    </span>
                    {admin && <button className="rb-chip ghost" style={{ height: 30, fontSize: 12.5 }} onClick={() => abrirEdicao(l)}>{t('Editar', 'Edit')}</button>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProdutosView() {
  const [guardado, setGuardado] = useState<Record<string, Partial<Record<Lingua, Edicao>>>>({});
  const [filtro, setFiltro] = useState<string | null>(null);
  useRevelar(filtro || 'todos');
  useEffect(() => {
    getDocs(collection(db, 'produtos')).then((snap) => {
      const o: Record<string, Partial<Record<Lingua, Edicao>>> = {};
      snap.forEach((d) => { o[d.id] = ((d.data() as any).edicoes || {}) as Partial<Record<Lingua, Edicao>>; });
      setGuardado(o);
    }).catch(() => {});
  }, []);
  const guardar = async (id: string, l: Lingua, e: Edicao) => {
    const novo = { ...(guardado[id] || {}), [l]: e };
    await setDoc(doc(db, 'produtos', id), { edicoes: novo, atualizadoEm: new Date().toISOString() }, { merge: true });
    setGuardado((g) => ({ ...g, [id]: novo }));
  };
  const ed = (p: ProdutoBase, l: Lingua): Edicao => ({ ...(p.base[l] || {}), ...((guardado[p.id] || {})[l] || {}) });
  const edicoes = PRODUTOS.flatMap((p) => p.linguas.map((l) => ({ p, l })));
  const comPdf = edicoes.filter(({ p, l }) => ed(p, l).pdf).length;
  const cobertura = (['pt', 'es', 'fr', 'en'] as Lingua[]).map((l) => {
    const total = PRODUTOS.filter((p) => p.linguas.includes(l) || p.linguas.includes('pt-en') && (l === 'pt' || l === 'en')).length;
    const ok = PRODUTOS.filter((p) => (p.linguas.includes(l) && ed(p, l).pdf) || (p.linguas.includes('pt-en') && (l === 'pt' || l === 'en') && ed(p, 'pt-en').pdf)).length;
    return { l, total, ok };
  });
  const tipos = Array.from(new Set(PRODUTOS.map((p) => p.tipo)));
  const lista = PRODUTOS.filter((p) => !filtro || p.tipo === filtro);
  return (
    <div className="rbx">
      <style>{ESTILO + ESTILO_EXTRA + ESTILO_PRODUTOS}</style>
      <div className="rb-wrap" style={{ maxWidth: 1400 }}>
        <Cabecalho kicker={t('Visit Braga · Divisão de Atividades Económicas e Turismo', 'Visit Braga · Economic Activities and Tourism Division')} titulo={t('Produtos turísticos', 'Tourism products')}
          sub={t('Mapas, brochuras e roteiros criados pela Divisão nos últimos três anos, em todas as línguas disponíveis.', 'Maps, brochures and itineraries created by the Division over the last three years, in every available language.')} />
        <section className="rb-sec" style={{ paddingTop: 26 }}>
          <div className="rb-prod-resumo">
            {/* 1. Produtos por tipo */}
            <div className="rb-prod-bloco rb-rise">
              <div className="rb-lab">{t('Produtos criados', 'Products created')}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 16px' }}>
                <span className="rb-big" style={{ fontSize: 52 }}><Conta v={PRODUTOS.length} /></span>
                <span style={{ color: 'var(--rb-text2)', fontSize: 14 }}>{t('nos últimos três anos', 'in the last three years')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tipos.map((x) => {
                  const n = PRODUTOS.filter((p) => p.tipo === x).length;
                  const ic = x === 'Mapa' ? 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14' : x === 'Brochura' ? 'M2 5h7a3 3 0 013 3v13a2 2 0 00-2-2H2zM22 5h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z' : 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h2M18 9v6a4 4 0 01-4 4h-2';
                  const nome = x === 'Mapa' ? t(n === 1 ? 'mapa' : 'mapas', n === 1 ? 'map' : 'maps') : x === 'Brochura' ? t(n === 1 ? 'brochura' : 'brochuras', n === 1 ? 'brochure' : 'brochures') : t(n === 1 ? 'roteiro' : 'roteiros', n === 1 ? 'itinerary' : 'itineraries');
                  return (
                    <button key={x} className={`rb-prod-tipo${filtro === x ? ' on' : ''}`} onClick={() => setFiltro(filtro === x ? null : x)} title={t('Filtrar', 'Filter')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ic} /></svg>
                      <strong>{n}</strong> {nome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Edições com PDF (anel) */}
            <div className="rb-prod-bloco rb-rise" style={{ transitionDelay: '80ms', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
                <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
                  <circle cx="56" cy="56" r="46" fill="none" stroke="var(--rb-muted)" strokeWidth="9" />
                  <circle className="rb-prod-anel" cx="56" cy="56" r="46" fill="none" stroke={comPdf === edicoes.length ? 'var(--rb-good)' : 'var(--rb-accent)'} strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${(comPdf / Math.max(1, edicoes.length)) * 100} 100`} transform="rotate(-90 56 56)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}><Conta v={Math.round((comPdf / Math.max(1, edicoes.length)) * 100)} />%</span>
                </div>
              </div>
              <div>
                <div className="rb-lab">{t('Edições com PDF', 'Editions with PDF')}</div>
                <div style={{ fontSize: 30, fontWeight: 700, margin: '4px 0 6px', letterSpacing: '-0.02em' }}><Conta v={comPdf} /> <span style={{ fontSize: 18, color: 'var(--rb-text2)', fontWeight: 500 }}>/ {edicoes.length}</span></div>
                <div className="rb-sub" style={{ marginTop: 0 }}>{comPdf === edicoes.length ? t('Todas as edições têm o PDF disponível para descarregar.', 'Every edition has a downloadable PDF.') : t(`Faltam ${edicoes.length - comPdf} PDFs por carregar.`, `${edicoes.length - comPdf} PDFs still to add.`)}</div>
              </div>
            </div>

            {/* 3. Cobertura por língua */}
            <div className="rb-prod-bloco rb-rise" style={{ transitionDelay: '160ms' }}>
              <div className="rb-lab" style={{ marginBottom: 12 }}>{t('Disponível em', 'Available in')}</div>
              {cobertura.map((c, i) => {
                const cor = COR_LINGUA[c.l] || 'var(--rb-accent)';
                return (
                  <div key={c.l} style={{ display: 'grid', gridTemplateColumns: '38px minmax(0,1fr) 42px', gap: 12, alignItems: 'center', margin: '9px 0' }}>
                    <span className="rb-produto-sigla" style={{ borderColor: cor, borderWidth: 1.5, color: cor, minWidth: 38 }}>{SIGLA[c.l]}</span>
                    <div style={{ height: 8, background: 'var(--rb-muted)', borderRadius: 999, overflow: 'hidden' }} title={t(NOME_LINGUA[c.l][0], NOME_LINGUA[c.l][1])}>
                      <div className="rb-bar" style={{ width: `${(c.ok / Math.max(1, c.total)) * 100}%`, height: '100%', background: cor, borderRadius: 999, transitionDelay: `${200 + i * 90}ms` }} />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'right' }}>{c.ok}<span style={{ color: 'var(--rb-text2)', fontWeight: 500 }}>/{c.total}</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="rb-sec">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {[null, ...tipos].map((x) => <button key={x || 'todos'} className={`rb-chip${filtro === x ? '' : ' ghost'}`} onClick={() => setFiltro(x)}>{x ? t(x === 'Roteiro' ? 'Roteiros' : x === 'Mapa' ? 'Mapas' : 'Brochuras', x === 'Roteiro' ? 'Itineraries' : x === 'Mapa' ? 'Maps' : 'Brochures') : t('Todos', 'All')}</button>)}
          </div>
          <div className="rb-produtos-grid">
            {lista.map((p) => <CartaoProduto key={p.id} p={p} guardado={guardado[p.id] || {}} onGuardar={(l, e) => guardar(p.id, l, e)} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
const ESTILO_PRODUTOS = `
.rb-prod-resumo { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1fr) minmax(0,1.1fr); gap: 14px; }
.rb-prod-bloco { background: var(--rb-surface); border: 1px solid var(--rb-line); border-radius: 10px; padding: 20px 22px; position: relative; overflow: hidden; }
.rb-prod-bloco::before { content: ''; position: absolute; inset: 0; background: radial-gradient(360px 140px at 0% 0%, rgba(138,176,230,.08), transparent); pointer-events: none; }
.rb-prod-tipo { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--rb-line); background: rgba(255,255,255,.02); color: var(--rb-text2); font: inherit; font-size: 13px; cursor: pointer; transition: border-color .2s ease, color .2s ease, background .2s ease; }
.rb-prod-tipo strong { color: var(--rb-text); font-size: 14px; }
.rb-prod-tipo svg { color: var(--rb-accent); }
.rb-prod-tipo:hover, .rb-prod-tipo.on { border-color: var(--rb-accent); color: var(--rb-text); background: var(--rb-accent-bg); }
.rb-prod-anel { animation: rbAnelP 1.5s cubic-bezier(.2,.7,.2,1) .2s both; }
@keyframes rbAnelP { from { stroke-dasharray: 0 100; } }
@media (max-width: 1000px) { .rb-prod-resumo { grid-template-columns: 1fr; } }
.rb-produtos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
.rb-produto { background: var(--rb-surface); border: 1px solid var(--rb-line); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
.rb-produto:hover { transform: translateY(-3px); border-color: #3A404B; box-shadow: 0 18px 44px -20px rgba(0,0,0,.75); }
.rb-produto-capa { position: relative; height: 230px; overflow: hidden; background: #1C1F24; }
.rb-produto-capa img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .6s ease, transform .9s cubic-bezier(.2,.7,.2,1); }
.rb-produto:hover .rb-produto-capa img { transform: scale(1.05); }
.rb-produto-carrega { position: absolute; inset: 0; background: linear-gradient(90deg, #1C1F24 0%, #262A31 50%, #1C1F24 100%); background-size: 200% 100%; animation: rbBrilhoP 1.3s ease-in-out infinite; }
@keyframes rbBrilhoP { from { background-position: 100% 0; } to { background-position: -100% 0; } }
.rb-produto-vazio { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(420px 200px at 30% 0%, rgba(138,176,230,.16), transparent), linear-gradient(160deg, #262A31, #1C1F24); }
.rb-produto-vazio span { font-size: 54px; font-weight: 700; color: rgba(255,255,255,.05); letter-spacing: -0.03em; }
.rb-produto-fade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(28,31,36,0) 55%, rgba(28,31,36,.85) 100%); pointer-events: none; }
.rb-produto-tipo { position: absolute; left: 12px; bottom: 12px; padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .04em; color: #ECEDEF; background: rgba(21,23,27,.62); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.rb-produto-btncapa { position: absolute; top: 12px; right: 12px; height: 30px; padding: 0 12px; border-radius: 999px; font: 600 12px 'Public Sans', system-ui, sans-serif; color: #ECEDEF; background: rgba(21,23,27,.62); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); cursor: pointer; opacity: 0; transition: opacity .2s ease; }
.rb-produto:hover .rb-produto-btncapa, .rb-produto-vazio ~ .rb-produto-btncapa { opacity: 1; }
.rb-produto-corpo { padding: 16px 18px 14px; flex: 1; display: flex; flex-direction: column; }
.rb-produto-lingua { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--rb-line); }
.rb-produto-lingua:last-child { border-bottom: 0; }
.rb-produto-sigla { flex-shrink: 0; min-width: 44px; text-align: center; padding: 3px 6px; border-radius: 6px; border: 1px solid var(--rb-line); font-size: 11.5px; font-weight: 700; }
@media (hover: none) { .rb-produto-btncapa { opacity: 1; } }
@media (max-width: 600px) { .rb-produtos-grid { grid-template-columns: 1fr; } .rb-produto-capa { height: 200px; } }
`;
