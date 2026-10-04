import { NextRequest, NextResponse } from 'next/server';

// Diz ao browser se quem está a ver é administrador (cookie de sessão válido).
// Sem APP_PASSWORD/APP_SESSION_TOKEN configurados, a proteção está desligada e todos são administradores (comportamento antigo).
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const PASS = process.env.APP_PASSWORD;
  const TOKEN = process.env.APP_SESSION_TOKEN;
  if (!PASS || !TOKEN) return NextResponse.json({ admin: true, protecao: false });
  const admin = req.cookies.get('rb_session')?.value === TOKEN;
  return NextResponse.json({ admin, protecao: true }, { headers: { 'Cache-Control': 'no-store' } });
}
