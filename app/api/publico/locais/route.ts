import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';

// Versão leve dos dados para o público: os locais SEM os textos dos comentários (só servem para reanalisar,
// o que é tarefa do administrador). Todos os números públicos vêm das estatísticas e da análise já guardadas.
// A resposta fica em cache na rede da Vercel durante 15 minutos: o Firestore é lido no máximo ~4 vezes por hora,
// independentemente do número de visitantes.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snap = await getDocs(collection(db, 'locations'));
    const locais: Record<string, unknown>[] = [];
    snap.forEach((d) => {
      const dados = d.data() as Record<string, unknown>;
      const { reviews, ...resto } = dados;
      locais.push({ ...resto, id: (resto.id as string) || d.id, reviews: [], nTextos: Array.isArray(reviews) ? reviews.length : 0 });
    });
    return NextResponse.json(
      { locais, geradoEm: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400' } },
    );
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message || 'Erro ao ler os dados.' }, { status: 502 });
  }
}
