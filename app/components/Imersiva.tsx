'use client';

import type { ReactNode } from 'react';
import { t } from '@/app/lib/i18n';

// Página imersiva, com a mesma mecânica da Visão Geral: o topo ocupa o ecrã, fica fixo e recua ao descer,
// e o conteúdo chega numa "folha" de cantos arredondados que desliza por cima.
// Os números do topo são apenas apresentados (vêm já calculados de quem usa o componente).

export interface NumeroTopo { v: ReactNode; l: string; s?: string }

export default function Imersiva({ foto, fotoMini, kicker, titulo, sub, numeros, acao, lado, altura = 'cheio', children, classe }: {
  foto: string; fotoMini?: string; kicker: string; titulo: ReactNode; sub?: ReactNode; numeros?: NumeroTopo[]; acao?: ReactNode; lado?: ReactNode;
  altura?: 'cheio' | 'medio'; children: ReactNode; classe?: string;
}) {
  const irConteudo = () => {
    const f = document.querySelector('.im-folha') as HTMLElement | null;
    if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 4, behavior: 'smooth' });
  };
  return (
    <div className={`im im-${altura}${classe ? ` ${classe}` : ''}`}>
      <style>{CSS}</style>
      <section className="im-topo">
        <div className="im-foto" style={{ backgroundImage: fotoMini ? `url(${foto}), url(${fotoMini})` : `url(${foto})` }} aria-hidden="true" />
        <div className="im-sombra" aria-hidden="true" />
        <div className="im-in">
          <div className="im-txt">
            <div className="im-kicker">{kicker}</div>
            <h1 className="im-h1">{titulo}</h1>
            {sub && <p className="im-sub">{sub}</p>}
            {acao && <div className="im-acao">{acao}</div>}
          </div>
          {lado && <div className="im-lado">{lado}</div>}
        </div>
        {numeros && numeros.length > 0 && (
          <div className="im-nums-w">
            <div className="im-nums">
              {numeros.map((n, i) => (
                <div key={i} className="im-num" style={{ animationDelay: `${0.25 + i * 0.08}s` }}>
                  <div className="im-num-v">{n.v}</div>
                  <div className="im-num-l">{n.l}</div>
                  {n.s && <div className="im-num-s">{n.s}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        <button type="button" className="im-cue" onClick={irConteudo} aria-label={t('Ir para o conteúdo', 'Go to the content')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </section>
      <div className="im-folha">
        <span className="im-pega" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

const CSS = `
.im { position: relative; color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.im *, .im *::before, .im *::after { box-sizing: border-box; }
.im-topo { position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; background: #15171B; isolation: isolate; }
.im-cheio .im-topo { min-height: max(640px, 100svh); }
.im-medio .im-topo { min-height: max(520px, 78svh); }
.im-foto { position: absolute; inset: -40px; z-index: -2; background-size: cover; background-position: center; animation: imKb 2.4s cubic-bezier(.2,.7,.2,1) both, imDeriva 30s ease-in-out 2.4s infinite alternate; }
@keyframes imKb { from { transform: scale(1.16); filter: saturate(.6) brightness(.7); } to { transform: scale(1.04); filter: none; } }
@keyframes imDeriva { from { transform: scale(1.04); } to { transform: scale(1.13) translate(-14px, 8px); } }
.im-sombra { position: absolute; inset: 0; z-index: -1; background:
  linear-gradient(180deg, rgba(10,12,15,.5) 0%, rgba(10,12,15,0) 22%),
  linear-gradient(90deg, rgba(10,12,15,.82) 0%, rgba(10,12,15,.5) 45%, rgba(10,12,15,.1) 80%),
  linear-gradient(0deg, rgba(10,12,15,.92) 0%, rgba(10,12,15,.4) 38%, rgba(10,12,15,0) 62%); }
.im-in { width: 100%; max-width: 1400px; margin: 0 auto; padding: 120px 48px 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
.im-txt { width: 100%; max-width: 900px; min-width: 0; }
.im-kicker { display: inline-flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #B7CDF0; animation: imSobe .9s cubic-bezier(.2,.7,.2,1) .1s both; }
.im-kicker::before { content: ''; width: 26px; height: 2px; border-radius: 2px; background: #8AB0E6; }
.im-h1 { font-size: clamp(42px, 6.4vw, 92px); font-weight: 700; letter-spacing: -0.035em; line-height: .98; margin: 16px 0 18px; text-shadow: 0 2px 30px rgba(0,0,0,.45); animation: imSobe 1s cubic-bezier(.2,.7,.2,1) .18s both; }
.im-h1 span { color: #B7CDF0; }
.im-medio .im-h1 { font-size: clamp(38px, 5.2vw, 72px); }
.im-sub { font-size: clamp(15.5px, 1.25vw, 18px); line-height: 1.6; color: rgba(236,237,239,.86); max-width: 720px; margin: 0; text-shadow: 0 1px 16px rgba(0,0,0,.5); animation: imSobe 1s cubic-bezier(.2,.7,.2,1) .26s both; }
.im-acao { margin-top: 26px; max-width: 760px; animation: imSobe 1s cubic-bezier(.2,.7,.2,1) .34s both; }
.im-lado { flex-shrink: 0; animation: imSobe 1s cubic-bezier(.2,.7,.2,1) .3s both; }
@keyframes imSobe { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
.im-nums-w { width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 48px 96px; }
.im-nums { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); border-radius: 22px; overflow: hidden; background: rgba(15,17,21,.5); border: 1px solid rgba(255,255,255,.1); backdrop-filter: blur(20px) saturate(150%); -webkit-backdrop-filter: blur(20px) saturate(150%); box-shadow: 0 30px 70px -36px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.08); }
.im-num { padding: 20px 24px 22px; border-left: 1px solid rgba(255,255,255,.08); min-width: 0; animation: imSobe .9s cubic-bezier(.2,.7,.2,1) both; }
.im-num:first-child { border-left: 0; }
.im-num-v { font-size: clamp(28px, 2.6vw, 40px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; white-space: nowrap; }
.im-num-l { font-size: 13.5px; color: #C9CDD3; margin-top: 6px; line-height: 1.4; }
.im-num-s { font-size: 12.5px; color: #7CC79A; margin-top: 3px; font-weight: 600; }
.im-cue { position: absolute; left: 50%; bottom: 30px; z-index: 4; width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgba(255,255,255,.28); background: rgba(21,23,27,.45); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #ECEDEF; display: flex; align-items: center; justify-content: center; cursor: pointer; animation: imCue 2.4s ease-in-out infinite; }
.im-cue:hover { background: rgba(21,23,27,.75); }
@keyframes imCue { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 7px); } }
.im-folha { position: relative; z-index: 2; margin-top: -40px; background: #15171B; border-radius: 34px 34px 0 0; box-shadow: 0 -30px 60px -20px rgba(0,0,0,.75), 0 -1px 0 rgba(255,255,255,.07); min-height: 60vh; }
.im-pega { display: block; width: 48px; height: 4px; border-radius: 999px; background: rgba(255,255,255,.16); margin: 0 auto; position: relative; top: 12px; }
/* Mesmo efeito da Visão Geral: o topo fica fixo, recua e escurece enquanto a folha sobe */
@media (min-width: 901px) {
  .im-topo { position: sticky; top: 0; z-index: 0; }
  @supports (animation-timeline: scroll()) {
    .im-cheio .im-topo { animation: imRecua linear both; animation-timeline: scroll(root); animation-range: 0 100svh; }
    .im-medio .im-topo { animation: imRecua linear both; animation-timeline: scroll(root); animation-range: 0 78svh; }
    .im-topo::after { content: ''; position: absolute; inset: 0; z-index: 5; background: #0A0C0F; opacity: 0; pointer-events: none; animation: imEscurece linear both; animation-timeline: scroll(root); animation-range: 0 90svh; }
    @keyframes imRecua { from { transform: scale(1); border-radius: 0; } to { transform: scale(.93); border-radius: 34px; } }
    @keyframes imEscurece { to { opacity: .65; } }
  }
}
@media (max-width: 900px) {
  .im-cheio .im-topo { min-height: 88svh; }
  .im-medio .im-topo { min-height: 64svh; }
  .im-in { padding: 96px 18px 18px; flex-direction: column; align-items: flex-start; gap: 18px; }
  .im-h1 { font-size: clamp(36px, 10vw, 48px); margin: 12px 0 14px; }
  .im-nums-w { padding: 0 14px 74px; }
  .im-nums { grid-template-columns: repeat(2, minmax(0,1fr)); border-radius: 18px; }
  .im-num { padding: 14px 16px 16px; border-left: 0; border-top: 1px solid rgba(255,255,255,.08); }
  .im-num:nth-child(-n+2) { border-top: 0; } .im-num:nth-child(even) { border-left: 1px solid rgba(255,255,255,.08); }
  .im-num-v { font-size: 26px; }
  .im-cue { bottom: 18px; }
  .im-folha { margin-top: -28px; border-radius: 26px 26px 0 0; }
  .im-sombra { background: linear-gradient(180deg, rgba(10,12,15,.6) 0%, rgba(10,12,15,.15) 26%), linear-gradient(0deg, rgba(10,12,15,.95) 0%, rgba(10,12,15,.62) 48%, rgba(10,12,15,.3) 100%); }
}
@media (prefers-reduced-motion: reduce) { .im *, .im-topo, .im-topo::after { animation: none !important; } }
@media print {
  .im-topo { min-height: 0 !important; position: relative !important; background: none; color: #16171A; }
  .im-foto, .im-sombra, .im-cue, .im-nums-w, .im-acao, .im-pega { display: none !important; }
  .im-in { padding: 0 0 16px; } .im-h1 { text-shadow: none; font-size: 30px; } .im-sub { color: #52555C; text-shadow: none; }
  .im-folha { margin: 0; box-shadow: none; border-radius: 0; background: none; }
}
`;
