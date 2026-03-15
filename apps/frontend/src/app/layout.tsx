import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import { Agentation } from 'agentation'
import './globals.css'
import { Providers } from './providers'

const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' })

export const metadata: Metadata = {
  title: 'Faktur - Facturation gratuite',
  description: 'Professional invoicing and quoting software, 100% free.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('faktur_theme')||'dark';if(t==='system')t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.classList.add(t)})()`,
          }}
        />
      </head>
      <body className={`${lexend.className} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
