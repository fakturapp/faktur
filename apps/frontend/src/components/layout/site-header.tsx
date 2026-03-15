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
  '/dashboard/team/create': 'Créer une équipe',
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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="-ml-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-sm font-medium text-muted-foreground">{routeTitles[title] || 'Dashboard'}</h1>
      </div>
    </header>
  )
}
