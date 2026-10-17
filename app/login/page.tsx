'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { t, setLangGlobal, type Lang } from '@/app/lib/i18n';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { obterAuth } from '@/app/firebase';

const LOGO_URL = '/visit-braga-logo-negativo.png';
const FOTO_LOGIN = '/login-avenida.jpg';
const FOTO_LOGIN_MINI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA4KCw0LCQ4NDA0QDw4RFiQXFhQUFiwgIRokNC43NjMuMjI6QVNGOj1OPjIySGJJTlZYXV5dOEVmbWVabFNbXVn/2wBDAQ8QEBYTFioXFypZOzI7WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVn/wAARCAASACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCaPUbgYEZGQM4NTG7uWiMm8AjrkVmL9nk8vhdq8kZ6j04q7PseNjDGAEToCalTZTgTJrMuEH7pifapX1h85KRkLwcE1hPImGWRAQDwVGCKjjRRtZGk2nkFj2qucSgu5BpnzBs8/N3rY08f6Qo7Ef0oorOOwkUvESKqLhQOR0FUYeBgdKKKHsaR3P/Z';

const C = {
  bg: '#15171B',
  card: 'rgba(21,23,27,0.62)',
  border: 'rgba(255,255,255,0.10)',
  accent: '#8AB0E6',
  accentLight: '#B7CDF0',
  accentBg: 'rgba(138,176,230,0.16)',
  text: '#ECEDEF',
  textMuted: '#A3A8B1',
  inputBg: 'rgba(15,18,22,0.72)',
  negative: '#EF8A7B',
  negativeBg: 'rgba(239,138,123,0.12)',
};

const CSS = `
html, body { margin: 0; background: #15171B; }
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
.lg-foto { position: absolute; inset: -40px; background-size: cover; background-position: center; opacity: 1; animation: lgKb 26s ease-in-out infinite alternate; }
.lg-foto.on { opacity: 1; }
@keyframes lgKb { from { transform: scale(1.04); } to { transform: scale(1.16) translate(-16px, 10px); } }
.lg-in { animation: lgUp .9s cubic-bezier(.2,.7,.2,1) both; }
.lg-in2 { animation: lgUp .9s cubic-bezier(.2,.7,.2,1) .15s both; }
@keyframes lgUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.lg-input:focus { border-color: #8AB0E6 !important; box-shadow: 0 0 0 3px rgba(138,176,230,.18); }
.lg-btn:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 12px 28px -12px rgba(138,176,230,.7); }
.lg-olho { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border-radius: 10px; border: 0; background: transparent; color: #A3A8B1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lg-olho:hover { color: #ECEDEF; background: rgba(255,255,255,.06); }
.lg-voltar { transition: border-color .2s, color .2s, background .2s; }
.lg-voltar:hover { border-color: #8AB0E6 !important; color: #ECEDEF !important; background: rgba(138,176,230,.08); }
.lg-roda { width: 16px; height: 16px; border-radius: 999px; border: 2px solid rgba(15,18,22,.25); border-top-color: #0F1216; animation: lgRoda .8s linear infinite; }
@keyframes lgRoda { to { transform: rotate(360deg); } }
.lg-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 400px); gap: 56px; align-items: center; width: 100%; max-width: 1080px; }
@media (max-width: 860px) { .lg-grid { grid-template-columns: minmax(0, 1fr); gap: 28px; } .lg-titulo { text-align: center; } .lg-titulo p { margin-left: auto !important; margin-right: auto !important; } }
@media (prefers-reduced-motion: reduce) { .lg-foto, .lg-in, .lg-in2 { animation: none !important; } }
.lg-input { -webkit-appearance: none; }
.lg-input::-ms-reveal { display: none; }
`;

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>('pt');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<'' | 'senha' | 'limite' | 'config' | 'rede'>('');
  const [loading, setLoading] = useState(false);
  const [erroFb, setErroFb] = useState<string | null>(null);
  const [ver, setVer] = useState(false);
  const [caps, setCaps] = useState(false);
  // Fotografia do login: Avenida da Liberdade. A miniatura aparece de imediato; a foto completa por cima assim que chega.

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('rb-lang') : null;
    const initial: Lang = saved === 'en' ? 'en' : 'pt';
    setLang(initial);
    setLangGlobal(initial);
  }, []);

  const pickLang = (l: Lang) => {
    setLang(l);
    setLangGlobal(l);
    if (typeof window !== 'undefined') localStorage.setItem('rb-lang', l);
  };

  const submit = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Sessão no Firebase com a mesma palavra-passe: é o que as regras do Firestore exigem para gravar.
        const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        const a = obterAuth();
        if (email && a) {
          try { await signInWithEmailAndPassword(a, email, password); } catch (e: any) {
            // Entrou no site mas o Firebase recusou: sem isto não é possível gravar. Mostra o motivo em vez de seguir em silêncio.
            setErroFb(String(e?.code || e?.message || 'erro'));
            setLoading(false);
            return;
          }
        } else {
          setErroFb(!email ? 'NEXT_PUBLIC_ADMIN_EMAIL em falta' : 'auth indisponível');
          setLoading(false);
          return;
        }
        window.location.href = '/';
      } else {
        setError(res.status === 429 ? 'limite' : res.status === 503 ? 'config' : 'senha');
        setLoading(false);
      }
    } catch {
      setError('rede');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: `radial-gradient(1000px 560px at 30% 20%, rgba(138,176,230,0.10), transparent), ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: "'Public Sans', system-ui, sans-serif", color: C.text }}>
      <style>{CSS}</style>
      <link rel="preload" as="image" href={FOTO_LOGIN} />
      <div className="lg-foto on" style={{ backgroundImage: `url(${FOTO_LOGIN}), url(${FOTO_LOGIN_MINI})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(21,23,27,.92) 0%, rgba(21,23,27,.62) 55%, rgba(21,23,27,.45) 100%), linear-gradient(0deg, rgba(21,23,27,.85) 0%, rgba(21,23,27,0) 45%)' }} />

      <div className="lg-grid" style={{ position: 'relative' }}>
        <div className="lg-titulo lg-in">
          <img src={LOGO_URL} alt="Visit Braga" style={{ width: 'min(300px, 70vw)', height: 'auto', marginBottom: 30, filter: 'drop-shadow(0 3px 16px rgba(0,0,0,.5))' }} />
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accent }}>Braga</div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '12px 0 16px', textShadow: '0 2px 24px rgba(0,0,0,.35)' }}>
            {t('Observatório de Turismo e Reputação', 'Tourism and Reputation Observatory')}
          </h1>
          <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
            {t('Procura, economia, sustentabilidade e reputação do destino, reunidos numa só plataforma.', 'Demand, economy, sustainability and destination reputation, together in one platform.')}
          </p>
        </div>

        <div className="lg-in2" style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: '32px 28px 28px', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{t('Entrar', 'Sign in')}</div>
          <div style={{ fontSize: 14, color: C.textMuted, margin: '6px 0 22px' }}>{t('Acesso reservado à equipa', 'Team access only')}</div>

          {/* Idioma */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {(['pt', 'en'] as Lang[]).map((l) => (
              <button key={l} type="button" onClick={() => pickLang(l)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s', fontFamily: 'inherit',
                border: `1px solid ${lang === l ? C.accent : C.border}`, background: lang === l ? C.accentBg : 'transparent', color: lang === l ? C.text : C.textMuted,
              }}>
                <img src={`https://flagcdn.com/${l === 'pt' ? 'pt' : 'gb'}.svg`} alt="" width={20} height={14} style={{ borderRadius: 2, objectFit: 'cover', display: 'block' }} />
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Palavra-passe */}
          <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 8 }}>{t('Palavra-passe', 'Password')}</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
            className="lg-input"
            type={ver ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState('CapsLock'))}
            autoComplete="current-password"
            aria-describedby={caps ? 'lg-caps' : undefined}
            placeholder="••••••••"
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 48px 13px 16px', borderRadius: 12, border: `1px solid ${error ? C.negative : C.border}`, background: C.inputBg, color: C.text, fontSize: 15, outline: 'none', marginBottom: 0, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
          />
            <button type="button" className="lg-olho" onClick={() => setVer((v) => !v)} aria-label={ver ? t('Esconder palavra-passe', 'Hide password') : t('Mostrar palavra-passe', 'Show password')} aria-pressed={ver}>
              {ver
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.4 10.4 0 0112 5c5.5 0 9.5 5.2 10 7-.3 1-1.4 2.8-3.1 4.3M6.6 6.6C4.4 8 2.9 10.1 2 12c.8 2.2 4.6 7 10 7 1.6 0 3.1-.4 4.4-1.1" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>}
            </button>
          </div>
          {caps && <div id="lg-caps" role="status" style={{ fontSize: 12.5, color: '#E9C46A', margin: '-4px 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>⇪ {t('Caps Lock está ligado', 'Caps Lock is on')}</div>}

          {error && (
            <div style={{ fontSize: 13, color: C.negative, background: C.negativeBg, borderRadius: 10, padding: '9px 12px', marginBottom: 12 }}>
              {error === 'limite' ? t('Demasiadas tentativas. Tenta novamente dentro de alguns minutos.', 'Too many attempts. Please try again in a few minutes.')
                : error === 'config' ? t('O acesso de administração não está disponível de momento.', 'Administrator access is not available at the moment.')
                : error === 'rede' ? t('Sem ligação ao servidor. Tenta novamente.', 'Could not reach the server. Please try again.')
                : t('Palavra-passe incorreta. Tenta novamente.', 'Incorrect password. Please try again.')}
            </div>
          )}

          {erroFb && (
            <div style={{ fontSize: 13, color: C.negative, background: C.negativeBg, borderRadius: 10, padding: '9px 12px', marginBottom: 12, lineHeight: 1.5 }}>
              {t('Entraste no site, mas o Firebase recusou a sessão, por isso não vais conseguir gravar.', 'You are signed in to the site, but Firebase refused the session, so you will not be able to save.')} ({erroFb}){' '}
              <Link href="/" style={{ color: C.text }}>{t('Continuar mesmo assim', 'Continue anyway')}</Link>
            </div>
          )}

          <button className="lg-btn" type="button" onClick={submit} disabled={loading || !password} style={{
            width: '100%', padding: '13px 14px', borderRadius: 12, border: 'none', cursor: loading || !password ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s',
            background: loading || !password ? 'rgba(138,176,230,0.25)' : C.accent, color: loading || !password ? C.textMuted : '#0F1216',
          }}>
            {loading && <span className="lg-roda" aria-hidden="true" />}{loading ? t('A entrar…', 'Signing in…') : t('Entrar', 'Sign in')}
          </button>
          <Link href="/" className="lg-voltar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, height: 44, borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 13.5, fontWeight: 600, color: '#C9CDD3', textDecoration: 'none' }}>{t('← Voltar à versão pública', '← Back to the public version')}</Link>

          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 22, lineHeight: 1.5 }}>
            {t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}
          </div>
        </div>
      </div>
    </div>
  );
}
