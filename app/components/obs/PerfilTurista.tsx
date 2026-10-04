'use client';

import { t } from '@/app/lib/i18n';
import { RNAAT } from '@/app/lib/rnaat-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { BarrasPct, C, Card, KPI, SectionTitle } from './comum';

// ═══ Perfil do turista (estudo por inquérito) - só leitura ═══
export default function PerfilTurista() {
  const P = PERFIL_TURISTA;
  const intl = P.origem.slice(0, 4).reduce((a: number, x: any) => a + x[1], 0);
  const espanha = P.origem[0][1] + P.origem[1][1];
  const maxG = Math.max(...P.gastos.map((g: any) => g[2]));
  return (
    <>
      <SectionTitle sub={P.fonte}>{t(`Quem visita Braga: ${Math.round(intl)}% estrangeiros, ${String(P.primeiraVisita).replace('.', ',')}% pela primeira vez, ${P.motivacao[0][1]}% em lazer`, `Who visits Braga: ${Math.round(intl)}% international, ${P.primeiraVisita}% first-timers, ${P.motivacao[0][1]}% for leisure`)}</SectionTitle>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, margin: '0 0 16px', padding: '10px 14px', background: 'rgba(237,160,107,.1)', border: '1px solid rgba(237,160,107,.3)', borderRadius: 6 }}>
        {t(`Amostra de ${P.amostra} inquiridos em quatro dias de março (época baixa). Dá uma boa fotografia do visitante, mas não representa o ano inteiro: no verão o peso dos estrangeiros e das dormidas deve ser maior.`, `Sample of ${P.amostra} respondents over four days in March (low season). A good snapshot, but not representative of the whole year: in summer the share of international visitors and overnight stays is likely higher.`)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Primeira visita', 'First visit')} value={`${String(P.primeiraVisita).replace('.', ',')}%`} sub={t(`${P.voltaramMenos2Anos}% dos recorrentes voltaram em menos de 2 anos`, `${P.voltaramMenos2Anos}% of repeat visitors returned within 2 years`)} color={C.accent} />
        <KPI label={t('Vindos de Espanha', 'From Spain')} value={`${espanha}%`} sub={t(`${P.origem[0][1]}% da Galiza`, `${P.origem[0][1]}% from Galicia`)} color={C.orange} />
        <KPI label={t('Não pernoitaram', 'Did not stay overnight')} value={`${String(P.alojamento[0][1]).replace('.', ',')}%`} sub={t('visitas de um só dia', 'day visits only')} color={C.purple} />
        <KPI label={t('Visitaram outras cidades', 'Visited other cities')} value={`${P.outrosDestinos.comOutros}%`} sub={t(`Porto (${P.outrosDestinos.lista[0][1]}%) e Guimarães (${P.outrosDestinos.lista[1][1]}%)`, `Porto (${P.outrosDestinos.lista[0][1]}%) and Guimarães (${P.outrosDestinos.lista[1][1]}%)`)} color={C.cyan} />
        <KPI label={t('Planearam com IA', 'Planned with AI')} value={`${P.fontes[3][1]}%`} sub={t(`contra ${P.fontes[7][1]}% no site oficial de turismo`, `vs ${P.fontes[7][1]}% on the official tourism site`)} color={C.pink} />
        <KPI label={t('Sem nada a apontar', 'No complaints')} value={`${100 - P.comQueixas}%`} sub={t('não indicaram nenhum aspeto negativo', 'mentioned nothing negative')} color={C.positive} />
      </div>
      <div style={{ padding: '16px 18px', marginBottom: 16, background: C.accentBg, border: '1px solid rgba(138,176,230,.3)', borderRadius: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t('Leituras para a gestão', 'Takeaways for management')}</div>
        {[
          t(`Mais de um quarto (${String(P.alojamento[0][1]).replace('.', ',')}%) não dorme em Braga: converter visitas de um dia em estadias é a maior margem de crescimento.`, `Over a quarter (${P.alojamento[0][1]}%) do not stay overnight: turning day trips into stays is the biggest growth margin.`),
          t(`${P.fontes[3][1]}% usaram inteligência artificial para planear e só ${P.fontes[7][1]}% o site oficial: a informação de Braga tem de estar bem presente onde os assistentes de IA a vão buscar.`, `${P.fontes[3][1]}% used AI to plan and only ${P.fontes[7][1]}% the official site: Braga’s information must be present where AI assistants look for it.`),
          t(`Entre quem apontou algo negativo, a primeira queixa é a falta de eventos e oferta cultural (${P.negativos[0][1]}%).`, `Among those with complaints, the top issue is the lack of events and cultural offer (${P.negativos[0][1]}%).`),
          t(`Só ${P.reservas[3][1]}% reservaram atividades antes de chegar: as ${RNAAT.length} empresas de animação turística de Braga têm aqui um público por conquistar.`, `Only ${P.reservas[3][1]}% booked activities in advance: Braga’s ${RNAAT.length} tourism activity companies have an untapped audience here.`),
        ].map((x, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', gap: 6, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, padding: '4px 0' }}><span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}</span>{x}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('De onde vêm (%)', 'Where they come from (%)')}><BarrasPct dados={P.origem} cor={C.orange} /></Card>
        <Card title={t('Porque vêm (%, várias respostas)', 'Why they come (%, multiple answers)')}><BarrasPct dados={P.motivacao} cor={C.accent} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Com quem viajam (%)', 'Who they travel with (%)')}><BarrasPct dados={P.companhia} cor={C.purple} /></Card>
        <Card title={t(`Idade (%) · ${P.genero.homens}% homens, ${P.genero.mulheres}% mulheres`, `Age (%) · ${P.genero.homens}% men, ${P.genero.mulheres}% women`)}><BarrasPct dados={P.idade} cor={C.cyan} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Onde dormiram (%)', 'Where they stayed (%)')}><BarrasPct dados={P.alojamento.filter((x: any) => x[1] > 0)} cor={C.purple} /></Card>
        <Card title={t('Como chegaram (%, várias respostas)', 'How they arrived (%, multiple answers)')}><BarrasPct dados={P.transporte} cor={C.accent} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Onde se informaram (%, várias respostas)', 'Information sources (%, multiple answers)')}><BarrasPct dados={P.fontes} cor={C.pink} /></Card>
        <Card title={t('O que reservaram antes de chegar (%)', 'What they booked in advance (%)')}>
          <BarrasPct dados={P.reservas} cor={C.orange} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '18px 0 4px' }}>{t('Como organizaram a viagem (%)', 'How they organised the trip (%)')}</div>
          <BarrasPct dados={P.organizacao} cor={C.textDim} />
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('O que mais gostaram (%)', 'What they liked most (%)')}><BarrasPct dados={P.positivos} cor={C.positive} /></Card>
        <Card title={t(`O que menos gostaram · entre os ${P.comQueixas}% que apontaram algo (%)`, `What they liked least · among the ${P.comQueixas}% with complaints (%)`)}><BarrasPct dados={P.negativos} cor={C.negative} max={100} /></Card>
      </div>
      <Card title={t('Quanto gastam por dia, por pessoa (€, sem alojamento)', 'Daily spending per person (€, excluding accommodation)')}>
        {P.gastos.map((g: any, i: number) => (
          <div key={g[0]} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 240px) minmax(0,1fr) 90px', gap: 12, alignItems: 'center', margin: '9px 0', fontSize: 13.5 }}>
            <span style={{ color: C.text }}>{g[0]}</span>
            <div style={{ position: 'relative', height: 10, background: '#262A30', borderRadius: 999 }}>
              <div className="obs-grow" style={{ position: 'absolute', left: `${(g[1] / maxG) * 100}%`, width: `${((g[2] - g[1]) / maxG) * 100}%`, top: 0, bottom: 0, background: C.accent, borderRadius: 999, animationDelay: `${i * 70}ms` }} />
            </div>
            <strong style={{ color: C.text, textAlign: 'right' }}>{g[1]}–{g[2]} €</strong>
          </div>
        ))}
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, marginTop: 12 }}>
          {t(`No total, entre ${P.gastoDiario[0]} € e ${P.gastoDiario[1]} € por dia, sem alojamento. O estudo de 2019 apontava ${P.estudo2019.gasto} € por dia com alojamento; somando o alojamento, o gasto atual deve ser semelhante ou superior.`, `In total, between ${P.gastoDiario[0]} € and ${P.gastoDiario[1]} € a day, excluding accommodation. The 2019 study found ${P.estudo2019.gasto} € a day including accommodation; adding accommodation, current spending is likely similar or higher.`)}
        </div>
      </Card>
    </>
  );
}

