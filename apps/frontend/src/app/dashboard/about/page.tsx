'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  Github,
  Globe,
  ExternalLink,
  Server,
  Database,
  Layout,
  Layers,
  Paintbrush,
  Sparkles,
} from 'lucide-react'

const links = [
  { label: 'GitHub', href: 'https://github.com/fakturapp/faktur', icon: Github },
  { label: 'Site web', href: 'https://fakturapp.cc', icon: Globe },
  { label: 'Dashboard', href: 'https://dash.fakturapp.cc', icon: Layout },
  { label: 'API', href: 'https://api.fakturapp.cc', icon: Server },
]

const stack = [
  { name: 'Next.js 16', description: 'App Router & Turbopack', icon: Layout },
  { name: 'AdonisJS 7', description: 'Backend & API REST', icon: Server },
  { name: 'PostgreSQL', description: 'Base de données', icon: Database },
  { name: 'Turborepo', description: 'Monorepo', icon: Layers },
  { name: 'Tailwind CSS v4', description: 'Styles & design system', icon: Paintbrush },
  { name: 'Framer Motion', description: 'Animations', icon: Sparkles },
]

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-4 md:py-6 max-w-3xl"
    >
      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="px-6 py-8">
          <div className="flex flex-col items-center text-center gap-4">
            <Image src="/logo.svg" alt="Faktur" width={48} height={48} className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Faktur</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Logiciel de facturation gratuit et open-source.
              </p>
              <Badge variant="muted" className="mt-3">v0.1.0</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Équipe */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Équipe</h2>
          <div className="flex items-center gap-4">
            <img
              src="https://danbenba.dev/profile.png"
              alt="danbenba"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div>
              <p className="text-sm font-medium text-foreground">danbenba</p>
              <p className="text-xs text-muted-foreground">Créateur & Développeur</p>
            </div>
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

      {/* Stack technique */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Stack technique</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
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
    </motion.div>
  )
}
