'use client';

import { t } from '@/app/lib/i18n';
import { METODOLOGIA, REGISTO_CORRECOES, tx } from '@/app/lib/metodologia-dados';
import { C, Card, SectionTitle } from './comum';

// Nota curta no fundo de cada separador (entra também no PDF exportado).
export function NotaMetodologica({ id }: { id: string }) {
  const n = METODOLOGIA[id];
  if (!n) return null;
  const linha = (rot: string, v: string) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 150px) minmax(0, 1fr)', gap: 10, padding: '3px 0' }}>
      <span style={{ color: C.textDim }}>{rot}</span><span style={{ color: C.textMuted }}>{v}</span>
    </div>
  );
  return (
    <div className="obs-nota-met" style={{ marginTop: 18, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 12, lineHeight: 1.5, background: 'rgba(255,255,255,0.015)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textDim, marginBottom: 6 }}>{t('Nota metodológica', 'Methodological note')}</div>
      {linha(t('Fontes', 'Sources'), tx(n.fontes))}
      {linha(t('Período', 'Period'), tx(n.periodo))}
      {linha(t('Extração', 'Extraction'), tx(n.extracao))}
      {linha(t('Estado', 'Status'), tx(n.estado))}
      {n.notas && linha(t('Notas', 'Notes'), tx(n.notas))}
    </div>
  );
}

// Separador «Fontes e metodologia»: todas as notas e o registo de correções.
export default function Metodologia({ nomeSeparador }: { nomeSeparador: (id: string) => string | null }) {
  const ids = Object.keys(METODOLOGIA).filter((id) => !!nomeSeparador(id));
  return (
    <>
      <SectionTitle sub={t('Fonte, período, data de extração e estado de cada separador, e as correções feitas aos dados', 'Source, period, extraction date and status of each tab, and the corrections made to the data')}>{t('Fontes e metodologia', 'Sources and methodology')}</SectionTitle>
      <Card title={t('Registo de correções', 'Corrections log')}>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '7px 6px' }}>{t('Data', 'Date')}</th><th style={{ padding: '7px 6px' }}>{t('Separador', 'Tab')}</th><th style={{ padding: '7px 6px' }}>{t('Correção', 'Correction')}</th></tr></thead>
            <tbody>{REGISTO_CORRECOES.map((c, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                <td data-l={t('Data', 'Date')} style={{ padding: '8px 6px', color: C.textMuted, whiteSpace: 'nowrap' }}>{c.data.split('-').reverse().join('/')}</td>
                <td data-l={t('Separador', 'Tab')} style={{ padding: '8px 6px', color: C.text, whiteSpace: 'nowrap' }}>{nomeSeparador(c.separador) || c.separador}</td>
                <td data-l={t('Correção', 'Correction')} style={{ padding: '8px 6px', color: C.textMuted }}>{tx(c.texto)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      <Card title={t('Nota metodológica por separador', 'Methodological note by tab')}>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '7px 6px' }}>{t('Separador', 'Tab')}</th><th style={{ padding: '7px 6px' }}>{t('Fontes', 'Sources')}</th><th style={{ padding: '7px 6px' }}>{t('Período', 'Period')}</th><th style={{ padding: '7px 6px' }}>{t('Extração', 'Extraction')}</th><th style={{ padding: '7px 6px' }}>{t('Estado', 'Status')}</th></tr></thead>
            <tbody>{ids.map((id) => {
              const n = METODOLOGIA[id];
              return (
                <tr key={id} style={{ borderTop: `1px solid ${C.border}`, verticalAlign: 'top' }}>
                  <td style={{ padding: '8px 6px', color: C.text, fontWeight: 600 }}>{nomeSeparador(id)}</td>
                  <td data-l={t('Fontes', 'Sources')} style={{ padding: '8px 6px', color: C.textMuted }}>{tx(n.fontes)}</td>
                  <td data-l={t('Período', 'Period')} style={{ padding: '8px 6px', color: C.textMuted }}>{tx(n.periodo)}</td>
                  <td data-l={t('Extração', 'Extraction')} style={{ padding: '8px 6px', color: C.textMuted }}>{tx(n.extracao)}</td>
                  <td data-l={t('Estado', 'Status')} style={{ padding: '8px 6px', color: C.textMuted }}>{tx(n.estado)}{n.notas ? ` · ${tx(n.notas)}` : ''}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Card>
      <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>{t('Quando um ficheiro não indica a data de extração, a plataforma não a inventa e escreve «não indicada no ficheiro». Os dados do INE de 2025 e 2026 são provisórios e podem ser revistos.', 'When a file does not state its extraction date, the platform does not invent one and writes «not stated in the file». INE data for 2025 and 2026 are provisional and may be revised.')}</div>
    </>
  );
}
