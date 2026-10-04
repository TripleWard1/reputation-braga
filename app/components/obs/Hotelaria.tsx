'use client';

import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { t } from '@/app/lib/i18n';
import { AL_BRAGA } from '@/app/lib/alojamento-aeroporto-dados';
import { HOTELARIA } from '@/app/lib/hotelaria-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { C, Card, KPI, SectionTitle, fmt, tipStyle } from './comum';

// ═══ Hotelaria (oferta do visitbraga.travel) - só leitura ═══
export default function Hotelaria() {
  const Hh = HOTELARIA;
  const todos: any[] = [...Hh.hoteis.map((x: any) => ({ ...x, tipo: t('Hotel', 'Hotel') })), ...Hh.outros.map((x: any) => ({ ...x, tipo: t('Aparthotel / rural', 'Aparthotel / rural') }))];
  const cap = todos.reduce((a, x) => a + x.capacidade, 0), uni = todos.reduce((a, x) => a + x.unidades, 0), ad = todos.reduce((a, x) => a + x.adaptadas, 0);
  const semAd = todos.filter((x) => x.adaptadas === 0);
  const alCap = Number((AL_BRAGA as any)?.camas) || 0;
  const porEst = [5, 4, 3, 2].map((e) => { const xs = Hh.hoteis.filter((x: any) => x.estrelas === e); return { cat: `${e} ★`, quartos: xs.reduce((a: number, x: any) => a + x.unidades, 0), hoteis: xs.length, adaptados: xs.reduce((a: number, x: any) => a + x.adaptadas, 0) }; }).filter((x) => x.hoteis);
  const [ord, setOrd] = useState<'capacidade' | 'adaptadas'>('capacidade');
  const lista = [...todos].sort((a, b) => (ord === 'capacidade' ? b.capacidade - a.capacidade : a.adaptadas / Math.max(1, a.unidades) - b.adaptadas / Math.max(1, b.unidades)));
  const pctAd = (ad / Math.max(1, uni)) * 100;
  const seloDe = (nome: string) => (SETOR_SUSTENTAVEL.certificados as any[]).find((c) => c.nome === nome)?.selo as string | undefined;
  const cert = todos.filter((x) => seloDe(x.nome));
  const capCert = cert.reduce((a, x) => a + x.capacidade, 0);
  return (
    <>
      <SectionTitle sub={Hh.fonte}>{t(`Só ${String(pctAd.toFixed(1)).replace('.', ',')}% dos quartos de hotel estão adaptados a mobilidade reduzida`, `Only ${pctAd.toFixed(1)}% of hotel rooms are adapted for reduced mobility`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Estabelecimentos', 'Establishments')} value={String(todos.length)} sub={t(`${Hh.hoteis.length} hotéis · ${Hh.outros.length} aparthotéis e rurais`, `${Hh.hoteis.length} hotels · ${Hh.outros.length} aparthotels and rural`)} color={C.accent} />
        <KPI label={t('Capacidade', 'Capacity')} value={fmt(cap)} sub={t(`${fmt(uni)} quartos / unidades`, `${fmt(uni)} rooms / units`)} color={C.purple} />
        <KPI label={t('Quartos adaptados', 'Adapted rooms')} value={String(ad)} sub={t(`${String(pctAd.toFixed(1)).replace('.', ',')}% do total`, `${pctAd.toFixed(1)}% of the total`)} color={C.orange} />
        <KPI label={t('Sem nenhum quarto adaptado', 'No adapted room')} value={String(semAd.length)} sub={t(`de ${todos.length} estabelecimentos`, `of ${todos.length} establishments`)} color={C.negative} />
        <KPI label={t('Com certificação ambiental', 'With environmental certification')} value={`${cert.length}`} sub={t(`${Math.round((capCert / Math.max(1, cap)) * 100)}% da capacidade · Green Key`, `${Math.round((capCert / Math.max(1, cap)) * 100)}% of capacity · Green Key`)} color={C.positive} />
        {alCap > 0 && <KPI label={t('Alojamento Local ativo (comparação)', 'Active short-term rentals (comparison)')} value={fmt(alCap)} sub={t(`camas: ${alCap > cap ? 'acima' : 'abaixo'} dos ${fmt(cap)} lugares da hotelaria`, `beds: ${alCap > cap ? 'above' : 'below'} the ${fmt(cap)} hotel places`)} color={C.cyan} />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Quartos por categoria de hotel', 'Rooms by hotel category')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porEst} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="cat" stroke={C.textDim} tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any, n: any, it: any) => [`${fmt(v)} · ${it?.payload?.hoteis} ${t('hotéis', 'hotels')} · ${it?.payload?.adaptados} ${t('adaptados', 'adapted')}`, t('Quartos', 'Rooms')]} />
              <Bar dataKey="quartos" name={t('Quartos', 'Rooms')} fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Leitura', 'Reading')}>
          {[
            t(`${semAd.length} estabelecimentos não têm nenhum quarto adaptado, incluindo ${semAd.filter((x) => x.estrelas >= 4).length} de 4 ou 5 estrelas.`, `${semAd.length} establishments have no adapted room, including ${semAd.filter((x) => x.estrelas >= 4).length} with 4 or 5 stars.`),
            t(`O Meliá (5 ★) tem ${Hh.hoteis[0].unidades} quartos e ${Hh.hoteis[0].adaptadas} adaptados; o B&B Lamaçães é o hotel com mais quartos adaptados (4).`, `The Meliá (5 ★) has ${Hh.hoteis[0].unidades} rooms and ${Hh.hoteis[0].adaptadas} adapted; B&B Lamaçães has the most adapted rooms among hotels (4).`),
            alCap > 0 ? t(`O Alojamento Local ativo tem ${fmt(alCap)} camas, ${alCap > cap ? 'mais' : 'menos'} do que os ${fmt(cap)} lugares destes estabelecimentos (base municipal da taxa turística).`, `Active short-term rentals have ${fmt(alCap)} beds, ${alCap > cap ? 'more' : 'fewer'} than the ${fmt(cap)} places in these establishments (municipal tourist tax database).`) : '',
            (() => { const top5 = [...todos].sort((a, b) => b.unidades - a.unidades).slice(0, 5).reduce((a, x) => a + x.unidades, 0); const p5 = Math.round((top5 / Math.max(1, uni)) * 100); return t(`Para congressos e grupos grandes: os cinco maiores estabelecimentos concentram ${p5}% dos quartos.`, `For conferences and large groups: the five largest establishments hold ${p5}% of rooms.`); })(),
          ].filter(Boolean).map((x, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0,1fr)', gap: 6, fontSize: 13.5, color: C.textMuted, lineHeight: 1.55, padding: '6px 0', borderTop: i ? `1px solid ${C.border}` : 'none' }}><span style={{ color: C.accent, fontWeight: 700 }}>{i + 1}</span>{x}</div>)}
        </Card>
      </div>
      <Card title={t(`Todos os estabelecimentos · ${todos.length}`, `All establishments · ${todos.length}`)} right={
        <div style={{ display: 'flex', gap: 6 }}>
          {([['capacidade', t('Por capacidade', 'By capacity')], ['adaptadas', t('Menos adaptados primeiro', 'Least adapted first')]] as const).map(([k, nome]) => <button key={k} onClick={() => setOrd(k)} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${ord === k ? C.accent : C.border}`, background: ord === k ? C.accentBg : 'transparent', color: ord === k ? C.text : C.textMuted }}>{nome}</button>)}
        </div>
      }>
        <div className="obs-tab-wrap" style={{ overflowX: 'auto' }}>
          <table className="obs-tab-resp" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead><tr style={{ color: C.textMuted, textAlign: 'left' }}><th style={{ padding: '8px 6px' }}>{t('Estabelecimento', 'Establishment')}</th><th style={{ padding: '8px 6px' }}>{t('Categoria', 'Category')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Capacidade', 'Capacity')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Quartos', 'Rooms')}</th><th style={{ padding: '8px 6px', textAlign: 'right' }}>{t('Adaptados', 'Adapted')}</th><th style={{ padding: '8px 6px' }}>{t('Certificação ambiental', 'Environmental certification')}</th></tr></thead>
            <tbody>{lista.map((x) => (
              <tr key={x.nome} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: '9px 6px', color: C.text, fontWeight: 600 }}>{x.nome}<div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 400 }}>{x.tipo}</div></td>
                <td data-l={t('Categoria', 'Category')} style={{ padding: '9px 6px', color: '#F2C14E', whiteSpace: 'nowrap' }}>{x.estrelas ? '★'.repeat(x.estrelas) : <span style={{ color: C.textDim }}>-</span>}</td>
                <td data-l={t('Capacidade', 'Capacity')} style={{ padding: '9px 6px', textAlign: 'right', color: C.text }}>{fmt(x.capacidade)}</td>
                <td data-l={t('Quartos', 'Rooms')} style={{ padding: '9px 6px', textAlign: 'right', color: C.text }}>{fmt(x.unidades)}</td>
                <td data-l={t('Adaptados', 'Adapted')} style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 700, color: x.adaptadas === 0 ? C.negative : C.positive }}>{x.adaptadas}</td>
                <td data-l={t('Certificação ambiental', 'Environmental certification')} style={{ padding: '9px 6px' }}>{seloDe(x.nome) ? <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: C.positive, border: `1px solid ${C.positive}66`, background: C.positiveBg, whiteSpace: 'nowrap' }}>{seloDe(x.nome)}</span> : <span style={{ color: C.textDim }}>-</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

