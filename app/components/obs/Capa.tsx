'use client';

import { useEffect, useState } from 'react';
import { t, dl } from '@/app/lib/i18n';
import { MESES, MESES_CURTO, DORMIDAS_BRAGA, DORMIDAS_PORTUGAL, SEMESTRE_2026 } from '@/app/lib/observatorio-dados';
import { POP_BRAGA, POP_PORTUGAL, AREA_KM2, AREA_PORTUGAL_KM2, ETARIA_2025, NATURAL_2025, crescimento, densidade } from '@/app/lib/demografia-braga';
import { ContaTexto, fmt } from './comum';
import RodaAno from './RodaAno';

// ─── CAPÍTULOS DA CAPA (Visão Geral) ─────────────────────────────────────────
// Cada capítulo é uma "folha" que desliza por cima da anterior (cantos arredondados, sem sombras a desvanecer).
// Funcional: separadores nos números do concelho, métricas do turismo, painel de portas que se expande e navegação lateral.

const FOTO = {
  bomJesus: '/fotos/bom-jesus-g.jpg',
  santaBarbara: '/fotos/jardim-santa-barbara-g.jpg',
};

const CSS = `
.rb-cap { position: relative; isolation: isolate; overflow: hidden; background: #15171B; color: #ECEDEF; scroll-margin-top: 0; }
.rb-cap-folha { margin-top: -28px; border-radius: 28px 28px 0 0; z-index: 2; }
.rb-cap-img { position: absolute; inset: -6% 0; z-index: -2; background-size: cover; background-position: center; will-change: transform; }
@supports (animation-timeline: view()) {
  .rb-cap-img { animation: rbCapZoom linear both; animation-timeline: view(); }
  @keyframes rbCapZoom { from { transform: scale(1.16) translateY(-4%); } to { transform: scale(1) translateY(4%); } }
}
.rb-cap-tint { position: absolute; inset: 0; z-index: -1; background: rgba(14,16,20,.5); }
.rb-cap-in { max-width: 1120px; margin: 0 auto; padding: clamp(64px, 8vw, 112px) 48px clamp(72px, 9vw, 120px); }
.rb-cap-sol { background: #15171B; }
.rb-cap-alca { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 46px; height: 4px; border-radius: 999px; background: rgba(255,255,255,.4); z-index: 3; }
@supports (animation-timeline: view()) {
  .rb-cap-folha { animation: rbFolha linear both; animation-timeline: view(); animation-range: entry 0% entry 42%; }
  @keyframes rbFolha { from { transform: scale(.925); border-radius: 46px 46px 0 0; } to { transform: scale(1); border-radius: 28px 28px 0 0; } }
}

.rb-cap-kick { font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #B7CDF0; text-shadow: 0 1px 12px rgba(0,0,0,.6); }
.rb-cap-h2 { font-size: clamp(30px, 4.6vw, 60px); font-weight: 700; letter-spacing: -0.028em; line-height: 1.05; max-width: 13em; margin: 12px 0 0; text-shadow: 0 2px 24px rgba(0,0,0,.4); }
.rb-cap-sub { font-size: 17px; color: #E4E6EA; margin: 14px 0 0; max-width: 40em; line-height: 1.5; text-shadow: 0 1px 14px rgba(0,0,0,.6); }
.rb-cap-fonte { font-size: 12.5px; color: #C9CDD4; margin: 0; line-height: 1.5; text-shadow: 0 1px 10px rgba(0,0,0,.7); }
.rb-cap-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0 28px; margin-top: 40px; }
.rb-cap-num { border-top: 1px solid rgba(255,255,255,.34); padding-top: 18px; }
.rb-cap-num-v { font-size: clamp(32px, 3.7vw, 54px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; white-space: nowrap; text-shadow: 0 2px 18px rgba(0,0,0,.45); }
.rb-cap-num-v small { font-size: .32em; font-weight: 500; color: #D5D8DE; margin-left: 8px; letter-spacing: 0; }
.rb-cap-num-l { font-size: 16px; color: #F4F5F7; margin-top: 10px; line-height: 1.35; text-shadow: 0 1px 12px rgba(0,0,0,.7); }
.rb-cap-num-s { font-size: 13.5px; color: #C9CDD4; margin-top: 4px; text-shadow: 0 1px 10px rgba(0,0,0,.7); }
.rb-cap-vidro { background: rgba(14,16,20,.58); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; -webkit-backdrop-filter: blur(16px) saturate(140%); backdrop-filter: blur(16px) saturate(140%); }
.rb-cap-painel { margin-top: 34px; padding: 22px 26px 24px; }
.rb-cap-abas { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.rb-cap-aba { height: 34px; padding: 0 15px; border-radius: 999px; border: 1px solid rgba(255,255,255,.22); background: transparent; color: #E4E6EA; font: 600 13.5px inherit; font-family: inherit; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.rb-cap-aba:hover { border-color: rgba(255,255,255,.5); }
.rb-cap-aba[aria-selected="true"] { background: #8AB0E6; border-color: #8AB0E6; color: #0F1216; }
.rb-cap-aba:focus-visible, .rb-pan-i:focus-visible, .rb-cap-nav button:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
.rb-cap-linha { display: grid; grid-template-columns: 74px minmax(0, 1fr) 96px; align-items: center; gap: 14px; margin: 11px 0; font-size: 14.5px; }
.rb-cap-linha > span:first-child { color: #D5D8DE; }
.rb-cap-linha > span:last-child { text-align: right; font-weight: 700; }
.rb-cap-trilho { height: 12px; border-radius: 999px; background: rgba(255,255,255,.12); overflow: hidden; }
.rb-cap-barra { height: 100%; border-radius: 999px; transform-origin: left; animation: rbBarraX .9s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--i, 0) * 90ms); }
@keyframes rbBarraX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.rb-cap-emp { display: flex; height: 38px; border-radius: 8px; overflow: hidden; gap: 2px; }
.rb-cap-emp > div { display: flex; align-items: center; justify-content: center; font-size: 13.5px; font-weight: 700; color: #0F1216; min-width: 0; transform-origin: left; animation: rbBarraX .9s cubic-bezier(.2,.7,.2,1) both; }
.rb-cap-leg { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: #D5D8DE; margin-top: 12px; }
.rb-cap-leg i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 7px; }
.rb-cap-nota { font-size: 14.5px; color: #E4E6EA; line-height: 1.5; margin: 16px 0 0; }
.rb-cap-nota b { color: #fff; }
.rb-cap-met { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 34px; align-items: end; }
.rb-cap-grande { font-size: clamp(40px, 5vw, 64px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; margin-top: 4px; text-shadow: 0 2px 18px rgba(0,0,0,.45); white-space: nowrap; }
.rb-cap-var { font-size: 15px; margin-top: 8px; font-weight: 600; }
.rb-cap-graf { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; height: 190px; align-items: end; }
.rb-cap-par { display: flex; flex-direction: column; justify-content: flex-end; height: 100%; min-width: 0; }
.rb-cap-par-b { display: flex; gap: 4px; align-items: flex-end; flex: 1; min-height: 0; }
.rb-cap-par-b > div { flex: 1; border-radius: 5px 5px 0 0; transform-origin: bottom; animation: rbBarraY .85s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--i, 0) * 70ms); }
@keyframes rbBarraY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.rb-cap-par-m { font-size: 12.5px; color: #D5D8DE; text-align: center; margin-top: 8px; }
.rb-cap-par-d { font-size: 12px; font-weight: 700; text-align: center; margin-bottom: 5px; }
.rb-pan { display: flex; gap: 12px; height: 470px; margin-top: 34px; }
.rb-pan-i { position: relative; flex: 1 1 0; min-width: 0; border: 0; padding: 0; border-radius: 14px; overflow: hidden; cursor: pointer; text-align: left; color: #fff; background: #22262D; isolation: isolate; transition: flex-grow .7s cubic-bezier(.2,.7,.2,1); display: block; }
.rb-pan-i.on { flex-grow: 3.4; }
.rb-pan-img { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center; transition: transform 1s cubic-bezier(.2,.7,.2,1); }
.rb-pan-i.on .rb-pan-img { transform: scale(1.06); }
.rb-pan-i::after { content: ''; position: absolute; inset: 0; z-index: -1; background: rgba(10,12,15,.36); transition: background .5s ease; }
.rb-pan-i.on::after { background: rgba(10,12,15,.12); }
.rb-pan-txt { position: absolute; left: 12px; right: 12px; bottom: 12px; padding: 14px 16px; border-radius: 10px; background: rgba(14,16,20,.62); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); display: block; }
.rb-pan-t { display: flex; align-items: center; gap: 10px; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; }
.rb-pan-i.on .rb-pan-t { font-size: 24px; }
.rb-pan-p { display: block; max-height: 0; opacity: 0; overflow: hidden; font-size: 14.5px; line-height: 1.45; color: rgba(236,237,239,.9); transition: max-height .6s ease, opacity .4s ease .15s, margin .4s ease; margin: 0; }
.rb-pan-i.on .rb-pan-p { max-height: 90px; opacity: 1; margin-top: 6px; }
.rb-pan-i svg { flex-shrink: 0; transition: transform .3s ease; }
@media (min-width: 901px) and (hover: hover) {
  .rb-pan-i:not(.on) .rb-pan-txt { top: auto; bottom: 12px; left: 50%; right: auto; transform: translateX(-50%) rotate(180deg); writing-mode: vertical-rl; padding: 16px 9px; }
  .rb-pan-i:not(.on) .rb-pan-txt { height: max-content; width: max-content; }
  .rb-pan-i:not(.on) .rb-pan-t { display: block; overflow: visible; font-size: 17px; height: max-content; }
  .rb-pan-i:not(.on) .rb-pan-t svg { display: none; }
  .rb-pan-i:not(.on) .rb-pan-p { display: none; }
}
.rb-pan-i:hover svg { transform: translateX(4px); }
.rb-cap-nav { position: fixed; right: 18px; top: 50%; transform: translateY(-50%); z-index: 40; display: flex; flex-direction: column; gap: 6px; }
.rb-cap-nav button { position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 10px; height: 26px; padding: 0 2px 0 8px; border: 0; background: none; cursor: pointer; color: #ECEDEF; font: 600 12px inherit; font-family: inherit; }
.rb-cap-nav .rb-cap-rot { opacity: 0; transform: translateX(6px); transition: opacity .2s, transform .2s; white-space: nowrap; padding: 4px 10px; border-radius: 999px; background: rgba(14,16,20,.78); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); pointer-events: none; }
.rb-cap-nav button:hover .rb-cap-rot, .rb-cap-nav button:focus-visible .rb-cap-rot { opacity: 1; transform: none; }
.rb-cap-nav .rb-cap-pt { width: 10px; height: 10px; border-radius: 999px; border: 2px solid rgba(255,255,255,.8); background: rgba(14,16,20,.5); transition: background .25s, transform .25s, border-color .25s; flex-shrink: 0; }
.rb-cap-nav button[aria-current="true"] .rb-cap-pt { background: #8AB0E6; border-color: #8AB0E6; transform: scale(1.35); }
@media (max-width: 1150px) { .rb-cap-nav { display: none; } }
@media (max-width: 1000px) { .rb-cap-nums { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 32px; } .rb-cap-met { grid-template-columns: 1fr; gap: 22px; } }
@media (max-width: 900px) {
  .rb-cap-in { padding: 56px 20px 64px; }
  .rb-cap-folha { margin-top: -20px; border-radius: 20px 20px 0 0; }
  .rb-cap-painel { padding: 18px 16px 20px; }
  .rb-cap-linha { grid-template-columns: 56px minmax(0, 1fr) 84px; gap: 10px; }
  .rb-pan { flex-direction: column; height: auto; }
  .rb-pan-i, .rb-pan-i.on { flex: none; height: 210px; }
  .rb-pan-i .rb-pan-p { max-height: 90px; opacity: 1; margin-top: 6px; }
  .rb-pan-i .rb-pan-t, .rb-pan-i.on .rb-pan-t { font-size: 21px; }
}
@media (hover: none) { .rb-pan { flex-direction: column; height: auto; } .rb-pan-i, .rb-pan-i.on { flex: none; height: 210px; } .rb-pan-i .rb-pan-p { max-height: 90px; opacity: 1; margin-top: 6px; } }
@media (prefers-reduced-motion: reduce) { .rb-cap-img, .rb-cap-folha { animation: none !important; } .rb-cap-barra, .rb-cap-par-b > div, .rb-cap-emp > div { animation: none; } .rb-pan-i, .rb-pan-img, .rb-pan-p { transition: none; } }
@media print { .rb-cap-nav, .rb-pan { display: none; } .rb-cap-img, .rb-cap-tint { display: none; } .rb-cap-folha { margin-top: 0; border-radius: 0; } }
`;

const Seta = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6l6 6-6 6" /></svg>;
const pct = (v: number, d = 1) => `${fmt(v, d)}%`;
const sinal = (v: number, d = 1) => `${v >= 0 ? '+' : ''}${fmt(v, d)}`;

type Aba = 'pop' | 'ger' | 'ren';
function Numeros() {
  const [aba, setAba] = useState<Aba>('pop');
  const crescB = crescimento(2011, 2025, POP_BRAGA), crescP = crescimento(2011, 2025, POP_PORTUGAL);
  const E = ETARIA_2025, N = NATURAL_2025;
  const nasc100B = (N.Braga.nascimentos / N.Braga.obitos) * 100, nasc100P = (N.Portugal.nascimentos / N.Portugal.obitos) * 100;
  const abas: [Aba, string][] = [['pop', t('População', 'Population')], ['ger', t('Gerações', 'Generations')], ['ren', t('Renovação', 'Renewal')]];
  const anos = [2011, 2021, 2024, 2025];
  const max = POP_BRAGA[2025];

  return (
    <section id="rb-cap-numeros" className="rb-cap rb-cap-folha" aria-label={t('Braga em números', 'Braga in numbers')}>
      <div className="rb-cap-img" style={{ backgroundImage: `url(${FOTO.bomJesus})` }} />
      <div className="rb-cap-tint" />
      <span className="rb-cap-alca" aria-hidden="true" />
      <div className="rb-cap-in">
        <div className="rb-rise">
          <div className="rb-cap-kick">01 · {t('Braga em números', 'Braga in numbers')}</div>
          <h2 className="rb-cap-h2">{t('Uma cidade que cresce e se renova.', 'A city that keeps growing and renewing itself.')}</h2>
        </div>
        <div className="rb-cap-nums">
          {[
            { v: fmt(POP_BRAGA[2025]), l: t('habitantes', 'inhabitants'), s: t('população residente em 2025', 'resident population in 2025') },
            { v: <>{fmt(Math.round(densidade(2025)))}<small>{t('hab./km²', 'inh./km²')}</small></>, l: t('de densidade populacional', 'population density'), s: t(`Portugal: ${fmt(POP_PORTUGAL[2025] / AREA_PORTUGAL_KM2)} hab./km²`, `Portugal: ${fmt(POP_PORTUGAL[2025] / AREA_PORTUGAL_KM2)} inh./km²`) },
            { v: <>{`+${fmt(crescB, 1)}`}<small>%</small></>, l: t('desde 2011', 'since 2011'), s: `Portugal: +${fmt(crescP, 1)}%` },
            { v: String(E.Braga.idososPor100Jovens), l: t('idosos por cada 100 jovens', 'seniors per 100 young people'), s: `Portugal: ${E.Portugal.idososPor100Jovens}` },
          ].map((k, i) => (
            <div key={i} className="rb-cap-num rb-rise" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="rb-cap-num-v">{typeof k.v === 'string' ? <ContaTexto texto={k.v} /> : k.v}</div>
              <div className="rb-cap-num-l">{k.l}</div>
              <div className="rb-cap-num-s">{k.s}</div>
            </div>
          ))}
        </div>

        <div className="rb-cap-vidro rb-cap-painel rb-rise">
          <div className="rb-cap-abas" role="tablist" aria-label={t('Demografia de Braga', 'Braga demographics')}>
            {abas.map(([id, nome]) => (
              <button key={id} type="button" role="tab" id={`rb-aba-${id}`} aria-selected={aba === id} aria-controls="rb-aba-painel" className="rb-cap-aba" onClick={() => setAba(id)}>{nome}</button>
            ))}
          </div>
          <div id="rb-aba-painel" role="tabpanel" aria-labelledby={`rb-aba-${aba}`} key={aba}>
            {aba === 'pop' && (
              <>
                {anos.map((a, i) => (
                  <div className="rb-cap-linha" key={a}>
                    <span>{a}</span>
                    <div className="rb-cap-trilho"><div className="rb-cap-barra" style={{ width: `${(POP_BRAGA[a] / max) * 100}%`, background: a === 2025 ? '#8AB0E6' : 'rgba(138,176,230,.55)', ['--i' as any]: i }} /></div>
                    <span>{fmt(POP_BRAGA[a])}</span>
                  </div>
                ))}
                <p className="rb-cap-nota">{t(`Braga ganhou `, `Braga gained `)}<b>{fmt(POP_BRAGA[2025] - POP_BRAGA[2011])}</b>{t(` habitantes desde 2011 (+${fmt(crescB, 1)}%), mais do dobro do ritmo de Portugal (+${fmt(crescP, 1)}%).`, ` residents since 2011 (+${fmt(crescB, 1)}%), more than twice the pace of Portugal (+${fmt(crescP, 1)}%).`)}</p>
              </>
            )}
            {aba === 'ger' && (
              <>
                {([['Braga', E.Braga], ['Portugal', E.Portugal]] as const).map(([nome, d], gi) => (
                  <div key={nome} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 14, color: '#E4E6EA', marginBottom: 6, fontWeight: 600 }}>{nome}</div>
                    <div className="rb-cap-emp">
                      <div style={{ flex: d.jovens, background: '#7CC79A', animationDelay: `${gi * 120}ms` }}>{d.jovens >= 9 ? pct(d.jovens) : ''}</div>
                      <div style={{ flex: d.ativa, background: '#8AB0E6', animationDelay: `${gi * 120 + 90}ms` }}>{pct(d.ativa)}</div>
                      <div style={{ flex: d.idosos, background: '#EDA06B', animationDelay: `${gi * 120 + 180}ms` }}>{pct(d.idosos)}</div>
                    </div>
                  </div>
                ))}
                <div className="rb-cap-leg"><span><i style={{ background: '#7CC79A' }} />{t('Jovens (0–14)', 'Young (0–14)')}</span><span><i style={{ background: '#8AB0E6' }} />{t('Idade ativa (15–64)', 'Working age (15–64)')}</span><span><i style={{ background: '#EDA06B' }} />{t('Idosos (65+)', 'Seniors (65+)')}</span></div>
                <p className="rb-cap-nota">{t('Braga tem mais jovens e menos idosos do que o país: ', 'Braga has more young people and fewer seniors than the country: ')}<b>{E.Braga.idososPor100Jovens}</b>{t(` idosos por cada 100 jovens, contra ${E.Portugal.idososPor100Jovens} em Portugal.`, ` seniors per 100 young people, against ${E.Portugal.idososPor100Jovens} in Portugal.`)}</p>
              </>
            )}
            {aba === 'ren' && (
              <>
                {([[t('Braga', 'Braga'), nasc100B, '#8AB0E6'], ['Portugal', nasc100P, 'rgba(236,237,239,.55)']] as [string, number, string][]).map(([nome, v, cor], i) => (
                  <div className="rb-cap-linha" key={nome} style={{ gridTemplateColumns: '74px minmax(0, 1fr) 140px' }}>
                    <span>{nome}</span>
                    <div className="rb-cap-trilho" style={{ position: 'relative' }}>
                      <div className="rb-cap-barra" style={{ width: `${(v / 130) * 100}%`, background: cor, ['--i' as any]: i }} />
                      <span style={{ position: 'absolute', left: `${(100 / 130) * 100}%`, top: -4, bottom: -4, width: 2, background: '#fff', opacity: 0.85 }} aria-hidden="true" />
                    </div>
                    <span>{fmt(v, 0)} {t('por 100', 'per 100')}</span>
                  </div>
                ))}
                <p className="rb-cap-nota">{t('Por cada 100 óbitos nasceram ', 'For every 100 deaths there were ')}<b>{fmt(nasc100B, 0)}</b>{t(` crianças em Braga em 2025 (${fmt(N.Braga.nascimentos)} nascimentos, ${fmt(N.Braga.obitos)} óbitos), contra ${fmt(nasc100P, 0)} no país. A linha branca marca o equilíbrio (100).`, ` births in Braga in 2025 (${fmt(N.Braga.nascimentos)} births, ${fmt(N.Braga.obitos)} deaths), against ${fmt(nasc100P, 0)} nationally. The white line marks balance (100).`)}</p>
              </>
            )}
          </div>
        </div>
        <p className="rb-cap-fonte" style={{ marginTop: 22 }}>{t(`Fonte: INE, O seu município em números (2025). Densidade calculada com a superfície arredondada (${AREA_KM2} km²).`, `Source: INE (Statistics Portugal), Your municipality in numbers (2025). Density calculated with the rounded area (${AREA_KM2} km²).`)}</p>
      </div>
    </section>
  );
}

type Met = 'dorm' | 'prov' | 'revpar' | 'ocup';
function Turismo({ onObservatorio }: { onObservatorio?: () => void }) {
  const [met, setMet] = useState<Met>('dorm');
  const S: any = SEMESTRE_2026 as any;
  const H1 = (MESES as any[]).slice(0, 6);
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const media = (v: number[]) => soma(v) / v.length;
  const varP = (a: number, b: number) => Math.round((b / a - 1) * 1000) / 10;
  const dB = (y: string) => H1.map((m: any) => DORMIDAS_BRAGA[m]?.[y] ?? 0);
  const dP = (y: string) => H1.map((m: any) => (DORMIDAS_PORTUGAL as any)[m]?.[y] ?? 0);
  const est = S.residencia?.dormidas?.Estrangeiro, res = S.residencia?.dormidas?.Portugal;
  const topM = S.mercadosDormidas ? [...S.mercadosDormidas].sort((x: any[], y: any[]) => y[2] - x[2])[0] : null;

  const M: Record<Met, { nome: string; a: number[]; b: number[]; valor: string; variacao: string; bom: boolean; extra?: string }> = {
    dorm: (() => { const a = dB('2025'), b = dB('2026'); const v = varP(soma(a), soma(b)); const vp = varP(soma(dP('2025')), soma(dP('2026'))); return { nome: t('Dormidas', 'Overnight stays'), a, b, valor: fmt(soma(b)), variacao: `${sinal(v)}% ${t('face a 2025', 'vs 2025')} · Portugal ${sinal(vp)}%`, bom: v >= 0 }; })(),
    prov: (() => { const a = S.proveitos.Braga['2025'], b = S.proveitos.Braga['2026']; const v = varP(soma(a), soma(b)); return { nome: t('Proveitos do alojamento', 'Accommodation revenue'), a, b, valor: `${fmt(soma(b) / 1e6, 2)} M€`, variacao: `${sinal(v)}% ${t('face a 2025', 'vs 2025')}`, bom: v >= 0 }; })(),
    revpar: (() => { const a = S.revpar.Braga['2025'], b = S.revpar.Braga['2026']; const v = varP(media(a), media(b)); return { nome: 'RevPAR', a, b, valor: `${fmt(media(b), 1)} €`, variacao: `${sinal(v)}% ${t('face a 2025 · média dos 6 meses', 'vs 2025 · 6-month average')}`, bom: v >= 0 }; })(),
    ocup: (() => { const a = S.ocupQuarto.Braga['2025'], b = S.ocupQuarto.Braga['2026']; const d = media(b) - media(a); return { nome: t('Ocupação-quarto', 'Room occupancy'), a, b, valor: `${fmt(media(b), 1)}%`, variacao: `${sinal(d)} ${t('p.p. face a 2025', 'p.p. vs 2025')}`, bom: d >= 0 }; })(),
  };
  const m = M[met];
  const mx = Math.max(...m.a, ...m.b) || 1;
  const dorm = soma(M.dorm.b), dormV = varP(soma(M.dorm.a), dorm), dormPT = varP(soma(dP('2025')), soma(dP('2026')));
  if (!dorm) return null;
  const nomes: [Met, string][] = [['dorm', t('Dormidas', 'Overnight stays')], ['prov', t('Proveitos', 'Revenue')], ['revpar', 'RevPAR'], ['ocup', t('Ocupação', 'Occupancy')]];

  return (
    <section id="rb-cap-turismo" className="rb-cap rb-cap-folha" aria-label={t('Turismo', 'Tourism')}>
      <div className="rb-cap-img" style={{ backgroundImage: `url(${FOTO.santaBarbara})` }} />
      <div className="rb-cap-tint" />
      <span className="rb-cap-alca" aria-hidden="true" />
      <div className="rb-cap-in">
        <div className="rb-rise">
          <div className="rb-cap-kick">02 · {t('Turismo', 'Tourism')}</div>
          <h2 className="rb-cap-h2">{dormV >= dormPT ? t('Cada vez mais gente escolhe Braga.', 'More and more people choose Braga.') : t('O turismo em Braga, a meio de 2026.', 'Tourism in Braga, mid-2026.')}</h2>
          <p className="rb-cap-sub">{dormV >= dormPT ? t(`As dormidas em Braga crescem ${sinal(dormV)}%, acima do país (${sinal(dormPT)}%).`, `Overnight stays in Braga grow ${sinal(dormV)}%, above the country (${sinal(dormPT)}%).`) : t(`As dormidas em Braga variam ${sinal(dormV)}% (país: ${sinal(dormPT)}%).`, `Overnight stays in Braga change ${sinal(dormV)}% (country: ${sinal(dormPT)}%).`)}</p>
        </div>

        <div className="rb-cap-vidro rb-cap-painel rb-rise">
          <div className="rb-cap-abas" role="tablist" aria-label={t('Indicador de turismo', 'Tourism indicator')}>
            {nomes.map(([id, nome]) => (
              <button key={id} type="button" role="tab" id={`rb-met-${id}`} aria-selected={met === id} aria-controls="rb-met-painel" className="rb-cap-aba" onClick={() => setMet(id)}>{nome}</button>
            ))}
          </div>
          <div id="rb-met-painel" role="tabpanel" aria-labelledby={`rb-met-${met}`} key={met} className="rb-cap-met">
            <div>
              <div style={{ fontSize: 14, color: '#D5D8DE' }}>{m.nome} · {t('jan–jun 2026', 'Jan–Jun 2026')}</div>
              <div className="rb-cap-grande"><ContaTexto texto={m.valor} /></div>
              <div className="rb-cap-var" style={{ color: m.bom ? '#7CC79A' : '#EF8A7B' }}>{m.variacao}</div>
            </div>
            <div>
              <div className="rb-cap-graf" role="img" aria-label={`${m.nome}: ${H1.map((mm: any, i: number) => `${dl(MESES_CURTO[i])} 2025 ${fmt(m.a[i], met === 'dorm' || met === 'prov' ? 0 : 1)}, 2026 ${fmt(m.b[i], met === 'dorm' || met === 'prov' ? 0 : 1)}`).join('; ')}`}>
                {H1.map((_: any, i: number) => {
                  const d = m.a[i] ? (met === 'ocup' ? m.b[i] - m.a[i] : (m.b[i] / m.a[i] - 1) * 100) : 0;
                  return (
                    <div className="rb-cap-par" key={i}>
                      <div className="rb-cap-par-d" style={{ color: d >= 0 ? '#7CC79A' : '#EF8A7B' }}>{sinal(d, met === 'ocup' ? 1 : 0)}{met === 'ocup' ? '' : '%'}</div>
                      <div className="rb-cap-par-b">
                        <div title={`2025: ${fmt(m.a[i], 1)}`} style={{ height: `${(m.a[i] / mx) * 100}%`, background: 'rgba(236,237,239,.5)', ['--i' as any]: i }} />
                        <div title={`2026: ${fmt(m.b[i], 1)}`} style={{ height: `${(m.b[i] / mx) * 100}%`, background: '#8AB0E6', ['--i' as any]: i + 0.5 }} />
                      </div>
                      <div className="rb-cap-par-m">{dl(MESES_CURTO[i])}</div>
                    </div>
                  );
                })}
              </div>
              <div className="rb-cap-leg" style={{ justifyContent: 'center' }}><span><i style={{ background: 'rgba(236,237,239,.5)' }} />2025</span><span><i style={{ background: '#8AB0E6' }} />2026</span></div>
            </div>
          </div>
          {est && res ? <p className="rb-cap-nota" style={{ marginTop: 18 }}><b>{pct((est / (est + res)) * 100)}</b>{t(' das dormidas são de estrangeiros', ' of overnight stays are by foreign visitors')}{topM ? t(` · maior mercado: ${topM[0]} (${pct((topM[2] / est) * 100)})`, ` · largest market: ${topM[0]} (${pct((topM[2] / est) * 100)})`) : ''}.</p> : null}
        </div>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {onObservatorio && <button className="rb-chip" onClick={onObservatorio}>{t('Abrir Observatório', 'Open Observatory')} <Seta /></button>}
          <span className="rb-cap-fonte">{t('Fonte: INE/TravelBI, 1.º semestre de 2026 (provisório)', 'Source: INE/TravelBI, 1st half 2026 (provisional)')}</span>
        </div>
      </div>
    </section>
  );
}

function Portas({ n, irPara }: { n: number; irPara: (id: string) => void }) {
  const [ativo, setAtivo] = useState(0);
  const portas = [
    { id: 'observatorio', foto: '/fotos/parque-ponte-p.jpg', titulo: t('Observatório', 'Observatory'), texto: t('Dormidas, mercados, emprego e muito mais, com dados oficiais.', 'Overnight stays, markets, jobs and much more, from official data.') },
    { id: 'insto', foto: '/fotos/avenida-liberdade-p.jpg', titulo: t('Rede INSTO', 'INSTO network'), texto: t('Indicadores do turismo sustentável nas 11 áreas da rede.', 'Sustainable tourism indicators across the network’s 11 areas.') },
    { id: 'locais', foto: '/fotos/bom-jesus-p.jpg', titulo: t('Locais', 'Places'), texto: t(`${n} locais monitorizados, com avaliações e análise.`, `${n} monitored places, with reviews and analysis.`) },
    { id: 'mapa', foto: '/fotos/jardim-santa-barbara-p.jpg', titulo: t('Mapa', 'Map'), texto: t('Os locais no mapa, pelo índice de reputação.', 'Places on the map, by reputation index.') },
    { id: 'produtos', foto: '/login-avenida.jpg', titulo: t('Produtos', 'Products'), texto: t('Experiências e produtos turísticos para descobrir Braga.', 'Tourism experiences and products to discover Braga.') },
    { id: 'mundo', foto: '/visao-geral.jpg', titulo: t('Internacional', 'International'), texto: t('Braga no mundo: feiras, mercados e distinções.', 'Braga in the world: fairs, markets and awards.') },
  ];
  return (
    <section id="rb-cap-explorar" className="rb-cap rb-cap-folha rb-cap-sol" aria-label={t('Explorar', 'Explore')}>
      <span className="rb-cap-alca" aria-hidden="true" />
      <div className="rb-cap-in">
        <div className="rb-rise">
          <div className="rb-cap-kick">03 · {t('Explorar', 'Explore')}</div>
          <h2 className="rb-cap-h2" style={{ maxWidth: '16em' }}>{t('Escolhe por onde começar.', 'Choose where to begin.')}</h2>
        </div>
        <div className="rb-pan rb-rise" onMouseLeave={() => setAtivo(ativo)}>
          {portas.map((d, i) => (
            <button key={d.id} type="button" className={`rb-pan-i${ativo === i ? ' on' : ''}`} onMouseEnter={() => setAtivo(i)} onFocus={() => setAtivo(i)} onClick={() => irPara(d.id)} aria-label={`${d.titulo}. ${d.texto}`}>
              <span className="rb-pan-img" style={{ backgroundImage: `url(${d.foto})` }} />
              <span className="rb-pan-txt">
                <span className="rb-pan-t">{d.titulo} <Seta /></span>
                <span className="rb-pan-p">{d.texto}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roda() {
  return (
    <section id="rb-cap-roda" className="rb-cap rb-cap-folha" aria-label={t('Quando visitar Braga', 'When to visit Braga')}>
      <div className="rb-cap-img" style={{ backgroundImage: 'url(/fotos/parque-ponte-g.jpg)' }} />
      <div className="rb-cap-tint" style={{ background: 'rgba(14,16,20,.66)' }} />
      <span className="rb-cap-alca" aria-hidden="true" />
      <div className="rb-cap-in">
        <div className="rb-rise">
          <div className="rb-cap-kick">04 · {t('Roda do ano', 'Year wheel')}</div>
          <h2 className="rb-cap-h2" style={{ maxWidth: '15em' }}>{t('Quando visitar Braga?', 'When to visit Braga?')}</h2>
          <p className="rb-cap-sub">{t('Passa o rato (ou toca) em cada mês: vê a procura, os mercados em férias e os eventos que fazem a diferença.', 'Hover (or tap) a month: see demand, the source markets on holiday and the events that make a difference.')}</p>
        </div>
        <RodaAno />
        <p className="rb-cap-fonte" style={{ marginTop: 18 }}>{t('Procura: dormidas mensais em Braga (INE/TravelBI, 2023–2025). Mercados: feriados e férias escolares dos mercados emissores. Eventos: agenda de Braga. O índice compara cada mês com a média mensal (100).', 'Demand: monthly overnight stays in Braga (INE/TravelBI, 2023–2025). Markets: public and school holidays in source markets. Events: Braga agenda. The index compares each month with the monthly average (100).')}</p>
      </div>
    </section>
  );
}

function Navegacao() {
  const caps: [string, string][] = [['rb-cap-topo', t('Início', 'Start')], ['rb-cap-numeros', t('Braga em números', 'Braga in numbers')], ['rb-cap-turismo', t('Turismo', 'Tourism')], ['rb-cap-explorar', t('Explorar', 'Explore')], ['rb-cap-roda', t('Quando visitar', 'When to visit')]];
  const [ativo, setAtivo] = useState('rb-cap-topo');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setAtivo(e.target.id); }), { rootMargin: '-45% 0px -45% 0px' });
    caps.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ir = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <nav className="rb-cap-nav rb-noprint" aria-label={t('Capítulos da página', 'Page chapters')}>
      {caps.map(([id, nome]) => (
        <button key={id} type="button" onClick={() => ir(id)} aria-current={ativo === id ? 'true' : undefined} aria-label={nome}>
          <span className="rb-cap-rot">{nome}</span><span className="rb-cap-pt" />
        </button>
      ))}
    </nav>
  );
}

export default function CapaCapitulos({ nLocais, onIr, onObservatorio }: { nLocais: number; onIr?: (id: string) => void; onObservatorio?: () => void }) {
  const irPara = (id: string) => { if (id === 'observatorio' && onObservatorio) onObservatorio(); else onIr?.(id); };
  return (
    <>
      <style>{CSS}</style>
      <Navegacao />
      <Numeros />
      <Turismo onObservatorio={onObservatorio} />
      <Portas n={nLocais} irPara={irPara} />
      <Roda />
    </>
  );
}
