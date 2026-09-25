import { NextRequest, NextResponse } from 'next/server';

// Proxy serverless para o Groq. A chave fica SÓ no servidor (GROQ_KEY),
// nunca é enviada para o browser. O cliente chama /api/groq com { messages }.
//
// O MODELO É DECIDIDO AQUI, no servidor — o valor enviado pelo browser é ignorado.
// Para mudar de modelo (ex.: quando o Groq descontinuar o atual), basta definir a
// variável de ambiente GROQ_MODEL na Vercel e fazer redeploy — sem tocar no código.
// Histórico: llama-3.3-70b-versatile foi desligado pelo Groq a 16/08/2026.
export const runtime = 'nodejs';

const MODELO_PADRAO = 'openai/gpt-oss-120b';

export async function POST(req: NextRequest) {
  // Aceita GROQ_KEY (recomendado, server-side) com fallback à antiga durante a transição.
  const apiKey = process.env.GROQ_KEY || process.env.NEXT_PUBLIC_GROQ_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_KEY não está configurada no servidor.' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido.' }, { status: 400 });
  }

  const model = process.env.GROQ_MODEL || MODELO_PADRAO;
  const payload: Record<string, unknown> = { ...body, model };
  // Os modelos gpt-oss "pensam" antes de responder; esforço baixo = mais rápido e
  // gasta menos do limite gratuito, sem perda relevante para resumos e classificação.
  if (model.startsWith('openai/gpt-oss') && payload.reasoning_effort === undefined) {
    payload.reasoning_effort = 'low';
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    // Reencaminha a resposta tal como vem (incluindo o status, ex.: 429, 413),
    // para o cliente manter o mesmo tratamento de erros.
    const text = await res.text();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const retry = res.headers.get('retry-after');
    if (retry) headers['retry-after'] = retry; // permite ao cliente esperar o tempo certo antes de repetir
    return new NextResponse(text, { status: res.status, headers });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Erro ao contactar o Groq.' },
      { status: 502 }
    );
  }
}
