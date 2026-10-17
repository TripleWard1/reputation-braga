import { NextRequest, NextResponse } from 'next/server';
import { eAdmin, ipDe } from '@/app/lib/sessao-servidor';

// Pesquisa por voz: recebe o áudio gravado no browser e devolve o texto, transcrito pelo Whisper (Groq).
// A chave fica só no servidor (GROQ_KEY). O áudio não é guardado: segue diretamente para a transcrição.
// Limites para uso público: tamanho do ficheiro, duração implícita e número de pedidos por endereço.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024; // ~1 minuto de voz em Opus
const JANELA_MS = 10 * 60 * 1000;
const MAX_PEDIDOS = 15;
const MAX_GLOBAL = 300;
const PEDIDOS = new Map<string, number[]>();
let globais: number[] = [];

// Vocabulário do destino: ajuda o modelo a escrever corretamente nomes próprios e termos técnicos
const VOCABULARIO = 'Braga, Bom Jesus do Monte, Sameiro, Santa Luzia, Sé de Braga, Theatro Circo, gnration, Avenida da Liberdade, Jardim de Santa Bárbara, Parque da Ponte, Tibães, Visit Braga, INSTO, ONU Turismo, INE, TravelBI, TUB, RevPAR, ADR, dormidas, hóspedes, estada média, taxa turística, Alojamento Local, Rede INSTO, Green Destinations, World Travel Awards, FITUR, BTL, Caminhos de Santiago, Galiza.';

function excede(ip: string): boolean {
  const agora = Date.now();
  globais = globais.filter((x) => agora - x < JANELA_MS);
  if (globais.length >= MAX_GLOBAL) return true;
  PEDIDOS.forEach((v, k) => { const r = v.filter((x) => agora - x < JANELA_MS); if (r.length) PEDIDOS.set(k, r); else PEDIDOS.delete(k); });
  const l = PEDIDOS.get(ip) || [];
  if (l.length >= MAX_PEDIDOS) return true;
  l.push(agora); PEDIDOS.set(ip, l); globais.push(agora);
  return false;
}

export async function POST(req: NextRequest) {
  // Só pedidos feitos a partir da própria plataforma
  const origem = req.headers.get('origin');
  if (origem && origem !== req.nextUrl.origin) return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 });
  if (!(await eAdmin(req)) && excede(ipDe(req))) {
    return NextResponse.json({ erro: 'Muitos pedidos seguidos. Tente de novo dentro de alguns minutos. / Too many requests. Please try again in a few minutes.' }, { status: 429 });
  }
  const apiKey = process.env.GROQ_KEY;
  if (!apiKey) return NextResponse.json({ erro: 'GROQ_KEY não está configurada no servidor.' }, { status: 500 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 }); }
  const audio = form.get('audio');
  if (!(audio instanceof Blob) || audio.size < 800) return NextResponse.json({ erro: 'Sem áudio.' }, { status: 400 });
  if (audio.size > MAX_BYTES) return NextResponse.json({ erro: 'Gravação demasiado longa.' }, { status: 413 });
  const lingua = String(form.get('lingua') || 'pt');
  const idioma = lingua === 'en' ? 'en' : lingua === 'es' ? 'es' : 'pt';
  const tipo = (audio.type || 'audio/webm').split(';')[0];
  const ext = tipo.includes('mp4') || tipo.includes('m4a') || tipo.includes('aac') ? 'm4a' : tipo.includes('ogg') ? 'ogg' : tipo.includes('wav') ? 'wav' : 'webm';

  const envio = new FormData();
  envio.append('file', audio, `voz.${ext}`);
  envio.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3');
  envio.append('language', idioma);
  envio.append('temperature', '0');
  envio.append('response_format', 'json');
  envio.append('prompt', VOCABULARIO);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: envio });
    if (res.status === 429) return NextResponse.json({ erro: 'Limite de transcrições atingido. Tente dentro de um minuto.' }, { status: 429 });
    if (!res.ok) return NextResponse.json({ erro: `Transcrição indisponível (${res.status}).` }, { status: 502 });
    const data = await res.json();
    const texto = typeof data?.text === 'string' ? data.text.trim() : '';
    return NextResponse.json({ texto }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ erro: 'Não foi possível contactar o serviço de transcrição.' }, { status: 502 });
  }
}
