'use client';

import { useAdmin } from '../modo';
import { useState } from 'react';
import { t } from '@/app/lib/i18n';
import { FERRAMENTAS_DIGITAIS } from '@/app/lib/ferramentas-digitais-dados';
import { BarrasPct, C, Card, KPI, SectionTitle, fmt } from './comum';

// ═══ Ferramentas digitais: TOMI, SmartGuide e Super Fan - só leitura ═══
export default function FerramentasDigitais() {
  const admin = useAdmin();
  const F = FERRAMENTAS_DIGITAIS;
  const [ano, setAno] = useState<'2025' | '2026'>('2026');
  const T = F.tomi.anos[ano];
  const dias25 = 365, dias26 = 149; // 1 jan a 29 mai 2026
  const pd25 = F.tomi.anos['2025'].peoes / dias25, pd26 = F.tomi.anos['2026'].peoes / dias26;
  // Não se compara 2026 com a média de 2025: a contagem de 2025 mais do que duplica a partir de setembro
  // (relatório TOMI), o que indica uma mudança na forma de contar.
  void pd25;
  const n = (v: number) => fmt(Math.round(v));
  const SG = F.smartguide, SF = F.superfan;
  const pct = (v: number) => `${String(v).replace('.', ',')}%`;
  const lista = (xs: string[]) => xs.map((x, i) => <span key={x} style={{ display: 'inline-block', fontSize: 12.5, padding: '3px 10px', borderRadius: 999, border: `1px solid ${C.border}`, color: C.text, margin: '0 6px 6px 0' }}>{i + 1}. {x}</span>);
  return (
    <>
      {/* ── TOMI ── */}
      <SectionTitle sub={`${F.tomi.fonte} · ${T.periodo}`}>{t(`Os mupis contaram, em média, ${n(pd26)} peões por dia em 2026 (até 29 de maio)`, `The kiosks counted an average of ${n(pd26)} pedestrians a day in 2026 (to 29 May)`)}</SectionTitle>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['2026', '2025'] as const).map((a) => <button key={a} onClick={() => setAno(a)} style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${ano === a ? C.accent : C.border}`, background: ano === a ? C.accentBg : 'transparent', color: ano === a ? C.text : C.textMuted }}>{a === '2026' ? t('2026 (até 29 de maio)', '2026 (to 29 May)') : '2025'}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Peões detetados', 'Pedestrians detected')} value={fmt(T.peoes)} sub={t(`${n(T.peoes / (ano === '2025' ? dias25 : dias26))} por dia em média`, `${n(T.peoes / (ano === '2025' ? dias25 : dias26))} per day on average`)} color={C.accent} />
        <KPI label={t('Interações', 'Interactions')} value={fmt(T.interacoes)} sub={t(`pico a ${T.diaPico} (${fmt(T.diaPicoN)})`, `peak on ${T.diaPico} (${fmt(T.diaPicoN)})`)} color={C.orange} />
        <KPI label={t('Exibições de conteúdos', 'Content displays')} value={fmt(T.exibicoes)} sub={t(`${fmt(T.fotos)} fotografias tiradas pelos visitantes`, `${fmt(T.fotos)} photos taken by visitors`)} color={C.purple} />
        <KPI label={t('Quando há mais uso', 'Busiest time')} value={`${T.diaSemana}, ${T.horaPico}`} sub={t(`${T.homens}% homens · ${T.mulheres}% mulheres`, `${T.homens}% men · ${T.mulheres}% women`)} color={C.cyan} />
      </div>
      {ano === '2026' && F.tomi.anos['2026'].equipamentos[1][1] === 0 && (
        <div style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 16px', padding: '12px 16px', background: 'rgba(237,160,107,.1)', border: '1px solid rgba(237,160,107,.35)', borderRadius: 6, color: C.text }}>
          {t(`O mupi do Arco não registou nenhuma interação em 2026 (em 2025 fez ${pct(F.tomi.anos['2025'].equipamentos[1][2])} das interações). Vale a pena confirmar se está a funcionar.`, `The Arco kiosk recorded no interactions in 2026 (in 2025 it had ${pct(F.tomi.anos['2025'].equipamentos[1][2])} of interactions). Worth checking whether it is working.`)}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('O que as pessoas procuram nos mupis (%)', 'What people look for on the kiosks (%)')}>
          <BarrasPct dados={T.modulos} cor={C.orange} max={100} />
          <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 8 }}>{t('Percentagem das interações por módulo', 'Share of interactions by module')}</div>
        </Card>
        <Card title={t('Pesquisas mais frequentes', 'Most frequent searches')}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, margin: '2px 0 8px' }}>{t('Procurar', 'Search')}</div>{lista(T.procurar)}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, margin: '10px 0 8px' }}>{t('Mobilidade (destinos)', 'Mobility (destinations)')}</div>{lista(T.mobilidade)}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, margin: '10px 0 8px' }}>{t('Eventos', 'Events')}</div>{lista(T.eventos)}
          <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>{t('Em 2026, a mobilidade passou a ser o que mais se procura, com o hospital, a universidade e o aeródromo à cabeça: os mupis servem também quem vive e trabalha em Braga.', 'In 2026, mobility became the top search, led by the hospital, university and airfield: the kiosks also serve people who live and work in Braga.')}</div>
        </Card>
      </div>
      <div style={{ fontSize: 12, color: C.textDim, margin: '-6px 0 8px' }}>{F.tomi.nota}</div>

      {/* ── SmartGuide ── */}
      <SectionTitle sub={SG.fonte}>{t(`Guia áudio SmartGuide: ${SG.utilizadores} utilizadores em cinco meses`, `SmartGuide audio guide: ${SG.utilizadores} users in five months`)}</SectionTitle>
      <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, margin: '0 0 16px', padding: '12px 16px', background: C.accentBg, borderRadius: 6 }}>
        {t(`Pouca adoção: ${fmt(SG.utilizadores || 0)} utilizadores no período. Os materiais em Braga (cartazes e códigos QR) trazem ${pct(SG.canais[1][1])} dos utilizadores. Sugestão: reforçar a divulgação no Posto de Turismo, nos hotéis e nos próprios monumentos. Há ${pct(SG.paises[7][1])} de utilizadores com telemóvel polaco e ${pct(SG.linguas[9][1])} de uso em polaco, o que pode indicar falta de conteúdo em polaco.`, `Low adoption: ${fmt(SG.utilizadores || 0)} users in the period. On-site materials in Braga (posters and QR codes) bring ${pct(SG.canais[1][1])} of users. Suggestion: promote it at the Tourist Office, hotels and monuments. ${pct(SG.paises[7][1])} of users have Polish phones but Polish usage is ${pct(SG.linguas[9][1])}: which may indicate missing Polish content.`)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('País do telemóvel dos utilizadores (%)', 'Users’ phone country (%)')}><BarrasPct dados={SG.paises.slice(0, 8)} cor={C.accent} /></Card>
        <Card title={t('Língua em que ouviram o guia (%)', 'Language used in the guide (%)')}><BarrasPct dados={SG.linguas.slice(0, 7)} cor={C.cyan} /></Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Locais mais consultados', 'Most viewed places')}>
          {SG.locais.map((l: any, i: number) => (
            <div key={l[0]} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${C.border}` : 'none', fontSize: 13.5 }}>
              <span style={{ color: C.text }}>{l[0]}</span><span style={{ color: C.textMuted, whiteSpace: 'nowrap' }}><strong style={{ color: C.text }}>{l[1]}</strong> {t('utiliz.', 'users')} · {String(l[2]).replace('.', ',')} min</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{t('Minutos: tempo médio de uso por utilizador (com o ecrã ligado).', 'Minutes: average engagement time per user (screen on).')}</div>
        </Card>
        <Card title={t('Como chegaram ao guia (%)', 'How they found the guide (%)')}>
          <BarrasPct dados={SG.canais} cor={C.orange} />
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 12 }}>{t(`iPhone ${pct(SG.ios)} · Android ${pct(SG.android)}`, `iPhone ${pct(SG.ios)} · Android ${pct(SG.android)}`)}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{t('Interesses dos visitantes: ', 'Visitor interests: ')}{SG.interesses.join(' · ')}</div>
        </Card>
      </div>

      {/* ── Super Fan ── (relatório confidencial do parceiro: só administração) */}
      {admin && (<>
      <SectionTitle sub={SF.fonte}>{t(`Noite Branca: mais de ${SF.site.quotaTrafego}% de todo o tráfego do visitbraga.travel em três dias`, `Noite Branca: over ${SF.site.quotaTrafego}% of all visitbraga.travel traffic in three days`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Participantes Super Fan', 'Super Fan participants')} value={String(SF.participantes)} sub={t(`${SF.premios} prémios atribuídos`, `${SF.premios} prizes awarded`)} color={C.accent} />
        <KPI label={t('Instalações da app', 'App installs')} value={String(SF.installs.android + SF.installs.ios)} sub={`iOS ${SF.installs.ios} · Android ${SF.installs.android}`} color={C.orange} />
        <KPI label={t('Utilizadores do site', 'Site users')} value={`+${SF.site.varUtilizadores}%`} sub={t(`mais de ${fmt(SF.site.utilizadoresAtivos)} ativos em 3 dias`, `over ${fmt(SF.site.utilizadoresAtivos)} active in 3 days`)} color={C.positive} />
        <KPI label={t('Página da Agenda', 'Agenda page')} value={`+${SF.site.varAgenda}%`} sub={t(`${fmt(SF.site.agenda)} acessos em 3 dias`, `${fmt(SF.site.agenda)} visits in 3 days`)} color={C.purple} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Participantes por concerto', 'Participants per concert')}>
          {SF.palcos.map((p: any, i: number) => (
            <div key={p[0]} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 170px) minmax(0,1fr) 34px', gap: 10, alignItems: 'center', margin: '7px 0', fontSize: 13.5 }}>
              <span style={{ color: C.text }}>{p[0]}</span>
              <div style={{ height: 7, background: '#262A30', borderRadius: 999, overflow: 'hidden' }}><div className="obs-grow" style={{ width: `${(p[1] / SF.palcos[0][1]) * 100}%`, height: '100%', background: C.accent, borderRadius: 999, animationDelay: `${i * 50}ms` }} /></div>
              <strong style={{ color: C.text, textAlign: 'right' }}>{p[1]}</strong>
            </div>
          ))}
        </Card>
        <Card title={t('O que ficou', 'Key takeaways')}>
          {[SF.appStore, t(`Taxa de conversão nas lojas: Android ${pct(SF.conversao.android)} · iOS ${pct(SF.conversao.ios)}. `, `Store conversion rate: Android ${pct(SF.conversao.android)} · iOS ${pct(SF.conversao.ios)}.`), t(`Página inicial do site: +${SF.site.varInicio}% (${fmt(SF.site.inicio)} acessos em 3 dias).`, `Site home page: +${SF.site.varInicio}% (${fmt(SF.site.inicio)} visits in 3 days).`), SF.licao].map((x: string, i: number) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', gap: 6, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, padding: '6px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}><span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}</span>{x}</div>
          ))}
        </Card>
      </div>
      </>)}
    </>
  );
}

