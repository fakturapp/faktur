'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Download,
  Check,
  Shield,
  Lock,
  Zap,
  RefreshCw,
  Smartphone,
  MonitorDown,
  Bell,
  Gauge,
  Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isFakturDesktop, getFakturDesktopVersion } from '@/lib/is-desktop'

const WINDOWS_DOWNLOAD_URL =
  'https://github.com/fakturapp/faktur-desktop/releases/download/latest/FakturDesktop-Installer.exe'

const DESKTOP_FEATURES = [
  {
    icon: Zap,
    title: 'Lancement instantané',
    description: 'Un raccourci sur ton bureau, plus de navigateur à ouvrir.',
  },
  {
    icon: Lock,
    title: 'Sessions persistantes',
    description:
      'Jetons OAuth chiffrés par le coffre-fort de ton OS (Keychain, DPAPI, libsecret).',
  },
  {
    icon: Shield,
    title: 'Signature Ed25519',
    description:
      'Chaque release officielle est signée. Badge bleu ✓ quand le binaire est authentique.',
  },
  {
    icon: RefreshCw,
    title: 'Mises à jour auto',
    description:
      'Vérification des nouvelles versions sur GitHub, installation en un clic.',
  },
]

const MOBILE_FEATURES = [
  {
    icon: Bell,
    title: 'Notifications push',
    description: 'Rappels de paiement, nouvelles factures — en temps réel sur ton téléphone.',
  },
  {
    icon: Gauge,
    title: 'Ultra léger',
    description: 'Construite pour la performance. Ouverture instantanée, synchro en arrière-plan.',
  },
  {
    icon: Wifi,
    title: 'Mode hors-ligne',
    description: 'Consulte tes documents même sans connexion. Synchronisation automatique au retour.',
  },
]

interface Platform {
  name: string
  logo: string | ReactNode
  logoInvert?: boolean
  subtitle: string
  status: 'available' | 'soon'
  action?: () => void
}

export default function DownloadPage() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [desktopVersion, setDesktopVersion] = useState<string | null>(null)

  useEffect(() => {
    setIsDesktop(isFakturDesktop())
    setDesktopVersion(getFakturDesktopVersion())
  }, [])

  function openWindowsDownload() {
    const bridge = typeof window !== 'undefined' ? (window as any).fakturDesktop : null
    if (bridge?.openExternal) {
      bridge.openExternal(WINDOWS_DOWNLOAD_URL)
    } else {
      window.open(WINDOWS_DOWNLOAD_URL, '_blank')
    }
  }

  const desktopPlatforms: Platform[] = [
    {
      name: 'Windows',
      logo: (
        <svg viewBox="0 0 512 512" fill="#0078D4" className="h-6 w-6">
          <g transform="translate(0,512) scale(0.1,-0.1)" stroke="none">
            <path d="M0 3870 l0 -1210 1225 0 1225 0 0 1210 0 1210 -1225 0 -1225 0 0 -1210z"/>
            <path d="M2670 3870 l0 -1210 1225 0 1225 0 0 1210 0 1210 -1225 0 -1225 0 0 -1210z"/>
            <path d="M0 1250 l0 -1210 1225 0 1225 0 0 1210 0 1210 -1225 0 -1225 0 0 -1210z"/>
            <path d="M2670 1250 l0 -1210 1225 0 1225 0 0 1210 0 1210 -1225 0 -1225 0 0 -1210z"/>
          </g>
        </svg>
      ),
      subtitle: 'Installeur NSIS · ~80 MB · Windows 10+',
      status: 'available',
      action: openWindowsDownload,
    },
    {
      name: 'macOS',
      logo: 'https://cdn.simpleicons.org/apple/999999',
      subtitle: 'Universal · Apple Silicon & Intel',
      status: 'soon',
    },
    {
      name: 'Linux',
      logo: 'https://cdn.simpleicons.org/linux/FCC624',
      subtitle: 'AppImage · .deb · .rpm',
      status: 'soon',
    },
  ]

  const mobilePlatforms: Platform[] = [
    {
      name: 'iOS',
      logo: 'https://cdn.simpleicons.org/apple/999999',
      subtitle: 'iPhone & iPad · iOS 16+',
      status: 'soon',
    },
    {
      name: 'Android',
      logo: 'https://cdn.simpleicons.org/android/3DDC84',
      subtitle: 'Android 10+ · Google Play',
      status: 'soon',
    },
  ]

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center gap-4 py-6"
      >
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full" />
          <Image
            src="/logo.svg"
            alt="Faktur"
            width={96}
            height={96}
            className="relative h-[96px] w-auto drop-shadow-[0_20px_50px_rgba(99,102,241,0.4)]"
          />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground font-lexend tracking-tight">
            Télécharge Faktur
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
            Les apps officielles Faktur pour ordinateur et téléphone. Sécurisées,
            chiffrées, et toujours à portée de main.
          </p>
        </div>
        {isDesktop && (
          <Badge variant="success" className="text-xs">
            <Check className="h-3 w-3 mr-1" />
            Desktop installé {desktopVersion ? `· v${desktopVersion}` : ''}
          </Badge>
        )}
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-3xl border border-border bg-card overflow-hidden"
      >
        <div className="relative p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center">
              <MonitorDown className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-foreground">
                Faktur Desktop
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                L&apos;application de bureau officielle. Expérience native, sans
                jamais quitter la sécurité zero-access.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DESKTOP_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-border/80"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {desktopPlatforms.map((platform) => (
              <PlatformCard
                key={platform.name}
                platform={platform}
                isCurrentlyInstalled={isDesktop && platform.name === 'Windows'}
              />
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-3xl border border-border bg-card overflow-hidden"
      >
        <div className="relative p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <Smartphone className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Faktur Mobile
                </h2>
                <Badge variant="muted" className="text-[10px]">
                  Bientôt
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Gère tes factures et devis depuis ton téléphone. Notifications
                push, mode hors-ligne, et synchro instantanée.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MOBILE_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mobilePlatforms.map((platform) => (
              <PlatformCard key={platform.name} platform={platform} />
            ))}
          </div>
        </div>
      </motion.section>

      <div className="text-center text-[11px] text-muted-foreground/60 pb-6">
        En téléchargeant les apps Faktur, tu acceptes la{' '}
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
    </div>
  )
}

function PlatformCard({
  platform,
  isCurrentlyInstalled = false,
}: {
  platform: Platform
  isCurrentlyInstalled?: boolean
}) {
  const isSoon = platform.status === 'soon'

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all',
        isSoon
          ? 'border-dashed border-border/60 bg-muted/10'
          : 'border-border bg-background/40 hover:border-border/80 hover:bg-background/70'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background border border-border/60 overflow-hidden">
          {typeof platform.logo === 'string' ? (
            <img
              src={platform.logo}
              alt={`${platform.name} logo`}
              width={24}
              height={24}
              className={cn('h-6 w-6 object-contain', isSoon && 'opacity-60 grayscale')}
            />
          ) : (
            <div className={cn('flex h-6 w-6 items-center justify-center', isSoon && 'opacity-60 grayscale')}>
              {platform.logo}
            </div>
          )}
        </div>
        {isSoon && (
          <Badge variant="muted" className="text-[10px]">
            Bientôt
          </Badge>
        )}
      </div>

      <div>
        <p
          className={cn(
            'text-base font-bold leading-tight',
            isSoon ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {platform.name}
        </p>
        <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">
          {platform.subtitle}
        </p>
      </div>

      {platform.status === 'available' && !isCurrentlyInstalled && (
        <Button
          size="sm"
          className="gap-2 w-full mt-auto"
          onClick={platform.action}
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </Button>
      )}
      {platform.status === 'available' && isCurrentlyInstalled && (
        <Button
          size="sm"
          variant="outline"
          disabled
          className="gap-2 w-full mt-auto opacity-100 cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
        >
          <Check className="h-3.5 w-3.5" />
          Installée
        </Button>
      )}
      {isSoon && (
        <Button
          size="sm"
          variant="outline"
          disabled
          className="gap-2 w-full mt-auto opacity-60 cursor-default"
        >
          <Bell className="h-3.5 w-3.5" />
          Me prévenir
        </Button>
      )}
    </div>
  )
}
