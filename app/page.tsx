'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from 'recharts';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

const STORAGE_KEY = 'braga-reputacao-data';
const CATEGORIES = [
  'Monumento',
  'Museu',
  'Restaurante',
  'Alojamento',
  'Experiência',
  'Espaço Público',
  'Outro',
];
const PLATFORMS = ['Google Maps', 'TripAdvisor', 'Booking.com', 'Outro'];

const C = {
  bg: '#0f1117',
  card: '#1a1d27',
  cardHover: '#222633',
  border: '#2a2e3d',
  accent: '#c8a45e',
  accentLight: '#e8cc7e',
  accentDim: '#8a7340',
  positive: '#4ade80',
  neutral: '#fbbf24',
  negative: '#f87171',
  text: '#e8e6e1',
  textMuted: '#8b8a87',
  textDim: '#5a5957',
};

interface Review {
  text: string;
  addedAt: string;
}
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
}
interface Location {
  id: string;
  name: string;
  category: string;
  platform: string;
  reviews: Review[];
  analysis: Analysis | null;
  lastAnalyzed: string | null;
}

function scoreColor(s: number) {
  return s >= 7 ? C.positive : s >= 4 ? C.neutral : C.negative;
}

function categoryIcon(cat: string) {
  const map: Record<string, string> = {
    Monumento: '🏛',
    Museu: '🖼',
    Restaurante: '🍽',
    Alojamento: '🏨',
    Experiência: '🎭',
    'Espaço Público': '🌳',
  };
  return map[cat] || '📍';
}

function countTop(arr: string[], n = 6) {
  const m: Record<string, number> = {};
  arr.forEach((x) => (m[x] = (m[x] || 0) + 1));
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [view, setView] = useState<'dashboard' | 'locais'>('dashboard');
  const [selId, setSelId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newLoc, setNewLoc] = useState({
    name: '',
    category: CATEGORIES[0],
    platform: PLATFORMS[0],
  });
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'locations'));
        const locs: Location[] = [];
        snap.forEach((d) => locs.push(d.data() as Location));
        setLocations(locs);
      } catch (e) {
        console.error('Firestore load error:', e);
      }
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (locs: Location[]) => {
    setLocations(locs);
    try {
      for (const loc of locs) {
        await setDoc(doc(db, 'locations', loc.id), loc);
      }
    } catch (e) {
      console.error('Firestore save error:', e);
    }
  }, []);

  const addLocation = () => {
    if (!newLoc.name.trim()) return;
    const loc: Location = {
      id: Date.now().toString(),
      name: newLoc.name.trim(),
      category: newLoc.category,
      platform: newLoc.platform,
      reviews: [],
      analysis: null,
      lastAnalyzed: null,
    };
    save([...locations, loc]);
    setNewLoc({ name: '', category: CATEGORIES[0], platform: PLATFORMS[0] });
    setShowAdd(false);
  };

  const deleteLoc = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch (e) {
      console.error('Firestore delete error:', e);
    }
    save(locations.filter((l) => l.id !== id));
    if (selId === id) setSelId(null);
  };

  const addReviews = () => {
    if (!reviewText.trim() || !selId) return;
    save(
      locations.map((l) =>
        l.id === selId
          ? {
              ...l,
              reviews: [
                ...l.reviews,
                { text: reviewText.trim(), addedAt: new Date().toISOString() },
              ],
            }
          : l
      )
    );
    setReviewText('');
    setShowReview(false);
  };

  const analyze = async (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc || loc.reviews.length === 0) return;
    setAnalyzing(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_KEY || '';
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: `És um analista de reputação turística especializado. Analisa cuidadosamente estas reviews do local "${
                  loc.name
                }" (${loc.category}) em Braga, Portugal.

INSTRUÇÕES:
- Lê CADA review individualmente, não generalizes
- Identifica padrões recorrentes (o que aparece em múltiplas reviews)
- Distingue entre elogios genéricos ("bonito", "lindo") e feedback específico e útil
- Procura problemas mencionados mesmo que subtilmente (filas, falta de WC, sinalética, acessibilidade, preços)
- As sugestões acionáveis devem ser CONCRETAS e dirigidas à gestão municipal (ex: "Instalar mais casas de banho públicas" e não "Melhorar infraestruturas")
- O score deve refletir a realidade: 10 só se não houver NENHUMA crítica
- Conta o número real de reviews individuais separadas por ---
- Identifica os idiomas presentes nas reviews (indica mercados emissores)

Responde APENAS com JSON válido, sem markdown, sem backticks. Estrutura:
{
  "sentimentScore": <1-10, sê rigoroso>,
  "sentimentBreakdown": {"positive": <%>, "neutral": <%>, "negative": <%>},
  "topThemesPositive": ["máx 5 temas específicos mais mencionados positivamente"],
  "topThemesNegative": ["máx 5 temas negativos ou áreas a melhorar, mesmo que subtis"],
  "keyIssues": ["problemas concretos identificados, máx 5"],
  "keyPraises": ["elogios específicos mais frequentes, máx 5"],
  "actionableInsights": ["5 sugestões CONCRETAS e acionáveis para a câmara municipal ou gestão do local"],
  "summaryPT": "Resumo analítico de 3-4 frases em português. Inclui pontos fortes, fracos e mercados emissores identificados.",
  "reviewCount": <número real de reviews analisadas>,
  "dimensions": {
    "localizacao": <1-10, acesso, transporte, sinalização>,
    "servico": <1-10, atendimento, informação, staff>,
    "precoQualidade": <1-10, valor percebido, custos mencionados>,
    "limpeza": <1-10, WC, espaços, manutenção>,
    "experiencia": <1-10, impacto emocional, memorabilidade>,
    "acessibilidade": <1-10, mobilidade reduzida, famílias, idosos>
  },
  "marketSources": ["idiomas/nacionalidades detetadas nas reviews"]
}

Reviews:
${loc.reviews.map((r) => r.text).join('\n---\n')}`,
              },
            ],
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!res.ok) throw new Error('Groq API error');
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const analysis: Analysis = JSON.parse(text);
      save(
        locations.map((l) =>
          l.id === id
            ? { ...l, analysis, lastAnalyzed: new Date().toISOString() }
            : l
        )
      );
    } catch {
      setError('Erro na análise. Verifica a tua API key e tenta novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzed = locations.filter((l) => l.analysis);
  const avgScore =
    analyzed.length > 0
      ? (
          analyzed.reduce((s, l) => s + (l.analysis?.sentimentScore || 0), 0) /
          analyzed.length
        ).toFixed(1)
      : null;

  const allPos = analyzed.flatMap((l) => l.analysis?.topThemesPositive || []);
  const allNeg = analyzed.flatMap((l) => l.analysis?.topThemesNegative || []);
  const allIssues = analyzed.flatMap((l) => l.analysis?.keyIssues || []);
  const allInsights = analyzed.flatMap(
    (l) => l.analysis?.actionableInsights || []
  );

  const barData = analyzed.map((l) => ({
    name: l.name.length > 18 ? l.name.slice(0, 16) + '…' : l.name,
    score: l.analysis?.sentimentScore || 0,
    fill: scoreColor(l.analysis?.sentimentScore || 0),
  }));

  const dims = [
    'localizacao',
    'servico',
    'precoQualidade',
    'limpeza',
    'experiencia',
    'acessibilidade',
  ];
  const dimLabels = [
    'Localização',
    'Serviço',
    'Preço/Qual.',
    'Limpeza',
    'Experiência',
    'Acessibilidade',
  ];
  const radarData =
    analyzed.length > 0
      ? dims.map((d, i) => ({
          dimension: dimLabels[i],
          value: +(
            analyzed.reduce(
              (s, l) => s + (l.analysis?.dimensions?.[d] || 0),
              0
            ) / analyzed.length
          ).toFixed(1),
        }))
      : [];

  const selLoc = locations.find((l) => l.id === selId);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    background: C.bg,
    color: C.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div
        style={{
          background: C.bg,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.textMuted,
        }}
      >
        A carregar...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* HEADER */}
      <header
        style={{
          borderBottom: `1px solid ${C.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ⚜
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Reputação Braga
            </h1>
            <p
              style={{
                fontSize: 11,
                color: C.textMuted,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Painel de Análise Turística
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['dashboard', 'locais'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 16px',
                borderRadius: 6,
                border: `1px solid ${view === v ? C.accent : C.border}`,
                background: view === v ? C.accent + '18' : 'transparent',
                color: view === v ? C.accent : C.textMuted,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* ═══ DASHBOARD ═══ */}
        {view === 'dashboard' && (
          <>
            {analyzed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>
                  📊
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>
                  Sem dados para mostrar
                </h2>
                <p
                  style={{
                    color: C.textMuted,
                    fontSize: 14,
                    maxWidth: 400,
                    margin: '0 auto 24px',
                  }}
                >
                  Adiciona locais, cola reviews e analisa-os para ver o painel.
                </p>
                <button
                  onClick={() => {
                    setView('locais');
                    setShowAdd(true);
                  }}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.accent,
                    color: C.bg,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  + Adicionar Primeiro Local
                </button>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {[
                    {
                      label: 'Score Global',
                      value: avgScore + '/10',
                      color: scoreColor(parseFloat(avgScore!)),
                    },
                    {
                      label: 'Locais Analisados',
                      value: analyzed.length,
                      color: C.accent,
                    },
                    {
                      label: 'Total Reviews',
                      value: analyzed.reduce(
                        (s, l) =>
                          s + (l.analysis?.reviewCount || l.reviews.length),
                        0
                      ),
                      color: C.accentLight,
                    },
                    {
                      label: 'Problemas Detetados',
                      value: allIssues.length,
                      color: C.negative,
                    },
                  ].map((k, i) => (
                    <div
                      key={i}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: '18px 20px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: 6,
                        }}
                      >
                        {k.label}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: k.color as string,
                        }}
                      >
                        {k.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 13,
                        color: C.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        margin: '0 0 16px',
                      }}
                    >
                      Sentimento por Local
                    </h3>
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(180, analyzed.length * 40)}
                    >
                      <BarChart
                        data={barData}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <XAxis
                          type="number"
                          domain={[0, 10]}
                          tick={{ fill: C.textDim, fontSize: 11 }}
                          axisLine={{ stroke: C.border }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: C.textMuted, fontSize: 11 }}
                          width={110}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: C.card,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            color: C.text,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
                          {barData.map((e, i) => (
                            <Cell key={i} fill={e.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 13,
                        color: C.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        margin: '0 0 16px',
                      }}
                    >
                      Dimensões Médias
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart
                        data={radarData}
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                      >
                        <PolarGrid stroke={C.border} />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: C.textMuted, fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 10]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          dataKey="value"
                          stroke={C.accent}
                          fill={C.accent}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Themes */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {[
                    {
                      title: '✦ Elogios Frequentes',
                      data: countTop(allPos),
                      color: C.positive,
                    },
                    {
                      title: '⚠ Problemas Recorrentes',
                      data: countTop(allNeg),
                      color: C.negative,
                    },
                    {
                      title: '💡 Sugestões Acionáveis',
                      data: [...new Set(allInsights)]
                        .slice(0, 6)
                        .map((x) => [x, 0] as [string, number]),
                      color: C.accent,
                    },
                  ].map((sec, si) => (
                    <div
                      key={si}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: 20,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 13,
                          color: sec.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          margin: '0 0 14px',
                        }}
                      >
                        {sec.title}
                      </h3>
                      {sec.data.length === 0 && (
                        <p style={{ color: C.textDim, fontSize: 13 }}>
                          Sem dados
                        </p>
                      )}
                      {sec.data.map(([text, count], i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom:
                              i < sec.data.length - 1
                                ? `1px solid ${C.border}`
                                : 'none',
                            fontSize: 13,
                          }}
                        >
                          <span>{text}</span>
                          {count > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                color: C.textDim,
                                background: sec.color + '18',
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {count}×
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Location Detail Cards */}
                <h3
                  style={{
                    fontSize: 13,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 14px',
                  }}
                >
                  Detalhe por Local
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 14,
                  }}
                >
                  {analyzed.map((loc) => (
                    <div
                      key={loc.id}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h4
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              margin: '0 0 4px',
                            }}
                          >
                            {loc.name}
                          </h4>
                          <span style={{ fontSize: 11, color: C.textDim }}>
                            {loc.category} · {loc.platform}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: scoreColor(loc.analysis!.sentimentScore),
                          }}
                        >
                          {loc.analysis!.sentimentScore}/10
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: C.textMuted,
                          lineHeight: 1.5,
                          margin: '0 0 12px',
                        }}
                      >
                        {loc.analysis!.summaryPT}
                      </p>
                      <div
                        style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                      >
                        {loc
                          .analysis!.topThemesPositive?.slice(0, 2)
                          .map((t, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 10,
                                background: C.positive + '18',
                                color: C.positive,
                                padding: '3px 8px',
                                borderRadius: 10,
                              }}
                            >
                              + {t}
                            </span>
                          ))}
                        {loc
                          .analysis!.topThemesNegative?.slice(0, 2)
                          .map((t, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 10,
                                background: C.negative + '18',
                                color: C.negative,
                                padding: '3px 8px',
                                borderRadius: 10,
                              }}
                            >
                              − {t}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ LOCAIS ═══ */}
        {view === 'locais' && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 22, margin: 0 }}>Locais Monitorizados</h2>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: C.accent,
                  color: C.bg,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                + Adicionar Local
              </button>
            </div>

            {locations.length === 0 && (
              <p
                style={{
                  textAlign: 'center',
                  padding: 60,
                  color: C.textMuted,
                  fontSize: 14,
                }}
              >
                Nenhum local adicionado. Começa por adicionar um ponto de
                interesse.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelId(selId === loc.id ? null : loc.id)}
                  style={{
                    background: selId === loc.id ? C.cardHover : C.card,
                    border: `1px solid ${
                      selId === loc.id ? C.accent + '60' : C.border
                    }`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          background: loc.analysis
                            ? scoreColor(loc.analysis.sentimentScore) + '20'
                            : C.border,
                        }}
                      >
                        {categoryIcon(loc.category)}
                      </div>
                      <div>
                        <h4
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            margin: '0 0 3px',
                          }}
                        >
                          {loc.name}
                        </h4>
                        <span style={{ fontSize: 11, color: C.textDim }}>
                          {loc.category} · {loc.platform} · {loc.reviews.length}{' '}
                          review{loc.reviews.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      {loc.analysis && (
                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: scoreColor(loc.analysis.sentimentScore),
                          }}
                        >
                          {loc.analysis.sentimentScore}/10
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLoc(loc.id);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          background: 'transparent',
                          color: C.textDim,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Expanded */}
                  {selId === loc.id && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: `1px solid ${C.border}`,
                      }}
                    >
                      <div
                        style={{ display: 'flex', gap: 8, marginBottom: 16 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReview(true);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: `1px solid ${C.accent}`,
                            background: 'transparent',
                            color: C.accent,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          📋 Colar Reviews
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            analyze(loc.id);
                          }}
                          disabled={loc.reviews.length === 0 || analyzing}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: 'none',
                            background:
                              loc.reviews.length === 0 || analyzing
                                ? C.border
                                : C.accent,
                            color:
                              loc.reviews.length === 0 || analyzing
                                ? C.textDim
                                : C.bg,
                            cursor:
                              loc.reviews.length === 0 || analyzing
                                ? 'not-allowed'
                                : 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {analyzing ? 'A analisar...' : '🤖 Analisar com AI'}
                        </button>
                      </div>

                      {error && (
                        <p
                          style={{
                            color: C.negative,
                            fontSize: 12,
                            margin: '0 0 10px',
                          }}
                        >
                          {error}
                        </p>
                      )}

                      {loc.analysis && (
                        <div
                          style={{
                            background: C.bg,
                            borderRadius: 8,
                            padding: 16,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 13,
                              color: C.textMuted,
                              lineHeight: 1.6,
                              margin: '0 0 12px',
                            }}
                          >
                            {loc.analysis.summaryPT}
                          </p>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 12,
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: C.positive,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                Elogios
                              </span>
                              {loc.analysis.keyPraises?.map((p, i) => (
                                <div
                                  key={i}
                                  style={{ fontSize: 12, padding: '3px 0' }}
                                >
                                  + {p}
                                </div>
                              ))}
                            </div>
                            <div>
                              <span
                                style={{
                                  fontSize: 10,
                                  color: C.negative,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                Problemas
                              </span>
                              {loc.analysis.keyIssues?.map((p, i) => (
                                <div
                                  key={i}
                                  style={{ fontSize: 12, padding: '3px 0' }}
                                >
                                  − {p}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 10,
                              color: C.textDim,
                            }}
                          >
                            Última análise:{' '}
                            {new Date(loc.lastAnalyzed!).toLocaleString(
                              'pt-PT'
                            )}
                          </div>
                        </div>
                      )}

                      {loc.reviews.length > 0 && !loc.analysis && (
                        <p
                          style={{ fontSize: 12, color: C.textDim, margin: 0 }}
                        >
                          {loc.reviews.length} review
                          {loc.reviews.length !== 1 ? 's' : ''} colada
                          {loc.reviews.length !== 1 ? 's' : ''}. Clica em
                          &quot;Analisar com AI&quot; para processar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ═══ MODAL: ADD LOCATION ═══ */}
      {showAdd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 28,
              width: 380,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, margin: '0 0 20px' }}>Novo Local</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Nome
                </label>
                <input
                  value={newLoc.name}
                  onChange={(e) =>
                    setNewLoc({ ...newLoc, name: e.target.value })
                  }
                  placeholder="Ex: Bom Jesus do Monte"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Categoria
                </label>
                <select
                  value={newLoc.category}
                  onChange={(e) =>
                    setNewLoc({ ...newLoc, category: e.target.value })
                  }
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Plataforma
                </label>
                <select
                  value={newLoc.platform}
                  onChange={(e) =>
                    setNewLoc({ ...newLoc, platform: e.target.value })
                  }
                  style={inputStyle}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.textMuted,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={addLocation}
                disabled={!newLoc.name.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: newLoc.name.trim() ? C.accent : C.border,
                  color: newLoc.name.trim() ? C.bg : C.textDim,
                  cursor: newLoc.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: PASTE REVIEWS ═══ */}
      {showReview && selLoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowReview(false)}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 28,
              width: 500,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>Colar Reviews</h3>
            <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 16px' }}>
              {selLoc.name} — cola várias reviews separadas por linhas em branco
              ou &quot;---&quot;
            </p>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={10}
              placeholder={
                'Excelente visita! A vista é incrível.\n---\nBonito mas demasiado turístico.\n---\nWonderful place, must visit!'
              }
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <span style={{ fontSize: 11, color: C.textDim }}>
                {selLoc.reviews.length} review
                {selLoc.reviews.length !== 1 ? 's' : ''} já colada
                {selLoc.reviews.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowReview(false)}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    color: C.textMuted,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={addReviews}
                  disabled={!reviewText.trim()}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: reviewText.trim() ? C.accent : C.border,
                    color: reviewText.trim() ? C.bg : C.textDim,
                    cursor: reviewText.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
