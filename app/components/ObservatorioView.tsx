'use client';

import dynamic from 'next/dynamic';
import { abrirJanelaDocumento } from '@/app/lib/abrir-documento';
import { comRecuperacao } from '@/app/lib/carregar';
import Perguntar from './obs/Perguntar';

import { useState, useEffect, useRef } from 'react';
import { MESES, DORMIDAS_BRAGA, DORMIDAS_ANUAL, HEADLINE, INFRA, TAXA_TURISTICA, BALCAO, SUSTENTABILIDADE } from '@/app/lib/observatorio-dados';
import { DIGITAL, DIGITAL_POS, DIGITAL_TOTAL, SEARCH_CONSOLE } from '@/app/lib/audiencia-digital-dados';
import { ACESSIBILIDADE } from '@/app/lib/acessibilidade-meteo-dados';
import { CAMINHOS } from '@/app/lib/caminhos-santiago-dados';
import { openPremiumDoc, Section } from '@/app/lib/premium-doc';
import { t, dl } from '@/app/lib/i18n';
import { obterFotoBraga } from '@/app/lib/foto-braga';
import { C, PAL, SUS_PAL, YEAR_COLORS } from './obs/comum';


// Cada separador é um ficheiro próprio, descarregado só quando é aberto (mais rápido, sobretudo no telemóvel)
const ACarregar = () => <div className="obs-carregar" role="status" aria-live="polite"><span className="obs-carregar-pt" aria-hidden="true" />{t('A carregar…', 'Loading…')}</div>;
const Insto = dynamic(comRecuperacao(() => import('./obs/Insto')), { ssr: false, loading: ACarregar });
const Sinais = dynamic(comRecuperacao(() => import('./obs/Sinais')), { ssr: false, loading: ACarregar });
const Leituras = dynamic(comRecuperacao(() => import('./obs/Leituras')), { ssr: false, loading: ACarregar });
const Acessibilidade = dynamic(comRecuperacao(() => import('./obs/Acessibilidade')), { ssr: false, loading: ACarregar });
const Aeroporto = dynamic(comRecuperacao(() => import('./obs/Aeroporto')), { ssr: false, loading: ACarregar });
const AlojamentoLocal = dynamic(comRecuperacao(() => import('./obs/AlojamentoLocal')), { ssr: false, loading: ACarregar });
const AnimacaoTuristica = dynamic(comRecuperacao(() => import('./obs/AnimacaoTuristica')), { ssr: false, loading: ACarregar });
const Balcao = dynamic(comRecuperacao(() => import('./obs/Balcao')), { ssr: false, loading: ACarregar });
const Caminhos = dynamic(comRecuperacao(() => import('./obs/Caminhos')), { ssr: false, loading: ACarregar });
const Cartoes = dynamic(comRecuperacao(() => import('./obs/Cartoes')), { ssr: false, loading: ACarregar });
const Cruzamentos = dynamic(comRecuperacao(() => import('./obs/Cruzamentos')), { ssr: false, loading: ACarregar });
const Cultura = dynamic(comRecuperacao(() => import('./obs/Cultura')), { ssr: false, loading: ACarregar });
const Digital = dynamic(comRecuperacao(() => import('./obs/Digital')), { ssr: false, loading: ACarregar });
const Economia = dynamic(comRecuperacao(() => import('./obs/Economia')), { ssr: false, loading: ACarregar });
const Emprego = dynamic(comRecuperacao(() => import('./obs/Emprego')), { ssr: false, loading: ACarregar });
const EstimativaDormidas = dynamic(comRecuperacao(() => import('./obs/EstimativaDormidas')), { ssr: false, loading: ACarregar });
const FerramentasDigitais = dynamic(comRecuperacao(() => import('./obs/FerramentasDigitais')), { ssr: false, loading: ACarregar });
const Geral = dynamic(comRecuperacao(() => import('./obs/Geral')), { ssr: false, loading: ACarregar });
const Hotelaria = dynamic(comRecuperacao(() => import('./obs/Hotelaria')), { ssr: false, loading: ACarregar });
const LojasHistoria = dynamic(comRecuperacao(() => import('./obs/LojasHistoria')), { ssr: false, loading: ACarregar });
const Mercados = dynamic(comRecuperacao(() => import('./obs/Mercados')), { ssr: false, loading: ACarregar });
const Calendario = dynamic(comRecuperacao(() => import('./obs/Calendario')), { ssr: false, loading: ACarregar });
const Meteorologia = dynamic(comRecuperacao(() => import('./obs/Meteorologia')), { ssr: false, loading: ACarregar });
const Mobilidade = dynamic(comRecuperacao(() => import('./obs/Mobilidade')), { ssr: false, loading: ACarregar });
const PerfilTurista = dynamic(comRecuperacao(() => import('./obs/PerfilTurista')), { ssr: false, loading: ACarregar });
const Procura = dynamic(comRecuperacao(() => import('./obs/Procura')), { ssr: false, loading: ACarregar });
const Sustentabilidade = dynamic(comRecuperacao(() => import('./obs/Sustentabilidade')), { ssr: false, loading: ACarregar });
const Taxa = dynamic(comRecuperacao(() => import('./obs/Taxa')), { ssr: false, loading: ACarregar });

const LOGO = 'https://i.imgur.com/Vij12Qd.png';

// Formatação para documentos (pt-PT)
const dNum = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'));

const dDec = (v: number) => String(v).replace('.', t(',', '.'));

const dPct = (v: number) => (v >= 0 ? '+' : '') + dDec(v) + '%';

const dEur = (n: number) => (n >= 1e6 ? dDec(+(n / 1e6).toFixed(2)) + ' M€' : dNum(Math.round(n)) + ' €');

// Estilos da identidade nova (só aspeto)
const OBS_CSS = `
.obs-perg { max-width: 1760px; margin: 0 auto; padding: 22px 40px 6px; }
.obs-perg-in { background: radial-gradient(600px 160px at 0% 0%, rgba(138,176,230,.12), transparent), #1C1F24; border: 1px solid #2D3139; border-radius: 12px; padding: 18px 20px; }
.obs-perg-titulo { display: flex; align-items: center; gap: 9px; margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #ECEDEF; }
.obs-perg-titulo svg { color: #8AB0E6; }
.obs-perg-form { display: flex; gap: 8px; }
.obs-perg-form input { flex: 1; min-width: 0; height: 46px; padding: 0 16px; border-radius: 10px; border: 1px solid #3A404B; background: #15171B; color: #ECEDEF; font: 15px 'Public Sans', system-ui, sans-serif; }
.obs-perg-form input::placeholder { color: #8A909B; }
.obs-perg-form button { height: 46px; padding: 0 20px; border-radius: 10px; border: 0; background: #8AB0E6; color: #0F1216; font: 700 14px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.obs-perg-form button:disabled { opacity: .55; cursor: default; }
.obs-perg-ex { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.obs-perg-ex button { padding: 7px 13px; border-radius: 999px; border: 1px solid #2D3139; background: transparent; color: #A3A8B1; font: 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; text-align: left; }
.obs-perg-ex button:hover { color: #ECEDEF; border-color: #8AB0E6; }
.obs-perg-estado { display: flex; align-items: center; gap: 10px; margin-top: 14px; color: #A3A8B1; font-size: 14px; }
.obs-perg-erro { margin-top: 14px; padding: 10px 14px; border-radius: 8px; background: rgba(239,138,123,.12); border: 1px solid rgba(239,138,123,.35); color: #ECEDEF; font-size: 14px; }
.obs-perg-resp { margin-top: 14px; padding: 16px 18px; border-radius: 10px; background: #15171B; border: 1px solid #2D3139; animation: obsIn .4s ease both; }
.obs-perg-q { font-size: 13px; color: #8A909B; margin-bottom: 8px; }
.obs-perg-texto { font-size: 15.5px; line-height: 1.6; color: #ECEDEF; white-space: pre-line; }
.obs-perg-fontes { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 12px; font-size: 12px; color: #8A909B; }
.obs-perg-fonte { padding: 3px 9px; border-radius: 999px; border: 1px solid #2D3139; color: #A3A8B1; }
.obs-perg-acoes { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
.obs-perg-ir, .obs-perg-nova, .obs-leit-ir { padding: 8px 14px; border-radius: 999px; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.obs-perg-ir, .obs-leit-ir { border: 1px solid rgba(138,176,230,.45); background: rgba(138,176,230,.12); color: #ECEDEF; }
.obs-perg-nova { border: 1px solid #2D3139; background: transparent; color: #A3A8B1; }
.obs-perg-aviso { margin-top: 12px; font-size: 12px; color: #8A909B; line-height: 1.5; }
.obs-sinais { margin-bottom: 26px; }
.obs-sinais-cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.obs-sinais-cab h2 { margin: 0; font-size: 22px; letter-spacing: -0.01em; color: #ECEDEF; }
.obs-sinais-cab p { margin: 6px 0 0; font-size: 14px; color: #A3A8B1; }
.obs-sinais-n { font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 999px; background: rgba(237,160,107,.14); color: #EDA06B; border: 1px solid rgba(237,160,107,.35); }
.obs-sinais-l { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px; }
.obs-sinal { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 14px; background: #1C1F24; border: 1px solid #2D3139; border-left: 4px solid #8AB0E6; }
.obs-sinal.atencao { border-left-color: #EDA06B; background: linear-gradient(90deg, rgba(237,160,107,.08), #1C1F24 40%); }
.obs-sinal.positivo { border-left-color: #7CC79A; }
.obs-sinal-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.obs-sinal-tom { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.obs-sinal-top b { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; white-space: nowrap; }
.obs-sinal h3 { margin: 0; font-size: 15.5px; color: #ECEDEF; line-height: 1.35; }
.obs-sinal p { margin: 0; font-size: 13.5px; color: #C9CDD3; line-height: 1.55; flex: 1; }
.obs-sinal .obs-leit-ir { align-self: flex-start; margin-top: 4px; }
.obs-leit { margin-bottom: 26px; }
.obs-leit-titulo { margin: 0; font-size: 22px; font-weight: 700; color: #ECEDEF; letter-spacing: -0.01em; }
.obs-leit-sub { margin: 6px 0 16px; font-size: 14px; color: #A3A8B1; }
.obs-leit-cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
.obs-leit-setas { display: flex; gap: 8px; flex-shrink: 0; margin-bottom: 16px; }
.obs-leit-setas button { width: 40px; height: 40px; border-radius: 999px; border: 1px solid #2D3139; background: #1C1F24; color: #ECEDEF; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .2s ease, background .2s ease, opacity .2s ease; }
.obs-leit-setas button:hover:not(:disabled) { border-color: #8AB0E6; background: rgba(138,176,230,.12); }
.obs-leit-setas button:disabled { opacity: .3; cursor: default; }
.obs-leit-grelha { list-style: none; margin: 0; padding: 2px 2px 10px; display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: #3A404B transparent; overscroll-behavior-x: contain; }
.obs-leit-grelha::-webkit-scrollbar { height: 6px; } .obs-leit-grelha::-webkit-scrollbar-thumb { background: #3A404B; border-radius: 999px; }
.obs-leit-grelha > li { flex: 0 0 clamp(240px, 24%, 300px); scroll-snap-align: start; }
@media (max-width: 760px) { .obs-leit-grelha > li { flex-basis: 82%; } .obs-leit-setas { display: none; } }
.obs-leit-cartao { display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: 10px; background: #1C1F24; border: 1px solid #2D3139; transition: border-color .2s ease, transform .2s ease; }
.obs-leit-cartao:hover { border-color: #3A404B; transform: translateY(-2px); }
.obs-leit-tema { font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8AB0E6; }
.obs-leit-per { color: #A3A8B1; font-weight: 600; letter-spacing: 0; text-transform: none; }
.obs-leit-valor { font-size: 30px; font-weight: 700; color: #ECEDEF; letter-spacing: -0.02em; line-height: 1.1; }
.obs-leit-frase { margin: 0; flex: 1; font-size: 13.5px; line-height: 1.55; color: #A3A8B1; }
.obs-leit-ir { align-self: flex-start; margin-top: 6px; }
.obs-perg-bico { display: none; }
@media (max-width: 760px) {
  .obs-perg { padding: 12px 12px 2px; }
  .obs-perg-in { padding: 12px; border-radius: 12px; }
  .obs-perg-titulo { font-size: 13.5px; margin-bottom: 8px; }
  .obs-perg-form input { height: 42px; font-size: 14px; padding: 0 12px; }
  .obs-perg-form button { width: 42px; height: 42px; padding: 0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .obs-perg-btxt { display: none; } .obs-perg-bico { display: block; }
  .obs-perg-ex { flex-wrap: nowrap; overflow-x: auto; margin: 8px -12px 0; padding: 0 12px 2px; scrollbar-width: none; }
  .obs-perg-ex::-webkit-scrollbar { display: none; }
  .obs-perg-ex button { flex: 0 0 auto; white-space: nowrap; font-size: 12.5px; padding: 6px 11px; }
  .obs-perg-resp { padding: 12px 14px; } .obs-perg-texto { font-size: 14.5px; }
  .obs-leit-titulo { font-size: 19px; }
}
@media (prefers-reduced-motion: reduce) { .obs-perg-resp, .obs-leit-cartao { animation: none !important; transition: none !important; } }
.obs-copiar { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid #3A404B; background: transparent; color: #C9CDD3; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.obs-copiar:hover { border-color: #8AB0E6; color: #ECEDEF; }
.obs-toast { position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%); z-index: 1300; display: flex; align-items: center; gap: 9px; padding: 12px 20px; border-radius: 999px; background: #1C1F24; border: 1px solid rgba(124,199,154,.45); color: #ECEDEF; font: 600 14px 'Public Sans', system-ui, sans-serif; box-shadow: 0 14px 34px -12px rgba(0,0,0,.75); animation: obsToast .25s ease both; }
@keyframes obsToast { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
@media (max-width: 820px) { .obs-toast { bottom: calc(92px + env(safe-area-inset-bottom, 0px)); } }
@media (max-width: 820px) { .obs-copiar { width: 54px; height: 54px; padding: 0; justify-content: center; border-radius: 14px; } .obs-copiar span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); } }
@media print { .obs-copiar { display: none !important; } }
.obs-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.obs-dl { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px; border-radius: 999px; border: 1px solid #2D3139; background: transparent; color: #A3A8B1; font: 600 12px 'Public Sans', system-ui, sans-serif; cursor: pointer; transition: color .2s ease, border-color .2s ease, background .2s ease; }
.obs-dl:hover { color: #ECEDEF; border-color: #8AB0E6; background: rgba(138,176,230,.1); }
.obs-linha-btn { background: none; border: 0; padding: 0; color: inherit; font: inherit; font-weight: 700; cursor: pointer; }
.obs button:focus-visible, .obs a:focus-visible, .obs input:focus-visible, .obs [tabindex]:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
@media print { .obs-dl { display: none !important; } }
.obs-carregar { display: flex; align-items: center; gap: 12px; min-height: 40vh; justify-content: center; color: #A3A8B1; font-size: 14px; }
.obs-carregar-pt { width: 18px; height: 18px; border-radius: 999px; border: 2px solid rgba(138,176,230,.25); border-top-color: #8AB0E6; animation: obsRoda .8s linear infinite; }
@keyframes obsRoda { to { transform: rotate(360deg); } }
.obs-hero { position: relative; overflow: hidden; min-height: 340px; display: flex; align-items: flex-end; background: linear-gradient(160deg, #262A30 0%, #15171B 100%); }
.obs-hero-img { position: absolute; inset: -40px; background-size: cover; background-position: center; animation: obsKb 22s ease-in-out infinite alternate; }
@keyframes obsKb { from { transform: scale(1.04); } to { transform: scale(1.14) translate(-14px, 8px); } }
.obs-hero-shade { position: absolute; inset: 0; background: linear-gradient(0deg, #15171B 0%, rgba(21,23,27,.66) 45%, rgba(21,23,27,.25) 100%); }
.obs-hero-in { position: relative; width: 100%; max-width: 1760px; margin: 0 auto; padding: 72px 40px 32px; animation: obsIn .8s cubic-bezier(.2,.7,.2,1) both; }
.obs-h1 { font-size: clamp(32px, 4.4vw, 52px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.05; margin: 10px 0 14px; text-shadow: 0 2px 24px rgba(0,0,0,.35); }
.obs-tabs { position: sticky; top: 0; z-index: 50; box-shadow: 0 10px 24px -14px rgba(0,0,0,.8); background: rgba(28,31,36,.94); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); border-bottom: 1px solid #2D3139; }
.obs-tabs-in { max-width: 1760px; margin: 0 auto; padding: 10px 40px; display: flex; align-items: flex-start; gap: 12px; }
.obs-tabs-list { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
.obs-tabs-list::-webkit-scrollbar { display: none; }
.obs-tab { flex: 0 0 auto; height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: #A3A8B1; font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background .2s ease, color .2s ease, border-color .2s ease; }
.obs-tab:hover { color: #ECEDEF; background: rgba(255,255,255,.04); }
.obs-tab.on { background: #22324A; color: #ECEDEF; font-weight: 600; border-color: rgba(138,176,230,.35); }
.obs-pdf { flex: 0 0 auto; height: 34px; padding: 0 16px; border-radius: 4px; border: 1px solid #8AB0E6; background: #8AB0E6; color: #0F1216; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.obs-pdf:hover { filter: brightness(1.08); }
.obs-body { max-width: 1760px; margin: 0 auto; padding: 28px 40px 64px; animation: obsIn .6s cubic-bezier(.2,.7,.2,1) both; }
.obs-card { opacity: 0; transform: translateY(26px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1), border-color .25s ease; }
.obs-card.in { opacity: 1; transform: none; }
.obs-card:hover { border-color: #3A404B !important; }
.obs-pdf-m { display: none; }
@keyframes obsIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.obs h1, .obs h2, .obs h3, .obs .rb-display { font-family: 'Public Sans', system-ui, sans-serif !important; }
.obs-hero { min-height: 380px; }
.obs-tab:focus { outline: none; }
.obs-tab:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
/* Gráficos com mais vida (só aspeto; os dados não mudam) */
.obs .recharts-cartesian-grid line { stroke: #2D3139; stroke-dasharray: 2 6; }
.obs .recharts-cartesian-grid-vertical { display: none; }
.obs .recharts-cartesian-axis-line, .obs .recharts-cartesian-axis-tick-line { display: none; }
.obs .recharts-cartesian-axis-tick-value { fill: #A3A8B1; font-size: 12px; }
.obs .recharts-bar-rectangle path { transition: filter .25s ease, opacity .25s ease; }
.obs .recharts-bar-rectangle:hover path { filter: brightness(1.18); }
.obs .recharts-line-curve { stroke-width: 2.6px; }
.obs .recharts-line-dots circle, .obs .recharts-line-dot { stroke: #1C1F24; stroke-width: 2px; }
.obs .recharts-active-dot circle { stroke: #1C1F24; stroke-width: 3px; }
.obs .recharts-pie-sector path { stroke: #1C1F24; stroke-width: 2px; transition: filter .25s ease; }
.obs .recharts-pie-sector:hover path { filter: brightness(1.15); }
.obs .recharts-area-area { fill-opacity: .22; }
.obs .recharts-tooltip-wrapper { transition: transform .15s ease-out !important; }
.obs .recharts-legend-item { margin-right: 14px !important; }
.obs .obs-osm-escuro { filter: invert(1) hue-rotate(180deg) brightness(.82) contrast(.92) saturate(.4); }
.obs .leaflet-container { background: #15171B; font-family: 'Public Sans', system-ui, sans-serif; }
.obs .leaflet-control-zoom a { background: #1C1F24; color: #ECEDEF; border-color: #2D3139; }
.obs .leaflet-control-attribution { background: rgba(21,23,27,.7) !important; color: #8A909B !important; }
.obs-loja { background: #22262D; border: 1px solid #2D3139; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
.obs-loja:hover { transform: translateY(-3px); border-color: #3A404B; box-shadow: 0 16px 40px -18px rgba(0,0,0,.7); }
.obs-loja-topo { position: relative; height: 178px; overflow: hidden; background: #1C1F24; }
.obs-loja-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .6s ease, transform .8s cubic-bezier(.2,.7,.2,1); }
.obs-loja:hover .obs-loja-img { transform: scale(1.06); }
.obs-loja-carrega { position: absolute; inset: 0; background: linear-gradient(90deg, #1C1F24 0%, #262A31 50%, #1C1F24 100%); background-size: 200% 100%; animation: obsBrilho 1.3s ease-in-out infinite; }
@keyframes obsBrilho { from { background-position: 100% 0; } to { background-position: -100% 0; } }
.obs-loja-vazio { position: absolute; inset: 0; display: flex; align-items: center; justify-content: flex-end; padding-right: 22px; background: radial-gradient(420px 180px at 20% 0%, rgba(138,176,230,.14), transparent), linear-gradient(160deg, #262A31, #1C1F24); }
.obs-loja-vazio span { font-size: 96px; font-weight: 700; line-height: 1; color: rgba(255,255,255,.05); letter-spacing: -0.04em; }
.obs-loja-fade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(34,38,45,0) 30%, rgba(34,38,45,.55) 62%, #22262D 100%); pointer-events: none; }
.obs-loja-ano { position: absolute; top: 10px; right: 10px; padding: 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 700; color: #ECEDEF; background: rgba(21,23,27,.6); border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.obs-loja-ano.cent { color: #F2C14E; border-color: rgba(242,193,78,.45); }
.obs-loja-acoes { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; opacity: 0; transition: opacity .2s ease; }
.obs-loja:hover .obs-loja-acoes, .obs-loja-vazio ~ .obs-loja-acoes { opacity: 1; }
.obs-loja-acoes button { height: 28px; padding: 0 11px; border-radius: 999px; font: 600 12px 'Public Sans', system-ui, sans-serif; color: #ECEDEF; background: rgba(21,23,27,.62); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); cursor: pointer; }
.obs-loja-acoes button:hover { background: rgba(138,176,230,.3); }
.obs-loja-nome { position: absolute; left: 16px; right: 16px; bottom: 10px; font-size: 16.5px; font-weight: 700; color: #ECEDEF; line-height: 1.25; text-shadow: 0 2px 12px rgba(0,0,0,.55); }
.obs-loja-nome small { display: block; font-size: 12px; font-weight: 500; color: #A3A8B1; margin-top: 3px; text-shadow: none; }
.obs-loja-corpo { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.obs-loja-texto { font-size: 13px; color: #A3A8B1; line-height: 1.55; flex: 1; }
.obs-loja-corpo a { font-size: 12.5px; color: #8AB0E6; text-decoration: none; }
@media (hover: none) { .obs-loja-acoes { opacity: 1; } }
.obs-rnaat-linha { display: grid; grid-template-columns: minmax(200px, 300px) minmax(0,1fr); gap: 20px; padding: 14px 4px; border-bottom: 1px solid #2D3139; }
.obs-rnaat-linha:hover { background: rgba(255,255,255,.02); }
@media (max-width: 820px) { .obs-rnaat-linha { grid-template-columns: 1fr; gap: 8px; } }
.obs-grow { animation: obsGrow 1.1s cubic-bezier(.2,.7,.2,1) both; transform-origin: left center; }
@keyframes obsGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.obs .recharts-legend-item-text { color: #A3A8B1 !important; }
.obs-grupos { display: flex; gap: 4px; flex: 1; flex-wrap: wrap; }
.obs-grupo { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 15px; border-radius: 999px; border: 1px solid transparent; background: transparent; color: #A3A8B1; font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .2s ease, color .2s ease, border-color .2s ease; }
.obs-grupo:hover { color: #ECEDEF; background: rgba(255,255,255,.04); }
.obs-grupo.on { background: #22324A; color: #ECEDEF; font-weight: 600; border-color: rgba(138,176,230,.35); }
.obs-grupo.on svg { color: #8AB0E6; }
.obs-grupo:focus-visible, .obs-sub:focus-visible, .obs-menu-m:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
.obs-sub-in { max-width: 1760px; margin: 0 auto; padding: 0 40px; display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,.05); overflow-x: auto; scrollbar-width: none; }
.obs-sub-in::-webkit-scrollbar { display: none; }
.obs-sub { flex: 0 0 auto; height: 34px; margin: 8px 0; padding: 0 14px; border-radius: 999px; background: rgba(255,255,255,.04); border: 1px solid #3A404B; color: #C9CDD3; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: color .2s ease, border-color .2s ease, background .2s ease; }
.obs-sub:hover { color: #ECEDEF; border-color: #8AB0E6; }
.obs-sub.on { color: #0F1216; background: #8AB0E6; border-color: #8AB0E6; font-weight: 700; }
.obs-menu-m { display: none; }
.obs-folha-fundo { position: fixed; inset: 0; z-index: 1200; background: rgba(8,9,11,.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); animation: obsFade .2s ease both; }
@keyframes obsFade { from { opacity: 0; } to { opacity: 1; } }
.obs-folha { position: fixed; left: 0; right: 0; bottom: 0; max-height: 84vh; overflow-y: auto; overscroll-behavior: contain; background: #1C1F24; border-top: 1px solid #2D3139; border-radius: 18px 18px 0 0; padding: 8px 18px calc(22px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -20px 60px rgba(0,0,0,.5); animation: obsSobe .28s cubic-bezier(.2,.7,.2,1) both; font-family: 'Public Sans', system-ui, sans-serif; }
@keyframes obsSobe { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
.obs-folha-pega { width: 40px; height: 4px; border-radius: 999px; background: #3A404B; margin: 4px auto 10px; }
.obs-folha-topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: #ECEDEF; font-size: 16px; }
.obs-folha-topo button { width: 36px; height: 36px; border-radius: 999px; border: 1px solid #2D3139; background: transparent; color: #A3A8B1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.obs-folha-grupo { padding: 12px 0; border-top: 1px solid #2D3139; }
.obs-folha-grupo:first-of-type { border-top: 0; }
.obs-folha-titulo { display: flex; align-items: center; gap: 8px; font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8AB0E6; margin-bottom: 10px; }
.obs-folha-itens { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
.obs-folha-itens button { min-height: 44px; padding: 8px 12px; border-radius: 10px; border: 1px solid #2D3139; background: #22262D; color: #ECEDEF; font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; }
.obs-folha-itens button.on { border-color: #8AB0E6; background: #22324A; font-weight: 600; }
@media (max-width: 820px) {
  .obs-grupos { display: none; }
  .obs-menu-m { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 54px; padding: 8px 16px; border-radius: 14px; border: 1.5px solid rgba(138,176,230,.6); background: linear-gradient(135deg, #22324A, #1C2433); color: #ECEDEF; font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 22px -12px rgba(138,176,230,.55); }
  .obs-menu-m > svg:last-child { color: #8AB0E6; width: 22px; height: 22px; }
  .obs-menu-m small { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8AB0E6; margin-bottom: 1px; }
  .obs-menu-m > svg:first-child { color: #8AB0E6; flex-shrink: 0; }
  .obs-sub-in { padding: 0 12px 2px; gap: 8px; }
  .obs-sub { height: 34px; font-size: 13px; padding: 0 13px; }
}
@media (max-width: 760px) {
  .obs { overflow-x: clip; }
  .obs-tab-wrap { overflow-x: visible !important; }
  .obs-tab-resp { min-width: 0 !important; width: 100% !important; }
  .obs-tab-resp thead { display: none; }
  .obs-tab-resp, .obs-tab-resp tbody { display: block; width: 100%; }
  .obs-tab-resp tr { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px 14px; padding: 12px 14px; margin-bottom: 10px; border: 1px solid #2D3139 !important; border-radius: 10px; background: #22262D; }
  .obs-tab-resp td { display: block; padding: 0 !important; text-align: left !important; min-width: 0; overflow-wrap: anywhere; }
  .obs-tab-resp td:first-child { grid-column: 1 / -1; font-size: 14.5px; }
  .obs-tab-resp td[data-l]::before { content: attr(data-l); display: block; font-size: 11px; font-weight: 500; color: #8A909B; margin-bottom: 2px; }
  .obs input[placeholder] { min-width: 0 !important; width: 100%; }
}
@media (prefers-reduced-motion: reduce) { .obs-hero-img, .obs-hero-in, .obs-body, .obs-grow { animation: none !important; } .obs-card { opacity: 1 !important; transform: none !important; transition: none !important; } }
@media (max-width: 820px) {
  .obs-hero { min-height: 260px; }
  .obs-hero-in { padding: 40px 18px 22px; }
  .obs-tabs-in { padding: 8px 12px; }
  .obs-tabs-in > .obs-pdf { display: none; }
  .obs-pdf-m { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; height: 36px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); background: rgba(21,23,27,.55); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #ECEDEF; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
  .obs-kpi-v { font-size: 30px !important; }
  .obs-tabs-list { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .obs-hero { min-height: 280px; }
  .obs-body { padding: 18px 14px 48px; }
}
@media print { .obs-hero, .obs-tabs { display: none !important; } .obs-body { padding: 0; max-width: none; } .obs-card { opacity: 1 !important; transform: none !important; } }
`;

type Tab = 'geral' | 'insto' | 'procura' | 'estimativa' | 'mobilidade' | 'economia' | 'emprego' | 'cartoes' | 'perfil' | 'animacao' | 'ferramentas' | 'hotelaria' | 'cultura' | 'lojas' | 'alojamento' | 'aeroporto' | 'mercados' | 'calendario' | 'balcao' | 'taxa' | 'sustentabilidade' | 'digital' | 'acessibilidade' | 'meteo' | 'caminhos' | 'cruzamentos';
// Sem tipo estrito: o separador funciona mesmo que o módulo do calendário ainda não tenha a exportação em PDF
function abrirCalendarioPdf(m: any) { if (m && typeof m.exportarCalendarioPdf === 'function') m.exportarCalendarioPdf(); }
const IDS_TAB: string[] = ['insto', 'geral', 'procura', 'estimativa', 'mobilidade', 'economia', 'emprego', 'cartoes', 'perfil', 'animacao', 'ferramentas', 'hotelaria', 'cultura', 'lojas', 'alojamento', 'aeroporto', 'mercados', 'calendario', 'balcao', 'taxa', 'sustentabilidade', 'digital', 'acessibilidade', 'meteo', 'caminhos', 'cruzamentos'];

interface Props { reputacaoMedia?: number | null; reputacaoLocais?: number; reputacaoReviews?: number; fotoTopo?: string | null; reputacaoResumo?: string; separadorInicial?: string; }

export default function ObservatorioView({ reputacaoMedia, reputacaoLocais, reputacaoReviews, fotoTopo, reputacaoResumo, separadorInicial }: Props) {
  const [tab, setTab] = useState<Tab>('geral');
  const [copiado, setCopiado] = useState(false);
  // Ligações diretas: abre no separador indicado no endereço e mantém o endereço atualizado
  const aplicouInicial = useRef(false);
  useEffect(() => {
    if (aplicouInicial.current || !separadorInicial) return;
    aplicouInicial.current = true;
    setTab((t0) => (IDS_TAB.indexOf(separadorInicial) >= 0 ? (separadorInicial as Tab) : t0));
  }, [separadorInicial]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('r')) return;
    q.set('vista', 'observatorio');
    if (tab === 'geral') q.delete('separador'); else q.set('separador', tab);
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  }, [tab]);
  const copiarLigacao = async () => {
    const url = window.location.href;
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      // Alternativa para browsers sem acesso à área de transferência
      try { const ta = document.createElement('textarea'); ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch { ok = false; }
    }
    if (ok) { setCopiado(true); setTimeout(() => setCopiado(false), 2400); }
  };
  const [foto, setFoto] = useState<string | null>(null);
  // Ao mudar de separador, se estiveres mais abaixo, a página volta ao início do conteúdo (menu visível no topo)
  const primeiroTab = useRef(true);
  useEffect(() => {
    if (primeiroTab.current) { primeiroTab.current = false; return; }
    const hero = document.querySelector('.obs-hero') as HTMLElement | null;
    const tabs = document.querySelector('.obs-tabs') as HTMLElement | null;
    const alvo = hero ? hero.getBoundingClientRect().bottom + window.scrollY : tabs ? tabs.getBoundingClientRect().top + window.scrollY : 0;
    if (window.scrollY > alvo + 2) window.scrollTo({ top: alvo, behavior: 'smooth' });
  }, [tab]);
  useEffect(() => { let vivo = true; obterFotoBraga().then((x) => { if (vivo) setFoto(x); }); return () => { vivo = false; }; }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'geral', label: t('Visão Geral', 'Overview') },
    { id: 'procura', label: t('Procura (INE)', 'Demand (INE)') },
    { id: 'estimativa', label: t('Estimativa 2026', '2026 estimate') },
    { id: 'economia', label: t('Economia', 'Economy') },
    { id: 'emprego', label: t('Emprego', 'Employment') },
    { id: 'cartoes', label: t('Gastos com cartão', 'Card spending') },
    { id: 'perfil', label: t('Perfil do turista', 'Visitor profile') },
    { id: 'animacao', label: t('Animação turística', 'Tourism activities') },
    { id: 'cultura', label: t('Cultura', 'Culture') },
    { id: 'lojas', label: t('Lojas com História', 'Historic Shops') },
    { id: 'mobilidade', label: t('Mobilidade (TUB)', 'Mobility (TUB)') },
    { id: 'hotelaria', label: t('Hotelaria', 'Hotels') },
    { id: 'alojamento', label: t('Alojamento Local', 'Short-term rentals') },
    { id: 'aeroporto', label: t('Aeroporto', 'Airport') },
    { id: 'mercados', label: t('Mercados', 'Markets') },
    { id: 'calendario', label: t('Calendário de oportunidades', 'Opportunity calendar') },
    { id: 'balcao', label: t('Atendimento Balcão', 'Front Desk') },
    { id: 'taxa', label: t('Taxa Turística', 'Tourist Tax') },
    { id: 'sustentabilidade', label: t('Sustentabilidade', 'Sustainability') },
    { id: 'digital', label: t('Audiência Digital', 'Digital Audience') },
    { id: 'ferramentas', label: t('Ferramentas digitais', 'Digital tools') },
    { id: 'acessibilidade', label: t('Acessibilidade', 'Accessibility') },
    { id: 'meteo', label: t('Meteorologia', 'Weather') },
    { id: 'caminhos', label: t('Caminhos de Santiago', 'Camino de Santiago') },
    { id: 'insto', label: t('Rede INSTO', 'INSTO network') },
    { id: 'cruzamentos', label: t('Cruzamentos', 'Cross-analysis') },
  ];
  const tabLabel = TABS.find((t) => t.id === tab)?.label || '';
  // Abrir um separador a partir das perguntas e das leituras (só aceita separadores existentes)
  const nomeSeparador = (id: string): string | null => TABS.find((x) => x.id === id)?.label || null;
  const irPara = (id: string) => { const x = TABS.find((y) => y.id === id); if (x) setTab(x.id); };
  // Separadores agrupados por tema (menu mais simples, sobretudo no telemóvel)
  const GRUPOS: { id: string; label: string; icon: string; tabs: Tab[] }[] = [
    { id: 'resumo', label: t('Resumo', 'Summary'), icon: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z', tabs: ['geral', 'cruzamentos'] },
    { id: 'procura', label: t('Procura', 'Demand'), icon: 'M3 17l6-6 4 4 8-8M15 7h6v6', tabs: ['procura', 'estimativa', 'mercados', 'calendario', 'aeroporto', 'caminhos'] },
    { id: 'visitante', label: t('Visitante', 'Visitor'), icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M16 3.5a4 4 0 010 7.5M22 21v-1a6 6 0 00-4-5.6', tabs: ['perfil', 'balcao'] },
    { id: 'economia', label: t('Economia', 'Economy'), icon: 'M18 7a7 7 0 100 10M5 10h9M5 14h9', tabs: ['economia', 'emprego', 'cartoes', 'taxa'] },
    { id: 'oferta', label: t('Oferta', 'Supply'), icon: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z', tabs: ['hotelaria', 'alojamento', 'animacao', 'cultura', 'lojas'] },
    { id: 'digital', label: t('Digital', 'Digital'), icon: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2', tabs: ['digital', 'ferramentas'] },
    { id: 'territorio', label: t('Território', 'Territory'), icon: 'M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l8-8', tabs: ['sustentabilidade', 'mobilidade', 'acessibilidade', 'meteo'] },
  ];
  const grupoAtual = GRUPOS.find((g) => g.tabs.includes(tab)) || GRUPOS[0];
  const [ultimoDoGrupo, setUltimoDoGrupo] = useState<Record<string, Tab>>({});
  useEffect(() => { setUltimoDoGrupo((u) => (u[grupoAtual.id] === tab ? u : { ...u, [grupoAtual.id]: tab })); }, [tab, grupoAtual.id]);
  const irGrupo = (g: { id: string; tabs: Tab[] }) => { const u = ultimoDoGrupo[g.id]; setTab(u && g.tabs.includes(u) ? u : g.tabs[0]); };
  const [menuAberto, setMenuAberto] = useState(false);
  useEffect(() => {
    if (!menuAberto) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAberto(false); };
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = antes; };
  }, [menuAberto]);

  const exportProcura = () => {
    const H = HEADLINE;
    const nf = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'));
    const dec = (v: number) => String(v).replace('.', t(',', '.'));
    const pct = (v: number) => (v >= 0 ? '+' : '') + dec(v) + '%';
    const anos = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    const dormBars = anos.map((y) => ({ label: y, value: DORMIDAS_ANUAL[y] || 0, display: nf(DORMIDAS_ANUAL[y] || 0) }));

    const Ds = SUSTENTABILIDADE.destino;
    const sazVals = MESES.map((m) => DORMIDAS_BRAGA[m]?.['2025'] ?? 0);
    const sazTotal = sazVals.reduce((s, v) => s + v, 0);
    let pkI = 0, trI = 0;
    sazVals.forEach((v, i) => { if (v > sazVals[pkI]) pkI = i; if (v < sazVals[trI]) trI = i; });
    const pkShare = sazTotal ? (sazVals[pkI] / sazTotal) * 100 : 0;
    const pkRatio = sazVals[trI] ? sazVals[pkI] / sazVals[trI] : 0;

    const sections: Section[] = [
      { kind: 'prose', paras: [
        t(`Em 2025, Braga registou ${nf(H.dormidas2025)} dormidas (${pct(H.dormidasVar)} face a 2024) e ${nf(H.hospedes2025)} hóspedes (${pct(H.hospedesVar)}). Fonte: INE/TravelBI.`, `In 2025, Braga recorded ${nf(H.dormidas2025)} overnight stays (${pct(H.dormidasVar)} vs 2024) and ${nf(H.hospedes2025)} guests (${pct(H.hospedesVar)}). Source: INE/TravelBI.`),
        t(`Para enquadramento regional, no acumulado de 2025 (dados preliminares) o conjunto do país cresceu ${pct(H.dormidasPTVar)} em dormidas e a Região Norte ${pct(H.dormidasNorteVar)}.`, `For regional context, in the cumulative 2025 figures (preliminary data) the country as a whole grew ${pct(H.dormidasPTVar)} in overnight stays and the Norte Region ${pct(H.dormidasNorteVar)}.`),
      ] },
      { kind: 'bars', title: t('Dormidas anuais em Braga (2019–2025)', 'Annual overnight stays in Braga (2019–2025)'), data: dormBars,
        note: t('A quebra de 2020–2021 reflete a pandemia; recuperação plena a partir de 2022. 2025 é ano completo; 2026 ainda em curso.', 'The 2020–2021 drop reflects the pandemic; full recovery from 2022. 2025 is a complete year; 2026 still ongoing.') },
      { kind: 'table', title: t('Braga no contexto regional e nacional', 'Braga in the regional and national context'), head: [t('Indicador', 'Indicator'), 'Braga', t('Norte', 'North'), 'Portugal'],
        rows: [
          [t('Ocupação por quarto', 'Room occupancy'), dec(H.ocupQuarto.Braga) + '%', dec(H.ocupQuarto.Norte) + '%', dec(H.ocupQuarto.Portugal) + '%'],
          [t('Ocupação por cama', 'Bed occupancy'), dec(H.ocupCama.Braga) + '%', dec(H.ocupCama.Norte) + '%', dec(H.ocupCama.Portugal) + '%'],
          [t('Estada média (noites)', 'Average stay (nights)'), dec(H.estadaMedia.Braga), dec(H.estadaMedia.Norte), dec(H.estadaMedia.Portugal)],
          [t('Variação das dormidas (homóloga)', 'Change in overnight stays (YoY)'), pct(H.dormidasVar), pct(H.dormidasNorteVar), pct(H.dormidasPTVar)],
        ],
        emphasizeRow: 0,
        note: t('Fonte: INE/TravelBI. Indicadores do período mais recente consolidado.', 'Source: INE/TravelBI. Indicators for the most recent consolidated period.') },
      { kind: 'stats', title: t('Sazonalidade da procura', 'Seasonality of demand'), items: [
        { label: t('Índice de sazonalidade (Braga)', 'Seasonality index (Braga)'), value: dec(Ds.sazonalidade) + '%', sub: t('menor = mais equilibrado', 'lower = more balanced') },
        { label: t('Média nacional', 'National average'), value: dec(Ds.sazonalidadeNacional) + '%' },
        { label: t('Mês de pico (2025)', 'Peak month (2025)'), value: dl(MESES[pkI]), sub: dec(+pkShare.toFixed(1)) + t('% do ano', '% of the year') },
        { label: t('Rácio pico / vale', 'Peak / trough ratio'), value: dec(+pkRatio.toFixed(1)) + '×', sub: dl(MESES[pkI]) + ' vs ' + dl(MESES[trI]) },
      ] },
      { kind: 'prose', title: t('Leitura', 'Analysis'), paras: [
        t(`A ocupação por quarto em Braga (${dec(H.ocupQuarto.Braga)}%) supera a média da Região Norte e aproxima-se da nacional, sinal de uma procura sólida apesar da estada curta.`, `Room occupancy in Braga (${dec(H.ocupQuarto.Braga)}%) exceeds the Norte Region average and approaches the national one, a sign of solid demand despite the short stay.`),
        t(`A estada média de ${dec(H.estadaMedia.Braga)} noites (${dec(H.estadaMedia.naoResidentes)} entre não residentes) confirma Braga como destino de curtas estadias e porta de entrada do Minho, com margem para estratégias que aumentem o número de noites.`, `The average stay of ${dec(H.estadaMedia.Braga)} nights (${dec(H.estadaMedia.naoResidentes)} among non-residents) confirms Braga as a short-stay destination and a gateway to the Minho, with room for strategies that increase the number of nights.`),
        t(`Braga é menos sazonal do que a média nacional (${dec(Ds.sazonalidade)}% vs ${dec(Ds.sazonalidadeNacional)}%): a procura está mais distribuída ao longo do ano. O pico mantém-se no verão (${dl(MESES[pkI])}), pelo que há margem para reforçar a época baixa.`, `Braga is less seasonal than the national average (${dec(Ds.sazonalidade)}% vs ${dec(Ds.sazonalidadeNacional)}%): demand is more spread across the year. The peak stays in summer (${dl(MESES[pkI])}), so there is room to strengthen the low season.`),
        t('2025 está completo. Os dados de 2026 são parciais (jan–abr), com as dormidas a crescerem cerca de +3,8% face ao mesmo período de 2025.', '2025 is complete. The 2026 data is partial (Jan–Apr), with overnight stays growing about +3.8% versus the same period in 2025.'),
      ] },
    ];

    openPremiumDoc({
      logo: LOGO,
      eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Procura Turística', 'Tourism Demand'),
      subtitle: t(H.periodo, H.periodo.replace('(ano completo)', '(complete year)')),
      kpis: [
        { label: t('Dormidas 2025', 'Overnight stays 2025'), value: nf(H.dormidas2025), sub: pct(H.dormidasVar) + t(' homólogo', ' YoY') },
        { label: t('Hóspedes 2025', 'Guests 2025'), value: nf(H.hospedes2025), sub: pct(H.hospedesVar) + t(' homólogo', ' YoY') },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dec(H.ocupQuarto.Braga) + '%', sub: t('Braga · Norte ', 'Braga · North ') + dec(H.ocupQuarto.Norte) + '%' },
        { label: t('Estada média', 'Average stay'), value: dec(H.estadaMedia.Braga) + t(' noites', ' nights'), sub: dec(H.estadaMedia.naoResidentes) + t(' não residentes', ' non-residents') },
      ],
      sections,
      footerR: t('Procura Turística · Fonte INE/TravelBI', 'Tourism Demand · Source INE/TravelBI'),
    });
  };

  const exportEconomia = () => {
    const H = HEADLINE;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Economia do Alojamento', 'Accommodation Economy'), subtitle: t('INE/TravelBI · indicadores 2024', 'INE/TravelBI · 2024 indicators'),
      kpis: [
        { label: 'RevPAR Braga', value: dEur(H.revpar2024.Braga), sub: '2024' },
        { label: 'ADR Braga', value: dEur(H.adr2024.Braga), sub: '2024' },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dDec(H.ocupQuarto.Braga) + '%', sub: 'Braga' },
        { label: t('Proveitos 2024', 'Revenue 2024'), value: dDec(H.proveitos.Braga2024) + ' M€', sub: dPct(H.proveitos.varBraga) + t(' face a 2023', ' vs 2023') },
      ],
      sections: [
        { kind: 'table', title: t('Desempenho hoteleiro 2024 - Braga vs Norte vs Portugal', 'Hotel performance 2024 - Braga vs North vs Portugal'),
          head: [t('Indicador', 'Indicator'), 'Braga', t('Norte', 'North'), 'Portugal'],
          rows: [
            [t('RevPAR (rendimento por quarto disponível)', 'RevPAR (revenue per available room)'), dEur(H.revpar2024.Braga), dEur(H.revpar2024.Norte), dEur(H.revpar2024.Portugal)],
            [t('ADR (rendimento por quarto ocupado)', 'ADR (revenue per occupied room)'), dEur(H.adr2024.Braga), dEur(H.adr2024.Norte), dEur(H.adr2024.Portugal)],
            [t('Ocupação por quarto', 'Room occupancy'), dDec(H.ocupQuarto.Braga) + '%', dDec(H.ocupQuarto.Norte) + '%', dDec(H.ocupQuarto.Portugal) + '%'],
            [t('Ocupação por cama', 'Bed occupancy'), dDec(H.ocupCama.Braga) + '%', dDec(H.ocupCama.Norte) + '%', dDec(H.ocupCama.Portugal) + '%'],
          ], emphasizeRow: 0,
          note: t('Fonte: INE/TravelBI, 2024.', 'Source: INE/TravelBI, 2024.') },
        { kind: 'bars', title: t('Variação dos proveitos do alojamento (2023 → 2024)', 'Change in accommodation revenue (2023 → 2024)'),
          data: [
            { label: 'Braga', value: H.proveitos.varBraga, display: dPct(H.proveitos.varBraga) },
            { label: 'Norte', value: H.proveitos.varNorte, display: dPct(H.proveitos.varNorte) },
            { label: 'Portugal', value: H.proveitos.varPortugal, display: dPct(H.proveitos.varPortugal) },
          ],
          note: t(`Proveitos de alojamento em Braga: ${dDec(H.proveitos.Braga2023)} M€ (2023) para ${dDec(H.proveitos.Braga2024)} M€ (2024).`, `Accommodation revenue in Braga: ${dDec(H.proveitos.Braga2023)} M€ (2023) to ${dDec(H.proveitos.Braga2024)} M€ (2024).`) },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`Braga apresenta RevPAR e ADR abaixo das médias regional e nacional - preços médios mais baixos - mas uma ocupação por quarto (${dDec(H.ocupQuarto.Braga)}%) superior à da Região Norte e próxima da nacional.`, `Braga shows RevPAR and ADR below the regional and national averages - lower average prices - but a room occupancy (${dDec(H.ocupQuarto.Braga)}%) higher than the Norte Region and close to the national one.`),
          t('A combinação de ocupação elevada com preço médio contido aponta margem para estratégias de valorização do preço médio (qualificação da oferta, eventos âncora, captação de segmentos de maior valor), sem dependência de aumentar volumes.', 'The combination of high occupancy with a contained average price points to room for strategies that raise the average price (upgrading the offer, anchor events, attracting higher-value segments), without relying on increasing volumes.'),
        ] },
      ],
      footerR: t('Economia do Alojamento · Fonte INE/TravelBI', 'Accommodation Economy · Source INE/TravelBI'),
    });
  };

  const exportMercados = () => {
    const b25 = BALCAO['2025']; const b26 = BALCAO['2026'];
    const top = HEADLINE.mercados2025;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Mercados Emissores', 'Source Markets'), subtitle: t('INE 2025 · Atendimento de Balcão', 'INE 2025 · Front Desk'),
      kpis: [
        { label: t('Principal mercado', 'Main market'), value: dl(top[0]), sub: t('INE · por dormidas', 'INE · by overnight stays') },
        { label: t('Nacionalidade #1 (balcão)', 'Nationality #1 (front desk)'), value: dl(b26.nacionalidades[0][0]), sub: dNum(b26.nacionalidades[0][1]) + t(' em 2026', ' in 2026') },
        { label: t('Cidade #1 (balcão)', 'City #1 (front desk)'), value: dl(b26.cidades[0][0]), sub: dNum(b26.cidades[0][1]) + t(' em 2026', ' in 2026') },
        { label: t('Mercados no top', 'Markets in top'), value: String(top.length), sub: t('internacionais (INE)', 'international (INE)') },
      ],
      sections: [
        { kind: 'table', title: t('Principais mercados internacionais (INE 2025, por dormidas)', 'Main international markets (INE 2025, by overnight stays)'),
          head: ['#', t('Mercado', 'Market')], rows: top.map((m, i) => [String(i + 1), dl(m)]), emphasizeRow: 0,
          note: t('Espanha lidera, seguida de Brasil, França e Reino Unido.', 'Spain leads, followed by Brazil, France and the United Kingdom.') },
        { kind: 'bars', title: t('Nacionalidades no balcão (2026, top 10)', 'Front desk nationalities (2026, top 10)'),
          data: b26.nacionalidades.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Cidades de origem dos visitantes (balcão 2026, top 10)', 'Visitor origin cities (front desk 2026, top 10)'),
          data: b26.cidades.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#8AB0E6' },
        { kind: 'prose', title: 'Leitura', paras: [
          t('O domínio ibérico é claro: Espanha encabeça tanto as dormidas (INE) como o atendimento físico no balcão, reforçada por cidades como Madrid, Vigo, A Coruña e Bilbao no topo das origens.', 'Iberian dominance is clear: Spain leads both overnight stays (INE) and physical front desk visits, reinforced by cities such as Madrid, Vigo, A Coruña and Bilbao at the top of the origins.'),
          t(`Para referência, em 2025 o balcão registou ${dNum(b25.nacionalidades[0][1])} atendimentos a espanhóis; em 2026 (ano em curso) já vai em ${dNum(b26.nacionalidades[0][1])}.`, `For reference, in 2025 the front desk recorded ${dNum(b25.nacionalidades[0][1])} visits by Spaniards; in 2026 (ongoing year) it already stands at ${dNum(b26.nacionalidades[0][1])}.`),
        ] },
      ],
      footerR: t('Mercados Emissores · INE / Balcão', 'Source Markets · INE / Front Desk'),
    });
  };

  const exportBalcao = () => {
    const b = BALCAO['2026'];
    const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Posto de Turismo', 'Municipality of Braga · Tourist Office'),
      title: t('Atendimento de Balcão', 'Front Desk Service'), subtitle: t('2026 (ano em curso, até 24 de setembro)', '2026 (ongoing year, to 24 September)'),
      kpis: [
        { label: t('Atendimentos', 'Visits'), value: dNum(b.atendimentos) },
        { label: t('Pessoas (pax)', 'People (pax)'), value: dNum(b.pax) },
        { label: t('Visitantes', 'Visitors'), value: pctVisit + '%', sub: dNum(b.visitantes) + t(' turistas', ' tourists') },
        { label: t('Peregrinos', 'Pilgrims'), value: dNum(b.peregrinos), sub: t('Caminhos de Santiago', 'Camino de Santiago') },
      ],
      sections: [
        { kind: 'bars', title: t('O que procuram (interesses, top 10)', 'What they look for (interests, top 10)'),
          data: b.interesses.slice(0, 10).map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#8AB0E6' },
        { kind: 'bars', title: t('Meio de chegada', 'Means of arrival'),
          data: b.meioChegada.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'table', title: t('Nacionalidades (top 10)', 'Nationalities (top 10)'),
          head: [t('Nacionalidade', 'Nationality'), t('Atendimentos', 'Visits')], rows: b.nacionalidades.slice(0, 10).map((x: [string, number]) => [dl(x[0]), dNum(x[1])]) },
        { kind: 'prose', title: t('Nota', 'Note'), paras: [
          t('Cada registo corresponde a um atendimento no Posto de Turismo. Os dados de 2026 são do ano em curso (até 24 de setembro), pelo que os totais anuais serão superiores.', 'Each record corresponds to one visit at the Tourist Office. The 2026 data is for the ongoing year (to 24 September), so the annual totals will be higher.'),
        ] },
      ],
      footerR: t('Atendimento de Balcão · Posto de Turismo', 'Front Desk Service · Tourist Office'),
    });
  };

  const exportTaxa = () => {
    const TX = TAXA_TURISTICA;
    const anos = ['2021', '2022', '2023', '2024', '2025'];
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Taxa Municipal Turística', 'Municipal Tourist Tax'), subtitle: t('Receita 2021–2026', 'Revenue 2021–2026'),
      kpis: [
        { label: t('Receita 2025', 'Revenue 2025'), value: dEur(TX['2025'].Total), sub: dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100) + ' vs 2024' },
        { label: t('Receita 2024', 'Revenue 2024'), value: dEur(TX['2024'].Total) },
        { label: t('Empreendimentos', 'Establishments'), value: dNum(INFRA.empreendimentos), sub: t('hotéis e similares', 'hotels and similar') },
        { label: t('Alojamento Local', 'Local Accommodation'), value: dNum(INFRA.alojamentoLocal), sub: t('registos AL', 'AL registrations') },
      ],
      sections: [
        { kind: 'bars', title: t('Receita anual total (€)', 'Total annual revenue (€)'),
          data: anos.map((y) => ({ label: y, value: TX[y].Total, display: dEur(TX[y].Total) })),
          note: t('Crescimento sustentado desde a retoma pós-pandemia.', 'Sustained growth since the post-pandemic recovery.') },
        { kind: 'prose', title: t('Enquadramento', 'Context'), paras: [
          t('Regulamento n.º 927/2025: 1,50 € por dormida, até ao máximo de 4 noites, aplicável a hóspedes com mais de 16 anos.', 'Regulation no. 927/2025: €1.50 per overnight stay, up to a maximum of 4 nights, applicable to guests over 16 years old.'),
          t(`A receita de 2025 totalizou ${dEur(TX['2025'].Total)}, mais ${dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100)} do que em 2024. Em 2026, a taxa passou a ser cobrada todo o ano, e não só de março a outubro, mantendo 1,50 € por noite: daí a receita nos meses de inverno (janeiro: ${dEur(TX['2026'].Janeiro)}).`, `The 2025 revenue totalled ${dEur(TX['2025'].Total)}, ${dPct(((TX['2025'].Total - TX['2024'].Total) / TX['2024'].Total) * 100)} more than in 2024. In 2026 the tax started being charged all year round, not only from March to October, keeping €1.50 per night: hence the revenue in the winter months (January: ${dEur(TX['2026'].Janeiro)}).`),
        ] },
      ],
      footerR: t('Taxa Municipal Turística', 'Municipal Tourist Tax'),
    });
  };

  const exportSustentabilidade = () => {
    const S = SUSTENTABILIDADE; const P = S.percecao; const D = S.destino;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Green Destinations', 'Municipality of Braga · Green Destinations'),
      title: t('Sustentabilidade do Destino', 'Destination Sustainability'), subtitle: t(`Certificação ${D.certificacao} · perceção e indicadores`, `${D.certificacao} certification · perception and indicators`),
      kpis: [
        { label: t('Certificação', 'Certification'), value: 'Full', sub: t('Green Destinations · 1.ª cidade portuguesa', 'Green Destinations · 1st Portuguese city') },
        { label: t('Perceção positiva', 'Positive perception'), value: dDec(P.positiva) + '%', sub: t(`residentes · n=${P.n}`, `residents · n=${P.n}`) },
        { label: t('Sazonalidade', 'Seasonality'), value: dDec(D.sazonalidade) + '%', sub: t(`nacional ${dDec(D.sazonalidadeNacional)}%`, `national ${dDec(D.sazonalidadeNacional)}%`) },
        { label: t('Frota TUB verde', 'Green TUB fleet'), value: dDec(D.frotaVerde) + '%', sub: t(`${D.autocarrosEletricos} elétricos`, `${D.autocarrosEletricos} electric`) },
      ],
      sections: [
        { kind: 'bars', title: t('Perceção dos residentes - sinais positivos', 'Residents perception - positive signals'),
          data: [
            { label: t('O turismo beneficia a economia', 'Tourism benefits the economy'), value: P.beneficiaEconomia, display: dDec(P.beneficiaEconomia) + '%' },
            { label: t('Valoriza a cultura local', 'Values local culture'), value: P.valorizaCultura, display: dDec(P.valorizaCultura) + '%' },
            { label: t('Respeito pela cultura local', 'Respect for local culture'), value: P.respeitaCultura, display: dDec(P.respeitaCultura) + '%' },
            { label: t('Melhora a vida dos residentes', 'Improves residents quality of life'), value: P.melhoraVida, display: dDec(P.melhoraVida) + '%' },
          ], color: '#34d399' },
        { kind: 'bars', title: t('Tensões percebidas', 'Perceived tensions'),
          data: [
            { label: t('Aumenta o custo de vida', 'Raises the cost of living'), value: P.custoVida, display: dDec(P.custoVida) + '%' },
            { label: t('Impactos ambientais', 'Environmental impacts'), value: P.impactosAmbientais, display: dDec(P.impactosAmbientais) + '%' },
            { label: t('Causa sobrelotação', 'Causes overcrowding'), value: P.sobrelotacao, display: dDec(P.sobrelotacao) + '%' },
            { label: t('Não se sentem ouvidos', 'Do not feel heard'), value: P.naoOuvidos, display: dDec(P.naoOuvidos) + '%' },
          ], color: '#f87171' },
        { kind: 'table', title: t('Indicadores de sustentabilidade do destino', 'Destination sustainability indicators'),
          head: [t('Indicador', 'Indicator'), t('Valor', 'Value')], rows: [
            [t('Sazonalidade (concentração no verão)', 'Seasonality (summer concentration)'), dDec(D.sazonalidade) + '%'],
            [t('Turistas por habitante (pico)', 'Tourists per resident (peak)'), dDec(D.turistasPorHabitante)],
            [t('Frota TUB amiga do ambiente', 'Eco-friendly TUB fleet'), dDec(D.frotaVerde) + '%'],
            [t('Iluminação pública em LED', 'Public LED lighting'), dDec(D.iluminacaoLED) + '%'],
            [t('Economia turística gerida por locais', 'Tourism economy run by locals'), '>' + dDec(D.economiaLocal) + '%'],
            [t('Rede de percursos pedestres', 'Walking trail network'), dNum(D.redePedestre) + ' km'],
          ],
          note: t(`Fontes: Barómetro de Perceção dos Residentes 2026 (n=${P.n}, amostra não probabilística) e Green Destinations Tourism Impact Assessment Braga 2025.`, `Sources: Residents Perception Barometer 2026 (n=${P.n}, non-probabilistic sample) and Green Destinations Tourism Impact Assessment Braga 2025.`) },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`A perceção global é muito positiva (${dDec(P.positiva)}%), com economia e cultura como dimensões mais fortes. A dimensão a reforçar é a governança e participação: apenas ${dDec(P.ouvidos)}% dos residentes sentem que são ouvidos nas decisões sobre turismo.`, `Overall perception is very positive (${dDec(P.positiva)}%), with economy and culture as the strongest dimensions. The dimension to strengthen is governance and participation: only ${dDec(P.ouvidos)}% of residents feel they are heard in tourism decisions.`),
        ] },
      ],
      footerR: t('Sustentabilidade · Green Destinations', 'Sustainability · Green Destinations'),
    });
  };

  const exportDigital = () => {
    const k = DIGITAL.kpis, kp = DIGITAL_POS.kpis, kt = DIGITAL_TOTAL.kpis;
    const sh = (arr: [string, number][], name: string) => { const tot = arr.reduce((s, x) => s + x[1], 0); const f = arr.find((x) => x[0] === name); return f && tot ? Math.round((f[1] / tot) * 100) : 0; };
    const pctOrgA = sh(DIGITAL.canais, 'Pesquisa orgânica'), pctOrgP = sh(DIGITAL_POS.canais, 'Pesquisa orgânica');
    const pctMob = sh(DIGITAL_TOTAL.dispositivos, 'Telemóvel');
    const MES_EN: Record<string, string> = { jan: 'Jan', fev: 'Feb', mar: 'Mar', abr: 'Apr', mai: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', set: 'Sep', out: 'Oct', nov: 'Nov', dez: 'Dec' };
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · visitbraga.travel', 'Municipality of Braga · visitbraga.travel'),
      title: t('Audiência Digital', 'Digital Audience'), subtitle: `Google Analytics 4 · Google Search Console · ${DIGITAL_TOTAL.periodo}`,
      kpis: [
        { label: t('Utilizadores', 'Users'), value: dNum(kt.utilizadores), sub: t('desde o lançamento', 'since launch') },
        { label: t('Cliques no Google', 'Google clicks'), value: dNum(SEARCH_CONSOLE.cliques) },
        { label: t('Antes do ataque', 'Before the attack'), value: dNum(k.utilizadores), sub: DIGITAL.periodo },
        { label: t('Retoma', 'Recovery'), value: dNum(kp.utilizadores), sub: t('desde o final de agosto', 'since late August') },
      ],
      sections: [
        { kind: 'bars', title: t('Cliques no Google por mês', 'Google clicks by month'),
          data: SEARCH_CONSOLE.mensal.map(([m, c]) => { const [mm, yy] = m.split('/'); return { label: t(m, `${MES_EN[mm]}/${yy}`), value: c, display: dNum(c) }; }), color: '#8AB0E6' },
        { kind: 'bars', title: t('Canais de aquisição - antes do ataque', 'Acquisition channels - before the attack'),
          data: DIGITAL.canais.map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#34d399' },
        { kind: 'bars', title: t('Canais de aquisição - retoma', 'Acquisition channels - recovery'),
          data: DIGITAL_POS.canais.map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#fb923c' },
        { kind: 'bars', title: t('Top países - antes do ataque (utilizadores)', 'Top countries - before the attack (users)'),
          data: DIGITAL.paises.slice(0, 8).map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Páginas mais vistas - antes do ataque', 'Most viewed pages - before the attack'),
          data: DIGITAL.paginas.slice(0, 8).map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#a78bfa' },
        { kind: 'prose', title: t('Leitura estratégica', 'Strategic reading'), paras: [
          t('Em 2026 o site foi alvo de um ciberataque e esteve fora do ar vários meses: o tráfego vindo do Google manteve-se normal até abril, caiu em maio, foi quase nulo em junho e julho e voltou a crescer no final de agosto.', 'In 2026 the site suffered a cyberattack and was offline for several months: traffic from Google stayed normal until April, dropped in May, was almost nil in June and July and began to recover at the end of August.'),
          t(`O site perdeu sobretudo o Google: antes do ataque, ${pctOrgA}% dos novos utilizadores chegavam pela pesquisa orgânica; na retoma são ${pctOrgP}%. Recuperar o posicionamento nas pesquisas é a prioridade.`, `The site mainly lost Google: before the attack, ${pctOrgA}% of new users came from organic search; during recovery it is ${pctOrgP}%. Recovering search rankings is the priority.`),
          t(`Na retoma, quem chega fica mais tempo (${kp.tempoMedioSeg} s contra ${k.tempoMedioSeg} s) e surge um canal novo: ${dNum(kp.sessoesChatGPT)} sessões vieram do ChatGPT. ${pctMob}% dos utilizadores usam telemóvel.`, `During recovery, visitors stay longer (${kp.tempoMedioSeg} s vs ${k.tempoMedioSeg} s) and a new channel appears: ${dNum(kp.sessoesChatGPT)} sessions came from ChatGPT. ${pctMob}% of users are on mobile.`),
          t('Os períodos antes, retoma e desde o lançamento não são somáveis. Cidades por deteção aproximada de IP; entradas sem cidade definida e tráfego automático excluídos dos tops.', 'The before, recovery and since-launch periods cannot be added up. Cities by approximate IP detection; entries without a defined city and automated traffic excluded from the tops.'),
        ] },
      ],
      footerR: t('Audiência Digital · GA4 + Search Console', 'Digital Audience · GA4 + Search Console'),
    });
  };

  const exportAcessibilidade = () => {
    const A = ACESSIBILIDADE;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Posto de Turismo', 'Municipality of Braga · Tourist Office'),
      title: t('Acessibilidade no Atendimento', 'Accessibility in Service'), subtitle: t('Necessidades especiais registadas no balcão', 'Special needs recorded at the front desk'),
      kpis: [
        { label: t('Atendimentos registados', 'Recorded visits'), value: dNum(A.total) },
        { label: t('Pessoas abrangidas', 'People covered'), value: dNum(A.pax) },
        { label: t('% do total de atendimentos', '% of total visits'), value: dDec(A.pct) + '%' },
      ],
      sections: [
        { kind: 'prose', title: t('Amostra reduzida - leitura cautelosa', 'Small sample - read with caution'), paras: [
          t(`O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado (${A.total} em ${dNum(A.totalAtendimentos)} atendimentos). Os números abaixo são um ponto de partida e não refletem a procura real.`, `Recording of special needs only began in 2026 and is heavily underused (${A.total} of ${dNum(A.totalAtendimentos)} visits). The numbers below are a starting point and do not reflect real demand.`),
          t('O valor deste indicador cresce com o registo sistemático no balcão - vale a pena reforçar essa prática junto da equipa de atendimento.', 'The value of this indicator grows with systematic recording at the front desk - it is worth reinforcing this practice with the service team.'),
        ] },
        { kind: 'bars', title: t('Por tipo de necessidade', 'By type of need'),
          data: A.tipos.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#60a5fa' },
        { kind: 'bars', title: t('Por mês (2026)', 'By month (2026)'),
          data: A.porMes.map((x: [string, number]) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })), color: '#8AB0E6' },
      ],
      footerR: t('Acessibilidade no Atendimento', 'Accessibility in Service'),
    });
  };

  const exportCaminhos = () => {
    const K = CAMINHOS;
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Caminhos de Santiago', 'Camino de Santiago'), subtitle: t('Partidas de Braga · Serviço de Peregrinos da Catedral de Santiago', 'Departures from Braga · Pilgrims Office of the Cathedral of Santiago'),
      kpis: [
        { label: t('Partidas de Braga 2025', 'Departures from Braga 2025'), value: dNum(K.partidasBraga[K.partidasBraga.length - 1][1]), sub: t('recorde', 'record') },
        { label: t('Posição nacional', 'National position'), value: K.rankingNacional + '.ª', sub: t(`líder: ${K.liderNacional}`, `leader: ${K.liderNacional}`) },
        { label: t('Caminho da Geira 2025', 'Geira Route 2025'), value: dNum(K.porCaminho2025[0][1]), sub: t('lidera pela 1.ª vez', 'leads for the first time') },
        { label: t('Acumulado da Geira', 'Geira cumulative'), value: dNum(K.acumulado.peregrinos), sub: t('desde 2017', 'since 2017') },
      ],
      sections: [
        { kind: 'table', title: t('Partidas de Braga por caminho (2023–2025)', 'Departures from Braga by route (2023–2025)'),
          head: [t('Ano', 'Year'), dl('Geira e Arrieiros'), dl('Central Português')],
          rows: K.evolucao.map((e) => [e.ano, dNum(e.Geira), dNum(e.Central)]), emphasizeRow: 2,
          note: t('Em 2025 o Caminho da Geira ultrapassou pela primeira vez o Central nas partidas de Braga.', 'In 2025 the Geira route overtook the Central for the first time in departures from Braga.') },
        { kind: 'bars', title: t('Repartição por caminho (2025)', 'Breakdown by route (2025)'),
          data: K.porCaminho2025.map((x) => ({ label: dl(x[0]), value: x[1], display: dNum(x[1]) })) },
        { kind: 'bars', title: t('Origem dos peregrinos do Caminho da Geira (2025)', 'Origin of Geira route pilgrims (2025)'),
          data: K.cga2025.nacionalidades.map((x) => ({ label: dl(x[0]), value: x[1], display: dDec(x[1]) + '%' })), color: '#60a5fa' },
        { kind: 'prose', title: 'Leitura', paras: [
          t(`Braga registou ${dNum(K.partidasBraga[K.partidasBraga.length - 1][1])} partidas em 2025 (o valor mais elevado de que há registo) e subiu à ${K.rankingNacional}.ª posição nacional como ponto de partida. ${dDec(K.cga2025.inicioBraga)}% dos peregrinos do Caminho da Geira iniciam na Sé de Braga.`, `Braga recorded ${dNum(K.partidasBraga[K.partidasBraga.length - 1][1])} departures in 2025 (the highest on record) and rose to national position ${K.rankingNacional} as a starting point. ${dDec(K.cga2025.inicioBraga)}% of Geira route pilgrims start at Braga Cathedral.`),
          t('Os valores correspondem a Compostelas emitidas, pelo que subestimam o total real (muitos peregrinos não solicitam o documento). As associações estimam números superiores.', 'The figures correspond to issued Compostelas, so they underestimate the real total (many pilgrims do not request the document). Associations estimate higher numbers.'),
        ] },
      ],
      footerR: t('Caminhos de Santiago · Serviço de Peregrinos', 'Camino de Santiago · Pilgrims Office'),
    });
  };

  const exportGeral = () => {
    const H = HEADLINE;
    const dormBars = Object.entries(DORMIDAS_ANUAL).filter(([, v]) => v != null).map(([y, v]) => ({ label: y, value: v as number, display: dNum(v as number) }));
    const taxaBars = ['2021', '2022', '2023', '2024', '2025'].map((y) => ({ label: y, value: TAXA_TURISTICA[y].Total, display: dEur(TAXA_TURISTICA[y].Total) }));
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Síntese do Destino', 'Destination Overview'), subtitle: t('Indicadores-chave do turismo de Braga', 'Key indicators of Braga tourism'),
      kpis: [
        { label: t('Reputação média', 'Average reputation'), value: reputacaoMedia != null ? dDec(+reputacaoMedia.toFixed(1)) + '/10' : '-', sub: t(`${reputacaoLocais ?? 0} locais · ${dNum(reputacaoReviews ?? 0)} reviews`, `${reputacaoLocais ?? 0} sites · ${dNum(reputacaoReviews ?? 0)} reviews`) },
        { label: t('Dormidas 2025', 'Overnight stays 2025'), value: dNum(H.dormidas2025), sub: dPct(H.dormidasVar) + t(' homólogo', ' YoY') },
        { label: t('Hóspedes 2025', 'Guests 2025'), value: dNum(H.hospedes2025), sub: dPct(H.hospedesVar) + t(' homólogo', ' YoY') },
        { label: t('Receita da taxa 2025', 'Tax revenue 2025'), value: dEur(TAXA_TURISTICA['2025'].Total) },
        { label: t('Atendimentos balcão 2025', 'Front desk visits 2025'), value: dNum(BALCAO['2025'].atendimentos), sub: dNum(BALCAO['2025'].pax) + ' pax' },
        { label: t('Ocupação / quarto', 'Room occupancy'), value: dDec(H.ocupQuarto.Braga) + '%', sub: t(`estada média ${dDec(H.estadaMedia.Braga)} noites`, `average stay ${dDec(H.estadaMedia.Braga)} nights`) },
      ],
      sections: [
        { kind: 'bars', title: t('Dormidas anuais em Braga (2019–2025)', 'Annual overnight stays in Braga (2019–2025)'), data: dormBars, note: t('Fonte: INE/TravelBI.', 'Source: INE/TravelBI.') },
        { kind: 'bars', title: t('Receita da Taxa Municipal Turística (€/ano)', 'Municipal Tourist Tax revenue (€/year)'), data: taxaBars, color: '#a78bfa', note: t('Taxa de 1,50 € por dormida (regulamento n.º 927/2025).', 'Tax of €1.50 per overnight stay (regulation no. 927/2025).') },
        { kind: 'prose', title: t('Cruzamento reputação × procura', 'Reputation × demand cross-analysis'), paras: [
          t('Três fontes independentes triangulam a mesma realidade: o que as pessoas dizem (reputação online), onde dormem (INE e taxa turística) e o que procuram ao balcão.', 'Three independent sources triangulate the same reality: what people say (online reputation), where they stay (INE and tourist tax) and what they look for at the front desk.'),
          t('Quando a reputação de um ponto de interesse âncora cai, isso costuma anteceder quebras na procura; a receita da taxa permite quantificar o retorno de cada intervenção.', 'When the reputation of an anchor point of interest drops, it usually precedes falls in demand; the tax revenue allows quantifying the return of each intervention.'),
        ] },
      ],
      footerR: t('Síntese do Destino', 'Destination Overview'),
    });
  };

  const exportCruzamentos = () => {
    const canon = (s: string) => (s === 'Estados Unidos' ? 'EUA' : s);
    const bal = (BALCAO['2026'].nacionalidades as [string, number][]).map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
    const dig = DIGITAL.paises.map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
    const balTotal = bal.reduce((s, [, n]) => s + n, 0) || 1;
    const digTotal = dig.reduce((s, [, n]) => s + n, 0) || 1;
    const balMap: Record<string, number> = {}; bal.forEach(([c, n]) => { balMap[c] = (n / balTotal) * 100; });
    const digMap: Record<string, number> = {}; dig.forEach(([c, n]) => { digMap[c] = (n / digTotal) * 100; });
    const ineRank: Record<string, number> = {}; HEADLINE.mercados2025.forEach((c, i) => { ineRank[canon(c)] = i + 1; });
    const markets = Array.from(new Set([...Object.keys(balMap), ...Object.keys(digMap)]));
    const rows = markets.map((m) => ({ m, bal: balMap[m] || 0, dig: digMap[m] || 0, ine: ineRank[m] || null, gap: (digMap[m] || 0) - (balMap[m] || 0) }))
      .sort((a, b) => (b.bal + b.dig) - (a.bal + a.dig)).slice(0, 12);
    const digitalOver = [...rows].filter((r) => r.gap > 3).sort((a, b) => b.gap - a.gap).slice(0, 3);
    const fisicoOver = [...rows].filter((r) => r.gap < -3).sort((a, b) => a.gap - b.gap).slice(0, 3);
    openPremiumDoc({
      logo: LOGO, eyebrow: t('Município de Braga · Observatório', 'Municipality of Braga · Observatory'),
      title: t('Cruzamento de Mercados', 'Market Cross-analysis'), subtitle: t('Presença física (balcão) vs interesse digital (site)', 'Physical presence (front desk) vs digital interest (site)'),
      kpis: [
        { label: t('Principal mercado (INE)', 'Main market (INE)'), value: dl(HEADLINE.mercados2025[0]) },
        { label: t('Topo no balcão', 'Top at front desk'), value: dl([...rows].sort((a, b) => b.bal - a.bal)[0]?.m || '-'), sub: t('presença física', 'physical presence') },
        { label: t('Topo no digital', 'Top in digital'), value: dl([...rows].sort((a, b) => b.dig - a.dig)[0]?.m || '-'), sub: t('interesse online', 'online interest') },
        { label: t('Mercados cruzados', 'Cross-referenced markets'), value: String(rows.length) },
      ],
      sections: [
        { kind: 'table', title: t('Mercados: ranking INE, presença física e interesse digital', 'Markets: INE ranking, physical presence and digital interest'),
          head: [t('Mercado', 'Market'), 'INE', t('Balcão', 'Front desk'), 'Digital'],
          rows: rows.map((r) => [dl(r.m), r.ine ? ('#' + r.ine) : '-', dDec(+r.bal.toFixed(1)) + '%', dDec(+r.dig.toFixed(1)) + '%']),
          note: t('Quota % excluindo Portugal (mercado doméstico). INE = posição por dormidas.', 'Share % excluding Portugal (domestic market). INE = position by overnight stays.') },
        { kind: 'stats', title: t('Mais interesse online que presença física', 'More online interest than physical presence'),
          items: digitalOver.length ? digitalOver.map((r) => ({ label: dl(r.m), value: '+' + dDec(+r.gap.toFixed(1)) + ' pp', sub: t('online acima de física', 'online above physical') })) : [{ label: '-', value: t('Sem divergências', 'No divergences'), sub: t('relevantes', 'relevant') }] },
        { kind: 'stats', title: t('Mais presença física que pegada online', 'More physical presence than online footprint'),
          items: fisicoOver.length ? fisicoOver.map((r) => ({ label: dl(r.m), value: dDec(+r.gap.toFixed(1)) + ' pp', sub: t('física acima de online', 'physical above online') })) : [{ label: '-', value: t('Sem divergências', 'No divergences'), sub: t('relevantes', 'relevant') }] },
        { kind: 'prose', title: t('Notas de leitura', 'Reading notes'), paras: [
          t('As três fontes medem coisas diferentes: INE são dormidas reais; o balcão é apenas quem entra no posto de turismo (fatia pequena e auto-selecionada, dados de 2026); o digital é a audiência do site (inclui investigação e possível tráfego automatizado, como nos valores elevados da China).', 'The three sources measure different things: INE are real overnight stays; the front desk is only those who enter the tourist office (a small, self-selected share, 2026 data); digital is the site audience (includes research and possible automated traffic, as in the high figures from China).'),
          t('Portugal foi excluído por ser mercado doméstico. Lê isto como indício para investigar, não como prova.', 'Portugal was excluded as it is the domestic market. Read this as a clue to investigate, not as proof.'),
        ] },
      ],
      footerR: t('Cruzamento de Mercados', 'Market Cross-analysis'),
    });
  };

  // Calendário: documento próprio, gerado a partir dos dados (o módulo só é carregado quando é preciso)
  const exportCalendario = () => { import('./obs/Calendario').then(abrirCalendarioPdf).catch(() => {}); };

  const exportarPDF = () => {
    const node = document.getElementById('obs-print-area');
    if (!node) return;
    const win = abrirJanelaDocumento(1180, 860);
    if (!win) { alert(t('Permita pop-ups para exportar o PDF.', 'Allow pop-ups to export the PDF.')); return; }
    const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: '2-digit', month: 'long', year: 'numeric' });
    const html =
      '<!DOCTYPE html><html lang="' + t('pt', 'en') + '"><head><meta charset="utf-8">' +
      '<title>' + t('Observatório de Turismo de Braga', 'Braga Tourism Observatory') + ' - ' + tabLabel + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{box-sizing:border-box;}' +
      'body{margin:0;font-family:"DM Sans",sans-serif;background:#0c0e14;color:#e2e0db;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.brand{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:2px solid #8AB0E6;}' +
      '.brand img{height:30px;}' +
      '.brand .meta{text-align:right;}' +
      '.brand h1{font-size:17px;margin:0;color:#8AB0E6;letter-spacing:-0.01em;}' +
      '.brand .sub{font-size:12px;color:#9a99a0;margin-top:2px;}' +
      '.content{padding:18px 24px;}' +
      '.content button{display:none !important;}' +
      '.content > div > div:first-child{break-inside:avoid;}' +
      'footer{padding:14px 28px;border-top:1px solid #252836;font-size:10px;color:#8a8c9e;display:flex;justify-content:space-between;}' +
      '@page{margin:12mm;}' +
      '</style></head><body>' +
      '<div class="brand"><img src="https://i.imgur.com/Vij12Qd.png" alt="Visit Braga">' +
      '<div class="meta"><h1>' + t('Observatório de Turismo de Braga', 'Braga Tourism Observatory') + '</h1><div class="sub">' + tabLabel + ' · ' + hoje + '</div></div></div>' +
      '<div class="content">' + node.innerHTML + '</div>' +
      '<footer><span>' + t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division') + '</span>' +
      '<span>' + t('Fontes: INE/TravelBI · Taxa Municipal Turística · Atendimento de Balcão', 'Sources: INE/TravelBI · Municipal Tourist Tax · Front Desk') + '</span></footer>' +
      '<script>setTimeout(function(){window.focus();window.print();},700);</script>' +
      '</body></html>';
    win.document.open(); win.document.write(html); win.document.close();
  };

  return (
    <div className="obs" style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Public Sans', system-ui, sans-serif", fontVariantNumeric: 'tabular-nums', color: C.text }}>
      <style>{OBS_CSS + CSS_GRAD}</style>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>{CORES_GRAD.map((c) => <linearGradient key={c} id={gradId(c)} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={1} /><stop offset="100%" stopColor={c} stopOpacity={0.55} /></linearGradient>)}</defs>
      </svg>
      <div className="obs-hero">
        {(fotoTopo || foto) && <div className="obs-hero-img" style={{ backgroundImage: `url(${fotoTopo || foto})` }} />}
        <div className="obs-hero-shade" />
        <div className="obs-hero-in">
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.accent }}>Braga</div>
          <h1 className="obs-h1">{t('Observatório de Turismo de Braga', 'Braga Tourism Observatory')}</h1>
          <p style={{ color: C.textMuted, fontSize: 15, margin: 0, maxWidth: 760, lineHeight: 1.55 }}>{t('Análise integrada de dados reais - INE/TravelBI · Atendimento de Balcão · Taxa Municipal Turística', 'Integrated analysis of real data - INE/TravelBI · Front Desk · Municipal Tourist Tax')}</p>
          {tab !== 'meteo' && (
            <button className="obs-pdf-m" onClick={() => {
              const map: Record<string, () => void> = {
                geral: exportGeral, procura: exportProcura, economia: exportEconomia, mercados: exportMercados,
                balcao: exportBalcao, taxa: exportTaxa, sustentabilidade: exportSustentabilidade,
                digital: exportDigital, acessibilidade: exportAcessibilidade, caminhos: exportCaminhos,
                cruzamentos: exportCruzamentos, calendario: exportCalendario,
              };
              (map[tab] || exportarPDF)();
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v11m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
              {t('Exportar PDF', 'Export PDF')}
            </button>
          )}
        </div>
      </div>
      {copiado && <div className="obs-toast" role="status" aria-live="polite"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7CC79A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>{t('Ligação copiada', 'Link copied')}</div>}
      <Perguntar onIrPara={irPara} reputacao={reputacaoResumo} nomeSeparador={nomeSeparador} />

      <div className="obs-tabs">
        <div className="obs-tabs-in">
          <nav className="obs-grupos" aria-label={t('Grupos do Observatório', 'Observatory groups')}>
            {GRUPOS.map((g) => (
              <button key={g.id} className={`obs-grupo${g.id === grupoAtual.id ? ' on' : ''}`} onClick={() => irGrupo(g)} aria-current={g.id === grupoAtual.id ? 'true' : undefined}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.icon} /></svg>
                {g.label}
              </button>
            ))}
          </nav>
          <button className="obs-menu-m" onClick={() => setMenuAberto(true)} aria-haspopup="dialog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={grupoAtual.icon} /></svg>
            <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}><small>{grupoAtual.label}</small>{tabLabel}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button type="button" className="obs-copiar" onClick={copiarLigacao} aria-live="polite" title={t('Copiar a ligação direta para este separador', 'Copy the direct link to this tab')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" /></svg>
            <span>{t('Copiar ligação', 'Copy link')}</span>
          </button>
          {tab !== 'meteo' && (
            <button className="obs-pdf" onClick={() => {
              const map: Record<string, () => void> = {
                geral: exportGeral, procura: exportProcura, economia: exportEconomia, mercados: exportMercados,
                balcao: exportBalcao, taxa: exportTaxa, sustentabilidade: exportSustentabilidade,
                digital: exportDigital, acessibilidade: exportAcessibilidade, caminhos: exportCaminhos,
                cruzamentos: exportCruzamentos, calendario: exportCalendario,
              };
              (map[tab] || exportarPDF)();
            }}>{t('Exportar PDF', 'Export PDF')}</button>
          )}
        </div>
        {grupoAtual.tabs.length > 1 && (
          <div className="obs-sub-in">
            {grupoAtual.tabs.map((id) => (
              <button key={id} className={`obs-sub${tab === id ? ' on' : ''}`} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>{TABS.find((x) => x.id === id)?.label}</button>
            ))}
          </div>
        )}
      </div>

      {menuAberto && (
        <div className="obs-folha-fundo" onClick={() => setMenuAberto(false)}>
          <div className="obs-folha" role="dialog" aria-modal="true" aria-label={t('Escolher separador', 'Choose section')} onClick={(e) => e.stopPropagation()}>
            <div className="obs-folha-pega" />
            <div className="obs-folha-topo">
              <strong>{t('Observatório', 'Observatory')}</strong>
              <button onClick={() => setMenuAberto(false)} aria-label={t('Fechar', 'Close')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {GRUPOS.map((g) => (
              <div key={g.id} className="obs-folha-grupo">
                <div className="obs-folha-titulo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={g.icon} /></svg>{g.label}
                </div>
                <div className="obs-folha-itens">
                  {g.tabs.map((id) => (
                    <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMenuAberto(false); }}>{TABS.find((x) => x.id === id)?.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="obs-body" key={tab}>
      <div id="obs-print-area">
        {tab === 'geral' && <><Sinais irPara={irPara} nomeSeparador={nomeSeparador} /><Leituras irPara={irPara} nomeSeparador={nomeSeparador} /><Geral rep={reputacaoMedia} repL={reputacaoLocais} repR={reputacaoReviews} /></>}
        {tab === 'procura' && <Procura />}
        {tab === 'economia' && <Economia />}
        {tab === 'mercados' && <Mercados />}
        {tab === 'calendario' && <Calendario />}
        {tab === 'balcao' && <Balcao />}
        {tab === 'taxa' && <Taxa />}
        {tab === 'sustentabilidade' && <Sustentabilidade />}
        {tab === 'digital' && <Digital />}
        {tab === 'cartoes' && <Cartoes />}
        {tab === 'cultura' && <Cultura />}
        {tab === 'perfil' && <PerfilTurista />}
        {tab === 'ferramentas' && <FerramentasDigitais />}
        {tab === 'animacao' && <AnimacaoTuristica />}
        {tab === 'lojas' && <LojasHistoria />}
        {tab === 'emprego' && <Emprego />}
        {tab === 'estimativa' && <EstimativaDormidas />}
        {tab === 'insto' && <Insto irPara={irPara} nomeSeparador={nomeSeparador} />}
        {tab === 'mobilidade' && <Mobilidade />}
        {tab === 'hotelaria' && <Hotelaria />}
        {tab === 'alojamento' && <AlojamentoLocal />}
        {tab === 'aeroporto' && <Aeroporto />}
        {tab === 'acessibilidade' && <Acessibilidade />}
        {tab === 'meteo' && <Meteorologia />}
        {tab === 'caminhos' && <Caminhos />}
        {tab === 'cruzamentos' && <Cruzamentos />}
      </div>
      </div>
    </div>
  );
}

// ─── Componentes base ────────────────────────────────────────────────────────

// Degradê das barras: regras fixas por cor (aplicam-se no instante em que a barra aparece, sem piscar)
const CORES_GRAD: string[] = Array.from(new Set([...Object.values(C), ...Object.values(YEAR_COLORS), ...PAL, ...SUS_PAL].filter((c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))));

const gradId = (c: string) => 'og' + c.slice(1).toLowerCase();

const CSS_GRAD = CORES_GRAD.map((c) => `.obs .recharts-bar-rectangle path[fill="${c}"],.obs .recharts-bar-rectangle path[fill="${c.toLowerCase()}"],.obs .recharts-bar-rectangle path[fill="${c.toUpperCase()}"]{fill:url(#${gradId(c)})}`).join('');

