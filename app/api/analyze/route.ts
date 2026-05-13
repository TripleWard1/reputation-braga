import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { locationName, category, reviews } = await req.json();

    const apiKey = 'AIzaSyCKD-NK0_XIEJ0CaY1qOeg1Dh3CIpaQB7w';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analisa estas reviews turísticas do local "${locationName}" (${category}) em Braga, Portugal.

Responde APENAS com JSON válido, sem markdown, sem backticks, sem texto antes ou depois. O JSON deve ter exatamente esta estrutura:
{
  "sentimentScore": <número de 1 a 10>,
  "sentimentBreakdown": {"positive": <percentagem>, "neutral": <percentagem>, "negative": <percentagem>},
  "topThemesPositive": ["tema1", "tema2", "tema3"],
  "topThemesNegative": ["tema1", "tema2", "tema3"],
  "keyIssues": ["problema1", "problema2"],
  "keyPraises": ["elogio1", "elogio2"],
  "actionableInsights": ["sugestão acionável 1", "sugestão acionável 2"],
  "summaryPT": "Resumo de 2-3 frases em português sobre a reputação geral deste local",
  "reviewCount": <número de reviews analisadas>,
  "dimensions": {"localizacao": <1-10>, "servico": <1-10>, "precoQualidade": <1-10>, "limpeza": <1-10>, "experiencia": <1-10>, "acessibilidade": <1-10>}
}

Reviews:
${reviews}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || 'Gemini API error' },
        { status: response.status }
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Falha na análise' }, { status: 500 });
  }
}
