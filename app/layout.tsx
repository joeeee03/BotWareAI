import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { FaviconSwitcher } from '@/components/FaviconSwitcher'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
}

export const metadata: Metadata = {
  title: 'Botware AI - Plataforma Profesional de WhatsApp Business',
  description: 'Botware AI: Plataforma profesional de WhatsApp Business para gestión y comunicación con clientes',
  generator: 'Botware AI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Botware AI',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png?v=1',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon-dark-32x32.png?v=1',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon-light-32x32.png?v=1',
        type: 'image/png',
        sizes: '32x32',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FaviconSwitcher />
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
