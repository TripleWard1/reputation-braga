'use client';

import { useEffect, useState } from 'react';
import { t } from '@/app/lib/i18n';
import Insto from './obs/Insto';
import { gerarRelatorioInsto } from '@/app/lib/relatorio-insto';

// Página própria da Rede INSTO (menu lateral). Reutiliza as 11 áreas e os dados de ambiente, clima e governança;
// os botões de cada área levam ao separador do Observatório com os dados completos.
const SEPARADORES: Record<string, [string, string]> = {
  procura: ['Procura', 'Demand'], emprego: ['Emprego', 'Employment'], economia: ['Economia', 'Economy'],
  sustentabilidade: ['Sustentabilidade', 'Sustainability'], acessibilidade: ['Acessibilidade', 'Accessibility'],
};
function nomeSeparador(id: string): string | null { const x = SEPARADORES[id]; return x ? t(x[0], x[1]) : null; }

function Anel({ valor, total }: { valor: number; total: number }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const reduzido = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) { setP(1); return; }
    let ini = 0; let raf = 0;
    const passo = (ts: number) => { if (!ini) ini = ts; const x = Math.min(1, (ts - ini) / 1400); setP(1 - Math.pow(1 - x, 3)); if (x < 1) raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, []);
  const r = 64; const c = 2 * Math.PI * r; const frac = (valor / total) * p;
  return (
    <div className="ip-anel" role="img" aria-label={t(`${valor} de ${total} áreas monitorizadas`, `${valor} of ${total} areas monitored`)}>
      <svg width="164" height="164" viewBox="0 0 164 164" aria-hidden="true">
        <circle cx="82" cy="82" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="12" />
        <circle cx="82" cy="82" r={r} fill="none" stroke="#7CC79A" strokeWidth="12" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 82 82)" />
      </svg>
      <div className="ip-anel-t"><b>{Math.round(valor * p)}</b><span>/ {total}</span></div>
    </div>
  );
}

export default function InstoPagina({ irPara }: { irPara: (id: string) => void }) {
  return (
    <div className="ip">
      <style>{CSS}</style>
      <header className="ip-hero">
        <div className="ip-hero-in">
          <div className="ip-txt">
            <div className="ip-kicker">{t('ONU Turismo · INSTO', 'UN Tourism · INSTO')}</div>
            <h1>{t('Rede INSTO', 'INSTO network')}</h1>
            <p>{t('A rede internacional de observatórios de turismo sustentável da ONU Turismo exige que cada destino monitorize 11 áreas. Braga já tem indicadores nas 11 áreas nesta plataforma; algumas ainda são parciais (ver o estado de cada área).', 'UN Tourism’s international network of sustainable tourism observatories requires each destination to monitor 11 areas. Braga already has indicators for all 11 areas on this platform; some are still partial (see each area’s status).')}</p>
            <button type="button" className="ip-rel" onClick={() => gerarRelatorioInsto()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M12 18v-6M9 15l3 3 3-3" /></svg>
              {t('Gerar Relatório Anual INSTO (PDF)', 'Generate INSTO Annual Report (PDF)')}
            </button>
            <span className="ip-rel-n">{t('Documento institucional completo: ficha técnica, sumário executivo, as 11 áreas com indicadores, leitura e próximos passos, lacunas e fontes.', 'Full institutional document: technical record, executive summary, the 11 areas with indicators, interpretation and next steps, data gaps and sources.')}</span>
          </div>
          <Anel valor={11} total={11} />
        </div>
      </header>
      <div className="obs ip-corpo">
        <Insto semTitulo irPara={irPara} nomeSeparador={nomeSeparador} />
      </div>
    </div>
  );
}

const CSS = `
.ip { color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.ip-hero { position: relative; overflow: hidden; background: linear-gradient(90deg, rgba(21,23,27,.95) 0%, rgba(21,23,27,.8) 50%, rgba(21,23,27,.55) 100%), linear-gradient(0deg, #15171B 0%, rgba(21,23,27,0) 45%), url(/visao-geral.jpg) center 40% / cover no-repeat; }
.ip-hero-in { max-width: 1400px; margin: 0 auto; padding: 64px 40px 44px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
.ip-txt { max-width: 760px; animation: ipEntra .7s ease both; }
.ip-kicker { font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #7CC79A; }
.ip-hero h1 { font-size: clamp(34px, 5vw, 56px); line-height: 1.05; letter-spacing: -0.025em; margin: 10px 0 12px; }
.ip-hero p { margin: 0; font-size: 16.5px; line-height: 1.6; color: #C9CDD3; }
.ip-rel { display: inline-flex; align-items: center; gap: 9px; margin-top: 20px; height: 46px; padding: 0 20px; border-radius: 999px; border: 0; background: #7CC79A; color: #0F1216; font: 700 14.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; box-shadow: 0 10px 26px -12px rgba(124,199,154,.7); transition: transform .2s ease; }
.ip-rel:hover { transform: translateY(-2px); }
.ip-rel-n { display: block; margin-top: 10px; font-size: 13px; color: #A3A8B1; max-width: 560px; line-height: 1.5; }
.ip-anel { position: relative; flex: 0 0 auto; filter: drop-shadow(0 0 28px rgba(124,199,154,.35)); }
.ip-anel-t { position: absolute; inset: 0; display: flex; align-items: baseline; justify-content: center; gap: 4px; padding-top: 58px; }
.ip-anel-t b { font-size: 42px; font-weight: 800; letter-spacing: -0.03em; } .ip-anel-t span { font-size: 16px; color: #A3A8B1; font-weight: 600; }
.ip-corpo { max-width: 1400px; margin: 0 auto; padding: 28px 40px 56px; }
.ip .obs-leit-ir { padding: 8px 14px; border-radius: 999px; font: 600 13px 'Public Sans', system-ui, sans-serif; cursor: pointer; border: 1px solid rgba(138,176,230,.45); background: rgba(138,176,230,.12); color: #ECEDEF; }
.ip .obs-leit-ir:hover { background: rgba(138,176,230,.22); }
.ip li { transition: transform .25s ease, border-color .25s ease; } .ip ul li:hover { transform: translateY(-2px); }
@keyframes ipEntra { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (max-width: 760px) { .ip-hero-in { flex-direction: column; align-items: flex-start; padding: 36px 16px 28px; } .ip-corpo { padding: 20px 16px 36px; } }
@media (prefers-reduced-motion: reduce) { .ip * { animation: none !important; transition: none !important; } }
`;
