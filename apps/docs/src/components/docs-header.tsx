'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { GithubIcon } from '@/components/icons/github-icon'
import { ThemeToggle } from '@/components/theme-toggle'
import { PRIMARY_LINKS, SIDEBAR_SECTIONS } from '@/lib/nav-config'
import { DASHBOARD_URL } from '@/lib/config'
import { cn } from '@/lib/cn'

function FakturLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className="size-6 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M9 9h14M9 16h11M9 23h8"
        stroke="var(--background)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DocsHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="docs-glass fixed inset-x-0 top-0 z-40 border-b border-separator">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="text-accent">
            <FakturLogo />
          </span>
          <span className="hidden text-sm sm:inline">
            Faktur <span className="text-muted-foreground">/ developers</span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center md:flex" aria-label="Primary">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3 py-1.5 text-[13px] transition-colors',
                isActive(link.href)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Link
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:inline-flex"
          >
            App
            <ExternalLinkIcon className="size-3" />
          </Link>
          <Link
            href="https://github.com/fakturapp"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden size-7 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:inline-flex"
          >
            <GithubIcon className="size-3.5" />
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex size-8 items-center justify-center rounded-full border border-border bg-surface text-foreground md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-separator md:hidden">
          <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-4">
            <div className="flex flex-wrap gap-1">
              {PRIMARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs transition-colors',
                    isActive(link.href)
                      ? 'bg-accent-soft text-accent-soft-foreground'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="space-y-3">
              {SIDEBAR_SECTIONS.map((section) => (
                <div key={section.label}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-1 gap-0.5">
                    {section.links.map((link) =>
                      link.external ? (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setOpen(false)}
                          className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'rounded-md px-2 py-1 text-sm transition-colors',
                            isActive(link.href)
                              ? 'bg-accent-soft text-accent-soft-foreground'
                              : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                          )}
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
