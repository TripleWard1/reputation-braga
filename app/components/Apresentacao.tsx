'use client';
// Modo apresentação: diapositivos de ecrã inteiro com os números-chave da plataforma.
// Todos os valores são calculados com as mesmas fontes e fórmulas do resto da app (só leitura).
import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@/app/lib/i18n';
import { indiceDestino, numeros, type LocMin } from '@/app/lib/temas';
import { DORMIDAS_BRAGA, DORMIDAS_PORTUGAL, MESES, SEMESTRE_2026, SUSTENTABILIDADE } from '@/app/lib/observatorio-dados';
import { SIBS_PAISES } from '@/app/lib/sibs-dados';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { estimativaDormidas } from '@/app/lib/estimativa';

interface Diapositivo { kicker: string; valor?: string; unidade?: string; titulo: string; detalhe?: string; extra?: [string, string][]; capa?: boolean; fecho?: boolean }

const n0 = (v: number) => Math.round(v).toLocaleString(t('pt-PT', 'en-GB')).replace(/,/g, '\u202F').replace(/\./g, '\u202F');
const d1 = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const sinal = (v: number) => `${v >= 0 ? '+' : ''}${d1(v)}%`;

function montar(locations: LocMin[]): Diapositivo[] {
  const S: any = SEMESTRE_2026, DB: any = DORMIDAS_BRAGA, DP: any = DORMIDAS_PORTUGAL, M = (MESES as unknown as string[]).slice(0, 6);
  const somaH1 = (serie: any, y: string) => M.reduce((a, m) => a + (serie?.[m]?.[y] ?? 0), 0);
  const varP = (a: number, b: number) => (b / a - 1) * 100;
  const dorm = somaH1(DB, '2026'), dormV = varP(somaH1(DB, '2025'), dorm), dormPT = varP(somaH1(DP, '2025'), somaH1(DP, '2026'));
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const prov = soma(S.proveitos.Braga['2026']), provV = varP(soma(S.proveitos.Braga['2025']), prov);
  const revpar = soma(S.revpar.Braga['2026']) / 6, revparV = varP(soma(S.revpar.Braga['2025']) / 6, revpar);
  const est = S.residencia.dormidas.Estrangeiro, res = S.residencia.dormidas.Portugal;
  const topM = [...S.mercadosDormidas].sort((x: any[], y: any[]) => y[2] - x[2])[0];
  const destino = indiceDestino(locations);
  const rob = locations.map((l) => numeros(l)).filter((x): x is NonNullable<ReturnType<typeof numeros>> => !!x && x.robustez !== 'insuficiente');
  const nRob = rob.reduce((a, x) => a + x.n, 0);
  const pos = nRob ? rob.reduce((a, x) => a + x.pos * x.n, 0) / nRob : 0;
  const totN = locations.map((l) => numeros(l)).reduce((a, x) => a + (x?.n || 0), 0);
  const paises = [...SIBS_PAISES].sort((a, b) => b.valor - a.valor);
  const sibsTot = paises.reduce((a, p) => a + p.valor, 0);
  const E = estimativaDormidas();
  const R = EMPREGO.regioes, SB = EMPREGO.serieBraga;
  const A: any = AL_BRAGA;
  const centroAL = (A.freguesias as any[]).filter((x) => /^União das freguesias de Braga \(|^Braga \(/.test(x.freguesia)).reduce((a, x) => a + x.n, 0);
  const Hh: any = HOTELARIA; const todosH = [...Hh.hoteis, ...Hh.outros];
  const capH = todosH.reduce((a: number, x: any) => a + x.capacidade, 0);
  const P: any = PERFIL_TURISTA, SU: any = SUSTENTABILIDADE;
  const dias: Diapositivo[] = [
    { capa: true, kicker: 'Braga', titulo: t('Turismo em Braga', 'Tourism in Braga'), detalhe: t('Reputação, procura, economia e sustentabilidade do destino', 'Destination reputation, demand, economy and sustainability') },
  ];
  if (destino) dias.push({ kicker: t('Reputação online', 'Online reputation'), valor: d1(destino.idx), unidade: '/10', titulo: t(`Índice do destino · ${d1(destino.avg, 2)} estrelas no Google`, `Destination index · ${d1(destino.avg, 2)} stars on Google`), detalhe: t('Comentários do Google Maps dos últimos três anos, média ponderada pelo número de avaliações.', 'Google Maps reviews from the last three years, weighted by number of reviews.'), extra: [[t('Positivos', 'Positive'), `${d1(pos)}%`], [t('Avaliações analisadas', 'Reviews analysed'), n0(totN)], [t('Locais monitorizados', 'Places monitored'), String(locations.length)]] });
  dias.push({ kicker: t('Procura · janeiro a junho de 2026', 'Demand · January to June 2026'), valor: n0(dorm), titulo: t(`dormidas em Braga, ${sinal(dormV)} face a 2025`, `overnight stays in Braga, ${sinal(dormV)} vs 2025`), detalhe: t(`Braga cresce acima do país (${sinal(dormPT)}).`, `Braga grows faster than the country (${sinal(dormPT)}).`), extra: [[t('Braga', 'Braga'), sinal(dormV)], ['Portugal', sinal(dormPT)]] });
  if (E) dias.push({ kicker: t(`Estimativa ${E.ano}`, `${E.ano} estimate`), valor: n0(Math.round(E.total / 100) * 100), titulo: t(`dormidas previstas para ${E.ano} (${sinal(E.variacao * 100)})`, `overnight stays expected in ${E.ano} (${sinal(E.variacao * 100)})`), detalhe: t(`Estimativa da plataforma: meses em falta calculados com o crescimento acumulado do ano. Intervalo entre ${n0(Math.round(E.totalMin / 100) * 100)} e ${n0(Math.round(E.totalMax / 100) * 100)}.`, `Platform estimate: missing months calculated with the year’s cumulative growth. Range ${n0(Math.round(E.totalMin / 100) * 100)} to ${n0(Math.round(E.totalMax / 100) * 100)}.`) });
  dias.push({ kicker: t('Economia · janeiro a junho de 2026', 'Economy · January to June 2026'), valor: d1(prov / 1e6, 2), unidade: 'M€', titulo: t(`de proveitos do alojamento (${sinal(provV)})`, `accommodation revenue (${sinal(provV)})`), extra: [['RevPAR', `${d1(revpar)} € (${sinal(revparV)})`]] });
  dias.push({ kicker: t('Mercados', 'Markets'), valor: d1((est / (est + res)) * 100), unidade: '%', titulo: t('das dormidas são de estrangeiros', 'of overnight stays are by foreign visitors'), detalhe: topM ? t(`${topM[0]} é o maior mercado externo, com ${d1((topM[2] / est) * 100)}% das dormidas de estrangeiros.`, `${topM[0]} is the largest foreign market, with ${d1((topM[2] / est) * 100)}% of foreign stays.`) : undefined });
  if (paises.length) dias.push({ kicker: t('Gastos com cartão', 'Card spending'), valor: d1(sibsTot / 1e6, 1), unidade: 'M€', titulo: t('gastos em Braga com cartões estrangeiros', 'spent in Braga with foreign cards'), detalhe: t(`${paises[0].pais} lidera com ${d1(paises[0].valor / 1e6, 1)} M€: o peso da diáspora bracarense, que visita a família e não aparece nas dormidas.`, `${paises[0].pais} leads with ${d1(paises[0].valor / 1e6, 1)} M€: the weight of Braga’s diaspora, who visit family and do not show up in overnight stays.`) });
  dias.push({ kicker: t(`Emprego · ${EMPREGO.ano}`, `Employment · ${EMPREGO.ano}`), valor: n0(R['Braga'].turismo), titulo: t('pessoas trabalham no alojamento e na restauração', 'people work in accommodation and food services'), detalhe: t(`${d1((R['Braga'].turismo / R['Braga'].total) * 100)}% do emprego nas empresas do concelho.`, `${d1((R['Braga'].turismo / R['Braga'].total) * 100)}% of company employment in the municipality.`), extra: SB ? [[t(`Desde ${SB.anos[0]}`, `Since ${SB.anos[0]}`), sinal(((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100)]] : undefined });
  dias.push({ kicker: t('Oferta', 'Supply'), valor: n0(capH + A.utentes), titulo: t('lugares de alojamento entre hotelaria e Alojamento Local', 'beds across hotels and short-term rentals'), extra: [[t('Hotelaria', 'Hotels'), `${todosH.length} · ${n0(capH)} ${t('lugares', 'beds')}`], [t('Alojamento Local', 'Short-term rentals'), `${n0(A.total)} · ${n0(A.utentes)} ${t('utentes', 'guests')}`], [t('AL no centro', 'Rentals in the centre'), `${Math.round((centroAL / A.total) * 100)}%`]] });
  dias.push({ kicker: t('O visitante', 'The visitor'), valor: d1(P.primeiraVisita), unidade: '%', titulo: t('visitam Braga pela primeira vez', 'are visiting Braga for the first time'), extra: [[t('Não pernoitam', 'Day visitors'), `${d1(P.alojamento[0][1])}%`], [t('Planearam com IA', 'Planned with AI'), `${P.fontes[3][1]}%`], [t('Vêm de Espanha', 'From Spain'), `${P.origem[0][1] + P.origem[1][1]}%`]] });
  dias.push({ kicker: t('Sustentabilidade', 'Sustainability'), valor: SU.certificacao, titulo: t('Certificação Green Destinations do destino', 'Green Destinations destination certification'), extra: [[t('Residentes com perceção positiva', 'Residents with a positive view'), `${d1(SU.percecao.positiva)}%`], [t('Negócios com certificação ambiental', 'Businesses with environmental certification'), String(SETOR_SUSTENTAVEL.certificados.length)]] });
  dias.push({ fecho: true, kicker: 'Visit Braga', titulo: t('Obrigado', 'Thank you'), detalhe: t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division') });
  return dias;
}

export default function Apresentacao({ locations, onClose }: { locations: LocMin[]; onClose: () => void }) {
  const dias = useMemo(() => montar(locations), [locations]);
  const [i, setI] = useState(0);
  const toque = useRef<number | null>(null);
  const ir = (n: number) => setI((x) => Math.max(0, Math.min(dias.length - 1, x + n)));
  useEffect(() => {
    const el = document.documentElement as any;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {});
    const tecla = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); ir(1); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); ir(-1); }
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'End') setI(dias.length - 1);
      else if (e.key === 'Escape') onClose();
    };
    const saiuEcra = () => { if (!document.fullscreenElement) { /* manter aberto; Esc fecha */ } };
    window.addEventListener('keydown', tecla);
    document.addEventListener('fullscreenchange', saiuEcra);
    const antes = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla); document.removeEventListener('fullscreenchange', saiuEcra);
      document.body.style.overflow = antes;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias.length]);
  const d = dias[i];
  return (
    <div className="apr" role="dialog" aria-modal="true" aria-label={t('Modo apresentação', 'Presentation mode')}
      onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (toque.current == null) return; const dx = e.changedTouches[0].clientX - toque.current; if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1); toque.current = null; }}>
      <style>{CSS_APR}</style>
      {(d.capa || d.fecho) && <div className="apr-foto" style={{ backgroundImage: 'url(/visao-geral.jpg)' }} />}
      <div className="apr-sombra" style={{ background: d.capa || d.fecho ? 'linear-gradient(0deg, #15171B 8%, rgba(21,23,27,.55) 60%, rgba(21,23,27,.35))' : 'radial-gradient(900px 500px at 15% 10%, rgba(138,176,230,.14), transparent), #15171B' }} />
      <div className="apr-progresso">{dias.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}</div>
      <button className="apr-fechar" onClick={onClose} aria-label={t('Sair da apresentação', 'Exit presentation')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div className="apr-zona" onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); ir(e.clientX - r.left > r.width / 3 ? 1 : -1); }}>
        <div key={i} className={`apr-conteudo${d.capa || d.fecho ? ' centro' : ''}`}>
          {(d.capa || d.fecho) && <img className="apr-logo" src="/visit-braga-logo.png" alt="Visit Braga" />}
          <div className="apr-kicker">{d.kicker}</div>
          {d.valor && <div className="apr-valor">{d.valor}{d.unidade && <small>{d.unidade}</small>}</div>}
          <div className={d.capa || d.fecho ? 'apr-titulo grande' : 'apr-titulo'}>{d.titulo}</div>
          {d.detalhe && <div className="apr-detalhe">{d.detalhe}</div>}
          {d.capa && <div className="apr-data">{new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          {d.extra && (
            <div className="apr-extra">
              {d.extra.map(([l, v]) => <div key={l}><span>{l}</span><strong>{v}</strong></div>)}
            </div>
          )}
        </div>
      </div>
      <div className="apr-rodape">
        <span>{i === 0 ? t('← → ou espaço para navegar · Esc para sair', '← → or space to navigate · Esc to exit') : `${i + 1} / ${dias.length}`}</span>
        <div>
          <button onClick={() => ir(-1)} disabled={i === 0} aria-label={t('Anterior', 'Previous')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
          <button onClick={() => ir(1)} disabled={i === dias.length - 1} aria-label={t('Seguinte', 'Next')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
    </div>
  );
}

const CSS_APR = `
.apr { position: fixed; inset: 0; z-index: 200; background: #15171B; color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; font-variant-numeric: tabular-nums; overflow: hidden; user-select: none; }
.apr-foto { position: absolute; inset: -30px; background-size: cover; background-position: center; animation: aprKb 20s ease-in-out infinite alternate; }
@keyframes aprKb { from { transform: scale(1.03); } to { transform: scale(1.12); } }
.apr-sombra { position: absolute; inset: 0; }
.apr-progresso { position: absolute; top: 18px; left: 28px; right: 80px; display: flex; gap: 6px; z-index: 2; }
.apr-progresso span { flex: 1; height: 3px; border-radius: 999px; background: rgba(255,255,255,.14); transition: background .3s ease; }
.apr-progresso span.on { background: #8AB0E6; }
.apr-fechar { position: absolute; top: 8px; right: 18px; z-index: 3; width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(21,23,27,.5); color: #ECEDEF; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.apr-zona { position: absolute; inset: 60px 0 76px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.apr-conteudo { position: relative; width: min(1100px, 88vw); animation: aprEntra .6s cubic-bezier(.2,.7,.2,1) both; }
.apr-conteudo.centro { text-align: center; }
@keyframes aprEntra { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
.apr-logo { width: clamp(220px, 30vw, 420px); height: auto; display: block; margin: 0 auto 34px; filter: drop-shadow(0 4px 18px rgba(0,0,0,.3)); }
.apr-kicker { font-size: clamp(13px, 1.3vw, 17px); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #8AB0E6; margin-bottom: 18px; }
.apr-valor { font-size: clamp(72px, 12vw, 168px); font-weight: 700; line-height: .95; letter-spacing: -0.035em; }
.apr-valor small { font-size: .32em; font-weight: 600; color: #A3A8B1; margin-left: 10px; letter-spacing: 0; }
.apr-titulo { font-size: clamp(22px, 2.6vw, 36px); font-weight: 600; margin-top: 18px; line-height: 1.25; max-width: 900px; }
.apr-titulo.grande { font-size: clamp(36px, 5.4vw, 76px); font-weight: 700; letter-spacing: -0.025em; max-width: none; margin-top: 4px; }
.apr-conteudo.centro .apr-titulo, .apr-conteudo.centro .apr-detalhe { margin-left: auto; margin-right: auto; }
.apr-detalhe { font-size: clamp(15px, 1.5vw, 20px); color: #A3A8B1; margin-top: 14px; line-height: 1.55; max-width: 820px; }
.apr-data { font-size: 15px; color: #A3A8B1; margin-top: 22px; }
.apr-extra { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 34px; }
.apr-extra > div { background: rgba(28,31,36,.75); border: 1px solid #2D3139; border-radius: 10px; padding: 14px 18px; min-width: 170px; }
.apr-extra span { display: block; font-size: 13px; color: #A3A8B1; }
.apr-extra strong { display: block; font-size: clamp(20px, 2vw, 28px); margin-top: 4px; }
.apr-rodape { position: absolute; left: 28px; right: 22px; bottom: 18px; display: flex; justify-content: space-between; align-items: center; z-index: 2; font-size: 13px; color: #A3A8B1; }
.apr-rodape button { width: 46px; height: 46px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(21,23,27,.55); color: #ECEDEF; margin-left: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.apr-rodape button:disabled { opacity: .35; cursor: default; }
@media (max-width: 700px) { .apr-zona { inset: 56px 0 72px; } .apr-extra > div { min-width: 0; flex: 1 1 140px; } }
@media (prefers-reduced-motion: reduce) { .apr-foto, .apr-conteudo { animation: none !important; } }
`;
