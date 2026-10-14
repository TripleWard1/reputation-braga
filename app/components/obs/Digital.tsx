'use client';

import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { DIGITAL, DIGITAL_POS, DIGITAL_TOTAL, SEARCH_CONSOLE } from '@/app/lib/audiencia-digital-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, Chips, HBars, KPI, MiniPie, SectionTitle, fmt, tipStyle } from './comum';

// ─── Audiência Digital (Google Analytics - visitbraga.travel) ───
export default function Digital() {
  const [per, setPer] = useState<'antes' | 'retoma'>('antes');
  const k = DIGITAL.kpis, kp = DIGITAL_POS.kpis, kt = DIGITAL_TOTAL.kpis;
  const DIAS_ANTES = 226; // 28 jul 2025 – 10 mar 2026
  const diasPos = DIGITAL_POS.diasEstimados;
  const share = (arr: [string, number][], name: string) => {
    const tot = arr.reduce((s, x) => s + x[1], 0);
    const f = arr.find((x) => x[0] === name);
    return f && tot ? (f[1] / tot) * 100 : 0;
  };
  const pctUsers = (arr: [string, number][], name: string, tot: number) => {
    const f = arr.find((x) => x[0] === name);
    return f && tot ? (f[1] / tot) * 100 : 0;
  };
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const canaisComp = ['Pesquisa orgânica', 'Direto', 'Assistentes de IA', 'Redes sociais', 'Referência'].map((c) => ({
    canal: dl(c), antes: r1(share(DIGITAL.canais, c)), retoma: r1(share(DIGITAL_POS.canais, c)),
  }));
  const paisComp = ['Portugal', 'Espanha', 'França', 'EUA', 'Alemanha', 'Reino Unido', 'Brasil', 'Países Baixos'].map((c) => ({
    pais: dl(c), antes: r1(pctUsers(DIGITAL.paises, c, k.utilizadores)), retoma: r1(pctUsers(DIGITAL_POS.paises, c, kp.utilizadores)),
  }));
  const MES_EN: Record<string, string> = { jan: 'Jan', fev: 'Feb', mar: 'Mar', abr: 'Apr', mai: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', set: 'Sep', out: 'Oct', nov: 'Nov', dez: 'Dec' };
  const INCIDENTE = ['mai/26', 'jun/26', 'jul/26', 'ago/26'];
  const gsc = SEARCH_CONSOLE.mensal.map(([m, c, i]) => {
    const [mm, yy] = m.split('/');
    return { mes: t(m, `${MES_EN[mm]}/${yy}`), key: m, cliques: c, impressoes: i };
  });
  const dez = SEARCH_CONSOLE.mensal.find((x) => x[0] === 'dez/25');
  const pctDez = dez ? Math.round((dez[1] / SEARCH_CONSOLE.cliques) * 100) : 0;
  const totDisp = DIGITAL_TOTAL.dispositivos.reduce((s, x) => s + x[1], 0);
  const pctMobile = Math.round((DIGITAL_TOTAL.dispositivos[0][1] / totDisp) * 100);
  const pctGoogleAntes = Math.round(share(DIGITAL.canais, 'Pesquisa orgânica'));
  const pctGooglePos = Math.round(share(DIGITAL_POS.canais, 'Pesquisa orgânica'));
  const pctPTAntes = Math.round(pctUsers(DIGITAL.paises, 'Portugal', k.utilizadores));
  const pctPTPos = Math.round(pctUsers(DIGITAL_POS.paises, 'Portugal', kp.utilizadores));
  const pctESAntes = Math.round(pctUsers(DIGITAL.paises, 'Espanha', k.utilizadores));
  const pctESPos = Math.round(pctUsers(DIGITAL_POS.paises, 'Espanha', kp.utilizadores));
  const iaNovos = DIGITAL_POS.canais.find((x) => x[0] === 'Assistentes de IA')?.[1] ?? 0;
  const src = per === 'antes' ? DIGITAL : DIGITAL_POS;
  const nf1 = (n: number) => n.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const comp: [string, string, string, string][] = [
    [t('Utilizadores por dia', 'Users per day'), fmt(Math.round(k.utilizadores / DIAS_ANTES)), `≈ ${fmt(Math.round(kp.utilizadores / diasPos))}`, t('cerca de 8× menos', 'about 8× fewer')],
    [t('Páginas vistas por dia', 'Page views per day'), fmt(Math.round(k.visualizacoes / DIAS_ANTES)), `≈ ${fmt(Math.round(kp.visualizacoes / diasPos))}`, t('cerca de 7× menos', 'about 7× fewer')],
    [t('Utilizadores via Google (canal do primeiro acesso)', 'Users via Google (first-visit channel)'), `${pctGoogleAntes}%`, `${pctGooglePos}%`, t('o Google perdeu peso', 'Google lost weight')],
    [t('Tempo médio de envolvimento', 'Average engagement time'), `${k.tempoMedioSeg} s`, `${kp.tempoMedioSeg} s`, t('quem chega fica mais', 'visitors stay longer')],
    [t('Páginas por utilizador', 'Pages per user'), nf1(k.pagsPorUtilizador), nf1(kp.pagsPorUtilizador), t('navegação mais longa', 'longer browsing')],
    [t('Utilizadores de Espanha', 'Users from Spain'), `${pctESAntes}%`, `${pctESPos}%`, t('mercado a ganhar peso', 'market gaining weight')],
    [t('Utilizadores via assistentes de IA (primeiro acesso)', 'Users via AI assistants (first visit)'), '-', fmt(iaNovos), t('canal novo (ChatGPT)', 'new channel (ChatGPT)')],
  ];
  const th = { fontSize: 10.5, color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '8px 10px', textAlign: 'left' as const, borderBottom: `1px solid ${C.border}` };
  const td = { fontSize: 12.5, color: C.text, padding: '8px 10px', borderBottom: `1px solid ${C.border}` };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={`Google Analytics 4 · Google Search Console · ${DIGITAL_TOTAL.periodo}`}>{t('Audiência Digital - visitbraga.travel', 'Digital Audience - visitbraga.travel')}</SectionTitle>

      <div style={{ background: C.negativeBg, border: `1px solid ${C.negative}55`, borderRadius: 12, padding: '14px 18px', fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
        <strong style={{ color: C.negative }}>{t('Ciberataque em 2026.', 'Cyberattack in 2026.')}</strong>{' '}
        {t('O site esteve fora do ar vários meses: o tráfego vindo do Google manteve-se normal até abril, caiu em maio, foi quase nulo em junho e julho e voltou a crescer no final de agosto, quando as medições do Analytics foram retomadas. As comparações antes/depois fazem-se por médias diárias e por proporções, porque os períodos têm durações muito diferentes.', 'The site was offline for several months: traffic from Google stayed normal until April, dropped in May, was almost nil in June and July and began to recover at the end of August, when Analytics tracking resumed. Before/after comparisons use daily averages and shares, as the periods differ greatly in length.')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label={t('Utilizadores', 'Users')} value={fmt(kt.utilizadores)} sub={t('desde o lançamento', 'since launch')} color={C.accent} />
        <KPI label={t('Cliques no Google', 'Google clicks')} value={fmt(SEARCH_CONSOLE.cliques)} sub={t('pesquisa web', 'web search')} color={C.info} />
        <KPI label={t('Aparições no Google', 'Google impressions')} value={`${(SEARCH_CONSOLE.impressoes / 1e6).toLocaleString(t('pt-PT', 'en-GB'), { maximumFractionDigits: 1 })} M`} sub={t('impressões', 'impressions')} color={C.positive} />
        <KPI label={t('Taxa de envolvimento', 'Engagement rate')} value={`${kt.taxaEnvolvimento.toLocaleString(t('pt-PT', 'en-GB'))}%`} color={C.purple} />
        <KPI label={t('Telemóvel', 'Mobile')} value={`${pctMobile}%`} sub={t('dos utilizadores', 'of users')} color={C.cyan} />
      </div>

      <Card title={t('Cliques e aparições no Google, por mês', 'Google clicks and impressions, by month')}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={gsc} margin={{ top: 6, right: 8, left: -6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="mes" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
            <YAxis yAxisId="l" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="r" orientation="right" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} tickFormatter={(v: any) => `${(v / 1e6).toFixed(1)}M`} />
            <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [fmt(v), n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="cliques" name={t('Cliques', 'Clicks')} radius={[4, 4, 0, 0]}>
              {gsc.map((d) => <Cell key={d.key} fill={INCIDENTE.includes(d.key) ? C.negative : C.accent} />)}
            </Bar>
            <Line yAxisId="r" type="monotone" dataKey="impressoes" name={t('Aparições', 'Impressions')} stroke={C.info} strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <p style={{ fontSize: 11, color: C.textDim, margin: '8px 0 0' }}>
          {t(`Barras a vermelho: meses afetados pelo ataque. Dezembro foi o melhor mês (${pctDez}% de todos os cliques), impulsionado pelo Natal e pela Passagem de Ano. Julho de 2025 começa a 28; setembro de 2026 termina a 23.`, `Red bars: months affected by the attack. December was the best month (${pctDez}% of all clicks), driven by Christmas and New Year. July 2025 starts on the 28th; September 2026 ends on the 23rd.`)}
        </p>
      </Card>

      <Card title={t('Antes e depois do ataque', 'Before and after the attack')}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>{t('Indicador', 'Indicator')}</th>
              <th style={th}>{t('Antes', 'Before')}</th>
              <th style={th}>{t('Retoma', 'Recovery')}</th>
              <th style={th}>{t('Leitura', 'Reading')}</th>
            </tr></thead>
            <tbody>
              {comp.map((r) => (
                <tr key={r[0]}>
                  <td style={td}>{r[0]}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{r[1]}</td>
                  <td style={{ ...td, fontWeight: 600, color: C.accentLight }}>{r[2]}</td>
                  <td style={{ ...td, color: C.textMuted }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: C.textDim, margin: '10px 0 0' }}>
          {t(`Antes: ${DIGITAL.periodo} (${DIAS_ANTES} dias). Retoma: ${fmt(kp.utilizadores)} utilizadores e ${fmt(kp.visualizacoes)} páginas vistas desde o final de agosto; os valores diários da retoma são estimativas (≈ ${diasPos} dias de medição).`, `Before: ${DIGITAL.periodo} (${DIAS_ANTES} days). Recovery: ${fmt(kp.utilizadores)} users and ${fmt(kp.visualizacoes)} page views since late August; recovery daily values are estimates (≈ ${diasPos} days of tracking).`)}
        </p>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title={t('Como chegaram os utilizadores na primeira visita (%)', 'How users arrived on their first visit (%)')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={canaisComp} layout="vertical" margin={{ top: 4, right: 14, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
              <YAxis type="category" dataKey="canal" width={118} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${v}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="antes" name={t('Antes', 'Before')} fill={C.textDim} radius={[0, 3, 3, 0]} />
              <Bar dataKey="retoma" name={t('Retoma', 'Recovery')} fill={C.accent} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('De onde são os utilizadores (%)', 'Where users are from (%)')}>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={paisComp} layout="vertical" margin={{ top: 4, right: 14, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} unit="%" />
              <YAxis type="category" dataKey="pais" width={96} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any) => [`${v}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="antes" name={t('Antes', 'Before')} fill={C.textDim} radius={[0, 3, 3, 0]} />
              <Bar dataKey="retoma" name={t('Retoma', 'Recovery')} fill={C.info} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: C.textDim, margin: '6px 0 0' }}>{t('A China fica de fora: é sobretudo tráfego automático, com envolvimento próximo de 0%.', 'China is excluded: it is mostly automated traffic, with engagement close to 0%.')}</p>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t('Detalhe por período', 'Detail by period')} <span style={{ fontWeight: 400, color: C.textMuted, fontSize: 12 }}>· {src.periodo}</span></div>
        <Chips options={['antes', 'retoma']} sel={[per]} toggle={(o) => setPer(o as 'antes' | 'retoma')} single label={(o) => (o === 'antes' ? t('Antes do ataque', 'Before the attack') : t('Retoma', 'Recovery'))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Top países (sem a China, tráfego sobretudo automático)', 'Top countries (excluding China, mostly automated traffic)')}><HBars data={src.paises.filter((x: any) => x[0] !== 'China')} color={C.info} /></Card>
        <Card title={t('Top idiomas', 'Top languages')}><HBars data={src.idiomas} color={C.positive} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Top cidades', 'Top cities')}><HBars data={src.cidades} color={C.accent} /></Card>
        <Card title={t('Páginas mais vistas', 'Most viewed pages')}><HBars data={src.paginas} color={C.purple} /></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('O que se pesquisa no Google (cliques)', 'What people search on Google (clicks)')}><HBars data={SEARCH_CONSOLE.consultas} color={C.accent} /></Card>
        <Card title={t('Canais - desde o lançamento', 'Channels - since launch')}><MiniPie data={DIGITAL_TOTAL.canais} /></Card>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('Leitura estratégica', 'Strategic reading')}</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: C.text, fontSize: 13, lineHeight: 1.7 }}>
          <li>{t('O site perdeu sobretudo o Google: antes do ataque,', 'The site mainly lost Google: before the attack,')} <strong>{pctGoogleAntes}%</strong> {t('dos utilizadores tinham chegado pela primeira vez através da pesquisa orgânica; na retoma são', 'of users had first arrived via organic search; during recovery it is')} <strong>{pctGooglePos}%</strong>{t('. Recuperar o posicionamento nas pesquisas é a prioridade.', '. Recovering search rankings is the priority.')}</li>
          <li>{t('Os eventos são o maior cartaz digital: dezembro valeu', 'Events are the biggest digital draw: December accounted for')} <strong>{pctDez}%</strong> {t('de todos os cliques vindos do Google, com a Passagem de Ano e as Luzes de Natal no topo.', 'of all clicks from Google, led by New Year and the Christmas Lights.')}</li>
          <li>{t('Na retoma, o público é mais internacional: Portugal passou de', 'During recovery the audience is more international: Portugal went from')} <strong>{pctPTAntes}%</strong> {t('para', 'to')} <strong>{pctPTPos}%</strong> {t('dos utilizadores e Espanha de', 'of users and Spain from')} <strong>{pctESAntes}%</strong> {t('para', 'to')} <strong>{pctESPos}%</strong>.</li>
          <li><strong>{pctMobile}%</strong> {t('dos utilizadores usam telemóvel - a experiência mobile é determinante.', 'of users are on mobile - the mobile experience is decisive.')}</li>
          <li>{t('Canal novo: assistentes de inteligência artificial.', 'New channel: AI assistants.')} <strong>{fmt(kp.sessoesChatGPT)}</strong> {t('sessões vieram do ChatGPT - ainda pouco, mas mostra por onde os turistas começam a planear.', 'sessions came from ChatGPT - still small, but it shows where tourists are starting to plan.')}</li>
        </ul>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        {t('Fontes: Google Analytics 4 e Google Search Console (propriedade visitbraga.travel), exportações de 24/09/2026. Os três períodos (antes, retoma e desde o lançamento) não são somáveis. As cidades resultam de deteção aproximada por IP - Lisboa e Montijo podem estar inflacionados, porque muitos acessos por rede móvel são localizados no ponto de ligação da operadora; entradas sem cidade definida e tráfego automático foram excluídos dos tops.', 'Sources: Google Analytics 4 and Google Search Console (visitbraga.travel property), exports of 24/09/2026. The three periods (before, recovery and since launch) cannot be added up. Cities come from approximate IP detection - Lisbon and Montijo may be inflated, as many mobile-network visits are located at the carrier’s connection point; entries without a defined city and automated traffic were excluded from the tops.')}
      </p>
    </div>
  );
}

