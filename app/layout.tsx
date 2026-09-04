import type { Metadata, Viewport } from 'next'
import { Inter, Lora } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TeoDoc · Analizador de Prédicas',
  description:
    'Sube el audio de una enseñanza y recibe un reporte infográfico con la idea principal, el desarrollo, los versículos citados y una oración pastoral.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f2f4f8',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`light bg-background ${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">{children}</body>
      <Script
        src="https://upload-widget.cloudinary.com/latest/global/all.js"
        strategy="beforeInteractive"
      />
    </html>
  )
}
