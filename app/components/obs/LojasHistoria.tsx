'use client';

import { useAdmin } from '../modo';
import { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { t } from '@/app/lib/i18n';
import { LOJAS_HISTORIA, LOJAS_HISTORIA_META } from '@/app/lib/lojas-historia-dados';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { C, Card, KPI, SectionTitle, tipStyle, useVisivelObs } from './comum';

// Fotografia de cada Loja com História (guardada na base de dados; carregada só quando o cartão aparece)
const slugLoja = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
async function comprimirFoto(fl: File): Promise<string> {
  const url = URL.createObjectURL(fl);
  const img = new Image();
  await new Promise<void>((ok, ko) => { img.onload = () => ok(); img.onerror = () => ko(new Error('imagem')); img.src = url; });
  const e = Math.min(1, 1000 / img.width);
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * e); cv.height = Math.round(img.height * e);
  cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
  URL.revokeObjectURL(url);
  let d = cv.toDataURL('image/jpeg', 0.76);
  if (d.length > 700000) d = cv.toDataURL('image/jpeg', 0.6);
  return d;
}

function CartaoLoja({ l, ano }: { l: { nome: string; ano: number | null; morada: string; setor: string; resumo: string }; ano: number }) {
  const admin = useAdmin();
  const [ref, vis] = useVisivelObs<HTMLDivElement>();
  const [foto, setFoto] = useState<string | null | undefined>(undefined);
  const [pronta, setPronta] = useState(false);
  const [aGravar, setAGravar] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = slugLoja(l.nome);
  useEffect(() => {
    if (!vis || foto !== undefined) return;
    getDoc(doc(db, 'lojasFotos', id)).then((d) => setFoto(d.exists() ? ((d.data() as any).data || null) : null)).catch(() => setFoto(null));
  }, [vis, foto, id]);
  const carregar = async (fl: File) => {
    setAGravar(true);
    try {
      const d = await comprimirFoto(fl);
      await setDoc(doc(db, 'lojasFotos', id), { data: d, nome: l.nome, atualizadoEm: new Date().toISOString() });
      setPronta(false); setFoto(d);
    } catch { alert(t('Não foi possível carregar a fotografia.', 'Could not upload the photo.')); } finally { setAGravar(false); }
  };
  const remover = async () => {
    if (!window.confirm(t(`Remover a fotografia de "${l.nome}"?`, `Remove the photo of "${l.nome}"?`))) return;
    await deleteDoc(doc(db, 'lojasFotos', id)).catch(() => {});
    setFoto(null); setPronta(false);
  };
  const idade = l.ano ? ano - l.ano : null;
  return (
    <div ref={ref} className="obs-loja">
      <div className="obs-loja-topo">
        {foto === undefined && vis && <div className="obs-loja-carrega" />}
        {foto === null && <div className="obs-loja-vazio"><span>{l.nome.replace(/^(A|O|Casa|Restaurante|Café|Pastelaria)\s+/i, '').charAt(0)}</span></div>}
        {foto && <img className="obs-loja-img" src={foto} alt={l.nome} onLoad={() => setPronta(true)} style={{ opacity: pronta ? 1 : 0 }} />}
        <div className="obs-loja-fade" />
        {l.ano && <span className={`obs-loja-ano${idade != null && idade >= 100 ? ' cent' : ''}`}>{l.ano}</span>}
        {admin && <div className="obs-loja-acoes">
          <button onClick={() => input.current?.click()} disabled={aGravar}>{aGravar ? t('A guardar…', 'Saving…') : foto ? t('Mudar', 'Change') : t('+ Fotografia', '+ Photo')}</button>
          {foto && <button onClick={remover}>{t('Remover', 'Remove')}</button>}
        </div>}
        <div className="obs-loja-nome">{l.nome}<small>{l.setor}{idade != null ? ` · ${idade} ${t('anos', 'years')}` : ''}</small></div>
        <input ref={input} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) carregar(fl); }} />
      </div>
      <div className="obs-loja-corpo">
        <div className="obs-loja-texto">{l.resumo}</div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.nome + ', ' + l.morada)}`} target="_blank" rel="noopener noreferrer">{l.morada} ↗</a>
      </div>
    </div>
  );
}

// ═══ Lojas com História (rede municipal) - só leitura ═══
export default function LojasHistoria() {
  const [setor, setSetor] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const ano = new Date().getFullYear();
  const L = LOJAS_HISTORIA;
  const comAno = L.filter((l) => l.ano);
  const maisAntiga = [...comAno].sort((a, b) => (a.ano || 0) - (b.ano || 0))[0];
  const idades = comAno.map((l) => ano - (l.ano || ano)).sort((a, b) => a - b);
  const mediana = idades.length ? idades[Math.floor(idades.length / 2)] : 0;
  const setores = Object.entries(L.reduce((o: Record<string, number>, l) => { o[l.setor] = (o[l.setor] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]).map(([s2, n]) => ({ setor: s2, n }));
  const seculo = (a: number) => (a < 1801 ? t('séc. XVIII', '18th c.') : a < 1901 ? t('séc. XIX', '19th c.') : a < 1951 ? t('1901–1950', '1901–1950') : a < 2001 ? t('1951–2000', '1951–2000') : t('depois de 2000', 'after 2000'));
  const ordemSec = [t('séc. XVIII', '18th c.'), t('séc. XIX', '19th c.'), t('1901–1950', '1901–1950'), t('1951–2000', '1951–2000'), t('depois de 2000', 'after 2000')];
  const porSec = ordemSec.map((s2) => ({ periodo: s2, n: comAno.filter((l) => seculo(l.ano!) === s2).length })).filter((x) => x.n);
  const norm = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lista = [...L].filter((l) => (!setor || l.setor === setor) && (!q || norm(l.nome + ' ' + l.morada).includes(norm(q)))).sort((a, b) => (a.ano || 9999) - (b.ano || 9999));
  return (
    <>
      <SectionTitle sub={LOJAS_HISTORIA_META.fonte}>{t(`${LOJAS_HISTORIA_META.total} lojas reconhecidas, ${LOJAS_HISTORIA_META.centenarias} com mais de um século`, `${LOJAS_HISTORIA_META.total} recognised shops, ${LOJAS_HISTORIA_META.centenarias} over a century old`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Lojas na rede', 'Shops in the network')} value={String(LOJAS_HISTORIA_META.total)} sub={t(`${setores.length} setores de atividade`, `${setores.length} business sectors`)} color={C.accent} />
        <KPI label={t('Centenárias', 'Centenary shops')} value={String(LOJAS_HISTORIA_META.centenarias)} sub={t('segundo a rede Lojas com História', 'according to the Historic Shops network')} color={C.orange} />
        {maisAntiga && <KPI label={t('A mais antiga', 'The oldest')} value={String(maisAntiga.ano)} sub={`${maisAntiga.nome} · ${ano - (maisAntiga.ano || ano)} ${t('anos', 'years')}`} color={C.purple} />}
        <KPI label={t('Idade mediana', 'Median age')} value={`${mediana} ${t('anos', 'years')}`} sub={t('metade das lojas tem mais do que isto', 'half the shops are older than this')} color={C.positive} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Por setor de atividade', 'By business sector')}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={setores} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} allowDecimals={false} />
              <YAxis type="category" dataKey="setor" width={170} stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [v, t('Lojas', 'Shops')]} />
              <Bar dataKey="n" name={t('Lojas', 'Shops')} fill={C.orange} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Quando foram fundadas', 'When they were founded')}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={porSec} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="periodo" stroke={C.textDim} tick={{ fontSize: 10.5, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [v, t('Lojas', 'Shops')]} />
              <Bar dataKey="n" name={t('Lojas', 'Shops')} fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>{t(`Ano de fundação indicado na brochura (${comAno.length} das ${L.length} lojas).`, `Founding year stated in the brochure (${comAno.length} of ${L.length} shops).`)}</div>
        </Card>
      </div>
      <Card title={t(`As lojas · ${lista.length}`, `The shops · ${lista.length}`)} right={
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Procurar loja ou rua', 'Search shop or street')} aria-label={t('Procurar loja ou rua', 'Search shop or street')}
          style={{ height: 34, padding: '0 12px', borderRadius: 999, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 13, minWidth: 200 }} />
      }>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setSetor(null)} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${!setor ? C.accent : C.border}`, background: !setor ? C.accentBg : 'transparent', color: !setor ? C.text : C.textMuted }}>{t('Todas', 'All')}</button>
          {setores.map((s2) => (
            <button key={s2.setor} onClick={() => setSetor(setor === s2.setor ? null : s2.setor)} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${setor === s2.setor ? C.accent : C.border}`, background: setor === s2.setor ? C.accentBg : 'transparent', color: setor === s2.setor ? C.text : C.textMuted }}>{s2.setor} · {s2.n}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {lista.map((l) => <CartaoLoja key={l.nome} l={l} ano={ano} />)}
        </div>
      </Card>
    </>
  );
}

