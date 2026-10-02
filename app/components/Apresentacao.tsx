'use client';
// Modo apresentação: uma narrativa em capítulos, com formatos variados (comparações, gráfico, listas, contrastes, trios).
// Todos os valores vêm das mesmas fontes e fórmulas do resto da plataforma (só leitura).
import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@/app/lib/i18n';
import { indiceDestino, numeros, temaNome, type LocMin } from '@/app/lib/temas';
import { DORMIDAS_BRAGA, DORMIDAS_PORTUGAL, DORMIDAS_NORTE, MESES, SEMESTRE_2026, SUSTENTABILIDADE } from '@/app/lib/observatorio-dados';
import { SIBS_PAISES } from '@/app/lib/sibs-dados';
import { EMPREGO } from '@/app/lib/emprego-dados';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { LOJAS_HISTORIA_META } from '@/app/lib/lojas-historia-dados';
import { RNAAT } from '@/app/lib/rnaat-dados';
import { estimativaDormidas } from '@/app/lib/estimativa';

type Barra = { nome: string; valor: number; texto: string; destaque?: boolean };
type Dia =
  | { tipo: 'capa'; titulo: string; sub: string }
  | { tipo: 'fecho'; titulo: string; sub: string }
  | { tipo: 'capitulo'; n: number; titulo: string; sub: string }
  | { tipo: 'numero'; kicker: string; valor: string; unidade?: string; titulo: string; nota?: string }
  | { tipo: 'barras'; kicker: string; titulo: string; barras: Barra[]; nota?: string }
  | { tipo: 'ano'; kicker: string; titulo: string; meses: { m: string; ant: number | null; real: number | null; est: number | null }[]; nota?: string }
  | { tipo: 'duas-listas'; kicker: string; titulo: string; a: { titulo: string; cor: string; itens: [string, string][] }; b: { titulo: string; cor: string; itens: [string, string][] }; nota?: string }
  | { tipo: 'contraste'; kicker: string; titulo: string; a: { rot: string; valor: string; sub: string }; b: { rot: string; valor: string; sub: string }; nota?: string }
  | { tipo: 'trio'; kicker: string; titulo: string; itens: { valor: string; rot: string }[]; nota?: string };

const n0 = (v: number) => Math.round(v).toLocaleString(t('pt-PT', 'en-GB')).replace(/[,.]/g, '\u202F');
const d1 = (v: number, d = 1) => v.toLocaleString(t('pt-PT', 'en-GB'), { minimumFractionDigits: d, maximumFractionDigits: d });
const sinal = (v: number) => `${v >= 0 ? '+' : ''}${d1(v)}%`;
const MC = () => [t('jan', 'Jan'), t('fev', 'Feb'), t('mar', 'Mar'), t('abr', 'Apr'), t('mai', 'May'), t('jun', 'Jun'), t('jul', 'Jul'), t('ago', 'Aug'), t('set', 'Sep'), t('out', 'Oct'), t('nov', 'Nov'), t('dez', 'Dec')];

function montar(locations: LocMin[]): Dia[] {
  const S: any = SEMESTRE_2026, M = (MESES as unknown as string[]);
  const H1 = M.slice(0, 6);
  const somaH1 = (serie: any, y: string) => H1.reduce((a, m) => a + (serie?.[m]?.[y] ?? 0), 0);
  const varP = (a: number, b: number) => (b / a - 1) * 100;
  const dorm = somaH1(DORMIDAS_BRAGA, '2026');
  const vB = varP(somaH1(DORMIDAS_BRAGA, '2025'), dorm), vN = varP(somaH1(DORMIDAS_NORTE, '2025'), somaH1(DORMIDAS_NORTE, '2026')), vP = varP(somaH1(DORMIDAS_PORTUGAL, '2025'), somaH1(DORMIDAS_PORTUGAL, '2026'));
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);
  const prov = soma(S.proveitos.Braga['2026']), provV = varP(soma(S.proveitos.Braga['2025']), prov);
  const revpar = soma(S.revpar.Braga['2026']) / 6, revparV = varP(soma(S.revpar.Braga['2025']) / 6, revpar);
  const est = S.residencia.dormidas.Estrangeiro, res = S.residencia.dormidas.Portugal;
  const mercados = [...S.mercadosDormidas].sort((x: any[], y: any[]) => y[2] - x[2]).slice(0, 6);
  const E = estimativaDormidas();
  const destino = indiceDestino(locations);
  const rob = locations.map((l) => numeros(l)).filter((x): x is NonNullable<ReturnType<typeof numeros>> => !!x && x.robustez !== 'insuficiente');
  const nRob = rob.reduce((a, x) => a + x.n, 0);
  const pos = nRob ? rob.reduce((a, x) => a + x.pos * x.n, 0) / nRob : 0;
  // temas mais elogiados / criticados no destino
  const cont = (estados: string[]) => {
    const c: Record<string, number> = {};
    locations.forEach((l: any) => ((l.analysis?.v2?.temas || []) as any[]).forEach((z) => { if (estados.includes(z.estado)) c[z.id] = (c[z.id] || 0) + 1; }));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => [temaNome(id), t(`${n} ${n === 1 ? 'local' : 'locais'}`, `${n} ${n === 1 ? 'place' : 'places'}`)] as [string, string]);
  };
  const elogios = cont(['forte']), criticas = cont(['persistente', 'novo']);
  const paises = [...SIBS_PAISES].sort((a, b) => b.valor - a.valor);
  const R = EMPREGO.regioes, SB = EMPREGO.serieBraga, GT = EMPREGO.ganhoTerritorios;
  const peso = (r: string) => (R[r].turismo / R[r].total) * 100;
  const A: any = AL_BRAGA;
  const alCentro = (A.freguesias as any[]).filter((x) => x.centro).reduce((a: number, x: any) => a + x.n, 0);
  const Hh: any = HOTELARIA; const todosH = [...Hh.hoteis, ...Hh.outros];
  const capH = todosH.reduce((a: number, x: any) => a + x.capacidade, 0);
  const P: any = PERFIL_TURISTA, SU: any = SUSTENTABILIDADE;
  const mc = MC();
  const dias: Dia[] = [];
  dias.push({ tipo: 'capa', titulo: t('Turismo em Braga', 'Tourism in Braga'), sub: t('Quem nos visita, como nos avaliam, o que gera e para onde vamos', 'Who visits us, how they rate us, what it generates and where we are heading') });

  // 1. Quem nos visita
  dias.push({ tipo: 'capitulo', n: 1, titulo: t('Quem nos visita', 'Who visits us'), sub: t('Procura, mercados e perfil do visitante', 'Demand, markets and visitor profile') });
  dias.push({ tipo: 'barras', kicker: t('Dormidas · janeiro a junho de 2026', 'Overnight stays · January to June 2026'), titulo: vB > vN && vB > vP ? t(`Braga cresce mais do que a região e o país: ${n0(dorm)} dormidas`, `Braga grows faster than the region and the country: ${n0(dorm)} stays`) : vB > vP ? t(`${n0(dorm)} dormidas: Braga cresce acima do país, a par de uma região em forte crescimento`, `${n0(dorm)} stays: Braga grows faster than the country, alongside a fast-growing region`) : t(`${n0(dorm)} dormidas em Braga no primeiro semestre`, `${n0(dorm)} overnight stays in Braga in the first half`), barras: [{ nome: 'Braga', valor: vB, texto: sinal(vB), destaque: true }, { nome: t('Norte', 'North'), valor: vN, texto: sinal(vN) }, { nome: 'Portugal', valor: vP, texto: sinal(vP) }], nota: t('Variação face ao mesmo período de 2025 · INE/TravelBI', 'Change vs the same period in 2025 · INE/TravelBI') });
  if (E) dias.push({ tipo: 'ano', kicker: t(`O ano de ${E.ano}`, `The year ${E.ano}`), titulo: t(`${E.ano} deverá fechar com cerca de ${n0(Math.round(E.total / 1000) * 1000)} dormidas (${sinal(E.variacao * 100)})`, `${E.ano} should close with about ${n0(Math.round(E.total / 1000) * 1000)} stays (${sinal(E.variacao * 100)})`), meses: E.meses.map((m) => ({ m: mc[m.i], ant: m.anterior, real: m.real, est: m.est })), nota: t(`A azul, os meses publicados pelo INE; a laranja, a estimativa da plataforma; a linha, ${E.ano - 1}.`, `Blue: months published by INE; orange: platform estimate; line: ${E.ano - 1}.`) });
  dias.push({ tipo: 'barras', kicker: t('Mercados', 'Markets'), titulo: t(`${d1((est / (est + res)) * 100)}% das dormidas são de estrangeiros: estes são os maiores mercados`, `${d1((est / (est + res)) * 100)}% of stays are by foreign visitors: these are the largest markets`), barras: mercados.map((m: any[], i: number) => ({ nome: String(m[0]), valor: (m[2] / est) * 100, texto: `${d1((m[2] / est) * 100)}%`, destaque: i === 0 })), nota: t('Percentagem das dormidas de estrangeiros, janeiro a junho de 2026', 'Share of foreign overnight stays, January to June 2026') });
  dias.push({ tipo: 'trio', kicker: t('O visitante', 'The visitor'), titulo: t('Um visitante novo, que planeia online e muitas vezes não dorme cá', 'A first-time visitor who plans online and often does not stay overnight'), itens: [{ valor: `${d1(P.primeiraVisita)}%`, rot: t('vêm pela primeira vez', 'first-time visitors') }, { valor: `${d1(P.alojamento[0][1])}%`, rot: t('não pernoitam em Braga', 'do not stay overnight') }, { valor: `${P.fontes[3][1]}%`, rot: t('planearam com inteligência artificial', 'planned with artificial intelligence') }], nota: t('Estudo de perfil do turista (112 inquéritos, março)', 'Visitor profile study (112 surveys, March)') });

  // 2. Como nos avaliam
  dias.push({ tipo: 'capitulo', n: 2, titulo: t('Como nos avaliam', 'How they rate us'), sub: t('Reputação online dos locais do destino', 'Online reputation of the destination’s places') });
  if (destino) dias.push({ tipo: 'numero', kicker: t('Índice do destino', 'Destination index'), valor: d1(destino.idx), unidade: '/10', titulo: t(`${d1(destino.avg, 2)} estrelas no Google e ${d1(pos)}% de avaliações positivas`, `${d1(destino.avg, 2)} stars on Google and ${d1(pos)}% positive reviews`), nota: t(`Comentários dos últimos três anos em ${destino.locais} locais, ponderados pelo número de avaliações`, `Reviews from the last three years across ${destino.locais} places, weighted by number of reviews`) });
  if (elogios.length || criticas.length) dias.push({ tipo: 'duas-listas', kicker: t('O que dizem os visitantes', 'What visitors say'), titulo: t('O que mais elogiam e o que mais criticam', 'What they praise most and criticise most'), a: { titulo: t('Elogiam', 'Praise'), cor: '#7CC79A', itens: elogios }, b: { titulo: t('Criticam', 'Criticise'), cor: '#EF8A7B', itens: criticas }, nota: t('Temas que são ponto forte, ou problema persistente ou novo, em cada local', 'Themes that are a strength, or a persistent or new issue, at each place') });

  // 3. O que gera
  dias.push({ tipo: 'capitulo', n: 3, titulo: t('O que o turismo gera', 'What tourism generates'), sub: t('Receitas, gastos e emprego', 'Revenue, spending and jobs') });
  dias.push({ tipo: 'trio', kicker: t('Economia · janeiro a junho de 2026', 'Economy · January to June 2026'), titulo: t('Mais receita por quarto, não só mais hóspedes', 'More revenue per room, not just more guests'), itens: [{ valor: `${d1(prov / 1e6, 2)} M€`, rot: t(`proveitos do alojamento (${sinal(provV)})`, `accommodation revenue (${sinal(provV)})`) }, { valor: `${d1(revpar)} €`, rot: t(`RevPAR (${sinal(revparV)})`, `RevPAR (${sinal(revparV)})`) }, { valor: sinal(vB), rot: t('dormidas', 'overnight stays') }] });
  if (paises.length) dias.push({ tipo: 'contraste', kicker: t('Dois visitantes diferentes', 'Two different visitors'), titulo: t('Quem mais dorme não é quem mais gasta com cartão', 'Those who stay most are not those who spend most by card'), a: { rot: t('Mais dormidas de estrangeiros', 'Most foreign stays'), valor: String(mercados[0][0]), sub: t(`${d1((mercados[0][2] / est) * 100)}% das dormidas de estrangeiros`, `${d1((mercados[0][2] / est) * 100)}% of foreign stays`) }, b: { rot: t('Mais gasto com cartão estrangeiro', 'Most foreign card spending'), valor: paises[0].pais, sub: t(`${d1(paises[0].valor / 1e6, 1)} M€ · o peso da diáspora, que fica em casa de família`, `${d1(paises[0].valor / 1e6, 1)} M€ · the diaspora, who stay with family`) }, nota: t('INE/TravelBI e SIBS Analytics', 'INE/TravelBI and SIBS Analytics') });
  dias.push({ tipo: 'barras', kicker: t(`Emprego · ${EMPREGO.ano}`, `Employment · ${EMPREGO.ano}`), titulo: t(`Pelo menos ${n0(R['Braga'].turismo)} pessoas trabalham no alojamento e restauração${SB ? ` (${sinal(((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100)} desde ${SB.anos[0]})` : ''}`, `At least ${n0(R['Braga'].turismo)} people work in accommodation and food${SB ? ` (${sinal(((SB.turismo[SB.turismo.length - 1] / SB.turismo[0]) - 1) * 100)} since ${SB.anos[0]})` : ''}`), barras: ['Braga', 'Cávado', 'Norte', 'Portugal'].map((r) => ({ nome: r === 'Norte' ? t('Norte', 'North') : r, valor: peso(r), texto: `${d1(peso(r))}%`, destaque: r === 'Braga' })), nota: GT ? t(`Peso no emprego das empresas · ganho médio em Braga: ${n0(GT.territorios['Braga'].total[GT.anos.length - 1])} € (todas as atividades)`, `Share of company employment · average earnings in Braga: ${n0(GT.territorios['Braga'].total[GT.anos.length - 1])} € (all activities)`) : undefined });

  // 4. O que oferecemos
  dias.push({ tipo: 'capitulo', n: 4, titulo: t('O que oferecemos', 'What we offer'), sub: t('Alojamento, comércio e experiências', 'Accommodation, retail and experiences') });
  dias.push({ tipo: 'contraste', kicker: t('Alojamento', 'Accommodation'), titulo: t('Duas ofertas que se complementam', 'Two offers that complement each other'), a: { rot: t('Hotelaria', 'Hotels'), valor: n0(capH), sub: t(`lugares em ${todosH.length} estabelecimentos`, `places in ${todosH.length} establishments`) }, b: { rot: t('Alojamento Local ativo', 'Active short-term rentals'), valor: n0(A.camas), sub: t(`camas em ${n0(A.total)} alojamentos · ${Math.round((alCentro / A.total) * 100)}% no centro`, `beds in ${n0(A.total)} rentals · ${Math.round((alCentro / A.total) * 100)}% in the centre`) }, nota: t('Hotelaria: visitbraga.travel · Alojamento Local: base municipal da taxa turística', 'Hotels: visitbraga.travel · Short-term rentals: municipal tourist tax database') });
  dias.push({ tipo: 'trio', kicker: t('Identidade e experiências', 'Identity and experiences'), titulo: t('Um destino com comércio histórico e empresas de experiências', 'A destination with historic shops and experience companies'), itens: [{ valor: String(LOJAS_HISTORIA_META.total), rot: t('Lojas com História', 'Historic Shops') }, { valor: String(LOJAS_HISTORIA_META.centenarias), rot: t('com mais de cem anos', 'over a century old') }, { valor: String(RNAAT.length), rot: t('empresas de animação turística', 'tourism activity companies') }] });

  // 5. Para onde vamos
  dias.push({ tipo: 'capitulo', n: 5, titulo: t('Um destino sustentável', 'A sustainable destination'), sub: t('Certificação, residentes e próximos passos', 'Certification, residents and next steps') });
  dias.push({ tipo: 'trio', kicker: t('Sustentabilidade', 'Sustainability'), titulo: t(`Certificação ${SU.certificacao} da Green Destinations`, `Green Destinations ${SU.certificacao} certification`), itens: [{ valor: SU.certificacao, rot: t('certificação do destino', 'destination certification') }, { valor: `${d1(SU.percecao.positiva)}%`, rot: t('dos residentes veem o turismo de forma positiva', 'of residents view tourism positively') }, { valor: String(SETOR_SUSTENTAVEL.certificados.length), rot: t('negócios com certificação ambiental', 'businesses with environmental certification') }], nota: t('Próximo passo: levar a certificação às empresas (nenhuma tem ainda o Good Travel Seal).', 'Next step: bring certification to businesses (none holds the Good Travel Seal yet).') });
  dias.push({ tipo: 'fecho', titulo: t('Obrigado', 'Thank you'), sub: t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division') });
  return dias;
}

function Grafico({ meses }: { meses: { m: string; ant: number | null; real: number | null; est: number | null }[] }) {
  const W = 1000, H = 300, L = 10, Rr = 10, T = 10, B = 34;
  const max = Math.max(...meses.flatMap((x) => [x.ant || 0, x.real || 0, x.est || 0])) * 1.08;
  const bw = (W - L - Rr) / meses.length;
  const Y = (v: number) => T + (1 - v / max) * (H - T - B);
  const linha = meses.map((x, i) => (x.ant != null ? `${L + bw * i + bw / 2},${Y(x.ant)}` : '')).filter(Boolean).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxHeight: '46vh' }}>
      {meses.map((x, i) => {
        const v = x.real ?? x.est; if (v == null) return null;
        const h = H - B - Y(v);
        return <rect key={i} className="apr-col" x={L + bw * i + bw * 0.18} y={Y(v)} width={bw * 0.64} height={h} rx={5} fill={x.real != null ? '#8AB0E6' : '#EDA06B'} fillOpacity={x.real != null ? 1 : 0.75} style={{ animationDelay: `${i * 60}ms` }} />;
      })}
      <polyline points={linha} fill="none" stroke="#A3A8B1" strokeWidth={2.5} strokeDasharray="5 6" />
      {meses.map((x, i) => <text key={'t' + i} x={L + bw * i + bw / 2} y={H - 10} textAnchor="middle" fontSize="18" fill="#A3A8B1">{x.m}</text>)}
    </svg>
  );
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
    window.addEventListener('keydown', tecla);
    const antes = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = antes; if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias.length]);
  const d = dias[i];
  const capitulo = (() => { for (let k = i; k >= 0; k--) { const x = dias[k]; if (x.tipo === 'capitulo') return x; } return null; })();
  const comFoto = d.tipo === 'capa' || d.tipo === 'fecho' || d.tipo === 'capitulo';
  const maxBarra = d.tipo === 'barras' ? Math.max(...d.barras.map((b) => Math.abs(b.valor)), 0.001) : 1;
  return (
    <div className="apr" role="dialog" aria-modal="true" aria-label={t('Modo apresentação', 'Presentation mode')}
      onTouchStart={(e) => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (toque.current == null) return; const dx = e.changedTouches[0].clientX - toque.current; if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1); toque.current = null; }}>
      <style>{CSS_APR}</style>
      {comFoto && <div className="apr-foto" style={{ backgroundImage: 'url(/visao-geral.jpg)', opacity: d.tipo === 'capitulo' ? 0.35 : 1 }} />}
      <div className="apr-sombra" style={{ background: comFoto ? 'linear-gradient(0deg, #15171B 6%, rgba(21,23,27,.6) 60%, rgba(21,23,27,.4))' : 'radial-gradient(900px 500px at 12% 8%, rgba(138,176,230,.13), transparent), #15171B' }} />
      <div className="apr-progresso">{dias.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}</div>
      {capitulo && d.tipo !== 'capitulo' && d.tipo !== 'fecho' && <div className="apr-cap">{capitulo.n} · {capitulo.titulo}</div>}
      <button className="apr-fechar" onClick={onClose} aria-label={t('Sair da apresentação', 'Exit presentation')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      <div className="apr-zona" onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); ir(e.clientX - r.left > r.width / 3 ? 1 : -1); }}>
        <div key={i} className={`apr-conteudo${d.tipo === 'capa' || d.tipo === 'fecho' ? ' centro' : ''}`}>
          {(d.tipo === 'capa' || d.tipo === 'fecho') && (<>
            <img className="apr-logo" src="/visit-braga-logo.png" alt="Visit Braga" />
            <div className="apr-grande">{d.titulo}</div>
            <div className="apr-sub">{d.sub}</div>
            {d.tipo === 'capa' && <div className="apr-data">{new Date().toLocaleDateString(t('pt-PT', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          </>)}
          {d.tipo === 'capitulo' && (<>
            <div className="apr-capn">{String(d.n).padStart(2, '0')}</div>
            <div className="apr-grande">{d.titulo}</div>
            <div className="apr-sub">{d.sub}</div>
          </>)}
          {'kicker' in d && <div className="apr-kicker">{d.kicker}</div>}
          {d.tipo === 'numero' && (<>
            <div className="apr-valor">{d.valor}{d.unidade && <small>{d.unidade}</small>}</div>
            <div className="apr-titulo">{d.titulo}</div>
          </>)}
          {d.tipo === 'barras' && (<>
            <div className="apr-titulo forte">{d.titulo}</div>
            <div className="apr-barras">
              {d.barras.map((b, k) => (
                <div key={b.nome} className="apr-barra">
                  <span className="nome">{b.nome}</span>
                  <div className="pista"><div className="enche" style={{ width: `${(Math.abs(b.valor) / maxBarra) * 100}%`, background: b.destaque ? '#8AB0E6' : '#4A5160', animationDelay: `${k * 120}ms` }} /></div>
                  <span className="val" style={{ color: b.destaque ? '#ECEDEF' : '#A3A8B1' }}>{b.texto}</span>
                </div>
              ))}
            </div>
          </>)}
          {d.tipo === 'ano' && (<>
            <div className="apr-titulo forte">{d.titulo}</div>
            <div style={{ marginTop: 26 }}><Grafico meses={d.meses} /></div>
          </>)}
          {d.tipo === 'duas-listas' && (<>
            <div className="apr-titulo forte">{d.titulo}</div>
            <div className="apr-duas">
              {[d.a, d.b].map((c) => (
                <div key={c.titulo} className="apr-lista">
                  <div className="cab" style={{ color: c.cor }}>{c.titulo}</div>
                  {c.itens.length ? c.itens.map(([nome, sub], k) => <div key={nome} className="item" style={{ animationDelay: `${k * 100}ms` }}><span style={{ color: c.cor }}>{k + 1}</span><strong>{nome}</strong><em>{sub}</em></div>) : <div className="item"><strong>-</strong></div>}
                </div>
              ))}
            </div>
          </>)}
          {d.tipo === 'contraste' && (<>
            <div className="apr-titulo forte">{d.titulo}</div>
            <div className="apr-duas contraste">
              {[d.a, d.b].map((c, k) => (
                <div key={k} className="apr-lado" style={{ borderColor: k === 0 ? '#8AB0E6' : '#EDA06B' }}>
                  <div className="rot">{c.rot}</div>
                  <div className="v" style={{ color: k === 0 ? '#8AB0E6' : '#EDA06B' }}>{c.valor}</div>
                  <div className="s">{c.sub}</div>
                </div>
              ))}
            </div>
          </>)}
          {d.tipo === 'trio' && (<>
            <div className="apr-titulo forte">{d.titulo}</div>
            <div className="apr-trio">
              {d.itens.map((x, k) => <div key={k} style={{ animationDelay: `${k * 120}ms` }}><strong>{x.valor}</strong><span>{x.rot}</span></div>)}
            </div>
          </>)}
          {'nota' in d && d.nota && <div className="apr-nota">{d.nota}</div>}
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
.apr-foto { position: absolute; inset: -30px; background-size: cover; background-position: center; animation: aprKb 20s ease-in-out infinite alternate; transition: opacity .5s ease; }
@keyframes aprKb { from { transform: scale(1.03); } to { transform: scale(1.12); } }
.apr-sombra { position: absolute; inset: 0; }
.apr-progresso { position: absolute; top: 18px; left: 28px; right: 80px; display: flex; gap: 5px; z-index: 2; }
.apr-progresso span { flex: 1; height: 3px; border-radius: 999px; background: rgba(255,255,255,.14); transition: background .3s ease; }
.apr-progresso span.on { background: #8AB0E6; }
.apr-cap { position: absolute; top: 34px; left: 28px; z-index: 2; font-size: 12.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #6F747D; }
.apr-fechar { position: absolute; top: 8px; right: 18px; z-index: 3; width: 44px; height: 44px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(21,23,27,.5); color: #ECEDEF; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.apr-zona { position: absolute; inset: 64px 0 76px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.apr-conteudo { position: relative; width: min(1180px, 88vw); animation: aprEntra .6s cubic-bezier(.2,.7,.2,1) both; }
.apr-conteudo.centro { text-align: center; }
@keyframes aprEntra { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
.apr-logo { width: clamp(220px, 30vw, 420px); height: auto; display: block; margin: 0 auto 34px; filter: drop-shadow(0 4px 18px rgba(0,0,0,.3)); }
.apr-grande { font-size: clamp(40px, 6vw, 84px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
.apr-sub { font-size: clamp(16px, 1.7vw, 22px); color: #A3A8B1; margin-top: 16px; line-height: 1.5; }
.apr-data { font-size: 15px; color: #A3A8B1; margin-top: 22px; }
.apr-capn { font-size: clamp(60px, 9vw, 130px); font-weight: 700; color: #8AB0E6; line-height: 1; letter-spacing: -0.04em; margin-bottom: 10px; opacity: .9; }
.apr-kicker { font-size: clamp(13px, 1.2vw, 16px); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #8AB0E6; margin-bottom: 14px; }
.apr-valor { font-size: clamp(80px, 13vw, 180px); font-weight: 700; line-height: .95; letter-spacing: -0.04em; }
.apr-valor small { font-size: .3em; color: #A3A8B1; margin-left: 10px; letter-spacing: 0; }
.apr-titulo { font-size: clamp(22px, 2.5vw, 34px); font-weight: 600; margin-top: 16px; line-height: 1.25; max-width: 980px; }
.apr-titulo.forte { font-size: clamp(26px, 3vw, 44px); font-weight: 700; letter-spacing: -0.02em; margin-top: 0; }
.apr-nota { font-size: 14px; color: #6F747D; margin-top: 26px; }
.apr-barras { margin-top: 34px; display: grid; gap: 18px; }
.apr-barra { display: grid; grid-template-columns: minmax(110px, 220px) minmax(0,1fr) 110px; gap: 18px; align-items: center; font-size: clamp(16px, 1.6vw, 22px); }
.apr-barra .pista { height: clamp(18px, 2.4vh, 28px); background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
.apr-barra .enche { height: 100%; border-radius: 999px; transform-origin: left center; animation: aprCresce 1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes aprCresce { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.apr-barra .val { font-weight: 700; text-align: right; }
.apr-col { transform-box: fill-box; transform-origin: bottom; animation: aprSobe .8s cubic-bezier(.2,.7,.2,1) both; }
@keyframes aprSobe { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.apr-duas { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 30px; }
.apr-lista { background: rgba(28,31,36,.8); border: 1px solid #2D3139; border-radius: 14px; padding: 22px 26px; }
.apr-lista .cab { font-size: 14px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 10px; }
.apr-lista .item { display: grid; grid-template-columns: 30px minmax(0,1fr) auto; gap: 12px; align-items: baseline; padding: 12px 0; border-top: 1px solid #2D3139; font-size: clamp(17px, 1.7vw, 23px); animation: aprEntra .5s ease both; }
.apr-lista .item:first-of-type { border-top: 0; }
.apr-lista .item span { font-weight: 700; }
.apr-lista .item em { font-style: normal; color: #A3A8B1; font-size: .8em; }
.apr-lado { background: rgba(28,31,36,.8); border: 1px solid #2D3139; border-top: 4px solid; border-radius: 14px; padding: 26px 28px; }
.apr-lado .rot { font-size: 15px; color: #A3A8B1; }
.apr-lado .v { font-size: clamp(40px, 5.6vw, 76px); font-weight: 700; letter-spacing: -0.03em; margin: 8px 0; }
.apr-lado .s { font-size: clamp(15px, 1.4vw, 19px); color: #A3A8B1; line-height: 1.45; }
.apr-trio { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; margin-top: 34px; }
.apr-trio > div { background: rgba(28,31,36,.8); border: 1px solid #2D3139; border-radius: 14px; padding: 26px 26px; animation: aprEntra .6s cubic-bezier(.2,.7,.2,1) both; }
.apr-trio strong { display: block; font-size: clamp(40px, 5vw, 70px); letter-spacing: -0.03em; }
.apr-trio span { display: block; font-size: clamp(15px, 1.4vw, 19px); color: #A3A8B1; margin-top: 8px; line-height: 1.4; }
.apr-rodape { position: absolute; left: 28px; right: 22px; bottom: 18px; display: flex; justify-content: space-between; align-items: center; z-index: 2; font-size: 13px; color: #A3A8B1; }
.apr-rodape button { width: 46px; height: 46px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(21,23,27,.55); color: #ECEDEF; margin-left: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.apr-rodape button:disabled { opacity: .35; cursor: default; }
@media (max-width: 760px) { .apr-duas, .apr-trio { grid-template-columns: 1fr; gap: 12px; } .apr-barra { grid-template-columns: 90px minmax(0,1fr) 70px; gap: 10px; } .apr-zona { inset: 70px 0 72px; overflow-y: auto; align-items: flex-start; padding-top: 10px; } }
@media (prefers-reduced-motion: reduce) { .apr-foto, .apr-conteudo, .apr-col, .apr-barra .enche, .apr-trio > div, .apr-lista .item { animation: none !important; } }
`;
