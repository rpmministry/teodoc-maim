import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' });

export metadata: Metadata = {
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(msg, url, line, col, error) {
                alert('🔴 ERROR JS\\nArchivo: ' + url + '\\nMsg: ' + msg + '\\nLínea: ' + line + ':' + col);
                return false;
              };
              window.addEventListener('unhandledrejection', function(e) {
                alert('🔴 PROMESA RECHAZADA: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}