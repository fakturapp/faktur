'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/invoices': 'Factures',
  '/dashboard/quotes': 'Devis',
  '/dashboard/clients': 'Clients',
  '/dashboard/company': 'Entreprise',
  '/dashboard/team': 'Equipe',
  '/dashboard/account': 'Parametres',
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
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-base font-medium">{routeTitles[title] || 'Dashboard'}</h1>
      </div>
    </header>
  )
}
