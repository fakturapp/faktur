'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { APP_VERSION } from '@/lib/version'
import { type Variants } from 'framer-motion'
import {
  Code2, Globe, ExternalLink, Server, Database, Layout,
  Layers, Paintbrush, Sparkles, Shield, Lock, Scale,
  ScrollText, Cookie, Zap, Fingerprint, Heart, Monitor,
} from 'lucide-react'
import { isFakturDesktop, getFakturDesktopVersion } from '@/lib/is-desktop'

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

export default function AboutPage() {
  const [apiInfo, setApiInfo] = useState<{ name: string; version: string; status: string } | null>(null)
  const [desktop, setDesktop] = useState<{ is: boolean; version: string | null; platform: string | null }>({
    is: false, version: null, platform: null,
  })

  useEffect(() => {
    api.get<{ name: string; version: string; status: string }>('/').then(({ data }) => {
      if (data) setApiInfo(data)
    })
    if (typeof window !== 'undefined') {
      const bridge = (window as any).fakturDesktop
      setDesktop({
        is: isFakturDesktop(),
        version: getFakturDesktopVersion(),
        platform: bridge?.platform ?? null,
      })
    }
  }, [])

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto px-4 lg:px-6 py-6 md:py-8 space-y-8"
    >
      {}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center text-center gap-5 py-4">
        <Image src="/logo.svg" alt="Faktur" width={72} height={72} className="h-[72px] w-auto drop-shadow-lg" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-lexend tracking-tight">
            {desktop.is ? 'Faktur Desktop' : 'Faktur'}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            Logiciel de facturation gratuit, s&eacute;curis&eacute; et collaboratif avec chiffrement zero-access.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {desktop.is && desktop.version && (
            <Badge variant="muted" className="text-xs">Desktop v{desktop.version}</Badge>
          )}
          <Badge variant="muted" className="text-xs">Frontend v{APP_VERSION}</Badge>
          {apiInfo && <Badge variant="muted" className="text-xs">API v{apiInfo.version}</Badge>}
          {apiInfo && (
            <Badge variant={apiInfo.status === 'healthy' ? 'success' : 'muted'} className="text-xs">
              {apiInfo.status === 'healthy' ? 'En ligne' : apiInfo.status}
            </Badge>
          )}
        </div>
      </motion.div>

      {}
      {desktop.is && (
        <motion.div variants={fadeUp} custom={1}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Faktur Desktop</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Vous utilisez l&apos;application native Faktur Desktop, un client Electron qui
                  embarque le tableau de bord Faktur avec authentification OAuth2 + PKCE via
                  votre navigateur syst&egrave;me. Vos jetons sont chiffr&eacute;s au niveau du
                  syst&egrave;me d&apos;exploitation (Keychain, DPAPI ou libsecret) et ne sont
                  jamais stock&eacute;s en clair sur disque.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-md bg-background/40 border border-border/60 px-2 py-1.5">
                    <span className="text-muted-foreground">Version</span>
                    <div className="font-semibold text-foreground">
                      {desktop.version ?? '—'}
                    </div>
                  </div>
                  <div className="rounded-md bg-background/40 border border-border/60 px-2 py-1.5">
                    <span className="text-muted-foreground">Plateforme</span>
                    <div className="font-semibold text-foreground">
                      {desktop.platform ?? 'inconnue'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={1}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">&Eacute;quipe</h2>
        <div className="flex items-center gap-4">
          <img
            src="https://danbenba.dev/profile.png"
            alt="danbenba"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">danbenba</p>
            <p className="text-xs text-muted-foreground">Cr&eacute;ateur & D&eacute;veloppeur</p>
          </div>
        </div>
      </motion.div>

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={2}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">S&eacute;curit&eacute;</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3.5 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Chiffrement zero-access</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Vos donn&eacute;es sont chiffr&eacute;es avec votre mot de passe via AES-256-GCM.
                M&ecirc;me avec un acc&egrave;s complet au serveur, personne ne peut lire vos informations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5 rounded-xl border border-border p-4">
            <Fingerprint className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Passkeys & 2FA</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Connexion sans mot de passe via WebAuthn (empreinte, Face ID) et double authentification TOTP.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={3}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Fonctionnalit&eacute;s</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {[
            'Factures, devis et avoirs',
            'Chiffrement zero-access',
            'Passkeys (WebAuthn)',
            'Double authentification',
            '&Eacute;quipes multi-membres',
            'Collaboration temps r&eacute;el',
            'G&eacute;n&eacute;ration PDF & FacturX',
            'Email (Gmail, SMTP, Resend)',
            'Facturation r&eacute;currente',
            'Relances automatiques',
            'D&eacute;penses & OCR',
            'Catalogue produits',
            'Export chiffr&eacute;',
            'Analyse par IA',
            'Th&egrave;me clair / sombre',
            'Cookies RGPD',
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 py-1.5">
              <div className="h-1 w-1 rounded-full bg-primary shrink-0" />
              <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: f }} />
            </div>
          ))}
        </div>
      </motion.div>

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={4}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Stack technique</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Next.js 16', icon: Layout },
            { name: 'AdonisJS 7', icon: Server },
            { name: 'PostgreSQL', icon: Database },
            { name: 'Turborepo', icon: Layers },
            { name: 'Tailwind v4', icon: Paintbrush },
            { name: 'Framer Motion', icon: Sparkles },
            { name: 'Socket.io', icon: Zap },
          ].map((tech) => (
            <div key={tech.name} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
              <tech.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground">{tech.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={5}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Liens</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'GitHub', href: 'https://github.com/faktur/fakturapp', icon: Code2 },
            { label: 'Site web', href: 'https://fakturapp.cc', icon: Globe },
            { label: 'Dashboard', href: 'https://dash.fakturapp.cc', icon: Layout },
            { label: 'API', href: 'https://api.fakturapp.cc', icon: Server },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors group"
            >
              <link.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground flex-1">{link.label}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </motion.div>

      <Separator />

      {}
      <motion.div variants={fadeUp} custom={6}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Informations l&eacute;gales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Mentions l\u00e9gales', href: '/legal/mentions', icon: Scale },
            { label: 'CGU', href: '/legal/terms', icon: ScrollText },
            { label: 'Confidentialit\u00e9', href: '/legal/privacy', icon: Lock },
            { label: 'S\u00e9curit\u00e9', href: '/legal/security', icon: Shield },
            { label: 'Cookies', href: '/legal/cookies', icon: Cookie },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <link.icon className="h-3.5 w-3.5 shrink-0" />
              {link.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {}
      <motion.div variants={fadeUp} custom={7} className="text-center pb-4 pt-2">
        <p className="text-[11px] text-muted-foreground/50 flex items-center justify-center gap-1">
          Fait avec <Heart className="h-3 w-3 text-red-400" /> par danbenba &mdash; 2025-2026
        </p>
      </motion.div>
    </motion.div>
  )
}
