'use client';

import { useEffect, useState } from 'react';

// Vídeo de fundo do topo do Observatório (Bunny Stream). A foto do topo continua por baixo e serve de
// poster: o vídeo só é carregado depois da página, aparece com um fade quando está pronto e não é
// carregado com "reduzir movimento", poupança de dados ou ecrãs pequenos.
const BIBLIOTECA = '780807';
const VIDEO = '8b88a2e9-bd23-4b0f-9c68-1b975ef5aa50';
const SRC = `https://iframe.mediadelivery.net/embed/${BIBLIOTECA}/${VIDEO}?autoplay=true&loop=true&muted=true&preload=true&playsinline=true`;

function podeCarregar(): boolean {
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

  useEffect(() => {
    if (!podeCarregar()) return;
    const arranca = () => setAtivo(true);
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(arranca, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(arranca, 1200);
    return () => clearTimeout(id);
  }, []);

  if (!ativo) return null;
  return (
    <div className="obs-hero-video" aria-hidden="true" style={{ opacity: pronto ? 1 : 0 }}>
      <iframe
        src={SRC}
        title=""
        tabIndex={-1}
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        onLoad={() => setTimeout(() => setPronto(true), 900)}
      />
    </div>
  );
}
