'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Book,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Key,
  LogOut,
  Plus,
  Webhook,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { useApiKeys } from '@/lib/api-keys-context'
import { DASHBOARD_URL, DOCS_URL } from '@/lib/oauth-config'
import { TeamSwitcher } from '@/components/platform/team-switcher'
import { Avatar } from '@/components/ui/avatar'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown'

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { keys, loading, openCreate } = useApiKeys()
  const [keysOpen, setKeysOpen] = useState(true)

  const isOnKeys = pathname === '/api-keys' || pathname.startsWith('/api-keys/')
  const isOnCredits = pathname === '/credits'

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-(--sidebar-width) flex-col overflow-hidden rounded-r-[2rem] border-r border-sidebar-border bg-sidebar shadow-2xl">
      <div className="px-3 pt-3 pb-2">
        <Link href="/api-keys" className="flex items-center gap-2.5 px-2 py-1.5">
          <FakturBadge />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight text-foreground">
              Faktur
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">Plateforme dev</p>
          </div>
        </Link>
        <div className="mt-2 px-2">
          <TeamSwitcher />
        </div>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plateforme
        </p>

        <div>
          <div className="flex items-center">
            <Link
              href="/api-keys"
              className={cn(
                'flex flex-1 items-center gap-2.5 rounded-l-lg px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                isOnKeys && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <Key className="h-4 w-4" />
              <span className="flex-1 text-left font-medium">Clés API</span>
              {keys && (
                <span className="text-[11px] text-muted-foreground">{keys.length}</span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setKeysOpen((v) => !v)}
              aria-label={keysOpen ? 'Replier' : 'Déplier'}
              className={cn(
                'flex h-8 w-7 items-center justify-center rounded-r-lg transition-colors hover:bg-sidebar-accent',
                isOnKeys && 'bg-sidebar-accent'
              )}
            >
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform',
                  !keysOpen && '-rotate-90'
                )}
              />
            </button>
          </div>

          {keysOpen && (
            <div className="ml-3.5 mt-0.5 mb-1 space-y-0.5 border-l border-border pl-2.5">
              {loading && keys === null ? (
                <div className="py-2 space-y-1">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-6 animate-pulse rounded-md bg-surface-secondary/40"
                    />
                  ))}
                </div>
              ) : keys && keys.length === 0 ? (
                <p className="px-2.5 py-1.5 text-[11px] italic text-muted-foreground">
                  Aucune clé
                </p>
              ) : (
                keys?.map((k) => {
                  const active = pathname === `/api-keys/${k.id}`
                  return (
                    <Link
                      key={k.id}
                      href={`/api-keys/${k.id}`}
                      className={cn(
                        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent',
                        active &&
                          'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          k.status === 'active'
                            ? 'bg-success'
                            : k.status === 'revoked'
                              ? 'bg-danger'
                              : k.status === 'rotating'
                                ? 'bg-warning'
                                : 'bg-muted-secondary'
                        )}
                      />
                      <span className="truncate">{k.name}</span>
                    </Link>
                  )
                })
              )}

              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Nouvelle clé
              </button>
            </div>
          )}
        </div>

        <Link
          href="/credits"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent',
            isOnCredits && 'bg-sidebar-accent text-sidebar-accent-foreground'
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span className="flex-1 font-medium">Crédits</span>
          <span className="rounded border border-border px-1 py-px text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Bientôt
          </span>
        </Link>

        <div className="pt-4">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ressources
          </p>
          <Link
            href="/webhooks"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent',
              pathname === '/webhooks' && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
          >
            <Webhook className="h-4 w-4" />
            <span className="flex-1 font-medium">Webhooks</span>
          </Link>
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
      </nav>

      <div className="mx-3 h-px bg-border" />

      <div className="p-2">
        {user && (
          <Dropdown
            position="above"
            align="left"
            trigger={
              <div className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent">
                <Avatar
                  src={user.avatarUrl ?? undefined}
                  fallback={(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {user.fullName ?? user.email.split('@')[0]}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            }
          >
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-foreground">
                {user.fullName ?? user.email.split('@')[0]}
              </p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onClick={signOut} className="text-danger">
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </aside>
  )
}

function FakturBadge() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-7 shrink-0"
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
