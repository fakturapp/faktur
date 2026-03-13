'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Receipt, Users, Plus, ArrowRight } from 'lucide-react'

const actions = [
  { label: 'Nouvelle facture', icon: FileText, href: '/dashboard/invoices/new', color: 'bg-primary/10 text-primary' },
  { label: 'Nouveau devis', icon: Receipt, href: '/dashboard/quotes/new', color: 'bg-yellow-500/10 text-yellow-500' },
  { label: 'Nouveau client', icon: Users, href: '/dashboard/clients/create', color: 'bg-blue-500/10 text-blue-500' },
]

export function QuickActions() {
  return (
    <div className="px-4 lg:px-6">
      <h2 className="text-base font-medium mb-4">Actions rapides</h2>
      <div className="grid gap-3 @xl/main:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="group cursor-pointer hover:ring-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} transition-colors`}>
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
