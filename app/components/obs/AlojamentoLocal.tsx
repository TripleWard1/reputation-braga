'use client';

import { useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { t } from '@/app/lib/i18n';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';
import { FREGUESIAS, POP_CONCELHO, CENSOS_FONTE, type Freguesia } from '@/app/lib/freguesias-dados';

// Pressão do alojamento local por freguesia: camas de AL por 100 residentes (Censos 2021).
// Funções de topo, sem funções aninhadas que usem parâmetros de fora (o compressor do Next.js parte esse padrão).
interface Pressao { nome: string; pop: number; n: number; camas: number; racio: number; estrangeiros: number; centro: boolean }
function pressaoFreguesias(al: any[]): Pressao[] {
  const r: Pressao[] = [];
  for (let i = 0; i < al.length; i++) {
    let fr: Freguesia | null = null;
    for (let j = 0; j < FREGUESIAS.length; j++) if (FREGUESIAS[j].nomeAL === al[i].freguesia) fr = FREGUESIAS[j];
    if (!fr || !fr.pop) continue;
    r.push({ nome: fr.nome, pop: fr.pop, n: al[i].n, camas: al[i].camas, racio: (al[i].camas / fr.pop) * 100, estrangeiros: (fr.estrangeiros / fr.pop) * 100, centro: !!al[i].centro });
  }
  r.sort(porRacio);
  return r;
}
function porRacio(a: Pressao, b: Pressao) { return b.racio - a.racio; }
const f2 = (v: number) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CartaoPressao({ lista, media }: { lista: Pressao[]; media: number }) {
  const max = lista.length ? lista[0].racio : 1;
  return (
    <Card title={t('Pressão do alojamento local por freguesia', 'Short-term rental pressure by parish')}>
      <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginBottom: 10 }}>{t(`Camas de alojamento local por 100 residentes. A média do concelho é ${f2(media)}; a linha tracejada marca esse valor.`, `Short-term rental beds per 100 residents. The municipal average is ${f2(media)}; the dashed line marks it.`)}</div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {lista.slice(0, 10).map((x) => <LinhaPressao key={x.nome} x={x} max={max} media={media} />)}
      </ul>
      <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 10 }}>{t(`Fontes: base municipal do alojamento local; ${CENSOS_FONTE}. Só inclui o alojamento local; a hotelaria não está disponível por freguesia.`, `Sources: municipal short-term rental database; INE, 2021 Census (final results). Short-term rentals only; hotel data is not available by parish.`)}</div>
    </Card>
  );
}
function LinhaPressao({ x, max, media }: { x: Pressao; max: number; media: number }) {
  const w = Math.max(2, (x.racio / max) * 100); const m = Math.min(100, (media / max) * 100);
  const cor = x.racio >= media * 2 ? C.orange : x.racio >= media ? C.info : C.accent;
  return (
    <li>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
        <span style={{ color: C.text, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome.replace('Braga (São José de São Lázaro e São João do Souto)', 'Braga (S. José S. Lázaro e S. João Souto)')}</span>
        <b style={{ color: cor, whiteSpace: 'nowrap' }}>{f2(x.racio)}</b>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 999, background: C.cardAlt, marginTop: 4 }}>
        <div style={{ width: `${w}%`, height: '100%', borderRadius: 999, background: cor }} />
        <div aria-hidden="true" style={{ position: 'absolute', top: -3, bottom: -3, left: `${m}%`, borderLeft: `2px dashed ${C.textMuted}` }} />
      </div>
      <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 3 }}>{t(`${fmt(x.camas)} camas · ${fmt(x.pop)} residentes · ${fmt(x.estrangeiros, 1)}% estrangeiros`, `${fmt(x.camas)} beds · ${fmt(x.pop)} residents · ${fmt(x.estrangeiros, 1)}% foreign nationals`)}</div>
    </li>
  );
}


// Mapa verdadeiro do Alojamento Local (Leaflet; OpenStreetMap escurecido, ou CARTO se houver chave)
function MapaAL({ pontos }: { pontos: number[][] }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: any = null; let cancelado = false;
    const w = window as any;
    if (!document.getElementById('leaflet-css')) { const lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
    const pronto = new Promise<any>((ok) => { if (w.L) return ok(w.L); const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => ok(w.L); document.head.appendChild(sc); });
    pronto.then((L: any) => {
      if (cancelado || !caixa.current || !L) return;
      mapa = L.map(caixa.current, { center: [41.55, -8.42], zoom: 13, scrollWheelZoom: false });
      const chave = process.env.NEXT_PUBLIC_CARTO_KEY;
      if (chave) L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${chave}`, { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19 }).addTo(mapa);
      else L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19, className: 'obs-osm-escuro' }).addTo(mapa);
      const grupo = L.featureGroup();
      pontos.forEach((p) => L.circleMarker([p[0], p[1]], { radius: 5, color: '#EDA06B', weight: 1, fillColor: '#EDA06B', fillOpacity: 0.45 }).addTo(grupo));
      grupo.addTo(mapa);
      const b = grupo.getBounds(); if (b.isValid()) mapa.fitBounds(b, { padding: [24, 24], maxZoom: 15 });
      setTimeout(() => mapa && mapa.invalidateSize(), 250);
    });
    return () => { cancelado = true; if (mapa) mapa.remove(); };
  }, [pontos]);
  return <div ref={caixa} className="obs-mapa-al" style={{ height: 420, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }} />;
}

// ═══ Alojamento Local (base municipal da taxa turística; mapa do RNAL) - só leitura ═══
export default function AlojamentoLocal() {
  const A: any = AL_BRAGA;
  const MOD: Record<string, string> = { 'Apartamento': t('Apartamento', 'Apartment'), 'Moradia': t('Moradia', 'House'), 'Estabelecimento de Hospedagem/Hostel': t('Hospedagem / hostel', 'Guesthouse / hostel'), 'Quartos': t('Quartos', 'Rooms') };
  const fr: any[] = A.freguesias;
  const centro = fr.filter((x) => x.centro);
  const nCentro = centro.reduce((a, x) => a + x.n, 0), cCentro = centro.reduce((a, x) => a + x.camas, 0);
  const curto = (f: string) => f.replace('União das freguesias de ', '').replace('Braga (São José de São Lázaro e São João do Souto)', 'Braga (S. José S. Lázaro e S. João Souto)');
  const freg = fr.slice(0, 10).map((x) => ({ freguesia: curto(x.freguesia), n: x.n, camas: x.camas }));
  const anos = (A.porAno as any[]).filter((x) => +x.ano >= 2010).map((x) => ({ ano: x.ano, n: x.n }));
  const mods = Object.entries(A.modalidades as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ mod: MOD[k] || k, v }));
  const E = A.estados;
  const pts: number[][] = A.pontos.filter((p: number[]) => p[0] > 41.4 && p[0] < 41.7 && p[1] > -8.6 && p[1] < -8.2);
  const pc = (a: number, b: number) => Math.round((a / Math.max(1, b)) * 100);
  const pressao = pressaoFreguesias(fr);
  const mediaPressao = (A.camas / POP_CONCELHO.pop) * 100;
  let popCentro = 0; for (let i = 0; i < pressao.length; i++) if (pressao[i].centro) popCentro += pressao[i].pop;
  const racioCentro = popCentro ? (cCentro / popCentro) * 100 : 0;
  return (
    <>
      <SectionTitle sub={A.fonte}>{t(`${A.total} alojamentos locais ativos; ${pc(nCentro, A.total)}% estão nas quatro freguesias do centro`, `${A.total} active short-term rentals; ${pc(nCentro, A.total)}% are in the four central parishes`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Alojamentos locais ativos', 'Active short-term rentals')} value={fmt(A.total)} sub={t(`${fmt(A.camas)} camas · ${fmt(A.quartos)} quartos`, `${fmt(A.camas)} beds · ${fmt(A.quartos)} rooms`)} color={C.accent} />
        <KPI label={t('No centro da cidade', 'In the city centre')} value={`${pc(nCentro, A.total)}%`} sub={t(`${fmt(nCentro)} alojamentos · ${pc(cCentro, A.camas)}% das camas`, `${fmt(nCentro)} rentals · ${pc(cCentro, A.camas)}% of beds`)} color={C.orange} />
        <KPI label={t('Apartamentos', 'Apartments')} value={`${pc(A.modalidades['Apartamento'] || 0, A.total)}%`} sub={t(`${fmt(A.modalidades['Apartamento'] || 0)} alojamentos`, `${fmt(A.modalidades['Apartamento'] || 0)} rentals`)} color={C.purple} />
        <KPI label={t('Cessaram atividade', 'Ceased activity')} value={fmt(E.cessadosPermanente + E.cessadosTemporario)} sub={t(`${E.cessadosPermanente} de vez · ${E.cessadosTemporario} temporariamente · ${fmt(A.camasCessadas)} camas`, `${E.cessadosPermanente} permanently · ${E.cessadosTemporario} temporarily · ${fmt(A.camasCessadas)} beds`)} color={C.negative} />
        <KPI label={t('Pressão no centro', 'Pressure in the centre')} value={f2(racioCentro)} sub={t(`camas de AL por 100 residentes (concelho: ${f2(mediaPressao)})`, `rental beds per 100 residents (municipality: ${f2(mediaPressao)})`)} color={C.negative} />
        <KPI label={t('Camas por alojamento', 'Beds per rental')} value={(A.camas / Math.max(1, A.total)).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} sub={t('em média', 'on average')} color={C.cyan} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Onde estão: cada ponto é um registo', 'Where they are: each dot is a registration')}>
          <MapaAL pontos={pts} />
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{t(`O mapa usa as coordenadas do registo nacional (${A.fonteMapa}, ${fmt(A.registosRNAL)} registos), porque a base municipal não tem localização. Algumas coordenadas são só ao nível do código postal.`, `The map uses national registry coordinates (${A.fonteMapa}, ${fmt(A.registosRNAL)} records), since the municipal database has no location. Some coordinates are postcode-level only.`)}</div>
        </Card>
        <Card title={t('Por freguesia (alojamentos ativos)', 'By parish (active rentals)')}>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={freg} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis type="category" dataKey="freguesia" width={180} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any, it: any) => [`${fmt(v)} · ${fmt(it?.payload?.camas)} ${t('camas', 'beds')}`, t('Alojamentos', 'Rentals')]} />
              <Bar dataKey="n" name={t('Alojamentos', 'Rentals')} fill={C.orange} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <CartaoPressao lista={pressao} media={mediaPressao} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Ano de início de atividade (alojamentos ativos)', 'Year activity began (active rentals)')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={anos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Alojamentos', 'Rentals')]} />
              <Bar dataKey="n" name={t('Alojamentos', 'Rentals')} fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t('Só conta os alojamentos ainda ativos, pelo ano em que começaram a atividade. O registo do ano em curso está incompleto.', 'Only rentals still active, by the year they began operating. The current year is incomplete.')}</div>
        </Card>
        <Card title={t('Por modalidade (alojamentos ativos)', 'By type (active rentals)')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mods} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis type="category" dataKey="mod" width={140} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Alojamentos', 'Rentals')]} />
              <Bar dataKey="v" name={t('Alojamentos', 'Rentals')} fill={C.purple} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t(`Base municipal: ${fmt(A.registados)} alojamentos locais registados, dos quais ${fmt(E.ativos)} ativos. ${E.semEstado} registos não têm estado indicado e não entram nas contas.`, `Municipal database: ${fmt(A.registados)} registered rentals, ${fmt(E.ativos)} active. ${E.semEstado} records have no status and are excluded.`)}</div>
        </Card>
      </div>
    </>
  );
}

