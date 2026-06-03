'use client'

import * as React from 'react'
import { useState } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownSub } from '@/components/ui/dropdown'
import { CreateInvoiceModal } from '@/components/invoices/create-invoice-modal'
import { useTheme } from '@/lib/theme'
import { getPlan } from '@/lib/plans'
import {
  isFakturDesktop,
  getFakturDesktopVersion,
  getFakturDesktopBridge,
  type FakturDesktopCertificationStatus,
} from '@/lib/is-desktop'
import { DesktopUpdateCard } from '@/components/layout/desktop-update-card'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { Tooltip } from '@/components/ui/tooltip'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  LogOut,
  User,
  Crown,
  Shield,
  UserCog,
  Eye,
  CirclePlus,
  Sun,
  Moon,
  Monitor,
  Palette,
  Building2,
  UsersRound,
  CreditCard,
  Mail,
  Info,
  Scale,
  Package,
  FileMinus2,
  RefreshCw,
  Bell,
  Wallet,
  MessageSquare,
  Layers,
  Bug,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Paintbrush,
  Settings2,
  ClipboardList,
  Hash,
  FileCheck,
  Sparkles,
  Download,
  Trash2,
  FilePlus,
  GraduationCap,
  Gift,
  Key,
  Webhook,
  HardDrive,
} from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress'
import { formatBytes } from '@/lib/utils'
import { useTutorialSafe } from '@/lib/tutorial-context'

interface TeamListItem {
  id: string
  name: string
  iconUrl: string | null
  plan: 'free' | 'pro' | 'team'
  role: string
  isOwner: boolean
  isCurrent: boolean
}

export interface StorageUsageSummary {
  totalBytes: number
  quotaBytes: number
  percent: number
  isOver: boolean
  plan: 'free' | 'pro' | 'team'
}

export interface SidebarProps {
  teams: TeamListItem[]
  currentTeam: TeamListItem | null
  teamsLoaded: boolean
  onSwitchTeam: (teamId: string) => void
  user: { fullName: string | null; email: string; avatarUrl: string | null }
  onLogout: () => void
  collapsed?: boolean
  badges?: Record<string, number>
  isAdmin?: boolean
  onOpenFeedback?: () => void
  onOpenBugReport?: () => void
  storage?: StorageUsageSummary | null
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3 w-3 text-primary" />,
  admin: <Shield className="h-3 w-3 text-yellow-500" />,
  member: <UserCog className="h-3 w-3 text-muted-foreground" />,
  viewer: <Eye className="h-3 w-3 text-muted-foreground" />,
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  member: 'Membre',
  viewer: 'Lecteur',
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  children?: { href: string; label: string; icon?: React.ElementType }[]
  confirmRedirect?: { title: string; description: string }
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/dashboard/invoices',
    label: 'Factures',
    icon: FileText,
    children: [
      { href: '/dashboard/invoices', label: 'Toutes les factures' },
      { href: '/dashboard/invoices/drafts', label: 'Brouillons' },
    ],
  },
  {
    href: '/dashboard/quotes',
    label: 'Devis',
    icon: Receipt,
    children: [
      { href: '/dashboard/quotes', label: 'Tous les devis' },
      { href: '/dashboard/quotes/drafts', label: 'Brouillons' },
    ],
  },
  { href: '/dashboard/credit-notes', label: 'Avoirs', icon: FileMinus2 },
  { href: '/dashboard/recurring-invoices', label: 'Récurrences', icon: RefreshCw },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/products', label: 'Produits', icon: Package },
  { href: '/dashboard/expenses', label: 'Dépenses', icon: Wallet },
]

const settingsNav: NavItem[] = [
  {
    href: '/dashboard/settings/company',
    label: 'Entreprise',
    icon: Building2,
    children: [
      { href: '/dashboard/settings/company', label: 'Informations', icon: Building2 },
      { href: '/dashboard/settings/company/bank', label: 'Banque', icon: CreditCard },
      { href: '/dashboard/settings/company/payment', label: 'Paiement', icon: Receipt },
    ],
  },
  { href: '/dashboard/settings/members', label: 'Équipe', icon: UsersRound },
  { href: '/dashboard/settings/plan', label: 'Plan', icon: Layers },
  { href: '/dashboard/settings/storage', label: 'Stockage', icon: HardDrive },
  {
    href: '/dashboard/settings/documents/invoices',
    label: 'Facturation',
    icon: CreditCard,
    children: [
      { href: '/dashboard/settings/documents/invoices', label: 'Apparence', icon: Paintbrush },
      { href: '/dashboard/settings/documents/invoices/options', label: 'Options', icon: Settings2 },
      {
        href: '/dashboard/settings/documents/invoices/defaults',
        label: 'Valeurs par défaut',
        icon: ClipboardList,
      },
      {
        href: '/dashboard/settings/documents/invoices/naming',
        label: 'Nommage',
        icon: Hash,
      },
      {
        href: '/dashboard/settings/documents/invoices/e-invoicing',
        label: 'E-Facturation',
        icon: FileCheck,
      },
      { href: '/dashboard/settings/documents/invoices/ai', label: 'Faktur AI', icon: Sparkles },
      { href: '/dashboard/settings/documents/invoices/collaboration', label: 'Collaboration', icon: Users },
    ],
  },
  {
    href: '/dashboard/settings/email',
    label: 'Communication',
    icon: Mail,
    children: [
      { href: '/dashboard/settings/email/accounts', label: 'Comptes email', icon: Mail },
      { href: '/dashboard/settings/reminders', label: 'Relances', icon: Bell },
    ],
  },
]

const accountNav: NavItem[] = [
  {
    href: '/dashboard/account',
    label: 'Profil',
    icon: User,
    children: [
      { href: '/dashboard/account', label: 'Informations', icon: User },
      { href: '/dashboard/account/security', label: 'S\u00e9curit\u00e9', icon: Shield },
    ],
  },
  { href: '/dashboard/account/sessions', label: 'Sessions', icon: Monitor },
  { href: '/dashboard/account/oauth', label: 'Applications connectées', icon: ShieldCheck },
  { href: '/dashboard/account/export', label: 'Exportation', icon: Download },
  {
    href: '/dashboard/account/delete',
    label: 'Supprimer le compte',
    icon: Trash2,
    confirmRedirect: {
      title: 'Supprimer votre compte',
      description: "Vous allez être redirigé vers la page de suppression de compte. Ce processus comporte plusieurs étapes de vérification.",
    },
  },
]

const SETTINGS_EXPANDED_KEY = 'zenvoice_settings_expanded'

const labelFade = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
}

function getStoredExpanded(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SETTINGS_EXPANDED_KEY) || '[]') }
  catch { return [] }
}

function storeExpanded(expanded: string[]) {
  localStorage.setItem(SETTINGS_EXPANDED_KEY, JSON.stringify(expanded))
}

function LinkStatusIndicator(_props: { className?: string }) {
  const { pending } = useLinkStatus()
  React.useEffect(() => {
    if (pending && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('faktur:route-pending'))
    }
  }, [pending])
  return null
}

function NavLink({ item, pathname, badges, persistKey, collapsed, onConfirmRedirect }: { item: NavItem; pathname: string; badges?: Record<string, number>; persistKey?: string; collapsed?: boolean; onConfirmRedirect?: (item: NavItem) => void }) {
  const isActive = item.href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0

  const [expanded, setExpanded] = useState(() => {
    if (isActive && hasChildren) return true
    if (persistKey && hasChildren) return getStoredExpanded().includes(item.href)
    return false
  })

  React.useEffect(() => {
    if (isActive && hasChildren) setExpanded(true)
  }, [isActive, hasChildren])

  function handleToggle() {
    const next = !expanded
    setExpanded(next)
    if (persistKey) {
      const stored = getStoredExpanded()
      storeExpanded(next ? [...stored.filter(h => h !== item.href), item.href] : stored.filter(h => h !== item.href))
    }
  }

  const rowClass = cn(
    'flex items-center rounded-lg transition-all duration-200 relative',
    collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-3 px-3 py-[10px] w-full',
    'text-[15px] font-medium',
    isActive
      ? 'bg-muted/60 dark:bg-white/[0.06] shadow-sm text-foreground'
      : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground'
  )

  const iconClass = cn(
    'shrink-0 transition-all duration-200',
    collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
    isActive ? 'text-primary' : 'opacity-70'
  )

  const tutorialMap: Record<string, string> = {
    '/dashboard': 'nav-dashboard', '/dashboard/invoices': 'nav-invoices', '/dashboard/quotes': 'nav-quotes',
    '/dashboard/clients': 'nav-clients', '/dashboard/products': 'nav-products', '/dashboard/expenses': 'nav-expenses',
  }

  if (!hasChildren) {
    const link = item.confirmRedirect ? (
      <button
        type="button"
        className={rowClass}
        aria-label={item.label}
        onClick={() => onConfirmRedirect?.(item)}
      >
        <item.icon className={iconClass} />
        {!collapsed && (
          <motion.span {...labelFade} className="whitespace-nowrap text-left">
            {item.label}
          </motion.span>
        )}
      </button>
    ) : (
      <Link href={item.href} className={rowClass} data-tutorial={tutorialMap[item.href]} aria-label={item.label}>
        <item.icon className={iconClass} />
        {!collapsed && (
          <motion.span {...labelFade} className="whitespace-nowrap">
            {item.label}
          </motion.span>
        )}
        {!collapsed && <LinkStatusIndicator className="ml-auto" />}
      </Link>
    )
    return collapsed ? (
      <Tooltip content={item.label} side="right">
        {link}
      </Tooltip>
    ) : (
      link
    )
  }

  const toggleBtn = (
    <button onClick={handleToggle} className={rowClass} aria-label={item.label}>
      <item.icon className={iconClass} />
      {!collapsed && (
        <>
          <motion.span {...labelFade} className="flex-1 text-left whitespace-nowrap">
            {item.label}
          </motion.span>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0, rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.22, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ChevronRight className="h-3 w-3 opacity-40" />
          </motion.div>
        </>
      )}
    </button>
  )

  return (
    <div>
      {collapsed ? (
        <Tooltip content={item.label} side="right">
          {toggleBtn}
        </Tooltip>
      ) : (
        toggleBtn
      )}
      <AnimatePresence initial={false}>
        {expanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-[18px] border-l border-border/40 pl-2.5 py-0.5 space-y-0.5">
              {item.children!.map((child) => {
                const childActive = pathname === child.href
                const badgeCount = badges?.[child.href]
                const ChildIcon = child.icon
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2.5 py-[7px] text-[13.5px] transition-all duration-200',
                      childActive
                        ? 'bg-muted/60 dark:bg-white/[0.06] shadow-sm text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {ChildIcon && <ChildIcon className={cn('h-4 w-4 shrink-0', childActive && 'text-primary')} />}
                      {child.label}
                      <LinkStatusIndicator className="ml-1" />
                    </span>
                    {badgeCount != null && badgeCount > 0 && (
                      <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary/15 px-1 text-[9px] font-semibold text-primary">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({ teams, currentTeam, teamsLoaded, onSwitchTeam, user, onLogout, collapsed: collapsedProp, badges, isAdmin, onOpenFeedback, onOpenBugReport, storage }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [confirmRedirect, setConfirmRedirect] = useState<NavItem | null>(null)

  const [desktop, setDesktop] = useState<{ is: boolean; version: string | null }>({
    is: false,
    version: null,
  })
  const [certification, setCertification] =
    useState<FakturDesktopCertificationStatus | null>(null)

  React.useEffect(() => {
    setDesktop({ is: isFakturDesktop(), version: getFakturDesktopVersion() })
    const bridge = getFakturDesktopBridge()
    if (bridge?.getCertificationStatus) {
      bridge
        .getCertificationStatus()
        .then((status) => setCertification(status))
        .catch(() => setCertification(null))
    }
  }, [])
  const brandName = desktop.is ? 'Faktur Desktop' : 'Faktur'
  const isCertifiedOfficial = desktop.is && certification?.certified === true

  const collapsed = collapsedProp && !isHovered

  const isAdminMode = pathname.startsWith('/dashboard/admin')
  const isSettingsMode = pathname.startsWith('/dashboard/settings')
  const isAccountMode = pathname.startsWith('/dashboard/account')
  const sidebarMode = isAdminMode ? 'admin' : isSettingsMode ? 'settings' : isAccountMode ? 'account' : 'main'

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  const currentPlan = getPlan(currentTeam?.plan)
  const PlanIcon = currentPlan.icon

  return (
    <aside
      data-tutorial="sidebar"
      onMouseEnter={collapsedProp ? () => setIsHovered(true) : undefined}
      onMouseLeave={collapsedProp ? () => setIsHovered(false) : undefined}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border rounded-r-[2rem] shadow-2xl overflow-hidden transition-[width] duration-300 ease-out will-change-[width]',
        collapsed ? 'w-16' : 'w-(--sidebar-width)'
      )}
    >
      <AnimatePresence mode="wait">
        {sidebarMode === 'admin' ? (
          <motion.div
            key="admin-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-3 pt-3 pb-1"
          >
            <div
              className={cn(
                'flex items-center rounded-lg bg-muted/60 dark:bg-white/[0.06] shadow-sm transition-all duration-200',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-2 py-2'
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              {!collapsed && (
                <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-semibold text-foreground leading-tight whitespace-nowrap">
                    Administration
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : sidebarMode === 'account' ? (
          <motion.div
            key="account-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-3 pt-3 pb-1"
          >
            <div
              className={cn(
                'flex items-center rounded-lg bg-muted/60 dark:bg-white/[0.06] shadow-sm transition-all duration-200',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-2 py-2'
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary text-[11px] font-bold overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {!collapsed && (
                <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-semibold text-foreground leading-tight whitespace-nowrap">Mon compte</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : sidebarMode === 'settings' ? (
          <motion.div
            key="settings-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-3 pt-3 pb-1"
          >
            <div
              className={cn(
                'flex items-center rounded-lg bg-muted/60 dark:bg-white/[0.06] shadow-sm transition-all duration-200',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-2 py-2'
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Settings className="h-4 w-4" />
              </div>
              {!collapsed && (
                <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                  <p className="text-[15px] font-semibold text-foreground leading-tight whitespace-nowrap">Paramètres</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="team-header"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            { }
            <div className="px-3 pt-4 pb-3">
              <div className="flex items-center justify-start gap-2.5">
                <img src="/logo.svg" alt={brandName} className="h-10 w-10 shrink-0 drop-shadow-sm" />
                {!collapsed && (
                  <motion.div {...labelFade} className="flex min-w-0 items-center gap-1.5">
                    <span className="text-[21px] font-bold tracking-tight leading-tight whitespace-nowrap text-foreground">
                      {brandName}
                    </span>
                    {currentTeam && currentPlan.id === 'pro' && (
                      <span className="text-[21px] font-bold leading-tight tracking-tight text-muted-foreground">
                        Pro
                      </span>
                    )}
                    {currentTeam && currentPlan.id === 'team' && (
                      <span className="text-[21px] font-bold leading-tight tracking-tight text-foreground/55">
                        Team
                      </span>
                    )}
                    {isCertifiedOfficial && (
                      <Tooltip content="Version officielle de Faktur Desktop">
                        <VerifiedBadge className="h-3.5 w-3.5" label="Version officielle" />
                      </Tooltip>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-3 h-px bg-border" />

      <AnimatePresence mode="wait">
        {sidebarMode === 'admin' ? (
          <motion.div
            key="admin-nav"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            { }
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[15px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-3 py-2.5'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
                {!collapsed && <LinkStatusIndicator className="ml-auto" />}
              </Link>
            </div>

            { }
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              <NavLink
                item={{ href: '/dashboard/admin', label: "Vue d'ensemble", icon: LayoutDashboard }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/users', label: 'Utilisateurs', icon: Users }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/teams', label: 'Équipes', icon: UsersRound }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/feedbacks', label: 'Avis', icon: MessageSquare }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/bugs', label: 'Rapports de bugs', icon: Bug }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/analytics', label: 'Analytiques', icon: BarChart3 }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/oauth-apps', label: 'Applications OAuth', icon: ShieldCheck }}
                pathname={pathname}
                collapsed={collapsed}
              />
            </nav>
          </motion.div>
        ) : sidebarMode === 'account' ? (
          <motion.div
            key="account-nav"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            { }
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[15px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-3 py-2.5'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
                {!collapsed && <LinkStatusIndicator className="ml-auto" />}
              </Link>
            </div>

            { }
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              {accountNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  persistKey="account"
                  collapsed={collapsed}
                  onConfirmRedirect={(navItem) => setConfirmRedirect(navItem)}
                />
              ))}
            </nav>
          </motion.div>
        ) : sidebarMode === 'settings' ? (
          <motion.div
            key="settings-nav"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            { }
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[15px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-3 py-2.5'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
                {!collapsed && <LinkStatusIndicator className="ml-auto" />}
              </Link>
            </div>

            { }
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              {settingsNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} persistKey="settings" collapsed={collapsed} />
              ))}
            </nav>
          </motion.div>
        ) : (
          <motion.div
            key="main-nav"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            { }
            <div className="px-3 pt-2 pb-1">
              {storage?.isOver ? (
                <Tooltip
                  content="Stockage plein — supprimez des fichiers ou augmentez votre forfait"
                  side="right"
                >
                  <div
                    data-tutorial="create-button"
                    aria-disabled="true"
                    className={cn(
                      'flex cursor-not-allowed items-center justify-center rounded-lg text-[15px] font-semibold text-muted-foreground opacity-50',
                      collapsed ? 'h-10 w-10 mx-auto' : 'gap-2.5 px-3 py-2.5'
                    )}
                  >
                    <CirclePlus className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                    {!collapsed && (
                      <motion.span {...labelFade} className="whitespace-nowrap">
                        Créer
                      </motion.span>
                    )}
                  </div>
                </Tooltip>
              ) : (
                <Dropdown
                  align="left"
                  trigger={
                    <div
                      data-tutorial="create-button"
                      className={cn(
                        'flex items-center justify-center rounded-lg text-[15px] font-semibold hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-all cursor-pointer',
                        collapsed ? 'h-10 w-10 mx-auto' : 'gap-2.5 px-3 py-2.5'
                      )}
                    >
                      <CirclePlus className={cn('text-primary shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                      {!collapsed && (
                        <motion.span {...labelFade} className="text-primary whitespace-nowrap">
                          Créer
                        </motion.span>
                      )}
                    </div>
                  }
                  className="min-w-[220px]"
                >
                  <DropdownSub
                    trigger={
                      <>
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="flex-1 text-left">Facture</span>
                      </>
                    }
                  >
                    <DropdownItem onClick={() => router.push('/dashboard/invoices/new')}>
                      <FilePlus className="h-4 w-4 text-blue-500" /> Facture vierge
                    </DropdownItem>
                    <DropdownItem onClick={() => setConvertModalOpen(true)}>
                      <RefreshCw className="h-4 w-4 text-emerald-500" /> Convertir un devis
                    </DropdownItem>
                  </DropdownSub>
                  <DropdownItem onClick={() => router.push('/dashboard/quotes/new')}>
                    <Receipt className="h-4 w-4 text-orange-500" />
                    <span>Devis</span>
                  </DropdownItem>
                </Dropdown>
              )}
            </div>

            { }
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} badges={badges} collapsed={collapsed} />
              ))}
              <div className="mx-2 my-2 h-px bg-border" />
              <NavLink
                item={{ href: '/dashboard/settings', label: 'Paramètres', icon: Settings }}
                pathname={pathname}
                collapsed={collapsed}
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 pb-1.5">
        <button
          type="button"
          onClick={() => router.push('/changelog')}
          className={cn(
            'flex w-full items-center rounded-lg text-[15px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
            collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-3 py-2.5'
          )}
          title="Quoi de neuf"
        >
          <Gift className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
          {!collapsed && (
            <motion.span {...labelFade} className="whitespace-nowrap">
              Quoi de neuf ?
            </motion.span>
          )}
        </button>
      </div>

      {storage &&
        (collapsed ? (
          <div className="flex justify-center px-3 pb-1.5">
            <Tooltip
              content={`Stockage : ${formatBytes(storage.totalBytes)} / ${formatBytes(storage.quotaBytes)}`}
              side="right"
            >
              <button
                type="button"
                onClick={() => router.push('/dashboard/settings/storage')}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.04]',
                  storage.percent >= 80 ? 'text-danger' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <HardDrive className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings/storage')}
              className="w-full rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-muted/40 dark:hover:bg-white/[0.04]"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                  <HardDrive className="h-[15px] w-[15px] text-muted-foreground" />
                  Espace de stockage
                </span>
                <span
                  className={cn(
                    'shrink-0 text-[11px] tabular-nums',
                    storage.percent >= 80 ? 'font-medium text-danger' : 'text-muted-foreground'
                  )}
                >
                  {formatBytes(storage.totalBytes)} / {formatBytes(storage.quotaBytes)}
                </span>
              </div>
              <ProgressBar
                value={storage.percent}
                maxValue={100}
                size="sm"
                showOutput={false}
                color={storage.percent >= 80 ? 'danger' : 'accent'}
                aria-label="Espace de stockage"
              />
            </button>
            {storage.plan !== 'team' && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/settings/plan/upgrade')}
                className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Augmenter l&apos;espace de stockage
              </button>
            )}
          </div>
        ))}

      <div className="mx-3 h-px bg-border" />

      {desktop.is && <DesktopUpdateCard collapsed={collapsed} />}

      { }
      <div className="p-2.5">
        <Dropdown
          align="left"
          position="above"
          sideOffset={4}
          alignOffset={8}
          className="min-w-[260px]"
          trigger={(open) => (
            <div
              data-tutorial="user-dropdown"
              className={cn(
                'flex items-center rounded-lg hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-all duration-200',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-2 py-2 w-full'
              )}
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="sm"
              />
              {!collapsed && (
                <>
                  <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                    <p className="text-[14px] font-medium text-foreground truncate leading-tight">
                      {user.fullName || user.email.split('@')[0]}
                    </p>
                    {currentTeam && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] font-medium leading-tight text-muted-foreground">
                        {currentPlan.label}
                      </p>
                    )}
                  </motion.div>

                  {currentPlan.id === 'free' ? (
                    <motion.button
                      {...labelFade}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push('/dashboard/settings/plan/upgrade')
                      }}
                      className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      Mettre à niveau
                    </motion.button>
                  ) : (
                    <motion.div {...labelFade}>
                      <ChevronUp
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                          open && 'rotate-180'
                        )}
                      />
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}
        >
          <div className="px-3 py-3 border-b border-border mb-1">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <DropdownItem onClick={() => router.push('/dashboard/settings/plan/upgrade')}>
            <PlanIcon className={cn('h-4 w-4', currentPlan.accentText)} /> Changer de forfait
          </DropdownItem>

          <Link href="/dashboard/account">
            <DropdownItem>
              <User className="h-4 w-4 text-violet-500" /> Mon compte
            </DropdownItem>
          </Link>

          {isAdmin && (
            <Link href="/dashboard/admin">
              <DropdownItem>
                <ShieldCheck className="h-4 w-4 text-amber-500" /> Panel administrateur
              </DropdownItem>
            </Link>
          )}

          <DropdownSeparator />

          { }
          <DropdownSub
            className="min-w-[220px]"
            trigger={
              <>
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[9px] font-bold text-primary overflow-hidden">
                  {currentTeam?.iconUrl ? (
                    <img src={currentTeam.iconUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (currentTeam?.name || 'E').charAt(0).toUpperCase()
                  )}
                </div>
                <span className="flex-1 text-left truncate max-w-[140px]">{currentTeam?.name || 'Équipe'}</span>
              </>
            }
          >
            <DropdownLabel>Vos équipes</DropdownLabel>
            {teams.map((team) => (
              <DropdownItem
                key={team.id}
                onClick={() => { if (!team.isCurrent) onSwitchTeam(team.id) }}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground overflow-hidden">
                      {team.iconUrl ? (
                        <img src={team.iconUrl} alt={team.name} className="h-full w-full object-cover" />
                      ) : (
                        team.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm truncate">{team.name}</span>
                  </div>
                  {team.isCurrent && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <Link href="/dashboard/team/create">
              <DropdownItem>
                <Plus className="h-4 w-4" /> Nouvelle équipe
              </DropdownItem>
            </Link>
          </DropdownSub>

          <DropdownSeparator />

          <DropdownSub
            className="min-w-[220px]"
            trigger={
              <>
                <Info className="h-4 w-4 text-sky-500" />
                <span className="flex-1 text-left">Aide & informations</span>
              </>
            }
          >
            <DropdownItem
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
                setTheme(next)
              }}
            >
              <Palette className="h-4 w-4 text-indigo-500" />
              Thème
              <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-md bg-foreground/[0.06] text-foreground">
                {theme === 'system' ? (
                  <Monitor className="h-4 w-4" />
                ) : theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </span>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => {
              const tutorial = (window as any).__fakturTutorialOpen
              if (typeof tutorial === 'function') tutorial()
            }}>
              <GraduationCap className="h-4 w-4 text-violet-500" /> Didacticiel
              <span className="ml-auto inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-500 uppercase">Beta</span>
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => onOpenFeedback?.()}>
              <MessageSquare className="h-4 w-4 text-amber-500" /> Laisser un avis
            </DropdownItem>
            <DropdownItem onClick={() => onOpenBugReport?.()}>
              <Bug className="h-4 w-4 text-rose-500" /> Signaler un bug
            </DropdownItem>
            <DropdownSeparator />
            <Link href="/dashboard/about">
              <DropdownItem>
                <Info className="h-4 w-4 text-sky-500" /> A propos
              </DropdownItem>
            </Link>
            <Link href="/legal" target="_blank">
              <DropdownItem>
                <Scale className="h-4 w-4 text-muted-foreground" /> Mentions légales
              </DropdownItem>
            </Link>
            <DropdownSeparator />
            <DropdownItem onClick={() => router.push('/download')}>
              <Download className="h-4 w-4 text-sky-500" /> Télécharger les applications
            </DropdownItem>
          </DropdownSub>

          <DropdownSeparator />

          <DropdownItem destructive onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Deconnexion
          </DropdownItem>
        </Dropdown>
      </div>

      <CreateInvoiceModal
        open={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
      />

      <Dialog open={!!confirmRedirect} onClose={() => setConfirmRedirect(null)}>
        <DialogHeader showClose={false}>
          <DialogTitle>{confirmRedirect?.confirmRedirect?.title}</DialogTitle>
          <DialogDescription>
            {confirmRedirect?.confirmRedirect?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmRedirect(null)}>
            Annuler
          </Button>
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => {
              const target = confirmRedirect
              setConfirmRedirect(null)
              if (target) router.push(target.href)
            }}
          >
            Continuer
          </Button>
        </DialogFooter>
      </Dialog>
    </aside>
  )
}
