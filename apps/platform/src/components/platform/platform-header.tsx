'use client'

import Link from 'next/link'
import { LogOut, Book, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { DASHBOARD_URL, DOCS_URL } from '@/lib/oauth-config'
import { TeamSwitcher } from './team-switcher'

export function PlatformHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <FakturBadge />
          <span className="hidden text-foreground sm:inline">
            Faktur <span className="font-normal text-muted-foreground">/ developers</span>
          </span>
        </Link>

        <div className="ml-2 hidden h-5 w-px bg-border sm:block" />

        <div className="hidden sm:block">
          <TeamSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1">
          <Link
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Book className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Documentation</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
          <Link
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <span className="hidden md:inline">App Faktur</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>

          {user && (
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-xs text-muted-foreground md:inline">
                {user.fullName ?? user.email.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={signOut}
                aria-label="Déconnexion"
                className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-separator px-4 py-2 sm:hidden">
        <TeamSwitcher />
      </div>
    </header>
  )
}

function FakturBadge() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden xmlns="http://www.w3.org/2000/svg">
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
