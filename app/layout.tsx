import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex',
});

export const metadata: Metadata = {
  title: 'TeoDoc — Analizador Ministerial',
  description: 'Transcripción instantánea y extracción de estructura teológica impulsada por IA.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={plex.variable}>
      <head>
        {/* Caveat (lettering) por CDN: no bloquea el build si falla la descarga */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#161616] text-[#f4f4f4]">
        {children}
      </body>
    </html>
  );
}
