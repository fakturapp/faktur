'use client'

import Link from 'next/link'
import { Github, ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function DocsNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 border-b border-(--border)">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <svg className="size-6" viewBox="0 0 32 32" fill="none">
              <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#g)" />
              <path
                d="M9 9h14M9 16h11M9 23h8"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-sm">
              Faktur <span className="text-(--muted-foreground)">/ developers</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="/quickstart">Quickstart</NavLink>
            <NavLink href="/concepts/authentication">Concepts</NavLink>
            <NavLink href="/resources/invoices">Reference</NavLink>
            <NavLink href="/webhooks">Webhooks</NavLink>
            <NavLink href="/recipes">Recipes</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="https://fakturapp.cc"
            className="hidden items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-(--muted-foreground) transition-colors hover:bg-(--muted) hover:text-(--foreground) md:inline-flex"
          >
            <ExternalLink className="size-3.5" /> App
          </Link>
          <Link
            href="https://github.com/fakturapp"
            target="_blank"
            className="hidden rounded-lg p-2 text-(--muted-foreground) transition-colors hover:bg-(--muted) hover:text-(--foreground) md:block"
          >
            <Github className="size-4" />
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 md:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-(--border) md:hidden">
          <div className="space-y-1 px-4 py-3">
            <MobileLink href="/quickstart">Quickstart</MobileLink>
            <MobileLink href="/concepts/authentication">Concepts</MobileLink>
            <MobileLink href="/resources/invoices">Reference</MobileLink>
            <MobileLink href="/webhooks">Webhooks</MobileLink>
            <MobileLink href="/recipes">Recipes</MobileLink>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm text-(--muted-foreground) transition-colors hover:bg-(--muted) hover:text-(--foreground)"
    >
      {children}
    </Link>
  )
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm text-(--muted-foreground) hover:bg-(--muted) hover:text-(--foreground)"
    >
      {children}
    </Link>
  )
}
