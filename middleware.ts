import { NextRequest, NextResponse } from 'next/server';

// Protege o painel com uma página de login própria (/login).
// Os links públicos de monumento (…/?r=<id>) ficam ABERTOS.
//
// A proteção só fica ATIVA quando definires na Vercel:
//   APP_PASSWORD        → a palavra-passe que a equipa vai usar
//   APP_SESSION_TOKEN   → uma string aleatória qualquer (segredo do cookie)
// Sem essas variáveis, a app funciona como hoje (sem login), para nunca trancares por engano.

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1) Link público de monumento → aberto
  if (searchParams.has('r')) return NextResponse.next();

  // 2) A própria página de login → aberta (evita ciclo)
  if (pathname === '/login') return NextResponse.next();

  const PASS = process.env.APP_PASSWORD;
  const TOKEN = process.env.APP_SESSION_TOKEN;

  // 3) Proteção não configurada → mantém aberto
  if (!PASS || !TOKEN) return NextResponse.next();

  // 4) Sessão válida (cookie) → deixa entrar
  const session = req.cookies.get('rb_session')?.value;
  if (session === TOKEN) return NextResponse.next();

  // 5) Sem sessão → mostra a página de login (mantém o URL)
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.rewrite(url);
}

// Corre em todas as rotas EXCETO ficheiros estáticos, imagens, ícones, manifesto e a API
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webmanifest|json|txt|xml)).*)',
  ],
};