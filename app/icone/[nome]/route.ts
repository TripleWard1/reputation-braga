import { ICONES_VB } from '@/app/lib/icones-vb';

// Ícone VB servido a partir do código (/icone/vb-512.png, vb-192.png, vb-180.png, vb-32.png).
// Assim a app instalada no telemóvel mostra sempre o logótipo, mesmo que os PNG da pasta public faltem.
export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(ICONES_VB).map((n) => ({ nome: `vb-${n}.png` }));
}

export async function GET(_req: Request, ctx: { params: { nome: string } }) {
  const m = /^vb-(\d+)\.png$/.exec(ctx.params.nome || '');
  const b64 = m ? ICONES_VB[m[1]] : undefined;
  if (!b64) return new Response('Não encontrado', { status: 404 });
  return new Response(Buffer.from(b64, 'base64'), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
