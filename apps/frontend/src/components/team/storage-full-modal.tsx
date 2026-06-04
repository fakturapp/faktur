'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress'
import { formatBytes } from '@/lib/utils'
import { HardDrive, Trash2, ArrowUpRight } from '@/components/ui/icons'

interface StorageInfo {
  totalBytes: number
  quotaBytes: number
  percent: number
  plan: 'free' | 'pro' | 'team'
}

export function StorageFullModal({
  open,
  onClose,
  usage,
}: {
  open: boolean
  onClose: () => void
  usage: StorageInfo | null
}) {
  const router = useRouter()

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose} icon={<HardDrive className="h-5 w-5 text-danger" />}>
        <DialogTitle>Espace de stockage plein</DialogTitle>
        <DialogDescription>
          Vous avez atteint la limite de stockage de votre équipe. Tant qu&apos;elle est pleine,
          vous ne pouvez plus créer, modifier ou dupliquer de documents, ni importer de fichiers.
          La suppression reste possible.
        </DialogDescription>
      </DialogHeader>

      {usage && (
        <div className="mb-2 rounded-xl border border-danger/30 bg-danger/[0.04] p-4">
          <div className="mb-2 flex items-end justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">
              {formatBytes(usage.totalBytes)} / {formatBytes(usage.quotaBytes)}
            </span>
            <span className="text-sm font-semibold text-danger">{usage.percent}%</span>
          </div>
          <ProgressBar value={usage.percent} maxValue={100} showOutput={false} color="danger" />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Pour continuer, libérez de l&apos;espace en supprimant des fichiers inutilisés (anciens
        logos, PDF) ou augmentez votre forfait.
      </p>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onClose()
            router.push('/dashboard/settings/storage')
          }}
        >
          <Trash2 className="h-4 w-4" />
          Gérer le stockage
        </Button>
        {usage?.plan !== 'team' && (
          <Button
            onClick={() => {
              onClose()
              router.push('/dashboard/settings/plan/upgrade')
            }}
          >
            Augmenter le stockage
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}
