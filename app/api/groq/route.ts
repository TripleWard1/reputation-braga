import { NextRequest, NextResponse } from 'next/server';

// Proxy serverless para o Groq. A chave fica SÓ no servidor (GROQ_KEY),
// nunca é enviada para o browser. O cliente chama /api/groq com { model, messages }.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Aceita GROQ_KEY (recomendado, server-side) com fallback à antiga durante a transição.
  const apiKey = process.env.GROQ_KEY || process.env.NEXT_PUBLIC_GROQ_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_KEY não está configurada no servidor.' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido.' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    // Reencaminha a resposta tal como vem (incluindo o status, ex.: 429, 413),
    // para o cliente manter o mesmo tratamento de erros.
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Erro ao contactar o Groq.' },
      { status: 502 }
    );
  }
}