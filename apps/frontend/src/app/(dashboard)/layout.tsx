'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/ui/sidebar'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import {
  LogOut,
  User,
  Settings,
  Building2,
  Users,
  ChevronDown,
  Shield,
  Crown,
  Eye,
  UserCog,
  Plus,
  Check,
} from 'lucide-react'

interface TeamListItem {
  id: string
  name: string
  iconUrl: string | null
  role: string
  isOwner: boolean
  isCurrent: boolean
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [teams, setTeams] = useState<TeamListItem[]>([])
  const [teamsLoaded, setTeamsLoaded] = useState(false)

  useEffect(() => {
    if (user) {
      api.get<{ teams: TeamListItem[] }>('/team/all').then(({ data }) => {
        if (data?.teams) {
          setTeams(data.teams)
          setTeamsLoaded(true)
        }
      })
    }
  }, [user?.currentTeamId])

  async function handleSwitchTeam(teamId: string) {
    const { error } = await api.post('/team/switch', { teamId })
    if (!error) {
      await refreshUser()
      // Reload teams
      const { data } = await api.get<{ teams: TeamListItem[] }>('/team/all')
      if (data?.teams) setTeams(data.teams)
      router.refresh()
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  const initials = user.fullName
    ? user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  const currentTeam = teams.find((t) => t.isCurrent)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border px-6">
          {/* Team dropdown - left side */}
          <div className="flex items-center">
            {teamsLoaded && (
              <Dropdown
                align="left"
                trigger={
                  <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                      {currentTeam?.name.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {currentTeam?.name || 'Equipe'}
                      </p>
                      {currentTeam?.role && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {roleIcons[currentTeam.role]}
                          {roleLabels[currentTeam.role]}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                }
                className="min-w-[280px]"
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vos equipes
                  </p>
                </div>

                {teams.map((team) => (
                  <DropdownItem
                    key={team.id}
                    onClick={() => {
                      if (!team.isCurrent) handleSwitchTeam(team.id)
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                          {team.name.charAt(0).toUpperCase()}
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

                <Link href="/team">
                  <DropdownItem>
                    <Users className="h-4 w-4" /> Gerer l&apos;equipe
                  </DropdownItem>
                </Link>
                <Link href="/company">
                  <DropdownItem>
                    <Building2 className="h-4 w-4" /> Entreprise
                  </DropdownItem>
                </Link>

                <DropdownSeparator />

                <DropdownItem onClick={() => router.push('/team/create')}>
                  <Plus className="h-4 w-4" /> Creer une equipe
                </DropdownItem>
              </Dropdown>
            )}
          </div>

          {/* User dropdown - right side */}
          <Dropdown
            trigger={
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.fullName || user.email}
                  fallback={initials}
                  size="sm"
                />
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {user.fullName || user.email}
                </span>
              </div>
            }
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownSeparator />
            <Link href="/account">
              <DropdownItem>
                <User className="h-4 w-4" /> Mon compte
              </DropdownItem>
            </Link>
            <Link href="/account">
              <DropdownItem>
                <Settings className="h-4 w-4" /> Parametres
              </DropdownItem>
            </Link>
            <DropdownSeparator />
            <DropdownItem destructive onClick={logout}>
              <LogOut className="h-4 w-4" /> Se deconnecter
            </DropdownItem>
          </Dropdown>
        </header>

        {/* Main content - full width */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
