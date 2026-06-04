"use client"

import { useEffect, useState } from "react"
import { Bug } from "@/components/ui/icons"
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DEV_DETAILS_EVENT } from "@/components/ui/toast"
import type { CapturedApiError } from "@/lib/dev-mode"

export function ApiErrorDetailsDialog() {
  const [data, setData] = useState<CapturedApiError | null>(null)

  useEffect(() => {
    function onShow(e: Event) {
      const detail = (e as CustomEvent<CapturedApiError>).detail
      if (detail) setData(detail)
    }
    window.addEventListener(DEV_DETAILS_EVENT, onShow)
    return () => window.removeEventListener(DEV_DETAILS_EVENT, onShow)
  }, [])

  function copyDetails() {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).catch(() => {})
  }

  return (
    <Dialog
      open={!!data}
      onClose={() => setData(null)}
      className="max-w-2xl"
      zIndex="z-[10020]"
    >
      <DialogHeader onClose={() => setData(null)} icon={<Bug className="h-5 w-5 text-danger" />}>
        <DialogTitle>Détails de l&apos;erreur</DialogTitle>
        <DialogDescription>
          Mode développeur — payload brut renvoyé par l&apos;API.
        </DialogDescription>
      </DialogHeader>
      {data && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1.5">
            <span className="font-medium text-muted-foreground">Status</span>
            <span className="font-mono text-foreground">{data.status}</span>
            <span className="font-medium text-muted-foreground">Method</span>
            <span className="font-mono text-foreground">{data.method}</span>
            <span className="font-medium text-muted-foreground">URL</span>
            <span className="font-mono text-foreground break-all">{data.url}</span>
            <span className="font-medium text-muted-foreground">Quand</span>
            <span className="font-mono text-foreground">
              {new Date(data.ts).toLocaleTimeString()}
            </span>
          </div>
          <div className="rounded-lg bg-surface border border-border/40 p-3 max-h-[50vh] overflow-auto">
            <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap break-all">
              {JSON.stringify(data.body, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={copyDetails}>
              Copier
            </Button>
            <Button size="sm" onClick={() => setData(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
