import type { Metadata } from 'next'
import '@fontsource/sn-pro/400.css'
import '@fontsource/sn-pro/500.css'
import '@fontsource/sn-pro/600.css'
import '@fontsource/sn-pro/700.css'
import { Agentation } from 'agentation'
import './globals.css'
import { Providers } from './providers'
import { PreprodBanner } from '@/components/layout/preprod-banner'
import { IS_PREPROD } from '@/lib/app-env'


export const metadata: Metadata = {
  title: {
    default: 'Faktur - Facturation professionnelle gratuite',
    template: '%s | Faktur',
  },
  description:
    'Faktur simplifie votre facturation. Créez des devis et factures professionnels en quelques clics. Gratuit, sécurisé et conçu pour les entrepreneurs.',
  keywords: [
    'facturation',
    'facture',
    'devis',
    'facturation gratuite',
    'logiciel facturation',
    'facture en ligne',
    'PME',
    'freelance',
    'entrepreneur',
    'gestion commerciale',
  ],
  authors: [{ name: 'Faktur' }],
  creator: 'Faktur',
  publisher: 'Faktur',
  metadataBase: new URL('https://faktur.app'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://faktur.app',
    siteName: 'Faktur',
    title: 'Faktur - Facturation professionnelle gratuite',
    description:
      'Créez des devis et factures professionnels en quelques clics. Gratuit, sécurisé et conçu pour les entrepreneurs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Faktur - Facturation professionnelle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faktur - Facturation professionnelle gratuite',
    description:
      'Créez des devis et factures professionnels en quelques clics. Gratuit et sécurisé.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={IS_PREPROD ? 'preprod' : undefined}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('faktur_theme')||'system';if(t==='system')t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.classList.add(t)})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <PreprodBanner />
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
