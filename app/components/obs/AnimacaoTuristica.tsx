'use client';

import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { t } from '@/app/lib/i18n';
import { RNAAT, RNAAT_FONTE } from '@/app/lib/rnaat-dados';
import { PERFIL_TURISTA } from '@/app/lib/perfil-turista-dados';
import { SETOR_SUSTENTAVEL } from '@/app/lib/setor-sustentavel-dados';
import { C, Card, KPI, SectionTitle, tipStyle } from './comum';

// ═══ Animação turística (RNAAT) — só leitura ═══
export default function AnimacaoTuristica() {
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const E = RNAAT;
  const CATS: [string, string, string][] = [['cultural', t('Cultura e património', 'Culture and heritage'), C.accent], ['natureza', t('Ar livre e aventura', 'Outdoor and adventure'), C.positive], ['maritimo', t('Marítimo-turísticas', 'Water-based'), C.cyan], ['reconhecidas', t('Turismo de natureza reconhecido', 'Recognised nature tourism'), C.orange]];
  const n = (k: string) => E.filter((e: any) => e.atividades[k].length).length;
  const anos = Array.from(new Set(E.map((e) => e.ano).filter(Boolean) as number[])).sort().map((a) => ({ ano: String(a), n: E.filter((e) => e.ano === a).length }));
  const recentes = E.filter((e) => (e.ano || 0) >= 2018).length;
  const cont: Record<string, number> = {};
  E.forEach((e: any) => Object.values(e.atividades).flat().forEach((x: any) => { cont[x] = (cont[x] || 0) + 1; }));
  const top = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([a, v]) => ({ atividade: a.length > 46 ? a.slice(0, 44) + '…' : a, v }));
  const norm = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const lista = E.filter((e: any) => (!cat || e.atividades[cat].length) && (!q || norm(`${e.nome} ${e.marca} ${Object.values(e.atividades).flat().join(' ')}`).includes(norm(q)))).sort((a, b) => (b.ano || 0) - (a.ano || 0));
  return (
    <>
      <SectionTitle sub={RNAAT_FONTE}>{t(`${E.length} empresas de animação turística; ${Math.round((recentes / E.length) * 100)}% registaram-se desde 2018`, `${E.length} tourism activity companies; ${Math.round((recentes / E.length) * 100)}% registered since 2018`)}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
        <KPI label={t('Empresas registadas', 'Registered companies')} value={String(E.length)} sub={t(`${recentes} desde 2018`, `${recentes} since 2018`)} color={C.text} />
        {CATS.map(([k, nome, cor]) => <KPI key={k} label={nome} value={String(n(k))} sub={t(`${Math.round((n(k) / E.length) * 100)}% das empresas`, `${Math.round((n(k) / E.length) * 100)}% of companies`)} color={cor} />)}
      </div>
      <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, margin: '0 0 16px', padding: '12px 16px', background: C.accentBg, borderRadius: 6 }}>
        {t(`Cruzamento com o perfil do turista: só ${PERFIL_TURISTA.reservas[3][1]}% dos visitantes reservaram atividades antes de chegar. Há oferta; falta ligá-la ao visitante, por exemplo no Posto de Turismo, no site e nos assistentes de IA que ${PERFIL_TURISTA.fontes[3][1]}% já usam para planear.`, `Cross-check with the visitor profile: only ${PERFIL_TURISTA.reservas[3][1]}% of visitors booked activities in advance. The offer exists; it needs connecting to visitors, e.g. at the Tourist Office, online and in the AI assistants ${PERFIL_TURISTA.fontes[3][1]}% already use to plan.`)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title={t('Registos por ano (empresas ativas)', 'Registrations per year (active companies)')}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={anos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="ano" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [v, t('Empresas', 'Companies')]} />
              <Bar dataKey="n" name={t('Empresas', 'Companies')} fill={C.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title={t('Atividades mais oferecidas (n.º de empresas)', 'Most offered activities (no. of companies)')}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} allowDecimals={false} />
              <YAxis type="category" dataKey="atividade" width={220} stroke={C.textDim} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: C.text }} itemStyle={{ color: C.text }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} formatter={(v: any) => [v, t('Empresas', 'Companies')]} />
              <Bar dataKey="v" name={t('Empresas', 'Companies')} fill={C.positive} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title={t(`As empresas · ${lista.length} · mais recentes primeiro`, `The companies · ${lista.length} · newest first`)} right={
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Procurar empresa ou atividade', 'Search company or activity')} aria-label={t('Procurar empresa ou atividade', 'Search company or activity')}
          style={{ height: 34, padding: '0 12px', borderRadius: 999, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: 'inherit', fontSize: 13, minWidth: 220 }} />
      }>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {[['', t('Todas', 'All'), C.accent] as [string, string, string], ...CATS].map(([k, nome, cor]) => (
            <button key={k || 'todas'} onClick={() => setCat(k || null)} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${(cat || '') === k ? cor : C.border}`, background: (cat || '') === k ? C.accentBg : 'transparent', color: (cat || '') === k ? C.text : C.textMuted }}>{nome}</button>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {lista.map((e: any) => {
            const todas = Object.values(e.atividades).flat() as string[];
            return (
              <div key={e.registo + e.nome} className="obs-rnaat-linha">
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{e.marca || e.nome}{(() => { const sl = (SETOR_SUSTENTAVEL.certificados as any[]).find((c) => c.nome === e.nome)?.selo; return sl ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: C.positive, border: `1px solid ${C.positive}66`, background: C.positiveBg }}>{sl}</span> : null; })()}</div>
                  {e.marca && <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{e.nome}</div>}
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>{t('Registo', 'Registration')} {e.registo.trim()}{e.ano ? ` · ${t('desde', 'since')} ${e.ano}` : ''}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                    {CATS.filter(([k]) => e.atividades[k].length).map(([k, nome, cor]) => <span key={k} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: cor, border: `1px solid ${cor}55` }}>{nome}</span>)}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{todas.join(' · ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

