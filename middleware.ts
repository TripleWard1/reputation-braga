import { NextRequest, NextResponse } from 'next/server';

// A plataforma é PÚBLICA para consulta. Só a administração (alterar dados, importar, analisar) exige sessão.
// A proteção das alterações é feita em três sítios: este cookie, as regras do Firestore (Firebase Auth)
// e as rotas do servidor que gastam IA (/api/groq só responde a administradores).
//
// Variáveis na Vercel (já existentes): APP_PASSWORD, APP_SESSION_TOKEN.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const TOKEN = process.env.APP_SESSION_TOKEN;
  // Quem já tem sessão e abre /login volta ao painel
  if (pathname === '/login' && TOKEN && req.cookies.get('rb_session')?.value === TOKEN) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login'],
};
