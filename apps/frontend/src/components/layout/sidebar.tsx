'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownSub } from '@/components/ui/dropdown'
import { CreateInvoiceModal } from '@/components/invoices/create-invoice-modal'
import { useTheme } from '@/lib/theme'
import { APP_VERSION } from '@/lib/version'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  Check,
  LogOut,
  User,
  Crown,
  Shield,
  UserCog,
  Eye,
  MoreHorizontal,
  CirclePlus,
  Sun,
  Moon,
  Monitor,
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
  Star,
  Bug,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Paintbrush,
  Settings2,
  ClipboardList,
  FileCheck,
  Sparkles,
  Download,
  Trash2,
  FilePlus,
  ArrowRight,
} from 'lucide-react'

interface TeamListItem {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
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
  { href: '/dashboard/recurring-invoices', label: 'Recurrences', icon: RefreshCw },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/products', label: 'Produits', icon: Package },
  { href: '/dashboard/expenses', label: 'Depenses', icon: Wallet },
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
  { href: '/dashboard/account/delete', label: 'Supprimer le compte', icon: Trash2 },
]

const SETTINGS_EXPANDED_KEY = 'zenvoice_settings_expanded'

// Fade + slide animation played when a label, chevron or anything else
// renders alongside an already-animating width transition on the aside.
// Small delay lets the sidebar start expanding first so the text "slots in"
// instead of fighting the container for space.
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

function NavLink({ item, pathname, badges, persistKey, collapsed }: { item: NavItem; pathname: string; badges?: Record<string, number>; persistKey?: string; collapsed?: boolean }) {
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

  // Row layout swaps entirely between collapsed (centered bigger icon, no
  // label) and expanded (left-aligned icon + label). This is a real
  // structural change driven by React state, not a CSS opacity fade.
  const rowClass = cn(
    'flex items-center rounded-lg transition-all duration-200 relative',
    collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2.5 px-2.5 py-[7px] w-full',
    'text-[13px] font-medium',
    isActive
      ? 'bg-muted/60 dark:bg-white/[0.06] shadow-sm text-foreground'
      : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground'
  )

  const iconClass = cn(
    'shrink-0 transition-all duration-200',
    collapsed ? 'h-5 w-5' : 'h-[15px] w-[15px]',
    isActive ? 'text-primary' : 'opacity-70'
  )

  if (!hasChildren) {
    return (
      <Link href={item.href} className={rowClass}>
        <item.icon className={iconClass} />
        {!collapsed && (
          <motion.span {...labelFade} className="whitespace-nowrap">
            {item.label}
          </motion.span>
        )}
      </Link>
    )
  }

  return (
    <div>
      <button onClick={handleToggle} className={rowClass}>
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
                      'flex items-center justify-between rounded-md px-2.5 py-[5px] text-[12px] transition-all duration-200',
                      childActive
                        ? 'bg-muted/60 dark:bg-white/[0.06] shadow-sm text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {ChildIcon && <ChildIcon className={cn('h-3 w-3 shrink-0', childActive && 'text-primary')} />}
                      {child.label}
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

export function Sidebar({ teams, currentTeam, teamsLoaded, onSwitchTeam, user, onLogout, collapsed: collapsedProp, badges, isAdmin, onOpenFeedback, onOpenBugReport }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Effective collapsed state: the user manually collapsed the sidebar AND
  // they are not currently hovering it. On hover, we temporarily switch
  // back to the full layout via React (not CSS) so that everything — icon
  // sizes, conditional labels, justify rules — can change as one unit.
  const collapsed = collapsedProp && !isHovered

  const isAdminMode = pathname.startsWith('/dashboard/admin')
  const isSettingsMode = pathname.startsWith('/dashboard/settings')
  const isAccountMode = pathname.startsWith('/dashboard/account')
  const sidebarMode = isAdminMode ? 'admin' : isSettingsMode ? 'settings' : isAccountMode ? 'account' : 'main'

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside
      onMouseEnter={collapsedProp ? () => setIsHovered(true) : undefined}
      onMouseLeave={collapsedProp ? () => setIsHovered(false) : undefined}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border rounded-r-[2rem] shadow-2xl overflow-hidden transition-[width] duration-300 ease-out',
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
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              {!collapsed && (
                <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-foreground leading-tight whitespace-nowrap">
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
                  <p className="text-[13px] font-semibold text-foreground leading-tight whitespace-nowrap">Mon compte</p>
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
                <Settings className="h-3.5 w-3.5" />
              </div>
              {!collapsed && (
                <motion.div {...labelFade} className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-semibold text-foreground leading-tight whitespace-nowrap">Paramètres</p>
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
            {/* Faktur logo header — logo always centered; the wordmark +
                version slot in next to it only in expanded mode. */}
            <div className="px-3 pt-4 pb-3">
              <div className="flex items-center justify-center gap-2.5">
                <img src="/logo.svg" alt="Faktur" className="h-10 w-10 shrink-0 drop-shadow-sm" />
                {!collapsed && (
                  <motion.div {...labelFade} className="flex flex-col items-start min-w-0">
                    <span className="text-[18px] font-semibold text-foreground font-lexend tracking-tight leading-tight whitespace-nowrap">
                      Faktur
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 font-medium leading-none whitespace-nowrap">
                      v{APP_VERSION}
                    </span>
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
            {/* Back to dashboard */}
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2 px-2.5 py-2'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Admin navigation */}
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              <NavLink
                item={{ href: '/dashboard/admin', label: "Vue d'ensemble", icon: LayoutDashboard }}
                pathname={pathname}
                collapsed={collapsed}
              />
              <NavLink
                item={{ href: '/dashboard/admin/feedbacks', label: 'Avis', icon: Star }}
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
            {/* Back to dashboard */}
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2 px-2.5 py-2'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Account navigation */}
            <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-0.5', collapsed && 'scrollbar-hidden')}>
              {accountNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} persistKey="account" collapsed={collapsed} />
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
            {/* Back to dashboard */}
            <div className="px-3 pt-2 pb-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] hover:text-foreground transition-all duration-200',
                  collapsed ? 'justify-center h-10 w-10 mx-auto' : 'justify-start gap-2 px-2.5 py-2'
                )}
              >
                <ArrowLeft className={cn('shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
                {!collapsed && (
                  <motion.span {...labelFade} className="whitespace-nowrap">
                    Retour au dashboard
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Settings navigation */}
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
            {/* Quick create */}
            <div className="px-3 pt-2 pb-1">
              <Dropdown
                align="left"
                trigger={
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-lg text-[13px] font-semibold hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-all cursor-pointer',
                      collapsed ? 'h-10 w-10 mx-auto' : 'gap-2 px-2.5 py-2'
                    )}
                  >
                    <CirclePlus className={cn('text-primary shrink-0 transition-all duration-200', collapsed ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
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
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-left">Facture</span>
                    </>
                  }
                >
                  <DropdownItem onClick={() => router.push('/dashboard/invoices/new')}>
                    <FilePlus className="h-4 w-4 text-primary" /> Facture vierge
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
            </div>

            {/* Navigation */}
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

      <div className="mx-3 h-px bg-border" />

      {/* User section */}
      <div className="p-2.5">
        <Dropdown
          align="left"
          position="above"
          sideOffset={4}
          alignOffset={8}
          className="min-w-[260px]"
          trigger={
            <div
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
                    <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </motion.div>

                  <motion.button
                    {...labelFade}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
                      setTheme(next)
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title={theme === 'system' ? 'Systeme' : theme === 'dark' ? 'Sombre' : 'Clair'}
                  >
                    {theme === 'system' ? (
                      <Monitor className="h-3.5 w-3.5" />
                    ) : theme === 'dark' ? (
                      <Moon className="h-3.5 w-3.5" />
                    ) : (
                      <Sun className="h-3.5 w-3.5" />
                    )}
                  </motion.button>

                  <motion.div {...labelFade}>
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </motion.div>
                </>
              )}
            </div>
          }
        >
          <div className="px-3 py-3 border-b border-border mb-1">
            <div className="flex items-center gap-3">
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <Link href="/dashboard/account">
            <DropdownItem>
              <User className="h-4 w-4" /> Mon compte
            </DropdownItem>
          </Link>

          {isAdmin && (
            <Link href="/dashboard/admin">
              <DropdownItem>
                <ShieldCheck className="h-4 w-4" /> Panel administrateur
              </DropdownItem>
            </Link>
          )}

          <DropdownSeparator />

          {/* Team switcher */}
          <DropdownSub
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
            trigger={
              <>
                <Info className="h-4 w-4" />
                <span className="flex-1 text-left">Aide & informations</span>
              </>
            }
          >
            <DropdownItem onClick={() => onOpenFeedback?.()}>
              <Star className="h-4 w-4" /> Laisser un avis
            </DropdownItem>
            <DropdownItem onClick={() => onOpenBugReport?.()}>
              <Bug className="h-4 w-4" /> Signaler un bug
            </DropdownItem>
            <DropdownSeparator />
            <Link href="/dashboard/about">
              <DropdownItem>
                <Info className="h-4 w-4" /> A propos
              </DropdownItem>
            </Link>
            <Link href="/legal" target="_blank">
              <DropdownItem>
                <Scale className="h-4 w-4" /> Info legales
              </DropdownItem>
            </Link>
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
    </aside>
  )
}
