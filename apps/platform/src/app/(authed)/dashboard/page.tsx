'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Book,
  Coins,
  Folder,
  Key,
  Plus,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useProjects } from '@/lib/projects-context'
import { DOCS_URL } from '@/lib/oauth-config'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'

function formatRelative(iso: string | null): string {
  if (!iso) return 'jamais utilisée'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))
  if (diffSec < 60) return `il y a ${diffSec}s`
  const m = Math.floor(diffSec / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString()
}

function firstName(user: { fullName: string | null; email: string } | null): string {
  if (!user) return ''
  if (user.fullName) {
    const first = user.fullName.trim().split(/\s+/)[0]
    if (first) return first
  }
  return user.email.split('@')[0]
}

export default function DashboardHomePage() {
  const { user } = useAuth()
  const { projects } = useProjects()
  const [recentKeys, setRecentKeys] = useState<ApiKeyShape[] | null>(null)

  useEffect(() => {
    apiKeysClient.recentlyUsed(5).then((res) => {
      if (res.data?.data) setRecentKeys(res.data.data)
      else setRecentKeys([])
    })
  }, [])

  const activeProjects = (projects ?? []).filter((p) => !p.is_archived)
  const recentProjects = activeProjects.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 px-4 lg:px-6 py-6 md:py-8 max-w-5xl mx-auto w-full"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bonjour, {firstName(user) || 'développeur'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Voici un aperçu de votre utilisation de l&apos;API Faktur.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/projects" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Folder className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Gérer mes projets
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Créer, organiser, supprimer
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Plus className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Nouveau projet
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Démarrer une intégration
              </p>
            </CardContent>
          </Card>
        </Link>

        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="block">
          <Card className="border-border/50 transition-colors hover:border-accent/40 hover:bg-surface-hover">
            <CardContent className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Book className="h-4 w-4" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Documentation
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Endpoints, exemples, SDKs
              </p>
            </CardContent>
          </Card>
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Solde
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              10 000
            </p>
            <p className="mt-1 text-xs text-muted-foreground">crédits disponibles</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Dépensé ce mois
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              1 247
            </p>
            <p className="mt-1 text-xs text-muted-foreground">crédits utilisés</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Volume tokens
              </p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              4.2k
            </p>
            <p className="mt-1 text-xs text-muted-foreground">requêtes ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-400/30 bg-amber-400/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Données de démo :
            </span>{' '}
            la facturation à l&apos;usage arrive bientôt. Les compteurs ci-dessus sont
            statiques pour le moment.
          </p>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Clés récemment utilisées
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {recentKeys === null ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                Chargement…
              </div>
            ) : recentKeys.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Key className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Aucune utilisation récente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les clés apparaîtront ici dès le premier appel API.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentKeys.map((k) => (
                  <Link
                    key={k.id}
                    href={`/projects/${k.project_id}/keys/${k.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{k.name}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {k.masked_token}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(k.last_used_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Projets récents
          </h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir tout
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {activeProjects.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Folder className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-foreground font-medium">Aucun projet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Créez votre premier projet pour commencer.
                </p>
                <Link href="/projects" className="inline-block">
                  <Button size="sm" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau projet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Key className="h-3 w-3" />
                      {p.keys_count ?? 0}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
