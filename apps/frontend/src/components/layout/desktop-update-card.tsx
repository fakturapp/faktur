'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'
import {
  getFakturDesktopBridge,
  type FakturDesktopUpdateInfo,
} from '@/lib/is-desktop'
import { cn } from '@/lib/utils'


interface Props {
  collapsed?: boolean
}

export function DesktopUpdateCard({ collapsed = false }: Props) {
  const [info, setInfo] = useState<FakturDesktopUpdateInfo | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const bridge = getFakturDesktopBridge()
    if (!bridge) return

    let cancelled = false

    bridge.getPendingUpdate?.().then((cached) => {
      if (!cancelled && cached) setInfo(cached)
    })

    const unsub = bridge.onUpdateAvailable?.((newInfo) => {
      if (!cancelled) setInfo(newInfo)
    })

    return () => {
      cancelled = true
      if (unsub) unsub()
    }
  }, [])

  async function handleRelaunch() {
    const bridge = getFakturDesktopBridge()
    if (!bridge?.beginUpdate) return
    setBusy(true)
    try {
      await bridge.beginUpdate()
    } catch {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mx-3 mt-3 overflow-hidden"
        >
          <div
            className={cn(
              'rounded-xl border border-primary/25 bg-primary/5 shadow-sm',
              collapsed ? 'p-2' : 'p-3'
            )}
          >
            {collapsed ? (
              <button
                type="button"
                onClick={handleRelaunch}
                disabled={busy}
                title={`Mise à jour v${info.version} disponible`}
                className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              >
                {busy ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-7 w-7 shrink-0 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                    <Download className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground leading-tight">
                      Mise à jour disponible
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      v{info.version} &middot; {(info.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRelaunch}
                  disabled={busy}
                  className="w-full h-8 rounded-lg bg-primary text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {busy ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Préparation…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Relancer maintenant
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
