'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  plaintext: string
  keyName: string
  kind: 'api_key' | 'webhook_secret'
  onClose: () => void
}

export function RevealedKeyDialog({ open, plaintext, keyName, kind, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!open) return null

  async function copy() {
    await navigator.clipboard.writeText(plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isApiKey = kind === 'api_key'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        onClick={(e) => {
          if (confirmed) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-2.5">
                <Sparkles className="size-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isApiKey ? 'API key created' : 'Signing secret rotated'}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {isApiKey ? keyName : `${keyName} webhook`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-200">
                <strong>Copy this {isApiKey ? 'key' : 'secret'} now.</strong> For security reasons,
                it will not be shown again.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isApiKey ? 'API key' : 'Signing secret'}
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
                <code className="flex-1 truncate font-mono text-sm">{plaintext}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={copy}
                  startContent={
                    copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />
                  }
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {isApiKey && (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Try it
                </label>
                <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed">
                  <code>{`curl https://api.fakturapp.cc/api/v2/ping \\\n  -H "Authorization: Bearer ${plaintext}"`}</code>
                </pre>
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-muted/40">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4"
              />
              <span className="text-sm text-muted-foreground">
                I have copied the {isApiKey ? 'key' : 'secret'} and stored it in a safe place.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-3">
            <Button onPress={onClose} isDisabled={!confirmed}>
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
