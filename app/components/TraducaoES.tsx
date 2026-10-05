'use client';

import { useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { t } from '@/app/lib/i18n';

// Gerador da tradução espanhola (só administração): envia ao Groq, em lotes, os textos do catálogo ainda sem tradução,
// valida os marcadores de valores ({0}, {1}…) e grava no Firestore depois de cada lote (pode ser interrompido e retomado).
const LOTE = 40;
const SISTEMA = 'És um tradutor profissional de português de Portugal para espanhol de Espanha, para uma plataforma pública de dados de turismo do Município de Braga. Regras: 1) Traduz cada texto com tom institucional, claro e natural. 2) Mantém EXATAMENTE os marcadores {0}, {1}, {2}… (são números ou nomes calculados no ecrã), sem os alterar nem acrescentar. 3) Não traduzas nomes próprios nem siglas: Braga, Bom Jesus, Sameiro, Theatro Circo, gnration, TUB, INE, TravelBI, SIBS, RNAAT, Visit Braga, Google, Groq, UNESCO, Green Destinations, etc. 4) Mantém a pontuação, os símbolos (%, €, ·, →, ★) e os espaços no início e no fim. 5) Devolve APENAS um objeto JSON {"id": "tradução", …} com exatamente os mesmos ids.';
const marcadores = (x: string) => (x.match(/\{\d+\}/g) || []).sort().join(',');
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function TraducaoES({ fechar }: { fechar: () => void }) {
  const [estado, setEstado] = useState<'pronto' | 'a-traduzir' | 'concluido' | 'erro'>('pronto');
  const [feitos, setFeitos] = useState(0);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState('');
  const parar = useRef(false);

  const iniciar = async () => {
    parar.current = false; setEstado('a-traduzir'); setMsg('');
    try {
      const { TEXTOS } = await import('@/app/lib/textos-catalogo');
      const ref = doc(db, 'config', 'traducao-es');
      const snap = await getDoc(ref);
      const entradas: Record<string, string> = { ...((snap.exists() ? (snap.data() as any).entradas : null) || {}) };
      const pt: Record<string, string> = Object.fromEntries(TEXTOS.map(([id, p]) => [id, p]));
      const faltam = TEXTOS.filter(([id]) => !entradas[id]).map(([id]) => id);
      setTotal(TEXTOS.length); setFeitos(TEXTOS.length - faltam.length);
      for (let i = 0; i < faltam.length; i += LOTE) {
        if (parar.current) { setEstado('pronto'); setMsg(t('Interrompido. O que já foi traduzido ficou guardado.', 'Stopped. Everything translated so far was saved.')); return; }
        const ids = faltam.slice(i, i + LOTE);
        const pedido = Object.fromEntries(ids.map((id) => [id, pt[id]]));
        let tentativas = 0; let resposta: Record<string, string> | null = null;
        while (!resposta && tentativas < 6) {
          tentativas++;
          const r = await fetch('/api/groq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: SISTEMA }, { role: 'user', content: JSON.stringify(pedido) }], temperature: 0.2, max_tokens: 6000, response_format: { type: 'json_object' } }) });
          if (r.status === 429) { const s = Number(r.headers.get('retry-after')) || 20; setMsg(t(`Limite do Groq: a aguardar ${s} s…`, `Groq limit: waiting ${s} s…`)); await espera((s + 1) * 1000); continue; }
          if (r.status === 401) throw new Error(t('Sessão de administração expirada. Volte a entrar.', 'Admin session expired. Sign in again.'));
          if (!r.ok) { await espera(3000); continue; }
          const j = await r.json().catch(() => null);
          const txt: string = j?.choices?.[0]?.message?.content || '';
          try { resposta = JSON.parse(txt); } catch { const m = txt.match(/\{[\s\S]*\}/); if (m) { try { resposta = JSON.parse(m[0]); } catch { resposta = null; } } }
        }
        if (!resposta) throw new Error(t('O Groq não respondeu. Tente mais tarde: o trabalho feito está guardado.', 'Groq did not respond. Try later: work done so far is saved.'));
        for (const id of ids) {
          const es = resposta[id];
          if (typeof es === 'string' && es.trim() && marcadores(es) === marcadores(pt[id])) entradas[id] = es;
        }
        await setDoc(ref, { entradas, atualizadoEm: new Date().toISOString() }, { merge: true });
        setFeitos(TEXTOS.filter(([id]) => entradas[id]).length); setMsg('');
      }
      setEstado('concluido');
      setMsg(t('Tradução concluída. O público vê a versão nova dentro de 15 minutos.', 'Translation complete. The public will see the new version within 15 minutes.'));
    } catch (e: any) {
      setEstado('erro'); setMsg(e?.message || t('Erro na tradução.', 'Translation error.'));
    }
  };
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tes-titulo" style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(8,9,11,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(520px, 100%)', background: '#1C1F24', border: '1px solid #2D3139', borderRadius: 14, padding: 24, color: '#ECEDEF', fontFamily: "'Public Sans', system-ui, sans-serif" }}>
        <h2 id="tes-titulo" style={{ margin: '0 0 8px', fontSize: 19 }}>{t('Tradução espanhola', 'Spanish translation')}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6, color: '#A3A8B1' }}>{t('Traduz para espanhol todos os textos da plataforma que ainda não têm tradução, com a IA (Groq). Pode demorar 15 a 25 minutos por causa do limite gratuito; pode fechar e retomar mais tarde sem perder nada.', 'Translates every platform text not yet translated into Spanish using AI (Groq). It may take 15–25 minutes due to the free limit; you can close and resume later without losing anything.')}</p>
        {total > 0 && (
          <div style={{ margin: '0 0 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span>{t('Textos traduzidos', 'Texts translated')}</span><strong>{feitos} / {total} · {pct}%</strong></div>
            <div style={{ height: 8, borderRadius: 999, background: '#2D3139', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: '#8AB0E6', transition: 'width .4s ease' }} /></div>
          </div>
        )}
        {msg && <div role="status" aria-live="polite" style={{ fontSize: 13.5, color: estado === 'erro' ? '#EF8A7B' : '#A3A8B1', margin: '0 0 14px' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {estado === 'a-traduzir'
            ? <button type="button" onClick={() => { parar.current = true; }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid #3A404B', background: 'transparent', color: '#ECEDEF', fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer' }}>{t('Parar', 'Stop')}</button>
            : <button type="button" onClick={iniciar} style={{ height: 40, padding: '0 18px', borderRadius: 999, border: 0, background: '#8AB0E6', color: '#0F1216', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>{estado === 'concluido' ? t('Verificar textos novos', 'Check for new texts') : t('Gerar tradução', 'Generate translation')}</button>}
          <button type="button" onClick={fechar} disabled={estado === 'a-traduzir'} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid #3A404B', background: 'transparent', color: '#A3A8B1', fontFamily: 'inherit', fontWeight: 600, cursor: estado === 'a-traduzir' ? 'default' : 'pointer', opacity: estado === 'a-traduzir' ? 0.5 : 1 }}>{t('Fechar', 'Close')}</button>
        </div>
      </div>
    </div>
  );
}
