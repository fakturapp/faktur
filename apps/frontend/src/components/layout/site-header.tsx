'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/invoices': 'Factures',
  '/dashboard/invoices/new': 'Nouvelle facture',
  '/dashboard/quotes': 'Devis',
  '/dashboard/quotes/new': 'Nouveau devis',
  '/dashboard/clients': 'Clients',
  '/dashboard/clients/create': 'Nouveau client',
  '/dashboard/company': 'Entreprise',
  '/dashboard/team': 'Equipe',
  '/dashboard/team/create': 'Creer une equipe',
  '/dashboard/account': 'Mon compte',
  '/dashboard/settings/invoices': 'Facturation',
}

export function SiteHeader() {
  const pathname = usePathname()

  const title = Object.entries(routeTitles).reduce((acc, [path, t]) => {
    if (pathname.startsWith(path) && path.length > acc.length) {
      return path
    }
    return acc
  }, '/dashboard')

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-semibold">{routeTitles[title] || 'Dashboard'}</h1>
      </div>
    </header>
  )
}
