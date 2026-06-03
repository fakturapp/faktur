'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { cn, formatBytes } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProgressBar } from '@/components/ui/progress'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HardDrive, Trash2, FileText, Building2, Receipt, UsersRound, ArrowUpRight } from 'lucide-react'

type StorageCategory = 'company_logo' | 'invoice_logo' | 'team_icon' | 'payment_link_pdf'

interface StorageUsage {
  fileBytes: number
  docBytes: number
  totalBytes: number
  quotaBytes: number
  percent: number
  isOver: boolean
  plan: 'free' | 'pro' | 'team'
}

interface StorageFileEntry {
  id: string
  category: StorageCategory
  objectKey: string
  publicUrl: string
  sizeBytes: number
  contentType: string | null
  originalName: string | null
  isActive: boolean
  createdAt: string | null
}

const CATEGORY_META: Record<StorageCategory, { label: string; icon: typeof Building2; isImage: boolean }> = {
  company_logo: { label: "Logos d'entreprise", icon: Building2, isImage: true },
  invoice_logo: { label: 'Logos de facture', icon: Receipt, isImage: true },
  team_icon: { label: "Icônes d'équipe", icon: UsersRound, isImage: true },
  payment_link_pdf: { label: 'PDF de paiement', icon: FileText, isImage: false },
}

const CATEGORY_ORDER: StorageCategory[] = ['company_logo', 'invoice_logo', 'team_icon', 'payment_link_pdf']

export default function StoragePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [files, setFiles] = useState<StorageFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState<StorageFileEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const [usageRes, filesRes] = await Promise.all([
      api.get<StorageUsage>('/storage/usage'),
      api.get<{ files: StorageFileEntry[] }>('/storage/files'),
    ])
    if (usageRes.data) setUsage(usageRes.data)
    if (filesRes.data?.files) setFiles(filesRes.data.files)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    const { error } = await api.delete(`/storage/files/${toDelete.id}`)
    setDeleting(false)
    if (error) {
      toast(error, 'error')
      return
    }
    setFiles((prev) => prev.filter((f) => f.id !== toDelete.id))
    setToDelete(null)
    toast('Fichier supprimé', 'success')
    window.dispatchEvent(new Event('faktur:storage-changed'))
    load()
  }

  const danger = (usage?.percent ?? 0) >= 80

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Skeleton className="mb-6 h-7 w-48" />
        <Skeleton className="mb-8 h-24 w-full rounded-2xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: files.filter((f) => f.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <HardDrive className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">Espace de stockage</h1>
          <p className="text-xs text-muted-foreground">
            Logos, icônes et fichiers stockés par votre équipe
          </p>
        </div>
      </div>

      <div
        className={cn(
          'mb-8 rounded-2xl border p-5 shadow-surface',
          danger ? 'border-danger/30 bg-danger/[0.04]' : 'border-border bg-surface'
        )}
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatBytes(usage?.totalBytes ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              sur {formatBytes(usage?.quotaBytes ?? 0)} disponibles
            </p>
          </div>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              danger ? 'text-danger' : 'text-muted-foreground'
            )}
          >
            {usage?.percent ?? 0}%
          </span>
        </div>
        <ProgressBar
          value={usage?.percent ?? 0}
          maxValue={100}
          showOutput={false}
          color={danger ? 'danger' : 'accent'}
          aria-label="Espace de stockage utilisé"
        />
        {usage?.plan !== 'team' && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/dashboard/settings/plan/upgrade')}
          >
            Augmenter l&apos;espace de stockage
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <HardDrive className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Aucun fichier stocké pour le moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => {
            const meta = CATEGORY_META[category]
            const Icon = meta.icon
            return (
              <section key={category}>
                <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {meta.label}
                  <span className="font-normal normal-case">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-surface"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {meta.isImage ? (
                          <img
                            src={file.publicUrl}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {file.originalName || file.objectKey.split('/').pop()}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          file.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {file.isActive ? 'Actif' : 'Orphelin'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setToDelete(file)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogHeader onClose={() => setToDelete(null)} icon={<Trash2 className="h-5 w-5 text-danger" />}>
          <DialogTitle>Supprimer ce fichier</DialogTitle>
          <DialogDescription>
            {toDelete?.isActive
              ? 'Ce fichier est actuellement utilisé. Le supprimer le retirera de votre document.'
              : 'Ce fichier sera définitivement supprimé de votre espace de stockage.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
