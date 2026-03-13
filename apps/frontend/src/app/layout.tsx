import type { Metadata } from 'next'
import { Agentation } from 'agentation'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Faktur - Facturation gratuite',
  description: 'Professional invoicing and quoting software, 100% free.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
