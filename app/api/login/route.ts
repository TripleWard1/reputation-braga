import { NextRequest, NextResponse } from 'next/server';

// Valida a palavra-passe do lado do SERVIDOR (a palavra-passe nunca vai para o browser)
// e, se estiver certa, cria um cookie de sessão (httpOnly) que dura 30 dias.
export async function POST(req: NextRequest) {
  const PASS = process.env.APP_PASSWORD;
  const TOKEN = process.env.APP_SESSION_TOKEN;

  // Proteção ainda não configurada → aceita (mantém a app aberta, sem trancar ninguém)
  if (!PASS || !TOKEN) {
    return NextResponse.json({ ok: true });
  }

  let password = '';
  try {
    const body = await req.json();
    if (body && typeof body.password === 'string') password = body.password;
  } catch {
    password = '';
  }

  if (password !== PASS) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('rb_session', TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
  return res;
}