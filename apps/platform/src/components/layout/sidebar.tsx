'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Book,
  Check,
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileText,
  Folder,
  Info,
  Key,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  MoreHorizontal,
  Palette,
  Scale,
  ScrollText,
  Settings,
  Sun,
  Terminal,
  User,
  Users,
  Webhook,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, type PlatformTeam } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useProjects } from '@/lib/projects-context'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { DASHBOARD_URL, DOCS_URL } from '@/lib/oauth-config'
import { Avatar } from '@/components/ui/avatar'
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownSub,
} from '@/components/ui/dropdown'

function matchProjectKey(pathname: string): { projectId: string; keyId: string | null } | null {
  const m = pathname.match(/^\/projects\/([^/]+)(?:\/keys\/([^/]+))?/)
  if (!m) return null
  return { projectId: m[1], keyId: m[2] ?? null }
}

export function Sidebar() {
  const pathname = usePathname()
  const ctx = matchProjectKey(pathname)

  if (ctx?.keyId) {
    return <KeySidebar projectId={ctx.projectId} keyId={ctx.keyId} pathname={pathname} />
  }
  if (ctx?.projectId) {
    return <ProjectSidebar projectId={ctx.projectId} pathname={pathname} />
  }
  return <DefaultSidebar pathname={pathname} />
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-(--sidebar-width) flex-col overflow-hidden rounded-r-[2rem] border-r border-sidebar-border bg-sidebar shadow-2xl">
      {children}
    </aside>
  )
}

function Brand() {
  return (
    <div className="px-3 pt-4 pb-2">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5">
        <FakturBadge />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            Faktur
          </p>
          <p className="text-[10px] leading-tight text-muted-foreground">
            Plateforme développeur
          </p>
        </div>
      </Link>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  trailing,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  badge?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 truncate font-medium">{label}</span>
      {badge}
      {trailing}
    </Link>
  )
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      <ArrowLeft className="h-3 w-3" />
      {label}
    </Link>
  )
}

function DefaultSidebar({ pathname }: { pathname: string }) {
  return (
    <Shell>
      <Brand />
      <div className="mx-3 h-px bg-border" />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plateforme
        </p>
        <NavLink
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active={pathname === '/dashboard'}
        />
        <NavLink
          href="/projects"
          icon={Folder}
          label="Projets"
          active={pathname === '/projects'}
        />
        <NavLink
          href="/credits"
          icon={CreditCard}
          label="Crédits"
          active={pathname === '/credits'}
          trailing={
            <span className="rounded border border-border px-1 py-px text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Bientôt
            </span>
          }
        />
        <ResourcesSection />
      </nav>
      <UserFooter />
    </Shell>
  )
}

function ProjectSidebar({
  projectId,
  pathname,
}: {
  projectId: string
  pathname: string
}) {
  const { projects } = useProjects()
  const project = projects?.find((p) => p.id === projectId)

  const items: Array<{
    href: string
    icon: React.ElementType
    label: string
    exact?: boolean
  }> = [
    { href: `/projects/${projectId}`, icon: LayoutDashboard, label: "Vue d'ensemble", exact: true },
    { href: `/projects/${projectId}/api-keys`, icon: Key, label: 'Clés API' },
    { href: `/projects/${projectId}/explorer`, icon: Terminal, label: 'API Explorer' },
    { href: `/projects/${projectId}/activity`, icon: Activity, label: 'Activité' },
    { href: `/projects/${projectId}/settings`, icon: Settings, label: 'Paramètres' },
  ]

  return (
    <Shell>
      <Brand />
      <div className="mx-3 h-px bg-border" />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <BackLink href="/projects" label="Tous les projets" />
        {project && (
          <div className="mt-2 mb-2 px-2.5">
            <div className="flex items-center gap-2">
              <Folder className="h-3.5 w-3.5 text-accent" />
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-foreground">
                {project.name}
              </p>
            </div>
          </div>
        )}
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={
              item.exact ? pathname === item.href : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>
      <UserFooter />
    </Shell>
  )
}

function KeySidebar({
  projectId,
  keyId,
  pathname,
}: {
  projectId: string
  keyId: string
  pathname: string
}) {
  const [key, setKey] = useState<ApiKeyShape | null>(null)

  useEffect(() => {
    apiKeysClient.show(keyId).then((res) => {
      if (res.data?.data) setKey(res.data.data)
    })
  }, [keyId])

  const base = `/projects/${projectId}/keys/${keyId}`
  const items: Array<{ href: string; icon: React.ElementType; label: string; exact?: boolean }> = [
    { href: base, icon: FileText, label: "Vue d'ensemble", exact: true },
    { href: `${base}/webhook`, icon: Webhook, label: 'Webhook' },
    { href: `${base}/deliveries`, icon: ListChecks, label: 'Livraisons' },
    { href: `${base}/logs`, icon: ScrollText, label: 'Journaux' },
    { href: `${base}/usage`, icon: BarChart3, label: 'Utilisation' },
  ]

  return (
    <Shell>
      <Brand />
      <div className="mx-3 h-px bg-border" />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <BackLink href={`/projects/${projectId}`} label="Retour au projet" />
        {key && (
          <div className="mt-2 mb-2 px-2.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  key.status === 'active'
                    ? 'bg-success'
                    : key.status === 'revoked'
                      ? 'bg-danger'
                      : key.status === 'rotating'
                        ? 'bg-warning'
                        : 'bg-muted-secondary'
                )}
              />
              <p className="truncate text-xs font-semibold text-foreground">{key.name}</p>
            </div>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {key.masked_token}
            </p>
          </div>
        )}
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
          />
        ))}
      </nav>
      <UserFooter />
    </Shell>
  )
}

function ResourcesSection() {
  return (
    <div className="pt-4">
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Ressources
      </p>
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <Book className="h-4 w-4" />
        <span className="flex-1 font-medium">Documentation</span>
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
      <a
        href={DASHBOARD_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4" />
        <span className="flex-1 font-medium">App Faktur</span>
      </a>
    </div>
  )
}

function UserFooter() {
  const { user, teams, currentTeam, selectTeam, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [switching, setSwitching] = useState<string | null>(null)

  async function handleSelectTeam(team: PlatformTeam) {
    if (team.id === currentTeam?.id) return
    setSwitching(team.id)
    try {
      await selectTeam(team.id)
    } finally {
      setSwitching(null)
    }
  }

  if (!user) return null

  const initials = (user.fullName ?? user.email).slice(0, 1).toUpperCase()
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun
  const themeLabel = theme === 'system' ? 'Système' : theme === 'dark' ? 'Sombre' : 'Clair'

  return (
    <div className="p-2.5">
      <Dropdown
        align="left"
        position="above"
        sideOffset={4}
        alignOffset={8}
        className="min-w-[260px]"
        trigger={
          <div className="flex w-full items-center justify-start gap-2.5 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-muted/40 dark:hover:bg-white/[0.04]">
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.fullName ?? user.email}
              fallback={initials}
              size="sm"
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[14px] font-medium leading-tight text-foreground">
                {user.fullName ?? user.email.split('@')[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
                setTheme(next)
              }}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
              title={themeLabel}
              aria-label={`Thème : ${themeLabel}`}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
            <MoreHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
        }
      >
        <div className="mb-1 border-b border-border px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.fullName ?? user.email}
              fallback={initials}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName ?? user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <a href={`${DASHBOARD_URL}/dashboard/account`} target="_blank" rel="noreferrer">
          <DropdownItem>
            <User className="h-4 w-4 text-violet-500" />
            Mon compte
          </DropdownItem>
        </a>

        <DropdownSeparator />

        <DropdownSub
          trigger={
            <>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded bg-accent-soft text-[9px] font-bold text-accent">
                {currentTeam?.iconUrl ? (
                  <img
                    src={currentTeam.iconUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (currentTeam?.name ?? 'E').charAt(0).toUpperCase()
                )}
              </div>
              <span className="max-w-[140px] flex-1 truncate text-left">
                {currentTeam?.name ?? 'Équipe'}
              </span>
            </>
          }
        >
          <DropdownLabel>Vos équipes</DropdownLabel>
          {teams.map((team) => {
            const isCurrent = team.id === currentTeam?.id
            const isBusy = switching === team.id
            return (
              <DropdownItem
                key={team.id}
                onClick={() => handleSelectTeam(team)}
                disabled={isBusy}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-[10px] font-semibold text-foreground">
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
                    <span className="truncate text-sm">{team.name}</span>
                  </div>
                  {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
                </div>
              </DropdownItem>
            )
          })}
        </DropdownSub>

        <DropdownSeparator />

        <DropdownSub
          trigger={
            <>
              <Palette className="h-4 w-4 text-violet-500" />
              <span className="flex-1 text-left">Apparence</span>
              <span className="text-[11px] text-muted-foreground">{themeLabel}</span>
            </>
          }
        >
          <DropdownLabel>Thème</DropdownLabel>
          <DropdownItem onClick={() => setTheme('light')} selected={theme === 'light'}>
            <Sun className="h-4 w-4 text-amber-500" />
            Clair
          </DropdownItem>
          <DropdownItem onClick={() => setTheme('dark')} selected={theme === 'dark'}>
            <Moon className="h-4 w-4 text-indigo-400" />
            Sombre
          </DropdownItem>
          <DropdownItem onClick={() => setTheme('system')} selected={theme === 'system'}>
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Système
          </DropdownItem>
        </DropdownSub>

        <DropdownSeparator />

        <DropdownSub
          trigger={
            <>
              <Info className="h-4 w-4 text-sky-500" />
              <span className="flex-1 text-left">Aide & informations</span>
            </>
          }
        >
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            <DropdownItem>
              <Book className="h-4 w-4 text-violet-500" />
              Documentation
            </DropdownItem>
          </a>
          <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
            <DropdownItem>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              App Faktur
            </DropdownItem>
          </a>
          <DropdownSeparator />
          <a href={`${DASHBOARD_URL}/about`} target="_blank" rel="noreferrer">
            <DropdownItem>
              <Info className="h-4 w-4 text-sky-500" />
              À propos
            </DropdownItem>
          </a>
          <a href={`${DASHBOARD_URL}/legal`} target="_blank" rel="noreferrer">
            <DropdownItem>
              <Scale className="h-4 w-4 text-muted-foreground" />
              Infos légales
            </DropdownItem>
          </a>
        </DropdownSub>

        <DropdownSeparator />

        <DropdownItem destructive onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Déconnexion
        </DropdownItem>
      </Dropdown>
    </div>
  )
}

function FakturBadge() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-8 shrink-0"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M9 9h14M9 16h11M9 23h8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
