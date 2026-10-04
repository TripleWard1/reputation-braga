'use client';

import { useState, useEffect } from 'react';
import { t, setLangGlobal, type Lang } from '@/app/lib/i18n';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/firebase';

const LOGO_URL = 'https://i.imgur.com/Vij12Qd.png';
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
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap');
.lg-foto { position: absolute; inset: -40px; background-size: cover; background-position: center; opacity: 1; animation: lgKb 26s ease-in-out infinite alternate; }
.lg-foto.on { opacity: 1; }
@keyframes lgKb { from { transform: scale(1.04); } to { transform: scale(1.16) translate(-16px, 10px); } }
.lg-in { animation: lgUp .9s cubic-bezier(.2,.7,.2,1) both; }
.lg-in2 { animation: lgUp .9s cubic-bezier(.2,.7,.2,1) .15s both; }
@keyframes lgUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.lg-input:focus { border-color: #8AB0E6 !important; box-shadow: 0 0 0 3px rgba(138,176,230,.18); }
.lg-btn:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }
.lg-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(320px, 400px); gap: 56px; align-items: center; width: 100%; max-width: 1080px; }
@media (max-width: 860px) { .lg-grid { grid-template-columns: 1fr; gap: 28px; } .lg-titulo { text-align: center; } .lg-titulo p { margin-left: auto !important; margin-right: auto !important; } }
@media (prefers-reduced-motion: reduce) { .lg-foto, .lg-in, .lg-in2 { animation: none !important; } }
`;

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>('pt');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setError(false);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Sessão no Firebase com a mesma palavra-passe: é o que as regras do Firestore exigem para gravar.
        const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (email) {
          try { await signInWithEmailAndPassword(auth, email, password); } catch { /* conta ainda não criada no Firebase: entra na mesma; gravar depende das regras */ }
        }
        window.location.href = '/';
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
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
          <img src={LOGO_URL} alt="Visit Braga" style={{ height: 54, width: 'auto', marginBottom: 30 }} />
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accent }}>Braga</div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '12px 0 16px', textShadow: '0 2px 24px rgba(0,0,0,.35)' }}>
            {t('Observatório de Turismo e Reputação', 'Tourism and Reputation Observatory')}
          </h1>
          <p style={{ fontSize: 16, color: C.textMuted, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
            {t('Procura, economia, sustentabilidade e reputação do destino, reunidos numa só plataforma.', 'Demand, economy, sustainability and destination reputation, together in one platform.')}
          </p>
        </div>

        <div className="lg-in2" style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px 28px 28px', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)' }}>
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
          <input
            className="lg-input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) setError(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="••••••••"
            autoFocus
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 4, border: `1px solid ${error ? C.negative : C.border}`, background: C.inputBg, color: C.text, fontSize: 15, outline: 'none', marginBottom: 12, fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s' }}
          />

          {error && (
            <div style={{ fontSize: 13, color: C.negative, background: C.negativeBg, borderRadius: 4, padding: '9px 12px', marginBottom: 12 }}>
              {t('Palavra-passe incorreta. Tenta novamente.', 'Incorrect password. Please try again.')}
            </div>
          )}

          <button className="lg-btn" type="button" onClick={submit} disabled={loading || !password} style={{
            width: '100%', padding: '13px 14px', borderRadius: 4, border: 'none', cursor: loading || !password ? 'default' : 'pointer', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s',
            background: loading || !password ? 'rgba(138,176,230,0.25)' : C.accent, color: loading || !password ? C.textMuted : '#0F1216',
          }}>
            {loading ? t('A entrar…', 'Signing in…') : t('Entrar', 'Sign in')}
          </button>
          <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 13.5, color: '#A3A8B1', textDecoration: 'none' }}>{t('← Voltar à versão pública', '← Back to the public version')}</a>

          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 22, lineHeight: 1.5 }}>
            {t('Município de Braga · Divisão de Atividades Económicas e Turismo', 'Braga City Council · Economic Activities and Tourism Division')}
          </div>
        </div>
      </div>
    </div>
  );
}
