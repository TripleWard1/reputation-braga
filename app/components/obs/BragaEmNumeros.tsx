'use client';

import { t } from '@/app/lib/i18n';
import { POP_BRAGA, POP_PORTUGAL, AREA_KM2, AREA_PORTUGAL_KM2, ETARIA_2025, NATURAL_2025, SEXO_2023, crescimento, densidade } from '@/app/lib/demografia-braga';
import { C, Card, KPI, BarrasPct, fmt } from './comum';

// ─── BRAGA EM NÚMEROS (demografia do concelho; INE) ──────────────────────────
const pc = (v: number) => `${v.toFixed(1).replace('.', t(',', '.'))}%`;
const sinal = (v: number) => (v > 0 ? '+' : '') + fmt(v);

export default function BragaEmNumeros() {
  const cBraga = crescimento(2011, 2025, POP_BRAGA);
  const cPT = crescimento(2011, 2025, POP_PORTUGAL);
  const E = ETARIA_2025;
  const N = NATURAL_2025;
  const pctMulheres = (SEXO_2023.mulheres / SEXO_2023.total) * 100;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('População residente 2025', 'Resident population 2025')} value={fmt(POP_BRAGA[2025])} sub={`+${pc(cBraga)} ${t('desde 2011', 'since 2011')} · PT +${pc(cPT)}`} color={C.accent} />
        <KPI label={t('Superfície', 'Area')} value={`${AREA_KM2} km²`} sub={t('concelho de Braga', 'Braga municipality')} color={C.cyan} />
        <KPI label={t('Densidade (hab./km²)', 'Density (inh./km²)')} value={fmt(densidade(2025))} sub={`2025 · Portugal: ${fmt(POP_PORTUGAL[2025] / AREA_PORTUGAL_KM2)}`} color={C.purple} />
        <KPI label={t('Idosos por 100 jovens', 'Seniors per 100 young people')} value={String(E.Braga.idososPor100Jovens)} sub={`${t('Portugal', 'Portugal')}: ${E.Portugal.idososPor100Jovens}`} color={C.positive} />
        <KPI label={t('Saldo natural 2025', 'Natural change 2025')} value={sinal(N.Braga.saldo)} sub={`${fmt(N.Braga.nascimentos)} ${t('nascimentos', 'births')} · ${fmt(N.Braga.obitos)} ${t('óbitos', 'deaths')}`} color={C.info} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Card title={t('Estrutura etária 2025: Braga', 'Age structure 2025: Braga')}>
          <BarrasPct dados={[[t('Jovens (0–14 anos)', 'Young (0–14)'), E.Braga.jovens], [t('Idade ativa (15–64)', 'Working age (15–64)'), E.Braga.ativa], [t('Idosos (65 e mais)', 'Seniors (65+)'), E.Braga.idosos]]} cor={C.accent} max={80} />
        </Card>
        <Card title={t('Estrutura etária 2025: Portugal', 'Age structure 2025: Portugal')}>
          <BarrasPct dados={[[t('Jovens (0–14 anos)', 'Young (0–14)'), E.Portugal.jovens], [t('Idade ativa (15–64)', 'Working age (15–64)'), E.Portugal.ativa], [t('Idosos (65 e mais)', 'Seniors (65+)'), E.Portugal.idosos]]} cor={C.textDim} max={80} />
        </Card>
      </div>
      <p style={{ fontSize: 11, color: C.textDim, margin: '10px 0 22px' }}>
        {t(
          `Fonte: INE, O seu município em números (2025) e Estimativas anuais da população residente. A densidade é calculada com a superfície arredondada (${AREA_KM2} km²). Em 2023, ${pc(pctMulheres)} da população residente eram mulheres.`,
          `Source: INE (Statistics Portugal), Your municipality in numbers (2025) and Annual estimates of the resident population. Density is calculated with the rounded area (${AREA_KM2} km²). In 2023, ${pc(pctMulheres)} of the resident population were women.`,
        )}
      </p>
    </>
  );
}
