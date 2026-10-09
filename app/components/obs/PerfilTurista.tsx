'use client';

import { t } from '@/app/lib/i18n';
import { RNAAT } from '@/app/lib/rnaat-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { BarrasPct, C, Card, KPI, SectionTitle } from './comum';

// Formatação e procura por nome (funções de topo, sem setas encadeadas).
function v(n: number): string { return String(n).replace('.', ','); }
function valor(lista: any[], nome: string): number {
  for (let i = 0; i < lista.length; i++) if (lista[i][0] === nome) return lista[i][1];
  return 0;
}
function soma(lista: any[], ini: number, fim: number): number {
  let s = 0;
  for (let i = ini; i < fim && i < lista.length; i++) s += lista[i][1];
  return Math.round(s * 10) / 10;
}

// ═══ Perfil do turista (estudo por inquérito) — só leitura ═══
export default function PerfilTurista() {
  const P = PERFIL_TURISTA;
  const intl = soma(P.origem, 0, 4);
  const espanha = soma(P.origem, 0, 2);
  const naoPernoitou = valor(P.alojamento, 'Não pernoitou');
  const ia = valor(P.fontes, 'Inteligência artificial');
  const site = valor(P.fontes, 'Site de turismo de Braga');
  const ativ = valor(P.reservas, 'Atividades ou visitas guiadas');
  const q1 = P.negativos[0];
  const nota = (txt: string) => <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5, marginTop: 10 }}>{txt}</div>;
  return (
    <>
      <SectionTitle sub={P.fonte}>{t(`Quem visita Braga: ${v(intl)}% estrangeiros, ${v(P.primeiraVisita)}% pela primeira vez, ${v(P.motivacao[0][1])}% em lazer`, `Who visits Braga: ${intl}% international, ${P.primeiraVisita}% first-timers, ${P.motivacao[0][1]}% for leisure`)}</SectionTitle>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55, margin: '0 0 16px', padding: '10px 14px', background: 'rgba(237,160,107,.1)', border: '1px solid rgba(237,160,107,.3)', borderRadius: 6 }}>
        {t(`${P.amostra} respostas ao inquérito, exportadas a 7 de maio de 2025. Nem todos responderam a todas as perguntas: cada gráfico indica o número de respostas (n). A exportação não indica as datas nem os locais de recolha, e algumas respostas sugerem que parte dos inquéritos foi feita fora do concelho (por exemplo, 8,4% dos que indicaram onde dormiram ficaram em Celorico de Basto). Os resultados descrevem os inquiridos, não o ano inteiro nem todos os visitantes de Braga. Amostra não probabilística.`, `${P.amostra} survey answers, exported on 7 May 2025. Not everyone answered every question: each chart shows the number of answers (n). The export does not state the collection dates or locations, and some answers suggest part of the survey was carried out outside the municipality (e.g. 8.4% of those who said where they slept stayed in Celorico de Basto). The results describe the respondents, not the whole year or all visitors to Braga. Non-probability sample.`)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Primeira visita', 'First visit')} value={`${v(P.primeiraVisita)}%`} sub={t(`${v(P.voltaramMenos2Anos)}% dos recorrentes voltaram em menos de 2 anos`, `${P.voltaramMenos2Anos}% of repeat visitors returned within 2 years`)} color={C.accent} />
        <KPI label={t('Vindos de Espanha', 'From Spain')} value={`${v(espanha)}%`} sub={t(`${v(P.origem[0][1])}% da Galiza`, `${P.origem[0][1]}% from Galicia`)} color={C.orange} />
        <KPI label={t('Não pernoitaram', 'Did not stay overnight')} value={`${v(naoPernoitou)}%`} sub={t('visitas de um só dia', 'day visits only')} color={C.purple} />
        <KPI label={t('Visitam outros lugares', 'Visit other places')} value={`${v(P.outrosDestinos.comOutros)}%`} sub={t(`sobretudo Porto (${v(P.outrosDestinos.lista[0][1])}%) e Guimarães (${v(P.outrosDestinos.lista[1][1])}%)`, `mainly Porto (${P.outrosDestinos.lista[0][1]}%) and Guimarães (${P.outrosDestinos.lista[1][1]}%)`)} color={C.cyan} />
        <KPI label={t('Planearam com IA', 'Planned with AI')} value={`${v(ia)}%`} sub={t(`contra ${v(site)}% no site de turismo de Braga`, `vs ${site}% on Braga's tourism website`)} color={C.pink} />
        <KPI label={t('Recomendariam Braga', 'Would recommend Braga')} value={`${v(P.recomendaria)}%`} sub={t(`${v(P.voltar)}% pensam voltar nos próximos três anos`, `${P.voltar}% expect to return within three years`)} color={C.positive} />
      </div>
      <div style={{ padding: '16px 18px', marginBottom: 16, background: C.accentBg, border: '1px solid rgba(138,176,230,.3)', borderRadius: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t('Leituras para a gestão', 'Takeaways for management')}</div>
        {[
          t(`${v(naoPernoitou)}% não pernoitaram e ${v(P.outrosDestinos.comOutros)}% combinam Braga com outros lugares, sobretudo o Porto: converter visitas de um dia em estadias é uma margem de crescimento.`, `${naoPernoitou}% did not stay overnight and ${P.outrosDestinos.comOutros}% combine Braga with other places, mainly Porto: turning day trips into stays is a growth margin.`),
          t(`${v(ia)}% usaram inteligência artificial para planear a viagem e ${v(site)}% o site de turismo de Braga (${P.nFontes} respostas): a informação sobre Braga tem de estar correta também nos assistentes de IA.`, `${ia}% used artificial intelligence to plan the trip and ${site}% Braga's tourism website (${P.nFontes} answers): information about Braga must also be correct in AI assistants.`),
          t(`Entre os ${P.nQueixas} que apontaram aspetos menos positivos, o mais referido é «${q1[0]}» (${v(q1[1])}%), seguido de ruído e serviços públicos (${v(P.negativos[1][1])}% cada).`, `Among the ${P.nQueixas} who pointed out less positive aspects, the most cited is «${q1[0]}» (${q1[1]}%), followed by noise and public services (${P.negativos[1][1]}% each).`),
          t(`Só ${v(ativ)}% reservaram atividades ou visitas guiadas antes de chegar: as ${RNAAT.length} empresas de animação turística de Braga têm aqui um público por conquistar.`, `Only ${ativ}% booked activities or guided tours in advance: Braga’s ${RNAAT.length} tourism activity companies have an untapped audience here.`),
        ].map((x, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', gap: 6, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, padding: '4px 0' }}><span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}</span>{x}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`De onde vêm (%, n=${P.nOrigem})`, `Where they come from (%, n=${P.nOrigem})`)}><BarrasPct dados={P.origem} cor={C.orange} /></Card>
        <Card title={t(`Porque vêm (%, várias respostas, n=${P.nMotivacao})`, `Why they come (%, multiple answers, n=${P.nMotivacao})`)}><BarrasPct dados={P.motivacao} cor={C.accent} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`Com quem viajam (%, n=${P.nCompanhia})`, `Who they travel with (%, n=${P.nCompanhia})`)}><BarrasPct dados={P.companhia} cor={C.purple} /></Card>
        <Card title={t(`Idade (%, n=${P.nIdade}) · ${v(P.genero.homens)}% homens, ${v(P.genero.mulheres)}% mulheres`, `Age (%, n=${P.nIdade}) · ${P.genero.homens}% men, ${P.genero.mulheres}% women`)}><BarrasPct dados={P.idade} cor={C.cyan} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`Onde dormiram (%, n=${P.nAlojamento})`, `Where they stayed (%, n=${P.nAlojamento})`)}><BarrasPct dados={P.alojamento.filter((x: any) => x[1] > 0)} cor={C.purple} /></Card>
        <Card title={t(`Como chegaram (%, várias respostas, n=${P.nTransporte})`, `How they arrived (%, multiple answers, n=${P.nTransporte})`)}><BarrasPct dados={P.transporte} cor={C.accent} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`Outros lugares que visitam (%, n=${P.outrosDestinos.n})`, `Other places they visit (%, n=${P.outrosDestinos.n})`)}>
          <BarrasPct dados={P.outrosDestinos.lista} cor={C.cyan} />
          {nota(t(`${v(P.outrosDestinos.soBraga)}% disseram que Braga é o único lugar da viagem.`, `${P.outrosDestinos.soBraga}% said Braga is the only place on their trip.`))}
        </Card>
        <Card title={t(`Informação recebida já no destino (%, n=${P.nInfo})`, `Information received at the destination (%, n=${P.nInfo})`)}><BarrasPct dados={P.infoNoDestino} cor={C.cyan} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`Onde se informaram antes da viagem (%, várias respostas, n=${P.nFontes})`, `Information sources before the trip (%, multiple answers, n=${P.nFontes})`)}>
          <BarrasPct dados={P.fontes} cor={C.pink} />
          {nota(t(`Noutra pergunta, ${v(P.naoProcurou)}% disseram que não procuraram informação antes da viagem.`, `In another question, ${P.naoProcurou}% said they did not look for information before the trip.`))}
        </Card>
        <Card title={t(`O que reservaram antes de chegar (%, n=${P.nReservas})`, `What they booked in advance (%, n=${P.nReservas})`)}>
          <BarrasPct dados={P.reservas} cor={C.orange} />
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '18px 0 4px' }}>{t(`Como organizaram a viagem (%, n=${P.nOrganizacao})`, `How they organised the trip (%, n=${P.nOrganizacao})`)}</div>
          <BarrasPct dados={P.organizacao} cor={C.textDim} />
        </Card>
      </div>
      <Card title={t(`Locais visitados (%, várias respostas, n=${P.nLocais})`, `Places visited (%, multiple answers, n=${P.nLocais})`)}><BarrasPct dados={P.locais} cor={C.accent} /></Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t(`O que mais gostaram (%, várias respostas, n=${P.nPositivos})`, `What they liked most (%, multiple answers, n=${P.nPositivos})`)}><BarrasPct dados={P.positivos} cor={C.positive} /></Card>
        <Card title={t(`O que menos gostaram (%, várias respostas, n=${P.nQueixas})`, `What they liked least (%, multiple answers, n=${P.nQueixas})`)}>
          <BarrasPct dados={P.negativos} cor={C.negative} max={100} />
          {nota(t(`Responderam a esta pergunta ${P.nQueixas} pessoas; ${P.nBaseQueixas} responderam à pergunta anterior, sobre o que mais gostaram.`, `${P.nQueixas} people answered this question; ${P.nBaseQueixas} answered the previous one, on what they liked most.`))}
        </Card>
      </div>
      <Card title={t('Satisfação', 'Satisfaction')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, fontSize: 13.5 }}>
          {[
            [t('Melhor do que esperavam', 'Better than expected'), P.expectativas.melhor, C.positive],
            [t('Como esperavam', 'As expected'), P.expectativas.igual, C.accent],
            [t('Pior do que esperavam', 'Worse than expected'), P.expectativas.pior, C.negative],
            [t('Pensam voltar em 3 anos', 'Expect to return within 3 years'), P.voltar, C.cyan],
            [t('Recomendariam', 'Would recommend'), P.recomendaria, C.positive],
          ].map((x: any) => (
            <div key={x[0]}><div style={{ color: C.textMuted }}>{x[0]}</div><div style={{ fontSize: 22, fontWeight: 700, color: x[2] }}>{t(`${v(x[1])}%`, `${x[1]}%`)}</div></div>
          ))}
        </div>
        {nota(t('Expectativas: 304 respostas (1% não tinha expectativas). Voltar: 302 respostas. Recomendar: 301 respostas.', 'Expectations: 304 answers (1% had no expectations). Return: 302 answers. Recommend: 301 answers.'))}
      </Card>
      <Card title={t('Quanto gastam por dia (sem alojamento)', 'Daily spending (excluding accommodation)')}>
        <div style={{ fontSize: 13.5, color: C.text, marginBottom: 8 }}>{t(`Despesa média do dia anterior entre ${P.gastoDiario[0]} € e ${P.gastoDiario[1]} € (116 respostas).`, `Average spending on the previous day between ${P.gastoDiario[0]} € and ${P.gastoDiario[1]} € (116 answers).`)}</div>
        {P.gastos.map((g: any) => (
          <div key={g[0]} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 260px) minmax(0,1fr)', gap: 12, padding: '6px 0', borderTop: `1px solid ${C.border}`, fontSize: 13.5 }}>
            <span style={{ color: C.text }}>{g[0]}</span><span style={{ color: C.textMuted }}>{g[1]}</span>
          </div>
        ))}
        {nota(t(`A exportação só traz resumos em texto para os gastos, sem médias exatas. ${v(P.porPessoa)}% indicaram valores por pessoa e os restantes por grupo. O estudo de 2019 apontava ${P.estudo2019.gasto} € por dia com alojamento; os valores não são diretamente comparáveis.`, `The export only gives text summaries for spending, without exact averages. ${P.porPessoa}% gave amounts per person and the rest per group. The 2019 study found ${P.estudo2019.gasto} € a day including accommodation; the figures are not directly comparable.`))}
      </Card>
    </>
  );
}
