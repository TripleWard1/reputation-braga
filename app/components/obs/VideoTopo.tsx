'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@/app/lib/i18n';

// Vídeo do topo da Visão Geral (Bunny Stream).
// 1) Fundo: sem som, em loop; a foto do topo fica por baixo como poster. Só carrega depois da página e não
//    carrega com "reduzir movimento", poupança de dados ou ecrãs pequenos.
// 2) Botão "Ver vídeo com som": abre uma janela com o vídeo com som, controlos e sem nada por cima.
const BIBLIOTECA = '780807';
const VIDEO = '8b88a2e9-bd23-4b0f-9c68-1b975ef5aa50';
const BASE = `https://iframe.mediadelivery.net/embed/${BIBLIOTECA}/${VIDEO}`;
const SRC_FUNDO = `${BASE}?autoplay=true&loop=true&muted=true&preload=true&playsinline=true`;
const SRC_JANELA = `${BASE}?autoplay=true&preload=true&playsinline=true`;

const CSS = `
.vb-hero-video { position: absolute; inset: 0; overflow: hidden; container-type: size; pointer-events: none; transition: opacity 1.1s ease; }
.vb-hero-video iframe { position: absolute; top: 50%; left: 50%; width: max(100cqw, 177.78cqh); height: max(100cqh, 56.25cqw); transform: translate(-50%, -50%); border: 0; pointer-events: none; }
.vb-ver { position: absolute; top: 22px; right: 28px; z-index: 5; display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px 9px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.22); background: rgba(21,23,27,.5); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); color: #ECEDEF; font: 600 13px/1 inherit; font-family: inherit; cursor: pointer; transition: background .2s, border-color .2s, transform .2s; }
.vb-ver:hover { background: rgba(21,23,27,.72); border-color: rgba(255,255,255,.4); transform: translateY(-1px); }
.vb-ver:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 3px; }
.vb-ver svg { width: 22px; height: 22px; padding: 5px; border-radius: 999px; background: #8AB0E6; color: #15171B; box-sizing: border-box; flex-shrink: 0; }
.vb-modal { position: fixed; inset: 0; z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(8,9,11,.86); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: vbFade .2s ease both; }
.vb-modal-in { position: relative; width: min(1100px, 100%, calc((100vh - 64px) * 16 / 9)); aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: #000; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
.vb-modal-in iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.vb-fechar { position: absolute; top: 14px; right: 14px; z-index: 3001; width: 40px; height: 40px; border-radius: 999px; border: 1px solid rgba(255,255,255,.25); background: rgba(21,23,27,.7); color: #ECEDEF; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.vb-fechar:hover { background: rgba(21,23,27,.95); }
.vb-fechar:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
@keyframes vbFade { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 700px) { .vb-ver { top: 14px; right: 14px; padding: 7px; gap: 0; } .vb-ver-t { display: none; } .vb-modal { padding: 12px; } }
@media (prefers-reduced-motion: reduce) { .vb-modal, .vb-ver { animation: none; transition: none; } }
@media print { .vb-hero-video, .vb-ver { display: none !important; } }
`;

function podeCarregarFundo(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.matchMedia?.('(max-width: 700px)').matches) return false;
  const lig = (navigator as any).connection;
  if (lig?.saveData) return false;
  return true;
}

export default function VideoTopo() {
  const [ativo, setAtivo] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!podeCarregarFundo()) return;
    const arranca = () => setAtivo(true);
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(arranca, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(arranca, 1200);
    return () => clearTimeout(id);
  }, []);

  // Janela aberta: Esc fecha, a página não desliza por baixo e o foco vai para o botão de fechar (e volta ao sair)
  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    window.addEventListener('keydown', tecla);
    fechar.current?.focus();
    const volta = botao.current;
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener('keydown', tecla);
      volta?.focus();
    };
  }, [aberto]);

  const titulo = t('Vídeo de Braga', 'Video of Braga');
  return (
    <>
      <style>{CSS}</style>
      {ativo && !aberto && (
        <div className="vb-hero-video" aria-hidden="true" style={{ opacity: pronto ? 1 : 0 }}>
          <iframe
            src={SRC_FUNDO}
            title=""
            tabIndex={-1}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            onLoad={() => setTimeout(() => setPronto(true), 900)}
          />
        </div>
      )}
      <button ref={botao} type="button" className="vb-ver" onClick={() => setAberto(true)} aria-haspopup="dialog" aria-label={t('Ver vídeo com som', 'Watch with sound')}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.4-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5z" /></svg>
        <span className="vb-ver-t">{t('Ver vídeo com som', 'Watch with sound')}</span>
      </button>
      {aberto && typeof document !== 'undefined' && createPortal(
        <div className="vb-modal" role="dialog" aria-modal="true" aria-label={titulo} onClick={() => setAberto(false)}>
          <div className="vb-modal-in" onClick={(e) => e.stopPropagation()}>
            <iframe src={SRC_JANELA} title={titulo} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
          </div>
          <button ref={fechar} type="button" className="vb-fechar" onClick={() => setAberto(false)} aria-label={t('Fechar vídeo', 'Close video')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
