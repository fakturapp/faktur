import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { Agentation } from 'agentation'
import './globals.css'
import { Providers } from './providers'

const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' })

export const metadata: Metadata = {
  title: 'Faktur - Facturation gratuite',
  description: 'Professional invoicing and quoting software, 100% free.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark h-full overflow-hidden">
      <body className={`${lexend.className} h-full antialiased`}>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
