'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateTeamPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await api.post<{ team: { id: string; name: string } }>(
      '/team/create',
      { name }
    )
    setLoading(false)

    if (error) return toast(error, 'error')

    await refreshUser()
    toast(`Équipe "${data?.team.name}" créée`, 'success')
    router.push('/dashboard/team')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <div>
        <Link
          href="/dashboard/team"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Créer une équipe</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Créez une nouvelle équipe pour collaborer avec vos collègues.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleCreate}>
            <FieldGroup>
              <div className="flex justify-center mb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="teamName">Nom de l&apos;équipe</FieldLabel>
                <Input
                  id="teamName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mon équipe"
                  required
                  minLength={2}
                  autoFocus
                />
                <FieldDescription>
                  Choisissez un nom pour identifier cette équipe.
                </FieldDescription>
              </Field>

              <Button type="submit" className="w-full" disabled={loading || name.length < 2}>
                {loading ? <><Spinner /> Création...</> : 'Créer l\'équipe'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
