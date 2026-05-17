'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Folder,
  Key,
  Plus,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { apiKeysClient, type ApiKeyShape } from '@/lib/api-keys-client'
import { apiProjectsClient, type ApiProjectShape } from '@/lib/api-projects-client'
import { CreateApiKeyDialog } from '@/components/api-keys/create-api-key-dialog'
import { RevealedKeyDialog } from '@/components/api-keys/revealed-key-dialog'

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

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [project, setProject] = useState<ApiProjectShape | null>(null)
  const [keys, setKeys] = useState<ApiKeyShape[] | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [revealed, setRevealed] = useState<{ key: ApiKeyShape; plaintext: string } | null>(
    null
  )

  async function loadProject() {
    const res = await apiProjectsClient.show(params.id)
    if (res.error || !res.data?.data) {
      toast(res.error || 'Projet introuvable', 'error')
      return
    }
    setProject(res.data.data)
  }

  async function loadKeys() {
    const res = await apiKeysClient.list()
    if (res.error) {
      toast(res.error, 'error')
      setKeys([])
      return
    }
    setKeys((res.data?.data ?? []).filter((k) => k.project_id === params.id))
  }

  useEffect(() => {
    loadProject()
    loadKeys()
  }, [params.id])

  if (!project) {
    return (
      <div className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const activeKeys = keys?.filter((k) => k.status === 'active') ?? []
  const recentKeys = [...(keys ?? [])]
    .filter((k) => k.last_used_at)
    .sort(
      (a, b) =>
        new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime()
    )
    .slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Folder className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-foreground truncate">{project.name}</h1>
            {project.is_default && (
              <Badge variant="soft" size="sm">
                Défaut
              </Badge>
            )}
            {project.is_archived && (
              <Badge variant="muted" size="sm">
                Archivé
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/projects/${project.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </Link>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle clé
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Clés</p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {keys?.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">total dans ce projet</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Actives</p>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              {activeKeys.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">prêtes à l&apos;emploi</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Créé le</p>
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">
              {new Date(project.created_at).toLocaleDateString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(project.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Clés récemment utilisées
          </h2>
          <Link
            href={`/projects/${project.id}/api-keys`}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Voir toutes
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            {keys === null ? (
              <div className="px-5 py-8">
                <Skeleton className="h-4 w-48" />
              </div>
            ) : recentKeys.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Key className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Aucune utilisation récente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les clés apparaîtront ici dès le premier appel.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une clé
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentKeys.map((k) => (
                  <Link
                    key={k.id}
                    href={`/projects/${project.id}/keys/${k.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{k.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground font-mono truncate">
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

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={project.id}
        onCreated={({ key, plaintext }) => {
          setCreateOpen(false)
          setRevealed({ key, plaintext })
          loadKeys()
        }}
      />

      <RevealedKeyDialog
        open={revealed !== null}
        plaintext={revealed?.plaintext ?? ''}
        keyName={revealed?.key.name ?? ''}
        kind="api_key"
        onClose={() => setRevealed(null)}
      />
    </motion.div>
  )
}
