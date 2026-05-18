import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { PLATFORM_URL } from '@/lib/oauth-config'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Faktur Developer Platform',
  description:
    'Gérez vos clés API et webhooks Faktur depuis un seul endroit. Connexion OAuth, sélection de team, accès à votre compte sur l’API Faktur.',
  metadataBase: new URL(PLATFORM_URL),
  openGraph: {
    title: 'Faktur Developer Platform',
    description: 'Plateforme développeur Faktur.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" />
      </head>
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-full flex-1 flex-col">{children}</div>
            <ToastProvider placement="top" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
