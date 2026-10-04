'use client';

import { HEADLINE, BALCAO } from '@/app/lib/observatorio-dados';
import { DIGITAL } from '@/app/lib/audiencia-digital-dados';
import { t, dl } from '@/app/lib/i18n';
import { C, Card, SectionTitle } from './comum';

// ─── Cruzamentos de dados (físico × digital × INE) ───
export default function Cruzamentos() {
  const canon = (s: string) => (s === 'Estados Unidos' ? 'EUA' : s);
  const bal: [string, number][] = (BALCAO['2026'].nacionalidades as [string, number][])
    .map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
  const dig: [string, number][] = DIGITAL.paises
    .map(([c, n]) => [canon(c), n] as [string, number]).filter(([c]) => c !== 'Portugal');
  const balTotal = bal.reduce((s, [, n]) => s + n, 0) || 1;
  const digTotal = dig.reduce((s, [, n]) => s + n, 0) || 1;
  const balMap: Record<string, number> = {}; bal.forEach(([c, n]) => { balMap[c] = (n / balTotal) * 100; });
  const digMap: Record<string, number> = {}; dig.forEach(([c, n]) => { digMap[c] = (n / digTotal) * 100; });
  const ineRank: Record<string, number> = {}; HEADLINE.mercados2025.forEach((c, i) => { ineRank[canon(c)] = i + 1; });

  const markets = Array.from(new Set([...Object.keys(balMap), ...Object.keys(digMap)]));
  const rows = markets.map((m) => ({
    m, bal: balMap[m] || 0, dig: digMap[m] || 0, ine: ineRank[m] || null, gap: (digMap[m] || 0) - (balMap[m] || 0),
  })).sort((a, b) => (b.bal + b.dig) - (a.bal + a.dig)).slice(0, 12);
  const maxShare = Math.max(...rows.map((r) => Math.max(r.bal, r.dig)), 1);
  const digitalOver = [...rows].filter((r) => r.gap > 3).sort((a, b) => b.gap - a.gap).slice(0, 3);
  const fisicoOver = [...rows].filter((r) => r.gap < -3).sort((a, b) => a.gap - b.gap).slice(0, 3);
  const dot = (cor: string) => ({ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: cor, marginRight: 5 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionTitle sub={t('Os mesmos mercados vistos por três fontes independentes', 'The same markets seen through three independent sources')}>{t('Cruzamentos de Dados', 'Data Cross-analysis')}</SectionTitle>

      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.textMuted, flexWrap: 'wrap' }}>
        <span><span style={dot(C.accent)} />{t('Balcão - presença física', 'Front desk - physical presence')}</span>
        <span><span style={dot(C.info)} />{t('Digital - interesse online', 'Digital - online interest')}</span>
        <span style={{ color: C.textDim }}>{t('#n = posição no ranking INE (dormidas)', '#n = position in INE ranking (overnight stays)')}</span>
      </div>

      <Card title={t('Mercados emissores · presença física vs interesse digital (quota %, excluindo Portugal)', 'Source markets · physical presence vs online interest (share %, excluding Portugal)')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {rows.map((r) => (
            <div key={r.m} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 52px', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: C.text }}>{dl(r.m)}</span>
                {r.ine && <span style={{ fontSize: 10, color: C.accent, background: C.accentBg, padding: '1px 6px', borderRadius: 6 }}>#{r.ine}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                  <div className="obs-grow" style={{ width: `${(r.bal / maxShare) * 100}%`, height: '100%', background: C.accent }} />
                </div>
                <div style={{ height: 7, borderRadius: 4, background: C.bg, overflow: 'hidden' }}>
                  <div className="obs-grow" style={{ width: `${(r.dig / maxShare) * 100}%`, height: '100%', background: C.info }} />
                </div>
              </div>
              <div style={{ fontSize: 11, textAlign: 'right' }}>
                <div style={{ color: C.accent }}>{r.bal.toFixed(1)}%</div>
                <div style={{ color: C.info }}>{r.dig.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card title={t('Mais interesse online que presença física', 'More online interest than physical presence')}>
          {digitalOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {digitalOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{dl(r.m)}</span>
                  <span style={{ color: C.info, fontWeight: 600 }}>+{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>{t('Sem divergências relevantes.', 'No relevant divergences.')}</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>{t('Mercados com curiosidade online ainda por converter em visita - ou tráfego de pesquisa/bots a validar.', 'Markets with online curiosity not yet converted into a visit - or search/bot traffic to validate.')}</div>
        </Card>
        <Card title={t('Mais presença física que pegada online', 'More physical presence than online footprint')}>
          {fisicoOver.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fisicoOver.map((r) => (
                <div key={r.m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.text }}>{dl(r.m)}</span>
                  <span style={{ color: C.accent, fontWeight: 600 }}>{r.gap.toFixed(1)} pp</span>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 12.5, color: C.textDim }}>{t('Sem divergências relevantes.', 'No relevant divergences.')}</div>}
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 10, lineHeight: 1.5 }}>{t('Chegam sem passar tanto pelo site - há margem para os captar em canais digitais.', 'They arrive without going through the site as much - there is room to capture them on digital channels.')}</div>
        </Card>
      </div>

      <p style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        {t('As três fontes medem coisas diferentes: INE = dormidas reais; balcão = apenas quem entra no posto de turismo (fatia pequena e auto-selecionada, dados de 2026); digital = audiência do site (inclui investigação e possível tráfego automatizado, p. ex. valores elevados da China). Portugal foi excluído por ser mercado doméstico. Lê isto como indício para investigar, não como prova.', 'The three sources measure different things: INE = real overnight stays; front desk = only those who enter the tourist office (a small, self-selected share, 2026 data); digital = the site audience (includes research and possible automated traffic, e.g. the high figures from China). Portugal was excluded as it is the domestic market. Read this as a clue to investigate, not as proof.')}
      </p>
    </div>
  );
}

