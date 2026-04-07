'use client'

import * as React from 'react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { SettingsSearchModal } from '@/components/settings/settings-search-modal'
import { PanelLeft, Search } from 'lucide-react'

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
  '/dashboard/settings': 'Paramètres',
  '/dashboard/settings/company': 'Informations',
  '/dashboard/settings/company/bank': 'Banque',
  '/dashboard/settings/company/payment': 'Paiement',
  '/dashboard/settings/members': 'Membres',
  '/dashboard/settings/documents/invoices': 'Apparence',
  '/dashboard/settings/documents/invoices/options': 'Options',
  '/dashboard/settings/documents/invoices/defaults': 'Valeurs par défaut',
  '/dashboard/settings/documents/invoices/e-invoicing': 'E-Facturation',
  '/dashboard/settings/documents/invoices/ai': 'Faktur AI',
  '/dashboard/settings/email/accounts': 'Comptes email',
  '/dashboard/settings/reminders': 'Relances',
  '/dashboard/settings/invoices': 'Facturation',
  '/dashboard/settings/email': 'Email',
}

interface SiteHeaderProps {
  onToggleSidebar?: () => void
}

export function SiteHeader({ onToggleSidebar }: SiteHeaderProps) {
  const pathname = usePathname()
  const [settingsSearchOpen, setSettingsSearchOpen] = useState(false)
  const isSettings = pathname.startsWith('/dashboard/settings')

  // Ctrl+K shortcut for settings search
  React.useEffect(() => {
    if (!isSettings) return
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSettingsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSettings])

  const title = Object.entries(routeTitles).reduce((acc, [path, t]) => {
    if (pathname.startsWith(path) && path.length > acc.length) {
      return path
    }
    return acc
  }, '/dashboard')

  return (
    <header className="relative flex h-(--header-height) shrink-0 items-center gap-2 bg-background border-b border-border transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="-ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all duration-200"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4 opacity-30" />
        <h1 className="text-[13px] font-medium text-muted-foreground">{routeTitles[title] || 'Dashboard'}</h1>

        {/* Settings search bar - absolutely centered in navbar */}
        {isSettings && (
          <>
            <div className="absolute left-1/2 -translate-x-1/2">
              <button
                onClick={() => setSettingsSearchOpen(true)}
                className="flex items-center gap-2.5 rounded-full border border-border/50 bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 hover:border-border hover:text-foreground transition-all duration-200 shadow-sm"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline text-xs">Rechercher dans les paramètres...</span>
                <span className="sm:hidden text-xs">Rechercher...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded-md border border-border/50 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                  Ctrl K
                </kbd>
              </button>
            </div>
            <SettingsSearchModal open={settingsSearchOpen} onClose={() => setSettingsSearchOpen(false)} />
          </>
        )}
      </div>
    </header>
  )
}
