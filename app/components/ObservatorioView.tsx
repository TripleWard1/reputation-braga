'use client';

import { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, BarChart, AreaChart,
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import {
  MESES, MESES_CURTO,
  DORMIDAS_BRAGA, HOSPEDES_BRAGA, DORMIDAS_ANUAL, HOSPEDES_ANUAL,
  REVPAR_MENSAL, ADR_ANUAL, HEADLINE, INFRA, TAXA_TURISTICA, BALCAO,
} from '@/app/lib/observatorio-dados';

const C = {
  bg: '#0c0e14', card: '#161920', cardAlt: '#1c2030', border: '#252836',
  accent: '#c9a84c', accentLight: '#e8cc7e', accentBg: 'rgba(201,168,76,0.12)',
  positive: '#34d399', positiveBg: 'rgba(52,211,153,0.12)',
  negative: '#f87171', negativeBg: 'rgba(248,113,113,0.12)',
  info: '#60a5fa', purple: '#a78bfa', pink: '#f472b6', cyan: '#22d3ee', orange: '#fb923c',
  text: '#e2e0db', textMuted: '#9a99a0', textDim: '#8a8c9e',
};

const YEAR_COLORS: Record<string, string> = {
  '2019': '#9aa0b5', '2020': '#60a5fa', '2021': '#22d3ee',
  '2022': '#a78bfa', '2023': '#f472b6', '2024': '#fb923c',
  '2025': '#c9a84c', '2026': '#34d399',
};
const PAL = [C.accent, C.info, C.positive, C.purple, C.pink, C.cyan, C.orange, '#f472b6'];

type Tab = 'geral' | 'procura' | 'economia' | 'mercados' | 'balcao' | 'taxa';

interface Props { reputacaoMedia?: number | null; reputacaoLocais?: number; reputacaoReviews?: number; }

const fmt = (n: number | null | undefined, c = 0) =>
  n == null || isNaN(n as number) ? '—' : (n as number).toLocaleString('pt-PT', { minimumFractionDigits: c, maximumFractionDigits: c });
const fmtE = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} M€`;
  if (n >= 1e3) return `${(n / 1e3).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} k€`;
  return `${fmt(n)} €`;
};

export default function ObservatorioView({ reputacaoMedia, reputacaoLocais, reputacaoReviews }: Props) {
  const [tab, setTab] = useState<Tab>('geral');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Visão Geral' },
    { id: 'procura', label: 'Procura (INE)' },
    { id: 'economia', label: 'Economia' },
    { id: 'mercados', label: 'Mercados' },
    { id: 'balcao', label: 'Atendimento Balcão' },
    { id: 'taxa', label: 'Taxa Turística' },
  ];
  const tabLabel = TABS.find((t) => t.id === tab)?.label || '';

  const exportarPDF = () => {
    const node = document.getElementById('obs-print-area');
    if (!node) return;
    const win = window.open('', '_blank', 'width=1180,height=860');
    if (!win) { alert('Permita pop-ups para exportar o PDF.'); return; }
    const hoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const html =
      '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">' +
      '<title>Observatório de Turismo de Braga — ' + tabLabel + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{box-sizing:border-box;}' +
      'body{margin:0;font-family:"DM Sans",sans-serif;background:#0c0e14;color:#e2e0db;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
      '.brand{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;border-bottom:2px solid #c9a84c;}' +
      '.brand img{height:30px;}' +
      '.brand .meta{text-align:right;}' +
      '.brand h1{font-size:17px;margin:0;color:#c9a84c;letter-spacing:-0.01em;}' +
      '.brand .sub{font-size:12px;color:#9a99a0;margin-top:2px;}' +
      '.content{padding:18px 24px;}' +
      '.content button{display:none !important;}' +
      '.content > div > div:first-child{break-inside:avoid;}' +
      'footer{padding:14px 28px;border-top:1px solid #252836;font-size:10px;color:#8a8c9e;display:flex;justify-content:space-between;}' +
      '@page{margin:12mm;}' +
      '</style></head><body>' +
      '<div class="brand"><img src="https://i.imgur.com/Yakcz6G.png" alt="Visit Braga">' +
      '<div class="meta"><h1>Observatório de Turismo de Braga</h1><div class="sub">' + tabLabel + ' · ' + hoje + '</div></div></div>' +
      '<div class="content">' + node.innerHTML + '</div>' +
      '<footer><span>Município de Braga · Divisão de Atividades Económicas e Turismo</span>' +
      '<span>Fontes: INE/TravelBI · Taxa Municipal Turística · Atendimento de Balcão</span></footer>' +
      '<script>setTimeout(function(){window.focus();window.print();},700);</script>' +
      '</body></html>';
    win.document.open(); win.document.write(html); win.document.close();
  };

  return (
    <div style={{ padding: '28px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em', color: C.text }}>Observatório de Turismo de Braga</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Análise integrada de dados reais — INE/TravelBI · Atendimento de Balcão · Taxa Municipal Turística</p>
        </div>
        <button onClick={exportarPDF} style={{
          padding: '9px 16px', borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accentBg,
          color: C.accentLight, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
        }}>⬇ Exportar PDF</button>
      </div>

      {/* Sub-navegação */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? C.accent : C.textMuted,
            borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}`, marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      <div id="obs-print-area">
        {tab === 'geral' && <Geral rep={reputacaoMedia} repL={reputacaoLocais} repR={reputacaoReviews} />}
        {tab === 'procura' && <Procura />}
        {tab === 'economia' && <Economia />}
        {tab === 'mercados' && <Mercados />}
        {tab === 'balcao' && <Balcao />}
        {tab === 'taxa' && <Taxa />}
      </div>
    </div>
  );
}

// ─── Componentes base ────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = C.accent }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, color, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: color, opacity: 0.85 }}>{sub}</div>}
    </div>
  );
}
function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
function Chips({ options, sel, toggle, single }: { options: string[]; sel: string[]; toggle: (o: string) => void; single?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = sel.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{
            padding: '4px 11px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontWeight: on ? 600 : 400,
            border: `1px solid ${on ? (YEAR_COLORS[o] || C.accent) : C.border}`,
            background: on ? (YEAR_COLORS[o] ? `${YEAR_COLORS[o]}22` : C.accentBg) : 'transparent',
            color: on ? (YEAR_COLORS[o] || C.accentLight) : C.textMuted,
          }}>{o}</button>
        );
      })}
    </div>
  );
}
const tipStyle = { background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };

function HBars({ data, color }: { data: [string, number][]; color?: string }) {
  const max = Math.max(...data.map((d) => d[1]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map(([k, v], i) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: C.text }}>{k}</span>
            <span style={{ color: C.textMuted }}>{fmt(v)}</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
            <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: color || PAL[i % PAL.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function CompareBars({ title, vals, unit = '' }: { title: string; vals: Record<string, number>; unit?: string }) {
  const max = Math.max(...Object.values(vals), 1);
  const cor: Record<string, string> = { Braga: C.accent, Norte: C.positive, Portugal: C.info };
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(vals).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 64, fontSize: 11, color: C.textMuted }}>{k}</span>
            <div style={{ flex: 1, height: 18, borderRadius: 5, background: C.card, overflow: 'hidden' }}>
              <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: cor[k] || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.bg }}>{v}{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VISÃO GERAL ─────────────────────────────────────────────────────────────
function Geral({ rep, repL, repR }: { rep?: number | null; repL?: number; repR?: number }) {
  const dormDataAnual = Object.entries(DORMIDAS_ANUAL).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, dormidas: v as number }));
  const taxaAnual = Object.entries(TAXA_TURISTICA).map(([y, m]) => ({ ano: y, total: y === '2026' ? Object.entries(m).filter(([k]) => k !== 'Total').reduce((s, [, v]) => s + v, 0) : (m.Total || 0) }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label="Dormidas 2025" value={fmt(HEADLINE.dormidas2025)} sub={`+${HEADLINE.dormidasVar}% homólogo`} color={HEADLINE.dormidasVar >= 0 ? C.positive : C.negative} />
        <KPI label="Hóspedes 2025" value={fmt(HEADLINE.hospedes2025)} sub={`+${HEADLINE.hospedesVar}% homólogo`} color={C.accentLight} />
        <KPI label="Taxa Turística 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="receita municipal" color={C.accent} />
        <KPI label="Atendimentos Balcão 2025" value={fmt(BALCAO['2025'].atendimentos)} sub={`${fmt(BALCAO['2025'].pax)} pax`} color={C.info} />
        <KPI label="Estada Média" value={`${HEADLINE.estadaMedia.Braga}`} sub="noites (INE 2024)" color={C.purple} />
        <KPI label="Ocupação-quarto" value={`${HEADLINE.ocupQuarto.Braga}%`} sub="líquida (INE 2024)" color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Dormidas anuais em Braga (INE/TravelBI)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dormDataAnual} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), 'Dormidas']} />
              <Bar dataKey="dormidas" radius={[4, 4, 0, 0]}>
                {dormDataAnual.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Receita da Taxa Municipal Turística (€/ano)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taxaAnual} margin={{ top: 6, right: 8, left: 2, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), 'Receita']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {taxaAnual.map((d) => <Cell key={d.ano} fill={d.ano === '2026' ? C.textDim : C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>2026 parcial (jan–mar). O salto reflete a entrada em vigor da taxa de 1,50 €/dormida.</p>
        </Card>
      </div>

      <Card title="◈ Cruzamento Reputação Online × Procura Real">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Cruz label="Reputação média (plataforma)" value={rep != null ? `${rep.toFixed(1)}/10` : '—'} color={C.accent} nota={`${repL ?? 0} locais · ${fmt(repR ?? 0)} reviews`} />
          <Cruz label="Dormidas 2025 (INE)" value={fmt(HEADLINE.dormidas2025)} color={C.info} nota={`+${HEADLINE.dormidasVar}% homólogo`} />
          <Cruz label="Atendimentos balcão 2025" value={fmt(BALCAO['2025'].atendimentos)} color={C.positive} nota={`${fmt(BALCAO['2025'].pax)} visitantes`} />
          <Cruz label="Receita taxa 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} color={C.purple} nota="dado próprio do Município" />
        </div>
        <p style={{ fontSize: 12, color: C.textMuted, margin: '14px 0 0', lineHeight: 1.6 }}>
          Três fontes independentes a triangular a mesma realidade: o que as pessoas <strong>dizem</strong> (reputação), onde <strong>dormem</strong> (INE + taxa) e o que <strong>procuram</strong> ao balcão. Quando a reputação de um POI âncora cai, costuma anteceder quebras na procura — e a receita da taxa permite quantificar o retorno de cada intervenção.
        </p>
      </Card>
    </>
  );
}
function Cruz({ label, value, color, nota }: { label: string; value: string; color: string; nota: string }) {
  return (
    <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 700, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textDim }}>{nota}</div>
    </div>
  );
}

// ─── PROCURA (INE) ───────────────────────────────────────────────────────────
function Procura() {
  const [metric, setMetric] = useState<'dormidas' | 'hospedes'>('dormidas');
  const [anos, setAnos] = useState<string[]>(['2023', '2024', '2025']);
  const src = metric === 'dormidas' ? DORMIDAS_BRAGA : HOSPEDES_BRAGA;
  const data = MESES.map((m, i) => {
    const row: any = { mes: MESES_CURTO[i] };
    anos.forEach((y) => { row[y] = src[m]?.[y] ?? null; });
    return row;
  });
  const todosAnos = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  const toggleAno = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const anual = metric === 'dormidas' ? DORMIDAS_ANUAL : HOSPEDES_ANUAL;
  const anualData = Object.entries(anual).filter(([, v]) => v != null).map(([y, v]) => ({ ano: y, v: v as number }));

  return (
    <>
      <Card title={`${metric === 'dormidas' ? 'Dormidas' : 'Hóspedes'} mensais em Braga — comparação plurianual`}
        right={<div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chips options={['dormidas', 'hospedes']} sel={[metric]} toggle={(o) => setMetric(o as any)} single />
          <Chips options={todosAnos} sel={anos} toggle={toggleAno} />
        </div>}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 6, right: 10, left: -6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {anos.map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2025' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>Fonte: INE / TravelBI. Dados de 2025 disponíveis até onde o INE consolidou (lag habitual de ~3 meses).</p>
      </Card>

      <Card title={`Total anual de ${metric === 'dormidas' ? 'dormidas' : 'hóspedes'} (anos completos)`}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={anualData} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), metric === 'dormidas' ? 'Dormidas' : 'Hóspedes']} />
            <Bar dataKey="v" radius={[4, 4, 0, 0]}>{anualData.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>Nota: a quebra de 2020–2021 reflete a pandemia. Recuperação plena a partir de 2022.</p>
      </Card>
    </>
  );
}

// ─── ECONOMIA ────────────────────────────────────────────────────────────────
function Economia() {
  const revparData = MESES.map((m, i) => {
    const row: any = { mes: MESES_CURTO[i] };
    ['2022', '2023', '2024'].forEach((y) => { row[y] = REVPAR_MENSAL[m]?.[y] ?? null; });
    return row;
  });
  const adrData = Object.entries(ADR_ANUAL).map(([y, v]) => ({ ano: y, adr: v }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
        <CompareBars title="RevPAR 2024 — rendimento por quarto disponível (€)" vals={HEADLINE.revpar2024} unit="€" />
        <CompareBars title="ADR 2024 — rendimento por quarto ocupado (€)" vals={HEADLINE.adr2024} unit="€" />
        <CompareBars title="Taxa líquida de ocupação-quarto 2024 (%)" vals={HEADLINE.ocupQuarto} unit="%" />
        <CompareBars title="Taxa líquida de ocupação-cama 2024 (%)" vals={HEADLINE.ocupCama} unit="%" />
      </div>

      <Card title="RevPAR mensal em Braga (€) — 2022 a 2024">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revparData} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [`${v} €`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {['2022', '2023', '2024'].map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        <Card title="ADR anual em Braga (€) — 2018 a 2024">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adrData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs><linearGradient id="adrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.5} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => [`${v} €`, 'ADR']} />
              <Area type="monotone" dataKey="adr" stroke={C.accent} strokeWidth={2.5} fill="url(#adrg)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Proveitos do alojamento (variação 2023→2024)">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.accent }}>{fmtE(HEADLINE.proveitos.Braga2024 * 1e6)}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Braga 2024 · de {HEADLINE.proveitos.Braga2023} M€ em 2023</div>
          </div>
          <CompareBars title="Variação dos proveitos 2023–2024 (%)" vals={{ Braga: HEADLINE.proveitos.varBraga, Norte: HEADLINE.proveitos.varNorte, Portugal: HEADLINE.proveitos.varPortugal }} unit="%" />
        </Card>
      </div>
    </>
  );
}

// ─── MERCADOS ────────────────────────────────────────────────────────────────
function Mercados() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`Nacionalidades no balcão — ${ano}`}>
          <HBars data={b.nacionalidades.slice(0, 12)} />
        </Card>
        <Card title={`Cidades de origem dos visitantes — ${ano}`}>
          <HBars data={b.cidades.slice(0, 12)} color={C.info} />
        </Card>
      </div>
      <Card title="Principais mercados emissores internacionais (INE 2025, por dormidas)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HEADLINE.mercados2025.map((m, i) => (
            <span key={m} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: i < 4 ? C.accentBg : C.bg, color: i < 4 ? C.accentLight : C.textMuted, border: `1px solid ${C.border}` }}>
              {i + 1}. {m}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: '12px 0 0', lineHeight: 1.5 }}>
          Espanha é o principal mercado internacional, seguida de Brasil, França e Reino Unido. O balcão confirma o domínio ibérico (Espanha + cidades como Madrid, Vigo, A Coruña, Bilbao no topo).
        </p>
      </Card>
    </>
  );
}

// ─── ATENDIMENTO BALCÃO ──────────────────────────────────────────────────────
function Balcao() {
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const b = BALCAO[ano];
  const mensal = MESES.map((m, i) => {
    const v = b.mensal[String(i + 1)];
    return { mes: MESES_CURTO[i], atendimentos: v ? v[0] : null, pax: v ? v[1] : null };
  });
  const pctVisit = Math.round((b.visitantes / b.atendimentos) * 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 12, color: C.textMuted, margin: 0, maxWidth: 560, lineHeight: 1.5 }}>
          Dados do Posto de Turismo — cada registo é um atendimento ao balcão. {ano === '2026' ? 'Ano em curso (até junho).' : 'Ano completo.'}
        </p>
        <Chips options={['2025', '2026']} sel={[ano]} toggle={(o) => setAno(o as any)} single />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label="Atendimentos" value={fmt(b.atendimentos)} color={C.accent} />
        <KPI label="Pessoas (pax)" value={fmt(b.pax)} color={C.accentLight} />
        <KPI label="Visitantes" value={`${pctVisit}%`} sub={`${fmt(b.visitantes)} de turistas`} color={C.info} />
        <KPI label="Peregrinos" value={fmt(b.peregrinos)} sub="Caminhos de Santiago" color={C.purple} />
        <KPI label="Grupos" value={fmt(b.grupos)} color={C.cyan} />
        <KPI label="Com crianças" value={fmt(b.criancas)} color={C.pink} />
      </div>

      <Card title={`Atendimentos e pessoas por mês — ${ano}`}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={mensal} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="atendimentos" name="Atendimentos" fill={C.accent} radius={[4, 4, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="pax" name="Pessoas (pax)" stroke={C.info} strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={`O que procuram (interesses) — ${ano}`}><HBars data={b.interesses.slice(0, 10)} color={C.accent} /></Card>
        <Card title={`Nacionalidades — ${ano}`}><HBars data={b.nacionalidades.slice(0, 10)} color={C.info} /></Card>
        {b.meioChegada.length > 0 && <Card title={`Meio de chegada — ${ano}`}><HBars data={b.meioChegada} color={C.positive} /></Card>}
        {b.alojamento.length > 0 && <Card title={`Tipo de alojamento — ${ano}`}><HBars data={b.alojamento} color={C.purple} /></Card>}
      </div>

      {ano === '2025' && (
        <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}30`, borderRadius: 10, padding: '12px 16px', fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
          Nota: em 2025 o registo de “meio de chegada” e parte dos interesses ainda não era sistemático, daí os totais mais baixos nessas dimensões. A partir de 2026 a recolha é muito mais completa.
        </div>
      )}
    </>
  );
}

// ─── TAXA TURÍSTICA ──────────────────────────────────────────────────────────
function Taxa() {
  const [anos, setAnos] = useState<string[]>(['2023', '2024', '2025']);
  const todos = ['2021', '2022', '2023', '2024', '2025', '2026'];
  const toggle = (y: string) => setAnos((p) => p.includes(y) ? p.filter((x) => x !== y) : [...p, y].sort());
  const mensal = MESES.map((m) => {
    const row: any = { mes: m.slice(0, 3) };
    anos.forEach((y) => { row[y] = TAXA_TURISTICA[y]?.[m] ?? null; });
    return row;
  });
  const totais = ['2021', '2022', '2023', '2024', '2025'].map((y) => ({ ano: y, total: TAXA_TURISTICA[y].Total }));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <KPI label="Receita 2025" value={fmtE(TAXA_TURISTICA['2025'].Total)} sub="+23% vs 2024" color={C.positive} />
        <KPI label="Receita 2024" value={fmtE(TAXA_TURISTICA['2024'].Total)} color={C.accent} />
        <KPI label="Empreendimentos" value={fmt(INFRA.empreendimentos)} sub="hotéis e similares" color={C.info} />
        <KPI label="Alojamento Local" value={fmt(INFRA.alojamentoLocal)} sub="registos AL" color={C.purple} />
      </div>

      <Card title="Receita mensal da Taxa Municipal Turística (€)"
        right={<Chips options={todos} sel={anos} toggle={toggle} />}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mensal} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any, n: any) => [fmtE(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {anos.map((y) => <Line key={y} type="monotone" dataKey={y} stroke={YEAR_COLORS[y]} strokeWidth={y === '2026' ? 3 : 2} dot={{ r: 2 }} connectNulls />)}
          </LineChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          Reg. n.º 927/2025 · 1,50 €/dormida · até 4 noites · hóspedes &gt; 16 anos. O salto de 2026 (jan: {fmtE(TAXA_TURISTICA['2026'].Janeiro)}) reflete a entrada em vigor do novo valor da taxa.
        </p>
      </Card>

      <Card title="Receita anual total (€)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={totais} margin={{ top: 6, right: 8, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmtE(v), 'Receita']} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>{totais.map((d) => <Cell key={d.ano} fill={YEAR_COLORS[d.ano] || C.accent} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}