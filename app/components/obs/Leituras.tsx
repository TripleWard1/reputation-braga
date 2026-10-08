'use client';

import { useEffect, useRef, useState } from 'react';
import { t } from '@/app/lib/i18n';
import { MESES, DORMIDAS_BRAGA, DORMIDAS_NORTE, DORMIDAS_PORTUGAL, SEMESTRE_2026, SUSTENTABILIDADE } from '@/app/lib/observatorio-dados';
import { estimativaDormidas } from '@/app/lib/estimativa';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { TUB } from '@/app/lib/tub-dados';

// "Leituras do momento": o essencial do Observatório, com as mesmas fórmulas dos separadores. Cada cartão leva ao separador completo.
interface Leitura { id: string; tema: string; valor: string; frase: string; separador: string }

const num = (v: number) => Math.round(v).toLocaleString(t('pt-PT', 'en-GB'));
const dec = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const sinal = (v: number) => `${v >= 0 ? '+' : ''}${dec(v)}%`;

function montar(): Leitura[] {
  const out: Leitura[] = [];
  const M = (MESES as unknown as string[]).slice(0, 6);
  const h1 = (s: any, y: string) => M.reduce((a, m) => a + (s?.[m]?.[y] ?? 0), 0);
  const v = (s: any) => { const a = h1(s, '2025'); return a ? (h1(s, '2026') / a - 1) * 100 : 0; };
  const vB = v(DORMIDAS_BRAGA), vN = v(DORMIDAS_NORTE), vP = v(DORMIDAS_PORTUGAL);
  out.push({ id: 'procura', tema: t('Procura', 'Demand'), valor: sinal(vB), separador: 'procura',
    frase: vB > vP ? t(`Dormidas em Braga no 1.º semestre de 2026: crescem acima do país (${sinal(vP)})${vN > vB ? `, numa região que cresce ainda mais (${sinal(vN)})` : ''}.`, `Overnight stays in Braga in H1 2026: growing faster than the country (${sinal(vP)})${vN > vB ? `, in a region growing even faster (${sinal(vN)})` : ''}.`)
      : t(`Dormidas em Braga no 1.º semestre de 2026, face a ${sinal(vP)} no país.`, `Overnight stays in Braga in H1 2026, vs ${sinal(vP)} nationally.`) });
  const E = estimativaDormidas();
  if (E) out.push({ id: 'estimativa', tema: t(`Estimativa ${E.ano}`, `${E.ano} estimate`), valor: num(Math.round(E.total / 1000) * 1000), separador: 'estimativa',
    frase: t(`Dormidas previstas para ${E.ano} (${sinal(E.variacao * 100)}), com os meses ainda não publicados estimados pela plataforma.`, `Overnight stays expected in ${E.ano} (${sinal(E.variacao * 100)}), with unpublished months estimated by the platform.`) });
  const S: any = SEMESTRE_2026;
  const est = S?.residencia?.dormidas?.Estrangeiro, res = S?.residencia?.dormidas?.Portugal;
  const top = Array.isArray(S?.mercadosDormidas) ? [...S.mercadosDormidas].sort((a: any[], b: any[]) => b[2] - a[2])[0] : null;
  if (est && res) out.push({ id: 'mercados', tema: t('Mercados', 'Markets'), valor: `${dec((est / (est + res)) * 100)}%`, separador: 'mercados',
    frase: top ? t(`das dormidas são de estrangeiros; ${top[0]} é o maior mercado externo (${dec((top[2] / est) * 100)}%).`, `of overnight stays are by foreign visitors; ${top[0]} is the largest foreign market (${dec((top[2] / est) * 100)}%).`) : t('das dormidas são de estrangeiros.', 'of overnight stays are by foreign visitors.') });
  const R = EMPREGO.regioes, SB = EMPREGO.serieBraga;
  if (R?.Braga) out.push({ id: 'emprego', tema: t('Emprego', 'Employment'), valor: num(R.Braga.turismo), separador: 'emprego',
    frase: t(`pessoas, pelo menos, no alojamento e restauração (${dec((R.Braga.turismo / R.Braga.total) * 100)}% do emprego das empresas)${SB ? `, ${sinal(((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100)} desde ${SB.anos[0]}` : ''}.`, `people, at least, in accommodation and food (${dec((R.Braga.turismo / R.Braga.total) * 100)}% of company employment)${SB ? `, ${sinal(((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100)} since ${SB.anos[0]}` : ''}.`) });
  const A: any = AL_BRAGA;
  if (A?.total) { const c = (A.freguesias as any[]).filter((x) => x.centro).reduce((s2, x) => s2 + x.n, 0);
    out.push({ id: 'alojamento', tema: t('Alojamento Local', 'Short-term rentals'), valor: num(A.total), separador: 'alojamento',
      frase: t(`alojamentos locais ativos, ${Math.round((c / A.total) * 100)}% nas quatro freguesias do centro; ${A.estados.cessadosPermanente + A.estados.cessadosTemporario} cessaram atividade.`, `active short-term rentals, ${Math.round((c / A.total) * 100)}% in the four central parishes; ${A.estados.cessadosPermanente + A.estados.cessadosTemporario} ceased activity.`) }); }
  const H: any = HOTELARIA; const tod = [...H.hoteis, ...H.outros];
  const uni = tod.reduce((s2: number, x: any) => s2 + x.unidades, 0), ad = tod.reduce((s2: number, x: any) => s2 + x.adaptadas, 0);
  if (uni) out.push({ id: 'hotelaria', tema: t('Acessibilidade hoteleira', 'Hotel accessibility'), valor: `${dec((ad / uni) * 100)}%`, separador: 'hotelaria',
    frase: t(`dos quartos de hotel estão adaptados a mobilidade reduzida; ${tod.filter((x: any) => x.adaptadas === 0).length} estabelecimentos não têm nenhum.`, `of hotel rooms are adapted for reduced mobility; ${tod.filter((x: any) => x.adaptadas === 0).length} establishments have none.`) });
  const sam = (TUB as any).turismo?.find((x: any) => String(x.destino).startsWith('Sameiro'));
  if (sam && sam.mediaDia?.util) out.push({ id: 'mobilidade', tema: t('Mobilidade', 'Mobility'), valor: `${dec(sam.mediaDia.dom / sam.mediaDia.util)}×`, separador: 'mobilidade',
    frase: t(`mais entradas no autocarro do Sameiro ao domingo do que num dia útil: um sinal claro de procura de lazer.`, `more bus boardings at Sameiro on Sundays than on weekdays: a clear sign of leisure demand.`) });
  const P: any = PERFIL_TURISTA;
  if (P?.alojamento) out.push({ id: 'perfil', tema: t('Visitante', 'Visitor'), valor: `${dec(P.alojamento[0][1])}%`, separador: 'perfil',
    frase: t(`dos visitantes inquiridos não pernoita em Braga: converter visitas de um dia em estadias é a maior margem de crescimento.`, `of surveyed visitors do not stay overnight: turning day trips into stays is the biggest growth margin.`) });
  const SU: any = SUSTENTABILIDADE;
  if (SU?.percecao) out.push({ id: 'sustentabilidade', tema: t('Sustentabilidade', 'Sustainability'), valor: `${dec(SU.percecao.positiva)}%`, separador: 'sustentabilidade',
    frase: t(`dos residentes veem o turismo de forma positiva; destino com certificação ${(SU.destino && SU.destino.certificacao) || ''} da Green Destinations e ${SETOR_SUSTENTAVEL.certificados.length} negócios com certificação ambiental.`, `of residents view tourism positively; Green Destinations ${(SU.destino && SU.destino.certificacao) || ''} certified destination with ${SETOR_SUSTENTAVEL.certificados.length} environmentally certified businesses.`) });
  return out;
}

export default function Leituras({ irPara, nomeSeparador }: { irPara: (id: string) => void; nomeSeparador: (id: string) => string | null }) {
  const faixa = useRef<HTMLUListElement>(null);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);
  let lista: Leitura[] = [];
  try { lista = montar(); } catch { lista = []; }
  const atualizar = () => { const el = faixa.current; if (!el) return; setInicio(el.scrollLeft < 8); setFim(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8); };
  useEffect(() => { atualizar(); window.addEventListener('resize', atualizar); return () => window.removeEventListener('resize', atualizar); }, []);
  const mover = (dir: 1 | -1) => { const el = faixa.current; if (!el) return; el.scrollBy({ left: dir * Math.max(260, el.clientWidth * 0.85), behavior: 'smooth' }); };
  // Período a que se refere cada leitura (os observatórios de referência mostram-no sempre)
  const PERIODO: Record<string, string> = {
    procura: t('1.º semestre de 2026', 'H1 2026'), estimativa: t('estimativa para 2026', '2026 estimate'), mercados: t('1.º semestre de 2026', 'H1 2026'),
    emprego: String(EMPREGO.ano), alojamento: t('outubro de 2026', 'October 2026'), hotelaria: t('setembro de 2026', 'September 2026'),
    mobilidade: t('janeiro a setembro de 2026', 'January to September 2026'), perfil: t('inquérito de março', 'March survey'), sustentabilidade: t('Barómetro 2026', '2026 Barometer'),
  };
  if (!lista.length) return null;
  return (
    <section className="obs-leit" aria-labelledby="obs-leit-titulo">
      <div className="obs-leit-cab">
        <div>
          <h2 id="obs-leit-titulo" className="obs-leit-titulo">{t('Leituras do momento', 'Key readings')}</h2>
          <p className="obs-leit-sub">{t('O essencial do Observatório. Deslize para ver mais; cada cartão abre o separador completo.', 'The essentials of the Observatory. Swipe for more; each card opens the full tab.')}</p>
        </div>
        <div className="obs-leit-setas">
          <button type="button" onClick={() => mover(-1)} disabled={inicio} aria-label={t('Leituras anteriores', 'Previous readings')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <button type="button" onClick={() => mover(1)} disabled={fim} aria-label={t('Leituras seguintes', 'Next readings')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
      <ul ref={faixa} className="obs-leit-grelha" onScroll={atualizar} tabIndex={0} aria-label={t('Leituras do momento (deslize para o lado)', 'Key readings (scroll sideways)')}>
        {lista.map((l) => (
          <li key={l.id} className="obs-leit-cartao">
            <div className="obs-leit-tema">{l.tema}{PERIODO[l.id] && <span className="obs-leit-per"> · {PERIODO[l.id]}</span>}</div>
            <div className="obs-leit-valor">{l.valor}</div>
            <p className="obs-leit-frase">{l.frase}</p>
            {nomeSeparador(l.separador) && <button type="button" className="obs-leit-ir" onClick={() => irPara(l.separador)}>{t('Abrir', 'Open')} «{nomeSeparador(l.separador)}» <span aria-hidden="true">→</span></button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
