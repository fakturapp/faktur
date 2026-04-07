'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { Star, Bug, MessageSquare, ShieldCheck } from 'lucide-react'

interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

interface BugReportItem {
  id: string
  subject: string
  severity: string
  status: string
  createdAt: string
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

export default function AdminOverviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [bugReports, setBugReports] = useState<BugReportItem[]>([])
  const [oauthStats, setOauthStats] = useState<{ apps: number; sessions: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/dashboard')
      return
    }
    Promise.all([
      api.get<{ feedbacks: FeedbackItem[] }>('/admin/feedbacks'),
      api.get<{ bugReports: BugReportItem[] }>('/admin/bug-reports'),
      api.get<{ apps: Array<{ isActive: boolean; activeSessions: number }> }>('/admin/oauth-apps'),
    ]).then(([fb, br, oa]) => {
      if (fb.data?.feedbacks) setFeedbacks(fb.data.feedbacks)
      if (br.data?.bugReports) setBugReports(br.data.bugReports)
      if (oa.data?.apps) {
        setOauthStats({
          apps: oa.data.apps.filter((a) => a.isActive).length,
          sessions: oa.data.apps.reduce((sum, a) => sum + (a.activeSessions || 0), 0),
        })
      }
      setLoading(false)
    })
  }, [user, router])

  if (!user?.isAdmin) return null

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—'

  const openBugs = bugReports.filter((b) => b.status === 'open' || b.status === 'in_progress').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel administrateur</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-yellow-500/30 transition-colors"
              onClick={() => router.push('/dashboard/admin/feedbacks')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgRating}</p>
                  <p className="text-xs text-muted-foreground">Note moyenne</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => router.push('/dashboard/admin/feedbacks')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{feedbacks.length}</p>
                  <p className="text-xs text-muted-foreground">Avis reçus</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-destructive/30 transition-colors"
              onClick={() => router.push('/dashboard/admin/bugs')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10">
                  <Bug className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{openBugs}</p>
                  <p className="text-xs text-muted-foreground">Bugs ouverts</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-indigo-500/30 transition-colors"
              onClick={() => router.push('/dashboard/admin/oauth-apps')}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500/10">
                  <ShieldCheck className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {oauthStats?.apps ?? 0}
                    {oauthStats && oauthStats.sessions > 0 && (
                      <span className="text-sm text-muted-foreground font-medium"> · {oauthStats.sessions} session{oauthStats.sessions !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Applications OAuth</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent feedbacks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Derniers avis</h2>
              <button
                onClick={() => router.push('/dashboard/admin/feedbacks')}
                className="text-xs text-primary hover:underline"
              >
                Voir tout
              </button>
            </div>
            {feedbacks.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feedbacks.slice(0, 3).map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.03 }}
                    className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            className={cn(
                              'h-3.5 w-3.5',
                              v <= f.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {f.user.fullName || f.user.email}
                      </p>
                    </div>
                    {f.comment && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{f.comment}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent bugs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Derniers bugs</h2>
              <button
                onClick={() => router.push('/dashboard/admin/bugs')}
                className="text-xs text-primary hover:underline"
              >
                Voir tout
              </button>
            </div>
            {bugReports.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Bug className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucun bug signalé</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bugReports.slice(0, 3).map((b, i) => {
                  const severityColors: Record<string, string> = {
                    low: 'bg-blue-500/10 text-blue-500',
                    medium: 'bg-yellow-500/10 text-yellow-500',
                    high: 'bg-orange-500/10 text-orange-500',
                    critical: 'bg-red-500/10 text-red-500',
                  }
                  const statusColors: Record<string, string> = {
                    open: 'bg-yellow-500/10 text-yellow-500',
                    in_progress: 'bg-blue-500/10 text-blue-500',
                    resolved: 'bg-emerald-500/10 text-emerald-500',
                    closed: 'bg-muted text-muted-foreground',
                  }
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.03 }}
                      className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{b.subject}</p>
                        <span className={cn('inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', severityColors[b.severity])}>
                          {b.severity}
                        </span>
                      </div>
                      <span className={cn('inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', statusColors[b.status])}>
                        {b.status === 'open' ? 'Ouvert' : b.status === 'in_progress' ? 'En cours' : b.status === 'resolved' ? 'Résolu' : 'Fermé'}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
