'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Receipt,
  Plus,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react'

interface RecentItem {
  id: string
  type: 'invoice' | 'quote'
  number: string
  clientName: string
  amount: number
  status: string
  date: string
}

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'muted' }> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyee', variant: 'default' },
  paid: { label: 'Payee', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  accepted: { label: 'Accepte', variant: 'success' },
  rejected: { label: 'Refuse', variant: 'destructive' },
  pending: { label: 'En attente', variant: 'warning' },
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium">Activite recente</h2>
        {items.length > 0 && (
          <Link href="/dashboard/invoices" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Tout voir <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <Card>
        {items.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucune activite recente</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Creez votre premiere facture ou devis pour commencer.
            </p>
            <Link href="/dashboard/invoices/new">
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Creer une facture
              </Button>
            </Link>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Numero</div>
              <div className="col-span-3">Client</div>
              <div className="col-span-2">Montant</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            {items.map((item) => {
              const status = statusMap[item.status] || { label: item.status, variant: 'muted' as const }
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="col-span-1">
                    {item.type === 'invoice' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <Receipt className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-foreground">{item.number}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-foreground truncate">{item.clientName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
