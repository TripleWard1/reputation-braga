import { ICONES_VB } from '@/app/lib/icones-vb';

// Ícone VB 180×180 servido em /vb-180.png (endereço fixo, sem parâmetros), para a app instalada no telemóvel.
export const dynamic = 'force-static';

export async function GET() {
  return new Response(Buffer.from(ICONES_VB['180'], 'base64'), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
