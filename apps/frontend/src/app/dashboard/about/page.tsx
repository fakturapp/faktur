'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { APP_VERSION } from '@/lib/version'
import {
  Code2, Globe, ExternalLink, Server, Database, Layout,
  Layers, Paintbrush, Sparkles, Shield, Lock, FileText,
  Scale, ScrollText, Cookie, Users, Zap, MousePointer2,
  Share2, RefreshCw, Fingerprint,
} from 'lucide-react'

const links = [
  { label: 'GitHub', href: 'https://github.com/faktur/fakturapp', icon: Code2 },
  { label: 'Site web', href: 'https://fakturapp.cc', icon: Globe },
  { label: 'Dashboard', href: 'https://dash.fakturapp.cc', icon: Layout },
  { label: 'API', href: 'https://api.fakturapp.cc', icon: Server },
]

const stack = [
  { name: 'Next.js 16', description: 'App Router & Turbopack', icon: Layout },
  { name: 'AdonisJS 7', description: 'Backend & API REST', icon: Server },
  { name: 'PostgreSQL', description: 'Base de donn\u00e9es relationnelle', icon: Database },
  { name: 'Turborepo', description: 'Monorepo & builds', icon: Layers },
  { name: 'Tailwind CSS v4', description: 'Styles & design system', icon: Paintbrush },
  { name: 'Framer Motion', description: 'Animations fluides', icon: Sparkles },
  { name: 'Socket.io', description: 'Collaboration temps r\u00e9el', icon: Zap },
]

const features = [
  'Factures, devis et avoirs avec \u00e9diteur visuel',
  'Chiffrement zero-access (AES-256-GCM)',
  'Authentification passkeys (WebAuthn)',
  'Double authentification (2FA TOTP)',
  '\u00c9quipes multi-membres avec r\u00f4les',
  'Collaboration en temps r\u00e9el (b\u00eata)',
  'G\u00e9n\u00e9ration PDF et FacturX',
  'Int\u00e9gration email (Gmail, SMTP, Resend)',
  'Facturation r\u00e9currente',
  'Relances automatiques',
  'Gestion des d\u00e9penses avec OCR',
  'Catalogue produits',
  'Export chiffr\u00e9 des donn\u00e9es',
  'Analyse par IA (Groq)',
  'Th\u00e8me clair / sombre / syst\u00e8me',
  'Politique de cookies RGPD',
]

const legalLinks = [
  { label: 'Mentions l\u00e9gales', href: '/legal/mentions', icon: Scale },
  { label: 'Conditions g\u00e9n\u00e9rales', href: '/legal/terms', icon: ScrollText },
  { label: 'Politique de confidentialit\u00e9', href: '/legal/privacy', icon: Lock },
  { label: 'Politique de s\u00e9curit\u00e9', href: '/legal/security', icon: Shield },
  { label: 'Politique de cookies', href: '/legal/cookies', icon: Cookie },
]

export default function AboutPage() {
  const [apiInfo, setApiInfo] = useState<{ name: string; version: string; status: string } | null>(null)

  useEffect(() => {
    api.get<{ name: string; version: string; status: string }>('/').then(({ data }) => {
      if (data) setApiInfo(data)
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <Image src="/logo.svg" alt="Faktur" width={64} height={64} className="h-16 w-auto" />
        <div>
          <h1 className="text-3xl font-bold text-foreground font-lexend tracking-tight">Faktur</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
            Logiciel de facturation gratuit, s\u00e9curis\u00e9 et collaboratif
            avec chiffrement zero-access.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="muted">Frontend v{APP_VERSION}</Badge>
            {apiInfo && <Badge variant="muted">API v{apiInfo.version}</Badge>}
            {apiInfo && (
              <Badge variant={apiInfo.status === 'healthy' ? 'success' : 'muted'}>
                {apiInfo.status === 'healthy' ? 'En ligne' : apiInfo.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* \u00c9quipe */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">\u00c9quipe</h2>
          <div className="flex items-center gap-4">
            <img
              src="https://danbenba.dev/profile.png"
              alt="danbenba"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div>
              <p className="text-sm font-medium text-foreground">danbenba</p>
              <p className="text-xs text-muted-foreground">Cr\u00e9ateur & D\u00e9veloppeur</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* S\u00e9curit\u00e9 */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">S\u00e9curit\u00e9</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Chiffrement zero-access</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Vos donn\u00e9es sont chiffr\u00e9es avec votre mot de passe via AES-256-GCM.
                  M\u00eame avec un acc\u00e8s complet au serveur, personne ne peut lire vos informations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border p-4">
              <Fingerprint className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Passkeys & 2FA</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Connexion sans mot de passe via WebAuthn (empreinte, Face ID) et double authentification TOTP.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalit\u00e9s */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Fonctionnalit\u00e9s</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-xs text-muted-foreground">{f}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stack technique */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Stack technique</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stack.map((tech) => (
              <div key={tech.name} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <tech.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liens */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Liens</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{link.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informations l\u00e9gales */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Informations l\u00e9gales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{link.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">
          Personal Use License &mdash; Copyright &copy; 2025-2026 danbenba
        </p>
      </div>
    </motion.div>
  )
}
