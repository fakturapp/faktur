'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/lib/theme'
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
  children?: { href: string; label: string }[]
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
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
]

const settingsNav: NavItem = {
  href: '/dashboard/account',
  label: 'Parametres',
  icon: Settings,
  children: [
    { href: '/dashboard/account', label: 'Mon compte' },
    { href: '/dashboard/company', label: 'Entreprise' },
    { href: '/dashboard/team', label: 'Equipe' },
    { href: '/dashboard/settings/invoices', label: 'Facturation' },
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
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
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
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
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
                    <span>{child.label}</span>
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

export function Sidebar({ teams, currentTeam, teamsLoaded, onSwitchTeam, user, onLogout, collapsed, badges }: SidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear overflow-hidden',
        collapsed ? 'w-0' : 'w-(--sidebar-width)'
      )}
    >
      {/* Team header */}
      <div className="px-3 pt-3 pb-3">
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
                    {currentTeam?.name || 'Equipe'}
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

      <div className="mx-3 h-px bg-border" />

      {/* Quick create */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <CirclePlus className="h-4 w-4" />
          <span>Créer</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} badges={badges} />
        ))}
      </nav>

      {/* Pinned settings */}
      <div className="px-3 pb-2">
        <NavLink item={settingsNav} pathname={pathname} badges={badges} />
      </div>

      <div className="mx-3 h-px bg-border" />

      {/* User section */}
      <div className="p-3">
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
                  {user.email}
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
