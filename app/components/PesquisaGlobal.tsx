'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t, getLang } from '@/app/lib/i18n';
import { construirIndice, procurar, ICONES, nomeSeparador as nomeSep, type Destino, type Entrada } from '@/app/lib/pesquisa-indice';

// Pesquisa global da plataforma (Ctrl+K ou "/"): resultados instantâneos de todas as páginas enquanto se escreve,
// resposta da IA com os dados da plataforma (Enter) e pesquisa por voz (Whisper, com pré-visualização ao vivo).
// Abre-se de qualquer sítio com: window.dispatchEvent(new CustomEvent('rb-pesquisa', { detail: { voz: true } }))

interface Fonte { id: string; titulo: string; separador: string | null; fonte: string }
interface Resposta { resposta: string; fontes: Fonte[]; separador: string | null }
type EstadoVoz = 'parado' | 'a-ouvir' | 'a-transcrever';

export function abrirPesquisa(opcoes?: { voz?: boolean; q?: string }) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('rb-pesquisa', { detail: opcoes || {} }));
}

const NOMES_VISTA: Record<string, [string, string]> = { produtos: ['Produtos turísticos', 'Tourism products'], mundo: ['Internacionalização', 'Internationalisation'], insto: ['Rede INSTO', 'INSTO network'] };

export default function PesquisaGlobal(props: {
  locais: { id: string; name: string; category?: string }[];
  reputacao?: string;
  nomeSeparador?: (id: string) => string | null;
  irVista: (v: string) => void;
  irSeparador: (s: string) => void;
  irLocal: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [q, setQ] = useState('');
  const [ativo, setAtivo] = useState(-1);
  const [aPerguntar, setAPerguntar] = useState(false);
  const [resp, setResp] = useState<Resposta | null>(null);
  const [feita, setFeita] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [voz, setVoz] = useState<EstadoVoz>('parado');
  const [aoVivo, setAoVivo] = useState('');
  const [niveis, setNiveis] = useState<number[]>(() => Array(28).fill(0));
  const [montado, setMontado] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const gravacao = useRef<{ parar: (enviar: boolean) => void } | null>(null);
  const pedido = useRef(0);
  const vozRef = useRef<() => void>(() => {});

  const indice = useMemo(() => (aberto ? construirIndice(props.locais) : []), [aberto, props.locais]);
  const resultados = useMemo(() => procurar(indice, q), [indice, q]);

  useEffect(() => { setMontado(true); }, []);
  // Abrir: Ctrl/Cmd+K, "/" fora de campos de texto, ou o evento rb-pesquisa
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const aEscrever = !!alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setAberto((a) => !a); }
      else if (e.key === '/' && !aEscrever) { e.preventDefault(); setAberto(true); }
    };
    const evento = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { voz?: boolean; q?: string };
      setAberto(true);
      if (d.q) setQ(d.q);
      if (d.voz) setTimeout(() => vozRef.current(), 120);
    };
    window.addEventListener('keydown', tecla);
    window.addEventListener('rb-pesquisa', evento);
    return () => { window.removeEventListener('keydown', tecla); window.removeEventListener('rb-pesquisa', evento); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!aberto) { gravacao.current?.parar(false); return; }
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => campo.current?.focus(), 30);
    return () => { document.body.style.overflow = antes; };
  }, [aberto]);
  useEffect(() => { setAtivo(-1); }, [q]);

  const fechar = () => { gravacao.current?.parar(false); setAberto(false); pedido.current++; setQ(''); setResp(null); setErro(null); setAPerguntar(false); setVoz('parado'); };
  const limpar = () => { setQ(''); setResp(null); setErro(null); setFeita(''); setTimeout(() => campo.current?.focus(), 0); };

  const ir = (d: Destino) => {
    fechar();
    if (d.tipo === 'vista') {
      props.irVista(d.vista);
      if (d.ancora) setTimeout(() => document.getElementById(d.ancora!)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 650);
    } else if (d.tipo === 'separador') props.irSeparador(d.separador);
    else props.irLocal(d.id);
  };
  const irSeparadorResposta = (s: string) => (s.startsWith('vista:') ? ir({ tipo: 'vista', vista: s.slice(6) }) : ir({ tipo: 'separador', separador: s }));
  const nomeDestino = (s: string) => {
    if (s.startsWith('vista:')) { const n = NOMES_VISTA[s.slice(6)]; return n ? t(n[0], n[1]) : null; }
    return (props.nomeSeparador && props.nomeSeparador(s)) || nomeSep(s);
  };

  const perguntar = async (texto: string) => {
    const pergunta = texto.trim();
    if (pergunta.length < 3) return;
    const meu = ++pedido.current;
    setAPerguntar(true); setErro(null); setResp(null); setFeita(pergunta);
    try {
      const res = await fetch('/api/perguntar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pergunta, lingua: getLang(), reputacao: props.reputacao || '' }) });
      const data = await res.json().catch(() => null);
      if (meu !== pedido.current) return;
      if (!res.ok || !data || data.erro) { setErro((data && data.erro) || t('Não foi possível obter resposta.', 'Could not get an answer.')); return; }
      setResp(data as Resposta);
    } catch {
      if (meu === pedido.current) setErro(t('Sem ligação ao servidor. Tente de novo.', 'No connection to the server. Try again.'));
    } finally { if (meu === pedido.current) setAPerguntar(false); }
  };

  // ── Voz: grava com o microfone, mostra a onda e o texto ao vivo, e transcreve com o Whisper no servidor ──
  const iniciarVoz = async () => {
    if (gravacao.current) { gravacao.current.parar(true); return; }
    setErro(null); setResp(null); setAoVivo('');
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!md || !md.getUserMedia || typeof (window as any).MediaRecorder === 'undefined') {
      setErro(t('Este navegador não permite gravar voz. Experimente o Chrome, o Edge ou o Safari.', 'This browser cannot record voice. Try Chrome, Edge or Safari.'));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    } catch {
      setErro(t('Sem acesso ao microfone. Autorize o microfone nas definições do navegador para este site.', 'No microphone access. Allow the microphone for this site in your browser settings.'));
      return;
    }
    const MR = (window as any).MediaRecorder;
    const tipo = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find((x) => MR.isTypeSupported && MR.isTypeSupported(x));
    const rec: MediaRecorder = new MR(stream, tipo ? { mimeType: tipo, audioBitsPerSecond: 64000 } : undefined);
    const partes: Blob[] = [];
    rec.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size) partes.push(e.data); };

    // Nível do som (onda) e deteção de silêncio
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext | null = Ctx ? new Ctx() : null;
    const an = ctx ? ctx.createAnalyser() : null;
    if (ctx && an) { an.fftSize = 512; ctx.createMediaStreamSource(stream).connect(an); }
    const buf = an ? new Uint8Array(an.fftSize) : null;
    let raf = 0; let falou = 0; let silencio = 0; const t0 = performance.now(); let ultimo = t0;

    // Pré-visualização ao vivo (só em computador: no telemóvel dois acessos ao microfone podem colidir)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const toque = typeof navigator !== 'undefined' && (navigator.maxTouchPoints || 0) > 0;
    let rs: any = null; let vivoFinal = '';
    if (SR && !toque) {
      try {
        rs = new SR(); rs.lang = getLang() === 'en' ? 'en-GB' : getLang() === 'es' ? 'es-ES' : 'pt-PT'; rs.interimResults = true; rs.continuous = true;
        rs.onresult = (e: any) => { let fin = '', tmp = ''; for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else tmp += r[0].transcript; } vivoFinal = fin; setAoVivo((fin + ' ' + tmp).trim()); };
        rs.onerror = () => {}; rs.start();
      } catch { rs = null; }
    }

    let terminado = false;
    const parar = (enviar: boolean) => {
      if (terminado) return; terminado = true;
      cancelAnimationFrame(raf);
      try { rs && rs.stop(); } catch { /* segue */ }
      gravacao.current = null;
      rec.onstop = async () => {
        stream.getTracks().forEach((x) => x.stop());
        try { ctx && ctx.close(); } catch { /* segue */ }
        setNiveis(Array(28).fill(0));
        if (!enviar) { setVoz('parado'); return; }
        if (!falou) { setVoz('parado'); setErro(t('Não ouvi nada. Toque no microfone e fale perto do dispositivo.', 'I did not hear anything. Tap the microphone and speak close to the device.')); return; }
        setVoz('a-transcrever');
        const blob = new Blob(partes, { type: rec.mimeType || tipo || 'audio/webm' });
        let texto = '';
        try {
          const fd = new FormData(); fd.append('audio', blob, 'voz'); fd.append('lingua', getLang());
          const r = await fetch('/api/transcrever', { method: 'POST', body: fd });
          const d = await r.json().catch(() => null);
          if (r.ok && d && typeof d.texto === 'string') texto = d.texto.trim();
          else if (!vivoFinal) setErro((d && d.erro) || t('Não foi possível transcrever.', 'Could not transcribe.'));
        } catch { /* usa a pré-visualização */ }
        if (!texto) texto = vivoFinal.trim();
        setVoz('parado'); setAoVivo('');
        if (texto) { setQ(texto); perguntar(texto); }
      };
      try { rec.state !== 'inactive' ? rec.stop() : rec.onstop && (rec.onstop as any)(); } catch { setVoz('parado'); }
    };
    gravacao.current = { parar };
    const passo = () => {
      const agora = performance.now(); const dt = agora - ultimo; ultimo = agora;
      if (an && buf) {
        an.getByteTimeDomainData(buf);
        let soma = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; soma += v * v; }
        const rms = Math.sqrt(soma / buf.length);
        setNiveis((n) => [...n.slice(1), Math.min(1, rms * 5.5)]);
        if (rms > 0.035) { falou += dt; silencio = 0; } else if (falou > 250) silencio += dt;
        if (falou > 250 && silencio > 1500) { parar(true); return; }
      }
      if (agora - t0 > 25000) { parar(true); return; }
      if (!falou && agora - t0 > 8000) { parar(true); return; }
      raf = requestAnimationFrame(passo);
    };
    rec.start(250);
    setVoz('a-ouvir');
    raf = requestAnimationFrame(passo);
    if (!an) falou = 1; // sem medição de nível: envia o que gravou quando parar
  };

  vozRef.current = iniciarVoz;
  if (!montado || !aberto) return null;

  const grupos: { nome: string; itens: { e: Entrada; i: number }[] }[] = [];
  resultados.forEach((e, i) => { let g = grupos.find((x) => x.nome === e.grupo); if (!g) { g = { nome: e.grupo, itens: [] }; grupos.push(g); } g.itens.push({ e, i }); });
  const EXEMPLOS = [
    t('Quantas dormidas houve em Braga no 1.º semestre de 2026?', 'How many overnight stays did Braga have in the first half of 2026?'),
    t('Que prémios internacionais ganhou Braga?', 'Which international awards has Braga won?'),
    t('Em que feiras vamos estar em 2027?', 'Which trade fairs will we attend in 2027?'),
    t('Quanto baixaram as emissões de CO₂ do concelho?', 'How much have the municipality’s CO₂ emissions fallen?'),
    t('Que brochuras existem em francês?', 'Which brochures are available in French?'),
  ];
  const ATALHOS: [string, [string, string], string][] = [
    ['observatorio', ['Observatório', 'Observatory'], ICONES.grafico], ['insto', ['Rede INSTO', 'INSTO network'], ICONES.insto],
    ['produtos', ['Produtos', 'Products'], ICONES.produto], ['mundo', ['Internacional', 'International'], ICONES.premio],
    ['locais', ['Locais', 'Places'], ICONES.local], ['mercados', ['Mercados', 'Markets'], ICONES.feira],
  ];
  const destinoResp = resp?.separador && nomeDestino(resp.separador) ? resp.separador : null;
  const aOuvir = voz === 'a-ouvir';

  return createPortal(
    <div className="pg-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <style>{CSS}</style>
      <div className="pg" role="dialog" aria-modal="true" aria-label={t('Pesquisar na plataforma', 'Search the platform')}>
        <form className={`pg-barra${aOuvir ? ' ouvir' : ''}`} onSubmit={(e) => { e.preventDefault(); if (ativo >= 0 && resultados[ativo]) ir(resultados[ativo].destino); else perguntar(q); }}>
          <svg className="pg-lupa" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input ref={campo} value={aOuvir ? aoVivo : q} onChange={(e) => { setQ(e.target.value); setResp(null); setErro(null); }} readOnly={aOuvir}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((a) => Math.min(resultados.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((a) => Math.max(-1, a - 1)); }
              else if (e.key === 'Escape') { e.preventDefault(); if (aOuvir) gravacao.current?.parar(false); else if (q) limpar(); else fechar(); }
            }}
            placeholder={aOuvir ? t('A ouvir… fale à vontade', 'Listening… go ahead') : t('Pesquise ou pergunte o que quiser…', 'Search or ask anything…')}
            aria-label={t('Pesquisar ou perguntar', 'Search or ask')} autoComplete="off" spellCheck={false} maxLength={400} />
          {q && !aOuvir && <button type="button" className="pg-x" onClick={limpar} aria-label={t('Limpar', 'Clear')}>×</button>}
          <button type="button" className={`pg-mic${aOuvir ? ' on' : ''}${voz === 'a-transcrever' ? ' esp' : ''}`} onClick={iniciarVoz} disabled={voz === 'a-transcrever'}
            aria-label={aOuvir ? t('Parar e pesquisar', 'Stop and search') : t('Pesquisar por voz', 'Search by voice')} title={aOuvir ? t('Parar e pesquisar', 'Stop and search') : t('Pesquisar por voz', 'Search by voice')}>
            {voz === 'a-transcrever' ? <span className="pg-roda" aria-hidden="true" />
              : aOuvir ? <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 17v4M8 21h8" /></svg>}
          </button>
        </form>

        {(aOuvir || voz === 'a-transcrever') && (
          <div className="pg-voz" aria-live="polite">
            <div className="pg-onda" aria-hidden="true">{niveis.map((n, i) => <i key={i} style={{ transform: `scaleY(${0.08 + n * 0.92})` }} />)}</div>
            <div className="pg-voz-txt">{voz === 'a-transcrever' ? t('A transcrever com precisão…', 'Transcribing accurately…') : t('A ouvir. Pare de falar e a pesquisa começa sozinha.', 'Listening. Stop talking and the search starts by itself.')}</div>
          </div>
        )}

        <div className="pg-corpo">
          <div aria-live="polite" aria-busy={aPerguntar}>
            {aPerguntar && (
              <div className="pg-resp a-pensar"><div className="pg-resp-q">{feita}</div><div className="pg-linhas"><i /><i /><i /></div><div className="pg-resp-n">{t('A consultar os dados da plataforma…', 'Checking the platform data…')}</div></div>
            )}
            {erro && <div className="pg-erro" role="alert">{erro}</div>}
            {resp && (
              <div className="pg-resp">
                <div className="pg-resp-cab"><span className="pg-ia">IA</span><span className="pg-resp-q">{feita}</span></div>
                <div className="pg-resp-txt">{resp.resposta}</div>
                {resp.fontes.length > 0 && <div className="pg-fontes">{resp.fontes.map((f) => <span key={f.id}>{f.titulo} · {f.fonte}</span>)}</div>}
                <div className="pg-acoes">
                  {destinoResp && <button type="button" className="pg-ir" onClick={() => irSeparadorResposta(destinoResp)}>{t('Abrir', 'Open')} «{nomeDestino(destinoResp)}» →</button>}
                  <button type="button" className="pg-nova" onClick={limpar}>{t('Nova pesquisa', 'New search')}</button>
                </div>
                <div className="pg-aviso">{t('Resposta gerada por IA a partir dos dados da plataforma. Confirme os números na página indicada antes de os usar em documentos oficiais.', 'AI-generated answer based on the platform data. Check the figures on the indicated page before using them in official documents.')}</div>
              </div>
            )}
          </div>

          {q.trim().length >= 3 && !resp && !aPerguntar && !aOuvir && (
            <button type="button" className={`pg-perguntar${ativo === -1 ? ' ativo' : ''}`} onClick={() => perguntar(q)}>
              <span className="pg-ia">IA</span>
              <span>{t('Perguntar', 'Ask')} <b>«{q.trim()}»</b></span>
              <kbd>Enter</kbd>
            </button>
          )}

          {grupos.map((g) => (
            <div key={g.nome} className="pg-grupo">
              <div className="pg-grupo-t">{g.nome}</div>
              {g.itens.map(({ e, i }) => (
                <button key={e.id} type="button" className={`pg-item${ativo === i ? ' ativo' : ''}`} onMouseEnter={() => setAtivo(i)} onClick={() => ir(e.destino)}>
                  <span className="pg-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={e.icone} /></svg></span>
                  <span className="pg-item-t"><b>{e.titulo}</b>{e.sub && <small>{e.sub}</small>}</span>
                  <span className="pg-seta" aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          ))}

          {!q.trim() && !resp && !aPerguntar && !aOuvir && voz !== 'a-transcrever' && (
            <>
              <div className="pg-grupo-t">{t('Experimente perguntar', 'Try asking')}</div>
              <div className="pg-exemplos">{EXEMPLOS.map((x) => <button key={x} type="button" onClick={() => { setQ(x); perguntar(x); }}>{x}</button>)}</div>
              <div className="pg-grupo-t">{t('Ir para', 'Go to')}</div>
              <div className="pg-atalhos">{ATALHOS.map(([id, n, ic]) => (
                <button key={id} type="button" onClick={() => ir({ tipo: 'vista', vista: id })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ic} /></svg>{t(n[0], n[1])}
                </button>))}
              </div>
            </>
          )}
          {q.trim().length >= 2 && !resultados.length && !resp && !aPerguntar && !aOuvir && (
            <div className="pg-vazio">{t('Nenhuma página com esse nome. Carregue em Enter para perguntar à IA.', 'No page with that name. Press Enter to ask the AI.')}</div>
          )}
        </div>
        <div className="pg-rodape">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t('navegar', 'navigate')}</span><span><kbd>Enter</kbd> {t('abrir ou perguntar', 'open or ask')}</span><span><kbd>Esc</kbd> {t('fechar', 'close')}</span>
          <span className="pg-rodape-voz">{t('Voz transcrita por IA (Whisper); o áudio não é guardado.', 'Voice transcribed by AI (Whisper); audio is not stored.')}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Botão que parece uma barra de pesquisa e abre a pesquisa global (com microfone para começar logo por voz). */
export function BarraPesquisa({ grande, className }: { grande?: boolean; className?: string }) {
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)); }, []);
  return (
    <div className={`pgb${grande ? ' grande' : ''}${className ? ` ${className}` : ''}`}>
      <style>{CSS_BARRA}</style>
      <button type="button" className="pgb-campo" onClick={() => abrirPesquisa()}>
        <svg width={grande ? 22 : 17} height={grande ? 22 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="pgb-txt">{grande ? t('Pesquise ou pergunte qualquer coisa sobre o turismo em Braga…', 'Search or ask anything about tourism in Braga…') : t('Pesquisar ou perguntar…', 'Search or ask…')}</span>
        <kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <button type="button" className="pgb-mic" onClick={() => abrirPesquisa({ voz: true })} aria-label={t('Pesquisar por voz', 'Search by voice')} title={t('Pesquisar por voz', 'Search by voice')}>
        <svg width={grande ? 22 : 17} height={grande ? 22 : 17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 17v4M8 21h8" /></svg>
      </button>
    </div>
  );
}

const CSS_BARRA = `
.pgb { display: flex; gap: 8px; align-items: stretch; font-family: 'Public Sans', system-ui, sans-serif; }
.pgb-campo { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #A3A8B1; font: inherit; font-size: 13.5px; cursor: text; text-align: left; transition: border-color .2s ease, background .2s ease, color .2s ease; }
.pgb-campo:hover { border-color: rgba(138,176,230,.55); background: rgba(138,176,230,.08); color: #ECEDEF; }
.pgb-txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pgb kbd { flex-shrink: 0; font: 600 11px 'Public Sans', system-ui, sans-serif; color: #8A909B; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,.14); }
.pgb-mic { flex: 0 0 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(138,176,230,.4); background: rgba(138,176,230,.14); color: #CFE0F7; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .2s ease, transform .2s ease; }
.pgb-mic:hover { background: rgba(138,176,230,.28); transform: scale(1.05); }
.pgb.grande .pgb-campo { height: 64px; padding: 0 22px; gap: 14px; border-radius: 999px; font-size: 16.5px; background: rgba(21,23,27,.55); border-color: rgba(255,255,255,.18); color: #C9CDD3; backdrop-filter: blur(18px) saturate(150%); -webkit-backdrop-filter: blur(18px) saturate(150%); box-shadow: 0 24px 60px -28px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.08); }
.pgb.grande .pgb-mic { flex-basis: 64px; height: 64px; border-radius: 999px; background: #8AB0E6; color: #0F1216; border: 0; box-shadow: 0 0 0 6px rgba(138,176,230,.18), 0 18px 40px -16px rgba(138,176,230,.7); }
.pgb.grande .pgb-mic:hover { background: #B7CDF0; }
.pgb.grande kbd { font-size: 12px; padding: 3px 8px; }
@media (max-width: 760px) { .pgb.grande .pgb-campo { height: 54px; font-size: 14.5px; padding: 0 16px; } .pgb.grande .pgb-mic { flex-basis: 54px; height: 54px; } .pgb.grande kbd { display: none; } }
@media print { .pgb { display: none !important; } }
`;

const CSS = `
.pg-fundo { position: fixed; inset: 0; z-index: 5000; background: radial-gradient(900px 500px at 50% 0%, rgba(138,176,230,.14), transparent), rgba(6,7,9,.66); backdrop-filter: blur(10px) saturate(120%); -webkit-backdrop-filter: blur(10px) saturate(120%); display: flex; justify-content: center; align-items: flex-start; padding: 9vh 16px 16px; animation: pgFade .2s ease both; font-family: 'Public Sans', system-ui, sans-serif; }
@keyframes pgFade { from { opacity: 0; } to { opacity: 1; } }
.pg { width: min(780px, 100%); max-height: 82vh; display: flex; flex-direction: column; border-radius: 26px; overflow: hidden; color: #ECEDEF; background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02)), rgba(22,25,30,.92); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 40px 120px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.1); backdrop-filter: blur(30px) saturate(160%); -webkit-backdrop-filter: blur(30px) saturate(160%); animation: pgEntra .32s cubic-bezier(.2,.9,.3,1.1) both; }
@keyframes pgEntra { from { opacity: 0; transform: translateY(-14px) scale(.98); } to { opacity: 1; transform: none; } }
.pg-barra { position: relative; display: flex; align-items: center; gap: 12px; padding: 14px 14px 14px 22px; border-bottom: 1px solid rgba(255,255,255,.08); }
.pg-barra::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: linear-gradient(90deg, transparent, #8AB0E6, transparent); opacity: 0; transition: opacity .3s ease; }
.pg-barra:focus-within::after, .pg-barra.ouvir::after { opacity: 1; }
.pg-barra.ouvir::after { background: linear-gradient(90deg, transparent, #EF8A7B, transparent); animation: pgBrilho 1.6s ease-in-out infinite; }
@keyframes pgBrilho { 50% { opacity: .35; } }
.pg-lupa { color: #8AB0E6; flex-shrink: 0; }
.pg-barra input { flex: 1; min-width: 0; height: 48px; border: 0; background: transparent; color: #ECEDEF; font: 500 19px 'Public Sans', system-ui, sans-serif; letter-spacing: -0.01em; outline: none; }
.pg-barra input::placeholder { color: #7D838E; }
.pg-x { width: 34px; height: 34px; border-radius: 999px; border: 0; background: rgba(255,255,255,.06); color: #A3A8B1; font-size: 20px; line-height: 1; cursor: pointer; }
.pg-x:hover { color: #ECEDEF; background: rgba(255,255,255,.12); }
.pg-mic { position: relative; flex: 0 0 52px; height: 52px; border-radius: 999px; border: 0; background: #8AB0E6; color: #0F1216; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .2s ease, background .2s ease; box-shadow: 0 10px 26px -10px rgba(138,176,230,.8); }
.pg-mic:hover { transform: scale(1.06); background: #B7CDF0; }
.pg-mic.on { background: #EF8A7B; color: #1A0D0B; box-shadow: 0 0 0 0 rgba(239,138,123,.55); animation: pgPulso 1.4s ease-out infinite; }
@keyframes pgPulso { 0% { box-shadow: 0 0 0 0 rgba(239,138,123,.55); } 100% { box-shadow: 0 0 0 18px rgba(239,138,123,0); } }
.pg-mic.esp { background: #2A3140; cursor: default; }
.pg-roda { width: 20px; height: 20px; border-radius: 999px; border: 2.5px solid rgba(138,176,230,.3); border-top-color: #8AB0E6; animation: pgRoda .8s linear infinite; }
@keyframes pgRoda { to { transform: rotate(360deg); } }
.pg-voz { display: flex; align-items: center; gap: 18px; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,.06); background: linear-gradient(90deg, rgba(239,138,123,.08), transparent 60%); }
.pg-onda { display: flex; align-items: center; gap: 4px; height: 44px; flex-shrink: 0; }
.pg-onda i { display: block; width: 4px; height: 44px; border-radius: 4px; background: linear-gradient(180deg, #F2C1B8, #EF8A7B); transform-origin: center; transition: transform .08s linear; }
.pg-voz-txt { font-size: 14px; color: #C9CDD3; line-height: 1.5; }
.pg-corpo { overflow-y: auto; padding: 10px 12px 14px; overscroll-behavior: contain; }
.pg-grupo { margin-top: 6px; }
.pg-grupo-t { padding: 12px 12px 6px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #7D838E; }
.pg-item { width: 100%; display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 14px; border: 0; background: transparent; color: #ECEDEF; font: inherit; text-align: left; cursor: pointer; transition: background .15s ease; }
.pg-item.ativo, .pg-item:hover { background: rgba(138,176,230,.12); }
.pg-ico { flex: 0 0 38px; height: 38px; border-radius: 11px; background: rgba(255,255,255,.06); color: #8AB0E6; display: flex; align-items: center; justify-content: center; }
.pg-item.ativo .pg-ico { background: rgba(138,176,230,.22); }
.pg-item-t { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pg-item-t b { font-size: 14.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-item-t small { font-size: 12.5px; color: #8A909B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-seta { color: #8AB0E6; opacity: 0; transform: translateX(-4px); transition: opacity .15s ease, transform .15s ease; }
.pg-item.ativo .pg-seta, .pg-item:hover .pg-seta { opacity: 1; transform: none; }
.pg-perguntar { width: 100%; display: flex; align-items: center; gap: 12px; margin: 4px 0 2px; padding: 14px 14px; border-radius: 16px; border: 1px solid rgba(138,176,230,.3); background: linear-gradient(90deg, rgba(138,176,230,.16), rgba(138,176,230,.04)); color: #ECEDEF; font: inherit; font-size: 14.5px; text-align: left; cursor: pointer; }
.pg-perguntar > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-perguntar.ativo, .pg-perguntar:hover { border-color: rgba(138,176,230,.7); }
.pg-ia { flex-shrink: 0; font-size: 11px; font-weight: 800; letter-spacing: .06em; padding: 4px 8px; border-radius: 8px; color: #0F1216; background: linear-gradient(135deg, #CFE0F7, #8AB0E6); }
.pg kbd { flex-shrink: 0; font: 600 11px 'Public Sans', system-ui, sans-serif; color: #A3A8B1; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.04); }
.pg-exemplos { display: flex; flex-wrap: wrap; gap: 8px; padding: 2px 8px 6px; }
.pg-exemplos button { padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: #C9CDD3; font: 13.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; text-align: left; transition: border-color .2s ease, color .2s ease, background .2s ease; }
.pg-exemplos button:hover { border-color: #8AB0E6; color: #ECEDEF; background: rgba(138,176,230,.1); }
.pg-atalhos { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; padding: 2px 8px 6px; }
.pg-atalhos button { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.04); color: #ECEDEF; font: 600 14px 'Public Sans', system-ui, sans-serif; cursor: pointer; transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.pg-atalhos button svg { color: #8AB0E6; flex-shrink: 0; }
.pg-atalhos button:hover { background: rgba(138,176,230,.12); border-color: rgba(138,176,230,.4); transform: translateY(-1px); }
.pg-resp { margin: 6px 0 8px; padding: 18px 20px; border-radius: 18px; background: radial-gradient(600px 200px at 0% 0%, rgba(138,176,230,.16), transparent), rgba(255,255,255,.04); border: 1px solid rgba(138,176,230,.25); animation: pgEntra .3s ease both; }
.pg-resp-cab { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.pg-resp-q { font-size: 13px; color: #8A909B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pg-resp-txt { font-size: 16px; line-height: 1.65; color: #ECEDEF; white-space: pre-line; }
.pg-fontes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.pg-fontes span { font-size: 12px; color: #A3A8B1; padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); }
.pg-acoes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.pg-ir { padding: 10px 16px; border-radius: 999px; border: 0; background: #8AB0E6; color: #0F1216; font: 700 13.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.pg-ir:hover { background: #B7CDF0; }
.pg-nova { padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: transparent; color: #C9CDD3; font: 600 13.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.pg-aviso { margin-top: 12px; font-size: 12px; color: #7D838E; line-height: 1.5; }
.pg-resp.a-pensar .pg-resp-q { display: block; margin-bottom: 12px; }
.pg-linhas i { display: block; height: 12px; border-radius: 6px; margin: 9px 0; background: linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(138,176,230,.22) 50%, rgba(255,255,255,.05) 100%); background-size: 200% 100%; animation: pgCarrega 1.2s ease-in-out infinite; }
.pg-linhas i:nth-child(2) { width: 88%; } .pg-linhas i:nth-child(3) { width: 62%; }
@keyframes pgCarrega { from { background-position: 100% 0; } to { background-position: -100% 0; } }
.pg-resp-n { font-size: 12.5px; color: #8A909B; margin-top: 8px; }
.pg-erro { margin: 8px 4px; padding: 12px 14px; border-radius: 14px; background: rgba(239,138,123,.12); border: 1px solid rgba(239,138,123,.35); font-size: 14px; color: #ECEDEF; }
.pg-vazio { padding: 18px 12px; font-size: 14px; color: #8A909B; }
.pg-rodape { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; padding: 10px 20px; border-top: 1px solid rgba(255,255,255,.07); font-size: 12px; color: #7D838E; }
.pg-rodape span { display: inline-flex; align-items: center; gap: 5px; }
.pg-rodape-voz { margin-left: auto; }
@media (max-width: 760px) {
  .pg-fundo { padding: 0; align-items: stretch; }
  .pg { width: 100%; max-height: none; height: 100%; border-radius: 0; border: 0; }
  .pg-barra { padding: calc(10px + env(safe-area-inset-top, 0px)) 10px 10px 16px; }
  .pg-barra input { font-size: 17px; }
  .pg-atalhos { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .pg-rodape > span:not(.pg-rodape-voz) { display: none; }
  .pg-rodape-voz { margin-left: 0; padding-bottom: env(safe-area-inset-bottom, 0px); }
}
@media (prefers-reduced-motion: reduce) { .pg, .pg-fundo, .pg-resp, .pg-mic.on, .pg-linhas i { animation: none !important; } }
`;
