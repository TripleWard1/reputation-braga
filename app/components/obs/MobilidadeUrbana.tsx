'use client';

import { useEffect, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { MOB_URBANA } from '@/app/lib/mobilidade-bairros-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// Monitorização da Mobilidade Urbana (plataforma i4Biz · Braga Smart Retail): trânsito, peões, TUB, rotas congestionadas e parques.
// Valores em percentagem sempre que o período de cada exportação não vem indicado no ficheiro.
const M: any = MOB_URBANA;
const FONTE = 'i4Biz (Braga Smart Retail · Dipcode) · Monitorização da Mobilidade Urbana · exportado a 08/10/2026 · as exportações de tráfego, percursos e TUB não indicam o período a que se referem; os parques referem-se a 22/06 a 08/10/2026';
const SEM_PERIODO = ['Período não indicado na exportação.', 'Period not stated in the export.'];
const COR_CLASSE: Record<string, string> = { '4': '#E5484D', '3': '#EDA06B', '2': '#7CC79A' };
function corClasse(c: string) { return COR_CLASSE[c.charAt(0)] || C.textDim; }
function nomeClasse(c: string) {
  const k = c.charAt(0);
  return k === '4' ? t('Congestionado (30% ou mais de tempo extra)', 'Congested (30%+ extra time)') : k === '3' ? t('Moderado (15% a 30%)', 'Moderate (15% to 30%)') : t('Ligeiro (5% a 15%)', 'Light (5% to 15%)');
}
const dec = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const CAT_EN: Record<string, string> = { 'Trânsito automóvel': 'Motor traffic', 'Peões': 'Pedestrians', 'Autocarros': 'Buses', 'Veículo não motorizado': 'Non-motorised vehicles', 'Indefinido': 'Undefined' };
const CLS_EN: Record<string, string> = { 'Automóvel': 'Car', 'Peão': 'Pedestrian', 'Carrinha': 'Van', 'Autocarro': 'Bus', 'Automóvel com reboque': 'Car with trailer', 'Trotinete': 'Scooter', 'Bicicleta': 'Bicycle', 'Carrinho de bebé': 'Pushchair', 'Camião': 'Truck', 'undefined': 'Undefined', 'Cadeira de rodas': 'Wheelchair', 'Camião com reboque': 'Truck with trailer' };
function nomeCat(x: string) { return t(x, CAT_EN[x] || x); }
function nomeCls(x: string) { return t(x === 'undefined' ? 'Indefinido' : x, CLS_EN[x] || x); }
function picoDe(lista: any[], chave: string): number { let m = -1; let h = 0; for (let i = 0; i < lista.length; i++) if (lista[i][chave] > m) { m = lista[i][chave]; h = lista[i].h; } return h; }

function MapaRotas({ segmentos }: { segmentos: any[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: any = null; let cancelado = false;
    const w = window as any;
    if (!document.getElementById('leaflet-css')) { const lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
    const pronto = new Promise<any>((ok) => { if (w.L) return ok(w.L); const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => ok(w.L); document.head.appendChild(sc); });
    pronto.then((L: any) => {
      if (cancelado || !caixa.current || !L) return;
      mapa = L.map(caixa.current, { center: [41.55, -8.42], zoom: 13, scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19, className: 'obs-osm-escuro' }).addTo(mapa);
      const grupo = L.featureGroup();
      for (let i = 0; i < segmentos.length; i++) {
        const s = segmentos[i];
        L.polyline([[s[0], s[1]], [s[2], s[3]]], { color: corClasse(s[4]), weight: s[4].charAt(0) === '4' ? 6 : 4, opacity: 0.9 }).addTo(grupo);
      }
      grupo.addTo(mapa);
      const b = grupo.getBounds(); if (b.isValid()) mapa.fitBounds(b, { padding: [20, 20], maxZoom: 15 });
      setTimeout(() => mapa && mapa.invalidateSize(), 250);
    });
    return () => { cancelado = true; if (mapa) mapa.remove(); };
  }, [segmentos]);
  return <div ref={caixa} style={{ height: 380, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }} />;
}

export default function MobilidadeUrbana() {
  const comp: any[] = M.composicao;
  const transito = comp.find((x) => x.cat === 'Trânsito automóvel');
  const peoes = comp.find((x) => x.cat === 'Peões');
  const naoMotor = comp.find((x) => x.cat === 'Veículo não motorizado');
  const P = M.passagens;
  const rotas: any[] = M.rotas;
  const nCong = rotas.filter((r) => r.classe.charAt(0) === '4').length;
  const ritmo: any[] = M.ritmo;
  const op: any[] = M.ofertaProcura;
  const classes: any[] = [];
  for (let i = 0; i < comp.length; i++) for (let k = 0; k < comp[i].classes.length; k++) classes.push({ nome: nomeCls(comp[i].classes[k][0]), pct: comp[i].classes[k][2], cat: comp[i].cat });
  classes.sort((a, b) => b.pct - a.pct);
  const desajuste = op.filter((x) => x.procura - x.oferta >= 1.5).map((x) => `${x.h}h`);
  const parques: any[] = M.parques;
  const mediaParques = parques.reduce((a, x) => a + x[1], 0) / Math.max(1, parques.length);
  const maxParque = parques.reduce((a, x) => (x[1] > a[1] ? x : a), parques[0] || ['', 0]);
  const rotDados = rotas.map((r) => ({ nome: r.nome, extra: Math.round((r.lent - 1) * 100), p90: Math.round((r.p90 - 1) * 100), classe: r.classe }));
  return (
    <>
      <SectionTitle sub={FONTE}>{t(`Trânsito, peões e autocarros: ${dec(transito ? transito.pct : 0)}% das contagens são automóveis e ${dec(peoes ? peoes.pct : 0)}% peões`, `Traffic, pedestrians and buses: ${dec(transito ? transito.pct : 0)}% of counts are motor vehicles and ${dec(peoes ? peoes.pct : 0)}% pedestrians`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Trânsito automóvel', 'Motor traffic')} value={`${dec(transito ? transito.pct : 0)}%`} sub={t('das contagens dos sensores', 'of sensor counts')} color={C.orange} />
        <KPI label={t('Peões', 'Pedestrians')} value={`${dec(peoes ? peoes.pct : 0)}%`} sub={t(`bicicletas e trotinetes: ${dec(naoMotor ? naoMotor.pct : 0)}%`, `bicycles and scooters: ${dec(naoMotor ? naoMotor.pct : 0)}%`)} color={C.accent} />
        <KPI label={t('Passagens de autocarros TUB por dia útil (horários)', 'TUB bus calls per weekday (timetables)')} value={fmt(P.util)} sub={t(`${fmt(P.sab)} ao sábado · ${fmt(P.dom)} ao domingo`, `${fmt(P.sab)} Saturday · ${fmt(P.dom)} Sunday`)} color={C.positive} />
        <KPI label={t('Percursos congestionados', 'Congested routes')} value={`${nCong} / ${rotas.length}`} sub={t('com 30% ou mais de tempo extra', 'with 30%+ extra travel time')} color={C.negative} />
        <KPI label={t('Ocupação média dos parques', 'Average car park occupancy')} value={`${dec(mediaParques)}%`} sub={t(`${parques.length} dias com registo (Invipo)`, `${parques.length} days recorded (Invipo)`)} color={C.purple} />
      </div>

      <Card title={t('Distribuição ao longo do dia: autocarros, trânsito, peões e Wi-Fi (% do total diário, por hora)', 'Distribution through the day: buses, traffic, pedestrians and Wi-Fi (% of daily total, by hour)')}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={ritmo} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="h" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={(h: any) => `${h}h`} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} labelFormatter={(h: any) => `${h}h`} formatter={(v: any, n: any) => [`${dec(Number(v))}%`, n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="tub" name={t('Oferta TUB (partidas)', 'TUB supply (departures)')} stroke={C.negative} strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="transito" name={t('Trânsito automóvel', 'Motor traffic')} stroke={C.orange} strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="peoes" name={t('Peões', 'Pedestrians')} stroke={C.accent} strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="wifi" name={t('Afluência (Wi-Fi)', 'Footfall (Wi-Fi)')} stroke={C.cyan} strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t(`Os peões têm o pico às ${picoDe(ritmo, 'peoes')}h e o trânsito às ${picoDe(ritmo, 'transito')}h. Depois das 19h, os contadores de peões e de trânsito quase não registam passagens, o que pode refletir o horário de funcionamento dos sensores (a confirmar com a Dipcode); a oferta de autocarros e o Wi-Fi continuam. ${SEM_PERIODO[0]}`, `Pedestrians peak at ${picoDe(ritmo, 'peoes')}:00 and traffic at ${picoDe(ritmo, 'transito')}:00. After 19:00, pedestrian and traffic counters record almost nothing, which may reflect sensor operating hours (to be confirmed with Dipcode); bus supply and Wi-Fi continue. ${SEM_PERIODO[1]}`)}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('TUB: oferta e procura ao longo do dia (% do total diário)', 'TUB: supply and demand through the day (% of daily total)')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={op} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="h" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} tickFormatter={(h: any) => `${h}h`} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} labelFormatter={(h: any) => `${h}h`} formatter={(v: any, n: any) => [`${dec(Number(v))}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="oferta" name={t('Oferta (partidas)', 'Supply (departures)')} stroke={C.negative} strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="procura" name={t('Procura (validações)', 'Demand (validations)')} stroke={C.accent} strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{desajuste.length ? t(`A procura supera a oferta em mais de 1,5 pontos às ${desajuste.join(', ')}: há proporcionalmente mais validações do que partidas, o que sugere autocarros mais cheios. ${SEM_PERIODO[0]}`, `Demand exceeds supply by more than 1.5 points at ${desajuste.join(', ')}: proportionally more validations than departures, suggesting fuller buses. ${SEM_PERIODO[1]}`) : t(`Oferta e procura acompanham-se ao longo do dia. ${SEM_PERIODO[0]}`, `Supply and demand move together through the day. ${SEM_PERIODO[1]}`)}</div>
        </Card>
        <Card title={t('Composição do tráfego contado (% das contagens)', 'Composition of counted traffic (% of counts)')}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classes.slice(0, 9)} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <YAxis type="category" dataKey="nome" width={130} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [`${dec(Number(v), 2)}%`, t('Contagens', 'Counts')]} />
              <Bar dataKey="pct" name={t('Contagens', 'Counts')} fill={C.orange} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 4 }}>{t(`${fmt(M.totalContagens)} contagens dos sensores de tráfego, por classe de veículo. ${SEM_PERIODO[0]}`, `${fmt(M.totalContagens)} traffic sensor counts, by vehicle class. ${SEM_PERIODO[1]}`)}</div>
        </Card>
      </div>

      <Card title={t('Percursos com mais tempo de viagem do que o normal', 'Routes taking longer than normal')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, alignItems: 'start' }}>
          <div>
            <MapaRotas segmentos={M.segmentos} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 12, color: C.textMuted }}>
              {['4', '3', '2'].map((k) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, height: 4, borderRadius: 2, background: COR_CLASSE[k] }} />{nomeClasse(k)}</span>)}
            </div>
          </div>
          <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
            <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '6px' }}>{t('Percurso', 'Route')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Tempo extra', 'Extra time')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Nos piores 10%', 'Worst 10%')}</th></tr></thead>
              <tbody>{rotDados.slice(0, 12).map((r) => (
                <tr key={r.nome} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '7px 6px', color: C.text }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: corClasse(r.classe), marginRight: 8 }} />{r.nome}</td>
                  <td data-l={t('Tempo extra', 'Extra time')} style={{ padding: '7px 6px', textAlign: 'right', color: C.text, fontWeight: 700 }}>+{r.extra}%</td>
                  <td data-l={t('Nos piores 10%', 'Worst 10%')} style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>+{r.p90}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 10 }}>{t(`Tempo extra = quanto mais demora a viagem face à mesma viagem sem trânsito (média das medições). «Nos piores 10%»: o atraso que só é ultrapassado em 10% das medições. ${rotas.length} percursos medidos; os 12 piores na tabela. Os códigos P1 a P6 são pontos de medição da plataforma. ${SEM_PERIODO[0]}`, `Extra time = how much longer the trip takes than the same trip without traffic (average of measurements). "Worst 10%": the delay exceeded in only 10% of measurements. ${rotas.length} routes measured; the worst 12 in the table. Codes P1 to P6 are platform measuring points. ${SEM_PERIODO[1]}`)}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('Paragens com mais passagens de autocarros (dia útil)', 'Stops with most bus calls (weekday)')}>
          <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
            <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '6px' }}>{t('Paragem', 'Stop')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Autocarros', 'Buses')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Útil', 'Wkday')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Sáb', 'Sat')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('Dom', 'Sun')}</th></tr></thead>
              <tbody>{(P.top as any[]).slice(0, 10).map((r) => (
                <tr key={r[0]} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '7px 6px', color: C.text }}>{r[0]}</td>
                  <td data-l={t('Autocarros', 'Buses')} style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>{r[1]}</td>
                  <td data-l={t('Útil', 'Wkday')} style={{ padding: '7px 6px', textAlign: 'right', color: C.text, fontWeight: 700 }}>{fmt(r[2])}</td>
                  <td data-l={t('Sáb', 'Sat')} style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>{fmt(r[3])}</td>
                  <td data-l={t('Dom', 'Sun')} style={{ padding: '7px 6px', textAlign: 'right', color: C.textMuted }}>{fmt(r[4])}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t(`Passagens de autocarros por dia, segundo os horários: ${fmt(P.util)} num dia útil, em ${fmt(P.paragens)} paragens, com ${P.autocarros} autocarros diferentes. O fim de semana tem menos de metade da oferta. ${SEM_PERIODO[0]}`, `Bus calls per day according to timetables: ${fmt(P.util)} on a weekday, across ${fmt(P.paragens)} stops, with ${P.autocarros} different buses. Weekends have less than half the supply. ${SEM_PERIODO[1]}`)}</div>
        </Card>
        <Card title={t('Onde se entra mais no autocarro (% dos embarques)', 'Where most people board (% of boardings)')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(M.embarques.top as any[]).slice(0, 10).map((x) => ({ nome: x[0], pct: x[1] }))} layout="vertical" margin={{ top: 0, right: 26, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <YAxis type="category" dataKey="nome" width={150} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [`${dec(Number(v), 2)}%`, t('Embarques', 'Boardings')]} />
              <Bar dataKey="pct" name={t('Embarques', 'Boardings')} fill={C.positive} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 4 }}>{t(`Percentagem dos embarques registados em ${fmt(M.embarques.paragens)} paragens. A paragem Rotunda Estação II lidera. ${SEM_PERIODO[0]}`, `Share of boardings recorded at ${fmt(M.embarques.paragens)} stops. The Rotunda Estação II stop leads. ${SEM_PERIODO[1]}`)}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('Peso de cada linha na receita do TUB (15 linhas com mais receita)', 'Each line’s share of TUB revenue (top 15 lines)')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(M.receitaLinhas as any[]).map((x) => ({ linha: `${t('Linha', 'Line')} ${x[0]}`, pct: x[1] }))} layout="vertical" margin={{ top: 0, right: 26, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <YAxis type="category" dataKey="linha" width={70} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [`${dec(Number(v))}%`, t('Receita', 'Revenue')]} />
              <Bar dataKey="pct" name={t('Receita', 'Revenue')} fill={C.cyan} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 4 }}>{t(`Percentagem da receita das 15 linhas com mais receita. A linha 2 (Bom Jesus) é a segunda. ${SEM_PERIODO[0]}`, `Share of revenue among the 15 highest-revenue lines. Line 2 (Bom Jesus) is second. ${SEM_PERIODO[1]}`)}</div>
        </Card>
        <Card title={t('Ocupação dos parques de estacionamento monitorizados (% por dia)', 'Occupancy of monitored car parks (% per day)')}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={parques.map((x) => ({ dia: x[0].slice(5).split('-').reverse().join('/'), v: x[1] }))} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="dia" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={13} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} formatter={(v: any) => [`${dec(Number(v))}%`, t('Ocupação', 'Occupancy')]} />
              <Line type="monotone" dataKey="v" name={t('Ocupação', 'Occupancy')} stroke={C.purple} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 4 }}>{t(`Média de ${dec(mediaParques)}% entre ${parques[0] ? parques[0][0].split('-').reverse().join('/') : ''} e ${parques.length ? parques[parques.length - 1][0].split('-').reverse().join('/') : ''}; máximo de ${dec(maxParque[1])}% a ${String(maxParque[0]).split('-').reverse().join('/')}. Sensores Invipo.`, `Average of ${dec(mediaParques)}% between ${parques[0] ? parques[0][0] : ''} and ${parques.length ? parques[parques.length - 1][0] : ''}; peak of ${dec(maxParque[1])}% on ${maxParque[0]}. Invipo sensors.`)}</div>
        </Card>
      </div>
    </>
  );
}
