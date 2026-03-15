'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
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
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  accepted: { label: 'Accepté', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'destructive' },
  pending: { label: 'En attente', variant: 'warning' },
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Activite recente</CardTitle>
          <CardDescription>
            {items.length > 0
              ? `${items.length} document${items.length > 1 ? 's' : ''} recents`
              : 'Aucun document recent'}
          </CardDescription>
          {items.length > 0 && (
            <CardAction>
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm">
                  Tout voir <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardAction>
          )}
        </CardHeader>

        {items.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucune activite recente</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Créez votre première facture ou devis pour commencer.
            </p>
            <Link href="/dashboard/invoices/new">
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Créer une facture
              </Button>
            </Link>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const status = statusMap[item.status] || { label: item.status, variant: 'muted' as const }
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          {item.type === 'invoice' ? (
                            <FileText className="h-4 w-4 text-primary" />
                          ) : (
                            <Receipt className="h-4 w-4 text-yellow-500" />
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium text-foreground">{item.number}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-foreground truncate">{item.clientName}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium text-foreground tabular-nums">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
