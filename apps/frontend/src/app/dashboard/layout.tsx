'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ArrowRightLeft } from 'lucide-react'

interface TeamListItem {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
}

function RouteProgressBar() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      setShow(true)
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="h-0.5 bg-primary origin-left"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)
  const [switchConfirm, setSwitchConfirm] = useState<TeamListItem | null>(null)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    if (user) {
      api.get<{ teams: TeamListItem[] }>('/team/all').then(({ data }) => {
        if (data?.teams) {
          setTeams(data.teams)
          setTeamsLoaded(true)
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

  if (loading || !user) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar skeleton */}
        <div className="w-64 border-r border-border bg-card/50 flex flex-col">
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
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
            <div className="pt-4" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="mx-3 h-px bg-border" />
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-3 px-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 m-2 ml-0 rounded-2xl bg-card/20 border border-border/50 p-8 space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid gap-4 grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentTeam = teams.find((t) => t.isCurrent) || null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
        onLogout={logout}
      />

      <div className={cn('flex-1 flex flex-col overflow-hidden transition-all duration-300', switching && 'blur-sm pointer-events-none')}>
        <RouteProgressBar />

        <main className="flex-1 overflow-y-auto m-2 ml-0 rounded-2xl bg-card/20 border border-border/50">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Team switch confirmation dialog */}
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
                  {switchConfirm.isOwner ? 'Propriétaire' : switchConfirm.role === 'admin' ? 'Administrateur' : 'Membre'}
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

      {/* Switching overlay */}
      <AnimatePresence>
        {switching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
          >
            <Spinner size="lg" className="text-primary" />
            <p className="mt-4 text-sm font-medium text-foreground">
              Changement d&apos;équipe en cours...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
