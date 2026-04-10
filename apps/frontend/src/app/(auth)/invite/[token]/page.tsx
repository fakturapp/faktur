'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Users, Check, X } from 'lucide-react'

interface InviteInfo {
  email: string
  role: string
  team: {
    name: string
    iconUrl: string | null
  }
}

const roleLabels: Record<string, string> = {
  viewer: 'Lecteur',
  member: 'Membre',
  admin: 'Administrateur',
  super_admin: 'Super Admin',
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    api
      .get<{ invitation: InviteInfo }>(`/invite/${params.token}`)
      .then(({ data, error }) => {
        if (error || !data?.invitation) {
          setError(error || 'Invitation invalide ou expirée')
        } else {
          setInfo(data.invitation)
        }
        setLoading(false)
      })
  }, [params.token])

  async function handleAccept() {
    if (!user) {
      router.push(`/login?redirect=/invite/${params.token}`)
      return
    }

    setAccepting(true)
    const { data, error } = await api.post<{ team: { id: string; name: string } }>(
      '/team/invite/accept',
      { token: params.token }
    )
    setAccepting(false)

    if (error) {
      setError(error)
      return
    }

    setAccepted(true)
    // Hard reload to clear old team cache and switch context
    setTimeout(() => { window.location.href = '/dashboard' }, 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="md" className="text-primary" />
      </div>
    )
  }

  if (error && !info) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Invitation invalide</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error}
            </p>
            <Button variant="outline" onClick={() => router.push('/login')}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (accepted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Bienvenue dans l&apos;équipe !</h2>
            <p className="text-sm text-muted-foreground">
              Vous avez rejoint <strong>{info?.team.name}</strong>. Redirection en cours...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <Users className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Invitation à rejoindre une équipe</h2>
          </div>

          <div className="rounded-xl bg-surface shadow-surface p-4 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Équipe</span>
              <span className="text-sm font-medium text-foreground">{info?.team.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rôle</span>
              <Badge variant="default">{roleLabels[info?.role || 'member']}</Badge>
            </div>
            {info?.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm text-foreground">{info.email}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Connectez-vous pour accepter l&apos;invitation.
              </p>
              <Button className="w-full" onClick={() => router.push(`/login?redirect=/invite/${params.token}`)}>
                Se connecter
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/register?redirect=/invite/${params.token}`)}>
                Créer un compte
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? <><Spinner /> Acceptation...</> : 'Accepter l\'invitation'}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
