import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'TeoDoc MAIM — Análisis bíblico y materiales de estudio',
    template: '%s · TeoDoc MAIM',
  },
  description: 'Transforma la transcripción de una prédica en un análisis bíblico y en materiales listos para grupos pequeños, jóvenes, niños y devocionales de siete días.',
  applicationName: 'TeoDoc MAIM',
  openGraph: {
    title: 'TeoDoc MAIM — Análisis bíblico y materiales de estudio',
    description: 'De la prédica al estudio que transforma. Cinco modalidades, PDF listo para imprimir y fidelidad al contenido real.',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/institucional/maim-portada.jpg', width: 505, height: 350, alt: 'MAIM Casa de Oración' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeoDoc MAIM',
    description: 'De la prédica al estudio que transforma.',
    images: ['/institucional/maim-portada.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fff8e8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={plex.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
