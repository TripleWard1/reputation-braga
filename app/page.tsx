'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import ObservatorioView from '@/app/components/ObservatorioView';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LOGO_URL = 'https://i.imgur.com/Yakcz6G.png';

const CATEGORIES = ['Monumento', 'Museu', 'Restaurante', 'Alojamento', 'Experiência', 'Espaço Público', 'Outro'];
const PLATFORMS = ['Google Maps', 'TripAdvisor', 'Booking.com', 'Outro'];

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
  accent: '#c9a84c',
  accentLight: '#e8cc7e',
  accentDim: '#7a6428',
  accentBg: 'rgba(201,168,76,0.12)',
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
}

interface AnalysisSnapshot {
  date: string;
  score: number;
  positive: number;
  negative: number;
  reviewCount: number;
  dimensions: Record<string, number>;
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
}

type ViewType = 'overview' | 'locais' | 'mapa' | 'comparar' | 'relatorio' | 'problemas' | 'observatorio' | 'detalhe';

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
            <span style={{ fontSize: 26, fontWeight: 700, color: ai != null ? scoreColor(ai) : C.textDim }}>{ai != null ? ai : '—'}</span>
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
  s >= 8.5 ? 'Excelente' : s >= 7 ? 'Bom' : s >= 5.5 ? 'Razoável' : s >= 4 ? 'Insatisfatório' : 'Crítico';

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

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
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
  const [importMode, setImportMode] = useState<'texto' | 'csv'>('texto');
  const [csvHasHeader, setCsvHasHeader] = useState(true);
  const [csvCol, setCsvCol] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [publicMode, setPublicMode] = useState(false);
  const [reportLocId, setReportLocId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [genReport, setGenReport] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const locationsRef = useRef<Location[]>([]);

  // Keep ref in sync with locations for use in stale closures
  useEffect(() => { locationsRef.current = locations; }, [locations]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ── Load from Firestore ──
  useEffect(() => {
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
      setLoading(false);
    })();
  }, []);

  // ── Check URL for public report mode ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get('r');
    if (reportId) {
      setPublicMode(true);
      setDetailId(reportId);
      setView('detalhe');
    }
  }, []);

  // ── Save ──
  const save = useCallback(async (locs: Location[]) => {
    setLocations(locs);
    try {
      for (const loc of locs) await setDoc(doc(db, 'locations', loc.id), loc);
    } catch (e) {
      console.error('Firestore save error:', e);
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
      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY || '';
      const sorted = sortedAnalyzed;
      const avg = (analyzed.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / analyzed.length).toFixed(1);
      const top = sorted.slice(0, 5).map((l) => `${l.name} (${l.analysis!.sentimentScore}/10)`);
      const bottom = [...sorted].reverse().slice(0, 5).map((l) => `${l.name} (${l.analysis!.sentimentScore}/10)`);
      const rowsP = analyzed.map((l) => ({ loc: l, probs: classifyProblems(l) })).filter((x) => Object.keys(x.probs).length > 0);
      const probAgg = PROBLEM_TAXONOMY
        .map((p) => ({ label: p.label, affected: rowsP.filter((x) => x.probs[p.id]).length }))
        .filter((p) => p.affected > 0).sort((a, b) => b.affected - a.affected).slice(0, 6);
      const problemas = probAgg.map((p) => `${p.label}: ${p.affected} ${p.affected === 1 ? 'local' : 'locais'}`);
      const div = analyzed.filter((l) => l.googleRating != null && l.analysis)
        .map((l) => `${l.name}: IA ${l.analysis!.sentimentScore}/10 vs Google ${l.googleRating} (${l.googleReviewCount || '?'} reviews)`).slice(0, 8);
      const mesAno = new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

      const prompt = `És analista de turismo do Município de Braga. Escreve o RELATÓRIO MENSAL DE REPUTAÇÃO TURÍSTICA referente a ${mesAno}, em português de Portugal (pt-PT), com tom institucional mas claro e útil.

DADOS REAIS (${analyzed.length} locais monitorizados; score médio de sentimento ${avg}/10):
- Melhor reputação: ${top.join('; ')}
- A acompanhar (reputação mais baixa): ${bottom.join('; ')}
- Problemas transversais mais frequentes nas críticas: ${problemas.join('; ') || 'nenhum relevante este período'}
- Reputação IA vs nota Google: ${div.join('; ') || 'sem dados de Google introduzidos'}

ESTRUTURA OBRIGATÓRIA — usa exatamente estes títulos, cada um numa linha começada por "## ":
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
- Máximo ~600 palavras. Sem tabelas, sem backticks, sem markdown além de ## e bullets "- ".`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) { const e = await res.text(); throw new Error(`HTTP ${res.status} — ${e.slice(0, 200)}`); }
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content?.trim() || '';
      if (!txt) throw new Error('Resposta vazia da IA.');
      setAiReport(txt);
      showToast('✓ Relatório mensal gerado');
    } catch (e: any) {
      setError(`Erro ao gerar relatório: ${e?.message || 'desconhecido'}`);
    } finally {
      setGenReport(false);
    }
  };

  const exportReportPDF = () => {
    const node = document.getElementById('ai-report-print');
    if (!node) return;
    const win = window.open('', '_blank', 'width=1100,height=860');
    if (!win) { alert('Permita pop-ups para exportar o PDF.'); return; }
    const hoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const mesAno = new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    const html =
      '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">' +
      '<title>Relatório Mensal de Reputação Turística — ' + mesAno + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{box-sizing:border-box;}' +
      'body{margin:0;font-family:"DM Sans",sans-serif;background:#0c0e14;color:#e2e0db;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.brand{display:flex;align-items:center;justify-content:space-between;padding:22px 30px;border-bottom:2px solid #c9a84c;}' +
      '.brand img{height:32px;}' +
      '.brand .meta{text-align:right;}' +
      '.brand h1{font-size:17px;margin:0;color:#c9a84c;letter-spacing:-0.01em;}' +
      '.brand .sub{font-size:12px;color:#9a99a0;margin-top:2px;}' +
      '.content{padding:24px 34px;max-width:820px;}' +
      'footer{padding:16px 30px;border-top:1px solid #252836;font-size:10px;color:#8a8c9e;display:flex;justify-content:space-between;}' +
      '@page{margin:14mm;}' +
      '</style></head><body>' +
      '<div class="brand"><img src="' + LOGO_URL + '" alt="Visit Braga">' +
      '<div class="meta"><h1>Relatório Mensal de Reputação Turística</h1><div class="sub">' + mesAno + ' · gerado em ' + hoje + '</div></div></div>' +
      '<div class="content">' + node.innerHTML + '</div>' +
      '<footer><span>Município de Braga · Divisão de Atividades Económicas e Turismo</span>' +
      '<span>Reputação Turística · análise assistida por IA</span></footer>' +
      '<script>setTimeout(function(){window.focus();window.print();},700);</script>' +
      '</body></html>';
    win.document.open(); win.document.write(html); win.document.close();
  };

  const analyze = async (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc || loc.reviews.length === 0) return;
    setAnalyzing(id);
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY || '';
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
        const partialRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
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
          throw new Error(`Bloco ${i + 1}/${chunks.length}: HTTP ${partialRes.status} — ${errBody.slice(0, 200)}`);
        }
        const partialData = await partialRes.json();
        partials.push(partialData.choices?.[0]?.message?.content || '');
        // Pausa para não estourar o rate limit do Groq (12k TPM no plano grátis)
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 35000));
        }
      }

      // ── Fase 2: síntese final em JSON ──
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
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
  "marketSources": ["lista de idiomas/países detetados nas reviews"]
}

Resumos parciais dos blocos:

${partials.map((p, idx) => `=== Bloco ${idx + 1}/${chunks.length} (${chunks[idx].length} reviews) ===\n${p}`).join('\n\n')}`,
          }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Síntese final: HTTP ${res.status} — ${errBody.slice(0, 200)}`);
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
      };
      save(locations.map((l) =>
        l.id === id
          ? { ...l, analysis, lastAnalyzed: nowIso, analysisHistory: [...(l.analysisHistory || []), snapshot] }
          : l
      ));
      showToast('✓ Análise concluída');
    } catch (e: any) {
      console.error('Erro análise:', e);
      setError(`Erro: ${e?.message || 'desconhecido'}`);
    } finally {
      setAnalyzing(null);
    }
  };

  // ── Share link ──
  const copyShareLink = (locId: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?r=${locId}`;
    navigator.clipboard.writeText(url);
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
          ${score != null ? `<div style="margin-bottom:8px"><span style="background:${color};color:#000;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:700">${score}/10 — ${scoreLabel(score)}</span></div>` : '<div style="font-size:11px;color:#8b8a8f">Sem análise ainda</div>'}
          ${loc.analysis?.summaryPT ? `<div style="font-size:12px;color:#8b8a8f;line-height:1.5;margin-top:6px">${loc.analysis.summaryPT.slice(0, 180)}…</div>` : ''}
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
  const avgScore = analyzed.length > 0
    ? analyzed.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / analyzed.length
    : null;

  const allPos = analyzed.flatMap((l) => l.analysis?.topThemesPositive || []);
  const allNeg = analyzed.flatMap((l) => l.analysis?.topThemesNegative || []);
  const allIssues = analyzed.flatMap((l) => l.analysis?.keyIssues || []);
  const allInsights = analyzed.flatMap((l) => l.analysis?.actionableInsights || []);
  const allMarkets = analyzed.flatMap((l) => l.analysis?.marketSources || []);

  const topPraises = countTop(allPos, 8);
  const topProblems = countTop(allNeg, 8);
  const marketFreq = countTop(allMarkets, 10);
  const insightDeduped = Array.from(new Set(allInsights)).slice(0, 9);

  const totalReviews = analyzed.reduce((s, l) => s + (l.analysis?.reviewCount || l.reviews.length), 0);

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
    dimension: DIM_LABELS[i].replace('/Qualidade', '/Qual.'),
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
    { id: 'overview', label: 'Visão Geral', icon: '◈' },
    { id: 'observatorio', label: 'Observatório', icon: '◔' },
    { id: 'locais', label: 'Locais', icon: '⊞' },
    { id: 'mapa', label: 'Mapa', icon: '◎' },
    { id: 'comparar', label: 'Comparar', icon: '⊟' },
    { id: 'problemas', label: 'Problemas', icon: '▦' },
    { id: 'relatorio', label: 'Relatório', icon: '≡' },
  ];

  // ── Report generator ──
  const generateReport = (locFilter?: Location[]) => {
    const targets = locFilter || sortedAnalyzed;
    const date = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const reportTotalReviews = targets.reduce((s, l) => s + (l.analysis?.reviewCount || l.reviews.length), 0);
    const reportAvgScore = targets.length > 0
      ? targets.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) / targets.length
      : null;
    const reportMarkets = Array.from(new Set(targets.flatMap((l) => l.analysis?.marketSources || [])));
    const reportProblems = countTop(targets.flatMap((l) => l.analysis?.topThemesNegative || []), 8);
    const reportPraises = countTop(targets.flatMap((l) => l.analysis?.topThemesPositive || []), 8);
    const reportInsights = Array.from(new Set(targets.flatMap((l) => l.analysis?.actionableInsights || []))).slice(0, 9);

    return [
      `RELATÓRIO DE REPUTAÇÃO TURÍSTICA — BRAGA`,
      `${'═'.repeat(50)}`,
      `Data: ${date}  |  Município de Braga`,
      `${'═'.repeat(50)}`,
      ``,
      `RESUMO EXECUTIVO`,
      `${'─'.repeat(40)}`,
      `• Locais analisados:        ${targets.length}`,
      `• Reviews processadas:      ${reportTotalReviews}`,
      `• Score global:             ${reportAvgScore?.toFixed(1) || 'N/D'}/10  (${reportAvgScore ? scoreLabel(reportAvgScore) : '—'})`,
      `• Mercados emissores:       ${reportMarkets.join(', ') || 'N/D'}`,
      ``,
      `RANKING POR LOCAL`,
      `${'─'.repeat(40)}`,
      ...targets.map((l, i) =>
        `${String(i + 1).padStart(2)}. ${l.name.padEnd(38)} ${l.analysis!.sentimentScore}/10  (${l.analysis!.reviewCount || l.reviews.length} reviews)`
      ),
      ``,
      `ANÁLISE DETALHADA`,
      `${'─'.repeat(40)}`,
      ...targets.flatMap((l) => [
        ``,
        `▶ ${l.name.toUpperCase()}`,
        `   Categoria: ${l.category}  ·  Plataforma: ${l.platform}`,
        `   Score: ${l.analysis!.sentimentScore}/10  —  ${scoreLabel(l.analysis!.sentimentScore)}`,
        `   Sentimento: ${l.analysis!.sentimentBreakdown.positive}% positivo · ${l.analysis!.sentimentBreakdown.neutral}% neutro · ${l.analysis!.sentimentBreakdown.negative}% negativo`,
        `   Reviews analisadas: ${l.analysis!.reviewCount || l.reviews.length}`,
        `   Mercados: ${l.analysis!.marketSources?.join(', ') || 'N/D'}`,
        ``,
        `   Resumo:`,
        `   ${l.analysis!.summaryPT}`,
        ``,
        `   Pontos Fortes:`,
        ...(l.analysis!.keyPraises || []).map((p) => `   + ${p}`),
        ``,
        `   Problemas:`,
        ...(l.analysis!.keyIssues || []).map((p) => `   − ${p}`),
        ``,
        `   Ações Recomendadas:`,
        ...(l.analysis!.actionableInsights || []).map((p, i) => `   ${i + 1}. ${p}`),
        ``,
        `   ${'─'.repeat(46)}`,
      ]),
      ``,
      `PROBLEMAS SISTÉMICOS`,
      `${'─'.repeat(40)}`,
      ...reportProblems.map(([p, c]) => `• ${p}${c > 1 ? `  [${c} locais]` : ''}`),
      ``,
      `ELOGIOS MAIS FREQUENTES`,
      `${'─'.repeat(40)}`,
      ...reportPraises.map(([p, c]) => `• ${p}${c > 1 ? `  [${c} locais]` : ''}`),
      ``,
      `AÇÕES PRIORITÁRIAS PARA O MUNICÍPIO`,
      `${'─'.repeat(40)}`,
      ...reportInsights.map((ins, i) => `${i + 1}. ${ins}`),
      ``,
      `${'═'.repeat(50)}`,
      `Relatório gerado automaticamente — Município de Braga`,
    ].join('\n');
  };

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: C.textMuted }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ width: 80, height: 'auto', marginBottom: 16, opacity: 0.8 }} />
          <div style={{ fontSize: 14 }}>A carregar dados…</div>
        </div>
      </div>
    );
  }

  // ─── PUBLIC REPORT VIEW ─── (when ?r=<id> in URL)
  if (publicMode) {
    if (!detailLoc || !detailLoc.analysis) {
      return (
        <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ width: 120, height: 'auto', opacity: 0.6 }} />
          <p style={{ color: C.textMuted, fontSize: 14 }}>Relatório não encontrado.</p>
        </div>
      );
    }

    return (
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
        {/* Botão exportar PDF (escondido na impressão) */}
        <button onClick={() => window.print()} className="no-print" style={{
          position: 'fixed', top: 20, right: 20, zIndex: 50,
          padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`,
          background: C.card, color: C.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>⬇ Guardar em PDF</button>

        {/* Public Header */}
        <header style={{
          background: `linear-gradient(180deg, ${C.card} 0%, ${C.bg} 100%)`,
          borderBottom: `1px solid ${C.border}`, padding: '32px 40px 28px',
          textAlign: 'center',
        }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ height: 56, width: 'auto', marginBottom: 18 }} />
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
            background: scoreBg(detailLoc.analysis.sentimentScore),
            border: `2px solid ${scoreColor(detailLoc.analysis.sentimentScore)}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}>{categoryIcon(detailLoc.category)}</div>
          <div style={{ fontSize: 11, color: C.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>
            Relatório de Reputação Turística
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{detailLoc.name}</h1>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>
            {detailLoc.category} · {detailLoc.platform} · {detailLoc.analysis.reviewCount || detailLoc.reviews.length} reviews analisadas
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 30px' }}>

          {/* Hero score */}
          <div style={{
            background: scoreBg(detailLoc.analysis.sentimentScore),
            border: `1px solid ${scoreColor(detailLoc.analysis.sentimentScore)}40`,
            borderRadius: 14, padding: '28px 32px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Score de Reputação</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 700, color: scoreColor(detailLoc.analysis.sentimentScore), lineHeight: 1 }}>
                  {detailLoc.analysis.sentimentScore}
                </span>
                <span style={{ fontSize: 22, color: C.textDim }}>/10</span>
                <span style={{ fontSize: 16, color: scoreColor(detailLoc.analysis.sentimentScore), marginLeft: 12, fontWeight: 600 }}>
                  {scoreLabel(detailLoc.analysis.sentimentScore)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.positive }}>{detailLoc.analysis.sentimentBreakdown.positive}%</div>
                <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Positivo</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.neutral }}>{detailLoc.analysis.sentimentBreakdown.neutral}%</div>
                <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Neutro</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.negative }}>{detailLoc.analysis.sentimentBreakdown.negative}%</div>
                <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Negativo</div>
              </div>
            </div>
          </div>

          {/* Comparação com Google */}
          <GoogleCompare loc={detailLoc} />

          {/* Summary */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Resumo Analítico</div>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: 0 }}>{detailLoc.analysis.summaryPT}</p>
            {detailLoc.analysis.marketSources && detailLoc.analysis.marketSources.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: C.textDim }}>Mercados emissores:</span>
                {detailLoc.analysis.marketSources.map((m, i) => (
                  <span key={i} style={{ fontSize: 11, background: C.infoBg, color: C.info, padding: '3px 10px', borderRadius: 8 }}>{m}</span>
                ))}
              </div>
            )}
          </div>

          {/* Evolução temporal */}
          {detailLoc.analysisHistory && detailLoc.analysisHistory.length >= 2 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Evolução da Reputação ao Longo do Tempo</div>
                {(() => {
                  const h = detailLoc.analysisHistory!;
                  const delta = +(h[h.length - 1].score - h[0].score).toFixed(1);
                  const col = delta > 0 ? C.positive : delta < 0 ? C.negative : C.textMuted;
                  return <span style={{ fontSize: 13, fontWeight: 700, color: col, background: delta > 0 ? C.positiveBg : delta < 0 ? C.negativeBg : C.border, padding: '3px 12px', borderRadius: 8 }}>
                    {delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '→ '}{delta} pts desde a 1ª análise
                  </span>;
                })()}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={detailLoc.analysisHistory.map((s) => ({ label: new Date(s.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }), score: s.score, negativo: s.negative }))} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                  <YAxis domain={[0, 10]} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} />
                  <Line type="monotone" dataKey="score" name="Score /10" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} />
                  <Line type="monotone" dataKey="negativo" name="% Negativo" stroke={C.negative} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Dimensions */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Dimensões de Avaliação</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {DIMS.map((d, i) => {
                const val = detailLoc.analysis!.dimensions?.[d] || 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: C.textMuted }}>{DIM_LABELS[i]}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(val) }}>{val}/10</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
                      <div style={{ width: `${val * 10}%`, height: '100%', background: scoreColor(val), borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Praises + Issues */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { title: '✦ Pontos Fortes', items: detailLoc.analysis.keyPraises || [], color: C.positive, sign: '+' },
              { title: '⚠ Problemas Identificados', items: detailLoc.analysis.keyIssues || [], color: C.negative, sign: '−' },
            ].map((col, ci) => (
              <div key={ci} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 26px' }}>
                <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.title}</div>
                {col.items.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < col.items.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'flex-start' }}>
                    <span style={{ color: col.color, fontSize: 14, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>{col.sign}</span>
                    <span style={{ fontSize: 13, lineHeight: 1.6 }}>{p}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Actionable Insights */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 28px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>💡 Sugestões Acionáveis para a Gestão</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {(detailLoc.analysis.actionableInsights || []).map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, lineHeight: 1.6 }}>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Themes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
            {[
              { title: 'Temas Positivos', items: detailLoc.analysis.topThemesPositive || [], color: C.positive, bg: C.positiveBg, prefix: '+' },
              { title: 'Temas Negativos', items: detailLoc.analysis.topThemesNegative || [], color: C.negative, bg: C.negativeBg, prefix: '−' },
            ].map((col, ci) => (
              <div key={ci} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 26px' }}>
                <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{col.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {col.items.map((t, i) => (
                    <span key={i} style={{ fontSize: 12, background: col.bg, color: col.color, padding: '6px 12px', borderRadius: 20 }}>{col.prefix} {t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer style={{
            textAlign: 'center', padding: '20px 0 40px',
            borderTop: `1px solid ${C.border}`, marginTop: 20,
          }}>
            <img src={LOGO_URL} alt="Visit Braga" style={{ height: 36, width: 'auto', opacity: 0.7, marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Município de Braga · Reputação Turística
            </div>
            {detailLoc.lastAnalyzed && (
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                Análise gerada em {new Date(detailLoc.lastAnalyzed).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            )}
          </footer>
        </div>
      </div>
    );
  }

  // ─── NORMAL APP VIEW ───
  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', color: C.text }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: 220, flexShrink: 0, background: C.sidebar,
        borderRight: `1px solid ${C.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20,
      }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: `1px solid ${C.sidebarBorder}`, textAlign: 'center' }}>
          <img src={LOGO_URL} alt="Visit Braga" style={{ height: 44, width: 'auto', marginBottom: 8 }} />
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Reputação</div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map((item) => {
            const isActive = view === item.id || (item.id === 'overview' && view === 'detalhe');
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', borderRadius: 8, border: 'none',
                  background: isActive ? C.accentBg : 'transparent',
                  color: isActive ? C.accent : C.textMuted,
                  cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  marginBottom: 2, textAlign: 'left',
                }}>
                <span style={{ fontSize: 15, lineHeight: 1, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.id === 'locais' && locations.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: C.border, color: C.textDim, padding: '1px 6px', borderRadius: 8 }}>
                    {locations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {avgScore !== null && (
          <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.sidebarBorder}` }}>
            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Score Global</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: C.textDim }}>/10</span>
            </div>
            <div style={{ fontSize: 11, color: scoreColor(avgScore), marginTop: 2 }}>{scoreLabel(avgScore)}</div>
            <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ width: `${(avgScore / 10) * 100}%`, height: '100%', background: scoreColor(avgScore), borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>{analyzed.length} locais · {totalReviews} reviews</div>
          </div>
        )}
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', minWidth: 0 }}>

        {/* ── OVERVIEW ── */}
        {view === 'overview' && (
          <div style={{ padding: '28px 30px' }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Visão Geral</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Análise consolidada de reputação turística · Município de Braga</p>
            </div>

            {analyzed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.25 }}>📊</div>
                <h2 style={{ fontSize: 20, marginBottom: 8, color: C.textMuted }}>Sem dados ainda</h2>
                <p style={{ color: C.textDim, fontSize: 13, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Adiciona locais, cola as reviews limpas e analisa com IA para ver o painel completo.
                </p>
                <button onClick={() => { setView('locais'); setShowAdd(true); }}
                  style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.accent, color: C.bg, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  + Adicionar Primeiro Local
                </button>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Score Global', value: avgScore!.toFixed(1), unit: '/10', sub: scoreLabel(avgScore!), color: scoreColor(avgScore!) },
                    { label: 'Locais Analisados', value: String(analyzed.length), unit: '', sub: `de ${locations.length} total`, color: C.accent },
                    { label: 'Reviews Processadas', value: String(totalReviews), unit: '', sub: 'análise IA', color: C.accentLight },
                    { label: 'Problemas Detetados', value: String(allIssues.length), unit: '', sub: 'issues identificadas', color: C.negative },
                    { label: 'Mercados Emissores', value: String(Array.from(new Set(allMarkets)).length), unit: '', sub: 'idiomas/países', color: C.info },
                  ].map((k, i) => (
                    <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
                      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{k.label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</span>
                        {k.unit && <span style={{ fontSize: 13, color: C.textDim }}>{k.unit}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: k.color, opacity: 0.8 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* PRIORIDADES DE MONITORIZAÇÃO */}
                {priorityLocs.length > 0 && (
                  <div style={{ background: C.card, border: `1px solid ${C.negative}30`, borderRadius: 12, padding: '18px 22px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.negative, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⚠ Locais a Acompanhar — menor reputação
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {priorityLocs.map((l) => {
                        const sc = l.analysis!.sentimentScore;
                        const issue = l.analysis!.keyIssues?.[0];
                        return (
                          <div key={l.id} onClick={() => { setDetailId(l.id); setView('detalhe'); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: C.bg, cursor: 'pointer', border: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 20 }}>{categoryIcon(l.category)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                              {issue && <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue}</div>}
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(sc), background: scoreBg(sc), padding: '4px 12px', borderRadius: 8 }}>{sc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Stats */}
                {categoryStats.length > 0 && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Score Médio por Categoria</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(categoryStats.length, 6)}, 1fr)`, gap: 12 }}>
                      {categoryStats.map((s) => (
                        <div key={s.cat} style={{ background: C.bg, borderRadius: 8, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>{categoryIcon(s.cat)}</span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>{s.cat}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 20, fontWeight: 700, color: scoreColor(s.avg) }}>{s.avg}</span>
                            <span style={{ fontSize: 11, color: C.textDim }}>/10</span>
                          </div>
                          <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{s.count} local{s.count !== 1 ? 'is' : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compact Ranking + Radar */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                  {/* Compact ranking list */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ranking por Sentimento</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>{sortedAnalyzed.length} locais</div>
                    </div>
                    <div style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>
                      {sortedAnalyzed.map((loc, i) => {
                        const sc = loc.analysis!.sentimentScore;
                        return (
                          <div key={loc.id} onClick={() => { setDetailId(loc.id); setView('detalhe'); }}
                            style={{
                              display: 'grid', gridTemplateColumns: '28px 1fr 110px 50px',
                              gap: 12, alignItems: 'center', padding: '7px 8px',
                              borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <span style={{ fontSize: 11, color: C.textDim, textAlign: 'right' }}>{i + 1}.</span>
                            <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ marginRight: 6 }}>{categoryIcon(loc.category)}</span>{loc.name}
                            </span>
                            <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                              <div style={{ width: `${sc * 10}%`, height: '100%', background: scoreColor(sc), borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(sc), textAlign: 'right' }}>{sc}/10</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radar */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Dimensões Médias</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="78%">
                        <PolarGrid stroke={C.border} />
                        <PolarAngleAxis dataKey="dimension" tick={{ fill: C.textMuted, fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke={C.accent} fill={C.accent} fillOpacity={0.22} strokeWidth={2} dot={{ fill: C.accent, r: 4 }} />
                        <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 8 }}>
                      {radarData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < radarData.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{d.dimension}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(d.value) }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Three-col panels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {[
                    { title: '✦ Elogios Frequentes', items: topPraises, color: C.positive, bg: C.positiveBg },
                    { title: '⚠ Problemas Recorrentes', items: topProblems, color: C.negative, bg: C.negativeBg },
                  ].map((col, ci) => (
                    <div key={ci} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
                      <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.title}</div>
                      {col.items.length === 0 && <p style={{ color: C.textDim, fontSize: 13 }}>Sem dados</p>}
                      {col.items.map(([text, count], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: i < col.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <span style={{ fontSize: 12, lineHeight: 1.45, flex: 1 }}>{text}</span>
                          {count > 1 && <span style={{ fontSize: 10, color: col.color, background: col.bg, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>{count}×</span>}
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, color: C.info, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>🌍 Mercados Emissores</div>
                    {marketFreq.length === 0
                      ? <p style={{ color: C.textDim, fontSize: 13, lineHeight: 1.5 }}>Analisa locais para detetar mercados emissores</p>
                      : marketFreq.map(([market, count], i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < marketFreq.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                          <span style={{ fontSize: 12 }}>{market}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 50, height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                              <div style={{ width: `${(count / (marketFreq[0]?.[1] || 1)) * 100}%`, height: '100%', background: C.info, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 10, color: C.textDim, minWidth: 16, textAlign: 'right' }}>{count}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Actions */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>💡 Ações Prioritárias para o Município</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {insightDeduped.map((ins, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 14px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, lineHeight: 1.55 }}>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location cards */}
                <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Detalhe por Local — clica para análise completa</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {sortedAnalyzed.map((loc) => (
                    <div key={loc.id} onClick={() => { setDetailId(loc.id); setView('detalhe'); }}
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accent + '60')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>{categoryIcon(loc.category)}</span>
                            <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{loc.name}</h4>
                          </div>
                          <span style={{ fontSize: 11, color: C.textDim }}>{loc.category} · {loc.platform}</span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor(loc.analysis!.sentimentScore), lineHeight: 1 }}>{loc.analysis!.sentimentScore}/10</div>
                          <div style={{ fontSize: 10, color: scoreColor(loc.analysis!.sentimentScore), marginTop: 2 }}>{scoreLabel(loc.analysis!.sentimentScore)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 12, gap: 1 }}>
                        <div style={{ width: `${loc.analysis!.sentimentBreakdown.positive}%`, background: C.positive }} />
                        <div style={{ width: `${loc.analysis!.sentimentBreakdown.neutral}%`, background: C.neutral }} />
                        <div style={{ width: `${loc.analysis!.sentimentBreakdown.negative}%`, background: C.negative }} />
                      </div>
                      <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55, margin: '0 0 12px' }}>
                        {loc.analysis!.summaryPT}
                      </p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {loc.analysis!.topThemesPositive?.slice(0, 2).map((t, i) => (
                          <span key={i} style={{ fontSize: 10, background: C.positiveBg, color: C.positive, padding: '3px 8px', borderRadius: 10 }}>+ {t}</span>
                        ))}
                        {loc.analysis!.topThemesNegative?.slice(0, 2).map((t, i) => (
                          <span key={i} style={{ fontSize: 10, background: C.negativeBg, color: C.negative, padding: '3px 8px', borderRadius: 10 }}>− {t}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 10, color: C.textDim }}>{loc.analysis!.reviewCount || loc.reviews.length} reviews · Ver análise completa →</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── LOCAIS ── */}
        {view === 'locais' && (
          <div style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Locais Monitorizados</h1>
                <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>{locations.length} local{locations.length !== 1 ? 'is' : ''} · {analyzed.length} analisado{analyzed.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowAdd(true)}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: C.accent, color: C.bg, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                + Adicionar Local
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="🔍  Pesquisar locais…"
                style={{ ...IS, maxWidth: 320, flex: 1 }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Todos', ...CATEGORIES].map((cat) => (
                  <button key={cat} onClick={() => setFilterCat(cat)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: `1px solid ${filterCat === cat ? C.accent : C.border}`,
                      background: filterCat === cat ? C.accentBg : 'transparent',
                      color: filterCat === cat ? C.accent : C.textMuted,
                      cursor: 'pointer', fontSize: 12, fontWeight: filterCat === cat ? 600 : 400,
                    }}>
                    {cat !== 'Todos' && filterCat === cat ? categoryIcon(cat) + ' ' : ''}{cat}
                  </button>
                ))}
              </div>
            </div>

            {searchQ && (
              <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10 }}>
                {filteredLocations.length} resultado{filteredLocations.length !== 1 ? 's' : ''} para &quot;{searchQ}&quot;
              </div>
            )}

            {filteredLocations.length === 0 && (
              <p style={{ textAlign: 'center', padding: 60, color: C.textMuted, fontSize: 14 }}>
                {locations.length === 0 ? 'Nenhum local adicionado ainda.' : 'Nenhum resultado encontrado.'}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredLocations.map((loc) => {
                const isOpen = selId === loc.id;
                const isAnalyzing = analyzing === loc.id;
                return (
                  <div key={loc.id} style={{ background: isOpen ? C.cardHover : C.card, border: `1px solid ${isOpen ? C.accent + '50' : C.border}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.15s' }}>
                    <div onClick={() => setSelId(isOpen ? null : loc.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                          background: loc.analysis ? scoreBg(loc.analysis.sentimentScore) : C.border,
                          border: `1px solid ${loc.analysis ? scoreColor(loc.analysis.sentimentScore) + '40' : C.borderLight}`,
                        }}>{categoryIcon(loc.category)}</div>
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 3px' }}>{loc.name}</h4>
                          <span style={{ fontSize: 11, color: C.textDim }}>
                            {loc.category} · {loc.platform} · {loc.reviews.length} review{loc.reviews.length !== 1 ? 's' : ''}
                            {loc.coords && <span style={{ marginLeft: 6, color: C.info }}>· 📍 geo</span>}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {loc.analysis ? (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(loc.analysis.sentimentScore), lineHeight: 1 }}>{loc.analysis.sentimentScore}/10</div>
                            <div style={{ fontSize: 10, color: scoreColor(loc.analysis.sentimentScore) }}>{scoreLabel(loc.analysis.sentimentScore)}</div>
                          </div>
                        ) : loc.reviews.length > 0 ? (
                          <span style={{ fontSize: 11, color: C.neutral, background: C.neutralBg, padding: '4px 10px', borderRadius: 8 }}>Por analisar</span>
                        ) : (
                          <span style={{ fontSize: 11, color: C.textDim, background: C.border, padding: '4px 10px', borderRadius: 8 }}>Sem reviews</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); startEdit(loc); }}
                          title="Editar"
                          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 12 }}>✎</button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`Apagar "${loc.name}"?`)) deleteLoc(loc.id); }}
                          title="Apagar"
                          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textDim, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                          <button onClick={(e) => { e.stopPropagation(); setSelId(loc.id); setShowReview(true); }}
                            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                            📋 Colar Reviews
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); analyze(loc.id); }}
                            disabled={loc.reviews.length === 0 || !!analyzing}
                            style={{
                              padding: '8px 16px', borderRadius: 8, border: 'none',
                              background: loc.reviews.length === 0 || !!analyzing ? C.border : C.accent,
                              color: loc.reviews.length === 0 || !!analyzing ? C.textDim : C.bg,
                              cursor: loc.reviews.length === 0 || !!analyzing ? 'not-allowed' : 'pointer',
                              fontSize: 12, fontWeight: 600,
                            }}>
                            {isAnalyzing ? '⏳ A analisar…' : '🤖 Analisar com IA'}
                          </button>
                          {loc.analysis && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setDetailId(loc.id); setView('detalhe'); }}
                                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 12 }}>
                                Ver Análise Completa →
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); copyShareLink(loc.id); }}
                                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${copiedLinkId === loc.id ? C.positive : C.border}`, background: copiedLinkId === loc.id ? C.positiveBg : 'transparent', color: copiedLinkId === loc.id ? C.positive : C.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                                {copiedLinkId === loc.id ? '✓ Link copiado' : '🔗 Link Partilhável'}
                              </button>
                            </>
                          )}
                        </div>

                        {error && analyzing === null && (
                          <p style={{ color: C.negative, fontSize: 12, margin: '0 0 12px' }}>{error}</p>
                        )}

                        {loc.analysis && (
                          <div style={{ background: C.bg, borderRadius: 10, padding: 16, marginBottom: 14 }}>
                            <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8, gap: 1 }}>
                              <div style={{ width: `${loc.analysis.sentimentBreakdown.positive}%`, background: C.positive }} />
                              <div style={{ width: `${loc.analysis.sentimentBreakdown.neutral}%`, background: C.neutral }} />
                              <div style={{ width: `${loc.analysis.sentimentBreakdown.negative}%`, background: C.negative }} />
                            </div>
                            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.textDim, marginBottom: 12, flexWrap: 'wrap' }}>
                              <span style={{ color: C.positive }}>▮ {loc.analysis.sentimentBreakdown.positive}% pos</span>
                              <span style={{ color: C.neutral }}>▮ {loc.analysis.sentimentBreakdown.neutral}% neu</span>
                              <span style={{ color: C.negative }}>▮ {loc.analysis.sentimentBreakdown.negative}% neg</span>
                              <span style={{ marginLeft: 'auto' }}>Analisado em {new Date(loc.lastAnalyzed!).toLocaleDateString('pt-PT')}</span>
                            </div>
                            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, margin: '0 0 14px' }}>{loc.analysis.summaryPT}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                              <div>
                                <div style={{ fontSize: 10, color: C.positive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Pontos Fortes</div>
                                {loc.analysis.keyPraises?.map((p, i) => <div key={i} style={{ fontSize: 12, padding: '3px 0', color: C.text, lineHeight: 1.4 }}>+ {p}</div>)}
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: C.negative, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Problemas</div>
                                {loc.analysis.keyIssues?.map((p, i) => <div key={i} style={{ fontSize: 12, padding: '3px 0', color: C.text, lineHeight: 1.4 }}>− {p}</div>)}
                              </div>
                            </div>
                          </div>
                        )}

                        {loc.reviews.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Reviews Coladas ({loc.reviews.length})</div>
                            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {loc.reviews.map((rev) => (
                                <div key={rev.id} style={{ background: C.bg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.textMuted, lineHeight: 1.5, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                  <span style={{ flex: 1 }}>{rev.text.slice(0, 130)}{rev.text.length > 130 ? '…' : ''}</span>
                                  <button onClick={() => deleteReview(loc.id, rev.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAPA ── */}
        {view === 'mapa' && (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>Mapa de Reputação</h1>
                <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>
                  {analyzed.length} local{analyzed.length !== 1 ? 'is' : ''} com análise · <span style={{ color: C.accent }}>arrasta marcadores para reposicionar</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {[
                  { color: C.positive, label: '≥ 7.5' },
                  { color: C.neutral, label: '5–7.5' },
                  { color: C.negative, label: '< 5' },
                  { color: '#4a4960', label: 'Sem análise' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: 11, color: C.textMuted }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div ref={mapRef} style={{ flex: 1 }} />
          </div>
        )}

        {/* ── DETALHE ── */}
        {view === 'detalhe' && (
          <div style={{ padding: '28px 30px' }}>
            <button onClick={() => setView('overview')}
              style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: 13, marginBottom: 18, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Voltar ao painel
            </button>

            {!detailLoc ? (
              <p style={{ color: C.textMuted }}>Local não encontrado.</p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 40 }}>{categoryIcon(detailLoc.category)}</span>
                    <div>
                      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{detailLoc.name}</h1>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: C.textDim, background: C.border, padding: '3px 10px', borderRadius: 8 }}>{detailLoc.category}</span>
                        <span style={{ fontSize: 12, color: C.textDim, background: C.border, padding: '3px 10px', borderRadius: 8 }}>{detailLoc.platform}</span>
                        {detailLoc.coords && <span style={{ fontSize: 11, color: C.info }}>📍 {detailLoc.coords[0].toFixed(4)}, {detailLoc.coords[1].toFixed(4)}</span>}
                        {detailLoc.lastAnalyzed && <span style={{ fontSize: 11, color: C.textDim }}>Analisado a {new Date(detailLoc.lastAnalyzed).toLocaleString('pt-PT')}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelId(detailLoc.id); setShowReview(true); }}
                      style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      📋 Colar Reviews
                    </button>
                    <button onClick={() => analyze(detailLoc.id)} disabled={detailLoc.reviews.length === 0 || !!analyzing}
                      style={{
                        padding: '9px 16px', borderRadius: 8, border: 'none',
                        background: detailLoc.reviews.length === 0 || !!analyzing ? C.border : C.accent,
                        color: detailLoc.reviews.length === 0 || !!analyzing ? C.textDim : C.bg,
                        cursor: detailLoc.reviews.length === 0 || !!analyzing ? 'not-allowed' : 'pointer',
                        fontSize: 12, fontWeight: 600,
                      }}>
                      {analyzing === detailLoc.id ? '⏳ A analisar…' : '🤖 Reanalisar com IA'}
                    </button>
                    {detailLoc.analysis && (
                      <>
                        <button onClick={() => copyShareLink(detailLoc.id)}
                          style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${copiedLinkId === detailLoc.id ? C.positive : C.border}`, background: copiedLinkId === detailLoc.id ? C.positiveBg : 'transparent', color: copiedLinkId === detailLoc.id ? C.positive : C.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          {copiedLinkId === detailLoc.id ? '✓ Link copiado' : '🔗 Link Partilhável'}
                        </button>
                        <div style={{ background: scoreBg(detailLoc.analysis.sentimentScore), border: `1px solid ${scoreColor(detailLoc.analysis.sentimentScore)}40`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                          <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(detailLoc.analysis.sentimentScore), lineHeight: 1 }}>{detailLoc.analysis.sentimentScore}</div>
                          <div style={{ fontSize: 11, color: scoreColor(detailLoc.analysis.sentimentScore), marginTop: 2 }}>/10 — {scoreLabel(detailLoc.analysis.sentimentScore)}</div>
                          <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>{detailLoc.analysis.reviewCount || detailLoc.reviews.length} reviews</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {error && <p style={{ color: C.negative, fontSize: 13, marginBottom: 14 }}>{error}</p>}

                {!detailLoc.analysis ? (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
                    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>
                      {detailLoc.reviews.length === 0 ? 'Cola reviews para este local e depois clica em Analisar.' : `${detailLoc.reviews.length} reviews prontas para analisar. Clica em "Reanalisar com IA".`}
                    </p>
                  </div>
                ) : (
                  <>
                    <GoogleCompare loc={detailLoc} />
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Resumo Analítico</div>
                      <p style={{ fontSize: 14, color: C.text, lineHeight: 1.75, margin: 0 }}>{detailLoc.analysis.summaryPT}</p>
                      {detailLoc.analysis.marketSources && detailLoc.analysis.marketSources.length > 0 && (
                        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: C.textDim }}>Mercados emissores:</span>
                          {detailLoc.analysis.marketSources.map((m, i) => (
                            <span key={i} style={{ fontSize: 11, background: C.infoBg, color: C.info, padding: '2px 8px', borderRadius: 8 }}>{m}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ═══ EVOLUÇÃO TEMPORAL ═══ */}
                    {(() => {
                      const hist = detailLoc.analysisHistory || [];
                      const chartData = hist.map((h) => ({
                        label: new Date(h.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
                        score: h.score,
                        negativo: h.negative,
                        reviews: h.reviewCount,
                      }));
                      const first = hist[0];
                      const last = hist[hist.length - 1];
                      const delta = first && last ? +(last.score - first.score).toFixed(1) : 0;
                      const deltaColor = delta > 0 ? C.positive : delta < 0 ? C.negative : C.textMuted;
                      return (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Evolução Temporal da Reputação</div>
                            {hist.length >= 2 && (
                              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: C.textMuted }}>{hist.length} análises registadas</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: deltaColor, background: delta > 0 ? C.positiveBg : delta < 0 ? C.negativeBg : C.border, padding: '3px 12px', borderRadius: 8 }}>
                                  {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {delta > 0 ? '+' : ''}{delta} pts desde a 1ª análise
                                </span>
                              </div>
                            )}
                          </div>
                          {hist.length < 2 ? (
                            <div style={{ textAlign: 'center', padding: '28px 16px', color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
                              📈 Esta é a primeira análise deste local.<br />
                              Volta a analisar no futuro (ex.: após uma intervenção ou nova época) para começares a medir a evolução da reputação ao longo do tempo.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={240}>
                              <LineChart data={chartData} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                                <XAxis dataKey="label" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                                <YAxis domain={[0, 10]} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
                                <Tooltip
                                  contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                                  labelStyle={{ color: C.text }}
                                  itemStyle={{ color: C.text }}
                                />
                                <Line type="monotone" dataKey="score" name="Score /10" stroke={C.accent} strokeWidth={2.5} dot={{ r: 4, fill: C.accent }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="negativo" name="% Negativo" stroke={C.negative} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Distribuição de Sentimento</div>
                        <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 18, gap: 1 }}>
                          <div style={{ width: `${detailLoc.analysis.sentimentBreakdown.positive}%`, background: C.positive }} />
                          <div style={{ width: `${detailLoc.analysis.sentimentBreakdown.neutral}%`, background: C.neutral }} />
                          <div style={{ width: `${detailLoc.analysis.sentimentBreakdown.negative}%`, background: C.negative }} />
                        </div>
                        {[
                          { label: 'Positivo', value: detailLoc.analysis.sentimentBreakdown.positive, color: C.positive },
                          { label: 'Neutro', value: detailLoc.analysis.sentimentBreakdown.neutral, color: C.neutral },
                          { label: 'Negativo', value: detailLoc.analysis.sentimentBreakdown.negative, color: C.negative },
                        ].map((s, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />{s.label}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}%</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Dimensões de Avaliação</div>
                        {DIMS.map((d, i) => {
                          const val = detailLoc.analysis!.dimensions?.[d] || 0;
                          return (
                            <div key={i} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 12, color: C.textMuted }}>{DIM_LABELS[i]}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(val) }}>{val}/10</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                                <div style={{ width: `${val * 10}%`, height: '100%', background: scoreColor(val), borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      {[
                        { title: '✦ Pontos Fortes', items: detailLoc.analysis.keyPraises || [], color: C.positive, sign: '+' },
                        { title: '⚠ Problemas Identificados', items: detailLoc.analysis.keyIssues || [], color: C.negative, sign: '−' },
                      ].map((col, ci) => (
                        <div key={ci} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                          <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.title}</div>
                          {col.items.map((p, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < col.items.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'flex-start' }}>
                              <span style={{ color: col.color, fontSize: 14, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>{col.sign}</span>
                              <span style={{ fontSize: 13, lineHeight: 1.55 }}>{p}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>💡 Sugestões Acionáveis para a Gestão</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                        {(detailLoc.analysis.actionableInsights || []).map((ins, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 14px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}`, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 12, color: C.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                            <span style={{ fontSize: 13, lineHeight: 1.55 }}>{ins}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      {[
                        { title: 'Temas Positivos', items: detailLoc.analysis.topThemesPositive || [], color: C.positive, bg: C.positiveBg, prefix: '+' },
                        { title: 'Temas Negativos', items: detailLoc.analysis.topThemesNegative || [], color: C.negative, bg: C.negativeBg, prefix: '−' },
                      ].map((col, ci) => (
                        <div key={ci} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
                          <div style={{ fontSize: 11, color: col.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{col.title}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {col.items.map((t, i) => (
                              <span key={i} style={{ fontSize: 12, background: col.bg, color: col.color, padding: '5px 12px', borderRadius: 20 }}>{col.prefix} {t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                      <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        Todas as Reviews ({detailLoc.reviews.length})
                      </div>
                      <div style={{ maxHeight: 450, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                        {detailLoc.reviews.map((rev, i) => (
                          <div key={rev.id} style={{ background: C.bg, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 10, color: C.textDim, flexShrink: 0, marginTop: 3, minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                            <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, flex: 1 }}>{rev.text}</span>
                            <button onClick={() => deleteReview(detailLoc.id, rev.id)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: 12, flexShrink: 0, padding: '2px 4px' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── COMPARAR ── */}
        {view === 'comparar' && (
          <div style={{ padding: '28px 30px' }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Comparar Locais</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Seleciona até 4 locais analisados para comparação lado a lado</p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {analyzed.map((loc) => {
                const isSel = compareIds.includes(loc.id);
                return (
                  <button key={loc.id} onClick={() => setCompareIds(isSel ? compareIds.filter((id) => id !== loc.id) : compareIds.length < 4 ? [...compareIds, loc.id] : compareIds)}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      border: `1px solid ${isSel ? scoreColor(loc.analysis!.sentimentScore) : C.border}`,
                      background: isSel ? scoreBg(loc.analysis!.sentimentScore) : C.card,
                      color: isSel ? scoreColor(loc.analysis!.sentimentScore) : C.textMuted,
                      cursor: 'pointer', fontSize: 12, fontWeight: isSel ? 600 : 400,
                    }}>
                    {categoryIcon(loc.category)} {loc.name} — {loc.analysis!.sentimentScore}/10
                  </button>
                );
              })}
            </div>

            {compareIds.length < 2 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 60, textAlign: 'center' }}>
                <p style={{ color: C.textMuted, fontSize: 14 }}>Seleciona pelo menos 2 locais para comparar.</p>
              </div>
            ) : (
              <>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', width: 160 }}>Dimensão</th>
                        {compareIds.map((id) => {
                          const l = locations.find((x) => x.id === id)!;
                          return (
                            <th key={id} style={{ padding: '14px 20px', textAlign: 'center', fontSize: 12 }}>
                              <div style={{ marginBottom: 4 }}>{categoryIcon(l.category)} {l.name}</div>
                              <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(l.analysis!.sentimentScore) }}>{l.analysis!.sentimentScore}/10</div>
                              <div style={{ fontSize: 10, color: scoreColor(l.analysis!.sentimentScore) }}>{scoreLabel(l.analysis!.sentimentScore)}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'sentimentScore', label: 'Score Global', fmt: (v: number) => v + '/10' },
                        { key: 'positive', label: 'Sentimento Positivo', fmt: (v: number) => v + '%' },
                        { key: 'negative', label: 'Sentimento Negativo', fmt: (v: number) => v + '%' },
                        ...DIMS.map((d, i) => ({ key: `dim_${d}`, label: DIM_LABELS[i], fmt: (v: number) => v + '/10' })),
                        { key: 'reviewCount', label: 'Nº Reviews', fmt: (v: number) => String(v) },
                      ].map((row, ri) => {
                        const vals = compareIds.map((id) => {
                          const l = locations.find((x) => x.id === id)!;
                          const a = l.analysis!;
                          if (row.key === 'sentimentScore') return a.sentimentScore;
                          if (row.key === 'positive') return a.sentimentBreakdown.positive;
                          if (row.key === 'negative') return a.sentimentBreakdown.negative;
                          if (row.key.startsWith('dim_')) return a.dimensions?.[row.key.slice(4)] || 0;
                          if (row.key === 'reviewCount') return a.reviewCount || 0;
                          return 0;
                        });
                        const maxVal = Math.max(...vals);
                        const minVal = Math.min(...vals);
                        return (
                          <tr key={ri} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '11px 20px', fontSize: 12, color: C.textMuted }}>{row.label}</td>
                            {vals.map((val, vi) => {
                              const isBest = val === maxVal && maxVal !== minVal && row.key !== 'negative';
                              const isWorst = val === minVal && maxVal !== minVal && row.key !== 'negative';
                              return (
                                <td key={vi} style={{ padding: '11px 20px', textAlign: 'center', fontSize: 13, fontWeight: isBest || isWorst ? 700 : 400, color: isBest ? C.positive : isWorst ? C.negative : C.text }}>
                                  {row.fmt(val)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                  <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Comparação Visual — Dimensões</div>
                  {DIMS.map((d, di) => (
                    <div key={di} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{DIM_LABELS[di]}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {compareIds.map((id, ci) => {
                          const loc = locations.find((l) => l.id === id)!;
                          const val = loc.analysis!.dimensions?.[d] || 0;
                          const colors = [C.accent, C.info, C.positive, C.purple];
                          return (
                            <div key={id} style={{ flex: 1 }}>
                              <div style={{ height: 22, borderRadius: 4, background: C.border, overflow: 'hidden', marginBottom: 3 }}>
                                <div style={{ width: `${val * 10}%`, height: '100%', background: colors[ci], opacity: 0.85 }} />
                              </div>
                              <div style={{ fontSize: 10, color: colors[ci], textAlign: 'center', fontWeight: 600 }}>{val}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
                    {compareIds.map((id, ci) => {
                      const loc = locations.find((l) => l.id === id)!;
                      const colors = [C.accent, C.info, C.positive, C.purple];
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: colors[ci] }} />
                          <span style={{ fontSize: 12, color: C.textMuted }}>{loc.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── OBSERVATÓRIO ── */}
        {view === 'observatorio' && (
          <ObservatorioView
            reputacaoMedia={avgScore}
            reputacaoLocais={analyzed.length}
            reputacaoReviews={totalReviews}
          />
        )}

        {/* ── PROBLEMAS (taxonomia + mapa de calor) ── */}
        {view === 'problemas' && (() => {
          const rows = analyzed
            .map((l) => ({ loc: l, probs: classifyProblems(l) }))
            .filter((x) => Object.keys(x.probs).length > 0)
            .sort((a, b) =>
              Object.values(b.probs).reduce((s, n) => s + n, 0) -
              Object.values(a.probs).reduce((s, n) => s + n, 0));
          const agg = PROBLEM_TAXONOMY.map((p) => {
            const affected = rows.filter((r) => r.probs[p.id]);
            return { ...p, affected: affected.length, total: affected.reduce((s, r) => s + r.probs[p.id], 0), locs: affected.map((r) => r.loc.name) };
          }).filter((p) => p.affected > 0).sort((a, b) => b.affected - a.affected || b.total - a.total);
          const cols = agg;
          const maxAff = Math.max(...agg.map((a) => a.affected), 1);

          return (
            <div style={{ padding: '28px 30px' }}>
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Problemas da Cidade</h1>
                <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Classificação automática das críticas em categorias fixas, agregada ao nível da cidade. Permite ver padrões transversais a vários locais.</p>
              </div>

              {rows.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
                  <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Ainda não há problemas classificáveis. Analisa locais com reviews para que as críticas sejam categorizadas automaticamente.</p>
                </div>
              ) : (
                <>
                  {/* KPIs rápidos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {agg.slice(0, 3).map((p, i) => (
                      <div key={p.id} style={{ background: C.card, border: `1px solid ${i === 0 ? C.negative + '40' : C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{i === 0 ? 'Problema nº1' : `Problema nº${i + 1}`}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 22 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.label}</div>
                            <div style={{ fontSize: 11, color: C.negative }}>afeta {p.affected} {p.affected === 1 ? 'local' : 'locais'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ranking de problemas */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Ranking — nº de locais afetados por cada problema</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {agg.map((p) => (
                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 130px', gap: 12, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: 15 }}>{p.icon}</span>
                            <span style={{ fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</span>
                          </div>
                          <div style={{ height: 18, borderRadius: 5, background: C.bg, overflow: 'hidden', position: 'relative' }}>
                            <div style={{ width: `${(p.affected / maxAff) * 100}%`, height: '100%', background: C.negative, opacity: 0.55, borderRadius: 5 }} />
                          </div>
                          <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.locs.join(', ')}>
                            <strong style={{ color: C.text }}>{p.affected}</strong> {p.affected === 1 ? 'local' : 'locais'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mapa de calor problema × local */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mapa de Calor — problema × local</div>
                      <div style={{ fontSize: 10, color: C.textDim }}>intensidade = nº de termos que correspondem ao problema</div>
                    </div>
                    {/* Legenda dos ícones */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      {cols.map((p) => (
                        <span key={p.id} style={{ fontSize: 10, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>{p.icon} {p.short}</span>
                      ))}
                    </div>
                    <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${cols.length}, 46px)`, gap: 3, minWidth: 'fit-content' }}>
                        {/* Cabeçalho */}
                        <div style={{ position: 'sticky', left: 0, background: C.card, zIndex: 1 }} />
                        {cols.map((p) => (
                          <div key={p.id} title={p.label} style={{ fontSize: 16, textAlign: 'center', paddingBottom: 6, cursor: 'default' }}>{p.icon}</div>
                        ))}
                        {/* Linhas */}
                        {rows.map(({ loc, probs }) => (
                          <div key={loc.id} style={{ display: 'contents' }}>
                            <div onClick={() => { setDetailId(loc.id); setView('detalhe'); }}
                              style={{ position: 'sticky', left: 0, background: C.card, zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, cursor: 'pointer', borderRight: `1px solid ${C.border}` }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>{categoryIcon(loc.category)}</span>
                              <span style={{ fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.name}</span>
                            </div>
                            {cols.map((p) => {
                              const n = probs[p.id] || 0;
                              return (
                                <div key={p.id} title={n > 0 ? `${loc.name} — ${p.label}: ${n}` : ''}
                                  style={{ height: 34, borderRadius: 6, background: problemCellBg(n), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: n > 0 ? '#fff' : 'transparent', border: `1px solid ${n > 0 ? 'transparent' : C.border}` }}>
                                  {n > 0 ? n : ''}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: C.textDim, margin: '14px 0 0', lineHeight: 1.5 }}>
                      A classificação é automática, a partir dos problemas e temas negativos detetados pela IA em cada local. Clica num local para ver a análise completa. É uma leitura de padrões, não um diagnóstico fechado.
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* ── RELATÓRIO ── */}
        {view === 'relatorio' && (
          <div style={{ padding: '28px 30px' }}>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Relatórios e Partilha</h1>
              <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Gera relatórios completos ou links públicos partilháveis por POI</p>
            </div>

            {analyzed.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 60, textAlign: 'center' }}>
                <p style={{ color: C.textMuted, fontSize: 14 }}>Analisa locais para gerar relatórios.</p>
              </div>
            ) : (
              <>
                {/* Relatório Mensal Executivo (IA) */}
                <div style={{ background: C.card, border: `1px solid ${C.accent}40`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>✨ Relatório Mensal Executivo (IA)</div>
                      <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.5 }}>Texto escrito pela IA a partir dos dados de reputação ({analyzed.length} locais, score médio e problemas transversais), pronto a exportar com a marca Visit Braga.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {aiReport && (
                        <button onClick={exportReportPDF}
                          style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accentBg, color: C.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          ⬇ Exportar PDF
                        </button>
                      )}
                      <button onClick={generateAIReport} disabled={genReport}
                        style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: genReport ? C.border : C.accent, color: genReport ? C.textDim : C.bg, cursor: genReport ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {genReport ? '⏳ A gerar…' : aiReport ? '↻ Regenerar' : '✨ Gerar relatório'}
                      </button>
                    </div>
                  </div>

                  {aiReport ? (
                    <div id="ai-report-print" style={{ marginTop: 18, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '22px 26px' }}>
                      <AIReportBody text={aiReport} />
                    </div>
                  ) : (
                    <div style={{ marginTop: 16, background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '20px 22px', fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                      Clica em <strong style={{ color: C.accentLight }}>Gerar relatório</strong> para a IA redigir um sumário executivo do mês — destaques, locais a acompanhar, problemas transversais e recomendações de monitorização. Demora alguns segundos (uma chamada à IA).
                    </div>
                  )}
                </div>

                {/* Per-POI shareable links */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>🔗 Links Partilháveis por POI</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>Cada link mostra um relatório institucional público com a marca Visit Braga</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
                    {sortedAnalyzed.map((loc) => (
                      <div key={loc.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 10, padding: '10px 14px', background: C.bg,
                        borderRadius: 8, border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14 }}>{categoryIcon(loc.category)}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                          </div>
                          <div style={{ fontSize: 10, color: C.textDim }}>
                            <span style={{ color: scoreColor(loc.analysis!.sentimentScore) }}>{loc.analysis!.sentimentScore}/10</span> · {loc.analysis!.reviewCount || loc.reviews.length} reviews
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => { setDetailId(loc.id); setView('detalhe'); }}
                            title="Ver"
                            style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 11 }}>
                            👁
                          </button>
                          <button onClick={() => copyShareLink(loc.id)}
                            style={{
                              padding: '6px 12px', borderRadius: 6,
                              border: `1px solid ${copiedLinkId === loc.id ? C.positive : C.accent}`,
                              background: copiedLinkId === loc.id ? C.positiveBg : C.accentBg,
                              color: copiedLinkId === loc.id ? C.positive : C.accent,
                              cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                            }}>
                            {copiedLinkId === loc.id ? '✓' : '🔗'} Copiar Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full report */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>📄 Relatório Consolidado</div>
                      <div style={{ fontSize: 11, color: C.textDim }}>
                        Relatório completo {reportLocId ? `de "${reportLoc?.name}"` : `com todos os ${analyzed.length} locais analisados`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select value={reportLocId || ''} onChange={(e) => setReportLocId(e.target.value || null)}
                        style={{ ...IS, width: 'auto', minWidth: 200 }}>
                        <option value="">— Todos os locais —</option>
                        {sortedAnalyzed.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <button onClick={() => {
                        const targets = reportLocId ? sortedAnalyzed.filter((l) => l.id === reportLocId) : sortedAnalyzed;
                        navigator.clipboard.writeText(generateReport(targets));
                        setCopiedReport(true);
                        setTimeout(() => setCopiedReport(false), 2000);
                      }}
                        style={{
                          padding: '10px 18px', borderRadius: 8, border: 'none',
                          background: copiedReport ? C.positive : C.accent,
                          color: copiedReport ? '#000' : C.bg,
                          cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.3s',
                        }}>
                        {copiedReport ? '✓ Copiado!' : '📋 Copiar Relatório'}
                      </button>
                    </div>
                  </div>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, maxHeight: 600, overflowY: 'auto' }}>
                    <pre style={{ fontSize: 11, lineHeight: 1.8, color: C.text, whiteSpace: 'pre-wrap', fontFamily: 'DM Mono, "Courier New", monospace', margin: 0, wordBreak: 'break-word' }}>
                      {generateReport(reportLocId ? sortedAnalyzed.filter((l) => l.id === reportLocId) : sortedAnalyzed)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* ═══ MODAL: ADD LOCATION ═══ */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28, width: 440, maxWidth: '90vw' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Novo Local</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Nome do Local</label>
                <input value={newLoc.name} list="braga-pois-list" onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                  placeholder="Começa a escrever — sugestões aparecem" style={IS} autoFocus />
                <datalist id="braga-pois-list">
                  {KNOWN_POI_NAMES.map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Categoria</label>
                  <select value={newLoc.category} onChange={(e) => setNewLoc({ ...newLoc, category: e.target.value })} style={IS}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Plataforma</label>
                  <select value={newLoc.platform} onChange={(e) => setNewLoc({ ...newLoc, platform: e.target.value })} style={IS}>
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Coordenadas (opcional)
                  {getKnownCoords(newLoc.name) && !newLoc.lat && (
                    <span style={{ marginLeft: 8, color: C.positive, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
                      ✓ auto-detetadas: {getKnownCoords(newLoc.name)![0].toFixed(4)}, {getKnownCoords(newLoc.name)![1].toFixed(4)}
                    </span>
                  )}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.lat} onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })} placeholder="Latitude (ex: 41.5503)" style={IS} type="number" step="0.0001" />
                  <input value={newLoc.lng} onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })} placeholder="Longitude (ex: -8.4275)" style={IS} type="number" step="0.0001" />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                  Deixa em branco para usar coords automáticas (se POI conhecido). Podes sempre arrastar no mapa para ajustar.
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Google (opcional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.googleRating} onChange={(e) => setNewLoc({ ...newLoc, googleRating: e.target.value })} placeholder="Nota (ex: 4.7)" style={IS} type="number" step="0.1" min="0" max="5" />
                  <input value={newLoc.googleReviewCount} onChange={(e) => setNewLoc({ ...newLoc, googleReviewCount: e.target.value })} placeholder="Nº reviews (ex: 37000)" style={IS} type="number" min="0" />
                </div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Nota (0–5) e nº de avaliações no Google Maps. Mostra-se ao lado do score da IA, com indicador de divergência.</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={addLocation} disabled={!newLoc.name.trim()}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: newLoc.name.trim() ? C.accent : C.border,
                  color: newLoc.name.trim() ? C.bg : C.textDim,
                  cursor: newLoc.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                }}>
                Adicionar
              </button>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>Editar Local</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Nome</label>
                <input value={newLoc.name} list="braga-pois-list-edit" onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && updateLocation()}
                  style={IS} />
                <datalist id="braga-pois-list-edit">
                  {KNOWN_POI_NAMES.map((name) => <option key={name} value={name} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Categoria</label>
                  <select value={newLoc.category} onChange={(e) => setNewLoc({ ...newLoc, category: e.target.value })} style={IS}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Plataforma</label>
                  <select value={newLoc.platform} onChange={(e) => setNewLoc({ ...newLoc, platform: e.target.value })} style={IS}>
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Coordenadas</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.lat} onChange={(e) => setNewLoc({ ...newLoc, lat: e.target.value })} placeholder="Latitude" style={IS} type="number" step="0.0001" />
                  <input value={newLoc.lng} onChange={(e) => setNewLoc({ ...newLoc, lng: e.target.value })} placeholder="Longitude" style={IS} type="number" step="0.0001" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Google (opcional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newLoc.googleRating} onChange={(e) => setNewLoc({ ...newLoc, googleRating: e.target.value })} placeholder="Nota (ex: 4.7)" style={IS} type="number" step="0.1" min="0" max="5" />
                  <input value={newLoc.googleReviewCount} onChange={(e) => setNewLoc({ ...newLoc, googleReviewCount: e.target.value })} placeholder="Nº reviews" style={IS} type="number" min="0" />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={() => { setShowEdit(false); setEditId(null); }}
                style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={updateLocation} disabled={!newLoc.name.trim()}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: newLoc.name.trim() ? C.accent : C.border,
                  color: newLoc.name.trim() ? C.bg : C.textDim,
                  cursor: newLoc.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 600,
                }}>
                Guardar Alterações
              </button>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Importar Reviews</h3>
            <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
              <strong style={{ color: C.accent }}>{selLoc.name}</strong> — importação em massa por texto ou ficheiro CSV.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {modeBtn('texto', 'Colar texto')}
              {modeBtn('csv', 'Importar CSV')}
            </div>

            {importMode === 'texto' ? (
              <>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={12}
                  placeholder={'Cola aqui todas as reviews.\n\nPodes separar por uma linha em branco entre cada uma,\nou por --- numa linha própria. Deteção automática.'}
                  style={{ ...IS, resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
                <p style={{ fontSize: 11, color: C.textDim, margin: '6px 0 0' }}>
                  Separadores aceites: linha em branco entre reviews, ou <code style={{ background: C.border, padding: '1px 5px', borderRadius: 4 }}>---</code>. Se nada disso existir, cada linha é uma review.
                </p>
              </>
            ) : (
              <>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={10}
                  placeholder={'autor,nota,comentário,data\nJoão,5,"Lugar incrível, vale a pena",2025-03-01\nMaria,4,"Muito bonito mas cheio de gente",2025-03-02'}
                  style={{ ...IS, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: 12 }} />
                {csvRows.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: C.textMuted, cursor: 'pointer' }}>
                      <input type="checkbox" checked={csvHasHeader} onChange={(e) => { setCsvHasHeader(e.target.checked); setCsvCol(null); }} />
                      1ª linha é cabeçalho
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Coluna do texto:</span>
                      <select value={effCol} onChange={(e) => setCsvCol(parseInt(e.target.value, 10))}
                        style={{ ...IS, width: 'auto', padding: '6px 10px', fontSize: 12 }}>
                        {(csvRows[0] || []).map((_, idx) => (
                          <option key={idx} value={idx}>{csvHasHeader ? (csvHeaderRow[idx] || `Coluna ${idx + 1}`) : `Coluna ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {csvBody.length > 0 && (
                  <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', maxHeight: 90, overflowY: 'auto' }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Pré-visualização</div>
                    {csvBody.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>• {(r[effCol] || '').trim() || <em style={{ color: C.textDim }}>(vazio)</em>}</div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 11, color: C.textDim }}>
                {selLoc.reviews.length} já guardada{selLoc.reviews.length !== 1 ? 's' : ''}
                {previewCount > 0 && <span style={{ color: C.accent }}> · {previewCount} detetada{previewCount !== 1 ? 's' : ''} para importar</span>}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowReview(false)}
                  style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 }}>
                  Cancelar
                </button>
                <button onClick={addReviews} disabled={previewCount === 0}
                  style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: previewCount > 0 ? C.accent : C.border,
                    color: previewCount > 0 ? C.bg : C.textDim,
                    cursor: previewCount > 0 ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 600,
                  }}>
                  Importar {previewCount > 0 ? previewCount : ''} review{previewCount !== 1 ? 's' : ''}
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
  );
}