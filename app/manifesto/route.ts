// Manifesto da app instalada (ecrã principal do telemóvel): nome «Observatório de Turismo» e ícone VB.
export const dynamic = 'force-static';

const MANIFESTO = {
  name: 'Observatório de Turismo de Braga',
  short_name: 'Observatório de Turismo',
  description: 'Procura, economia, reputação e sustentabilidade do destino. Município de Braga · Visit Braga.',
  id: '/',
  lang: 'pt-PT',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#000000',
  theme_color: '#0c0e14',
  icons: [
    { src: '/icone/vb-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icone/vb-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icone/vb-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

export async function GET() {
  return new Response(JSON.stringify(MANIFESTO), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
