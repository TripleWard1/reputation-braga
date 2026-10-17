import { NextRequest, NextResponse } from 'next/server';
import { NOME_COOKIE, sessaoValida } from '@/app/lib/sessao-servidor';

// A plataforma é PÚBLICA para consulta. Só a administração (alterar dados, importar, analisar) exige sessão.
// A proteção das alterações é feita em três sítios: o cookie assinado, as regras do Firestore (Firebase Auth)
// e as rotas do servidor que gastam IA (/api/groq só responde a administradores).

export async function middleware(req: NextRequest) {
  // Quem já tem sessão válida e abre /login volta ao painel
  if (await sessaoValida(req.cookies.get(NOME_COOKIE)?.value)) {
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
