'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard/admin/analytics', label: 'Vue d\'ensemble', exact: true },
  { href: '/dashboard/admin/analytics/pages', label: 'Pages' },
  { href: '/dashboard/admin/analytics/features', label: 'Features' },
  { href: '/dashboard/admin/analytics/errors', label: 'Erreurs' },
  { href: '/dashboard/admin/analytics/performance', label: 'Performance' },
  { href: '/dashboard/admin/analytics/users', label: 'Utilisateurs' },
]

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-4">Analytiques</h1>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
