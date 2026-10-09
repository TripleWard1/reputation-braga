'use client';

import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import { t, getLang } from '@/app/lib/i18n';
import { SERIES_DIARIAS } from '@/app/lib/eventos-series-dados';
import { EVENTOS, FERIADOS_2026, type Evento } from '@/app/lib/eventos-dados';
import { C, Card, SectionTitle, fmt, tipStyle } from './comum';

// Impacto de eventos: média diária durante o evento face à média dos mesmos dias da semana
// nas 3 semanas antes e nas 3 semanas depois (sem dias de outros eventos nem feriados).
// Funções de topo, só com ciclos (o compressor do Next.js parte funções aninhadas que usam parâmetros de fora).

interface Serie { id: string; pt: string; en: string; es: string; unidade: string; cor: string }
const SERIES: Serie[] = [
  { id: 'wifi', pt: 'Dispositivos na rede Wi-Fi do centro', en: 'Devices on the centre Wi-Fi network', es: 'Dispositivos en la red wifi del centro', unidade: '', cor: '#8AB0E6' },
  { id: 'tub', pt: 'Entradas nos autocarros TUB (7 linhas)', en: 'TUB bus boardings (7 lines)', es: 'Subidas a los autobuses TUB (7 líneas)', unidade: '', cor: '#7CC79A' },
  { id: 'tubLinha2', pt: 'Entradas na linha 2 (Bom Jesus)', en: 'Line 2 boardings (Bom Jesus)', es: 'Subidas en la línea 2 (Bom Jesus)', unidade: '', cor: '#6FC8D6' },
  { id: 'autocarros', pt: 'Autocarros de fora no Centro Coordenador', en: 'Coaches arriving at the coach station', es: 'Autobuses de fuera en el Centro Coordinador', unidade: '', cor: '#EDA06B' },
  { id: 'parques', pt: 'Ocupação dos parques', en: 'Car park occupancy', es: 'Ocupación de los aparcamientos', unidade: '%', cor: '#A99BE0' },
];

function nomeL(x: { pt: string; en: string; es: string }): string { const l = getLang() as string; return l === 'en' ? x.en : l === 'es' ? x.es : x.pt; }
function somaDias(iso: string, n: number): string { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function diasEventos(): Record<string, boolean> {
  const r: Record<string, boolean> = {};
  for (let i = 0; i < EVENTOS.length; i++) { let x = EVENTOS[i].ini; while (x <= EVENTOS[i].fim) { r[x] = true; x = somaDias(x, 1); } }
  return r;
}
function mapa(id: string): Record<string, number> {
  const s = SERIES_DIARIAS[id] || []; const m: Record<string, number> = {};
  for (let i = 0; i < s.length; i++) m[s[i][0]] = s[i][1];
  return m;
}
interface Resultado { dias: number; evento: number; base: number; variacao: number }
function impacto(id: string, ev: Evento): Resultado | null {
  const m = mapa(id); const ocupados = diasEventos(); const fer: Record<string, boolean> = {};
  for (let i = 0; i < FERIADOS_2026.length; i++) fer[FERIADOS_2026[i]] = true;
  let somaE = 0, somaB = 0, n = 0;
  let x = ev.ini;
  while (x <= ev.fim) {
    if (m[x] != null) {
      let sb = 0, nb = 0;
      const sem = [-21, -14, -7, 7, 14, 21];
      for (let k = 0; k < sem.length; k++) { const y = somaDias(x, sem[k]); if (m[y] != null && !ocupados[y] && !fer[y]) { sb += m[y]; nb++; } }
      if (nb > 0) { somaE += m[x]; somaB += sb / nb; n++; }
    }
    x = somaDias(x, 1);
  }
  if (!n || !somaB) return null;
  return { dias: n, evento: somaE / n, base: somaB / n, variacao: (somaE / somaB - 1) * 100 };
}
function janela(id: string, ev: Evento): { d: string; v: number | null }[] {
  const m = mapa(id); const r: { d: string; v: number | null }[] = [];
  let x = somaDias(ev.ini, -21); const fim = somaDias(ev.fim, 21);
  while (x <= fim) { r.push({ d: x, v: m[x] != null ? m[x] : null }); x = somaDias(x, 1); }
  return r;
}
function rotDia(iso: string): string { return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`; }
function pct(v: number): string { return `${v >= 0 ? '+' : ''}${v.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`; }

export default function ImpactoEventos() {
  const [evId, setEvId] = useState(EVENTOS[EVENTOS.length - 1].id);
  const [serieId, setSerieId] = useState('wifi');
  const ev = EVENTOS.find((e) => e.id === evId) || EVENTOS[0];
  const linhas: { s: Serie; r: Resultado | null }[] = SERIES.map((s) => ({ s, r: impacto(s.id, ev) }));
  const serie = SERIES.find((s) => s.id === serieId) || SERIES[0];
  const dados = janela(serie.id, ev).map((x) => ({ dia: rotDia(x.d), v: x.v }));
  const temDados = dados.some((x) => x.v != null);
  const wifi = linhas.find((x) => x.s.id === 'wifi');
  return (
    <>
      <SectionTitle sub={t('Média diária durante o evento face aos mesmos dias da semana nas 3 semanas antes e depois (sem outros eventos nem feriados)', 'Daily average during the event vs the same weekdays in the 3 weeks before and after (excluding other events and holidays)')}>
        {wifi && wifi.r ? t(`${nomeL(ev.nome)}: ${pct(wifi.r.variacao)} de dispositivos Wi-Fi no centro face a dias comparáveis`, `${nomeL(ev.nome)}: ${pct(wifi.r.variacao)} Wi-Fi devices in the centre vs comparable days`) : t(`Impacto de eventos: ${nomeL(ev.nome)}`, `Event impact: ${nomeL(ev.nome)}`)}
      </SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {EVENTOS.map((e) => (
          <button key={e.id} type="button" onClick={() => setEvId(e.id)} aria-pressed={e.id === evId}
            style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${e.id === evId ? C.accent : C.border}`, background: e.id === evId ? C.accentBg : 'transparent', color: e.id === evId ? C.text : C.textMuted }}>
            {nomeL(e.nome)} · {rotDia(e.ini)}–{rotDia(e.fim)}
          </button>
        ))}
      </div>
      <Card title={t('Variação face a dias comparáveis', 'Change vs comparable days')}>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>{t('Indicador', 'Indicator')}</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Média no evento', 'Event average')}</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Média em dias comparáveis', 'Comparable-day average')}</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Variação', 'Change')}</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Dias', 'Days')}</th>
            </tr></thead>
            <tbody>{linhas.map(({ s, r }) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '9px 6px', color: C.text }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: s.cor, marginRight: 8 }} />{nomeL(s)}</td>
                <td data-l={t('Média no evento', 'Event average')} style={{ padding: '9px 6px', textAlign: 'right', color: C.text }}>{r ? `${fmt(Math.round(r.evento * 10) / 10, s.unidade ? 1 : 0)}${s.unidade}` : '—'}</td>
                <td data-l={t('Média em dias comparáveis', 'Comparable-day average')} style={{ padding: '9px 6px', textAlign: 'right', color: C.textMuted }}>{r ? `${fmt(Math.round(r.base * 10) / 10, s.unidade ? 1 : 0)}${s.unidade}` : '—'}</td>
                <td data-l={t('Variação', 'Change')} style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 700, color: r ? (r.variacao >= 0 ? C.positive : C.negative) : C.textDim }}>{r ? pct(r.variacao) : t('sem dados', 'no data')}</td>
                <td data-l={t('Dias', 'Days')} style={{ padding: '9px 6px', textAlign: 'right', color: C.textMuted }}>{r ? r.dias : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {ev.nota && <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 8 }}>{nomeL(ev.nota)}</div>}
      </Card>
      {ev.estudo && (
        <Card title={t('Impacto económico · estudo externo', 'Economic impact · external study')}>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 12 }}>{nomeL(ev.estudo.entidade)} · {nomeL(ev.estudo.periodo)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {ev.estudo.itens.map((it, i) => (
              <div key={i} style={{ border: `1px solid ${it.tipo === 'estimativa' ? C.info + '66' : C.border}`, borderRadius: 8, padding: '12px 14px', background: it.tipo === 'estimativa' ? 'rgba(233,196,106,0.06)' : 'transparent' }}>
                <div style={{ fontSize: 12, color: C.textMuted }}>{nomeL(it.rot)}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '4px 0' }}>{it.valor}</div>
                <div style={{ fontSize: 11.5, color: it.tipo === 'estimativa' ? C.info : C.textDim }}>{it.tipo === 'estimativa' ? t('Estimativa', 'Estimate') : it.tipo === 'calculo' ? t('Cálculo da entidade', 'Calculated by the entity') : t('Valor medido', 'Measured value')}{it.nota ? ` · ${nomeL(it.nota)}` : ''}</div>
              </div>
            ))}
          </div>
          {ev.estudo.notas.map((n, i) => <div key={i} style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{nomeL(n)}</div>)}
          <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.55, marginTop: 10 }}>{t('Os valores medidos vêm dos pagamentos eletrónicos registados pela SIBS. O impacto económico é um cálculo da AEB, não desta plataforma. O estudo cobre 7 dias (31/08 a 06/09); a comparação acima cobre os 3 dias do evento.', 'Measured values come from electronic payments recorded by SIBS. The economic impact is calculated by AEB, not by this platform. The study covers 7 days (31/08 to 06/09); the comparison above covers the 3 event days.')} <a href={ev.estudo.fonte} target="_blank" rel="noreferrer" style={{ color: C.accent }}>{ev.estudo.fonteNome}</a>{(ev.estudo.outrasFontes || []).map((o) => <span key={o.url}> · <a href={o.url} target="_blank" rel="noreferrer" style={{ color: C.accent }}>{o.nome}</a></span>)}</div>
        </Card>
      )}
      <Card title={t('Dia a dia: 3 semanas antes e depois do evento', 'Day by day: 3 weeks before and after the event')}
        right={<select value={serieId} onChange={(e: any) => setSerieId(e.target.value)} style={{ background: C.cardAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', fontFamily: 'inherit', fontSize: 12.5 }}>
          {SERIES.map((s) => <option key={s.id} value={s.id}>{nomeL(s)}</option>)}
        </select>}>
        {temDados ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={dados} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="dia" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} interval={6} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}${serie.unidade}`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => [v == null ? t('sem dados', 'no data') : `${fmt(Number(v), serie.unidade ? 1 : 0)}${serie.unidade}`, nomeL(serie)]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceArea x1={rotDia(ev.ini)} x2={rotDia(ev.fim)} fill={C.accent} fillOpacity={0.12} />
              <Line type="monotone" dataKey="v" name={nomeL(serie)} stroke={serie.cor} strokeWidth={2.2} dot={false} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <div style={{ fontSize: 13, color: C.textMuted, padding: '20px 0' }}>{t('Esta série não cobre as datas deste evento.', 'This series does not cover this event’s dates.')}</div>}
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{t('Faixa sombreada: dias do evento.', 'Shaded band: event days.')} <a href={ev.fonte} target="_blank" rel="noreferrer" style={{ color: C.accent }}>{t('Fonte das datas', 'Source for the dates')}</a></div>
      </Card>
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>
        {t('Como ler: a comparação mostra quanto o movimento foi diferente do habitual nos dias do evento, mas não isola o efeito do evento de outros fatores (meteorologia, férias escolares, outros acontecimentos). O Wi-Fi conta dispositivos e não pessoas, e a rede pode ter mudado ao longo do ano. As entradas TUB referem-se às 7 linhas do relatório enviado pelos TUB, não a toda a rede. Os parques só têm dados a partir de 22 de junho. Os dados de telemóveis (Geoanalytics) só cobrem outubro a dezembro de 2025 e não entram nesta comparação.', 'How to read: the comparison shows how different activity was from usual on event days, but it does not isolate the event’s effect from other factors (weather, school holidays, other happenings). Wi-Fi counts devices, not people, and the network may have changed during the year. TUB boardings refer to the 7 lines in the report sent by TUB, not the whole network. Car parks only have data from 22 June. Mobile-phone data (Geoanalytics) only covers October to December 2025 and is not part of this comparison.')}
      </div>
    </>
  );
}
