import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { TEXTOS } from '@/app/lib/textos-catalogo';

// Tradução espanhola para o público: junta o catálogo de textos (código) com as traduções guardadas no Firestore
// (config/traducao-es, geradas pelo administrador). Em cache 15 minutos na rede da Vercel.
// ?estado=1 devolve só quantos textos estão traduzidos (para mostrar ou não o botão ES).
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const snap = await getDoc(doc(db, 'config', 'traducao-es'));
    const entradas = (snap.exists() ? (snap.data() as any).entradas : null) || {};
    const pares: [string, string][] = [];
    for (const [id, pt] of TEXTOS) { const es = entradas[id]; if (typeof es === 'string' && es.trim()) pares.push([pt, es]); }
    const cache = { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400' };
    if (req.nextUrl.searchParams.get('estado')) return NextResponse.json({ traduzidos: pares.length, total: TEXTOS.length }, { headers: cache });
    return NextResponse.json({ pares, total: TEXTOS.length }, { headers: cache });
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message || 'Erro ao ler a tradução.' }, { status: 502 });
  }
}
