'use client';

import { useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { BAIRROS } from '@/app/lib/mobilidade-bairros-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// Bairros Comerciais Digitais · «Pessoas no Bairro» (plataforma Braga Smart Retail): presença medida pela rede Wi-Fi do centro,
// tempo de permanência, zonas e chegadas de autocarros ao Terminal Rodoviário (CCTTB).
const B: any = BAIRROS;
const FONTE = 'Braga Smart Retail · Pessoas no Bairro · Wi-Fi de 1 de janeiro a 7 de outubro de 2026 · exportado a 08/10/2026';
const dec = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function mesRot(ym: string) { const m = Number(ym.slice(5, 7)) - 1; return `${t(MESES_PT[m], MESES_EN[m])} ${ym.slice(2, 4)}`; }
const DIA_EN: Record<string, string> = { Seg: 'Mon', Ter: 'Tue', Qua: 'Wed', Qui: 'Thu', Sex: 'Fri', 'Sáb': 'Sat', Dom: 'Sun' };
function diaRot(d: string) { return t(d, DIA_EN[d] || d); }
function nomeZona(z: string) { return z === 'cmbraga_bcd' ? t('Rede geral (cmbraga_bcd)', 'General network (cmbraga_bcd)') : z; }

function MapaZonas({ zonas }: { zonas: any[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: any = null; let cancelado = false;
    const w = window as any;
    if (!document.getElementById('leaflet-css')) { const lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
    const pronto = new Promise<any>((ok) => { if (w.L) return ok(w.L); const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => ok(w.L); document.head.appendChild(sc); });
    pronto.then((L: any) => {
      if (cancelado || !caixa.current || !L) return;
      mapa = L.map(caixa.current, { center: [41.5515, -8.4245], zoom: 15, scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19, className: 'obs-osm-escuro' }).addTo(mapa);
      let max = 1;
      for (let i = 0; i < zonas.length; i++) if (zonas[i].n > max) max = zonas[i].n;
      const grupo = L.featureGroup();
      for (let i = 0; i < zonas.length; i++) {
        const z = zonas[i];
        L.circleMarker([z.lat, z.lon], { radius: 8 + 30 * Math.sqrt(z.n / max), color: '#8AB0E6', weight: 1.5, fillColor: '#8AB0E6', fillOpacity: 0.35 })
          .bindTooltip(`${z.zona}: ${z.n.toLocaleString('pt-PT')}`, { direction: 'top' }).addTo(grupo);
      }
      grupo.addTo(mapa);
      const b = grupo.getBounds(); if (b.isValid()) mapa.fitBounds(b, { padding: [40, 40], maxZoom: 16 });
      setTimeout(() => mapa && mapa.invalidateSize(), 250);
    });
    return () => { cancelado = true; if (mapa) mapa.remove(); };
  }, [zonas]);
  return <div ref={caixa} style={{ height: 340, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }} />;
}

const NOMES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const NOMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function mesNome(ym: string) { const m = Number(ym.slice(5, 7)) - 1; return t(NOMES_PT[m], NOMES_EN[m]); }

export default function Bairros() {
  const zonas: any[] = B.zonasTotal.slice().sort((a: any, b: any) => b[1] - a[1]);
  // Média diária calculada a partir da série diária exportada (dias com registo). O painel da plataforma Braga Smart Retail mostra 356,
  // calculado de outra forma; usa-se o valor que se consegue reproduzir a partir dos dados.
  const diarioW: any[] = B.diario;
  let somaW = 0;
  for (let i = 0; i < diarioW.length; i++) somaW += Number(diarioW[i][1]) || 0;
  const mediaDia = diarioW.length ? somaW / diarioW.length : 0;
  const totZ = zonas.reduce((a: number, x: any) => a + x[1], 0) || 1;
  const sessao: Record<string, number> = {};
  for (let i = 0; i < B.zonas.length; i++) sessao[B.zonas[i].zona] = B.zonas[i].sessao;
  const souto = zonas.find((x: any) => x[0] === 'Rua do Souto');
  const mensal: any[] = B.mensal.map((x: any) => ({ mes: mesRot(x[0]), nome: mesNome(x[0]), v: x[1], dias: x[2] }));
  const picoMes = mensal.reduce((a, x) => (x.v > a.v ? x : a), mensal[0]);
  const semana: any[] = B.semana.map((x: any) => ({ dia: diaRot(x[0]), v: x[1] }));
  const hora: any[] = B.hora.map((x: any) => ({ h: x[0], v: x[1] }));
  const picoHora = hora.reduce((a, x) => (x.v > a.v ? x : a), hora[0]);
  const sessaoMedia = B.sessaoSemana.reduce((a: number, x: any) => a + x[1], 0) / Math.max(1, B.sessaoSemana.length);
  const tipos: string[] = B.autocarros.tipos;
  const autoc: any[] = B.autocarros.mensal.map((x: any) => { const o: any = { mes: mesRot(x[0]), dias: x[1] }; for (let i = 0; i < tipos.length; i++) o[tipos[i]] = x[2 + i]; return o; });
  const ultimos12 = B.autocarros.mensal;
  let somaDia = 0; let nDias = 0;
  for (let i = 0; i < ultimos12.length; i++) { const x = ultimos12[i]; const tot = x[2] + x[3] + x[4] + x[5]; somaDia += tot * x[1]; nDias += x[1]; }
  const chegadasDia = nDias ? somaDia / nDias : 0;
  const geoWifi: any[] = B.semanaGeoWifi.map((x: any) => ({ dia: diaRot(x[0]), geo: x[1], wifi: x[2] }));
  const CORES_T: Record<string, string> = { Nacional: C.accent, 'Nacional Expresso': C.cyan, 'LISTA BRANCA': C.positive, Internacional: C.orange };
  const NOMES_T: Record<string, string> = { Nacional: t('Nacional', 'National'), 'Nacional Expresso': t('Nacional Expresso', 'National Express'), 'LISTA BRANCA': t('«Lista branca»', '«White list»'), Internacional: t('Internacional', 'International') };
  return (
    <>
      <SectionTitle sub={FONTE}>{t(`Bairros Comerciais Digitais: em média ${fmt(Math.round(mediaDia))} dispositivos por dia na rede Wi-Fi; a Rua do Souto concentra ${dec(souto ? (souto[1] / totZ) * 100 : 0, 0)}% das contagens`, `Digital Commercial Districts: on average ${fmt(Math.round(mediaDia))} devices a day on the Wi-Fi network; Rua do Souto accounts for ${dec(souto ? (souto[1] / totZ) * 100 : 0, 0)}% of counts`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Dispositivos por dia', 'Devices per day')} value={fmt(Math.round(mediaDia))} sub={t(`média de ${diarioW.length} dias com registo; um dispositivo não é necessariamente uma pessoa diferente`, `average over ${diarioW.length} days with data; a device is not necessarily a different person`)} color={C.accent} />
        <KPI label={t('Mês com mais dispositivos', 'Month with most devices')} value={picoMes ? picoMes.nome : '-'} sub={t(`${fmt(picoMes ? picoMes.v : 0)} dispositivos por dia`, `${fmt(picoMes ? picoMes.v : 0)} devices per day`)} color={C.positive} />
        <KPI label={t('Hora com mais dispositivos', 'Hour with most devices')} value={`${picoHora.h}h`} sub={t(`${dec(picoHora.v)} dispositivos, em média`, `${dec(picoHora.v)} devices on average`)} color={C.orange} />
        <KPI label={t('Tempo de ligação', 'Connection time')} value={`${fmt(Math.round(sessaoMedia))} min`} sub={t('duração média de uma sessão Wi-Fi (média dos dias da semana)', 'average Wi-Fi session length (mean of weekdays)')} color={C.purple} />
        <KPI label={t('Autocarros que chegam de fora', 'Coaches arriving from outside')} value={fmt(Math.round(chegadasDia))} sub={t('por dia ao Centro Coordenador de Transportes, 9 out 2025 a 7 out 2026', 'per day at the coach station, 9 Oct 2025 to 7 Oct 2026')} color={C.cyan} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('Dispositivos na rede Wi-Fi por dia (média de cada mês, 1 jan a 7 out 2026)', 'Devices on the Wi-Fi network per day (monthly average, 1 Jan to 7 Oct 2026)')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mensal} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(Number(v)), t('Dispositivos por dia', 'Devices per day')]} />
              <Bar dataKey="v" name={t('Dispositivos por dia', 'Devices per day')} fill={C.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('Outubro inclui só os primeiros 7 dias. A descida desde a primavera pode refletir mudanças na rede (pontos ativos), e não apenas menos pessoas: convém confirmar com a equipa da Braga Smart Retail antes de tirar conclusões.', 'October includes only the first 7 days. The drop since spring may reflect network changes (active access points), not just fewer people: worth confirming with the Braga Smart Retail team before drawing conclusions.')}</div>
        </Card>
        <Card title={t('Ao longo da semana e do dia (média de dispositivos)', 'Through the week and the day (average devices)')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={semana} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="dia" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
                <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(Number(v)), t('Dispositivos por dia', 'Devices per day')]} />
                <Bar dataKey="v" name={t('Por dia', 'Per day')} fill={C.positive} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={hora} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="h" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} tickFormatter={(h: any) => `${h}h`} interval={3} />
                <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
                <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} labelFormatter={(h: any) => `${h}h`} formatter={(v: any) => [dec(Number(v)), t('Dispositivos por hora', 'Devices per hour')]} />
                <Line type="monotone" dataKey="v" name={t('Por hora', 'Per hour')} stroke={C.orange} strokeWidth={2.2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('Sexta-feira é o dia com mais dispositivos; o domingo, o mais calmo. Ao longo do dia, a presença sobe a partir das 7h e atinge o máximo às 14h.', 'Friday has the most devices; Sunday the fewest. During the day, presence rises from 7:00 and peaks at 14:00.')}</div>
        </Card>
      </div>

      <Card title={t('Zonas: onde está a rede e quanto dura cada ligação', 'Zones: where the network is and how long each connection lasts')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
          <MapaZonas zonas={B.zonas} />
          <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
            <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '6px' }}>{t('Zona', 'Zone')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Contagens', 'Counts')}</th><th style={{ padding: '6px', textAlign: 'right' }}>%</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Sessão média', 'Avg session')}</th></tr></thead>
              <tbody>{zonas.map((z: any) => (
                <tr key={z[0]} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '7px 6px', color: C.text }}>{nomeZona(z[0])}</td>
                  <td data-l={t('Contagens', 'Counts')} style={{ padding: '7px 6px', textAlign: 'right', color: C.text, fontWeight: 700 }}>{fmt(z[1])}</td>
                  <td data-l="%" style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>{dec((z[1] / totZ) * 100)}%</td>
                  <td data-l={t('Sessão média', 'Avg session')} style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>{sessao[z[0]] != null ? `${fmt(Math.round(sessao[z[0]]))} min` : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t('Soma das contagens diárias de dispositivos por zona (1 jan a 7 out 2026); a mesma pessoa conta uma vez por cada dia em que se liga. «cmbraga_bcd» é o nome da rede no ficheiro, sem zona atribuída. Na Rua do Souto, cada sessão dura em média mais de uma hora (69 min), muito acima das outras zonas (14 a 27 min). A sessão é o tempo de ligação à rede, que pode incluir quem trabalha ou mora na rua.', 'Sum of daily device counts per zone (1 Jan to 7 Oct 2026); the same person counts once for each day they connect. «cmbraga_bcd» is the network name in the file, with no zone assigned. On Rua do Souto each session lasts over an hour on average (69 min), far above the other zones (14 to 27 min). A session is the time connected to the network, which may include people who work or live on the street.')}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('Autocarros que chegam de fora ao Centro Coordenador de Transportes (média por dia)', 'Coaches arriving from outside at the coach station (daily average)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={autoc} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [dec(Number(v)), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {tipos.map((tp) => <Bar key={tp} dataKey={tp} name={NOMES_T[tp] || tp} stackId="a" fill={CORES_T[tp] || C.textDim} />)}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('Chegadas de serviços ao Centro Coordenador de Transportes, por tipo de serviço, de outubro de 2025 a outubro de 2026. As ligações internacionais mais do que duplicaram no verão (de 16 por dia em fevereiro para quase 34 em agosto). A categoria «LISTA BRANCA» (nome no ficheiro, significado a confirmar) praticamente só aparece a partir de janeiro de 2026, o que explica parte do aumento do total.', 'Service arrivals at the Transport Coordination Centre, by service type, October 2025 to October 2026. International services more than doubled in summer (from 16 a day in February to almost 34 in August). The «LISTA BRANCA» category (name in the file, meaning to be confirmed) practically only appears from January 2026, which explains part of the rise in the total.')}</div>
        </Card>
        <Card title={t('Peso de cada dia da semana: visitas ao concelho (telemóveis) e Wi-Fi do centro (% da semana)', 'Share of each weekday: visits to the municipality (phones) and centre Wi-Fi (% of the week)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={geoWifi} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="dia" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${dec(Number(v))}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="geo" name={t('Visitas ao concelho (Geoanalytics)', 'Visits to the municipality (Geoanalytics)')} fill={C.purple} radius={[3, 3, 0, 0]} />
              <Bar dataKey="wifi" name={t('Wi-Fi do bairro', 'District Wi-Fi')} fill={C.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('As visitas ao concelho crescem ao fim de semana (sábado e domingo valem mais de um terço da semana), mas o Wi-Fi do centro cai ao domingo. Os dados não explicam a diferença: as duas fontes medem coisas distintas e cobrem períodos diferentes (telemóveis: outubro a dezembro de 2025; Wi-Fi: outubro de 2025 a outubro de 2026).', 'Visits to the municipality rise at weekends (Saturday and Sunday make up over a third of the week), but the centre’s Wi-Fi falls on Sunday. The data do not explain the difference: the two sources measure different things and cover different periods (phones: October to December 2025; Wi-Fi: October 2025 to October 2026).')}</div>
        </Card>
      </div>
    </>
  );
}
