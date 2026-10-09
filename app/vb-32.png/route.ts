import { ICONES_VB } from '@/app/lib/icones-vb';

// Ícone VB 32×32 servido em /vb-32.png (endereço fixo, sem parâmetros), para a app instalada no telemóvel.
export const dynamic = 'force-static';

export async function GET() {
  return new Response(Buffer.from(ICONES_VB['32'], 'base64'), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
