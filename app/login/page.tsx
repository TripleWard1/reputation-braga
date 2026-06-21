'use client';

import { useState, useEffect } from 'react';
import { t, setLangGlobal, type Lang } from '@/app/lib/i18n';

const LOGO_URL = 'https://i.imgur.com/Vij12Qd.png';

const C = {
  bg: '#0c0e14',
  card: 'linear-gradient(180deg, #161922 0%, #11131b 100%)',
  border: '#262a36',
  accent: '#c9a84c',
  accentLight: '#e3c977',
  accentBg: 'rgba(201,168,76,0.12)',
  text: '#e8e9ed',
  textMuted: '#9a9ca8',
  inputBg: '#0f1118',
  negative: '#ef6a6a',
  negativeBg: 'rgba(239,106,106,0.10)',
};

export default function LoginPage() {
  const [lang, setLang] = useState<Lang>('pt');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(1100px 600px at 50% -10%, rgba(201,168,76,0.10), transparent), ${C.bg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: '40px 32px 32px',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
        }}
      >
        <img src={LOGO_URL} alt="Visit Braga" style={{ height: 48, width: 'auto', marginBottom: 16 }} />

        <div style={{ fontSize: 12, color: C.accentLight, letterSpacing: '0.04em', marginBottom: 4 }}>
          {t('Observatório de Reputação', 'Reputation Observatory')}
        </div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 22 }}>
          {t('Acesso reservado à equipa', 'Team access only')}
        </div>

        {/* Toggle de idioma */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
          {(['pt', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pickLang(l)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 15px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                transition: 'all 0.2s',
                border: `1px solid ${lang === l ? C.accent : C.border}`,
                background: lang === l ? C.accentBg : 'transparent',
                color: lang === l ? C.accentLight : C.textMuted,
              }}
            >
              <img
                src={`https://flagcdn.com/${l === 'pt' ? 'pt' : 'gb'}.svg`}
                alt=""
                width={20}
                height={14}
                style={{ borderRadius: 2, objectFit: 'cover', display: 'block' }}
              />
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Palavra-passe */}
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={t('Palavra-passe', 'Password')}
          autoFocus
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: 10,
            border: `1px solid ${error ? C.negative : C.border}`,
            background: C.inputBg,
            color: C.text,
            fontSize: 14,
            outline: 'none',
            marginBottom: 12,
          }}
        />

        {error && (
          <div
            style={{
              fontSize: 12.5,
              color: C.negative,
              background: C.negativeBg,
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 12,
            }}
          >
            {t('Palavra-passe incorreta. Tenta novamente.', 'Incorrect password. Please try again.')}
          </div>
        )}
 
        <button
          type="button"
          onClick={submit}
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: 'none',
            cursor: loading || !password ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            background: loading || !password ? '#3a3320' : C.accent,
            color: loading || !password ? C.textMuted : '#1a1505',
            transition: 'all 0.2s',
          }}
        >
          {loading ? t('A entrar…', 'Signing in…') : t('Entrar', 'Sign in')}
        </button>

        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 20, lineHeight: 1.5 }}>
          {t('Município de Braga · Divisão de Turismo', 'Braga City Council · Tourism Division')}
        </div>
      </div>
    </div>
  );
}