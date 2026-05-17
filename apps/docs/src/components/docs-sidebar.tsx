'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { SIDEBAR_SECTIONS } from '@/lib/nav-config'
import { cn } from '@/lib/cn'

export function DocsSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href
  }

  return (
    <aside
      aria-label="Documentation"
      className="hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-separator lg:block"
    >
      <nav className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-px">
                {section.links.map((link) => {
                  const active = !link.external && isActive(link.href)
                  if (link.external) {
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                        >
                          {link.label}
                          <ExternalLinkIcon className="size-3 opacity-60" />
                        </a>
                      </li>
                    )
                  }
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center rounded-md px-2 py-1.5 text-[13px] transition-colors',
                          active
                            ? 'bg-accent-soft font-medium text-accent-soft-foreground'
                            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
