'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { GEO_VISITAS } from '@/app/lib/mobilidade-bairros-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// Visitas ao concelho medidas por geolocalização agregada e anónima (Geoanalytics, na plataforma Braga Smart Retail):
// visitas de um dia e com dormida, nacionais e internacionais, outubro a dezembro de 2025.
const G: any = GEO_VISITAS;
const FONTE = 'Braga Smart Retail · Geoanalytics · outubro a dezembro de 2025 · exportado a 08/10/2026';
const dec = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function mesRot(ym: string) { const m = Number(ym.slice(5, 7)) - 1; return t(MESES_PT[m], MESES_EN[m]); }
const DUR_PT: Record<string, string> = { '<2h': 'Menos de 2 h', '2-5h': '2 a 5 h', '6-12h': '6 a 12 h', Overnight: 'Com dormida', '>12h': 'Mais de 12 h, sem dormida' };
const DUR_EN: Record<string, string> = { '<2h': 'Under 2 h', '2-5h': '2 to 5 h', '6-12h': '6 to 12 h', Overnight: 'Overnight', '>12h': 'Over 12 h, no overnight' };
const TIPO_PT: Record<string, string> = { Regulares: 'Regulares', Residentes: 'Residentes', Turistas: 'Turistas', Visitantes: 'Visitantes' };
const TIPO_EN: Record<string, string> = { Regulares: 'Regulars', Residentes: 'Residents', Turistas: 'Tourists', Visitantes: 'Visitors' };

export default function VisitasConcelho() {
  const diario: any[] = G.diario;
  let dia = 0; let dorm = 0;
  for (let i = 0; i < diario.length; i++) { dorm += diario[i][1]; dia += diario[i][2]; }
  const pctDia = (dia / Math.max(1, dia + dorm)) * 100;
  const mensal: any[] = G.mensal;
  const ult = mensal[mensal.length - 1]; const ant = mensal.length > 1 ? mensal[mensal.length - 2] : null;
  const varNac = ant ? (ult[1] / ant[1] - 1) * 100 : null;
  const varInt = ant && ant[2] ? (ult[2] / ant[2] - 1) * 100 : null;
  const dados = diario.map((x) => ({ d: `${x[0].slice(8, 10)}/${x[0].slice(5, 7)}`, dorm: x[1], dia: x[2] }));
  const cab: string[] = G.duracao.cab;
  const dur = cab.map((c, i) => ({ c: t(DUR_PT[c] || c, DUR_EN[c] || c), nac: G.duracao.Nacional[i], int: G.duracao.Internacional[i] }));
  const tcab: string[] = G.tipologia.cab;
  const tipo = (G.tipologia.meses as any[]).map((m) => { const o: any = { mes: mesRot(m[0]) }; for (let i = 0; i < tcab.length; i++) o[tcab[i]] = m[1 + i]; return o; });
  const CORES: Record<string, string> = { Visitantes: C.accent, Residentes: C.textDim, Turistas: C.orange, Regulares: C.purple };
  const nacInt = (G.nacInt as any[]).map((m) => ({ mes: mesRot(m[0]), int: m[1], nac: m[2] }));
  const fds = diario.filter((x) => { const d = new Date(`${x[0]}T12:00:00Z`).getUTCDay(); return d === 0 || d === 6; });
  const uteis = diario.filter((x) => { const d = new Date(`${x[0]}T12:00:00Z`).getUTCDay(); return d > 0 && d < 6; });
  const media = (l: any[]) => l.reduce((a, x) => a + x[1] + x[2], 0) / Math.max(1, l.length);
  const razaoFds = media(fds) / Math.max(1, media(uteis));
  return (
    <>
      <SectionTitle sub={FONTE}>{t(`${dec(pctDia, 0)}% das visitas ao concelho não incluem dormida: são visitas de um dia`, `${dec(pctDia, 0)}% of visits to the municipality do not include an overnight stay: they are day visits`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Visitas de um dia', 'Day visits')} value={`${dec(pctDia)}%`} sub={t(`${fmt(dia)} visitas entre 9 out. e 31 dez. 2025`, `${fmt(dia)} visits between 9 Oct and 31 Dec 2025`)} color={C.accent} />
        <KPI label={t('Visitantes nacionais', 'Domestic visitors')} value={fmt(ult[1])} sub={t(`em ${mesRot(ult[0])}${varNac != null ? ` · ${varNac >= 0 ? '+' : ''}${dec(varNac)}% face a ${mesRot(ant[0])}` : ''}`, `in ${mesRot(ult[0])}${varNac != null ? ` · ${varNac >= 0 ? '+' : ''}${dec(varNac)}% vs ${mesRot(ant[0])}` : ''}`)} color={C.positive} />
        <KPI label={t('Turistas internacionais', 'International tourists')} value={fmt(ult[2])} sub={t(`em ${mesRot(ult[0])}${varInt != null ? ` · ${varInt >= 0 ? '+' : ''}${dec(varInt)}% face a ${mesRot(ant[0])}` : ''}`, `in ${mesRot(ult[0])}${varInt != null ? ` · ${varInt >= 0 ? '+' : ''}${dec(varInt)}% vs ${mesRot(ant[0])}` : ''}`)} color={C.orange} />
        <KPI label={t('Ficam a dormir', 'Stay overnight')} value={`${dec(G.comDormida.nac)}% · ${dec(G.comDormida.int)}%`} sub={t('nacionais · internacionais', 'domestic · international')} color={C.purple} />
        <KPI label={t('Quanto tempo ficam', 'How long they stay')} value={`${dec(G.noites.nac, 2)} · ${dec(G.noites.int, 2)}`} sub={t(`noites (com dormida, nac. · int.); de dia: ${dec(G.horasDiurna.nac, 1)} h · ${dec(G.horasDiurna.int, 1)} h`, `nights (overnight, dom. · int.); day visits: ${dec(G.horasDiurna.nac, 1)} h · ${dec(G.horasDiurna.int, 1)} h`)} color={C.cyan} />
      </div>

      <Card title={t('Visitas por dia: de um dia e com dormida (outubro a dezembro de 2025)', 'Visits per day: day visits and overnight (October to December 2025)')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dados} margin={{ top: 6, right: 10, left: -4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="d" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={6} />
            <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${Math.round(Number(v) / 1000)}k`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(Number(v)), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="dia" name={t('De um dia', 'Day visits')} stackId="a" fill={C.accent} />
            <Bar dataKey="dorm" name={t('Com dormida', 'Overnight')} stackId="a" fill={C.orange} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t(`Cada barra é um dia. Ao fim de semana há, em média, ${dec(razaoFds)} vezes mais visitas do que num dia útil. No fim de dezembro, período de festas, sobem sobretudo as visitas com dormida.`, `Each bar is a day. At weekends there are on average ${dec(razaoFds)} times more visits than on a weekday. In late December, the holiday period, overnight visits rise the most.`)}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
        <Card title={t('Quanto dura a visita (% das visitas)', 'How long the visit lasts (% of visits)')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dur} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="c" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={0} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${dec(Number(v))}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="nac" name={t('Nacionais', 'Domestic')} fill={C.accent} radius={[3, 3, 0, 0]} />
              <Bar dataKey="int" name={t('Internacionais', 'International')} fill={C.orange} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t(`${dec(G.duracao.Nacional[0] + G.duracao.Nacional[1])}% das visitas nacionais duram até 5 horas. Nos internacionais, as visitas com dormida pesam mais do dobro do que nos nacionais.`, `${dec(G.duracao.Nacional[0] + G.duracao.Nacional[1])}% of domestic visits last up to 5 hours. Among international visitors, overnight visits weigh more than twice as much as among domestic visitors.`)}</div>
        </Card>
        <Card title={t('Quem está no concelho: tipo de presença (% das visitas)', 'Who is in the municipality: type of presence (% of visits)')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tipo} layout="vertical" margin={{ top: 6, right: 16, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${v}%`} />
              <YAxis type="category" dataKey="mes" width={80} stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${dec(Number(v))}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {tcab.map((c) => <Bar key={c} dataKey={c} name={t(TIPO_PT[c] || c, TIPO_EN[c] || c)} stackId="a" fill={CORES[c] || C.textDim} />)}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t(`A categoria «Visitantes», definida pelo fornecedor pelo padrão de presença, é a maior parte das presenças. A parte dos internacionais nas visitas foi de ${nacInt.map((x) => `${dec(x.int)}% em ${x.mes}`).join(', ')}.`, `The «Visitors» category, defined by the provider from presence patterns, is most of the presence. The international share of visits was ${nacInt.map((x) => `${dec(x.int)}% in ${x.mes}`).join(', ')}.`)}</div>
        </Card>
      </div>
      <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6, margin: '4px 2px 16px' }}>{t('Como ler: dados de geolocalização agregados e anónimos (Geoanalytics), que contam visitas e não pessoas, e distinguem residentes, visitantes e turistas pelo padrão de presença. Cobrem só outubro a dezembro de 2025, por isso ainda não mostram a época alta. Completam o inquérito ao visitante (amostra pequena) e o INE (que só conta dormidas em alojamento).', 'How to read: aggregated, anonymous geolocation data (Geoanalytics), which counts visits, not people, and distinguishes residents, visitors and tourists by presence pattern. They only cover October to December 2025, so they do not yet show the peak season. They complement the visitor survey (small sample) and INE (which only counts overnight stays in accommodation).')}</div>
    </>
  );
}
