'use client';

import { useRef, useState } from 'react';
import { t, getLang } from '@/app/lib/i18n';

// "Pergunte ao Observatório": pergunta em linguagem natural, respondida com os dados da plataforma (rota /api/perguntar).
interface Fonte { id: string; titulo: string; separador: string | null; fonte: string }
interface Resposta { resposta: string; fontes: Fonte[]; separador: string | null }

export default function Perguntar({ onIrPara, reputacao, nomeSeparador }: { onIrPara: (id: string) => void; reputacao?: string; nomeSeparador: (id: string) => string | null }) {
  const [pergunta, setPergunta] = useState('');
  const [aCarregar, setACarregar] = useState(false);
  const [resp, setResp] = useState<Resposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [feita, setFeita] = useState('');
  const campo = useRef<HTMLInputElement>(null);
  const EXEMPLOS = [
    t('Quantas dormidas houve em Braga no 1.º semestre de 2026?', 'How many overnight stays did Braga have in the first half of 2026?'),
    t('Que linha de autocarro serve o Sameiro ao domingo?', 'Which bus line serves Sameiro on Sundays?'),
    t('Quanto gastam os franceses com cartão em Braga?', 'How much do French visitors spend by card in Braga?'),
  ];
  const perguntar = async (q: string) => {
    const texto = q.trim();
    if (texto.length < 3 || aCarregar) return;
    setACarregar(true); setErro(null); setResp(null); setFeita(texto);
    try {
      const res = await fetch('/api/perguntar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pergunta: texto, lingua: getLang(), reputacao: reputacao || '' }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.erro) { setErro((data && data.erro) || t('Não foi possível obter resposta.', 'Could not get an answer.')); return; }
      setResp(data as Resposta);
    } catch {
      setErro(t('Sem ligação ao servidor. Tente de novo.', 'No connection to the server. Try again.'));
    } finally { setACarregar(false); }
  };
  const separadorFinal = resp?.separador && nomeSeparador(resp.separador) ? resp.separador : null;
  return (
    <section className="obs-perg" aria-labelledby="obs-perg-titulo">
      <div className="obs-perg-in">
        <h2 id="obs-perg-titulo" className="obs-perg-titulo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          {t('Pergunte ao Observatório', 'Ask the Observatory')}
        </h2>
        <form className="obs-perg-form" onSubmit={(e) => { e.preventDefault(); perguntar(pergunta); }}>
          <label htmlFor="obs-perg-campo" className="obs-sr">{t('Escreva a sua pergunta sobre o turismo em Braga', 'Write your question about tourism in Braga')}</label>
          <input id="obs-perg-campo" ref={campo} value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={400} autoComplete="off"
            placeholder={t('Ex.: quantos espanhóis ficaram em Braga no 1.º semestre?', 'E.g. how many Spanish guests stayed in Braga in H1?')} />
          <button type="submit" disabled={aCarregar || pergunta.trim().length < 3}>{aCarregar ? t('A procurar…', 'Searching…') : t('Perguntar', 'Ask')}</button>
        </form>
        {!resp && !aCarregar && !erro && (
          <div className="obs-perg-ex" aria-label={t('Exemplos de perguntas', 'Example questions')}>
            {EXEMPLOS.map((x) => <button key={x} type="button" onClick={() => { setPergunta(x); perguntar(x); }}>{x}</button>)}
          </div>
        )}
        <div aria-live="polite" aria-busy={aCarregar}>
          {aCarregar && <div className="obs-perg-estado"><span className="obs-carregar-pt" aria-hidden="true" />{t('A consultar os dados do Observatório…', 'Checking the Observatory data…')}</div>}
          {erro && <div className="obs-perg-erro" role="alert">{erro}</div>}
          {resp && (
            <div className="obs-perg-resp">
              <div className="obs-perg-q">{feita}</div>
              <div className="obs-perg-texto">{resp.resposta}</div>
              {resp.fontes.length > 0 && (
                <div className="obs-perg-fontes">
                  <span>{t('Fontes:', 'Sources:')}</span>
                  {resp.fontes.map((f) => <span key={f.id} className="obs-perg-fonte">{f.titulo} · {f.fonte}</span>)}
                </div>
              )}
              <div className="obs-perg-acoes">
                {separadorFinal && <button type="button" className="obs-perg-ir" onClick={() => onIrPara(separadorFinal)}>{t('Ver os dados em', 'See the data in')} «{nomeSeparador(separadorFinal)}» →</button>}
                <button type="button" className="obs-perg-nova" onClick={() => { setResp(null); setPergunta(''); setTimeout(() => campo.current?.focus(), 0); }}>{t('Nova pergunta', 'New question')}</button>
              </div>
              <div className="obs-perg-aviso">{t('Resposta gerada por IA a partir dos dados da plataforma. Confirme os números no separador indicado antes de os usar em documentos oficiais.', 'AI-generated answer based on the platform data. Check the figures in the indicated tab before using them in official documents.')}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
