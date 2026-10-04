'use client';

import { ACESSIBILIDADE } from '@/app/lib/acessibilidade-meteo-dados';
import { t } from '@/app/lib/i18n';
import { C, Card, HBars, KPI, SectionTitle, fmt } from './comum';

// ─── Acessibilidade no Atendimento (balcão) ───
export default function Acessibilidade() {
  const A = ACESSIBILIDADE;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={t('Necessidades especiais registadas no balcão de turismo', 'Special needs recorded at the tourism front desk')}>{t('Acessibilidade no Atendimento', 'Accessibility in Service')}</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <KPI label={t('Atendimentos registados', 'Recorded visits')} value={fmt(A.total)} color={C.accent} />
        <KPI label={t('Pessoas abrangidas', 'People covered')} value={fmt(A.pax)} color={C.info} />
        <KPI label={t('% do total de atendimentos', '% of total visits')} value={`${A.pct.toLocaleString(t('pt-PT', 'en-GB'))}%`} color={C.purple} />
      </div>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>{t('Amostra reduzida - leitura cautelosa', 'Small sample - read with caution')}</div>
        <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
          {t('O registo de necessidades especiais só começou em 2026 e está fortemente subutilizado', 'Recording of special needs only began in 2026 and is heavily underused')} ({A.total} {t('em', 'of')} {fmt(A.totalAtendimentos)} {t('atendimentos', 'visits')}){t('. Os números abaixo são um ponto de partida e não refletem a procura real. O valor deste módulo cresce com o registo sistemático no balcão - vale a pena reforçar essa prática junto da equipa de atendimento.', '. The numbers below are a starting point and do not reflect real demand. The value of this module grows with systematic recording at the front desk - it is worth reinforcing this practice with the service team.')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Por tipo de necessidade', 'By type of need')}><HBars data={A.tipos} color={C.info} /></Card>
        <Card title={t('Por mês (2026)', 'By month (2026)')}><HBars data={A.porMes} color={C.accent} /></Card>
      </div>
    </div>
  );
}

