'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import {
  IndicadoresBraga, RegistoMensal, MercadoEmissor,
  carregarIndicadores, guardarIndicadores,
  FONTES, TAXA_TURISTICA, MESES_PT,
  periodoLabel, fmtNum, fmtEuro, estadaMedia, variacaoHomologa, dormidasEstimadasPelaTaxa,
} from '@/app/lib/indicadores';

// Paleta local (auto-contida, igual ao tema da plataforma)
const C = {
  bg: '#0c0e14', card: '#161920', cardAlt: '#1c2030', border: '#252836',
  accent: '#c9a84c', accentLight: '#e8cc7e', accentBg: 'rgba(201,168,76,0.12)',
  positive: '#34d399', positiveBg: 'rgba(52,211,153,0.12)',
  neutral: '#fbbf24', negative: '#f87171', negativeBg: 'rgba(248,113,113,0.12)',
  info: '#60a5fa', infoBg: 'rgba(96,165,250,0.12)', purple: '#a78bfa',
  text: '#e2e0db', textMuted: '#8b8a8f', textDim: '#4a4960',
};

const MERCADO_CORES = [C.accent, C.info, C.positive, C.purple, C.neutral, '#f472b6', '#22d3ee', '#fb923c'];

interface Props {
  reputacaoMedia?: number | null;
  reputacaoLocais?: number;
  reputacaoReviews?: number;
}

export default function IndicadoresView({ reputacaoMedia, reputacaoLocais, reputacaoReviews }: Props) {
  const [ind, setInd] = useState<IndicadoresBraga | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showMercados, setShowMercados] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setInd(await carregarIndicadores());
      setLoading(false);
    })();
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  const persist = async (next: IndicadoresBraga) => {
    setInd(next);
    await guardarIndicadores(next);
    flash('✓ Indicadores guardados');
  };

  if (loading || !ind) {
    return <div style={{ padding: 40, color: C.textMuted, fontSize: 14 }}>A carregar indicadores…</div>;
  }

  const temExemplos = ind.mensal.some((m) => m.exemplo) || ind.mercados.some((m) => m.exemplo);
  const mensalOrd = [...ind.mensal].sort((a, b) => a.periodo.localeCompare(b.periodo));
  const ultimo = mensalOrd[mensalOrd.length - 1];

  // KPIs do último período
  const kpiDormidas = ultimo?.dormidas ?? null;
  const kpiHospedes = ultimo?.hospedes ?? null;
  const kpiEstada = ultimo ? estadaMedia(ultimo) : null;
  const kpiProveitos = ultimo?.proveitos ?? null;
  const kpiTaxa = ultimo?.taxaTuristica ?? null;
  const kpiOcup = ultimo?.ocupacao ?? null;
  const varDormidas = ultimo ? variacaoHomologa(ind.mensal, ultimo.periodo, 'dormidas') : null;

  // Série para gráficos
  const serie = mensalOrd.map((m) => ({
    nome: periodoLabel(m.periodo),
    dormidas: m.dormidas,
    hospedes: m.hospedes,
    proveitos: m.proveitos,
    taxa: m.taxaTuristica,
    estada: estadaMedia(m),
  }));

  // Sazonalidade — média de dormidas por mês do calendário
  const porMes: Record<number, number[]> = {};
  mensalOrd.forEach((m) => {
    if (m.dormidas == null) return;
    const idx = parseInt(m.periodo.split('-')[1], 10) - 1;
    (porMes[idx] = porMes[idx] || []).push(m.dormidas);
  });
  const sazonal = MESES_PT.map((nome, i) => ({
    nome,
    dormidas: porMes[i] ? Math.round(porMes[i].reduce((a, b) => a + b, 0) / porMes[i].length) : 0,
  }));
  const maxSaz = Math.max(...sazonal.map((s) => s.dormidas), 1);

  // Mercados
  const mercadosOrd = [...ind.mercados].sort((a, b) => b.dormidas - a.dormidas);
  const totalMercados = mercadosOrd.reduce((s, m) => s + m.dormidas, 0) || 1;

  // Receita anual estimada da taxa (soma dos meses com dados)
  const receitaTaxaTotal = mensalOrd.reduce((s, m) => s + (m.taxaTuristica || 0), 0);

  const KPIs = [
    { label: 'Dormidas (último mês)', value: fmtNum(kpiDormidas), sub: varDormidas != null ? `${varDormidas > 0 ? '+' : ''}${varDormidas}% homólogo` : 'INE', color: varDormidas != null ? (varDormidas >= 0 ? C.positive : C.negative) : C.accent },
    { label: 'Hóspedes', value: fmtNum(kpiHospedes), sub: 'INE', color: C.accentLight },
    { label: 'Estada Média', value: kpiEstada != null ? `${kpiEstada}` : '—', sub: 'noites/hóspede', color: C.info },
    { label: 'Proveitos', value: fmtEuro(kpiProveitos), sub: 'INE', color: C.positive },
    { label: 'Taxa Turística', value: fmtEuro(kpiTaxa), sub: 'receita municipal', color: C.accent },
    { label: 'Ocupação-cama', value: kpiOcup != null ? `${kpiOcup}%` : '—', sub: 'taxa líquida', color: C.purple },
  ];

  return (
    <div style={{ padding: '28px 30px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: C.text }}>Indicadores do Território</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Procura turística de Braga — dados oficiais (INE · TravelBI · Taxa Municipal Turística)</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowMercados(true)} style={btnGhost}>🌍 Mercados</button>
          <button onClick={() => setShowEdit(true)} style={btnPrimary}>＋ Introduzir / Atualizar dados</button>
        </div>
      </div>

      {/* Aviso de dados de demonstração */}
      {temExemplos && (
        <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
          ⚠ <strong>Dados de demonstração.</strong> Os valores a amarelo são exemplos da estrutura, <strong>não são dados reais de Braga</strong>. Substitua-os pelos números oficiais do INE e da Taxa Municipal Turística em “Introduzir / Atualizar dados”.
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        {KPIs.map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, lineHeight: 1.1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: k.color, opacity: 0.8 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Série temporal: dormidas + hóspedes + proveitos */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Evolução da Procura</div>
        {serie.length === 0 ? <Vazio /> : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={serie} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="nome" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="l" type="monotone" dataKey="dormidas" name="Dormidas" stroke={C.accent} fill={C.accentBg} strokeWidth={2.5} />
              <Line yAxisId="l" type="monotone" dataKey="hospedes" name="Hóspedes" stroke={C.info} strokeWidth={2} dot={{ r: 3 }} />
              <Line yAxisId="r" type="monotone" dataKey="proveitos" name="Proveitos (€)" stroke={C.positive} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Sazonalidade */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Sazonalidade — Dormidas Médias por Mês</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sazonal} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="nome" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="dormidas" name="Dormidas" radius={[4, 4, 0, 0]}>
                {sazonal.map((s, i) => (
                  <Cell key={i} fill={s.dormidas >= maxSaz * 0.8 ? C.accent : s.dormidas >= maxSaz * 0.4 ? C.accentLight : C.border} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '10px 0 0', lineHeight: 1.5 }}>
            Picos a dourado = meses de maior pressão turística. Útil para planear eventos na época baixa e gestão de carga na época alta.
          </p>
        </div>

        {/* Mercados emissores */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Mercados Emissores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mercadosOrd.slice(0, 8).map((m, i) => {
              const pct = Math.round((m.dormidas / totalMercados) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.text }}>{m.pais}{m.exemplo ? <span style={{ color: C.neutral, fontSize: 10 }}> (ex.)</span> : null}</span>
                    <span style={{ color: C.textMuted }}>{pct}% · {fmtNum(m.dormidas)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: MERCADO_CORES[i % MERCADO_CORES.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cruzamento Reputação × Procura — o que distingue um observatório */}
      <div style={{ background: C.card, border: `1px solid ${C.accent}30`, borderRadius: 12, padding: '20px 22px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>◈ Cruzamento Reputação × Procura</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Cruz label="Reputação média da cidade" value={reputacaoMedia != null ? `${reputacaoMedia.toFixed(1)}/10` : '—'} color={C.accent} nota={`${reputacaoLocais ?? 0} locais · ${fmtNum(reputacaoReviews ?? 0)} reviews`} />
          <Cruz label="Dormidas no período" value={fmtNum(kpiDormidas)} color={C.info} nota="procura efetiva (INE)" />
          <Cruz label="Receita taxa (acum.)" value={fmtEuro(receitaTaxaTotal)} color={C.positive} nota="dado do Município" />
          <Cruz label="Dormidas est. via taxa" value={fmtNum(dormidasEstimadasPelaTaxa(ultimo?.taxaTuristica ?? null))} color={C.purple} nota="validação cruzada" />
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '14px 0 0', lineHeight: 1.6 }}>
          A leitura que interessa à Divisão: a reputação online <strong>antecipa</strong> a procura. Quedas de reputação num POI âncora costumam preceder quebras de dormidas/receita. Cruzar as duas séries permite agir <strong>antes</strong> de o problema chegar aos números económicos — e provar o retorno das intervenções com a receita da própria taxa turística.
        </p>
      </div>

      {/* Fontes e metodologia */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Fontes & Metodologia</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FONTES.map((f, i) => (
            <div key={i} style={{ paddingBottom: 10, borderBottom: i < FONTES.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{f.nome}</div>
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
              <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, textDecoration: 'none' }}>{f.url} ↗</a>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: C.textDim, lineHeight: 1.6, background: C.bg, padding: '10px 12px', borderRadius: 8 }}>
          <strong>Taxa Municipal Turística:</strong> {TAXA_TURISTICA.valorPorDormida.toFixed(2).replace('.', ',')} €/dormida · máx. {TAXA_TURISTICA.maxNoites} noites · hóspedes &gt; {TAXA_TURISTICA.idadeMinima} anos · {TAXA_TURISTICA.regulamento}.
          {ind.atualizadoEm && <> · Última atualização dos dados: {new Date(ind.atualizadoEm).toLocaleString('pt-PT')}.</>}
        </div>
      </div>

      {showEdit && <EditarMensal ind={ind} onClose={() => setShowEdit(false)} onSave={persist} />}
      {showMercados && <EditarMercados ind={ind} onClose={() => setShowMercados(false)} onSave={persist} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.card, border: `1px solid ${C.accent}50`, borderRadius: 10, padding: '12px 22px', color: C.text, fontSize: 13, zIndex: 400, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>{toast}</div>
      )}
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function Vazio() {
  return <div style={{ textAlign: 'center', padding: '30px 16px', color: C.textDim, fontSize: 13 }}>Sem dados ainda. Use “Introduzir / Atualizar dados”.</div>;
}

function Cruz({ label, value, color, nota }: { label: string; value: string; color: string; nota: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textDim }}>{nota}</div>
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7, border: `1px solid ${C.border}`,
  background: C.bg, color: C.text, fontSize: 13, boxSizing: 'border-box', outline: 'none',
};
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: C.bg, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGhost: React.CSSProperties = { padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: 13 };

// Modal de edição dos registos mensais
function EditarMensal({ ind, onClose, onSave }: { ind: IndicadoresBraga; onClose: () => void; onSave: (i: IndicadoresBraga) => void }) {
  const [rows, setRows] = useState<RegistoMensal[]>(() => [...ind.mensal].sort((a, b) => a.periodo.localeCompare(b.periodo)));
  const [novo, setNovo] = useState({ periodo: '', dormidas: '', hospedes: '', proveitos: '', taxaTuristica: '', ocupacao: '' });

  const addRow = () => {
    if (!/^\d{4}-\d{2}$/.test(novo.periodo)) return;
    const r: RegistoMensal = {
      periodo: novo.periodo,
      dormidas: novo.dormidas ? +novo.dormidas : null,
      hospedes: novo.hospedes ? +novo.hospedes : null,
      proveitos: novo.proveitos ? +novo.proveitos : null,
      taxaTuristica: novo.taxaTuristica ? +novo.taxaTuristica : null,
      ocupacao: novo.ocupacao ? +novo.ocupacao : null,
    };
    const next = [...rows.filter((x) => x.periodo !== r.periodo), r].sort((a, b) => a.periodo.localeCompare(b.periodo));
    setRows(next);
    setNovo({ periodo: '', dormidas: '', hospedes: '', proveitos: '', taxaTuristica: '', ocupacao: '' });
  };
  const delRow = (p: string) => setRows(rows.filter((x) => x.periodo !== p));

  return (
    <Modal titulo="Introduzir / Atualizar dados mensais" onClose={onClose} largura={780}
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancelar</button>
        <button onClick={() => { onSave({ ...ind, mensal: rows }); onClose(); }} style={btnPrimary}>Guardar</button>
      </>}>
      <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
        Período no formato <code style={{ background: C.border, padding: '1px 5px', borderRadius: 4 }}>AAAA-MM</code>. Deixe em branco o que não tiver. Os valores oficiais saem do INE (dormidas, hóspedes, proveitos, ocupação) e do sistema da Taxa Municipal Turística (receita).
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: C.textMuted }}>
              {['Período', 'Dormidas', 'Hóspedes', 'Proveitos €', 'Taxa €', 'Ocup. %', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.periodo} style={{ borderTop: `1px solid ${C.border}`, color: r.exemplo ? C.neutral : C.text }}>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{periodoLabel(r.periodo)}{r.exemplo ? ' (ex.)' : ''}</td>
                <td style={{ padding: '6px 8px' }}>{fmtNum(r.dormidas)}</td>
                <td style={{ padding: '6px 8px' }}>{fmtNum(r.hospedes)}</td>
                <td style={{ padding: '6px 8px' }}>{fmtNum(r.proveitos)}</td>
                <td style={{ padding: '6px 8px' }}>{fmtNum(r.taxaTuristica)}</td>
                <td style={{ padding: '6px 8px' }}>{r.ocupacao ?? '—'}</td>
                <td style={{ padding: '6px 8px' }}>
                  <button onClick={() => delRow(r.periodo)} style={{ background: 'none', border: 'none', color: C.negative, cursor: 'pointer', fontSize: 14 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, padding: 14, background: C.bg, borderRadius: 9, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Adicionar / substituir período</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: 8, alignItems: 'center' }}>
          <input placeholder="2025-11" value={novo.periodo} onChange={(e) => setNovo({ ...novo, periodo: e.target.value })} style={inputS} />
          <input placeholder="Dormidas" value={novo.dormidas} onChange={(e) => setNovo({ ...novo, dormidas: e.target.value })} style={inputS} type="number" />
          <input placeholder="Hóspedes" value={novo.hospedes} onChange={(e) => setNovo({ ...novo, hospedes: e.target.value })} style={inputS} type="number" />
          <input placeholder="Proveitos" value={novo.proveitos} onChange={(e) => setNovo({ ...novo, proveitos: e.target.value })} style={inputS} type="number" />
          <input placeholder="Taxa €" value={novo.taxaTuristica} onChange={(e) => setNovo({ ...novo, taxaTuristica: e.target.value })} style={inputS} type="number" />
          <input placeholder="Ocup. %" value={novo.ocupacao} onChange={(e) => setNovo({ ...novo, ocupacao: e.target.value })} style={inputS} type="number" />
          <button onClick={addRow} style={{ ...btnPrimary, padding: '8px 14px' }}>＋</button>
        </div>
      </div>
    </Modal>
  );
}

// Modal de edição dos mercados emissores
function EditarMercados({ ind, onClose, onSave }: { ind: IndicadoresBraga; onClose: () => void; onSave: (i: IndicadoresBraga) => void }) {
  const [rows, setRows] = useState<MercadoEmissor[]>(() => [...ind.mercados]);
  const [novo, setNovo] = useState({ pais: '', dormidas: '' });

  const add = () => {
    if (!novo.pais.trim() || !novo.dormidas) return;
    const next = [...rows.filter((x) => x.pais !== novo.pais.trim()), { pais: novo.pais.trim(), dormidas: +novo.dormidas }];
    setRows(next);
    setNovo({ pais: '', dormidas: '' });
  };

  return (
    <Modal titulo="Mercados Emissores" onClose={onClose} largura={460}
      footer={<>
        <button onClick={onClose} style={btnGhost}>Cancelar</button>
        <button onClick={() => { onSave({ ...ind, mercados: rows }); onClose(); }} style={btnPrimary}>Guardar</button>
      </>}>
      <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>Dormidas por país de residência (fonte: INE / TravelBI).</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {rows.sort((a, b) => b.dormidas - a.dormidas).map((m) => (
          <div key={m.pais} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, fontSize: 13, color: m.exemplo ? C.neutral : C.text }}>{m.pais}{m.exemplo ? ' (ex.)' : ''}</span>
            <span style={{ fontSize: 13, color: C.textMuted }}>{fmtNum(m.dormidas)}</span>
            <button onClick={() => setRows(rows.filter((x) => x.pais !== m.pais))} style={{ background: 'none', border: 'none', color: C.negative, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
        <input placeholder="País" value={novo.pais} onChange={(e) => setNovo({ ...novo, pais: e.target.value })} style={inputS} />
        <input placeholder="Dormidas" value={novo.dormidas} onChange={(e) => setNovo({ ...novo, dormidas: e.target.value })} style={inputS} type="number" />
        <button onClick={add} style={{ ...btnPrimary, padding: '8px 14px' }}>＋</button>
      </div>
    </Modal>
  );
}

function Modal({ titulo, onClose, children, footer, largura = 520 }: { titulo: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; largura?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 26, width: largura, maxWidth: '94vw', maxHeight: '88vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 18px', color: C.text }}>{titulo}</h3>
        {children}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>{footer}</div>
      </div>
    </div>
  );
}