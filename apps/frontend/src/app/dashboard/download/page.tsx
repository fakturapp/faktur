'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Download,
  Check,
  Shield,
  Lock,
  Zap,
  Sparkles,
  Monitor,
  Apple,
  MonitorDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isFakturDesktop, getFakturDesktopVersion } from '@/lib/is-desktop'

const WINDOWS_DOWNLOAD_URL =
  'https://github.com/fakturapp/faktur-desktop/releases/download/latest/FakturDesktop-Installer.exe'

const FEATURES = [
  {
    icon: Zap,
    title: 'Lancement instantané',
    description: 'Un raccourci sur ton bureau, plus de navigateur à ouvrir.',
  },
  {
    icon: Lock,
    title: 'Sessions persistantes',
    description:
      'Tes jetons OAuth sont chiffrés par le coffre-fort de ton OS (Keychain, DPAPI, libsecret).',
  },
  {
    icon: Shield,
    title: 'Signature cryptographique',
    description:
      'Chaque release officielle est signée Ed25519. Un badge bleu ✓ apparaît quand l\u2019app tourne avec le binaire authentique.',
  },
  {
    icon: Sparkles,
    title: 'Mises à jour automatiques',
    description:
      'L\u2019app vérifie les nouvelles versions sur GitHub et te propose la mise à jour en un clic.',
  },
]

export default function DownloadPage() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null)

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
    setDesktopVersion(getFakturDesktopVersion())
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto px-4 lg:px-6 py-6 md:py-10 space-y-8"
    >
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="relative">
          <Image
            src="/logo.svg"
            alt="Faktur Desktop"
            width={84}
            height={84}
            className="h-[84px] w-auto drop-shadow-[0_20px_40px_rgba(99,102,241,0.4)]"
          />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground font-lexend tracking-tight">
            Faktur Desktop
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-md leading-relaxed">
            L&apos;application de bureau officielle de Faktur. Sécurisée,
            chiffrée, et toujours à portée d&apos;un clic.
          </p>
        </div>
        {isDesktop && (
          <Badge variant="success" className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            Version installée {desktopVersion ? `· v${desktopVersion}` : ''}
          </Badge>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="relative p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center">
              <MonitorDown className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">
                Application de bureau
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Télécharge Faktur Desktop pour Windows et profite d&apos;une
                expérience native, sans jamais quitter la sécurité zero-access.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-border p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {feature.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
              <Monitor className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Windows</p>
              <p className="text-xs text-muted-foreground">
                Installeur NSIS · ~80 MB · Windows 10 et plus récent
              </p>
            </div>
            {isDesktop ? (
              <Button
                size="sm"
                variant="outline"
                disabled
                className={cn(
                  'gap-2 opacity-100 cursor-default',
                  'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10'
                )}
              >
                <Check className="h-4 w-4" />
                Actuelle
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  const bridge =
                    typeof window !== 'undefined'
                      ? (window as any).fakturDesktop
                      : null
                  if (bridge?.openExternal) {
                    bridge.openExternal(WINDOWS_DOWNLOAD_URL)
                  } else {
                    window.open(WINDOWS_DOWNLOAD_URL, '_blank')
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Télécharger
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-4 mt-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
              <Apple className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">macOS · Linux</p>
              <p className="text-xs text-muted-foreground/70">
                Bientôt disponibles. Ping-nous sur GitHub pour être notifié·e.
              </p>
            </div>
            <Badge variant="muted" className="text-[10px]">
              À venir
            </Badge>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-muted-foreground/60 pb-4">
        En téléchargeant Faktur Desktop, tu acceptes la{' '}
        <a
          href="https://github.com/fakturapp/faktur-desktop/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          licence Personal Use
        </a>
        .
      </div>
    </motion.div>
  )
}
