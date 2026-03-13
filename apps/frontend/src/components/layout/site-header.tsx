'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { PanelLeft } from 'lucide-react'

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

interface SiteHeaderProps {
  onToggleSidebar?: () => void
}

export function SiteHeader({ onToggleSidebar }: SiteHeaderProps) {
  const pathname = usePathname()

  const title = Object.entries(routeTitles).reduce((acc, [path, t]) => {
    if (pathname.startsWith(path) && path.length > acc.length) {
      return path
    }
    return acc
  }, '/dashboard')

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="-ml-1 flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{routeTitles[title] || 'Dashboard'}</h1>
      </div>
    </header>
  )
}
