import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import Script from 'next/script'; // IMPORTACIÓN AÑADIDA PARA ERUDA

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'TeoDoc - Analizador Ministerial',
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
    <html lang="es" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        {children}
        
        {/* SCRIPTS DE ERUDA PARA DEPURACIÓN MÓVIL EN PANTALLA */}
        <Script 
          src="https://cdn.jsdelivr.net/npm/eruda" 
          strategy="beforeInteractive" 
        />
        <Script 
          id="eruda-init" 
          strategy="afterInteractive"
        >
          {`eruda.init();`}
        </Script>
      </body>
    </html>
  );
}