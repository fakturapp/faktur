'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
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
  { href: '/dashboard/products', label: 'Catalogue', icon: Package },
  { href: '/dashboard/expenses', label: 'Depenses', icon: Wallet },
]

const settingsNav: NavItem = {
  href: '/dashboard/company',
  label: 'Paramètres',
  icon: Settings,
  children: [
    { href: '/dashboard/company', label: 'Entreprise', icon: Building2 },
    { href: '/dashboard/team', label: 'Équipe', icon: UsersRound },
    { href: '/dashboard/settings/invoices', label: 'Facturation', icon: CreditCard },
    { href: '/dashboard/settings/email', label: 'Email', icon: Mail },
    { href: '/dashboard/settings/reminders', label: 'Relances', icon: Bell },
  ],
}

function NavLink({ item, pathname, badges }: { item: NavItem; pathname: string; badges?: Record<string, number> }) {
  const isActive = item.href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0
  const [expanded, setExpanded] = useState(isActive && hasChildren)

  React.useEffect(() => {
    if (isActive && hasChildren) setExpanded(true)
  }, [isActive, hasChildren])

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative',
          isActive
            ? 'bg-gradient-to-r from-primary/10 to-transparent text-sidebar-accent-foreground border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
        )}
      >
        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative',
          isActive
            ? 'bg-gradient-to-r from-primary/10 to-transparent text-sidebar-accent-foreground border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
        )}
      >
        <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
        <span className="flex-1 text-left">{item.label}</span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-3.5 w-3.5" />
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
            <div className="ml-4 border-l border-sidebar-border pl-3 py-1 space-y-0.5">
              {item.children!.map((child) => {
                const childActive = pathname === child.href
                const badgeCount = badges?.[child.href]
                const ChildIcon = child.icon
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-all duration-300 ease-in-out',
                      childActive
                        ? 'bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {ChildIcon && <ChildIcon className={cn('h-3.5 w-3.5 shrink-0', childActive && 'text-primary')} />}
                      {child.label}
                    </span>
                    {badgeCount != null && badgeCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
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
  const { resolvedTheme, setTheme } = useTheme()
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  const isAdminMode = pathname.startsWith('/dashboard/admin')

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 ease-linear overflow-hidden',
        collapsed ? 'w-0 border-r-0' : 'w-(--sidebar-width)'
      )}
    >
      <AnimatePresence mode="wait">
        {isAdminMode ? (
          <motion.div
            key="admin-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mx-2 mt-2 px-1 pt-1 pb-1 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent"
          >
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground leading-tight">Administration</p>
                <p className="text-xs text-muted-foreground">Panel admin</p>
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
            <div className="mx-2 mt-2 px-1 pt-1 pb-1 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
              {teamsLoaded ? (
                <Dropdown
                  align="left"
                  trigger={
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-sidebar-accent/50 transition-all duration-300 ease-in-out w-full">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs overflow-hidden">
                        {currentTeam?.iconUrl ? (
                          <img src={currentTeam.iconUrl} alt={currentTeam.name} className="h-full w-full object-cover" />
                        ) : (
                          currentTeam?.name.charAt(0).toUpperCase() || 'T'
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {currentTeam?.name || 'Équipe'}
                        </p>
                        {currentTeam?.role && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {roleIcons[currentTeam.role]}
                            {roleLabels[currentTeam.role]}
                          </p>
                        )}
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                              <img src={team.iconUrl} alt={team.name} className="h-full w-full object-cover" />
                            ) : (
                              team.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">{team.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {roleIcons[team.role]}
                              {roleLabels[team.role]}
                            </p>
                          </div>
                        </div>
                        {team.isCurrent && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
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
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 rounded skeleton-shimmer" />
                    <div className="h-2.5 w-16 rounded skeleton-shimmer" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <AnimatePresence mode="wait">
        {isAdminMode ? (
          <motion.div
            key="admin-nav"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Back to dashboard */}
            <div className="px-3 pt-3 pb-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au dashboard
              </Link>
            </div>

            {/* Admin navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              <NavLink
                item={{ href: '/dashboard/admin', label: 'Vue d\'ensemble', icon: LayoutDashboard }}
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
            <div className="px-3 pt-3 pb-1">
              <Dropdown
                align="left"
                trigger={
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm font-semibold hover:bg-primary/10 transition-all group cursor-pointer">
                    <CirclePlus className="h-4 w-4 text-primary" />
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

            <CreateInvoiceModal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {mainNav.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} badges={badges} />
              ))}
              <div className="mx-1 my-2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <NavLink item={settingsNav} pathname={pathname} badges={badges} />
            </nav>

            {/* Feedback & Bug report */}
            <div className="px-3 pb-1 space-y-0.5">
              <button
                onClick={onOpenFeedback}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              >
                <Star className="h-4 w-4 shrink-0" />
                <span>Laisser un avis</span>
              </button>
              <button
                onClick={onOpenBugReport}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              >
                <Bug className="h-4 w-4 shrink-0" />
                <span>Signaler un bug</span>
              </button>
            </div>

            {/* About link */}
            <div className="px-3 pb-2">
              <Link
                href="/dashboard/about"
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative',
                  pathname === '/dashboard/about'
                    ? 'bg-gradient-to-r from-primary/10 to-transparent text-sidebar-accent-foreground border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                )}
              >
                <Info className={cn('h-4 w-4 shrink-0', pathname === '/dashboard/about' && 'text-primary')} />
                <span>À propos</span>
              </Link>
              <Link
                href="/legal"
                target="_blank"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out relative text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              >
                <Scale className="h-4 w-4 shrink-0" />
                <span>Informations légales</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* User section */}
      <div className="p-3 mx-2 mb-2 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
        <Dropdown
          align="left"
          trigger={
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-all duration-300 ease-in-out w-full">
              <Avatar
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                fallback={initials}
                size="sm"
                className=""
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {user.fullName || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isAdmin ? 'Administrateur' : 'Plan Free'}
                </p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          }
          position="above"
          className="min-w-[230px]"
        >
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user.fullName || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
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

          <div
            className="flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 hover:bg-muted transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }}
          >
            <div className="flex items-center gap-2.5">
              {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>Mode sombre</span>
            </div>
            <Switch checked={resolvedTheme === 'dark'} onChange={() => {}} />
          </div>

          <DropdownSeparator />

          <DropdownItem destructive onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Deconnexion
          </DropdownItem>
        </Dropdown>
      </div>
    </aside>
  )
}
