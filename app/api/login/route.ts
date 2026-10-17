import { NextRequest, NextResponse } from 'next/server';
import { NOME_COOKIE, DURACAO_S, configurada, igualSeguro, criarValorSessao, bloqueado, registarFalha, limpar, ipDe } from '@/app/lib/sessao-servidor';

// Valida a palavra-passe do lado do SERVIDOR (nunca vai para o browser) e cria um cookie de sessão
// assinado, httpOnly e com validade. Falha fechada: sem configuração, em produção ninguém entra.
export const dynamic = 'force-dynamic';

const SEM_CACHE = { 'Cache-Control': 'no-store' };

export async function POST(req: NextRequest) {
  const PASS = process.env.APP_PASSWORD;

  if (!configurada() || !PASS) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.json({ ok: true }, { headers: SEM_CACHE });
    return NextResponse.json({ ok: false, erro: 'config' }, { status: 503, headers: SEM_CACHE });
  }

  const ip = ipDe(req);
  const espera = bloqueado(ip);
  if (espera > 0) {
    return NextResponse.json({ ok: false, erro: 'limite' }, { status: 429, headers: { ...SEM_CACHE, 'Retry-After': String(espera) } });
  }

  let password = '';
  try {
    const body = await req.json();
    if (body && typeof body.password === 'string') password = body.password.slice(0, 256);
  } catch {
    password = '';
  }

  if (!igualSeguro(password, PASS)) {
    registarFalha(ip);
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false }, { status: 401, headers: SEM_CACHE });
  }

  limpar(ip);
  const res = NextResponse.json({ ok: true }, { headers: SEM_CACHE });
  res.cookies.set(NOME_COOKIE, await criarValorSessao(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_S,
  });
  return res;
}
