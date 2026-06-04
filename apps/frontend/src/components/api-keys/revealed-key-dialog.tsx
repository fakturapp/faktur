'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { AlertTriangle, Copy, Check } from '@/components/ui/icons'
import { API_V2_BASE_URL } from '@/lib/external-urls'

interface Props {
  open: boolean
  plaintext: string
  keyName: string
  kind: 'api_key' | 'webhook_secret'
  onClose: () => void
}

export function RevealedKeyDialog({ open, plaintext, keyName, kind, onClose }: Props) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!open) {
      setCopied(false)
      setConfirmed(false)
    }
  }, [open])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plaintext)
      setCopied(true)
      toast('Copié dans le presse-papier', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Impossible de copier', 'error')
    }
  }

  const isApiKey = kind === 'api_key'

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (confirmed) onClose()
      }}
      dismissible={false}
      className="max-w-lg"
    >
      <DialogHeader showClose={false}>
        <DialogTitle>
          {isApiKey ? 'Clé API créée' : 'Secret de signature généré'}
        </DialogTitle>
        <DialogDescription>{keyName}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/5 p-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">Copiez cette valeur maintenant.</span> Pour des raisons
          de sécurité, elle ne sera plus jamais affichée.
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isApiKey ? 'Clé API' : 'Secret webhook'}
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface p-2.5">
          <code className="flex-1 truncate font-mono text-sm text-foreground select-all">
            {plaintext}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copier
              </>
            )}
          </Button>
        </div>
      </div>

      {isApiKey && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Test rapide
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border/50 bg-surface p-3 text-xs leading-relaxed">
            <code>{`curl ${API_V2_BASE_URL}/ping \\
  -H "Authorization: Bearer ${plaintext.slice(0, 16)}..."`}</code>
          </pre>
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 p-3 hover:bg-surface-hover transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-accent"
        />
        <span className="text-sm text-foreground">
          J&apos;ai copié {isApiKey ? 'la clé' : 'le secret'} et l&apos;ai stocké en lieu sûr.
        </span>
      </label>

      <DialogFooter>
        <Button onClick={onClose} disabled={!confirmed}>
          Terminé
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
