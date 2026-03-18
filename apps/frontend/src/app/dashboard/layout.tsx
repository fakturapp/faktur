'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { RouteProgressBar } from '@/components/layout/route-progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { InvoiceSettingsProvider } from '@/lib/invoice-settings-context'
import { EmailProvider } from '@/lib/email-context'
import { ArrowRightLeft, LogOut } from 'lucide-react'

interface TeamListItem {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isPopup, setIsPopup] = useState(false)
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [switchConfirm, setSwitchConfirm] = useState<TeamListItem | null>(null)
  const [switching, setSwitching] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarBadges, setSidebarBadges] = useState<Record<string, number>>({})
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsPopup(params.get('popup') === 'true')
  }, [pathname])

  useEffect(() => {
    if (user) {
      api.get<{ teams: TeamListItem[] }>('/team/all').then(({ data }) => {
        if (data?.teams) {
          setTeams(data.teams)
          setTeamsLoaded(true)
        }
      })
      api.get<{ quoteDrafts: number; invoiceDrafts: number }>('/dashboard/sidebar-counts').then(({ data }) => {
        if (data) {
          setSidebarBadges({
            '/dashboard/quotes/drafts': data.quoteDrafts,
            '/dashboard/invoices/drafts': data.invoiceDrafts,
          })
        }
      })
    }
  }, [user?.currentTeamId])

  function handleSwitchTeam(teamId: string) {
    const team = teams.find((t) => t.id === teamId)
    if (team && !team.isCurrent) {
      setSwitchConfirm(team)
    }
  }

  async function confirmLogout() {
    setLogoutConfirm(false)
    setLoggingOut(true)
    await logout()
  }

  async function confirmSwitchTeam() {
    if (!switchConfirm) return
    setSwitchConfirm(null)
    setSwitching(true)

    const { error } = await api.post('/team/switch', { teamId: switchConfirm.id })
    if (!error) {
      await refreshUser()
      const { data } = await api.get<{ teams: TeamListItem[] }>('/team/all')
      if (data?.teams) setTeams(data.teams)
      router.refresh()
    }

    setSwitching(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-sidebar">
        <div className="w-(--sidebar-width) bg-sidebar flex flex-col">
          <div className="px-3 py-3">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          </div>
          <div className="mx-3 h-px bg-border" />
          <div className="flex-1 px-3 py-3 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
            <div className="pt-4" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="mx-3 h-px bg-border" />
          <div className="p-3">
            <div className="flex items-center gap-3 px-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden md:m-2 md:ml-0 md:rounded-xl md:shadow-sm bg-background">
          <div className="h-(--header-height) border-b border-border shrink-0" />
          <div className="flex-1 p-6 space-y-6">
            <div className="grid gap-4 grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Popup mode: minimal layout without sidebar/header (used for client creation popup)
  if (isPopup) {
    return (
      <InvoiceSettingsProvider>
      <EmailProvider>
        <div className="min-h-screen bg-background">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </EmailProvider>
      </InvoiceSettingsProvider>
    )
  }

  const currentTeam = teams.find((t) => t.isCurrent) || null

  return (
    <InvoiceSettingsProvider>
    <EmailProvider>
    <div className="flex h-screen overflow-hidden bg-sidebar">
      <Sidebar
        teams={teams}
        currentTeam={currentTeam}
        teamsLoaded={teamsLoaded}
        onSwitchTeam={handleSwitchTeam}
        user={{
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        onLogout={() => setLogoutConfirm(true)}
        collapsed={sidebarCollapsed}
        badges={sidebarBadges}
      />

      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col bg-background transition-all duration-200 ease-linear overflow-hidden',
          'md:m-2 md:ml-0 md:rounded-xl md:shadow-sm',
          sidebarCollapsed && 'md:ml-2',
          switching && 'blur-sm pointer-events-none'
        )}
      >
        <SiteHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <RouteProgressBar />

        <main className="flex-1 overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </main>
      </div>

      {/* Team switch confirmation */}
      <Dialog open={!!switchConfirm} onClose={() => setSwitchConfirm(null)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <div>
            <DialogTitle>Changer d&apos;équipe</DialogTitle>
            <DialogDescription className="mt-0">
              Basculer vers une autre équipe
            </DialogDescription>
          </div>
        </div>

        {switchConfirm && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                {switchConfirm.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{switchConfirm.name}</p>
                <p className="text-xs text-muted-foreground">
                  {switchConfirm.isOwner ? 'Proprietaire' : switchConfirm.role === 'admin' ? 'Administrateur' : 'Membre'}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setSwitchConfirm(null)}>
            Annuler
          </Button>
          <Button onClick={confirmSwitchTeam}>
            Confirmer
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Logout confirmation */}
      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <DialogTitle>Se deconnecter</DialogTitle>
            <DialogDescription className="mt-0">
              Vous allez etre deconnecte de votre compte
            </DialogDescription>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setLogoutConfirm(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmLogout}>
            Se deconnecter
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Switching overlay */}
      <AnimatePresence>
        {(switching || loggingOut) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
          >
            <Spinner size="lg" className="text-primary" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {loggingOut ? 'Deconnexion en cours...' : "Changement d\u0027equipe en cours..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </EmailProvider>
    </InvoiceSettingsProvider>
  )
}
