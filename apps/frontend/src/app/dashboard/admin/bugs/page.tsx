'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { FormSelect } from '@/components/ui/dropdown'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Bug, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'

interface BugReportItem {
  id: string
  subject: string
  description: string
  stepsToReproduce: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500',
}

const severityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
}

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3.5 w-3.5" />,
  in_progress: <Clock className="h-3.5 w-3.5" />,
  resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
  closed: <XCircle className="h-3.5 w-3.5" />,
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  resolved: 'bg-emerald-500/10 text-emerald-500',
  closed: 'bg-muted text-muted-foreground',
}

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminBugsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bugReports, setBugReports] = useState<BugReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/dashboard')
      return
    }
    api.get<{ bugReports: BugReportItem[] }>('/admin/bug-reports').then(({ data, error }) => {
      if (data?.bugReports) setBugReports(data.bugReports)
      if (error) toast(error, 'error')
      setLoading(false)
    })
  }, [user, router])

  async function updateBugStatus(id: string, status: string) {
    setUpdatingStatus(id)
    const { data, error } = await api.patch<{ bugReport: BugReportItem }>(`/admin/bug-reports/${id}`, { status })
    if (error) {
      toast(error, 'error')
    } else if (data?.bugReport) {
      setBugReports((prev) => prev.map((b) => (b.id === id ? { ...b, status: data.bugReport.status } : b)))
    }
    setUpdatingStatus(null)
  }

  if (!user?.isAdmin) return null

  const openCount = bugReports.filter((b) => b.status === 'open' || b.status === 'in_progress').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rapports de bugs</h1>
        <p className="text-sm text-muted-foreground">
          {bugReports.length} rapports — {openCount} ouverts
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : bugReports.length === 0 ? (
        <div className="text-center py-20">
          <Bug className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun bug signalé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bugReports.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{b.subject}</h3>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', severityColors[b.severity])}>
                      {severityLabels[b.severity]}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', statusColors[b.status])}>
                      {statusIcons[b.status]}
                      {statusLabels[b.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={b.user.avatarUrl}
                      alt={b.user.fullName || b.user.email}
                      fallback={
                        b.user.fullName
                          ? b.user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                          : b.user.email.slice(0, 2).toUpperCase()
                      }
                      size="sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {b.user.fullName || b.user.email} — {formatDate(b.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-foreground/80">{b.description}</p>
                  {b.stepsToReproduce && (
                    <div className="mt-2 rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Étapes pour reproduire :</p>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{b.stepsToReproduce}</p>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <FormSelect
                    value={b.status}
                    onChange={(v) => updateBugStatus(b.id, v)}
                    disabled={updatingStatus === b.id}
                    className="w-32 text-xs"
                    showCheck={false}
                    options={[
                      { value: 'open', label: 'Ouvert' },
                      { value: 'in_progress', label: 'En cours' },
                      { value: 'resolved', label: 'Résolu' },
                      { value: 'closed', label: 'Fermé' },
                    ]}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
