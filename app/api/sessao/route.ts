import { NextRequest, NextResponse } from 'next/server';
import { eAdmin, protecaoAtiva } from '@/app/lib/sessao-servidor';

// Diz ao browser se quem está a ver é administrador (cookie de sessão assinado e válido).
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  return NextResponse.json({ admin: await eAdmin(req), protecao: protecaoAtiva() }, { headers: { 'Cache-Control': 'no-store' } });
}
