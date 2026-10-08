import type { Metadata } from 'next';
import './globals.css';

// Pré-visualização de links (WhatsApp, LinkedIn, Teams, Facebook, X).
// Sem metadataBase, o Next.js 13.5 escreve o endereço da imagem como localhost e o WhatsApp não a consegue ir buscar.
// A imagem vem de app/opengraph-image.jpg e app/twitter-image.jpg.
// O ícone (VB), o manifesto da app instalada e a cor do tema mantêm-se os de sempre (pasta public).
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://reputation-braga.vercel.app';
const TITULO = 'Observatório de Turismo de Braga';
const DESCRICAO = 'Procura, economia, reputação e sustentabilidade do destino. Município de Braga · Visit Braga.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITULO,
  description: DESCRICAO,
  applicationName: TITULO,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: TITULO,
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
    <html lang="pt" style={{ background: '#0c0e14' }}>
      <head>
        <meta name="theme-color" content="#0c0e14" />
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
      <body style={{ margin: 0, background: '#0c0e14' }}>{children}</body>
    </html>
  );
}
