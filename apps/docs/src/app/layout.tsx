import type { Metadata } from 'next'
import './globals.css'
import { DocsNav } from '@/components/docs-nav'
import { DocsFooter } from '@/components/docs-footer'

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
      <body>
        <DocsNav />
        <main className="min-h-screen pt-16">{children}</main>
        <DocsFooter />
      </body>
    </html>
  )
}
