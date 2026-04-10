'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { RouteProgressBar } from '@/components/layout/route-progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { InvoiceSettingsProvider } from '@/lib/invoice-settings-context'
import { CompanySettingsProvider } from '@/lib/company-settings-context'
import { EmailProvider } from '@/lib/email-context'
import { ArrowRightLeft, LogOut, Check } from 'lucide-react'
import { FeedbackModal } from '@/components/modals/feedback-modal'
import { BugReportModal } from '@/components/modals/bug-report-modal'
import { isFakturDesktop } from '@/lib/is-desktop'
import { usePageView } from '@/hooks/use-page-view'
import { initWebVitals } from '@/lib/web-vitals'
import { useAnalyticsContext } from '@/lib/analytics'

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
  const { trackPerformance } = useAnalyticsContext()
  usePageView()

  useEffect(() => {
    initWebVitals(trackPerformance)
  }, [trackPerformance])
  const [isPopup, setIsPopup] = useState(false)
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [switchConfirm, setSwitchConfirm] = useState<TeamListItem | null>(null)
  const [switching, setSwitching] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarBadges, setSidebarBadges] = useState<Record<string, number>>({})
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutWipeAll, setLogoutWipeAll] = useState(false)
  const [isDesktopRuntime, setIsDesktopRuntime] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [bugReportOpen, setBugReportOpen] = useState(false)

  useEffect(() => {
    setIsDesktopRuntime(isFakturDesktop())
  }, [])

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
    const wipeAll = logoutWipeAll
    setLogoutConfirm(false)
    setLoggingOut(true)
    await logout({ wipeAll })
    setLogoutWipeAll(false)
  }

  function openLogoutConfirm() {
    setLogoutWipeAll(false)
    setLogoutConfirm(true)
  }

  async function confirmSwitchTeam() {
    if (!switchConfirm) return
    setSwitchConfirm(null)
    setSwitching(true)

    const { error } = await api.post('/team/switch', { teamId: switchConfirm.id })
    if (!error) {
      try {
        const keys = Object.keys(localStorage)
        for (const key of keys) {
          if (key.startsWith('faktur_invoice') || key.startsWith('faktur_quote') || key.startsWith('faktur_credit')) {
            localStorage.removeItem(key)
          }
        }
      } catch {}
      window.location.href = '/dashboard'
      return
    }

    setSwitching(false)
  }

  if (loading) {
    return (
      <div className="relative h-screen overflow-hidden bg-background">
        {}
        <div className="fixed left-0 top-0 z-40 w-(--sidebar-width) h-screen rounded-r-[2rem] bg-sidebar border-r border-sidebar-border shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          </div>
          <div className="mx-3 h-px bg-border" />
          <div className="flex-1 px-3 py-2 space-y-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
            <div className="pt-3" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
          <div className="mx-3 h-px bg-border" />
          <div className="p-2.5">
            <div className="flex items-center gap-2.5 px-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="h-screen flex flex-col overflow-hidden bg-background pl-(--sidebar-width)">
          <div className="h-(--header-height) shrink-0 border-b border-border" />
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

  if (isPopup) {
    return (
      <InvoiceSettingsProvider>
      <CompanySettingsProvider>
      <EmailProvider>
        <div className="min-h-screen bg-background">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </EmailProvider>
      </CompanySettingsProvider>
      </InvoiceSettingsProvider>
    )
  }

  const currentTeam = teams.find((t) => t.isCurrent) || null

  return (
    <InvoiceSettingsProvider>
    <CompanySettingsProvider>
    <EmailProvider>
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Fond derrière les arrondis de la sidebar */}
      <div className={cn('fixed inset-y-0 left-0 z-30 bg-sidebar transition-[width] duration-300 ease-out', sidebarCollapsed ? 'w-16' : 'w-(--sidebar-width)')} aria-hidden="true" />

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
        onLogout={openLogoutConfirm}
        collapsed={sidebarCollapsed}
        badges={sidebarBadges}
        isAdmin={user.isAdmin}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenBugReport={() => setBugReportOpen(true)}
      />

      <div
        className={cn(
          'relative flex min-w-0 min-h-0 h-screen flex-col transition-[padding] duration-300 ease-out overflow-hidden bg-background',
          sidebarCollapsed ? 'pl-16' : 'pl-(--sidebar-width)',
          switching && 'blur-sm pointer-events-none'
        )}
      >
        <SiteHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <RouteProgressBar />

        <main className="relative flex-1 overflow-y-auto">
          {/* Dégradé animé — orbes répartis sur toute la page */}
          <div className="pointer-events-none fixed top-0 left-(--sidebar-width) right-0 h-screen overflow-hidden" aria-hidden="true">
            {/* Haut gauche — indigo principal */}
            <div className="absolute -top-40 -left-24 h-[550px] w-[550px] rounded-full bg-[#5957e8]/[0.06] blur-[120px] animate-[gradient-drift_14s_ease-in-out_infinite]" />
            {/* Haut centre-droit — violet */}
            <div className="absolute -top-20 right-[20%] h-[400px] w-[450px] rounded-full bg-[#7c5ce8]/[0.04] blur-[100px] animate-[gradient-drift_18s_ease-in-out_infinite_reverse]" />
            {/* Centre gauche — lavande */}
            <div className="absolute top-[30%] -left-16 h-[350px] w-[400px] rounded-full bg-[#a78bfa]/[0.035] blur-[110px] animate-[gradient-drift_20s_ease-in-out_infinite]" />
            {/* Centre droit — indigo doux */}
            <div className="absolute top-[40%] right-[10%] h-[300px] w-[350px] rounded-full bg-[#5957e8]/[0.03] blur-[100px] animate-[gradient-drift_16s_ease-in-out_infinite_reverse]" />
            {/* Bas — violet diffus */}
            <div className="absolute bottom-[5%] left-[30%] h-[350px] w-[400px] rounded-full bg-[#7c5ce8]/[0.03] blur-[110px] animate-[gradient-drift_22s_ease-in-out_infinite]" />
          </div>
          <div className="relative @container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </main>
      </div>

      {}
      <Dialog open={!!switchConfirm} onClose={() => setSwitchConfirm(null)}>
        <DialogHeader onClose={() => setSwitchConfirm(null)} icon={<ArrowRightLeft className="h-5 w-5 text-accent" />}>
          <DialogTitle>Changer d&apos;équipe</DialogTitle>
          <DialogDescription>Basculer vers une autre équipe</DialogDescription>
        </DialogHeader>

        {switchConfirm && (
          <div className="rounded-lg shadow-surface bg-surface p-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent font-semibold">
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

      {}
      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)}>
        <DialogHeader showClose={false} icon={<LogOut className="h-5 w-5 text-danger" />}>
          <DialogTitle>Se déconnecter</DialogTitle>
          <DialogDescription>Vous allez être déconnecté de votre compte</DialogDescription>
        </DialogHeader>

        {isDesktopRuntime && (
          <div className="mb-4 mt-2">
            <label
              htmlFor="logout-wipe-all"
              className="group flex cursor-pointer items-start gap-3 rounded-xl shadow-surface bg-surface p-3.5 transition-colors hover:bg-surface-hover"
            >
              <input
                id="logout-wipe-all"
                type="checkbox"
                checked={logoutWipeAll}
                onChange={(e) => setLogoutWipeAll(e.target.checked)}
                className="sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
                  logoutWipeAll
                    ? 'border-destructive bg-destructive shadow-[0_0_0_4px_rgba(239,68,68,0.12)]'
                    : 'border-border bg-transparent group-hover:border-destructive/50'
                )}
              >
                <AnimatePresence>
                  {logoutWipeAll && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -45, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      className="flex"
                    >
                      <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  Effacer aussi mes données locales
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Cookies, thème, langue, préférences et historiques navigateur
                  seront supprimés. Sinon, seules les clés d&apos;authentification
                  (jetons, sessions, refresh) sont effacées.
                </p>
              </div>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setLogoutConfirm(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmLogout}>
            Se déconnecter
          </Button>
        </DialogFooter>
      </Dialog>

      {}
      <AnimatePresence>
        {(switching || loggingOut) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
          >
            <Spinner size="lg" className="text-accent" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {loggingOut ? 'Deconnexion en cours...' : "Changement d\u0027equipe en cours..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <BugReportModal open={bugReportOpen} onClose={() => setBugReportOpen(false)} />
    </div>
    </EmailProvider>
    </CompanySettingsProvider>
    </InvoiceSettingsProvider>
  )
}
