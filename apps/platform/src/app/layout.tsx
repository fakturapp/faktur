import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Faktur Developer Platform',
  description:
    'Gérez vos clés API et webhooks Faktur depuis un seul endroit. Connexion OAuth, sélection de team, accès à votre compte sur api.fakturapp.cc.',
  metadataBase: new URL('https://platform.fakturapp.cc'),
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
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="flex min-h-full flex-1 flex-col">{children}</div>
          <ToastProvider placement="top" />
        </AuthProvider>
      </body>
    </html>
  )
}
