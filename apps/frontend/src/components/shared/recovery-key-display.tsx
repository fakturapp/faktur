'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Check, Download, Mail } from '@/components/ui/icons'

interface RecoveryKeyDisplayProps {
  recoveryKey: string
}

export function RecoveryKeyDisplay({ recoveryKey }: RecoveryKeyDisplayProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const masked = recoveryKey.replace(/[A-Z0-9]/g, '\u2022')

  async function handleCopy() {
    await navigator.clipboard.writeText(recoveryKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const content = `Clef de secours ZenVoice\n========================\n\n${recoveryKey}\n\nConservez cette clef dans un endroit sûr.\nElle vous permettra de récupérer vos données chiffrées en cas de perte de mot de passe.\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zenvoice-recovery-key.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
        <p className="font-mono text-center text-lg tracking-wider select-all break-all">
          {revealed ? recoveryKey : masked}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setRevealed(!revealed)}
        >
          {revealed ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
          {revealed ? 'Masquer' : 'Afficher'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <><Check className="h-4 w-4 mr-1.5 text-green-400" />Copié !</>
          ) : (
            <><Copy className="h-4 w-4 mr-1.5" />Copier</>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-1.5" />
          .txt
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
        <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
        <p className="text-sm text-indigo-300">
          Cette clef a également été envoyée à votre adresse email.
        </p>
      </div>
    </div>
  )
}
