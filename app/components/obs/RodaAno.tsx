'use client';

import { useMemo, useState } from 'react';
import { t, dl, getLang } from '@/app/lib/i18n';
import { MESES, MESES_CURTO, DORMIDAS_BRAGA } from '@/app/lib/observatorio-dados';
import { EVENTOS } from '@/app/lib/eventos-dados';
import { DATAS, MERCADOS } from '@/app/lib/calendario-mercados-dados';
import { fmt } from './comum';

// ─── RODA DO ANO: quando visitar Braga ───────────────────────────────────────
// Procura = dormidas mensais (INE/TravelBI, 2023–2025). Mercados = feriados e férias escolares dos mercados emissores.
// Eventos = agenda de eventos de Braga. Tudo calculado a partir dos dados da plataforma, sem valores inventados.

const C = 340, R_MIN = 142, R_MAX = 250, R_MERC = 268, R_EV = 296, R_LAB = 322;
const ANOS = ['2023', '2024', '2025'];
type Ano = 'media' | '2023' | '2024' | '2025';
const rad = (g: number) => (g * Math.PI) / 180;
const ponto = (r: number, g: number) => [C + r * Math.cos(rad(g)), C + r * Math.sin(rad(g))];
const cunha = (r0: number, r1: number, g0: number, g1: number) => {
  const [x0, y0] = ponto(r1, g0), [x1, y1] = ponto(r1, g1), [x2, y2] = ponto(r0, g1), [x3, y3] = ponto(r0, g0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
};
const tx = (o: { pt: string; en: string; es: string }) => (getLang() === 'es' ? o.es : getLang() === 'en' ? o.en : o.pt);
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
// Escala de cor: calmo (azul-ciano) -> médio (azul) -> alto (dourado) -> pico (laranja)
const PARAGENS = [[111, 200, 214], [138, 176, 230], [242, 193, 78], [237, 160, 107]];
const cor = (k: number) => { const x = Math.min(0.9999, Math.max(0, k)) * 3, i = Math.floor(x); const c = mix(PARAGENS[i], PARAGENS[i + 1], x - i); return `rgb(${c[0]},${c[1]},${c[2]})`; };
const dd = (iso: string) => { const [, m, d] = iso.split('-'); return `${+d}/${+m}`; };
const periodo = (ini: string, fim?: string) => { const y0 = ini.slice(0, 4), y1 = (fim || ini).slice(0, 4); return `${dd(ini)}${fim && fim !== ini ? `–${dd(fim)}` : ''} · ${y0 === y1 ? y0 : `${y0}–${y1.slice(2)}`}`; };
const sobrepoe = (ini: string, fim: string | undefined, mes: number) => {
  const a = Date.parse(ini), b = Date.parse(fim || ini);
  return [2026, 2027].some((y) => { const m0 = Date.UTC(y, mes, 1), m1 = Date.UTC(y, mes + 1, 0); return a <= m1 && b >= m0; });
};

const CSS = `
.rb-roda { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 34px; align-items: start; margin-top: 34px; padding: 26px; }
.rb-roda-svg { width: 100%; height: auto; display: block; overflow: visible; }
.rb-roda-cunha { cursor: pointer; outline: none; }
.rb-roda-bar { transform-origin: 340px 340px; animation: rbRoda .95s cubic-bezier(.2,.7,.2,1) both; animation-delay: calc(var(--i, 0) * 55ms); transition: opacity .25s, filter .25s; }
@keyframes rbRoda { from { transform: scale(.25); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.rb-roda-cunha:focus-visible .rb-roda-sel { opacity: 1; stroke: #8AB0E6; stroke-width: 2; }
.rb-roda-sel { fill: rgba(255,255,255,.1); opacity: 0; transition: opacity .2s; }
.rb-roda-cunha[aria-pressed="true"] .rb-roda-sel { opacity: 1; }
.rb-roda-cunha:hover .rb-roda-sel { opacity: .6; }
.rb-roda-cunha[aria-pressed="true"]:hover .rb-roda-sel { opacity: 1; }
.rb-roda-txt { font-family: inherit; fill: #ECEDEF; }
.rb-roda-det { min-width: 0; }
.rb-roda-chips { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 14px; }
.rb-roda-mes { height: 30px; padding: 0 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: transparent; color: #E4E6EA; font: 600 12.5px inherit; font-family: inherit; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.rb-roda-mes:hover { border-color: rgba(255,255,255,.5); }
.rb-roda-mes[aria-pressed="true"] { background: #F4F5F7; color: #0F1216; border-color: #F4F5F7; }
.rb-roda-mes:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
.rb-roda-tit { font-size: clamp(28px, 3.2vw, 40px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; margin: 0; }
.rb-roda-estado { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #0F1216; }
.rb-roda-p { font-size: 15px; line-height: 1.55; color: #E4E6EA; margin: 14px 0 0; }
.rb-roda-p b { color: #fff; }
.rb-roda-bloco { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.14); }
.rb-roda-bt { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #B7CDF0; margin-bottom: 8px; }
.rb-roda-li { font-size: 14px; line-height: 1.45; color: #E4E6EA; margin: 6px 0; display: flex; gap: 9px; }
.rb-roda-li i { flex-shrink: 0; width: 8px; height: 8px; border-radius: 999px; margin-top: 6px; }
.rb-roda-li a { color: #B7CDF0; }
.rb-roda-spark { display: flex; gap: 8px; height: 96px; margin-top: 8px; }
.rb-roda-spark > div { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; min-width: 0; }
.rb-roda-spark small { flex: none; font-size: 10.5px; color: #D5D8DE; margin-bottom: 3px; }
.rb-roda-spark-b { flex: 1; width: 100%; min-height: 0; display: flex; align-items: flex-end; }
.rb-roda-spark-b span { display: block; width: 100%; border-radius: 4px 4px 0 0; transform-origin: bottom; animation: rbBarraY .8s cubic-bezier(.2,.7,.2,1) both; }
.rb-roda-spark em { flex: none; font-style: normal; font-size: 10.5px; color: #C9CDD4; margin-top: 4px; }
.rb-roda-leg { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-top: 14px; font-size: 12.5px; color: #D5D8DE; }
.rb-roda-leg i { display: inline-block; vertical-align: middle; margin-right: 6px; }
.rb-roda-grad { width: 74px; height: 8px; border-radius: 999px; background: linear-gradient(90deg, rgb(111,200,214), rgb(138,176,230), rgb(242,193,78), rgb(237,160,107)); }
.rb-roda-ctrl { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 4px; }
.rb-roda-sep { width: 1px; height: 22px; background: rgba(255,255,255,.2); margin: 0 4px; }
@media (max-width: 1000px) { .rb-roda { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .rb-roda { padding: 16px 14px 20px; gap: 22px; } }
@media (prefers-reduced-motion: reduce) { .rb-roda-bar, .rb-roda-spark-b span { animation: none; } }
`;

export default function RodaAno() {
  const [mes, setMes] = useState(() => (typeof Date !== 'undefined' ? new Date().getMonth() : 0));
  const [ano, setAno] = useState<Ano>('media');
  const [camadas, setCamadas] = useState({ mercados: true, eventos: true });
  const hoje = typeof Date !== 'undefined' ? new Date().getMonth() : -1;

  const dorm = (m: number, y: string) => (DORMIDAS_BRAGA[MESES[m]]?.[y] ?? null) as number | null;
  const serie = useMemo(() => {
    const v = MESES.map((_, m) => {
      if (ano === 'media') { const xs = ANOS.map((y) => dorm(m, y)).filter((x): x is number => x != null); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
      return dorm(m, ano) ?? 0;
    });
    const media = v.reduce((a, b) => a + b, 0) / 12, max = Math.max(...v), min = Math.min(...v);
    return { v, media, max, min, idx: v.map((x) => (x / media) * 100) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano]);

  const mercadosMes = useMemo(() => MESES.map((_, m) => {
    const itens = DATAS.filter((d) => sobrepoe(d.ini, d.fim, m));
    return { itens, n: new Set(itens.map((d) => d.mercado)).size };
  }), []);
  const maxMerc = Math.max(1, ...mercadosMes.map((x) => x.n));
  const eventosMes = useMemo(() => MESES.map((_, m) => EVENTOS.filter((e) => sobrepoe(e.ini, e.fim, m))), []);

  const k = (m: number) => (serie.v[m] - serie.min) / Math.max(1, serie.max - serie.min);
  const classe = (i: number) => (i >= 118 ? [t('Pico de procura', 'Peak demand'), 1] : i >= 105 ? [t('Procura alta', 'High demand'), 0.7] : i >= 92 ? [t('Procura média', 'Average demand'), 0.4] : [t('Mês tranquilo', 'Quiet month'), 0.05]) as [string, number];
  const [rotulo, nivel] = classe(serie.idx[mes]);
  const pos = [...serie.v].sort((a, b) => b - a).indexOf(serie.v[mes]) + 1;
  const dif = serie.idx[mes] - 100;
  const nomeMes = dl(MESES[mes]);
  const anosSpark = ['2019', '2022', '2023', '2024', '2025'];
  const maxSpark = Math.max(1, ...anosSpark.map((y) => dorm(mes, y) ?? 0));
  const mer = mercadosMes[mes], ev = eventosMes[mes];
  // um período por mercado primeiro (para não ficar tudo da mesma região), até 5 linhas
  const visiveis = (() => { const vistos = new Set<string>(); const um = mer.itens.filter((d) => (vistos.has(d.mercado) ? false : (vistos.add(d.mercado), true))); const resto = mer.itens.filter((d) => !um.includes(d)); return [...um, ...resto].slice(0, 5); })();

  const tecla = (e: React.KeyboardEvent, m: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setMes((m + 1) % 12); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setMes((m + 11) % 12); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMes(m); }
  };

  return (
    <div className="rb-cap-vidro rb-roda rb-rise">
      <style>{CSS}</style>
      <div>
        <div className="rb-roda-ctrl" role="group" aria-label={t('Dados da roda', 'Wheel data')}>
          {([['media', t('Média 2023–25', 'Average 2023–25')], ['2023', '2023'], ['2024', '2024'], ['2025', '2025']] as [Ano, string][]).map(([id, nome]) => (
            <button key={id} type="button" className="rb-cap-aba" aria-selected={ano === id} role="tab" onClick={() => setAno(id)}>{nome}</button>
          ))}
          <span className="rb-roda-sep" aria-hidden="true" />
          <button type="button" className="rb-cap-aba" aria-pressed={camadas.mercados} onClick={() => setCamadas((c) => ({ ...c, mercados: !c.mercados }))} style={camadas.mercados ? { background: 'rgba(227,154,192,.9)', borderColor: 'transparent', color: '#0F1216' } : undefined}>{t('Mercados em férias', 'Markets on holiday')}</button>
          <button type="button" className="rb-cap-aba" aria-pressed={camadas.eventos} onClick={() => setCamadas((c) => ({ ...c, eventos: !c.eventos }))} style={camadas.eventos ? { background: '#F2C14E', borderColor: 'transparent', color: '#0F1216' } : undefined}>{t('Eventos', 'Events')}</button>
        </div>
        <svg className="rb-roda-svg" viewBox="0 0 680 680" role="group" aria-label={t('Roda do ano: procura turística de Braga por mês', 'Year wheel: Braga tourism demand by month')} key={ano}>
          {[R_MIN - 8, R_MAX + 8].map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="rgba(255,255,255,.08)" />)}
          {MESES.map((_, m) => {
            const g0 = -90 + m * 30 + 1.2, g1 = -90 + (m + 1) * 30 - 1.2, gm = -90 + m * 30 + 15;
            const len = R_MIN + (R_MAX - R_MIN) * (0.16 + 0.84 * (serie.v[m] / (serie.max || 1)));
            const [lx, ly] = ponto(R_LAB, gm), [ex, ey] = ponto(R_EV, gm);
            const sel = m === mes;
            return (
              <g key={m} className="rb-roda-cunha" role="button" tabIndex={0} aria-pressed={sel} aria-label={`${dl(MESES[m])}: ${fmt(serie.idx[m], 0)} ${t('de índice de procura', 'demand index')}`}
                onMouseEnter={() => setMes(m)} onFocus={() => setMes(m)} onClick={() => setMes(m)} onKeyDown={(e) => tecla(e, m)}>
                <path className="rb-roda-sel" d={cunha(R_MIN - 6, R_LAB + 18, g0 - 0.8, g1 + 0.8)} />
                <path className="rb-roda-bar" style={{ ['--i' as any]: m }} d={cunha(R_MIN, len, g0, g1)} fill={cor(k(m))} opacity={sel ? 1 : 0.86} />
                {camadas.mercados && mercadosMes[m].n > 0 && <path d={cunha(R_MERC, R_MERC + 12, g0, g1)} fill="#E39AC0" opacity={0.2 + 0.8 * (mercadosMes[m].n / maxMerc)} />}
                {camadas.eventos && eventosMes[m].length > 0 && (
                  <g><circle cx={ex} cy={ey} r={9} fill="#F2C14E" /><text x={ex} y={ey + 3.6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F1216">{eventosMes[m].length}</text></g>
                )}
                <text x={lx} y={ly + 4.5} textAnchor="middle" fontSize={sel ? 15 : 13} fontWeight={sel ? 800 : 600} className="rb-roda-txt" opacity={sel ? 1 : 0.8}>{dl(MESES_CURTO[m])}</text>
                {m === hoje && <circle cx={ponto(R_MIN - 18, gm)[0]} cy={ponto(R_MIN - 18, gm)[1]} r={4} fill="#fff" />}
              </g>
            );
          })}
          <text x={C} y={C - 14} textAnchor="middle" fontSize="40" fontWeight="800" className="rb-roda-txt">{nomeMes}</text>
          <text x={C} y={C + 18} textAnchor="middle" fontSize="15" className="rb-roda-txt" opacity=".85">{rotulo}</text>
          <text x={C} y={C + 44} textAnchor="middle" fontSize="13" className="rb-roda-txt" opacity=".65">{t('índice', 'index')} {fmt(serie.idx[mes], 0)} · {t('média = 100', 'average = 100')}</text>
        </svg>
        <div className="rb-roda-chips" role="group" aria-label={t('Escolher o mês', 'Choose the month')}>
          {MESES.map((_, m) => <button key={m} type="button" className="rb-roda-mes" aria-pressed={m === mes} onClick={() => setMes(m)}>{dl(MESES_CURTO[m])}</button>)}
        </div>
        <div className="rb-roda-leg" aria-hidden="true">
          <span><i className="rb-roda-grad" />{t('mais calmo → pico de procura', 'quieter → peak demand')}</span>
          <span><i style={{ width: 14, height: 5, borderRadius: 3, background: '#E39AC0' }} />{t('mercados em férias', 'markets on holiday')}</span>
          <span><i style={{ width: 12, height: 12, borderRadius: 999, background: '#F2C14E' }} />{t('eventos no mês', 'events in the month')}</span>
          <span><i style={{ width: 8, height: 8, borderRadius: 999, background: '#fff' }} />{t('mês atual', 'current month')}</span>
        </div>
      </div>

      <div className="rb-roda-det" aria-live="polite">
        <h3 className="rb-roda-tit">{nomeMes}</h3>
        <span className="rb-roda-estado" style={{ background: cor(nivel) }}>{rotulo}{mes === hoje ? ` · ${t('este mês', 'this month')}` : ''}</span>
        <p className="rb-roda-p">
          {getLang() === 'en' ? (
            <>In <b>{nomeMes}</b> Braga records, on average, <b>{fmt(Math.round(serie.v[mes]))}</b> overnight stays ({ano === 'media' ? '2023–2025 average' : ano}), <b>{fmt(Math.abs(dif), 0)}%</b> {dif >= 0 ? 'above' : 'below'} the monthly average. It is the <b>#{pos}</b> busiest month of the year.</>
          ) : (
            <>Em <b>{nomeMes}</b> há, em média, <b>{fmt(Math.round(serie.v[mes]))}</b> dormidas ({ano === 'media' ? 'média de 2023 a 2025' : ano}), <b>{fmt(Math.abs(dif), 0)}%</b> {dif >= 0 ? 'acima' : 'abaixo'} da média mensal. É o <b>{pos}.º</b> mês mais procurado do ano.</>
          )}
        </p>

        <div className="rb-roda-bloco">
          <div className="rb-roda-bt">{t(`Dormidas em ${nomeMes}, ano a ano`, `Overnight stays in ${nomeMes}, year by year`)}</div>
          <div className="rb-roda-spark" key={mes}>
            {anosSpark.map((y, i) => { const v = dorm(mes, y) ?? 0; return (
              <div key={y} title={`${y}: ${fmt(v)}`}>
                <small>{v ? `${fmt(Math.round(v / 1000), 0)}k` : '–'}</small>
                <div className="rb-roda-spark-b"><span style={{ height: `${(v / maxSpark) * 100}%`, animationDelay: `${i * 70}ms`, background: y === '2025' ? '#8AB0E6' : 'rgba(138,176,230,.5)' }} /></div>
                <em>{y}</em>
              </div>
            ); })}
          </div>
        </div>

        <div className="rb-roda-bloco">
          <div className="rb-roda-bt">{t('Mercados em férias ou feriado', 'Markets on holiday')}</div>
          {mer.itens.length ? (
            <>
              {visiveis.map((d, i) => (
                <div className="rb-roda-li" key={i}><i style={{ background: '#E39AC0' }} /><span><b style={{ color: '#fff' }}>{tx(MERCADOS[d.mercado].nome)}</b> · {tx(d.nome)} ({periodo(d.ini, d.fim)})</span></div>
              ))}
              {mer.itens.length > visiveis.length && <div className="rb-roda-li" style={{ opacity: 0.75 }}><i style={{ background: 'transparent' }} /><span>{t(`+ ${mer.itens.length - visiveis.length} períodos`, `+ ${mer.itens.length - visiveis.length} more periods`)}</span></div>}
            </>
          ) : <p className="rb-roda-li" style={{ opacity: 0.8 }}>{t('Sem feriados nem férias escolares registados neste mês.', 'No holidays or school breaks recorded this month.')}</p>}
        </div>

        <div className="rb-roda-bloco">
          <div className="rb-roda-bt">{t('Eventos em Braga', 'Events in Braga')}</div>
          {ev.length ? ev.map((e) => (
            <div className="rb-roda-li" key={e.id}><i style={{ background: '#F2C14E' }} /><span><b style={{ color: '#fff' }}>{tx(e.nome)}</b> · {periodo(e.ini, e.fim)} · <a href={e.fonte} target="_blank" rel="noopener noreferrer">{t('fonte', 'source')}</a></span></div>
          )) : <p className="rb-roda-li" style={{ opacity: 0.8 }}>{t('Sem eventos da agenda neste mês.', 'No agenda events this month.')}</p>}
        </div>
      </div>
    </div>
  );
}
