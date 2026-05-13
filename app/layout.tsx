import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reputação Braga — Painel de Análise Turística',
  description: 'Análise de reputação online dos pontos turísticos de Braga',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
