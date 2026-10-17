import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: { default: 'Observatório de Turismo de Braga', template: '%s · Observatório de Turismo de Braga' },
  description: 'Procura, economia, sustentabilidade e reputação do destino Braga, reunidos numa só plataforma. Município de Braga.',
  applicationName: 'Observatório de Turismo de Braga',
  icons: { icon: [{ url: '/vb-32.png', sizes: '32x32', type: 'image/png' }], apple: [{ url: '/vb-180.png', sizes: '180x180' }] },
  manifest: '/manifesto',
};

export const viewport: Viewport = {
  themeColor: '#0c0e14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  )
}
