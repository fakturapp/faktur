'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { useTranslation } from '@/lib/i18n'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { ChartRevenue } from '@/components/dashboard/chart-revenue'
import { AddChartSidebar, type ChartKey } from '@/components/dashboard/add-chart-sidebar'
import { ChartMonthly } from '@/components/dashboard/chart-monthly'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Plus,
  X,
  DollarSign,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  GripVertical,
  RotateCcw,
  ArrowUpRight,
  FileText,
  Receipt,
  Clock,
  Pencil,
  Check,
  Users,
  AlertTriangle,
  Files,
  Zap,
  Calendar,
  Gift,
} from 'lucide-react'
import { AiDashboardSummary } from '@/components/ai/ai-dashboard-summary'
import TextType from '@/components/ui/text-type'

function pickAdaptiveGreeting(firstName: string | undefined): string {
  const name = firstName ? `, ${firstName}` : ''
  const hour = new Date().getHours()
  let pool: string[]
  if (hour < 5) {
    pool = [
      `Bonne nuit${name}`,
      `Encore au travail${name} ?`,
      `Vous brûlez la chandelle${name}`,
      `Insomniaque productif${name} ?`,
      `Il est tard${name}`,
      `La nuit porte conseil${name}`,
      `Petite session nocturne${name} ?`,
      `Le monde dort, pas vous${name}`,
      `Bonsoir noctambule${name}`,
      `Le silence de la nuit${name}`,
      `On finalise une facture${name} ?`,
      `Vous êtes du genre couche-tard${name}`,
      `Café ou thé${name} ?`,
      `Fan des heures tranquilles${name} ?`,
      `Personne pour vous déranger${name}`,
      `La nuit, tout est plus calme${name}`,
      `Encore quelques minutes${name} ?`,
      `Ne veillez pas trop tard${name}`,
      `Votre dashboard ne dort jamais${name}`,
      `Prêt à boucler la journée${name} ?`,
    ]
  } else if (hour < 12) {
    pool = [
      `Bonjour${name}`,
      `Bon retour${name}`,
      `Content de vous revoir${name}`,
      `Heureux de vous voir${name}`,
      `Belle matinée${name}`,
      `Salut${name}`,
      `Coucou${name}`,
      `Hello${name}`,
      `Ravi de vous revoir${name}`,
      `Bienvenue${name}`,
      `Quel plaisir${name}`,
      `Bonne journée${name}`,
      `Prêt à attaquer la journée${name} ?`,
      `On démarre fort${name} ?`,
      `Première facture du jour${name} ?`,
      `Le café est servi${name}`,
      `Une nouvelle journée${name}`,
      `Que la journée commence${name}`,
      `Au boulot${name}`,
      `Belle journée en perspective${name}`,
    ]
  } else if (hour < 18) {
    pool = [
      `Bon après-midi${name}`,
      `Content de vous revoir${name}`,
      `Heureux de vous voir${name}`,
      `Bon retour${name}`,
      `De retour${name} ?`,
      `Pause bien méritée${name} ?`,
      `Comment se passe la journée${name} ?`,
      `Toujours en forme${name} ?`,
      `On continue sur la lancée${name} ?`,
      `Plein de motivation${name} ?`,
      `L'après-midi est à vous${name}`,
      `On enchaîne${name} ?`,
      `Productif aujourd'hui${name} ?`,
      `Une petite facture${name} ?`,
      `Le rythme est bon${name}`,
      `Bonne journée${name}`,
      `Tenez bon${name}`,
      `Gardez le cap${name}`,
      `On avance${name} ?`,
      `Presque l'heure du goûter${name}`,
    ]
  } else if (hour < 22) {
    pool = [
      `Bonsoir${name}`,
      `Bon retour${name}`,
      `Heureux de vous revoir${name}`,
      `Belle soirée${name}`,
      `La journée s'achève${name}`,
      `On finit en beauté${name} ?`,
      `Une dernière facture${name} ?`,
      `Bonne soirée${name}`,
      `Vous êtes courageux${name}`,
      `Encore au taquet${name}`,
      `On boucle la journée${name} ?`,
      `Fin de journée bien remplie${name} ?`,
      `Plus que quelques minutes${name} ?`,
      `Une soirée tranquille${name} ?`,
      `Le soleil se couche${name}`,
      `Bilan de la journée${name} ?`,
      `Prêt pour une dernière tâche${name} ?`,
      `Bientôt l'heure de souffler${name}`,
      `On termine en douceur${name}`,
      `Une bonne journée de plus${name}`,
    ]
  } else {
    pool = [
      `Bonsoir${name}`,
      `Vous travaillez tard${name}`,
      `Encore là${name} ?`,
      `Il se fait tard${name}`,
      `Une dernière vérification${name} ?`,
      `Pensez à vous reposer${name}`,
      `Toujours sur le pont${name} ?`,
      `La nuit tombe${name}`,
      `Doucement avec les heures sup${name}`,
      `Faktur veille avec vous${name}`,
      `Plus que quelques clics${name} ?`,
      `On ne lâche rien${name}`,
      `Le calme du soir${name}`,
      `Vous méritez du repos${name}`,
      `Bientôt au lit${name} ?`,
      `Une dernière facture pour la route${name} ?`,
      `Encore un effort${name}`,
      `Demain est un autre jour${name}`,
      `N'oubliez pas de dormir${name}`,
      `Bonne fin de soirée${name}`,
    ]
  }
  return pool[Math.floor(Math.random() * pool.length)] + ' !'
}

interface DashboardStats {
  totalInvoiced: { value: number; trend: number; previousValue: number }
  outstanding: { value: number; trend: number }
  totalCollected: { value: number; trend: number; previousValue: number }
}

interface RecentItem {
  id: string
  type: 'invoice' | 'quote'
  number: string
  clientName: string
  amount: number
  status: string
  date: string
}

interface RevenueDataPoint {
  date: string
  factures: number
  devis: number
}

interface MonthlyDataPoint {
  month: string
  label: string
  subtotal: number
  total: number
  count: number
}

interface MicroDataPoint {
  month: string
  label: string
  subtotal: number
  cumulative: number
  count: number
  thresholdServices: number
  thresholdGoods: number
}

const CHARTS_KEY = 'zenvoice_active_charts'
const LAYOUT_KEY = 'zenvoice_dashboard_layout_v2'

type BlockId =
  | 'welcome'
  | 'ai-summary'
  | 'stat-invoiced'
  | 'stat-outstanding'
  | 'stat-collected'
  | 'latest-invoice'
  | 'quick-actions'
  | 'drafts'
  | 'overdue'
  | 'this-year'
  | 'shortcuts'
  | 'chart-revenue'
  | 'recent-activity'
  | `chart-${ChartKey}`

const DEFAULT_LAYOUT: BlockId[] = [
  'welcome',
  'stat-invoiced',
  'stat-outstanding',
  'stat-collected',
  'latest-invoice',
  'quick-actions',
  'drafts',
  'overdue',
  'this-year',
  'ai-summary',
  'chart-revenue',
  'recent-activity',
  'shortcuts',
]

// Each block declares its footprint in the 4-column grid. `span` is the
// number of columns it occupies (1..4), `rowSpan` its row height.
const BLOCK_SPAN: Record<string, { span: 1 | 2 | 3 | 4; rowSpan: 1 | 2 }> = {
  welcome: { span: 4, rowSpan: 1 },
  'ai-summary': { span: 4, rowSpan: 1 },
  'stat-invoiced': { span: 1, rowSpan: 1 },
  'stat-outstanding': { span: 1, rowSpan: 1 },
  'stat-collected': { span: 1, rowSpan: 1 },
  'latest-invoice': { span: 1, rowSpan: 1 },
  'quick-actions': { span: 2, rowSpan: 1 },
  'drafts': { span: 1, rowSpan: 1 },
  'overdue': { span: 1, rowSpan: 1 },
  'this-year': { span: 2, rowSpan: 1 },
  'shortcuts': { span: 2, rowSpan: 1 },
  'chart-revenue': { span: 2, rowSpan: 2 },
  'recent-activity': { span: 2, rowSpan: 2 },
}

function spanClass(id: BlockId) {
  const cfg = BLOCK_SPAN[id] ?? { span: 2, rowSpan: 2 }
  const col = cfg.span === 4
    ? 'md:col-span-2 lg:col-span-4'
    : cfg.span === 3
    ? 'md:col-span-2 lg:col-span-3'
    : cfg.span === 2
    ? 'md:col-span-2 lg:col-span-2'
    : 'md:col-span-1 lg:col-span-1'
  const row = cfg.rowSpan === 2 ? 'lg:row-span-2' : ''
  return `${col} ${row}`
}

function loadLayout(): BlockId[] {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    const saved = localStorage.getItem(LAYOUT_KEY)
    if (!saved) return DEFAULT_LAYOUT
    const parsed = JSON.parse(saved) as BlockId[]
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAYOUT
    // Append any new default blocks the user doesn't have yet (keeps their
    // custom order while surfacing freshly-shipped cards).
    const missing = DEFAULT_LAYOUT.filter((id) => !parsed.includes(id))
    return missing.length > 0 ? [...parsed, ...missing] : parsed
  } catch {
    return DEFAULT_LAYOUT
  }
}

function saveLayout(layout: BlockId[]) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {}
}

function loadActiveCharts(): ChartKey[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CHARTS_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveActiveCharts(charts: ChartKey[]) {
  try {
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts))
  } catch {}
}

function formatCurrency(amount: number, locale: string) {
  return amount.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
  })
}

function formatDate(dateStr: string, locale: string) {
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

/* ─────────────── Bento block shell with drag handlers ─────────────── */

interface BentoBlockProps {
  id: BlockId
  editMode: boolean
  onDragStart: (id: BlockId) => void
  onDragOver: (id: BlockId) => void
  onDrop: () => void
  onDragEnd: () => void
  isDragging: boolean
  isDragOver: boolean
  children: React.ReactNode
  className?: string
}

function BentoBlock({
  id,
  editMode,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  children,
  className,
}: BentoBlockProps) {
  // Outer motion.div handles the FLIP layout animation when the grid
  // reorders; the inner div is the real drag target so HTML5 drag events
  // don't collide with framer-motion's own pan gesture props.
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      className={cn('relative', spanClass(id), className)}
    >
      <div
        draggable={editMode}
        onDragStart={
          editMode
            ? (e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id)
                onDragStart(id)
              }
            : undefined
        }
        onDragOver={
          editMode
            ? (e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                onDragOver(id)
              }
            : undefined
        }
        onDrop={
          editMode
            ? (e) => {
                e.preventDefault()
                onDrop()
              }
            : undefined
        }
        onDragEnd={editMode ? () => onDragEnd() : undefined}
        className={cn(
          'group/block relative w-full h-full rounded-xl bg-card shadow-surface overflow-hidden transition-all duration-200 hover:shadow-md hover:bg-surface-hover/50',
          editMode
            ? 'border border-dashed border-accent/40 cursor-grab active:cursor-grabbing hover:border-accent/70'
            : '',
          isDragging && 'opacity-40 scale-[0.98]',
          isDragOver && 'ring-2 ring-accent/60 ring-offset-2 ring-offset-background'
        )}
      >
        {/* Drag handle — visible only in edit mode */}
        {editMode && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-background/90 backdrop-blur-sm border border-border/50 text-primary shadow-sm">
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
        {children}
      </div>
    </motion.div>
  )
}

/* ─────────────── Individual block renderers ─────────────── */

function StatBlock({
  label,
  value,
  trend,
  description,
  previousValue,
  isSnapshot,
  theme,
}: {
  label: string
  value: string
  trend: number
  description: string
  previousValue?: string
  isSnapshot?: boolean
  theme: 'indigo' | 'amber' | 'emerald'
}) {
  const themes = {
    indigo: {
      grad: 'from-accent-soft/80 via-accent-soft/30 to-transparent',
      accent: 'bg-accent-soft text-accent ring-accent/20',
      trendBg: 'bg-accent-soft text-accent-soft-foreground',
      icon: DollarSign,
    },
    amber: {
      grad: 'from-warning-soft/80 via-warning-soft/30 to-transparent',
      accent: 'bg-warning-soft text-warning ring-warning/20',
      trendBg: 'bg-warning-soft text-warning-soft-foreground',
      icon: AlertCircle,
    },
    emerald: {
      grad: 'from-success-soft/80 via-success-soft/30 to-transparent',
      accent: 'bg-success-soft text-success ring-success/20',
      trendBg: 'bg-success-soft text-success-soft-foreground',
      icon: Wallet,
    },
  }
  const t = themes[theme]
  const Icon = t.icon
  return (
    <div className={cn('relative h-full bg-gradient-to-br p-5 flex flex-col', t.grad)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {!isSnapshot && (
          <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border', t.trendBg)}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums text-foreground leading-tight">{value}</div>
      <div className="mt-auto pt-2 text-[11px] text-muted-foreground">
        {description}
        {previousValue && <div className="mt-0.5 text-[10px] opacity-70">{previousValue}</div>}
      </div>
      <div className={cn('absolute -right-4 -bottom-4 h-20 w-20 rounded-xl ring-1 flex items-center justify-center opacity-15 rotate-12', t.accent)}>
        <Icon className="h-10 w-10" />
      </div>
    </div>
  )
}

function LatestInvoiceBlock({
  item,
  locale,
  t,
}: {
  item: RecentItem | null
  locale: string
  t: (key: string) => string
}) {
  if (!item) {
    return (
      <div className="relative h-full p-5 flex flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          {t('dashboard.latestInvoice')}
        </span>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.noInvoiceYet')}</p>
          <Link
            href="/dashboard/invoices/new"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> {t('dashboard.createFirst')}
          </Link>
        </div>
      </div>
    )
  }
  const Icon = item.type === 'invoice' ? FileText : Receipt
  return (
    <Link
      href={`/dashboard/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`}
      className="relative h-full p-5 flex flex-col group/latest hover:bg-muted/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('dashboard.latestInvoice')}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/latest:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.number}</p>
          <p className="text-xs text-muted-foreground truncate">{item.clientName}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(item.amount, locale)}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(item.date, locale)}
          </div>
        </div>
        <Badge variant={statusVariant(item.status)} className="text-[10px]">
          {t(`dashboard.statuses.${item.status}`) || item.status}
        </Badge>
      </div>
    </Link>
  )
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'muted' {
  switch (status) {
    case 'paid':
    case 'accepted':
      return 'success'
    case 'overdue':
    case 'rejected':
      return 'destructive'
    case 'pending':
      return 'warning'
    case 'draft':
      return 'muted'
    default:
      return 'default'
  }
}

function QuickActionsBlock({ t }: { t: (key: string) => string }) {
  const actions = [
    {
      href: '/dashboard/invoices/new',
      icon: FileText,
      label: t('dashboard.quickActions.newInvoice') || 'Nouvelle facture',
      color: 'bg-accent-soft text-accent',
    },
    {
      href: '/dashboard/quotes/new',
      icon: Receipt,
      label: t('dashboard.quickActions.newQuote') || 'Nouveau devis',
      color: 'bg-warning-soft text-warning-soft-foreground',
    },
    {
      href: '/dashboard/clients',
      icon: Users,
      label: t('dashboard.quickActions.newClient') || 'Nouveau client',
      color: 'bg-success-soft text-success-soft-foreground',
    },
  ]
  return (
    <div className="h-full p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Zap className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.quickActions.title') || 'Actions rapides'}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 rounded-lg bg-surface shadow-surface hover:bg-surface-hover transition-all p-3 group/action"
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover/action:scale-110', action.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium text-center text-foreground leading-tight">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function DraftsBlock({
  invoiceDrafts,
  quoteDrafts,
  t,
}: {
  invoiceDrafts: number
  quoteDrafts: number
  t: (key: string) => string
}) {
  const total = invoiceDrafts + quoteDrafts
  return (
    <Link href="/dashboard/invoices/drafts" className="relative h-full p-5 flex flex-col group/drafts bg-gradient-to-br from-surface via-surface/50 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('dashboard.drafts.title') || 'Brouillons'}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/drafts:opacity-100 transition-opacity" />
      </div>
      <div className="text-3xl font-bold tabular-nums text-foreground leading-none">{total}</div>
      <div className="mt-auto pt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" /> {invoiceDrafts} {t('dashboard.drafts.invoices') || 'fact.'}
        </span>
        <span className="flex items-center gap-1">
          <Receipt className="h-3 w-3" /> {quoteDrafts} {t('dashboard.drafts.quotes') || 'devis'}
        </span>
      </div>
      <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-xl bg-surface text-muted-foreground ring-1 ring-border flex items-center justify-center opacity-15 rotate-12">
        <Files className="h-10 w-10" />
      </div>
    </Link>
  )
}

function OverdueBlock({
  count,
  amount,
  locale,
  t,
}: {
  count: number
  amount: number
  locale: string
  t: (key: string) => string
}) {
  const hasOverdue = count > 0
  return (
    <Link
      href="/dashboard/invoices"
      className={cn(
        'relative h-full p-5 flex flex-col group/overdue bg-gradient-to-br',
        hasOverdue
          ? 'from-danger-soft/80 via-danger-soft/30 to-transparent'
          : 'from-success-soft/80 via-success-soft/30 to-transparent'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('dashboard.overdue.title') || 'En retard'}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/overdue:opacity-100 transition-opacity" />
      </div>
      <div className={cn('text-3xl font-bold tabular-nums leading-none', hasOverdue ? 'text-danger' : 'text-success')}>{count}</div>
      <div className="mt-auto pt-3 text-[11px] text-muted-foreground">
        {hasOverdue
          ? `${formatCurrency(amount, locale)} ${t('dashboard.overdue.toRecover') || 'à récupérer'}`
          : t('dashboard.overdue.allClear') || 'Tout est en règle'}
      </div>
      <div className={cn(
        'absolute -right-4 -bottom-4 h-20 w-20 rounded-xl ring-1 flex items-center justify-center opacity-15 rotate-12',
        hasOverdue ? 'bg-danger-soft text-danger ring-danger/20' : 'bg-success-soft text-success ring-success/20'
      )}>
        <AlertTriangle className="h-10 w-10" />
      </div>
    </Link>
  )
}

function ThisYearBlock({
  value,
  count,
  locale,
  t,
}: {
  value: number
  count: number
  locale: string
  t: (key: string) => string
}) {
  return (
    <div className="relative h-full p-5 flex flex-col bg-gradient-to-br from-accent-soft/80 via-accent-soft/30 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
          <Calendar className="h-3.5 w-3.5" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('dashboard.thisYear.title') || "Cette année"}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-3xl font-bold tabular-nums text-foreground leading-tight">{formatCurrency(value, locale)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {count} {t('dashboard.thisYear.invoices') || 'facture(s) émise(s)'}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{new Date().getFullYear()}</div>
      </div>
    </div>
  )
}

function ShortcutsBlock() {
  const shortcuts = [
    { href: '/dashboard/clients', icon: Users, label: 'Clients' },
    { href: '/dashboard/products', icon: Files, label: 'Produits' },
    { href: '/dashboard/recurring-invoices', icon: Clock, label: 'Récurrences' },
    { href: '/dashboard/expenses', icon: Wallet, label: 'Dépenses' },
  ]
  return (
    <div className="h-full p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Raccourcis</h3>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {shortcuts.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-surface shadow-surface hover:bg-surface-hover transition-all p-2 group/sc"
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover/sc:text-primary transition-colors" />
              <span className="text-[10px] font-medium text-foreground leading-tight text-center">{s.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function RecentActivityBlock({
  items,
  locale,
  t,
}: {
  items: RecentItem[]
  locale: string
  t: (key: string) => string
}) {
  return (
    <div className="h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.recentActivity.title')}</h3>
        <Link href="/dashboard/invoices" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {t('dashboard.viewAll') || 'Tout voir'}
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.recentActivity.empty')}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
          {items.slice(0, 6).map((item) => {
            const Icon = item.type === 'invoice' ? FileText : Receipt
            return (
              <Link
                key={item.id}
                href={`/dashboard/${item.type === 'invoice' ? 'invoices' : 'quotes'}/${item.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{item.number}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold tabular-nums text-foreground">{formatCurrency(item.amount, locale)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(item.date, locale)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────── Main page ─────────────── */

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, locale } = useTranslation()
  const { settings } = useInvoiceSettings()
  const aiEnabled = settings.aiEnabled
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>([])
  const [chartData, setChartData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [addChartOpen, setAddChartOpen] = useState(false)
  const [activeCharts, setActiveCharts] = useState<ChartKey[]>(loadActiveCharts)
  const [layout, setLayout] = useState<BlockId[]>(loadLayout)
  const [editMode, setEditMode] = useState(false)
  const [sidebarCounts, setSidebarCounts] = useState<{ invoiceDrafts: number; quoteDrafts: number }>({ invoiceDrafts: 0, quoteDrafts: 0 })
  const [greeting, setGreeting] = useState<string>(' ')

  useEffect(() => {
    setGreeting(pickAdaptiveGreeting(user?.fullName?.split(' ')[0]))
  }, [user?.fullName])

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<BlockId | null>(null)
  const [dragOverId, setDragOverId] = useState<BlockId | null>(null)
  const pendingLayoutRef = useRef<BlockId[] | null>(null)

  // Chart data states
  const [revenueData, setRevenueData] = useState<MonthlyDataPoint[]>([])
  const [collectedData, setCollectedData] = useState<MonthlyDataPoint[]>([])
  const [microData, setMicroData] = useState<MicroDataPoint[]>([])

  useEffect(() => {
    loadDashboard()
    api.get<{ invoiceDrafts: number; quoteDrafts: number }>('/dashboard/sidebar-counts').then(({ data }) => {
      if (data) setSidebarCounts(data)
    })
  }, [])


  // Ensure dynamic chart blocks appear in the layout when toggled on
  useEffect(() => {
    setLayout((prev) => {
      const wanted = activeCharts.map((k) => `chart-${k}` as BlockId)
      const next = [...prev]
      let changed = false
      for (const id of wanted) {
        if (!next.includes(id)) {
          next.push(id)
          changed = true
        }
      }
      // Remove chart blocks that were toggled off
      const filtered = next.filter((id) => {
        if (!id.startsWith('chart-') || id === 'chart-revenue') return true
        const k = id.replace('chart-', '') as ChartKey
        return activeCharts.includes(k)
      })
      if (filtered.length !== next.length) changed = true
      if (changed) saveLayout(filtered)
      return changed ? filtered : prev
    })
  }, [activeCharts])

  // Fetch chart-specific data when activeCharts changes
  useEffect(() => {
    for (const key of activeCharts) {
      if (key === 'revenue' && revenueData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/revenue').then(({ data }) => {
          if (data?.data) setRevenueData(data.data)
        })
      }
      if (key === 'collected' && collectedData.length === 0) {
        api.get<{ data: MonthlyDataPoint[] }>('/dashboard/charts/collected').then(({ data }) => {
          if (data?.data) setCollectedData(data.data)
        })
      }
      if (key === 'micro' && microData.length === 0) {
        api.get<{ data: MicroDataPoint[] }>('/dashboard/charts/micro-thresholds').then(({ data }) => {
          if (data?.data) setMicroData(data.data)
        })
      }
    }
  }, [activeCharts])

  async function loadDashboard() {
    const { data } = await api.get<{
      stats: DashboardStats
      recent: RecentItem[]
      chartData?: RevenueDataPoint[]
    }>('/dashboard')
    if (data) {
      setStats(data.stats)
      setRecent(data.recent || [])
      setChartData(data.chartData || [])
    }
    setLoading(false)
  }

  const handleAddChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      if (prev.includes(key)) return prev
      const next = [...prev, key]
      saveActiveCharts(next)
      return next
    })
  }, [])

  const handleRemoveChart = useCallback((key: ChartKey) => {
    setActiveCharts((prev) => {
      const next = prev.filter((k) => k !== key)
      saveActiveCharts(next)
      return next
    })
  }, [])

  /* ─── Drag-and-drop callbacks ─── */

  const handleDragStart = useCallback((id: BlockId) => {
    setDraggingId(id)
  }, [])

  const handleDragOver = useCallback(
    (targetId: BlockId) => {
      if (!draggingId || draggingId === targetId) return
      setDragOverId(targetId)
      // Live preview: reorder the layout on hover
      setLayout((prev) => {
        const next = [...prev]
        const from = next.indexOf(draggingId)
        const to = next.indexOf(targetId)
        if (from === -1 || to === -1) return prev
        next.splice(from, 1)
        next.splice(to, 0, draggingId)
        pendingLayoutRef.current = next
        return next
      })
    },
    [draggingId]
  )

  const handleDrop = useCallback(() => {
    if (pendingLayoutRef.current) {
      saveLayout(pendingLayoutRef.current)
      pendingLayoutRef.current = null
    }
    setDragOverId(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (pendingLayoutRef.current) {
      saveLayout(pendingLayoutRef.current)
      pendingLayoutRef.current = null
    }
    setDraggingId(null)
    setDragOverId(null)
  }, [])

  const handleResetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
    saveLayout(DEFAULT_LAYOUT)
  }, [])

  /* ─── Derived data ─── */

  const latestInvoice = useMemo(() => {
    return recent.find((r) => r.type === 'invoice') || null
  }, [recent])

  const overdue = useMemo(() => {
    const overdueItems = recent.filter((r) => r.type === 'invoice' && r.status === 'overdue')
    const totalAmount = overdueItems.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    return { count: overdueItems.length, amount: totalAmount }
  }, [recent])

  const thisYear = useMemo(() => {
    const year = new Date().getFullYear()
    const items = recent.filter(
      (r) => r.type === 'invoice' && new Date(r.date).getFullYear() === year
    )
    const total = items.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    return { value: total, count: items.length }
  }, [recent])

  /* ─── Layout filtering (AI disabled → remove ai-summary) ─── */

  const visibleLayout = useMemo(() => {
    return layout.filter((id) => {
      if (id === 'ai-summary' && !aiEnabled) return false
      return true
    })
  }, [layout, aiEnabled])

  /* ─── Loading skeleton ─── */

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-4 md:py-6 space-y-4">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'rounded-xl',
                i < 4 ? 'h-32 col-span-1 md:col-span-1' : 'h-64 col-span-2 md:col-span-2'
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  /* ─── Block renderer ─── */

  const renderBlockContent = (id: BlockId): React.ReactNode => {
    switch (id) {
      case 'welcome':
        return (
          <div className="relative h-full p-6 flex items-center bg-gradient-to-r from-accent-soft via-accent-soft/50 to-transparent overflow-hidden">
            <div className="relative z-10">
              <TextType
                key={greeting}
                text={greeting}
                as="h1"
                typingSpeed={22}
                initialDelay={120}
                loop={false}
                showCursor
                hideCursorWhileTyping={false}
                cursorCharacter="|"
                cursorBlinkDuration={0.5}
                className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard.welcome.subtitle') || "Voici un aperçu de votre activité."}
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-xl bg-accent-soft ring-1 ring-accent/20 flex items-center justify-center opacity-25 rotate-12">
              <img src="/logo.svg" alt="" className="h-20 w-20" aria-hidden="true" />
            </div>
          </div>
        )
      case 'ai-summary':
        return (
          <div className="p-1">
            <AiDashboardSummary />
          </div>
        )
      case 'stat-invoiced':
        return (
          <StatBlock
            label={t('dashboard.stats.totalInvoiced') || 'Total facturé'}
            value={stats ? formatCurrency(stats.totalInvoiced.value, locale) : '—'}
            trend={stats?.totalInvoiced.trend ?? 0}
            description={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
            previousValue={stats ? `${t('dashboard.stats.lastMonth') || 'Mois dernier'} : ${formatCurrency(stats.totalInvoiced.previousValue, locale)}` : undefined}
            theme="indigo"
          />
        )
      case 'stat-outstanding':
        return (
          <StatBlock
            label={t('dashboard.stats.outstanding') || 'Vos clients vous doivent'}
            value={stats ? formatCurrency(stats.outstanding.value, locale) : '—'}
            trend={0}
            description={t('dashboard.stats.pendingInvoices') || 'Factures en attente'}
            isSnapshot
            theme="amber"
          />
        )
      case 'stat-collected':
        return (
          <StatBlock
            label={t('dashboard.stats.totalCollected') || 'Total encaissé'}
            value={stats ? formatCurrency(stats.totalCollected.value, locale) : '—'}
            trend={stats?.totalCollected.trend ?? 0}
            description={t('dashboard.stats.thisMonth') || 'Ce mois-ci'}
            previousValue={stats ? `${t('dashboard.stats.lastMonth') || 'Mois dernier'} : ${formatCurrency(stats.totalCollected.previousValue, locale)}` : undefined}
            theme="emerald"
          />
        )
      case 'latest-invoice':
        return <LatestInvoiceBlock item={latestInvoice} locale={locale} t={t} />
      case 'quick-actions':
        return <QuickActionsBlock t={t} />
      case 'drafts':
        return (
          <DraftsBlock
            invoiceDrafts={sidebarCounts.invoiceDrafts}
            quoteDrafts={sidebarCounts.quoteDrafts}
            t={t}
          />
        )
      case 'overdue':
        return (
          <OverdueBlock count={overdue.count} amount={overdue.amount} locale={locale} t={t} />
        )
      case 'this-year':
        return (
          <ThisYearBlock value={thisYear.value} count={thisYear.count} locale={locale} t={t} />
        )
      case 'shortcuts':
        return <ShortcutsBlock />
      case 'chart-revenue':
        return (
          <div className="p-1 h-full">
            <ChartRevenue data={chartData} />
          </div>
        )
      case 'recent-activity':
        return <RecentActivityBlock items={recent} locale={locale} t={t} />
      default: {
        // Dynamic chart blocks
        if (id.startsWith('chart-')) {
          const key = id.replace('chart-', '') as ChartKey
          return (
            <div className="relative p-1 h-full">
              <button
                onClick={() => handleRemoveChart(key)}
                className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-overlay/80 backdrop-blur-sm shadow-surface flex items-center justify-center text-muted-foreground hover:text-danger transition-colors opacity-0 group-hover/block:opacity-100"
                title={t('dashboard.remove') || 'Retirer'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {key === 'revenue' && (
                <ChartMonthly
                  title={t('dashboard.charts.revenue') || "Chiffre d'affaires HT"}
                  description={t('dashboard.charts.revenueDesc') || 'CA hors taxes facturé par mois (12 mois)'}
                  data={revenueData}
                  dataKey="subtotal"
                  color="var(--color-chart-1)"
                />
              )}
              {key === 'collected' && (
                <ChartMonthly
                  title={t('dashboard.charts.collected') || "Chiffre d'affaires encaissé"}
                  description={t('dashboard.charts.collectedDesc') || 'Paiements reçus par mois (12 mois)'}
                  data={collectedData}
                  dataKey="subtotal"
                  color="var(--color-chart-2)"
                />
              )}
              {key === 'micro' && (
                <ChartMonthly
                  title={t('dashboard.charts.micro') || 'Seuils de ma micro'}
                  description={`${t('dashboard.charts.microDesc') || 'CA cumulé vs seuils micro-entrepreneur'} (${new Date().getFullYear()})`}
                  data={microData}
                  dataKey="cumulative"
                  color="var(--color-chart-5)"
                  thresholds={[
                    { value: 77700, label: t('dashboard.charts.servicesThreshold') || 'Seuil services', color: '#f59e0b' },
                    { value: 188700, label: t('dashboard.charts.goodsThreshold') || 'Seuil marchandises', color: '#ef4444' },
                  ]}
                />
              )}
            </div>
          )
        }
        return null
      }
    }
  }

  return (
    <div className="relative px-4 lg:px-6 py-4 md:py-6 space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2">
        {editMode && (
          <button
            onClick={handleResetLayout}
            className="button button--sm button--secondary gap-1.5"
            title={t('dashboard.resetLayout') || 'Réinitialiser la disposition'}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t('dashboard.resetLayout') || 'Réinitialiser'}</span>
          </button>
        )}
        <button
          onClick={() => setAddChartOpen(true)}
          className="button button--sm button--secondary gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t('dashboard.addChart') || 'Ajouter un graphique'}</span>
        </button>
        <button
          onClick={() => setEditMode((v) => !v)}
          className={cn(
            'button button--sm gap-1.5',
            editMode ? 'button--primary' : 'button--secondary'
          )}
          title={editMode ? (t('dashboard.done') || 'Terminer') : (t('dashboard.customize') || 'Personnaliser')}
        >
          {editMode ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">
            {editMode ? (t('dashboard.done') || 'Terminer') : (t('dashboard.customize') || 'Personnaliser')}
          </span>
        </button>
      </div>

      {/* Edit mode banner */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-lg bg-accent-soft px-4 py-2 text-[12px] text-accent-soft-foreground"
          >
            <GripVertical className="h-3.5 w-3.5 shrink-0" />
            <span>{t('dashboard.editHint') || "Glissez-déposez les cartes pour réorganiser votre tableau de bord."}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(160px,auto)] gap-4"
      >
        <AnimatePresence mode="popLayout">
          {visibleLayout.map((id) => (
            <BentoBlock
              key={id}
              id={id}
              editMode={editMode}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggingId === id}
              isDragOver={dragOverId === id}
            >
              {renderBlockContent(id)}
            </BentoBlock>
          ))}
        </AnimatePresence>
      </div>

      <AddChartSidebar
        open={addChartOpen}
        onClose={() => setAddChartOpen(false)}
        onAddChart={handleAddChart}
        activeCharts={activeCharts}
      />

    </div>
  )
}
