import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Caveat } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex',
});

// Caveat autoalojada (mismo origen): necesaria para incrustar el lettering en el PNG.
const hand = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hand',
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
    <html lang="es" className={`${plex.variable} ${hand.variable}`}>
      <body className="font-sans antialiased bg-[#161616] text-[#f4f4f4]">
        {children}
      </body>
    </html>
  );
}
