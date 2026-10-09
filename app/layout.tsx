import type { Metadata } from 'next';
import './globals.css';

// Pré-visualização de links (WhatsApp, LinkedIn, Teams, Facebook, X).
// Sem metadataBase, o Next.js 13.5 escreve o endereço da imagem como localhost e o WhatsApp não a consegue ir buscar.
// A imagem vem de app/opengraph-image.jpg e app/twitter-image.jpg.
// O ícone VB e o manifesto da app instalada são servidos pelo código (app/icone e app/manifesto), para não dependerem da pasta public.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://reputation-braga.vercel.app';
const TITULO = 'Observatório de Turismo de Braga';
const DESCRICAO = 'Procura, economia, reputação e sustentabilidade do destino. Município de Braga · Visit Braga.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITULO,
  description: DESCRICAO,
  applicationName: 'Observatório de Turismo',
  manifest: '/manifesto',
  icons: {
    icon: [
      { url: '/icone/vb-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icone/vb-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/icone/vb-180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Observatório de Turismo',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Visit Braga · Município de Braga',
    title: TITULO,
    description: DESCRICAO,
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRICAO,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" style={{ background: '#0c0e14', margin: 0, padding: 0, colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#0c0e14" />
        <meta name="color-scheme" content="dark" />
        {/* Fundo escuro de ponta a ponta, antes de qualquer outro CSS: evita a moldura branca à volta da plataforma */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{margin:0!important;padding:0!important;background:#0c0e14!important;border:0!important;outline:0!important}html{color-scheme:dark}' }} />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0c0e14', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
