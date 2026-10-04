'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, ChangeEvent } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { db, obterAuth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ModoAdmin } from '@/app/components/modo';
import { collection, doc, setDoc, deleteDoc, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { t, setLangGlobal, type Lang } from '@/app/lib/i18n';
import { dispAnalysis, setTransNotify, invalidateTrans } from '@/app/lib/ai-translate';
import {
  parseReviewFile, groupByPlace, suggestMatch, importIntoLocation, loadWindowReviews, deleteLocationReviews,
  windowStats, sampleForAI, langName, langNamePT, rebuildStats, saveTags, type ReviewStats, type ImportGroup, type StoredReview,
} from '@/app/lib/reviews';
import { TEMAS, temaStats, excertos, numeros, ranking, numerosCoerentes, numerosPermitidos, resumoModelo, tagValida, indiceDestino } from '@/app/lib/temas';
import { obterFotoBraga } from '@/app/lib/foto-braga';
import { VisaoGeral, LocaisLista, FichaLocal, MapaView, CompararView, TemasView, RelatorioView, MercadosView, ProdutosView, type Intervencao, type Afluencia, type Atributos, type WikiDados } from '@/app/components/Reputacao';

// O Observatório só é descarregado quando é aberto (a app arranca mais depressa, sobretudo no telemóvel)
const ObservatorioView = dynamic(() => import('@/app/components/ObservatorioView'), {
  ssr: false,
  loading: () => <div role="status" aria-live="polite" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3A8B1', fontSize: 14 }}>A carregar o Observatório…</div>,
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LOGO_URL = 'https://i.imgur.com/Vij12Qd.png';

const CATEGORIES = ['Monumento', 'Museu', 'Restaurante', 'Alojamento', 'Experiência', 'Espaço Público', 'Outro'];
const PLATFORMS = ['Google Maps', 'TripAdvisor', 'Booking.com', 'Outro'];
const DATA_EN: Record<string, string> = {
  Monumento: 'Monument', Museu: 'Museum', Restaurante: 'Restaurant', Alojamento: 'Accommodation',
  'Experiência': 'Experience', 'Espaço Público': 'Public Space', Outro: 'Other',
};
const catLabel = (x: string) => t(x, DATA_EN[x] ?? x);

// Curated list of canonical POI names for autocomplete
const KNOWN_POI_NAMES = [
  'Santuário do Bom Jesus do Monte',
  'Elevador do Bom Jesus do Monte',
  'Sé Catedral de Braga',
  'Tesouro-Museu da Sé de Braga',
  'Museu dos Biscainhos',
  'Termas Romanas do Alto da Cividade',
  'Fonte do Ídolo',
  'Museu de Arqueologia D. Diogo de Sousa',
  'Museu Pio XII',
  'Museu Nogueira da Silva',
  'Igreja de Santa Cruz',
  'Posto de Turismo de Braga',
  'Posto de Turismo de Guimarães',
  'Mosteiro de Tibães',
  'Capela e Casa dos Coimbras',
  'Palácio do Raio',
  'Picoto Park',
  'Núcleo Museológico de São Martinho de Dume',
  'Estádio Municipal de Braga',
  'Igreja dos Congregados',
  'Jardim de Santa Bárbara',
  'Arco da Porta Nova',
  'Praça da República',
  'Largo do Paço',
  'Theatro Circo de Braga',
  'Mosteiro de São Martinho de Tibães',
  'Igreja do Pópulo',
  'Capela de São Frutuoso',
  'Casa do Avelar',
  'Casa Museu Monsenhor Airosa',
  'MUZEU',
  'OzNatura',
  'Get Bus Braga',
];

// Accurate coordinates for major Braga POIs (geographically spread)
const BRAGA_KNOWN_COORDS: Record<string, [number, number]> = {
  // Bom Jesus area (~5km east of city center)
  'santuário do bom jesus': [41.5547, -8.3781],
  'bom jesus do monte': [41.5547, -8.3781],
  'elevador do bom jesus': [41.5544, -8.3804],
  'funicular do bom jesus': [41.5544, -8.3804],

  // City center cluster
  'sé catedral de braga': [41.5503, -8.4275],
  'catedral de braga': [41.5503, -8.4275],
  'sé de braga': [41.5503, -8.4275],
  'tesouro-museu da sé': [41.5503, -8.4275],
  'museu da sé': [41.5503, -8.4275],

  'museu dos biscainhos': [41.5523, -8.4299],
  'biscainhos': [41.5523, -8.4299],

  'termas romanas do alto da cividade': [41.5494, -8.4296],
  'termas romanas': [41.5494, -8.4296],
  'alto da cividade': [41.5494, -8.4296],

  'fonte do ídolo': [41.5482, -8.4274],

  'museu de arqueologia d. diogo de sousa': [41.5476, -8.4294],
  'museu de arqueologia': [41.5476, -8.4294],
  'diogo de sousa': [41.5476, -8.4294],

  'museu pio xii': [41.5503, -8.4296],
  'pio xii': [41.5503, -8.4296],

  'museu nogueira da silva': [41.5485, -8.4219],
  'nogueira da silva': [41.5485, -8.4219],

  'igreja de santa cruz': [41.5512, -8.4250],
  'santa cruz': [41.5512, -8.4250],

  'posto de turismo de braga': [41.5499, -8.4256],

  'posto de turismo de guimarães': [41.4421, -8.2929],
  'turismo de guimarães': [41.4421, -8.2929],

  'mosteiro de tibães': [41.5666, -8.4634],
  'mosteiro de são martinho de tibães': [41.5666, -8.4634],
  'tibães': [41.5666, -8.4634],

  'capela e casa dos coimbras': [41.5512, -8.4283],
  'coimbras': [41.5512, -8.4283],

  'palácio do raio': [41.5483, -8.4265],

  'picoto park': [41.5333, -8.4131],
  'picoto': [41.5333, -8.4131],

  'núcleo museológico de são martinho de dume': [41.5752, -8.4123],
  'são martinho de dume': [41.5752, -8.4123],

  'estádio municipal de braga': [41.5641, -8.4319],
  'estádio municipal': [41.5641, -8.4319],

  // Other Braga POIs
  'igreja dos congregados': [41.5495, -8.4258],
  'jardim de santa bárbara': [41.5511, -8.4263],
  'arco da porta nova': [41.5505, -8.4291],
  'praça da república': [41.5497, -8.4243],
  'largo do paço': [41.5503, -8.4253],
  'theatro circo': [41.5485, -8.4232],
  'igreja do pópulo': [41.5497, -8.4319],
  'capela de são frutuoso': [41.5552, -8.4347],
  'casa do avelar': [41.5475, -8.4283],
  'monsenhor airosa': [41.5512, -8.4256],
};

const C = {
  bg: '#0c0e14',
  bgAlt: '#111318',
  card: '#161920',
  cardHover: '#1c2030',
  border: '#252836',
  borderLight: '#2e3347',
  accent: '#8AB0E6',
  accentLight: '#B7CDF0',
  accentDim: '#7a6428',
  accentBg: 'rgba(138,176,230,0.12)',
  positive: '#34d399',
  positiveBg: 'rgba(52,211,153,0.12)',
  neutral: '#fbbf24',
  neutralBg: 'rgba(251,191,36,0.12)',
  negative: '#f87171',
  negativeBg: 'rgba(248,113,113,0.12)',
  info: '#60a5fa',
  infoBg: 'rgba(96,165,250,0.12)',
  purple: '#a78bfa',
  text: '#e2e0db',
  textMuted: '#8b8a8f',
  textDim: '#4a4960',
  sidebar: '#0e1016',
  sidebarBorder: '#1a1d28',
  // ── premium depth tokens ──
  shadow: '0 1px 2px rgba(0,0,0,0.4), 0 10px 30px -14px rgba(0,0,0,0.65)',
  shadowSoft: '0 18px 50px -22px rgba(0,0,0,0.75)',
  cardGrad: 'linear-gradient(180deg, #181b23 0%, #14171d 100%)',
  sidebarGrad: 'linear-gradient(180deg, #0f1218 0%, #0b0d12 100%)',
  accentGlow: 'rgba(138,176,230,0.22)',
  appGrad: 'radial-gradient(1200px 600px at 70% -10%, rgba(138,176,230,0.05), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(96,165,250,0.04), transparent 55%), #0c0e14',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Review { id: string; text: string; addedAt: string; }

interface Analysis {
  sentimentScore: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topThemesPositive: string[];
  topThemesNegative: string[];
  keyIssues: string[];
  keyPraises: string[];
  actionableInsights: string[];
  summaryPT: string;
  reviewCount: number;
  dimensions: Record<string, number>;
  marketSources?: string[];
  marketSentiment?: { market: string; score: number; note?: string }[];
  // Análise com base nos comentários importados (estrelas reais, janela de 3 anos)
  basis?: string;
  windowFrom?: string;
  windowTo?: string;
  issuesRecent?: string[];
  issuesPrevious?: string[];
  // Análise por temas (ficha do local): título, estado e nota de cada tema, 3 recomendações
  v2?: any;
}

interface AnalysisSnapshot {
  date: string;
  score: number;
  positive: number;
  negative: number;
  reviewCount: number;
  dimensions: Record<string, number>;
  topNegative?: string[];
}

interface Location {
  id: string;
  name: string;
  category: string;
  platform: string;
  reviews: Review[];
  analysis: Analysis | null;
  lastAnalyzed: string | null;
  coords?: [number, number];
  analysisHistory?: AnalysisSnapshot[];
  googleRating?: number;        // nota real do Google (0–5)
  googleReviewCount?: number;   // nº total de reviews no Google
  reviewStats?: ReviewStats;    // comentários importados (estatísticas mensais; textos em reviewMonths)
  interventions?: Intervencao[]; // intervenções registadas (marcadas no gráfico de evolução)
  afluencia?: Afluencia;         // afluência habitual por dia e hora (Google Maps, via extrator)
  atributos?: Atributos;         // informação "Acerca de" e horário do Google Maps (via extrator)
  wiki?: WikiDados;              // visualizações da Wikipédia por língua (API pública)
}

type ViewType = 'overview' | 'locais' | 'mapa' | 'comparar' | 'benchmark' | 'mercados' | 'relatorio' | 'problemas' | 'observatorio' | 'produtos' | 'detalhe';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Divisão inteligente de reviews coladas: '---' → linhas em branco → uma por linha
function splitReviewText(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  if (/\n-{3,}\n/.test(t) || /^-{3,}$/m.test(t)) {
    return t.split(/\n-{3,}\n|^-{3,}$/m).map((s) => s.trim()).filter(Boolean);
  }
  const blocks = t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  return t.split(/\n/).map((s) => s.trim()).filter(Boolean);
}

// Parser CSV correto (lida com aspas e vírgulas/quebras dentro de aspas)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

// Coluna com texto mais longo em média (sugestão para o importador CSV)
function suggestTextColumn(body: string[][]): number {
  if (!body.length) return 0;
  const cols = Math.max(...body.map((r) => r.length));
  let best = 0, bestLen = -1;
  for (let c = 0; c < cols; c++) {
    const avg = body.reduce((sum, r) => sum + (r[c] || '').length, 0) / body.length;
    if (avg > bestLen) { bestLen = avg; best = c; }
  }
  return best;
}

const googleTo10 = (r: number) => +(r * 2).toFixed(1);

// Comparação: sentimento da IA vs nota real do Google (com divergência)
function GoogleCompare({ loc }: { loc: Location }) {
  if (loc.googleRating == null) return null;
  const ai = loc.analysis?.sentimentScore ?? null;
  const g10 = googleTo10(loc.googleRating);
  const gap = ai != null ? +(ai - g10).toFixed(1) : null;
  const dir = gap == null ? null : Math.abs(gap) < 1 ? 'alinhado' : gap >= 1 ? 'acima' : 'abaixo';
  const badgeColor = dir === 'alinhado' ? C.positive : C.info;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 24px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Sentimento IA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: ai != null ? scoreColor(ai) : C.textDim }}>{ai != null ? ai : '-'}</span>
            <span style={{ fontSize: 13, color: C.textDim }}>/10</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Nota Google</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>★ {loc.googleRating}</span>
            {loc.googleReviewCount != null && <span style={{ fontSize: 12, color: C.textMuted }}>({loc.googleReviewCount.toLocaleString('pt-PT')})</span>}
          </div>
        </div>
      </div>
      {gap != null && (
        <div style={{ textAlign: 'right', maxWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: badgeColor }}>
            {dir === 'alinhado' ? '✓ Alinhado com o Google' : `IA ${gap > 0 ? '+' : ''}${gap} face ao Google`}
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, lineHeight: 1.4 }}>
            {dir === 'alinhado'
              ? 'O sentimento das reviews coincide com a média de estrelas.'
              : dir === 'acima'
                ? 'A IA lê o conteúdo de forma mais positiva do que a estrela média sugere.'
                : 'O conteúdo das reviews é mais crítico do que a estrela média indica.'}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── TAXONOMIA DE PROBLEMAS ──────────────────────────────────────────────────
const stripAcc = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const PROBLEM_TAXONOMY: { id: string; label: string; short: string; icon: string; kw: string[] }[] = [
  { id: 'wc', label: 'Casas de banho / WC', short: 'WC', icon: '🚻', kw: ['wc', 'casa de banho', 'casas de banho', 'sanitario', 'banheiro', 'toilet', 'bathroom', 'restroom', 'aseo', 'bano'] },
  { id: 'sinal', label: 'Sinalização / Informação', short: 'Sinaliz.', icon: '🪧', kw: ['sinaliz', 'sinaletica', 'indicac', 'placas', 'orientac', 'sign', 'senaliz', 'mal indicado', 'falta de informac', 'pouca informac'] },
  { id: 'parq', label: 'Estacionamento', short: 'Estac.', icon: '🅿', kw: ['estacionamento', 'parque de estac', 'parking', 'aparcamiento', 'estacionar', 'lugares de carro'] },
  { id: 'manut', label: 'Manutenção / Conservação', short: 'Manut.', icon: '🛠', kw: ['manutencao', 'conservacao', 'degrad', 'estragado', 'partido', 'danificad', 'mau estado', 'maintenance', 'deteriora', 'abandonad', 'obras'] },
  { id: 'acess', label: 'Acessibilidade', short: 'Acessib.', icon: '♿', kw: ['acessibilidade', 'cadeira de rodas', 'mobilidade reduzida', 'rampa', 'wheelchair', 'accessib', 'degraus', 'escadas ingremes', 'dificil acesso'] },
  { id: 'limp', label: 'Limpeza', short: 'Limpeza', icon: '🧹', kw: ['limpeza', 'sujo', 'sujidade', 'lixo', 'dirty', 'suciedad', 'porcaria', 'mau cheiro'] },
  { id: 'fila', label: 'Filas / Espera', short: 'Filas', icon: '⏳', kw: ['fila', 'filas', 'espera', 'demora', 'queue', 'wait', 'cola', 'muito tempo a espera'] },
  { id: 'preco', label: 'Preço / Custo', short: 'Preço', icon: '💶', kw: ['preco', 'caro', 'caros', 'custo elevado', 'expensive', 'overpriced', 'valor elevado'] },
  { id: 'atend', label: 'Atendimento / Pessoal', short: 'Atend.', icon: '🙋', kw: ['atendimento', 'funcionario', 'mal-educad', 'mal educad', 'rude', 'antipatic', 'falta de simpatia', 'mau servico', 'pessoal'] },
  { id: 'lotac', label: 'Multidão / Lotação', short: 'Lotação', icon: '👥', kw: ['multidao', 'lotacao', 'cheio de gente', 'crowd', 'lotado', 'massific', 'demasiada gente', 'muita gente'] },
  { id: 'ruido', label: 'Ruído', short: 'Ruído', icon: '🔊', kw: ['ruido', 'barulho', 'noise', 'ruidoso'] },
  { id: 'horario', label: 'Horários / Encerramento', short: 'Horários', icon: '🕐', kw: ['horario', 'estava fechado', 'encerrado', 'closed', 'horarios'] },
];

const PROBLEM_EN: Record<string, { label: string; short: string }> = {
  wc: { label: 'Toilets / WC', short: 'WC' },
  sinal: { label: 'Signage / Information', short: 'Signage' },
  parq: { label: 'Parking', short: 'Parking' },
  manut: { label: 'Maintenance / Upkeep', short: 'Upkeep' },
  acess: { label: 'Accessibility', short: 'Access.' },
  limp: { label: 'Cleanliness', short: 'Cleanl.' },
  fila: { label: 'Queues / Waiting', short: 'Queues' },
  preco: { label: 'Price / Cost', short: 'Price' },
  atend: { label: 'Service / Staff', short: 'Service' },
  lotac: { label: 'Crowding / Capacity', short: 'Crowding' },
  ruido: { label: 'Noise', short: 'Noise' },
  horario: { label: 'Opening hours / Closure', short: 'Hours' },
};
const probLabel = (p: { id: string; label: string }) => t(p.label, PROBLEM_EN[p.id]?.label ?? p.label);
const probShort = (p: { id: string; short: string }) => t(p.short, PROBLEM_EN[p.id]?.short ?? p.short);

function classifyProblems(loc: Location): Record<string, number> {
  const out: Record<string, number> = {};
  const a = loc.analysis;
  if (!a) return out;
  const text = stripAcc([...(a.keyIssues || []), ...(a.topThemesNegative || [])].join(' . '));
  for (const p of PROBLEM_TAXONOMY) {
    let n = 0;
    for (const k of p.kw) if (text.includes(stripAcc(k))) n++;
    if (n > 0) out[p.id] = n;
  }
  return out;
}

const problemCellBg = (n: number) =>
  n <= 0 ? 'transparent' : `rgba(248,113,113,${Math.min(0.16 + n * 0.22, 0.82)})`;

// ─── Renderizador leve de Markdown para o relatório de IA (sem dependências) ───
function renderInline(text: string): ReactNode[] {
  return text.split(/\*\*/).map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>));
}
function AIReportBody({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`u${blocks.length}`} style={{ margin: '4px 0 14px', paddingLeft: 20 }}>
          {bullets.map((b, i) => <li key={i} style={{ marginBottom: 5, lineHeight: 1.65, color: C.text, fontSize: 13.5 }}>{renderInline(b)}</li>)}
        </ul>
      );
      bullets = [];
    }
  };
  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (line.startsWith('## ')) { flush(); blocks.push(<h2 key={`h${blocks.length}`} style={{ fontSize: 16, fontWeight: 700, color: C.accentLight, margin: '22px 0 10px', letterSpacing: '-0.01em' }}>{line.slice(3)}</h2>); }
    else if (line.startsWith('### ')) { flush(); blocks.push(<h3 key={`h${blocks.length}`} style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '16px 0 8px' }}>{line.slice(4)}</h3>); }
    else if (line.startsWith('# ')) { flush(); blocks.push(<h2 key={`h${blocks.length}`} style={{ fontSize: 16, fontWeight: 700, color: C.accentLight, margin: '22px 0 10px' }}>{line.slice(2)}</h2>); }
    else if (line.startsWith('- ') || line.startsWith('* ')) { bullets.push(line.slice(2)); }
    else { flush(); blocks.push(<p key={`p${blocks.length}`} style={{ fontSize: 13.5, color: C.text, lineHeight: 1.7, margin: '0 0 10px' }}>{renderInline(line)}</p>); }
  });
  flush();
  return <>{blocks}</>;
}

const scoreColor = (s: number) => (s >= 7.5 ? C.positive : s >= 5 ? C.neutral : C.negative);
const scoreBg = (s: number) => (s >= 7.5 ? C.positiveBg : s >= 5 ? C.neutralBg : C.negativeBg);
const scoreLabel = (s: number) =>
  s >= 8.5 ? t('Excelente', 'Excellent') : s >= 7 ? t('Bom', 'Good') : s >= 5.5 ? t('Razoável', 'Fair') : s >= 4 ? t('Insatisfatório', 'Poor') : t('Crítico', 'Critical');
const robLabel = (lvl: string) => lvl === 'Alta' ? t('Alta', 'High') : lvl === 'Média' ? t('Média', 'Medium') : t('Baixa', 'Low');

const categoryIcon = (cat: string) =>
  (({ Monumento: '🏛', Museu: '🖼', Restaurante: '🍽', Alojamento: '🏨', Experiência: '🎭', 'Espaço Público': '🌳' } as Record<string, string>)[cat] || '📍');

// Returns coords matching the LONGEST key in name (so specific overrides generic)
function getKnownCoords(name: string): [number, number] | null {
  const lower = name.toLowerCase();
  let best: { key: string; coords: [number, number] } | null = null;
  for (const [key, coords] of Object.entries(BRAGA_KNOWN_COORDS)) {
    if (lower.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, coords };
    }
  }
  return best?.coords || null;
}

function countTop(arr: string[], n = 8): [string, number][] {
  const m: Record<string, number> = {};
  arr.forEach((x) => { m[x] = (m[x] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
}

const DIMS = ['localizacao', 'servico', 'precoQualidade', 'limpeza', 'experiencia', 'acessibilidade'];
const DIM_LABELS = ['Localização', 'Serviço', 'Preço/Qualidade', 'Limpeza', 'Experiência', 'Acessibilidade'];
const DIM_LABELS_EN = ['Location', 'Service', 'Price/Quality', 'Cleanliness', 'Experience', 'Accessibility'];
const dimLabelI = (idx: number) => t(DIM_LABELS[idx] ?? '', DIM_LABELS_EN[idx] ?? '');
const dimLabel = (key: string) => { const i = DIMS.indexOf(key); return i >= 0 ? dimLabelI(i) : key; };

// Robustez da análise em função do volume de reviews analisadas (e cobertura vs Google)
function robustness(loc: Location): { level: string; color: string; pct: number; n: number; coverage: number | null } {
  const n = loc.analysis?.reviewCount || revCount(loc);
  const g = loc.googleReviewCount || 0;
  let level = 'Baixa', color = '#f87171', pct = 33;
  if (n >= 50) { level = 'Alta'; color = '#34d399'; pct = 100; }
  else if (n >= 15) { level = 'Média'; color = '#fbbf24'; pct = 66; }
  const coverage = g > 0 ? Math.min(100, Math.round((n / g) * 100)) : null;
  return { level, color, pct, n, coverage };
}

// Deteção de mudanças entre a análise atual e a anterior (snapshot)
function whatChanged(loc: Location): null | {
  scoreDelta: number; negDelta: number;
  dimUp: { dim: string; delta: number } | null; dimDown: { dim: string; delta: number } | null;
  newIssues: string[]; resolvedIssues: string[]; prevDate: string;
} {
  const h = loc.analysisHistory;
  if (!h || h.length < 2 || !loc.analysis) return null;
  const prev = h[h.length - 2];
  const cur = loc.analysis;
  const scoreDelta = +(cur.sentimentScore - prev.score).toFixed(1);
  const negDelta = Math.round((cur.sentimentBreakdown?.negative ?? 0) - prev.negative);
  let dimUp: { dim: string; delta: number } | null = null;
  let dimDown: { dim: string; delta: number } | null = null;
  for (const k of Object.keys(cur.dimensions || {})) {
    const pv = prev.dimensions?.[k];
    if (pv == null) continue;
    const d = +(cur.dimensions[k] - pv).toFixed(1);
    if (d > 0 && (!dimUp || d > dimUp.delta)) dimUp = { dim: k, delta: d };
    if (d < 0 && (!dimDown || d < dimDown.delta)) dimDown = { dim: k, delta: d };
  }
  const norm = (s: string) => s.toLowerCase().trim();
  const prevNeg = prev.topNegative;
  const curNeg = cur.topThemesNegative || [];
  let newIssues: string[] = [], resolvedIssues: string[] = [];
  if (prevNeg && prevNeg.length) {
    const prevSet = new Set(prevNeg.map(norm));
    const curSet = new Set(curNeg.map(norm));
    newIssues = curNeg.filter((t) => !prevSet.has(norm(t)));
    resolvedIssues = prevNeg.filter((t) => !curSet.has(norm(t)));
  }
  return { scoreDelta, negDelta, dimUp, dimDown, newIssues, resolvedIssues, prevDate: prev.date };
}

// ─── Comentários importados: contagem, IA e evolução ─────────────────────────
function revCount(loc: Location): number {
  const ws = loc.reviewStats ? windowStats(loc.reviewStats) : null;
  return ws ? ws.n : loc.reviews.length;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// O Firestore recusa campos com valor undefined: remove-os antes de gravar.
const semIndefinidos = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

// Grava alterações num local. Se o documento não existir no Firestore (ex.: local criado
// antes desta correção e que nunca chegou a ser gravado), grava o local completo.
async function gravarLocal(loc: Location, changes: Partial<Location>): Promise<void> {
  const ref = doc(db, 'locations', loc.id);
  const dados = semIndefinidos(changes) as Record<string, any>;
  try {
    await updateDoc(ref, dados);
  } catch (e: any) {
    if (e?.code === 'not-found' || /No document to update/i.test(String(e?.message))) {
      await setDoc(ref, semIndefinidos({ ...loc, ...changes }));
    } else {
      throw e;
    }
  }
}

// Pedido ao Groq com novas tentativas automáticas quando o limite gratuito é atingido (429)
async function groqChat(messages: { role: string; content: string }[], json = false): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json ? { messages, response_format: { type: 'json_object' } } : { messages }),
    });
    if (res.status === 429 && attempt < 4) {
      const ra = Number(res.headers.get('retry-after'));
      await sleep(((ra > 0 ? Math.min(ra, 90) : 30) + 2) * 1000);
      continue;
    }
    if (!res.ok) { const e = await res.text(); throw new Error(`HTTP ${res.status} - ${e.slice(0, 220)}`); }
    const data = await res.json();
    const txt = (data.choices?.[0]?.message?.content || '').trim();
    if (!txt) throw new Error(t('Resposta vazia da IA.', 'Empty response from AI.'));
    return txt;
  }
  throw new Error(t('Limite de pedidos do Groq atingido. Tenta de novo daqui a alguns minutos.', 'Groq rate limit reached. Try again in a few minutes.'));
}

function parseJSONLoose(s: string): any {
  const c = s.replace(/```json|```/g, '').trim();
  try { return JSON.parse(c); } catch { /* tenta extrair o objeto */ }
  const a = c.indexOf('{'), b = c.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(c.slice(a, b + 1)); } catch { /* falha abaixo */ } }
  throw new Error(t('A IA não devolveu JSON válido.', 'The AI did not return valid JSON.'));
}

function ReviewEvolution({ loc, a }: { loc: Location; a: Analysis | null }) {
  const ws = windowStats(loc.reviewStats);
  if (!ws) return null;
  const qd = ws.quarters.map((q) => ({ q: q.q.replace('-T', t(' T', ' Q')), avg: q.avg, neg: q.negPct }));
  const fmt2 = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kpis: [string, string, string][] = [
    [t('Comentários', 'Reviews'), ws.n.toLocaleString('pt-PT'), t('últimos 3 anos', 'last 3 years')],
    [t('Média', 'Average'), `${fmt2(ws.avg)} ★`, t('estrelas reais', 'real stars')],
    [t('Positivos', 'Positive'), `${ws.pos}%`, '4–5 ★'],
    [t('Negativos', 'Negative'), `${ws.neg}%`, '1–2 ★'],
    [t('Respostas do local', 'Owner replies'), `${ws.respRate}%`, t('dos comentários', 'of reviews')],
  ];
  const recent = a?.issuesRecent || [], previous = a?.issuesPrevious || [];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        {t('Evolução da reputação — últimos 3 anos (estrelas reais do Google)', 'Reputation trend — last 3 years (real Google stars)')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 14 }}>
        {kpis.map(([l, v, sub]) => (
          <div key={l} style={{ background: C.bg, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, marginTop: 3 }}>{v}</div>
            <div style={{ fontSize: 10.5, color: C.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>
      {qd.length > 1 && (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={qd} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="q" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <YAxis yAxisId="l" domain={[1, 5]} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <YAxis yAxisId="r" orientation="right" unit="%" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
              <Line yAxisId="l" type="monotone" dataKey="avg" name={t('Média ★', 'Average ★')} stroke={C.accent} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line yAxisId="r" type="monotone" dataKey="neg" name={t('% negativos', '% negative')} stroke={C.negative} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: C.textDim, margin: '4px 0 12px' }}>
            <span style={{ color: C.accent }}>━</span> {t('média de estrelas por trimestre (eixo da esquerda)', 'average stars per quarter (left axis)')} · <span style={{ color: C.negative }}>┅</span> {t('% de comentários com 1–2 ★ (eixo da direita)', '% of 1–2 ★ reviews (right axis)')}
          </div>
        </>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: recent.length || previous.length ? 14 : 4 }}>
        {ws.langs.slice(0, 8).map((l) => (
          <span key={l.code} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 7, background: C.bg, border: `1px solid ${C.border}`, color: C.textMuted }}>
            {langName(l.code)} {Math.round((l.n / ws.n) * 100)}% · ★ {fmt2(l.avg)}
          </span>
        ))}
      </div>
      {(recent.length > 0 || previous.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {([[t('Problemas — últimos 12 meses', 'Issues — last 12 months'), recent, C.negative], [t('Problemas — período anterior (12–36 meses)', 'Issues — previous period (12–36 months)'), previous, C.textMuted]] as [string, string[], string][]).map(([title, list, color]) => (
            <div key={title} style={{ background: C.bg, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 6 }}>{title}</div>
              {list.length ? list.map((x) => <div key={x} style={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>• {x}</div>) : <div style={{ fontSize: 12, color: C.textDim }}>—</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 10 }}>
        {t('Período', 'Period')}: {ws.from} → {ws.to} · {t('importado a', 'imported on')} {new Date(loc.reviewStats!.lastImport).toLocaleDateString('pt-PT')} · {t('a pontuação /10 é a média de estrelas × 2', 'the /10 score is the average stars × 2')}
      </div>
    </div>
  );
}

// Miniatura desfocada da foto do login (aparece instantaneamente enquanto a foto carrega)
const FOTO_LOGIN_MINI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAASACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCaPUbgYEZGQM4NTG7uWiMm8AjrkVmL9nk8vhdq8kZ6j04q7PseNjDGAEToCalTZTgTJrMuEH7pifapX1h85KRkLwcE1hPImGWRAQDwVGCKjjRRtZGk2nkFj2qucSgu5BpnzBs8/N3rY08f6Qo7Ef0oorOOwkUvESKqLhQOR0FUYeBgdKKKHsaR3P/Z';

// Ícones da barra lateral (traço fino, por secção)
const NAV_ICON: Record<string, string> = {
  overview: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z',
  observatorio: 'M4 20V10M10 20V4M16 20v-7M2 20h20',
  produtos: 'M2 5h7a3 3 0 013 3v13a2 2 0 00-2-2H2zM22 5h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z',
  locais: 'M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  mapa: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  comparar: 'M4 5h6v14H4zM14 5h6v14h-6z',
  benchmark: 'M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 006 0L5 7zm14 0l-3 7a3 3 0 006 0l-3-7z',
  mercados: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  problemas: 'M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  relatorio: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [lang, setLang] = useState<Lang>('pt');
  const [view, setView] = useState<ViewType>('overview');
  const [selId, setSelId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filterCat, setFilterCat] = useState('Todos');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [newLoc, setNewLoc] = useState({ name: '', category: CATEGORIES[0], platform: PLATFORMS[0], lat: '', lng: '', googleRating: '', googleReviewCount: '' });
  const [reviewText, setReviewText] = useState('');
  // Importação de comentários (ficheiro exportado do Google Maps)
  const [showImport, setShowImport] = useState(false);
  const [impGroups, setImpGroups] = useState<(ImportGroup & { target: string })[]>([]);
  const [impBusy, setImpBusy] = useState(false);
  const [impMsg, setImpMsg] = useState<string | null>(null);
  const [impAfluencia, setImpAfluencia] = useState<Afluencia | null>(null);
  const [impAtributos, setImpAtributos] = useState<Atributos | null>(null);
  const [batchRun, setBatchRun] = useState<{ i: number; total: number; name: string } | null>(null);
  const [fotoBraga, setFotoBraga] = useState<string | null>(null);
  // Seta para voltar ao topo (aparece quando se desce na página)
  const [verTopo, setVerTopo] = useState(false);
  // Modo público vs administração: o servidor diz se há sessão; o Firebase confirma a autenticação para gravar
  const [sessao, setSessao] = useState<{ admin: boolean; protecao: boolean } | null>(null);
  const [fbSessao, setFbSessao] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/sessao', { cache: 'no-store' }).then((r) => r.json()).then((d) => setSessao({ admin: !!d.admin, protecao: !!d.protecao })).catch(() => setSessao({ admin: false, protecao: true }));
    const a = obterAuth();
    if (!a) { setFbSessao(false); return; } // autenticação indisponível (ex.: chave do Firebase em falta)
    const parar = onAuthStateChanged(a, (u) => setFbSessao(!!u));
    return () => parar();
  }, []);
  const admin = !!sessao?.admin;
  const sessaoFirebaseEmFalta = admin && !!sessao?.protecao && !!process.env.NEXT_PUBLIC_ADMIN_EMAIL && fbSessao === false;
  const sair = async () => {
    try { await fetch('/api/sair', { method: 'POST' }); } catch { /* segue */ }
    try { const a = obterAuth(); if (a) await signOut(a); } catch { /* segue */ }
    window.location.href = '/';
  };
  const voltarAEntrar = async () => {
    try { await fetch('/api/sair', { method: 'POST' }); } catch { /* segue */ }
    window.location.href = '/login';
  };
  useEffect(() => { const f = () => setVerTopo(window.scrollY > 700); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { let vivo = true; obterFotoBraga().then((f) => { if (vivo) setFotoBraga(f); }); return () => { vivo = false; }; }, []);
  // Fotografia do Posto de Turismo para o topo do Observatório
  const [fotoPosto, setFotoPosto] = useState<string | null>(null);
  const postoId = locations.find((l) => /posto de turismo/i.test(l.name))?.id;
  useEffect(() => {
    if (!postoId) return;
    let vivo = true;
    getDoc(doc(db, 'locationPhotos', postoId)).then((d) => { if (vivo && d.exists()) setFotoPosto((d.data() as any).data || null); }).catch(() => {});
    return () => { vivo = false; };
  }, [postoId]);
  // Ao abrir um local ou mudar de vista, a página começa sempre no topo
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [view, detailId]);
  const [importMode, setImportMode] = useState<'texto' | 'csv'>('texto');
  const [csvHasHeader, setCsvHasHeader] = useState(true);
  const [csvCol, setCsvCol] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [publicMode, setPublicMode] = useState(false);
  const [cameFromApp, setCameFromApp] = useState(false);
  const [reportLocId, setReportLocId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [genReport, setGenReport] = useState(false);
  const [, setTransVer] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const locationsRef = useRef<Location[]>([]);

  // Keep ref in sync with locations for use in stale closures
  useEffect(() => { locationsRef.current = locations; }, [locations]);

  // Re-render quando uma tradução on-the-fly do conteúdo IA fica pronta
  useEffect(() => { setTransNotify(() => setTransVer((v) => v + 1)); }, []);

  // Premium typography + global polish (injected once, no dependency)
  useEffect(() => {
    if (document.getElementById('rb-premium-style')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.id = 'rb-premium-style';
    style.textContent = `
      :root { --rb-display: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; --rb-body: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; }
      body { font-family: var(--rb-body); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; letter-spacing: -0.005em; }
      h1, .rb-display { font-family: var(--rb-display); font-optical-sizing: auto; }
      h1 { letter-spacing: -0.02em !important; }
      ::selection { background: rgba(138,176,230,0.28); color: #fff; }
      *:focus-visible { outline: 2px solid rgba(138,176,230,0.7); outline-offset: 2px; border-radius: 4px; }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #2a2e3d; border-radius: 8px; border: 2px solid #0c0e14; }
      ::-webkit-scrollbar-thumb:hover { background: #3a3f52; }
      .rb-nav { transition: background .2s ease, color .2s ease; }
      .rbs-foto { position: absolute; inset: -30px; background-size: cover; background-position: center; opacity: .38; animation: rbsKb 24s ease-in-out infinite alternate; }
      @keyframes rbsKb { from { transform: scale(1.05); } to { transform: scale(1.18) translate(-12px, 8px); } }
      .rbs-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,18,21,.35) 0%, rgba(16,18,21,.78) 60%, #101215 100%); }
      .rbs-indice { transition: transform .2s ease, border-color .2s ease, background .2s ease; }
      .rbs-indice:hover { transform: translateY(-1px); border-color: rgba(138,176,230,.45) !important; background: rgba(28,31,36,.72) !important; }
      .rbs-arco { animation: rbsArco 1.6s cubic-bezier(.2,.7,.2,1) .3s both; filter: drop-shadow(0 0 6px rgba(138,176,230,.45)); }
      @keyframes rbsArco { from { stroke-dasharray: 0 100; } }
      .rb-splash-foto { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: .5; animation: rbsKb 18s ease-in-out infinite alternate; }
      .rb-nav:hover { background: rgba(255,255,255,0.04) !important; color: #d8d7d2 !important; }
      .rb-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .rb-card:hover { border-color: rgba(138,176,230,0.35) !important; box-shadow: 0 18px 50px -22px rgba(0,0,0,0.75); }
      @keyframes rbFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes rbPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      @keyframes rbShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }
      @media (max-width: 820px) {
        .rb-app { flex-direction: column !important; }
        .rb-sidebar { position: static !important; width: 100% !important; bottom: auto !important; border-right: none !important; border-bottom: 1px solid #1a1d28 !important; }
        .rb-sidebar > div:first-child { padding: 14px 16px !important; }
        .rb-sidebar > div:first-child > img { height: 44px !important; }
        .rb-sidebar nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 4px !important; padding: 8px !important; -webkit-overflow-scrolling: touch; }
        .rb-nav { width: auto !important; flex: 0 0 auto !important; white-space: nowrap !important; margin-bottom: 0 !important; }
        .rbs-top { padding: 12px 16px 12px !important; }
        .rbs-inner { display: grid !important; grid-template-columns: 1fr auto; align-items: center; gap: 10px 14px; }
        .rbs-inner > img { height: 30px !important; }
        .rbs-sub { display: none !important; }
        .rbs-indice { margin: 0 !important; padding: 8px 12px !important; width: auto !important; }
        .rbs-indice > div { gap: 10px !important; }
        .rbs-indice .rbs-anel { width: 48px !important; height: 48px !important; }
        .rbs-indice .rbs-big { font-size: 15px !important; }
        .rbs-indice .rbs-de10, .rbs-indice .rbs-det { display: none !important; }
        .rbs-indice .rbs-lab { font-size: 10px !important; }
        .rbs-indice .rbs-media { font-size: 15px !important; margin-top: 2px !important; }
        .rbs-lang { grid-column: 1 / -1; margin-top: 0 !important; }
        .rbs-foot { display: none !important; }
        .rb-main { margin-left: 0 !important; }
        .rb-main > :not(.rbx) [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        .rb-main [style*="padding: 28px 30px"] { padding: 18px 16px !important; }
      }
    `;
    if (!document.getElementById('rb-public-sans')) {
      const lk = document.createElement('link');
      lk.id = 'rb-public-sans'; lk.rel = 'stylesheet';
      lk.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(lk);
    }
    document.head.appendChild(style);
  }, []);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Load from Firestore ──
  useEffect(() => {
    const t0 = Date.now();
    const MIN_SPLASH = 1600; // tempo mínimo de ecrã de entrada (ms)
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'locations'));
        const locs: Location[] = [];
        snap.forEach((d) => {
          const loc = d.data() as Location;
          loc.reviews = (loc.reviews || []).map((r: any, i: number) => ({
            id: r.id || `${loc.id}_rev_${i}`,
            text: typeof r === 'string' ? r : r.text || '',
            addedAt: r.addedAt || new Date().toISOString(),
          }));
          locs.push(loc);
        });
        setLocations(locs);
      } catch (e) {
        console.error('Firestore load error:', e);
      }
      const elapsed = Date.now() - t0;
      setTimeout(() => setLoading(false), Math.max(0, MIN_SPLASH - elapsed));
    })();
  }, []);

  // ── Idioma (PT/EN) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('rb-lang');
    const initial: Lang = saved === 'en' ? 'en' : 'pt';
    setLang(initial);
    setLangGlobal(initial);
    document.documentElement.lang = initial === 'en' ? 'en' : 'pt-PT';
  }, []);
  const changeLang = (l: Lang) => {
    setLang(l);
    setLangGlobal(l);
    if (typeof document !== 'undefined') document.documentElement.lang = l === 'en' ? 'en' : 'pt-PT';
    if (typeof window !== 'undefined') localStorage.setItem('rb-lang', l);
  };

  // ── Check URL for public report mode (+ reage ao botão voltar do browser/telemóvel) ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyFromUrl = () => {
      const reportId = new URLSearchParams(window.location.search).get('r');
      if (reportId) {
        setPublicMode(true);
        setDetailId(reportId);
        setView('detalhe');
      } else {
        setPublicMode(false);
      }
    };
    applyFromUrl();
    window.addEventListener('popstate', applyFromUrl);
    return () => window.removeEventListener('popstate', applyFromUrl);
  }, []);

  // ── Save ──
  const save = useCallback(async (locs: Location[]) => {
    setLocations(locs);
    try {
      for (const loc of locs) await setDoc(doc(db, 'locations', loc.id), semIndefinidos(loc));
    } catch (e: any) {
      console.error('Firestore save error:', e);
      setError(t('Erro ao gravar na base de dados: ', 'Error saving to the database: ') + (e?.message || ''));
    }
  }, []);

  const addLocation = () => {
    if (!newLoc.name.trim()) return;
    const manualCoords = newLoc.lat && newLoc.lng
      ? [parseFloat(newLoc.lat), parseFloat(newLoc.lng)] as [number, number]
      : null;
    const loc: Location = {
      id: Date.now().toString(),
      name: newLoc.name.trim(),
      category: newLoc.category,
      platform: newLoc.platform,
      reviews: [],
      analysis: null,
      lastAnalyzed: null,
      coords: manualCoords || getKnownCoords(newLoc.name) || undefined,
      googleRating: newLoc.googleRating ? parseFloat(newLoc.googleRating) : undefined,
      googleReviewCount: newLoc.googleReviewCount ? parseInt(newLoc.googleReviewCount.replace(/\D/g, ''), 10) : undefined,
    };
    save([...locations, loc]);
    setNewLoc({ name: '', category: CATEGORIES[0], platform: PLATFORMS[0], lat: '', lng: '', googleRating: '', googleReviewCount: '' });
    setShowAdd(false);
    showToast(`✓ ${loc.name} adicionado`);
  };

  const startEdit = (loc: Location) => {
    setEditId(loc.id);
    setNewLoc({
      name: loc.name,
      category: loc.category,
      platform: loc.platform,
      lat: loc.coords ? String(loc.coords[0]) : '',
      lng: loc.coords ? String(loc.coords[1]) : '',
      googleRating: loc.googleRating != null ? String(loc.googleRating) : '',
      googleReviewCount: loc.googleReviewCount != null ? String(loc.googleReviewCount) : '',
    });
    setShowEdit(true);
  };

  const updateLocation = () => {
    if (!newLoc.name.trim() || !editId) return;
    const manualCoords = newLoc.lat && newLoc.lng
      ? [parseFloat(newLoc.lat), parseFloat(newLoc.lng)] as [number, number]
      : undefined;
    save(locations.map((l) =>
      l.id === editId
        ? {
            ...l,
            name: newLoc.name.trim(),
            category: newLoc.category,
            platform: newLoc.platform,
            coords: manualCoords || l.coords,
            googleRating: newLoc.googleRating ? parseFloat(newLoc.googleRating) : undefined,
            googleReviewCount: newLoc.googleReviewCount ? parseInt(newLoc.googleReviewCount.replace(/\D/g, ''), 10) : undefined,
          }
        : l
    ));
    setShowEdit(false);
    setEditId(null);
    setNewLoc({ name: '', category: CATEGORIES[0], platform: PLATFORMS[0], lat: '', lng: '', googleRating: '', googleReviewCount: '' });
    showToast('✓ Local atualizado');
  };

  const deleteLoc = async (id: string) => {
    try { await deleteLocationReviews(id); } catch {}
    try { await deleteDoc(doc(db, 'locations', id)); } catch {}
    setLocations((prev) => prev.filter((l) => l.id !== id));
    if (selId === id) setSelId(null);
    if (detailId === id) { setDetailId(null); setView('locais'); }
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
  };

  const addReviews = () => {
    if (!reviewText.trim() || !selId) return;
    let parts: string[] = [];
    if (importMode === 'csv') {
      const rows = parseCSV(reviewText);
      const body = csvHasHeader ? rows.slice(1) : rows;
      const col = csvCol ?? suggestTextColumn(body);
      parts = body.map((r) => (r[col] || '').trim()).filter(Boolean);
    } else {
      parts = splitReviewText(reviewText);
    }
    if (!parts.length) return;
    const newRevs: Review[] = parts.map((text) => ({
      id: `rev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text,
      addedAt: new Date().toISOString(),
    }));
    save(locations.map((l) =>
      l.id === selId ? { ...l, reviews: [...l.reviews, ...newRevs] } : l
    ));
    setReviewText('');
    setCsvCol(null);
    setShowReview(false);
    showToast(`✓ ${newRevs.length} review${newRevs.length !== 1 ? 's' : ''} importada${newRevs.length !== 1 ? 's' : ''}`);
  };

  const deleteReview = (locId: string, reviewId: string) => {
    save(locations.map((l) =>
      l.id === locId ? { ...l, reviews: l.reviews.filter((r) => r.id !== reviewId) } : l
    ));
  };

  // ── Relatório mensal executivo escrito por IA ──
  const generateAIReport = async () => {
    if (analyzed.length === 0) return;
    setGenReport(true); setError(null); setAiReport(null);
    try {
      const sorted = sortedAnalyzed;
      const avg = (destino ? destino.idx : analyzed.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / analyzed.length).toFixed(1);
      const top = sorted.slice(0, 5).map((l) => `${l.name} (${l.analysis!.sentimentScore}/10)`);
      const bottom = [...sorted].reverse().slice(0, 5).map((l) => `${l.name} (${l.analysis!.sentimentScore}/10)`);
      const rowsP = analyzed.map((l) => ({ loc: l, probs: classifyProblems(l) })).filter((x) => Object.keys(x.probs).length > 0);
      const probAgg = PROBLEM_TAXONOMY
        .map((p) => ({ label: p.label, affected: rowsP.filter((x) => x.probs[p.id]).length }))
        .filter((p) => p.affected > 0).sort((a, b) => b.affected - a.affected).slice(0, 6);
      const problemas = probAgg.map((p) => `${p.label}: ${p.affected} ${t(p.affected === 1 ? 'local' : 'locais', p.affected === 1 ? 'place' : 'places')}`);
      const div = analyzed.filter((l) => l.googleRating != null && l.analysis)
        .map((l) => `${l.name}: IA ${l.analysis!.sentimentScore}/10 vs Google ${l.googleRating} (${l.googleReviewCount || '?'} reviews)`).slice(0, 8);
      const mesAno = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { month: 'long', year: 'numeric' });

      const prompt = t(`És analista de turismo do Município de Braga. Escreve o RELATÓRIO MENSAL DE REPUTAÇÃO TURÍSTICA referente a ${mesAno}, em português de Portugal (pt-PT), com tom institucional mas claro e útil.

DADOS REAIS (${analyzed.length} locais monitorizados; score médio de sentimento ${avg}/10):
- Melhor reputação: ${top.join('; ')}
- A acompanhar (reputação mais baixa): ${bottom.join('; ')}
- Problemas transversais mais frequentes nas críticas: ${problemas.join('; ') || 'nenhum relevante este período'}
- Reputação IA vs nota Google: ${div.join('; ') || 'sem dados de Google introduzidos'}

ESTRUTURA OBRIGATÓRIA - usa exatamente estes títulos, cada um numa linha começada por "## ":
## Sumário Executivo
## Destaques do Período
## Locais a Acompanhar
## Problemas Transversais
## Recomendações de Monitorização
## Nota Metodológica

REGRAS:
- Texto corrido em parágrafos; usa bullets "- " só quando ajudar a ler.
- A equipa MONITORIZA a reputação; as recomendações são de acompanhamento e sinalização, não de execução de obras.
- NÃO inventes números nem locais para além dos fornecidos.
- Na Nota Metodológica explica que a análise assenta em reviews públicas processadas por IA e em classificação automática de problemas.
- Máximo ~600 palavras. Sem tabelas, sem backticks, sem markdown além de ## e bullets "- ".`, `You are a tourism analyst for the Municipality of Braga. Write the MONTHLY TOURISM REPUTATION REPORT for ${mesAno}, in international English, with an institutional but clear and useful tone.

REAL DATA (${analyzed.length} monitored places; average sentiment score ${avg}/10):
- Best reputation: ${top.join('; ')}
- To monitor (lowest reputation): ${bottom.join('; ')}
- Most frequent cross-cutting issues in reviews: ${problemas.join('; ') || 'none relevant this period'}
- AI reputation vs Google rating: ${div.join('; ') || 'no Google data entered'}

MANDATORY STRUCTURE - use exactly these titles, each on a line starting with "## ":
## Executive Summary
## Highlights of the Period
## Places to Monitor
## Cross-cutting Issues
## Monitoring Recommendations
## Methodological Note

RULES:
- Flowing text in paragraphs; use bullets "- " only when it helps readability.
- The team MONITORS reputation; recommendations are about follow-up and flagging, not about carrying out works.
- Do NOT invent numbers or places beyond those provided.
- In the Methodological Note, explain that the analysis is based on public reviews processed by AI and automatic problem classification.
- Maximum ~600 words. No tables, no backticks, no markdown beyond ## and bullets "- ".`);

      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) { const e = await res.text(); throw new Error(`HTTP ${res.status} - ${e.slice(0, 200)}`); }
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content?.trim() || '';
      if (!txt) throw new Error(t('Resposta vazia da IA.', 'Empty response from AI.'));
      setAiReport(txt);
      showToast(t('✓ Relatório mensal gerado', '✓ Monthly report generated'));
    } catch (e: any) {
      setError(t(`Erro ao gerar relatório: ${e?.message || 'desconhecido'}`, `Error generating report: ${e?.message || 'unknown'}`));
    } finally {
      setGenReport(false);
    }
  };

  const exportReportPDF = () => {
    if (!aiReport) { alert(t('Gera primeiro o relatório.', 'Generate the report first.')); return; }
    const win = window.open('', '_blank', 'width=1100,height=860');
    if (!win) { alert(t('Permita pop-ups para exportar o PDF.', 'Allow pop-ups to export the PDF.')); return; }
    const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: '2-digit', month: 'long', year: 'numeric' });
    const mesAno = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { month: 'long', year: 'numeric' });
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Parse do texto da IA (## títulos, - bullets, parágrafos)
    let bodyHtml = ''; let inList = false;
    aiReport.split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line) { if (inList) { bodyHtml += '</ul>'; inList = false; } return; }
      if (line.startsWith('## ') || line.startsWith('# ')) {
        if (inList) { bodyHtml += '</ul>'; inList = false; }
        bodyHtml += '<h2>' + esc(line.replace(/^#+\s*/, '')) + '</h2>';
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        if (!inList) { bodyHtml += '<ul>'; inList = true; }
        bodyHtml += '<li>' + esc(line.slice(2)) + '</li>';
      } else {
        if (inList) { bodyHtml += '</ul>'; inList = false; }
        bodyHtml += '<p>' + esc(line) + '</p>';
      }
    });
    if (inList) bodyHtml += '</ul>';
    const kpis: [string, string][] = [
      [t('Score Global', 'Overall Score'), (avgScore ?? 0).toFixed(1) + ' / 10'],
      [t('Locais analisados', 'Places analysed'), String(analyzed.length)],
      [t('Reviews processadas', 'Reviews processed'), totalReviews.toLocaleString(t('pt-PT', 'en-GB'))],
      [t('Problemas detetados', 'Issues detected'), String(allIssues.length)],
      [t('Mercados emissores', 'Source markets'), String(Array.from(new Set(allMarkets)).length)],
    ];
    const kpiHtml = kpis.map(([l, v]) => `<div class="kpi"><div class="kv">${v}</div><div class="kl">${l}</div></div>`).join('');
    const html = `<!DOCTYPE html><html lang="${t('pt', 'en')}"><head><meta charset="utf-8">
<title>${t('Relatório de Reputação Turística', 'Tourism Reputation Report')} - ${mesAno}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{--ink:#1f232c;--ink2:#3a3f4b;--muted:#7c8190;--gold:#3E6FB0;--goldL:#8AB0E6;--paper:#ffffff;--band:#14171d;--line:#e7e3d8;--tint:#faf8f3;}
  html,body{background:#e9e9ec;}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{background:var(--paper);width:210mm;min-height:297mm;margin:0 auto;display:flex;flex-direction:column;box-shadow:0 4px 30px rgba(0,0,0,.18);}
  .band{background:var(--band);padding:26px 32px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--goldL);}
  .band img{height:36px;width:auto;}
  .band .t{text-align:right;}
  .band .eyebrow{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--goldL);margin-bottom:7px;}
  .band h1{font-family:'Public Sans',system-ui,sans-serif;font-weight:600;font-size:22px;color:#fff;letter-spacing:-.01em;line-height:1.1;}
  .band .sub{font-size:11px;color:#9aa0ad;margin-top:6px;}
  .kpis{display:flex;gap:10px;padding:22px 32px 6px;}
  .kpi{flex:1;background:var(--tint);border:1px solid var(--line);border-radius:10px;padding:14px 15px;}
  .kv{font-family:'Public Sans',system-ui,sans-serif;font-weight:600;font-size:20px;color:var(--ink);line-height:1;}
  .kl{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:8px;}
  .content{flex:1;padding:18px 36px 30px;}
  .content h2{font-family:'Public Sans',system-ui,sans-serif;font-weight:600;font-size:15px;color:var(--ink);margin:24px 0 6px;padding-bottom:7px;position:relative;break-after:avoid;}
  .content h2:after{content:'';position:absolute;left:0;bottom:0;width:34px;height:2px;background:var(--goldL);}
  .content h2:first-child{margin-top:6px;}
  .content p{font-size:11pt;line-height:1.62;color:var(--ink2);margin:9px 0;}
  .content ul{list-style:none;margin:9px 0;padding:0;}
  .content li{font-size:11pt;line-height:1.55;color:var(--ink2);padding-left:18px;position:relative;margin:6px 0;}
  .content li:before{content:'';position:absolute;left:2px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--gold);}
  .foot{padding:12px 32px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:8.5px;color:var(--muted);}
  @page{size:A4;margin:0;}
  @media print{html,body{background:#fff;}.sheet{margin:0;box-shadow:none;}}
</style></head><body>
<div class="sheet">
  <div class="band">
    <img src="${LOGO_URL}" alt="Visit Braga">
    <div class="t"><div class="eyebrow">${t('Município de Braga · Observatório', 'Municipality of Braga · Observatory')}</div><h1>${t('Relatório de Reputação Turística', 'Tourism Reputation Report')}</h1><div class="sub">${mesAno} · ${t('gerado em', 'generated on')} ${hoje}</div></div>
  </div>
  <div class="kpis">${kpiHtml}</div>
  <div class="content">${bodyHtml}</div>
  <div class="foot"><span>${t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}</span><span>${t('Análise assistida por IA · dados de reputação pública', 'AI-assisted analysis · public reputation data')}</span></div>
</div>
<script>setTimeout(function(){window.focus();window.print();},800);</script>
</body></html>`;
    win.document.open(); win.document.write(html); win.document.close();
  };

  // ── Importação de comentários (JSON/CSV exportado, ex.: Apify) ──
  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setImpMsg(null); setImpGroups([]); setImpAfluencia(null); setImpAtributos(null);
    try {
      const texto = await f.text();
      let jInfo: any = null;
      try { const j = JSON.parse(texto); if (j && !Array.isArray(j)) jInfo = j; } catch { /* CSV ou formato antigo */ }
      const aflu = jInfo?.afluencia && Array.isArray(jInfo.afluencia.dias) ? (jInfo.afluencia as Afluencia) : null;
      const atri = jInfo?.atributos && (Array.isArray(jInfo.atributos.secoes) || jInfo.atributos.horario) ? (jInfo.atributos as Atributos) : null;
      setImpAfluencia(aflu); setImpAtributos(atri);
      const { reviews, skipped } = parseReviewFile(texto);
      // Modo rápido do extrator: só afluência e informação do local (os comentários e a análise não são tocados)
      if (!reviews.length && (aflu || atri) && jInfo?.placeName) {
        const g0: any = { key: String(jInfo.placeName), title: String(jInfo.placeName), reviews: [], inWindow: 0, outWindow: 0, from: '', to: '', avg: 0 };
        setImpGroups([{ ...g0, target: suggestMatch(g0, locations) }]);
        setImpMsg(t(`Modo rápido: ${aflu ? 'afluência' : ''}${aflu && atri ? ' e ' : ''}${atri ? 'informação do local' : ''} de "${jInfo.placeName}". Confirma o local e clica em Importar. Os comentários e a análise não são alterados.`, `Quick mode: ${aflu ? 'busyness' : ''}${aflu && atri ? ' and ' : ''}${atri ? 'place information' : ''} for "${jInfo.placeName}". Confirm the place and click Import. Reviews and analysis are not changed.`));
        return;
      }
      if (!reviews.length) {
        setImpMsg(t('Não encontrei comentários válidos. Cada linha precisa de data e de estrelas.', 'No valid reviews found. Each row needs a date and a star rating.'));
        return;
      }
      const groups = groupByPlace(reviews).map((g) => ({ ...g, target: suggestMatch(g, locations) }));
      setImpGroups(groups);
      setImpMsg(t(
        `${reviews.length} comentários lidos em ${groups.length} ${groups.length === 1 ? 'local' : 'locais'}${skipped ? ` · ${skipped} linhas ignoradas (sem data ou estrelas)` : ''}. Confirma a correspondência de cada local e clica em Importar.`,
        `${reviews.length} reviews read across ${groups.length} ${groups.length === 1 ? 'place' : 'places'}${skipped ? ` · ${skipped} rows ignored (no date or stars)` : ''}. Check each place match and click Import.`));
    } catch (err: any) {
      setImpMsg(t('Erro ao ler o ficheiro: ', 'Error reading the file: ') + (err?.message || ''));
    }
  };

  const confirmImport = async () => {
    const todo = impGroups.filter((g) => g.target);
    if (!todo.length) return;
    setImpBusy(true);
    const lines: string[] = [];
    try {
      for (const g of todo) {
        let locId = g.target;
        if (locId === '__new__') {
          const coords = getKnownCoords(g.title);
          const nl: Location = {
            id: `${Date.now()}${Math.floor(Math.random() * 1000)}`, name: g.title, category: 'Monumento', platform: 'Google Maps',
            reviews: [], analysis: null, lastAnalyzed: null, ...(coords ? { coords } : {}),
          };
          await setDoc(doc(db, 'locations', nl.id), nl);
          setLocations((prev) => [...prev, nl]);
          locId = nl.id;
        }
        const extra: Partial<Location> = {};
        if (impAfluencia && todo.length === 1) extra.afluencia = JSON.parse(JSON.stringify(impAfluencia));
        if (impAtributos && todo.length === 1) extra.atributos = JSON.parse(JSON.stringify(impAtributos));
        if (!g.reviews.length) {
          // só informação do local: não toca nos comentários nem na análise
          const alvo0 = locations.find((l) => l.id === locId);
          if (alvo0 && Object.keys(extra).length) {
            await gravarLocal(alvo0, extra);
            setLocations((prev) => prev.map((l) => (l.id === locId ? { ...l, ...extra } : l)));
            lines.push(`${g.title}: ${t('informação atualizada', 'information updated')}`);
          }
          continue;
        }
        setImpMsg(t(`A importar ${g.title}…`, `Importing ${g.title}…`));
        const res = await importIntoLocation(locId, g);
        const stats = JSON.parse(JSON.stringify(res.stats));
        const alvo = locations.find((l) => l.id === locId) || ({ id: locId, name: g.title, category: 'Monumento', platform: 'Google Maps', reviews: [], analysis: null, lastAnalyzed: null } as Location);
        await gravarLocal(alvo, { reviewStats: stats, reviews: [], ...extra });
        setLocations((prev) => prev.map((l) => (l.id === locId ? { ...l, reviewStats: stats, reviews: [], ...extra } : l)));
        lines.push(`${g.title}: +${res.added} ${t('novos', 'new')}${res.dup ? `, ${res.dup} ${t('já existiam', 'already existed')}` : ''}${res.removedOld ? `, ${res.removedOld} ${t('removidos (mais de 3 anos)', 'removed (over 3 years)')}` : ''}`);
      }
      setImpGroups([]);
      setImpMsg('✓ ' + lines.join(' · '));
      showToast(todo.some((g) => g.reviews.length) ? t('✓ Comentários importados — falta analisar com IA', '✓ Reviews imported — now run the AI analysis') : t('✓ Informação do local atualizada', '✓ Place information updated'));
    } catch (err: any) {
      setImpMsg(t('Erro na importação: ', 'Import error: ') + (err?.message || '') + (lines.length ? ` · ${t('já gravado', 'already saved')}: ${lines.join(' · ')}` : ''));
    } finally {
      setImpBusy(false);
    }
  };

  // ── Análise com comentários importados: pontuação = estrelas reais; IA = temas ──
  const analyzeImported = async (loc: Location): Promise<boolean> => {
    setAnalyzing(loc.id);
    setError(null);
    try {
      // 1) Estatísticas reconstruídas (regra "Sem texto") — fonte única de todos os números
      showToast(t(`A preparar ${loc.name}…`, `Preparing ${loc.name}…`));
      const st0 = loc.reviewStats!;
      const stats = semIndefinidos(await rebuildStats(loc.id, { placeId: st0.placeId, placeTitle: st0.placeTitle, source: st0.source })) as ReviewStats;
      stats.lastImport = st0.lastImport;
      let all = await loadWindowReviews(loc.id);
      if (!all.length) throw new Error(t('Sem comentários com menos de 3 anos. Importa primeiro os comentários.', 'No reviews under 3 years old. Import the reviews first.'));

      // 2) Classificar por temas fixos os comentários com texto ainda não classificados
      const porClassificar = all.filter((r) => r.t && r.t.trim().length >= 3 && !r.c);
      const LOTE = 40;
      const listaTemas = TEMAS.map((x) => `${x.id} = ${x.pt} (${x.desc})`).join('\n');
      const tags: Record<string, string[]> = {};
      for (let i = 0; i < porClassificar.length; i += LOTE) {
        const lote = porClassificar.slice(i, i + LOTE);
        showToast(t(`${loc.name}: a classificar ${i + 1}–${i + lote.length} de ${porClassificar.length} comentários…`, `${loc.name}: classifying ${i + 1}–${i + lote.length} of ${porClassificar.length} reviews…`));
        const raw = await groqChat([{ role: 'user', content:
`Classifica comentários do Google Maps sobre um local turístico de Braga nos temas abaixo.
Para cada comentário, indica de 0 a 3 temas referidos, cada um seguido de + (elogio) ou - (crítica). Se não refere nenhum tema, devolve lista vazia.

Temas:
${listaTemas}

Responde APENAS com JSON: {"r":[{"i":0,"t":["paisagem+","acesso-"]}]} — um item por comentário, com o mesmo número "i".

Comentários:
${lote.map((r, k) => `${k}. [${r.s}★] ${r.t.replace(/\s+/g, ' ').slice(0, 400)}`).join('\n')}` }], true);
        const j = parseJSONLoose(raw);
        const itens: any[] = Array.isArray(j?.r) ? j.r : [];
        lote.forEach((r, k) => {
          const it = itens.find((z: any) => Number(z?.i) === k);
          tags[r.id] = Array.isArray(it?.t) ? it.t.filter((x: any) => typeof x === 'string' && tagValida(x)).slice(0, 3) : [];
        });
        if (i + LOTE < porClassificar.length) await sleep(4000);
      }
      if (Object.keys(tags).length) {
        showToast(t(`${loc.name}: a guardar temas…`, `${loc.name}: saving themes…`));
        await saveTags(loc.id, tags);
        all = all.map((r) => (tags[r.id] ? { ...r, tg: tags[r.id], c: 1 } : r));
      }

      // 3) Estado de cada tema — calculado, não escrito pela IA
      const { temas, textRec, textPrev } = temaStats(all);
      const ativos = temas.filter((z) => z.estado);

      // 4) Números calculados (os mesmos que aparecem no topo da ficha)
      const locAtual = { ...loc, reviewStats: stats };
      const x = numeros(locAtual)!;
      const rk = ranking(locations.map((l) => (l.id === loc.id ? locAtual : l)));
      const pos = rk.findIndex((r) => r.id === loc.id) + 1;
      const f = (v: number, d: number) => v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });
      const numerosTxt = [
        `avaliações: ${f(x.n, 0)}`, `média: ${f(x.avg, 2)} estrelas`, `índice: ${f(x.idx, 1)}/10`, `positivas: ${f(x.pos, 1)}%`, `negativas: ${f(x.neg, 1)}%`,
        `avaliações só com estrelas (sem texto): ${f(x.semTexto, 1)}%`,
      ].filter(Boolean).join('\n');
      const temasTxt = ativos.map((z) => {
        const ex = excertos(all, z.id, z.estado === 'forte' ? '+' : '-');
        return `- ${z.id} (${TEMAS.find((y) => y.id === z.id)!.pt}) — estado: ${z.estado}${ex.length ? `\n  excertos: ${ex.map((e) => `"${e}"`).join(' | ')}` : ''}`;
      }).join('\n') || '(nenhum tema com expressão suficiente)';

      // Leitura por blocos (como na versão original): ~150 comentários equilibrados, separados por período,
      // resumidos bloco a bloco com problemas e elogios concretos e a sua frequência aproximada.
      const { recent, previous } = sampleForAI(all);
      const blocos: { per: 'recente' | 'anterior'; items: StoredReview[] }[] = [];
      for (let i = 0; i < recent.length; i += 30) blocos.push({ per: 'recente', items: recent.slice(i, i + 30) });
      for (let i = 0; i < previous.length; i += 30) blocos.push({ per: 'anterior', items: previous.slice(i, i + 30) });
      const parciais: string[] = [];
      for (let i = 0; i < blocos.length; i++) {
        const b = blocos[i];
        showToast(t(`${loc.name}: a ler comentários ${i + 1}/${blocos.length}…`, `${loc.name}: reading reviews ${i + 1}/${blocos.length}…`));
        const txt = await groqChat([{ role: 'user', content:
`Lê estes comentários do Google Maps sobre "${loc.name}" (${loc.category}, Braga). Período: ${b.per === 'recente' ? 'últimos 12 meses' : 'entre 12 e 36 meses atrás'}. Cada linha: [estrelas · mês] texto (pode estar noutra língua).

Em português europeu, sem markdown, máximo 230 palavras, lista:
PROBLEMAS: cada problema CONCRETO e específico, tal como os visitantes o descrevem (o quê, onde, quando), com a frequência aproximada entre parênteses (ex.: "WC do parque de estacionamento fechados ao domingo (4 comentários)").
ELOGIOS: cada elogio CONCRETO e específico, com a frequência aproximada.
Nada de generalidades como "boa experiência" ou "alguns problemas".

Comentários (${b.items.length}):
${b.items.map((r) => `[${r.s}★ · ${r.d.slice(0, 7)}] ${r.t.replace(/\s+/g, ' ').slice(0, 450)}`).join('\n')}` }]);
        parciais.push(`=== ${b.per === 'recente' ? 'ÚLTIMOS 12 MESES' : 'PERÍODO ANTERIOR (12–36 meses)'} · bloco ${i + 1} ===\n${txt}`);
        if (i < blocos.length - 1) await sleep(6000);
      }
      const parciaisTxt = parciais.join('\n\n') || '(sem comentários com texto)';

      // 5) Síntese: a IA escreve à volta dos números, não os calcula
      showToast(t(`${loc.name}: a escrever a síntese…`, `${loc.name}: writing the summary…`));
      const raw2 = await groqChat([{ role: 'user', content:
`És analista de reputação turística do Município de Braga. Local: "${loc.name}" (${loc.category}).

NÚMEROS (já calculados — usa-os exatamente assim; não calcules nem escrevas outros números; não compares com outros locais nem fales de rankings ou de respostas aos comentários):
${numerosTxt}

TEMAS (estado calculado comparando os últimos 12 meses com os 12–36 meses anteriores: persistente = crítica nos dois períodos; novo = só no recente; deixou = só no anterior; forte = elogio frequente):
${temasTxt}

LEITURA DOS COMENTÁRIOS (resumos por bloco, com problemas e elogios concretos e a frequência aproximada):
${parciaisTxt}

Escreve em português europeu, tom institucional e sóbrio. Responde APENAS com JSON:
{
  "titulo": "frase-conclusão com no máximo 12 palavras e sem números",
  "resumo": "3 a 4 frases que usam os números acima, com os mais importantes entre **asteriscos duplos**",
  "temas": { "<id do tema>": "uma frase sobre o que os visitantes dizem desse tema" },
  "pontosFortes": ["até 6 pontos fortes ESPECÍFICOS, tirados da LEITURA DOS COMENTÁRIOS acima, tal como os visitantes os descrevem (ex.: 'Vista panorâmica sobre Braga ao fim da tarde'), máximo 18 palavras cada, sem percentagens nem contagens"],
  "problemas": ["até 6 problemas ESPECÍFICOS, tirados da LEITURA DOS COMENTÁRIOS acima (ex.: 'Casas de banho do parque fechadas ao fim de semana'), máximo 18 palavras cada, sem percentagens nem contagens"],
  "problemasRecentes": [ { "problema": "problema ESPECÍFICO dos ÚLTIMOS 12 MESES, máximo 12 palavras", "detalhe": "1 a 2 frases com o que os visitantes descrevem: o quê, onde, quando, em que situação", "estado": "novo (não aparecia no período anterior) ou persiste (já aparecia antes)" } ],
  "problemasAnteriores": [ { "problema": "problema ESPECÍFICO do PERÍODO ANTERIOR (12–36 meses), máximo 12 palavras", "detalhe": "1 a 2 frases com o que os visitantes descreviam", "estado": "deixou (já não aparece nos últimos 12 meses) ou persiste (continua a aparecer)" } ],
  "recomendacoes": [ { "titulo": "possível melhoria, em poucas palavras", "texto": "1 a 2 frases: o que os comentários indicam e que diferença poderia fazer" } ]
}
Em problemasRecentes e problemasAnteriores, indica até 6 problemas em cada, do mais para o menos frequente, sem números nem percentagens. Nos pontos fortes e problemas, nada de generalidades (\"boa experiência\", \"alguns problemas\"): cada ponto tem de dizer concretamente o quê e, quando os comentários o indicam, onde ou quando. Ordena do mais referido para o menos referido. As recomendações são exatamente 3 possíveis melhorias que os comentários sugerem. O Município não gere este local: não atribuas responsabilidades nem uses imperativos ou obrigações (nada de "o Município deve", "a entidade gestora tem de", "implementar", "criar"). Escreve de forma neutra e indicativa, por exemplo "Os visitantes valorizariam…", "Poderia ajudar…", "Há margem para…".` }], true);
      const ai = parseJSONLoose(raw2);
      const permitidos = numerosPermitidos(x, [pos, rk.length]);
      const resumo = typeof ai.resumo === 'string' && ai.resumo.trim() && numerosCoerentes(ai.resumo, permitidos)
        ? ai.resumo.trim() : resumoModelo(loc.name, x);
      const titulo = typeof ai.titulo === 'string' && !/\d/.test(ai.titulo) ? ai.titulo.trim() : '';
      const notas: Record<string, any> = ai.temas && typeof ai.temas === 'object' ? ai.temas : {};
      const temasV2 = ativos.map((z) => ({ id: z.id, estado: z.estado, nota: typeof notas[z.id] === 'string' ? notas[z.id] : '', recPos: z.recPos, recNeg: z.recNeg, prevPos: z.prevPos, prevNeg: z.prevNeg }));
      const recs: { titulo: string; texto: string }[] = (Array.isArray(ai.recomendacoes) ? ai.recomendacoes : [])
        .filter((r: any) => r && typeof r.titulo === 'string').slice(0, 3)
        .map((r: any) => ({ titulo: String(r.titulo), texto: typeof r.texto === 'string' ? r.texto : '' }));
      const lista = (v: any): string[] => (Array.isArray(v) ? v.filter((z: any) => typeof z === 'string' && z.trim() && !z.includes('%')).map((z: string) => z.trim()).slice(0, 6) : []);
      const pontosFortes = lista(ai.pontosFortes), problemas = lista(ai.problemas);
      const periodo = (v: any, estados: string[]) => (Array.isArray(v) ? v : [])
        .filter((z: any) => z && typeof z.problema === 'string' && z.problema.trim()).slice(0, 6)
        .map((z: any) => ({ problema: String(z.problema).trim(), detalhe: typeof z.detalhe === 'string' ? z.detalhe.trim() : '', estado: estados.find((e) => String(z.estado || '').toLowerCase().startsWith(e)) || estados[0] }));
      const perRec = periodo(ai.problemasRecentes, ['novo', 'persiste']);
      const perAnt = periodo(ai.problemasAnteriores, ['deixou', 'persiste']);

      // 6) Análise — mantém os campos antigos para Comparar, Problemas, Relatório e Mapa
      const nomeTema = (id: string) => TEMAS.find((y) => y.id === id)!.pt;
      const comEstado = (e: string[]) => temasV2.filter((z) => e.includes(String(z.estado)));
      const ws = windowStats(stats)!;
      // Dimensões 0–10: elogios vs críticas nos temas correspondentes, estabilizadas pela proporção geral
      // de avaliações positivas (evita 10/10 com duas menções). Experiência = índice global do local.
      const r0 = ws.pos / Math.max(1, ws.pos + ws.neg);
      const dims: Record<string, number> = {};
      const dimsN: Record<string, number> = {};
      ([['localizacao', ['paisagem', 'acesso']], ['servico', ['atendimento', 'servicos']], ['precoQualidade', ['preco']], ['limpeza', ['limpeza']], ['acessibilidade', ['acessibilidade']]] as [string, string[]][])
        .forEach(([k, ids]) => {
          let p = 0, n = 0;
          ids.forEach((id) => { const z = temas.find((y) => y.id === id)!; p += z.recPos + z.prevPos; n += z.recNeg + z.prevNeg; });
          dimsN[k] = p + n;
          if (p + n >= 3) dims[k] = Math.round(((10 * (p + 5 * r0)) / (p + n + 5)) * 10) / 10;
        });
      dims.experiencia = x.idx; dimsN.experiencia = x.n;
      const analysis: Analysis = {
        sentimentScore: x.idx,
        sentimentBreakdown: { positive: ws.pos, neutral: ws.neu, negative: ws.neg },
        topThemesPositive: comEstado(['forte']).map((z) => nomeTema(z.id)),
        topThemesNegative: comEstado(['persistente', 'novo']).map((z) => nomeTema(z.id)),
        keyIssues: problemas.length ? problemas : comEstado(['persistente', 'novo']).map((z) => z.nota || nomeTema(z.id)),
        keyPraises: pontosFortes.length ? pontosFortes : comEstado(['forte']).map((z) => z.nota || nomeTema(z.id)),
        actionableInsights: recs.map((r) => (r.texto ? `${r.titulo}: ${r.texto}` : r.titulo)),
        summaryPT: resumo,
        reviewCount: x.n,
        dimensions: dims,
        marketSources: ws.langs.filter((l) => l.code !== 'none' && l.code !== 'und').map((l) => langNamePT(l.code)),
        marketSentiment: ws.langs.filter((l) => l.code !== 'none' && l.code !== 'und' && l.n >= 5).slice(0, 10)
          .map((l) => ({ market: langNamePT(l.code), score: Math.round(l.avg * 20) / 10, note: `${l.n} comentários · média ${l.avg.toFixed(2)}★` })),
        basis: 'estrelas', windowFrom: ws.from, windowTo: ws.to,
        issuesRecent: perRec.length ? perRec.map((z) => z.problema) : comEstado(['persistente', 'novo']).map((z) => nomeTema(z.id)),
        issuesPrevious: perAnt.length ? perAnt.map((z) => z.problema) : comEstado(['persistente', 'deixou']).map((z) => nomeTema(z.id)),
        v2: { n: x.n, titulo, temas: temasV2, recomendacoes: recs, pontosFortes, problemas, dimsN, periodos: { recentes: perRec, anteriores: perAnt }, textRec, textPrev, temasTodos: temas.map((z) => ({ id: z.id, recPos: z.recPos, recNeg: z.recNeg, prevPos: z.prevPos, prevNeg: z.prevNeg })), geradoEm: new Date().toISOString() },
      };
      const nowIso = new Date().toISOString();
      const snapshot: AnalysisSnapshot = { date: nowIso, score: x.idx, positive: ws.pos, negative: ws.neg, reviewCount: x.n, dimensions: dims, topNegative: analysis.topThemesNegative };
      const history = loc.analysis?.basis === 'estrelas' ? [...(loc.analysisHistory || []), snapshot] : [snapshot];
      const upd = semIndefinidos({ analysis, lastAnalyzed: nowIso, analysisHistory: history, reviewStats: stats });
      await gravarLocal(loc, upd);
      setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, ...upd } : l)));
      invalidateTrans(loc.id);
      showToast(t(`✓ ${loc.name} analisado`, `✓ ${loc.name} analysed`));
      return true;
    } catch (e: any) {
      console.error('Erro análise:', e);
      setError(`${loc.name}: ${e?.message || t('erro desconhecido', 'unknown error')}`);
      return false;
    } finally {
      setAnalyzing(null);
    }
  };

  // Intervenções registadas na ficha (marcadas no gráfico de evolução)
  const guardarIntervencoes = async (id: string, list: Intervencao[]) => {
    const l = locations.find((z) => z.id === id);
    if (!l) return;
    try {
      await gravarLocal(l, { interventions: list });
      setLocations((prev) => prev.map((z) => (z.id === id ? { ...z, interventions: list } : z)));
      showToast(t('✓ Intervenção registada', '✓ Intervention recorded'));
    } catch (e: any) {
      setError(t('Erro ao guardar a intervenção: ', 'Error saving the intervention: ') + (e?.message || ''));
    }
  };

  const pararLote = useRef(false);
  // Manter o ecrã acordado durante a reanálise (Screen Wake Lock; se o browser não suportar, segue sem ele)
  const wakeRef = useRef<any>(null);
  const pedirEcraAcordado = async () => { try { wakeRef.current = await (navigator as any).wakeLock?.request('screen'); } catch { /* sem suporte ou recusado */ } };
  const largarEcraAcordado = () => { try { wakeRef.current?.release?.(); } catch { /* */ } wakeRef.current = null; };
  useEffect(() => {
    const volta = () => { if (document.visibilityState === 'visible' && batchRun && !wakeRef.current) pedirEcraAcordado(); };
    document.addEventListener('visibilitychange', volta);
    return () => document.removeEventListener('visibilitychange', volta);
  }, [batchRun]);
  // Lote interrompido: quais locais ainda não foram reanalisados desde o início do lote
  const [loteGuardado, setLoteGuardado] = useState<{ inicio: string; ids: string[] } | null>(null);
  useEffect(() => { try { const x = localStorage.getItem('rb-lote'); if (x) setLoteGuardado(JSON.parse(x)); } catch { /* */ } }, []);
  const pendentesLote = loteGuardado ? locations.filter((l) => loteGuardado.ids.includes(l.id) && (!l.lastAnalyzed || l.lastAnalyzed < loteGuardado.inicio)) : [];
  const correrLote = async (targets: Location[], inicio: string, ids: string[]) => {
    pararLote.current = false;
    try { localStorage.setItem('rb-lote', JSON.stringify({ inicio, ids })); } catch { /* */ }
    setLoteGuardado({ inicio, ids });
    await pedirEcraAcordado();
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      if (pararLote.current) break;
      setBatchRun({ i: i + 1, total: targets.length, name: targets[i].name });
      if (await analyzeImported(targets[i])) ok++;
    }
    setBatchRun(null);
    largarEcraAcordado();
    const completo = !pararLote.current && ok === targets.length;
    if (completo) { try { localStorage.removeItem('rb-lote'); } catch { /* */ } setLoteGuardado(null); }
    showToast(completo ? t(`✓ ${ok}/${targets.length} locais analisados`, `✓ ${ok}/${targets.length} places analysed`) : t(`${ok} de ${targets.length} locais analisados. Usa "Continuar" para os que faltam.`, `${ok} of ${targets.length} places analysed. Use "Continue" for the rest.`));
    pararLote.current = false;
  };
  const continuarLote = async () => {
    if (!loteGuardado || !pendentesLote.length || analyzing || batchRun) return;
    await correrLote(pendentesLote, loteGuardado.inicio, loteGuardado.ids);
  };
  const analyzeAll = async () => {
    const targets = locations.filter((l) => l.reviewStats && revCount(l) > 0);
    if (!targets.length || analyzing || batchRun) return;
    if (!window.confirm(t(
      `Vão ser reanalisados ${targets.length} locais. Cada um demora cerca de 1 a 3 minutos (no total, 30 a 60 minutos): mantém esta página aberta. A app pede ao computador para não desligar o ecrã; se mesmo assim bloquear, a análise continua (mais devagar). Se o computador adormecer, depois podes continuar de onde parou.\n\nO plano gratuito do Groq tem um limite diário; se for atingido, os locais seguintes falham e podes retomar noutro dia. Podes parar a qualquer momento: o que já foi analisado fica guardado.\n\nContinuar?`,
      `${targets.length} places will be re-analysed. Each takes about 1 to 3 minutes (30 to 60 minutes in total): keep this page open.\n\nGroq's free plan has a daily limit; if it is reached, the remaining places fail and you can resume another day. You can stop at any time: what has been analysed is kept.\n\nContinue?`))) return;
    await correrLote(targets, new Date().toISOString(), targets.map((x) => x.id));
  };

  const analyze = async (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (loc && loc.reviewStats) { await analyzeImported(loc); return; }
    if (!loc || loc.reviews.length === 0) return;
    setAnalyzing(id);
    setError(null);
    try {
      const CHUNK_SIZE = 20;
      const allReviews = loc.reviews;
      const chunks: typeof allReviews[] = [];
      for (let i = 0; i < allReviews.length; i += CHUNK_SIZE) {
        chunks.push(allReviews.slice(i, i + CHUNK_SIZE));
      }

      // ── Fase 1: resumo parcial de cada bloco ──
      const partials: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        showToast(`A analisar bloco ${i + 1}/${chunks.length}...`);
        const chunkText = chunks[i].map((r) => r.text).join('\n---\n');
        const partialRes = await fetch('/api/groq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // modelo definido no servidor (app/api/groq)
            messages: [{
              role: 'user',
              content: `Resume estas reviews do local "${loc.name}" em Braga. Identifica:
- Pontos positivos mencionados (com frequência aproximada)
- Pontos negativos / problemas (com frequência aproximada)
- Idiomas detetados
- Sugestões implícitas
- Sentimento geral (positivo/neutro/negativo em %)

Responde em texto português conciso (máx 400 palavras), sem markdown.

Reviews (${chunks[i].length}):
${chunkText}`,
            }],
          }),
        });
        if (!partialRes.ok) {
          const errBody = await partialRes.text();
          throw new Error(`Bloco ${i + 1}/${chunks.length}: HTTP ${partialRes.status} - ${errBody.slice(0, 200)}`);
        }
        const partialData = await partialRes.json();
        partials.push(partialData.choices?.[0]?.message?.content || '');
        // Pausa para não estourar o rate limit do Groq (12k TPM no plano grátis)
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 35000));
        }
      }

      // ── Fase 2: síntese final em JSON ──
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // modelo definido no servidor (app/api/groq)
          messages: [{
            role: 'user',
            content: `És um analista de reputação turística especializado. Tens ${allReviews.length} reviews do local "${loc.name}" (${loc.category}) em Braga, Portugal, já pré-analisadas em ${chunks.length} blocos. Faz a síntese final consolidada.

INSTRUÇÕES:
- Combina os padrões dos vários blocos
- Distingue elogios genéricos de feedback específico e útil
- Identifica problemas mesmo que subtilmente mencionados
- As sugestões acionáveis devem ser CONCRETAS e dirigidas à gestão municipal
- O score deve refletir a realidade: 10 só se não houver NENHUMA crítica
- O reviewCount é ${allReviews.length}
- Lista todos os idiomas/mercados emissores identificados
- Para cada mercado emissor relevante, estima um score de satisfação (1-10) com base no tom das reviews desse idioma/país

Responde APENAS com JSON válido, sem markdown, sem backticks. Estrutura:
{
  "sentimentScore": <1-10, sê rigoroso>,
  "sentimentBreakdown": {"positive": <%>, "neutral": <%>, "negative": <%>},
  "topThemesPositive": ["máx 6 temas específicos mais mencionados positivamente"],
  "topThemesNegative": ["máx 6 temas negativos ou áreas a melhorar"],
  "keyIssues": ["problemas concretos identificados, máx 6"],
  "keyPraises": ["elogios específicos mais frequentes, máx 6"],
  "actionableInsights": ["6 sugestões CONCRETAS e acionáveis para a câmara municipal ou gestão do local"],
  "summaryPT": "Resumo analítico de 4-5 frases em português. Inclui pontos fortes, fracos e mercados emissores identificados.",
  "reviewCount": ${allReviews.length},
  "dimensions": {
    "localizacao": <1-10>, "servico": <1-10>, "precoQualidade": <1-10>,
    "limpeza": <1-10>, "experiencia": <1-10>, "acessibilidade": <1-10>
  },
  "marketSources": ["lista de idiomas/países detetados nas reviews"],
  "marketSentiment": [{"market": "idioma/país", "score": <1-10>, "note": "nota muito curta sobre o que esse mercado valoriza ou critica"}]
}

Resumos parciais dos blocos:

${partials.map((p, idx) => `=== Bloco ${idx + 1}/${chunks.length} (${chunks[idx].length} reviews) ===\n${p}`).join('\n\n')}`,
          }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Síntese final: HTTP ${res.status} - ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      const analysis: Analysis = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      const nowIso = new Date().toISOString();
      const snapshot: AnalysisSnapshot = {
        date: nowIso,
        score: analysis.sentimentScore ?? 0,
        positive: analysis.sentimentBreakdown?.positive ?? 0,
        negative: analysis.sentimentBreakdown?.negative ?? 0,
        reviewCount: analysis.reviewCount || allReviews.length,
        dimensions: analysis.dimensions || {},
        topNegative: analysis.topThemesNegative || [],
      };
      save(locations.map((l) =>
        l.id === id
          ? { ...l, analysis, lastAnalyzed: nowIso, analysisHistory: [...(l.analysisHistory || []), snapshot] }
          : l
      ));
      invalidateTrans(id);
      showToast('✓ Análise concluída');
    } catch (e: any) {
      console.error('Erro análise:', e);
      setError(`Erro: ${e?.message || 'desconhecido'}`);
    } finally {
      setAnalyzing(null);
    }
  };

  // ── Share link ──
  const shareUrl = (locId: string) => `${window.location.origin}${window.location.pathname}?r=${locId}`;
  const openShareLink = (locId: string) => {
    if (typeof window === 'undefined') return;
    // Navega na MESMA aba (sem abrir separador novo) e regista que viemos de dentro da app
    window.history.pushState({ r: locId }, '', shareUrl(locId));
    setDetailId(locId);
    setView('detalhe');
    setPublicMode(true);
    setCameFromApp(true);
    window.scrollTo(0, 0);
  };
  const goHome = () => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', window.location.pathname); // remove ?r= do URL
    setPublicMode(false);
    setDetailId(null);
    setView('overview');
    window.scrollTo(0, 0);
  };
  const copyShareLink = (locId: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(shareUrl(locId));
    setCopiedLinkId(locId);
    setTimeout(() => setCopiedLinkId(null), 2000);
    showToast('✓ Link partilhável copiado!');
  };

  // ── Leaflet Map with draggable markers ──
  useEffect(() => {
    if (view !== 'mapa' && !publicMode) return;
    if (publicMode) return; // No map in public mode

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }

      const map = L.map(mapRef.current, { center: [41.548, -8.426], zoom: 13 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const allLocs = locations.filter((l) => l.coords || getKnownCoords(l.name));
      const markers: any[] = [];

      allLocs.forEach((loc) => {
        const coords = loc.coords || getKnownCoords(loc.name);
        if (!coords) return;
        const score = loc.analysis?.sentimentScore;
        const color = score != null ? scoreColor(score) : '#4a4960';
        const labelText = score != null ? String(score) : categoryIcon(loc.category);
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:40px;height:40px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#000;box-shadow:0 3px 12px rgba(0,0,0,0.6);cursor:grab;">${labelText}</div>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });

        const marker = L.marker(coords, { icon, draggable: true });
        const pop = `<div style="min-width:220px">
          <div style="font-size:15px;font-weight:700;color:#e2e0db;margin-bottom:4px">${loc.name}</div>
          <div style="font-size:11px;color:#8b8a8f;margin-bottom:10px">${loc.category} · ${loc.platform}</div>
          ${score != null ? `<div style="margin-bottom:8px"><span style="background:${color};color:#000;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700">${score}/10 - ${scoreLabel(score)}</span></div>` : '<div style="font-size:11px;color:#8b8a8f">Sem análise ainda</div>'}
          ${dispAnalysis(loc)?.summaryPT ? `<div style="font-size:12px;color:#8b8a8f;line-height:1.5;margin-top:6px">${dispAnalysis(loc).summaryPT.slice(0, 180)}…</div>` : ''}
          <div style="font-size:10px;color:#4a4960;margin-top:10px;border-top:1px solid #252836;padding-top:8px">📍 Arrasta para reposicionar</div>
        </div>`;
        marker.bindPopup(pop, { maxWidth: 280 });

        marker.on('dragend', async (e: any) => {
          const ll = e.target.getLatLng();
          const newCoords: [number, number] = [ll.lat, ll.lng];
          const updated = locationsRef.current.map((l) =>
            l.id === loc.id ? { ...l, coords: newCoords } : l
          );
          await save(updated);
          showToast(`📍 ${loc.name} reposicionado`);
        });

        marker.addTo(map);
        markers.push(marker);
      });

      // Fit bounds if there are markers
      if (markers.length > 0) {
        const bounds = L.featureGroup(markers).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }

      mapInstance.current = map;
    };

    const timer = setTimeout(() => {
      if ((window as any).L) {
        initMap();
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setTimeout(initMap, 50);
        document.head.appendChild(script);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [view, locations, publicMode, save, showToast]);

  // ── Derived ──
  const analyzed = locations.filter((l) => l.analysis);
  const sortedAnalyzed = [...analyzed].sort((a, b) => (b.analysis?.sentimentScore || 0) - (a.analysis?.sentimentScore || 0));
  // Índice do destino: a MESMA conta da Visão Geral (média ponderada, só locais com dados suficientes).
  const destino = indiceDestino(locations);
  const avgScore = destino ? destino.idx
    : analyzed.length > 0 ? analyzed.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / analyzed.length : null;

  const allPos = analyzed.flatMap((l) => dispAnalysis(l)?.topThemesPositive || []);
  const allNeg = analyzed.flatMap((l) => dispAnalysis(l)?.topThemesNegative || []);
  const allIssues = analyzed.flatMap((l) => dispAnalysis(l)?.keyIssues || []);
  const allInsights = analyzed.flatMap((l) => dispAnalysis(l)?.actionableInsights || []);
  const allMarkets = analyzed.flatMap((l) => l.analysis?.marketSources || []);

  const topPraises = countTop(allPos, 8);
  const topProblems = countTop(allNeg, 8);
  const marketFreq = countTop(allMarkets, 10);
  const insightDeduped = Array.from(new Set(allInsights)).slice(0, 9);

  const totalReviews = analyzed.reduce((s, l) => s + (l.analysis?.reviewCount || l.reviews.length), 0);
  // Resumo da reputação para "Pergunte ao Observatório" (mesmas funções da Visão Geral; só texto agregado)
  const reputacaoResumo = (() => {
    try {
      const linhas: string[] = [];
      if (destino) linhas.push(`Destino: índice ${destino.idx.toFixed(1)}/10, ${destino.avg.toFixed(2)} estrelas, ${destino.n} avaliações em ${destino.locais} locais com dados suficientes.`);
      locations.forEach((l) => {
        const x = numeros(l);
        if (!x) return;
        const temas: any[] = ((l as any).analysis?.v2?.temas || []) as any[];
        const nome = (id: string) => TEMAS.find((y) => y.id === id)?.pt || id;
        const probs = temas.filter((z) => z.estado === 'persistente' || z.estado === 'novo').map((z) => nome(z.id));
        const fortes = temas.filter((z) => z.estado === 'forte').map((z) => nome(z.id));
        linhas.push(`${l.name}: ${x.robustez === 'insuficiente' ? 'dados insuficientes para índice' : `índice ${x.idx.toFixed(1)}/10`}, ${x.avg.toFixed(2)} estrelas, ${x.n} avaliações, ${Math.round(x.pos)}% positivas${probs.length ? `; problemas: ${probs.join(', ')}` : ''}${fortes.length ? `; pontos fortes: ${fortes.join(', ')}` : ''}`);
      });
      return linhas.join('\n');
    } catch { return ''; }
  })();

  // ── Prioridades: locais que exigem atenção (score mais baixo primeiro) ──
  const priorityLocs = [...analyzed]
    .filter((l) => (l.analysis?.sentimentScore || 10) < 7.5 || (l.analysis?.keyIssues?.length || 0) > 0)
    .sort((a, b) => (a.analysis?.sentimentScore || 0) - (b.analysis?.sentimentScore || 0))
    .slice(0, 4);

  // Category stats
  const categoryStats = CATEGORIES.map((cat) => {
    const inCat = analyzed.filter((l) => l.category === cat);
    if (inCat.length === 0) return null;
    const avg = inCat.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / inCat.length;
    return { cat, count: inCat.length, avg: +avg.toFixed(1) };
  }).filter(Boolean) as { cat: string; count: number; avg: number }[];

  const radarData = DIMS.map((d, i) => ({
    dimension: dimLabelI(i).replace('/Qualidade', '/Qual.'),
    value: analyzed.length > 0
      ? +(analyzed.reduce((s, l) => s + (l.analysis?.dimensions?.[d] || 0), 0) / analyzed.length).toFixed(1)
      : 0,
  }));

  const filteredLocations = locations.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchCat = filterCat === 'Todos' || l.category === filterCat;
    return matchSearch && matchCat;
  });

  const detailLoc = locations.find((l) => l.id === detailId);
  const selLoc = locations.find((l) => l.id === selId);
  const reportLoc = locations.find((l) => l.id === reportLocId);

  const IS: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.bg, color: C.text,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
  };

  const NAV: { id: ViewType; label: string; icon: string }[] = [
    { id: 'overview', label: t('Visão Geral', 'Overview'), icon: '◈' },
    { id: 'observatorio', label: t('Observatório', 'Observatory'), icon: '◔' },
    { id: 'produtos', label: t('Produtos turísticos', 'Tourism products'), icon: '▤' },
    { id: 'locais', label: t('Locais', 'Places'), icon: '⊞' },
    { id: 'mapa', label: t('Mapa', 'Map'), icon: '◎' },
    { id: 'comparar', label: t('Comparar', 'Compare'), icon: '⊟' },
    { id: 'mercados', label: t('Mercados', 'Markets'), icon: '◍' },
    { id: 'problemas', label: t('Problemas', 'Issues'), icon: '▦' },
    { id: 'relatorio', label: t('Relatório', 'Report'), icon: '≡' },
  ];

  // ── Report generator ──
  const generateReport = (locFilter?: Location[]) => {
    const targets = locFilter || sortedAnalyzed;
    const date = new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: '2-digit', month: 'long', year: 'numeric' });
    const reportTotalReviews = targets.reduce((s, l) => s + (l.analysis?.reviewCount || l.reviews.length), 0);
    const reportAvgScore = targets.length > 1 && destino && targets.length === sortedAnalyzed.length ? destino.idx
      : targets.length > 0 ? targets.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / targets.length
      : null;
    const reportMarkets = Array.from(new Set(targets.flatMap((l) => l.analysis?.marketSources || [])));
    const reportProblems = countTop(targets.flatMap((l) => dispAnalysis(l)?.topThemesNegative || []), 8);
    const reportPraises = countTop(targets.flatMap((l) => dispAnalysis(l)?.topThemesPositive || []), 8);
    const reportInsights = Array.from(new Set(targets.flatMap((l) => dispAnalysis(l)?.actionableInsights || []))).slice(0, 9);

    return [
      t(`RELATÓRIO DE REPUTAÇÃO TURÍSTICA - BRAGA`, `TOURISM REPUTATION REPORT - BRAGA`),
      `${'═'.repeat(50)}`,
      t(`Data: ${date}  |  Município de Braga`, `Date: ${date}  |  Municipality of Braga`),
      `${'═'.repeat(50)}`,
      ``,
      t(`RESUMO EXECUTIVO`, `EXECUTIVE SUMMARY`),
      `${'─'.repeat(40)}`,
      t(`• Locais analisados:        ${targets.length}`, `• Places analysed:          ${targets.length}`),
      t(`• Reviews processadas:      ${reportTotalReviews}`, `• Reviews processed:        ${reportTotalReviews}`),
      t(`• Score global:             ${reportAvgScore?.toFixed(1) || 'N/D'}/10  (${reportAvgScore ? scoreLabel(reportAvgScore) : '-'})`, `• Overall score:            ${reportAvgScore?.toFixed(1) || 'N/A'}/10  (${reportAvgScore ? scoreLabel(reportAvgScore) : '-'})`),
      t(`• Mercados emissores:       ${reportMarkets.join(', ') || 'N/D'}`, `• Source markets:           ${reportMarkets.join(', ') || 'N/A'}`),
      ``,
      t(`RANKING POR LOCAL`, `RANKING BY PLACE`),
      `${'─'.repeat(40)}`,
      ...targets.map((l, i) =>
        `${String(i + 1).padStart(2)}. ${l.name.padEnd(38)} ${l.analysis!.sentimentScore}/10  (${l.analysis!.reviewCount || l.reviews.length} reviews)`
      ),
      ``,
      t(`ANÁLISE DETALHADA`, `DETAILED ANALYSIS`),
      `${'─'.repeat(40)}`,
      ...targets.flatMap((l) => [
        ``,
        `▶ ${l.name.toUpperCase()}`,
        t(`   Categoria: ${l.category}  ·  Plataforma: ${l.platform}`, `   Category: ${catLabel(l.category)}  ·  Platform: ${l.platform}`),
        `   Score: ${l.analysis!.sentimentScore}/10  -  ${scoreLabel(l.analysis!.sentimentScore)}`,
        t(`   Sentimento: ${l.analysis!.sentimentBreakdown.positive}% positivo · ${l.analysis!.sentimentBreakdown.neutral}% neutro · ${l.analysis!.sentimentBreakdown.negative}% negativo`, `   Sentiment: ${l.analysis!.sentimentBreakdown.positive}% positive · ${l.analysis!.sentimentBreakdown.neutral}% neutral · ${l.analysis!.sentimentBreakdown.negative}% negative`),
        t(`   Reviews analisadas: ${l.analysis!.reviewCount || l.reviews.length}`, `   Reviews analysed: ${l.analysis!.reviewCount || l.reviews.length}`),
        t(`   Mercados: ${l.analysis!.marketSources?.join(', ') || 'N/D'}`, `   Markets: ${l.analysis!.marketSources?.join(', ') || 'N/A'}`),
        ``,
        t(`   Resumo:`, `   Summary:`),
        `   ${dispAnalysis(l).summaryPT}`,
        ``,
        t(`   Pontos Fortes:`, `   Strengths:`),
        ...(dispAnalysis(l).keyPraises || []).map((p) => `   + ${p}`),
        ``,
        t(`   Problemas:`, `   Issues:`),
        ...(dispAnalysis(l).keyIssues || []).map((p) => `   − ${p}`),
        ``,
        t(`   Ações Recomendadas:`, `   Recommended Actions:`),
        ...(dispAnalysis(l).actionableInsights || []).map((p, i) => `   ${i + 1}. ${p}`),
        ``,
        `   ${'─'.repeat(46)}`,
      ]),
      ``,
      t(`PROBLEMAS SISTÉMICOS`, `SYSTEMIC ISSUES`),
      `${'─'.repeat(40)}`,
      ...reportProblems.map(([p, c]) => `• ${p}${c > 1 ? `  [${c} ${t('locais', 'places')}]` : ''}`),
      ``,
      t(`ELOGIOS MAIS FREQUENTES`, `MOST FREQUENT PRAISES`),
      `${'─'.repeat(40)}`,
      ...reportPraises.map(([p, c]) => `• ${p}${c > 1 ? `  [${c} ${t('locais', 'places')}]` : ''}`),
      ``,
      t(`AÇÕES PRIORITÁRIAS PARA O MUNICÍPIO`, `PRIORITY ACTIONS FOR THE MUNICIPALITY`),
      `${'─'.repeat(40)}`,
      ...reportInsights.map((ins, i) => `${i + 1}. ${ins}`),
      ``,
      `${'═'.repeat(50)}`,
      t(`Relatório gerado automaticamente - Município de Braga`, `Report generated automatically - Municipality of Braga`),
    ].join('\n');
  };

  if (loading) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', background: 'radial-gradient(900px 520px at 50% 30%, rgba(138,176,230,0.10), transparent), #15171B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Public Sans', system-ui, sans-serif" }}>
        <div className="rb-splash-foto" style={{ backgroundImage: `url(/login-avenida.jpg), url(${FOTO_LOGIN_MINI})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(21,23,27,.55) 0%, rgba(21,23,27,.9) 70%, #15171B 100%)' }} />
        <div style={{ position: 'relative', textAlign: 'center', animation: 'rbFadeUp 0.8s ease both', padding: 24 }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ width: 210, height: 'auto', marginBottom: 28 }} />
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8AB0E6', marginBottom: 10 }}>Braga</div>
          <div style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: '#ECEDEF', letterSpacing: '-0.02em', marginBottom: 28 }}>
            {t('Observatório de Turismo e Reputação', 'Tourism and Reputation Observatory')}
          </div>
          <div style={{ width: 200, height: 3, borderRadius: 3, background: 'rgba(255,255,255,.1)', overflow: 'hidden', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, transparent, #8AB0E6, transparent)', animation: 'rbShimmer 1.3s ease-in-out infinite' }} />
          </div>
          <div style={{ fontSize: 13, color: '#A3A8B1', marginTop: 18 }}>{t('A carregar dados…', 'Loading data…')}</div>
        </div>
      </div>
    );
  }

  // ─── PUBLIC REPORT VIEW ─── (when ?r=<id> in URL): ficha do local só de leitura
  if (publicMode) {
    if (!detailLoc || (!detailLoc.analysis && !detailLoc.reviewStats)) {
      return (
        <div style={{ background: '#15171B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ width: 150, height: 'auto' }} />
          <p style={{ color: '#A3A8B1', fontSize: 14 }}>{t('Relatório não encontrado.', 'Report not found.')}</p>
        </div>
      );
    }
    const navBtn = { height: 36, padding: '0 14px', borderRadius: 4, border: '1px solid #2D3139', background: '#1C1F24', color: '#ECEDEF', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: "'Public Sans', system-ui, sans-serif" } as const;
    return (
      <div style={{ background: '#15171B', minHeight: '100vh' }}>
        {cameFromApp && (
          <div className="rb-noprint" style={{ display: 'flex', gap: 8, padding: '16px 48px 0', maxWidth: 1120, margin: '0 auto' }}>
            <button onClick={() => window.history.back()} style={navBtn}>{t('← Voltar', '← Back')}</button>
            <button onClick={goHome} style={navBtn}>{t('Início', 'Home')}</button>
          </div>
        )}
        <FichaLocal loc={detailLoc} locations={locations} readOnly catLabel={catLabel} />
      </div>
    );
  }

  // ─── NORMAL APP VIEW ───
  return (
    <ModoAdmin.Provider value={admin}>
    <div className="rb-app" style={{ background: '#15171B', minHeight: '100vh', display: 'flex', color: C.text }}>

      {/* ═══ SIDEBAR (nova identidade: fotografia de Braga, índice do destino em destaque) ═══ */}
      <a href="#conteudo" className="rb-saltar">{t('Saltar para o conteúdo', 'Skip to content')}</a>
      <aside className="rb-sidebar" style={{
        width: 232, flexShrink: 0, background: '#101215', borderRight: '1px solid #23262C',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
        fontFamily: "'Public Sans', system-ui, sans-serif", overflowY: 'auto',
      }}>
        <div className="rbs-top" style={{ position: 'relative', overflow: 'hidden', padding: '26px 16px 18px', borderBottom: '1px solid #23262C' }}>
          {fotoBraga && <div className="rbs-foto" style={{ backgroundImage: `url(${fotoBraga})` }} />}
          <div className="rbs-shade" />
          <div className="rbs-inner" style={{ position: 'relative' }}>
            <img src={LOGO_URL} alt="Visit Braga" style={{ height: 34, width: 'auto', display: 'block' }} />
            <div className="rbs-sub" style={{ fontSize: 12.5, color: '#A3A8B1', marginTop: 10, lineHeight: 1.4 }}>{t('Observatório de Turismo e Reputação', 'Tourism and Reputation Observatory')}</div>
            {avgScore !== null && (
              <button className="rbs-indice" onClick={() => setView('overview')} title={t('Ver a Visão Geral', 'See the Overview')} style={{
                display: 'block', width: '100%', textAlign: 'left', marginTop: 18, padding: '14px', borderRadius: 8, cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(34,50,74,.62) 0%, rgba(21,23,27,.55) 100%)', border: '1px solid rgba(138,176,230,.22)', color: '#ECEDEF',
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', fontFamily: 'inherit', boxShadow: '0 12px 30px -12px rgba(0,0,0,.6)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="rbs-anel" style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
                    <svg width="100%" height="100%" viewBox="0 0 70 70" aria-hidden="true">
                      <defs>
                        <linearGradient id="rbsAnelGrad" x1="0" x2="1" y1="0" y2="1">
                          <stop offset="0%" stopColor="#CFE0F7" />
                          <stop offset="100%" stopColor="#6FA0DC" />
                        </linearGradient>
                      </defs>
                      <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="5" />
                      <circle className="rbs-arco" cx="35" cy="35" r="30" fill="none" stroke="url(#rbsAnelGrad)" strokeWidth="5" strokeLinecap="round"
                        pathLength={100} strokeDasharray={`${Math.min(100, avgScore * 10)} 100`} transform="rotate(-90 35 35)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      <span className="rbs-big" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>{avgScore.toLocaleString(lang === 'en' ? 'en-GB' : 'pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                      <span className="rbs-de10" style={{ fontSize: 10, color: '#A3A8B1', marginTop: 3 }}>/10</span>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="rbs-lab" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8AB0E6' }}>{t('Índice do destino', 'Destination index')}</div>
                    {destino && (
                      <div className="rbs-media" style={{ fontSize: 19, fontWeight: 700, marginTop: 6, letterSpacing: '-0.01em' }}>
                        {destino.avg.toLocaleString(lang === 'en' ? 'en-GB' : 'pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ color: '#F2C14E', filter: 'drop-shadow(0 0 8px rgba(242,193,78,.4))' }}>★</span>
                      </div>
                    )}
                    <div className="rbs-det" style={{ fontSize: 12, color: '#A3A8B1', marginTop: 3 }}>{destino ? destino.locais : analyzed.length} {t('locais avaliados', 'places rated')}</div>
                  </div>
                </div>
              </button>
            )}
            <div className="rbs-lang" style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              {(['pt', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => changeLang(l)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${lang === l ? '#8AB0E6' : 'rgba(255,255,255,.12)'}`,
                  background: lang === l ? 'rgba(138,176,230,.16)' : 'rgba(21,23,27,.4)',
                  color: lang === l ? '#ECEDEF' : '#A3A8B1', letterSpacing: '0.04em', transition: 'all 0.2s', fontFamily: 'inherit',
                }}>
                  <span aria-hidden="true" style={{
                    width: 20, height: 14, flexShrink: 0, borderRadius: 2, display: 'block',
                    backgroundImage: `url(https://flagcdn.com/${l === 'pt' ? 'pt' : 'gb'}.svg)`,
                    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                  }} />
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.filter((item) => admin || item.id !== 'relatorio').map((item) => {
            const isActive = view === item.id || (item.id === 'locais' && view === 'detalhe');
            const ic = NAV_ICON[item.id];
            return (
              <button key={item.id} onClick={() => setView(item.id)} className="rb-nav"
                style={{
                  position: 'relative', display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 6, border: 'none',
                  background: isActive ? '#22324A' : 'transparent',
                  color: isActive ? '#ECEDEF' : '#A3A8B1',
                  cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 600 : 500,
                  marginBottom: 2, textAlign: 'left', fontFamily: 'inherit',
                }}>
                {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 3, background: '#8AB0E6' }} />}
                {ic ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#8AB0E6' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d={ic} /></svg>
                ) : <span style={{ fontSize: 15, lineHeight: 1, width: 18, textAlign: 'center' }}>{item.icon}</span>}
                {item.label}
                {item.id === 'locais' && locations.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, background: isActive ? 'rgba(138,176,230,.2)' : '#23262C', color: isActive ? '#ECEDEF' : '#A3A8B1', padding: '2px 8px', borderRadius: 999 }}>
                    {locations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="rbs-conta" style={{ padding: '0 10px 12px' }}>
          {admin ? (
            sessao?.protecao ? <button type="button" onClick={sair} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 40, borderRadius: 8, border: '1px solid #2D3139', background: 'transparent', color: '#A3A8B1', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              {t('Sair da administração', 'Sign out of admin')}
            </button> : null
          ) : (
            <a href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 40, borderRadius: 8, border: '1px solid rgba(138,176,230,.35)', background: 'rgba(138,176,230,.12)', color: '#ECEDEF', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8AB0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
              {t('Entrar (administração)', 'Sign in (admin)')}
            </a>
          )}
        </div>
        <div className="rbs-foot" style={{ padding: '14px 18px 18px', borderTop: '1px solid #23262C', fontSize: 11.5, color: '#8A909B', lineHeight: 1.5 }}>
          {t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main id="conteudo" tabIndex={-1} className="rb-main" style={{ marginLeft: 232, flex: 1, minHeight: '100vh', minWidth: 0, outline: 'none' }}>
        {sessaoFirebaseEmFalta && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', margin: '14px 20px 0', padding: '12px 16px', borderRadius: 8, background: 'rgba(237,160,107,.12)', border: '1px solid rgba(237,160,107,.4)', color: '#ECEDEF', fontSize: 14 }}>
            <span>{t('Sem sessão de edição no Firebase: as alterações não serão gravadas. Volte a entrar; se o aviso continuar, confirme a configuração do Firebase na Vercel.', 'No Firebase editing session: changes will not be saved. Sign in again; if this persists, check the Firebase settings on Vercel.')}</span>
            <button type="button" onClick={voltarAEntrar} style={{ padding: '7px 14px', borderRadius: 999, border: 0, background: '#EDA06B', color: '#0F1216', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>{t('Voltar a entrar', 'Sign in again')}</button>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {view === 'overview' && (
          <VisaoGeral locations={locations} onOpen={(id) => { setDetailId(id); setView('detalhe'); }} onOpenList={() => setView('locais')} onImport={() => { setImpGroups([]); setImpMsg(null); setShowImport(true); }} onObservatorio={() => setView('observatorio')} />
        )}

        {/* ── LOCAIS ── */}
        {view === 'locais' && (
          <LocaisLista locations={locations} analyzing={analyzing} batchRun={batchRun} catLabel={catLabel}
            onOpen={(id) => { setDetailId(id); setView('detalhe'); }} onImport={() => { setImpGroups([]); setImpMsg(null); setShowImport(true); }} onStopBatch={() => { pararLote.current = true; showToast(t('Vai parar no fim do local em curso…', 'Will stop after the current place…')); }} pendentesLote={pendentesLote.length} onContinueBatch={continuarLote} onAnalyzeAll={analyzeAll} onAdd={() => setShowAdd(true)} />
        )}

        {/* ── MAPA ── */}
        {view === 'mapa' && (
          <MapaView locations={locations} catLabel={catLabel} onOpen={(id) => { setDetailId(id); setView('detalhe'); }}
            coordsDe={(l) => (l as Location).coords || getKnownCoords(l.name)}
            onMove={(id, c) => {
              const l = locations.find((z) => z.id === id);
              if (!l) return;
              gravarLocal(l, { coords: c }).then(() => {
                setLocations((prev) => prev.map((z) => (z.id === id ? { ...z, coords: c } : z)));
                showToast(t(`${l.name} reposicionado`, `${l.name} repositioned`));
              }).catch((e: any) => setError(e?.message || String(e)));
            }} />
        )}

        {/* ── DETALHE (ficha do local) ── */}
        {view === 'detalhe' && detailLoc && (
          <FichaLocal loc={detailLoc} locations={locations} analyzing={analyzing} copied={copiedLinkId === detailLoc.id} catLabel={catLabel}
            onReanalyze={(id) => analyze(id)} onShare={(id) => copyShareLink(id)} onOpenList={() => setView('locais')} onOpen={(id) => setDetailId(id)}
            onImport={() => { setImpGroups([]); setImpMsg(null); setShowImport(true); }} onPaste={(id) => { setSelId(id); setShowReview(true); }}
            onEdit={(id) => { const l = locations.find((z) => z.id === id); if (l) startEdit(l); }}
            onDelete={(id) => deleteLoc(id)} onSaveInterventions={guardarIntervencoes}
              onSaveWiki={async (id, w) => {
                const l = locations.find((z) => z.id === id);
                if (!l) return;
                const w2 = JSON.parse(JSON.stringify(w)) as WikiDados;
                await gravarLocal(l, { wiki: w2 });
                setLocations((prev) => prev.map((z) => (z.id === id ? { ...z, wiki: w2 } : z)));
                showToast(t('✓ Interesse online atualizado', '✓ Online interest updated'));
              }} />
        )}

        {/* ── COMPARAR ── */}
        {view === 'comparar' && (
          <CompararView locations={locations} catLabel={catLabel} onOpen={(id) => { setDetailId(id); setView('detalhe'); }} />
        )}

        {/* ── PRODUTOS TURÍSTICOS ── */}
        {view === 'produtos' && <ProdutosView />}

        {/* ── MERCADOS: procura e satisfação ── */}
        {view === 'mercados' && <MercadosView locations={locations} />}

        {/* ── OBSERVATÓRIO ── */}
        {view === 'observatorio' && (
          <ObservatorioView
            reputacaoMedia={avgScore}
            fotoTopo={fotoPosto}
            reputacaoLocais={analyzed.length}
            reputacaoReviews={totalReviews}
            reputacaoResumo={reputacaoResumo}
          />
        )}

        {/* ── PROBLEMAS → Temas no destino ── */}
        {view === 'problemas' && (
          <TemasView locations={locations} catLabel={catLabel} onOpen={(id) => { setDetailId(id); setView('detalhe'); }} />
        )}

        {/* ── RELATÓRIO ── */}
        {view === 'relatorio' && (
          <RelatorioView
            analisados={sortedAnalyzed} catLabel={catLabel}
            relatorioIA={aiReport ? <AIReportBody text={aiReport} /> : null}
            gerando={genReport} onGerar={generateAIReport} onExportarPDF={exportReportPDF}
            textoConsolidado={(id) => generateReport(id ? sortedAnalyzed.filter((l) => l.id === id) : sortedAnalyzed)}
            onCopiarConsolidado={(id) => {
              navigator.clipboard.writeText(generateReport(id ? sortedAnalyzed.filter((l) => l.id === id) : sortedAnalyzed));
              setCopiedReport(true);
              setTimeout(() => setCopiedReport(false), 2000);
            }}
            copiado={copiedReport}
            copiedLinkId={copiedLinkId} onCopiarLink={(id) => copyShareLink(id)} onAbrirPagina={(id) => openShareLink(id)}
            onOpen={(id) => { setDetailId(id); setView('detalhe'); }}
          />
        )}
        <button className={`rb-topo${verTopo ? ' on' : ''}`} aria-label={t('Voltar ao topo', 'Back to top')} title={t('Voltar ao topo', 'Back to top')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
        <style>{`.rb-saltar{position:fixed;left:14px;top:-80px;z-index:400;background:#8AB0E6;color:#0F1216;padding:12px 18px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;transition:top .15s ease}.rb-saltar:focus{top:14px;outline:3px solid #ECEDEF;outline-offset:2px}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid #8AB0E6;outline-offset:2px}@media (prefers-reduced-motion: reduce){.rb-saltar{transition:none}}.rb-topo{position:fixed;right:26px;bottom:26px;z-index:30;width:50px;height:50px;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#0F1216;background:#8AB0E6;border:2px solid rgba(255,255,255,.35);box-shadow:0 12px 30px -8px rgba(0,0,0,.7),0 0 0 6px rgba(138,176,230,.16);cursor:pointer;opacity:0;transform:translateY(14px) scale(.9);pointer-events:none;transition:opacity .25s ease,transform .25s ease,background .2s ease,box-shadow .2s ease}.rb-topo.on{opacity:1;transform:none;pointer-events:auto}.rb-topo:hover{background:#B7CDF0;box-shadow:0 14px 34px -8px rgba(0,0,0,.75),0 0 0 8px rgba(138,176,230,.22)}.rb-topo:focus-visible{outline:3px solid #ECEDEF;outline-offset:3px}@media (max-width:900px){.rb-topo{right:16px;bottom:18px;width:46px;height:46px}}@media print{.rb-topo{display:none}}`}</style>
      </main>

      {/* ═══ MODAL: ADD LOCATION ═══ */}
      {showImport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { if (!impBusy) setShowImport(false); }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 780, maxWidth: '94vw', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{t('Importar comentários do Google Maps', 'Import Google Maps reviews')}</h3>
            <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: '0 0 16px' }}>
              {t('Ficheiro JSON ou CSV exportado (ex.: Apify — Google Maps Reviews Scraper). Só entram comentários com menos de 3 anos, os repetidos são ignorados e os nomes dos autores não são guardados. Um ficheiro pode trazer vários locais. Os comentários colados manualmente nesses locais são substituídos.',
                 'Exported JSON or CSV file (e.g. Apify — Google Maps Reviews Scraper). Only reviews under 3 years old are kept, duplicates are ignored and author names are not stored. A file may contain several places. Manually pasted reviews for those places are replaced.')}
            </p>
            <input type="file" accept=".json,.csv,.jsonl,.txt" onChange={onImportFile} disabled={impBusy}
              style={{ fontSize: 13, color: C.text }} />
            {impMsg && <p style={{ fontSize: 12.5, color: impMsg.startsWith('✓') ? C.positive : C.textMuted, lineHeight: 1.6, margin: '14px 0 0' }}>{impMsg}</p>}
            {impGroups.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {impGroups.map((g, gi) => (
                  <div key={g.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{g.title}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                        {g.reviews.length} {t('no ficheiro', 'in the file')} · <strong style={{ color: C.positive }}>{g.inWindow}</strong> {t('com menos de 3 anos', 'under 3 years old')}
                        {g.outWindow ? ` · ${g.outWindow} ${t('mais antigos (ignorados)', 'older (ignored)')}` : ''} · ★ {g.avg.toFixed(2)} · {g.from.slice(0, 10)} → {g.to.slice(0, 10)}
                      </div>
                    </div>
                    <select value={g.target} disabled={impBusy}
                      onChange={(e) => { const v = e.target.value; setImpGroups((prev) => prev.map((x, i) => (i === gi ? { ...x, target: v } : x))); }}
                      style={{ flex: '0 1 260px', padding: '8px 10px', borderRadius: 8, border: `1px solid ${g.target ? C.accent : C.border}`, background: C.card, color: C.text, fontSize: 12.5 }}>
                      <option value="">{t('— Ignorar —', '— Skip —')}</option>
                      <option value="__new__">{t('+ Criar novo local', '+ Create new place')}</option>
                      {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowImport(false)} disabled={impBusy}
                style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: impBusy ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                {t('Fechar', 'Close')}
              </button>
              <button onClick={confirmImport} disabled={impBusy || !impGroups.some((g) => g.target)}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: impBusy || !impGroups.some((g) => g.target) ? C.border : C.accent, color: impBusy || !impGroups.some((g) => g.target) ? C.textDim : C.bg, cursor: impBusy || !impGroups.some((g) => g.target) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                {impBusy ? t('A importar…', 'Importing…') : t('Importar', 'Import')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>{t('Novo Local', 'New Place')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Nome do Local', 'Place Name')}</label>
                <input value={newLoc.name} list="braga-pois-list" onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                  placeholder={t('Começa a escrever - sugestões aparecem', 'Start typing - suggestions appear')} style={IS} autoFocus />
                <datalist id="braga-pois-list">
                  {KNOWN_POI_NAMES.map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Categoria', 'Category')}</label>
                  <select value={newLoc.category} onChange={(e) => setNewLoc({ ...newLoc, category: e.target.value })} style={IS}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Plataforma', 'Platform')}</label>
                  <select value={newLoc.platform} onChange={(e) => setNewLoc({ ...newLoc, platform: e.target.value })} style={IS}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{catLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  {t('Coordenadas (opcional)', 'Coordinates (optional)')}
                  {getKnownCoords(newLoc.name) && !newLoc.lat && (
                    <span style={{ marginLeft: 8, color: C.positive, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                      {t('✓ auto-detetadas:', '✓ auto-detected:')} {getKnownCoords(newLoc.name)![0].toFixed(4)}, {getKnownCoords(newLoc.name)![1].toFixed(4)}
                    </span>
                  )}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.lat} onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })} placeholder={t('Latitude (ex: 41.5503)', 'Latitude (e.g. 41.5503)')} style={IS} type="number" step="0.0001" />
                  <input value={newLoc.lng} onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })} placeholder={t('Longitude (ex: -8.4275)', 'Longitude (e.g. -8.4275)')} style={IS} type="number" step="0.0001" />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                  {t('Deixa em branco para usar coords automáticas (se POI conhecido). Podes sempre arrastar no mapa para ajustar.', 'Leave blank to use automatic coordinates (if a known POI). You can always drag on the map to adjust.')}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Google (opcional)', 'Google (optional)')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.googleRating} onChange={(e) => setNewLoc({ ...newLoc, googleRating: e.target.value })} placeholder={t('Nota (ex: 4.7)', 'Rating (e.g. 4.7)')} style={IS} type="number" step="0.1" min="0" max="5" />
                  <input value={newLoc.googleReviewCount} onChange={(e) => setNewLoc({ ...newLoc, googleReviewCount: e.target.value })} placeholder="Nº reviews (ex: 37000)" style={IS} type="number" min="0" />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{t('Nota (0–5) e nº de avaliações no Google Maps. Mostra-se ao lado do score da IA, com indicador de divergência.', 'Rating (0–5) and number of Google Maps reviews. Shown next to the AI score, with a divergence indicator.')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>{t('Cancelar', 'Cancel')}</button>
              <button onClick={addLocation} disabled={!newLoc.name.trim()}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: newLoc.name.trim() ? C.accent : C.border,
                  color: newLoc.name.trim() ? C.bg : C.textDim,
                  cursor: newLoc.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                }}>{t('Adicionar', 'Add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: EDIT LOCATION ═══ */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setShowEdit(false); setEditId(null); }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>{t('Editar Local', 'Edit Place')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Nome', 'Name')}</label>
                <input value={newLoc.name} list="braga-pois-list-edit" onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && updateLocation()}
                  style={IS} />
                <datalist id="braga-pois-list-edit">
                  {KNOWN_POI_NAMES.map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Categoria', 'Category')}</label>
                  <select value={newLoc.category} onChange={(e) => setNewLoc({ ...newLoc, category: e.target.value })} style={IS}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Plataforma', 'Platform')}</label>
                  <select value={newLoc.platform} onChange={(e) => setNewLoc({ ...newLoc, platform: e.target.value })} style={IS}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{catLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Coordenadas', 'Coordinates')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.lat} onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })} placeholder="Latitude" style={IS} type="number" step="0.0001" />
                  <input value={newLoc.lng} onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })} placeholder="Longitude" style={IS} type="number" step="0.0001" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{t('Google (opcional)', 'Google (optional)')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.googleRating} onChange={(e) => setNewLoc({ ...newLoc, googleRating: e.target.value })} placeholder={t('Nota (ex: 4.7)', 'Rating (e.g. 4.7)')} style={IS} type="number" step="0.1" min="0" max="5" />
                  <input value={newLoc.googleReviewCount} onChange={(e) => setNewLoc({ ...newLoc, googleReviewCount: e.target.value })} placeholder={t('Nº reviews', 'No. reviews')} style={IS} type="number" min="0" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => { setShowEdit(false); setEditId(null); }}
                style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>{t('Cancelar', 'Cancel')}</button>
              <button onClick={updateLocation} disabled={!newLoc.name.trim()}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: newLoc.name.trim() ? C.accent : C.border,
                  color: newLoc.name.trim() ? C.bg : C.textDim,
                  cursor: newLoc.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                }}>{t('Guardar Alterações', 'Save Changes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: PASTE REVIEWS ═══ */}
      {showReview && selLoc && (() => {
        const csvRows = importMode === 'csv' ? parseCSV(reviewText) : [];
        const csvBody = csvHasHeader ? csvRows.slice(1) : csvRows;
        const csvHeaderRow = csvHasHeader && csvRows.length ? csvRows[0] : [];
        const effCol = csvCol ?? suggestTextColumn(csvBody);
        const previewCount = importMode === 'csv'
          ? csvBody.map((r) => (r[effCol] || '').trim()).filter(Boolean).length
          : splitReviewText(reviewText).length;
        const modeBtn = (m: 'texto' | 'csv', label: string) => (
          <button onClick={() => { setImportMode(m); setCsvCol(null); }} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: importMode === m ? 700 : 500,
            border: `1px solid ${importMode === m ? C.accent : C.border}`,
            background: importMode === m ? C.accentBg : 'transparent',
            color: importMode === m ? C.accentLight : C.textMuted,
          }}>{label}</button>
        );
        return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setShowReview(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 600, maxWidth: '92vw' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{t('Importar Reviews', 'Import Reviews')}</h3>
            <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
              <strong style={{ color: C.accent }}>{selLoc.name}</strong> - {t('importação em massa por texto ou ficheiro CSV.', 'bulk import by text or CSV file.')}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {modeBtn('texto', t('Colar texto', 'Paste text'))}
              {modeBtn('csv', t('Importar CSV', 'Import CSV'))}
            </div>

            {importMode === 'texto' ? (
              <>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={12}
                  placeholder={t('Cola aqui todas as reviews.\n\nPodes separar por uma linha em branco entre cada uma,\nou por --- numa linha própria. Deteção automática.', 'Paste all reviews here.\n\nYou can separate them with a blank line between each one,\nor with --- on its own line. Automatic detection.')}
                  style={{ ...IS, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                <p style={{ fontSize: 11, color: C.textDim, margin: '6px 0 0' }}>
                  {t('Separadores aceites: linha em branco entre reviews, ou', 'Accepted separators: blank line between reviews, or')} <code style={{ background: C.border, padding: '1px 5px', borderRadius: 4 }}>---</code>{t('. Se nada disso existir, cada linha é uma review.', '. If none of these exist, each line is one review.')}
                </p>
              </>
            ) : (
              <>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={10}
                  placeholder={t('autor,nota,comentário,data\nJoão,5,"Lugar incrível, vale a pena",2025-03-01\nMaria,4,"Muito bonito mas cheio de gente",2025-03-02', 'author,rating,comment,date\nJohn,5,"Amazing place, worth it",2025-03-01\nMary,4,"Very nice but crowded",2025-03-02')}
                  style={{ ...IS, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: 12 }} />
                {csvRows.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>
                      <input type="checkbox" checked={csvHasHeader} onChange={(e) => { setCsvHasHeader(e.target.checked); setCsvCol(null); }} />
                      {t('1ª linha é cabeçalho', '1st row is header')}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{t('Coluna do texto:', 'Text column:')}</span>
                      <select value={effCol} onChange={(e) => setCsvCol(parseInt(e.target.value, 10))}
                        style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 12 }}>
                        {(csvRows[0] || []).map((_, idx) => (
                          <option key={idx} value={idx}>{csvHasHeader ? (csvHeaderRow[idx] || `${t('Coluna', 'Column')} ${idx + 1}`) : `${t('Coluna', 'Column')} ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {csvBody.length > 0 && (
                  <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', maxHeight: 90, overflowY: 'auto' }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{t('Pré-visualização', 'Preview')}</div>
                    {csvBody.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>• {(r[effCol] || '').trim() || <em style={{ color: C.textDim }}>{t('(vazio)', '(empty)')}</em>}</div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 11, color: C.textDim }}>
                {selLoc.reviews.length} {t(selLoc.reviews.length !== 1 ? 'já guardadas' : 'já guardada', 'already saved')}
                {previewCount > 0 && <span style={{ color: C.accent }}> · {previewCount} {t(previewCount !== 1 ? 'detetadas' : 'detetada', 'detected')} {t('para importar', 'to import')}</span>}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowReview(false)}
                  style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>{t('Cancelar', 'Cancel')}</button>
                <button onClick={addReviews} disabled={previewCount === 0}
                  style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: previewCount > 0 ? C.accent : C.border,
                    color: previewCount > 0 ? C.bg : C.textDim,
                    cursor: previewCount > 0 ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 600,
                  }}>
                  {t('Importar', 'Import')} {previewCount > 0 ? previewCount : ''} review{previewCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: C.card, border: `1px solid ${C.accent}50`,
          borderRadius: 10, padding: '12px 22px', color: C.text, fontSize: 13,
          zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          fontWeight: 500,
        }}>
          {toast}
        </div>
      )}
    </div>
    </ModoAdmin.Provider>
  );
}
