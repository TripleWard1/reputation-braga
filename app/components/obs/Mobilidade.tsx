'use client';

import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { t } from '@/app/lib/i18n';
import { TUB } from '@/app/lib/tub-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Mobilidade: autocarros da TUB nas linhas com interesse turístico — só leitura ═══
function MiniBarras({ valores, rotulos, cor }: { valores: number[]; rotulos: string[]; cor: string }) {
  const m = Math.max(1, ...valores);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 54 }}>
      {valores.map((v, i) => (
        <div key={i} title={`${rotulos[i]}: ${fmt(v)}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div className="obs-grow" style={{ width: '100%', height: `${Math.max(3, (v / m) * 44)}px`, background: cor, borderRadius: 3, animationDelay: `${i * 35}ms` }} />
          <span style={{ fontSize: 9.5, color: C.textDim }}>{rotulos[i].slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}

// Porque estas linhas: o critério turístico de cada uma (indicado pelo Município)
const PORQUE_LINHAS: { l: string; pt: string; en: string }[] = [
  { l: '2', pt: 'Vai ao Bom Jesus do Monte.', en: 'Goes to Bom Jesus do Monte.' },
  { l: '88', pt: 'Vai ao Sameiro e passa pela estrada do Bom Jesus. Circula só nos dias úteis.', en: 'Goes to Sameiro along the Bom Jesus road. Runs on weekdays only.' },
  { l: '23', pt: 'Vai ao Sameiro, pela Falperra, aos fins de semana e feriados, quando a linha 88 não circula.', en: 'Goes to Sameiro, via Falperra, at weekends and on public holidays, when line 88 does not run.' },
  { l: '5', pt: 'Serve o Estádio Municipal de Braga.', en: 'Serves Braga Municipal Stadium.' },
  { l: '9 · 18', pt: 'Vão até ao Parque de Campismo (Parque da Ponte).', en: 'Go to the campsite (Parque da Ponte).' },
  { l: '40 · 41', pt: 'Circuitos urbanos pela cidade, que facilitam as deslocações no centro histórico.', en: 'Urban circuits around the city, making it easier to get around the historic centre.' },
];

export default function Mobilidade() {
  const T = TUB;
  const MC = [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];
  const rot = (T.meses as string[]).map((m) => MC[+m.slice(5, 7) - 1]);
  const total = (T.linhas as any[]).reduce((a, x) => a + x.total, 0);
  const tur = T.turismo as any[];
  const por = (k: string) => tur.find((x) => x.destino.startsWith(k));
  const bj = tur.filter((x) => x.destino.startsWith('Bom Jesus')).reduce((a, x) => a + x.total, 0);
  const sam = por('Sameiro');
  const [linhaSel, setLinhaSel] = useState('23');
  const L = (T.linhas as any[]).find((x) => x.linha === linhaSel) || T.linhas[0];
  const horas = L.porHora.map((v: number, i: number) => ({ hora: `${i + 5}h`, v }));
  const cores = [C.accent, C.orange, C.positive, C.purple, C.cyan, C.pink, C.textDim];
  const tipoDia = (md: any) => [[t('Dia útil', 'Weekday'), md.util], [t('Sábado', 'Saturday'), md.sab], [t('Domingo', 'Sunday'), md.dom]] as [string, number][];
  return (
    <>
      <SectionTitle sub={T.fonte}>{sam && sam.mediaDia.util ? t(`Sameiro: ao domingo há ${String(sam.mediaDia.dom).replace('.', ',')} entradas por dia nos autocarros de regresso, ${(sam.mediaDia.dom / sam.mediaDia.util).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} vezes mais do que num dia útil`, `Sameiro: on Sundays there are ${sam.mediaDia.dom} boardings a day on return buses, ${(sam.mediaDia.dom / sam.mediaDia.util).toLocaleString('en-GB', { maximumFractionDigits: 1 })} times more than on a weekday`) : t('Autocarros para os destinos turísticos', 'Buses to tourist destinations')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Entradas nas 8 linhas', 'Boardings on the 8 lines')} value={fmt(total)} sub={t('janeiro a setembro de 2026', 'January to September 2026')} color={C.accent} />
        {por('Estação') && <KPI label={t('Estação de comboios', 'Train station')} value={fmt(por('Estação').total)} sub={t(`${String(por('Estação').mediaDia.util).replace('.', ',')} por dia útil (linha 2)`, `${por('Estação').mediaDia.util} per weekday (line 2)`)} color={C.orange} />}
        <KPI label={t('Bom Jesus', 'Bom Jesus')} value={fmt(bj)} sub={t('entradas nas paragens do Bom Jesus (linhas 2 e 88)', 'boardings at Bom Jesus stops (lines 2 and 88)')} color={C.positive} />
        {sam && <KPI label={t('Sameiro', 'Sameiro')} value={fmt(sam.total)} sub={t('regressos do Santuário (linhas 23 e 88)', 'returns from the Sanctuary (lines 23 and 88)')} color={C.purple} />}
        {por('Fonte do Ídolo') && <KPI label={t('Fonte do Ídolo', 'Fonte do Ídolo')} value={fmt(por('Fonte do Ídolo').total)} sub={t('paragem do circuito urbano 41', 'urban circuit 41 stop')} color={C.cyan} />}
      </div>
      <Card title={t('Porquê estas 8 linhas', 'Why these 8 lines')}>
        <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>{t('As linhas não foram escolhidas ao acaso: são as que servem os principais pontos de interesse turístico do concelho.', 'The lines were not chosen at random: they are the ones serving the municipality’s main tourist attractions.')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
          {PORQUE_LINHAS.map((x) => (
            <div key={x.l} style={{ display: 'grid', gridTemplateColumns: '58px minmax(0,1fr)', gap: 10, alignItems: 'start', background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.accent, whiteSpace: 'nowrap' }}>{x.l}</span>
              <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{t(x.pt, x.en)}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title={t('Destinos turísticos: entradas por mês e por tipo de dia', 'Tourist destinations: boardings by month and type of day')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {tur.map((d, i) => (
            <div key={d.destino} style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{d.destino}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '4px 0 10px' }}>{fmt(d.total)}</div>
              <MiniBarras valores={d.porMes} rotulos={rot} cor={cores[i % cores.length]} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10, fontSize: 12, color: C.textMuted }}>
                {tipoDia(d.mediaDia).map(([nm, v]) => <span key={nm}>{nm}: <strong style={{ color: C.text }}>{String(v).replace('.', ',')}</strong></span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 12 }}>{t('Médias de entradas por dia, por tipo de dia. No Bom Jesus (linha 2), conta a paragem Lusíadas IV (Tenões), junto ao Elevador, onde entram os passageiros de regresso à cidade. O Parque da Ponte inclui a zona do parque de campismo, mas também quem vai para a escola e o trabalho.', 'Average boardings per day, by type of day. For Bom Jesus (line 2), the Lusíadas IV (Tenões) stop next to the Funicular is counted, where passengers board on the way back to the city. Parque da Ponte includes the campsite area, but also school and work trips.')}</div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('As linhas', 'The lines')}>
          <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
            <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '7px 6px' }}>{t('Linha', 'Line')}</th><th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Entradas', 'Boardings')}</th><th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Útil', 'Wkday')}</th><th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Sáb', 'Sat')}</th><th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Dom', 'Sun')}</th></tr></thead>
              <tbody>{(T.linhas as any[]).map((x) => (
                <tr key={x.linha} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '8px 6px', color: C.text }}><strong>{x.linha}</strong> · {x.nome}{x.nota && <div style={{ fontSize: 11.5, color: C.textDim }}>{x.nota}</div>}</td>
                  <td data-l={t('Entradas', 'Boardings')} style={{ padding: '8px 6px', textAlign: 'right', color: C.text, fontWeight: 600 }}>{fmt(x.total)}</td>
                  <td data-l={t('Útil', 'Wkday')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{fmt(x.mediaDia.util)}</td>
                  <td data-l={t('Sáb', 'Sat')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{x.mediaDia.sab ? fmt(x.mediaDia.sab) : '—'}</td>
                  <td data-l={t('Dom', 'Sun')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{x.mediaDia.dom ? fmt(x.mediaDia.dom) : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{t('Útil, Sáb e Dom: média de entradas por dia. "—": a linha não circula nesse dia.', 'Wkday, Sat and Sun: average boardings per day. "—": the line does not run that day.')}</div>
        </Card>
        <Card title={t(`A que horas se usa · linha ${L.linha}`, `When it is used · line ${L.linha}`)} right={
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {(T.linhas as any[]).map((x) => <button key={x.linha} onClick={() => setLinhaSel(x.linha)} style={{ minWidth: 34, height: 28, borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${linhaSel === x.linha ? C.accent : C.border}`, background: linhaSel === x.linha ? C.accentBg : 'transparent', color: linhaSel === x.linha ? C.text : C.textMuted }}>{x.linha}</button>)}
          </div>
        }>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={horas} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="hora" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} interval={1} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [fmt(v), t('Entradas', 'Boardings')]} />
              <Bar dataKey="v" name={t('Entradas', 'Boardings')} fill={C.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{t('Paragens com mais entradas: ', 'Busiest stops: ')}{(L.topParagens as any[]).slice(0, 3).map((p) => `${p.paragem} (${fmt(p.n)})`).join(' · ')}</div>
        </Card>
      </div>
      {T.operacao && (() => {
        const O = T.operacao as Record<string, any>;
        const ordem = (T.linhas as any[]).map((x) => x.linha).filter((l: string) => O[l]);
        const op = O[linhaSel] || O[ordem[0]];
        const hs = Array.from(new Set([...Object.keys(op.velPorHora || {}), ...Object.keys(op.atrasoPorHora || {})])).map(Number).sort((a, b) => a - b).filter((h) => h >= 6 && h <= 21);
        const dadosH = hs.map((h) => ({ hora: `${h}h`, vel: op.velPorHora?.[String(h)] ?? null, atrasos: op.atrasoPorHora?.[String(h)] ?? 0 }));
        const comVel = dadosH.filter((x) => x.vel != null) as { hora: string; vel: number; atrasos: number }[];
        const lenta = comVel.length ? comVel.reduce((a, x) => (x.vel < a.vel ? x : a)) : null;
        const rapida = comVel.length ? comVel.reduce((a, x) => (x.vel > a.vel ? x : a)) : null;
        const v1 = (x: number | null | undefined) => (x == null ? '—' : x.toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 }));
        const circ = ['40', '41'].filter((l) => O[l]?.veiculosDia);
        return (
          <>
            <SectionTitle sub={T.fonteOperacao}>{t('Como funciona o serviço: oferta, velocidade e atrasos', 'How the service performs: supply, speed and delays')}</SectionTitle>
            <Card title={t('As linhas em números', 'The lines in numbers')}>
              <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
                <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}>
                    <th style={{ padding: '7px 6px' }}>{t('Linha', 'Line')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Viagens/dia', 'Trips/day')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Passag./viagem', 'Pass./trip')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Km percorridos', 'Km driven')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Velocidade', 'Speed')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Viagens com atraso', 'Trips delayed')}</th>
                    <th style={{ padding: '7px 6px', textAlign: 'right' }}>{t('Atraso típico', 'Typical delay')}</th>
                  </tr></thead>
                  <tbody>{ordem.map((l: string) => { const x = O[l]; const pior = x.pctViagensAtraso >= 25; return (
                    <tr key={l} style={{ borderTop: `1px solid ${C.border}`, cursor: 'pointer', background: l === linhaSel ? 'rgba(138,176,230,.06)' : 'transparent' }} onClick={() => setLinhaSel(l)}>
                      <td style={{ padding: '8px 6px', color: C.text, fontWeight: 700 }}><button type="button" className="obs-linha-btn" onClick={(e) => { e.stopPropagation(); setLinhaSel(l); }} aria-pressed={l === linhaSel} aria-label={t(`Ver a linha ${l} ao longo do dia`, `Show line ${l} through the day`)}>{l}</button></td>
                      <td data-l={t('Viagens/dia', 'Trips/day')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{v1(x.viagensDia)}</td>
                      <td data-l={t('Passag./viagem', 'Pass./trip')} style={{ padding: '8px 6px', textAlign: 'right', color: C.text, fontWeight: 600 }}>{v1(x.paxViagem)}</td>
                      <td data-l={t('Km percorridos', 'Km driven')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{fmt(x.km)}</td>
                      <td data-l={t('Velocidade', 'Speed')} style={{ padding: '8px 6px', textAlign: 'right', color: C.text }}>{v1(x.velMediana)} km/h</td>
                      <td data-l={t('Viagens com atraso', 'Trips delayed')} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: pior ? C.negative : C.text }}>{v1(x.pctViagensAtraso)}%</td>
                      <td data-l={t('Atraso típico', 'Typical delay')} style={{ padding: '8px 6px', textAlign: 'right', color: C.textMuted }}>{v1(x.atrasoMediano)} min</td>
                    </tr>); })}</tbody>
                </table>
              </div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 8, lineHeight: 1.55 }}>{t('Clica numa linha para ver o gráfico ao longo do dia. Velocidade: mediana, calculada com a distância e a duração real de cada viagem. Viagens com atraso: viagens com pelo menos uma chegada a uma paragem 1 minuto ou mais depois do horário. Atraso típico: mediana desses atrasos.', 'Click a line to see the chart through the day. Speed: median, calculated from each trip’s distance and actual duration. Trips delayed: trips with at least one stop arrival 1 minute or more behind schedule. Typical delay: median of those delays.')}</div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: circ.length ? '1.5fr 1fr' : '1fr', gap: 14 }}>
              <Card title={t(`Velocidade e atrasos ao longo do dia · linha ${linhaSel}`, `Speed and delays through the day · line ${linhaSel}`)}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={dadosH} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="hora" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
                    <YAxis yAxisId="a" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
                    <YAxis yAxisId="v" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit=" km/h" domain={[0, 'dataMax + 4']} />
                    <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [v == null ? '—' : n === t('Velocidade', 'Speed') ? `${v1(v)} km/h` : fmt(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="a" dataKey="atrasos" name={t('Chegadas atrasadas', 'Late arrivals')} fill={C.orange} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="v" type="monotone" dataKey="vel" name={t('Velocidade', 'Speed')} stroke={C.accent} strokeWidth={2.5} dot={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
                {lenta && rapida && <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 6 }}>{t(`Mais lenta às ${lenta.hora} (${v1(lenta.vel)} km/h), mais rápida às ${rapida.hora} (${v1(rapida.vel)} km/h).`, `Slowest at ${lenta.hora} (${v1(lenta.vel)} km/h), fastest at ${rapida.hora} (${v1(rapida.vel)} km/h).`)}{op.paragensAtraso?.length ? t(` Paragens com mais atrasos: ${op.paragensAtraso.map((p: any) => p[0]).join(', ').toLowerCase()}.`, ` Stops with most delays: ${op.paragensAtraso.map((p: any) => p[0]).join(', ').toLowerCase()}.`) : ''}</div>}
              </Card>
              {circ.length > 0 && (
                <Card title={t('Circuitos urbanos: veículos e carga', 'Urban circuits: vehicles and load')}>
                  {circ.map((l, i) => (
                    <div key={l} style={{ padding: '10px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t(`Circuito ${l === '40' ? 'I' : 'II'} (linha ${l})`, `Circuit ${l === '40' ? 'I' : 'II'} (line ${l})`)}</div>
                      <div style={{ display: 'flex', gap: 18, marginTop: 6, fontSize: 13, color: C.textMuted, flexWrap: 'wrap' }}>
                        <span><strong style={{ color: C.text, fontSize: 18 }}>{v1(O[l].veiculosDia)}</strong> {t('veículos por dia', 'vehicles a day')}</span>
                        <span><strong style={{ color: C.text, fontSize: 18 }}>{fmt(O[l].paxVeiculoDia)}</strong> {t('passageiros por veículo/dia', 'passengers per vehicle/day')}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.55, marginTop: 8 }}>{t('São as linhas que melhor servem o visitante a circular pela cidade, e as mais cheias por viagem. Com cerca de três veículos por dia, cada um transporta mais de 400 pessoas.', 'These are the lines that best serve visitors moving around the city, and the fullest per trip. With about three vehicles a day, each carries over 400 people.')}</div>
                </Card>
              )}
            </div>
          </>
        );
      })()}
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}>{t('Notas: os dados contam quem entra no autocarro (validações), não quem sai; por isso os destinos turísticos são medidos pelos regressos. Incluem residentes, não só visitantes. Os nomes das paragens foram uniformizados, porque a TUB passou a escrevê-los em minúsculas em setembro. A velocidade dos relatórios da TUB não é usada (dá valores de 4 a 6 km/h, impossíveis); é recalculada com a distância e a duração real, nas viagens com hora de chegada registada (cerca de 38%). Os atrasos vêm do relatório de viagens atrasadas, que só regista chegadas com 1 minuto ou mais de atraso; usa-se a mediana porque há registos extremos.', 'Notes: the data count who boards the bus (validations), not who gets off, so tourist destinations are measured by return trips. They include residents, not only visitors. Stop names were standardised because TUB switched to lowercase in September. The speed field in TUB reports is not used (it gives impossible values of 4–6 km/h); speed is recalculated from distance and actual duration, for trips with a recorded arrival time (about 38%). Delays come from the late trips report, which only records arrivals 1 minute or more late; the median is used because of extreme records.')}</div>
    </>
  );
}

