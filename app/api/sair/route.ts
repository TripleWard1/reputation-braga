import { NextResponse } from 'next/server';

// Termina a sessão de administração (apaga o cookie).
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('rb_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
