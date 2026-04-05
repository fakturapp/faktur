'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator, DropdownSub } from '@/components/ui/dropdown'
import { useTheme } from '@/lib/theme'
import { CreateInvoiceModal } from '@/components/invoices/create-invoice-modal'
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
  { href: '/dashboard/account/export', label: 'Exportation', icon: Download },
  { href: '/dashboard/account/delete', label: 'Supprimer le compte', icon: Trash2 },
]

const SETTINGS_EXPANDED_KEY = 'zenvoice_settings_expanded'

function getStoredExpanded(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SETTINGS_EXPANDED_KEY) || '[]') }
  catch { return [] }
}

function storeExpanded(expanded: string[]) {
  localStorage.setItem(SETTINGS_EXPANDED_KEY, JSON.stringify(expanded))
}

function NavLink({ item, pathname, badges, persistKey }: { item: NavItem; pathname: string; badges?: Record<string, number>; persistKey?: string }) {
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

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-200 relative',
          isActive
            ? 'liquid-nav-active text-foreground'
            : 'text-muted-foreground liquid-nav-hover hover:text-foreground'
        )}
      >
        <item.icon className={cn('h-[15px] w-[15px] shrink-0', isActive ? 'text-primary' : 'opacity-70')} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-all duration-200 relative',
          isActive
            ? 'liquid-nav-active text-foreground'
            : 'text-muted-foreground liquid-nav-hover hover:text-foreground'
        )}
      >
        <item.icon className={cn('h-[15px] w-[15px] shrink-0', isActive ? 'text-primary' : 'opacity-70')} />
        <span className="flex-1 text-left">{item.label}</span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="h-3 w-3 opacity-40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
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
                        ? 'liquid-nav-active text-foreground font-medium'
                        : 'text-muted-foreground liquid-nav-hover hover:text-foreground'
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

export function Sidebar({ teams, currentTeam, teamsLoaded, onSwitchTeam, user, onLogout, collapsed, badges, isAdmin, onOpenFeedback, onOpenBugReport }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  const isAdminMode = pathname.startsWith('/dashboard/admin')
  const isSettingsMode = pathname.startsWith('/dashboard/settings')
  const isAccountMode = pathname.startsWith('/dashboard/account')
  const sidebarMode = isAdminMode ? 'admin' : isSettingsMode ? 'settings' : isAccountMode ? 'account' : 'main'

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col liquid-glass liquid-sidebar rounded-2xl transition-all duration-300 ease-out overflow-hidden',
        collapsed ? 'w-0 opacity-0 p-0 m-0' : 'w-(--sidebar-width) m-2 mr-0 opacity-100'
      )}
      style={{ height: collapsed ? 0 : 'calc(100vh - 16px)' }}
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
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg liquid-nav-active">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  Administration
                </p>
              </div>
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
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg liquid-nav-active">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary text-[11px] font-bold overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-foreground leading-tight">Mon compte</p>
              </div>
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
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg liquid-nav-active">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Settings className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-foreground leading-tight">Paramètres</p>
              </div>
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
            {/* Team header */}
            <div className="px-3 pt-3 pb-1">
              {teamsLoaded ? (
                <Dropdown
                  align="left"
                  trigger={
                    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 liquid-nav-hover transition-all duration-200 w-full">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-[11px] overflow-hidden">
                        {currentTeam?.iconUrl ? (
                          <img
                            src={currentTeam.iconUrl}
                            alt={currentTeam.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          currentTeam?.name.charAt(0).toUpperCase() || 'T'
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                          {currentTeam?.name || 'Équipe'}
                        </p>
                        {currentTeam?.role && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            {roleIcons[currentTeam.role]}
                            {roleLabels[currentTeam.role]}
                          </p>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    </div>
                  }
                  className="min-w-[230px]"
                >
                  <DropdownLabel>Vos équipes</DropdownLabel>

                  {teams.map((team) => (
                    <DropdownItem
                      key={team.id}
                      onClick={() => {
                        if (!team.isCurrent) onSwitchTeam(team.id)
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground overflow-hidden">
                            {team.iconUrl ? (
                              <img
                                src={team.iconUrl}
                                alt={team.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              team.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {team.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {roleIcons[team.role]}
                              {roleLabels[team.role]}
                            </p>
                          </div>
                        </div>
                        {team.isCurrent && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                    </DropdownItem>
                  ))}

                  <DropdownSeparator />

                  <Link href="/dashboard/team/create">
                    <DropdownItem>
                      <Plus className="h-4 w-4" /> Créer une équipe
                    </DropdownItem>
                  </Link>
                </Dropdown>
              ) : (
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <div className="h-7 w-7 rounded-lg skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded skeleton-shimmer" />
                    <div className="h-2 w-16 rounded skeleton-shimmer" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-3 h-px liquid-separator" />

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
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground liquid-nav-hover hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour au dashboard
              </Link>
            </div>

            {/* Admin navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              <NavLink
                item={{ href: '/dashboard/admin', label: "Vue d'ensemble", icon: LayoutDashboard }}
                pathname={pathname}
              />
              <NavLink
                item={{ href: '/dashboard/admin/feedbacks', label: 'Avis', icon: Star }}
                pathname={pathname}
              />
              <NavLink
                item={{ href: '/dashboard/admin/bugs', label: 'Rapports de bugs', icon: Bug }}
                pathname={pathname}
              />
              <NavLink
                item={{ href: '/dashboard/admin/analytics', label: 'Analytiques', icon: BarChart3 }}
                pathname={pathname}
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
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground liquid-nav-hover hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour au dashboard
              </Link>
            </div>

            {/* Account navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              {accountNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} persistKey="account" />
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
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground liquid-nav-hover hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour au dashboard
              </Link>
            </div>

            {/* Settings navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              {settingsNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} persistKey="settings" />
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
                  <div className="flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-semibold liquid-nav-hover transition-all group cursor-pointer">
                    <CirclePlus className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary">Créer</span>
                  </div>
                }
                className="min-w-[200px]"
              >
                <DropdownItem onClick={() => setInvoiceModalOpen(true)}>
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Facture</span>
                </DropdownItem>
                <DropdownItem onClick={() => router.push('/dashboard/quotes/new')}>
                  <Receipt className="h-4 w-4 text-orange-500" />
                  <span>Devis</span>
                </DropdownItem>
              </Dropdown>
            </div>

            <CreateInvoiceModal
              open={invoiceModalOpen}
              onClose={() => setInvoiceModalOpen(false)}
            />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} badges={badges} />
              ))}
              <div className="mx-2 my-2 h-px liquid-separator" />
              <NavLink
                item={{ href: '/dashboard/settings', label: 'Paramètres', icon: Settings }}
                pathname={pathname}
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-3 h-px liquid-separator" />

      {/* User section */}
      <div className="p-2.5">
        <Dropdown
          align="left"
          position="above"
          sideOffset={4}
          alignOffset={8}
          className="min-w-[260px]"
          trigger={
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 liquid-nav-hover transition-all duration-200 w-full">
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="sm"
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                  {user.fullName || user.email}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>

              <button
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
              </button>

              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
    </aside>
  )
}
