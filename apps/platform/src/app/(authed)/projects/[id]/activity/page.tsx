'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
  FolderMinus,
  Pencil,
  RefreshCw,
  RotateCw,
  Send,
  Terminal,
  Trash2,
  Webhook,
  Key,
  KeyRound,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { apiProjectsClient, type AuditLogShape } from '@/lib/api-projects-client'

interface ActionMeta {
  icon: React.ElementType
  label: string
  tone: 'success' | 'warning' | 'danger' | 'muted' | 'accent'
}

const ACTIONS: Record<string, ActionMeta> = {
  'project.created': { icon: FolderPlus, label: 'Projet créé', tone: 'success' },
  'project.updated': { icon: Pencil, label: 'Projet modifié', tone: 'muted' },
  'project.archived': { icon: Archive, label: 'Projet archivé', tone: 'warning' },
  'project.unarchived': { icon: ArchiveRestore, label: 'Projet désarchivé', tone: 'muted' },
  'project.deleted': { icon: FolderMinus, label: 'Projet supprimé', tone: 'danger' },
  'api_key.created': { icon: FilePlus, label: 'Clé API créée', tone: 'success' },
  'api_key.rotated': { icon: RotateCw, label: 'Clé API rotée', tone: 'warning' },
  'api_key.updated': { icon: Pencil, label: 'Clé API modifiée', tone: 'muted' },
  'api_key.revoked': { icon: Trash2, label: 'Clé API révoquée', tone: 'danger' },
  'webhook.configured': { icon: Webhook, label: 'Webhook configuré', tone: 'success' },
  'webhook.updated': { icon: Pencil, label: 'Webhook modifié', tone: 'muted' },
  'webhook.deleted': { icon: Trash2, label: 'Webhook supprimé', tone: 'danger' },
  'webhook.secret_rotated': { icon: KeyRound, label: 'Secret webhook roté', tone: 'warning' },
  'webhook.tested': { icon: Send, label: 'Webhook testé', tone: 'accent' },
  'api_explorer.request': { icon: Terminal, label: 'Requête Explorer', tone: 'accent' },
}

const TONE_RING: Record<ActionMeta['tone'], string> = {
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  muted: 'bg-surface-secondary text-muted-foreground ring-border',
  accent: 'bg-accent-soft text-accent ring-accent/20',
}

const TONE_BADGE: Record<ActionMeta['tone'], 'success' | 'warning' | 'destructive' | 'muted' | 'soft'> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  muted: 'muted',
  accent: 'soft',
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString()
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, Math.floor((now - then) / 1000))
  if (diff < 60) return `il y a ${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString()
}

function initials(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.trim() || '?'
  const parts = src.split(/\s+|@/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'project', label: 'Projet' },
  { id: 'api_key', label: 'Clés' },
  { id: 'webhook', label: 'Webhooks' },
  { id: 'explorer', label: 'Explorer' },
] as const

type Category = (typeof CATEGORIES)[number]['id']

function statusToneText(status: number): string {
  if (status === 0) return 'text-danger'
  if (status >= 500) return 'text-danger'
  if (status >= 400) return 'text-warning'
  if (status >= 300) return 'text-accent'
  return 'text-success'
}

export default function ActivityPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLogShape[] | null>(null)
  const [category, setCategory] = useState<Category>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  async function load() {
    setLogs(null)
    const res = await apiProjectsClient.auditLogs(params.id, { limit: 200 })
    if (res.error) {
      toast(res.error, 'error')
      setLogs([])
      return
    }
    setLogs(res.data?.data ?? [])
  }

  useEffect(() => {
    load()
  }, [params.id])

  function toggleExpand(id: number) {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = (logs ?? []).filter((l) => {
    if (category === 'all') return true
    return l.target_type === category
  })

  const grouped: Array<{ day: string; items: AuditLogShape[] }> = []
  for (const log of filtered) {
    const day = new Date(log.created_at).toDateString()
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) last.items.push(log)
    else grouped.push({ day, items: [log] })
  }

  function dayLabel(day: string): string {
    const d = new Date(day)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (d.toDateString() === yesterday.toDateString()) return 'Hier'
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground">Activité</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Historique des actions effectuées sur ce projet et ses clés.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={logs === null}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Actualiser
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              category === c.id
                ? 'bg-accent-soft text-foreground'
                : 'text-muted-foreground hover:bg-surface-hover'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {logs === null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">Aucun événement</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les actions effectuées sur ce projet apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.day}>
              <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {dayLabel(g.day)}
              </p>
              <Card className="border-border/50">
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {g.items.map((log) => {
                      const meta = ACTIONS[log.action] ?? {
                        icon: AlertTriangle,
                        label: log.action,
                        tone: 'muted' as const,
                      }
                      const Icon = meta.icon
                      const isOpen = expanded.has(log.id)
                      const hasMetadata = Object.keys(log.metadata ?? {}).length > 0
                      return (
                        <div key={log.id}>
                          <button
                            type="button"
                            onClick={() => toggleExpand(log.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${TONE_RING[meta.tone]}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {meta.label}
                                </p>
                                {log.action === 'api_explorer.request' &&
                                typeof log.metadata?.method === 'string' &&
                                typeof log.metadata?.path === 'string' ? (
                                  <>
                                    <code className="font-mono text-xs font-semibold text-foreground">
                                      {String(log.metadata.method)}
                                    </code>
                                    <code className="truncate font-mono text-xs text-muted-foreground">
                                      {String(log.metadata.path)}
                                    </code>
                                    {typeof log.metadata?.status === 'number' && (
                                      <span
                                        className={`font-mono text-xs font-semibold ${statusToneText(log.metadata.status as number)}`}
                                      >
                                        {(log.metadata.status as number) || 'ERR'}
                                      </span>
                                    )}
                                    {typeof log.metadata?.latency_ms === 'number' && (
                                      <span className="text-[11px] text-muted-foreground">
                                        {log.metadata.latency_ms as number}ms
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  log.target_label && (
                                    <Badge variant={TONE_BADGE[meta.tone]} size="sm">
                                      {log.target_label}
                                    </Badge>
                                  )
                                )}
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[9px] font-semibold text-accent">
                                    {initials(log.actor.name, log.actor.email)}
                                  </span>
                                  {log.actor.name ?? log.actor.email ?? 'Système'}
                                </span>
                                <span aria-hidden>•</span>
                                <span title={fmtTime(log.created_at)}>
                                  {fmtRelative(log.created_at)}
                                </span>
                                {log.ip && (
                                  <>
                                    <span aria-hidden>•</span>
                                    <code className="font-mono">{log.ip}</code>
                                  </>
                                )}
                              </div>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                isOpen ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="border-t border-border/50 bg-surface px-4 py-3 space-y-2">
                              <DetailRow label="Action">
                                <code className="font-mono text-xs">{log.action}</code>
                              </DetailRow>
                              <DetailRow label="Cible">
                                <span className="text-xs">
                                  {log.target_type}
                                  {log.target_id && (
                                    <code className="ml-1.5 font-mono text-muted-foreground">
                                      {log.target_id.slice(0, 8)}…
                                    </code>
                                  )}
                                </span>
                              </DetailRow>
                              <DetailRow label="Auteur">
                                <span className="text-xs">
                                  {log.actor.name ?? '—'}{' '}
                                  {log.actor.email && (
                                    <span className="text-muted-foreground">
                                      &lt;{log.actor.email}&gt;
                                    </span>
                                  )}
                                </span>
                              </DetailRow>
                              <DetailRow label="Horodatage">
                                <span className="text-xs">{fmtTime(log.created_at)}</span>
                              </DetailRow>
                              {log.ip && (
                                <DetailRow label="IP">
                                  <code className="font-mono text-xs">{log.ip}</code>
                                </DetailRow>
                              )}
                              {log.user_agent && (
                                <DetailRow label="User-Agent">
                                  <code className="break-all font-mono text-[11px]">
                                    {log.user_agent}
                                  </code>
                                </DetailRow>
                              )}
                              {hasMetadata && (
                                <div>
                                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Détails
                                  </p>
                                  <pre className="max-h-64 overflow-auto rounded-md border border-border/50 bg-background p-2 text-[11px] leading-relaxed">
                                    <code>{JSON.stringify(log.metadata, null, 2)}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px,1fr] gap-3 items-start">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
