'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Moldura das páginas legais (acessibilidade e privacidade): mesma identidade da plataforma, em PT, EN e ES.
export type LinguaLegal = 'pt' | 'en' | 'es';
export type Texto = { pt: ReactNode; en: ReactNode; es: ReactNode };

export function useLingua(): [LinguaLegal, (l: LinguaLegal) => void] {
  const [l, setL] = useState<LinguaLegal>('pt');
  useEffect(() => {
    const s = typeof window !== 'undefined' ? localStorage.getItem('rb-lang') : null;
    const ini: LinguaLegal = s === 'en' || s === 'es' ? s : 'pt';
    setL(ini);
    document.documentElement.lang = ini === 'pt' ? 'pt-PT' : ini;
  }, []);
  const mudar = (x: LinguaLegal) => {
    setL(x);
    document.documentElement.lang = x === 'pt' ? 'pt-PT' : x;
    try { localStorage.setItem('rb-lang', x); } catch { /* sem armazenamento */ }
  };
  return [l, mudar];
}

export default function PaginaLegal({ titulo, lingua, mudar, children }: { titulo: string; lingua: LinguaLegal; mudar: (l: LinguaLegal) => void; children: ReactNode }) {
  const voltar = { pt: '← Voltar à plataforma', en: '← Back to the platform', es: '← Volver a la plataforma' }[lingua];
  return (
    <div className="lg">
      <style>{CSS}</style>
      <a href="#conteudo-legal" className="lg-saltar">{{ pt: 'Saltar para o conteúdo', en: 'Skip to content', es: 'Saltar al contenido' }[lingua]}</a>
      <header className="lg-topo">
        <a href="/" className="lg-voltar">{voltar}</a>
        <div className="lg-linguas" role="group" aria-label={{ pt: 'Língua', en: 'Language', es: 'Idioma' }[lingua]}>
          {(['pt', 'en', 'es'] as LinguaLegal[]).map((x) => (
            <button key={x} type="button" aria-pressed={lingua === x} onClick={() => mudar(x)}>{x.toUpperCase()}</button>
          ))}
        </div>
      </header>
      <main id="conteudo-legal" className="lg-corpo" tabIndex={-1}>
        <img className="lg-logo" src="/visit-braga-logo-negativo.png" alt="Visit Braga" />
        <h1>{titulo}</h1>
        {children}
      </main>
      <footer className="lg-rodape">
        <a href="/acessibilidade">{{ pt: 'Acessibilidade', en: 'Accessibility', es: 'Accesibilidad' }[lingua]}</a>
        <span aria-hidden="true">·</span>
        <a href="/privacidade">{{ pt: 'Privacidade', en: 'Privacy', es: 'Privacidad' }[lingua]}</a>
        <span aria-hidden="true">·</span>
        <span>Município de Braga</span>
      </footer>
    </div>
  );
}

const CSS = `
.lg { min-height: 100vh; background: #15171B; color: #ECEDEF; font-family: 'Public Sans', system-ui, sans-serif; }
.lg-saltar { position: fixed; left: 14px; top: -80px; z-index: 50; background: #8AB0E6; color: #0F1216; padding: 12px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; }
.lg-saltar:focus { top: 14px; }
.lg-topo { position: sticky; top: 0; z-index: 10; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 24px; background: rgba(21,23,27,.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #2D3139; }
.lg-voltar { color: #ECEDEF; text-decoration: none; font-weight: 600; font-size: 14px; }
.lg-voltar:hover { color: #8AB0E6; }
.lg-linguas { display: flex; gap: 6px; }
.lg-linguas button { min-width: 44px; height: 36px; border-radius: 999px; border: 1px solid #2D3139; background: transparent; color: #A3A8B1; font: 700 12.5px 'Public Sans', system-ui, sans-serif; cursor: pointer; }
.lg-linguas button[aria-pressed="true"] { border-color: #8AB0E6; background: rgba(138,176,230,.16); color: #ECEDEF; }
.lg-corpo { max-width: 820px; margin: 0 auto; padding: 40px 24px 60px; outline: none; }
.lg-logo { height: 26px; width: auto; display: block; margin-bottom: 28px; }
.lg-corpo h1 { font-size: clamp(28px, 4vw, 40px); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 18px; }
.lg-corpo h2 { font-size: 20px; margin: 34px 0 10px; letter-spacing: -0.01em; }
.lg-corpo p, .lg-corpo li { font-size: 15.5px; line-height: 1.7; color: #C9CDD3; }
.lg-corpo ul { padding-left: 20px; }
.lg-corpo a { color: #8AB0E6; }
.lg-corpo strong { color: #ECEDEF; }
.lg-nota { padding: 14px 16px; border-radius: 10px; background: rgba(138,176,230,.1); border: 1px solid rgba(138,176,230,.3); }
.lg-rodape { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; padding: 24px; border-top: 1px solid #2D3139; font-size: 13px; color: #A3A8B1; }
.lg-rodape a { color: #A3A8B1; }
.lg a:focus-visible, .lg button:focus-visible { outline: 2px solid #8AB0E6; outline-offset: 2px; }
`;
