import type { Metadata } from 'next'
import { Agentation } from "agentation";
import './globals.css'
import { DocsHeader } from '@/components/docs-header'
import { DocsFooter } from '@/components/docs-footer'
import { ThemeScript } from './theme-script'

export const metadata: Metadata = {
  title: 'Faktur Developers — API V2',
  description:
    'Automate Faktur — invoices, quotes, clients, and webhooks — with a modern REST API.',
  metadataBase: new URL('https://developers.fakturapp.cc'),
  openGraph: {
    title: 'Faktur Developers',
    description: 'Build automations on top of Faktur.',
    url: 'https://developers.fakturapp.cc',
    siteName: 'Faktur Developers',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faktur Developers',
    description: 'Build automations on top of Faktur.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <DocsHeader />
        <div className="pt-14">{children}</div>
        <DocsFooter />
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  )
}
