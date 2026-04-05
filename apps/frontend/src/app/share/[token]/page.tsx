'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ShieldAlert, LogIn } from 'lucide-react'

type DocumentType = 'invoice' | 'quote' | 'credit_note'

const documentRoutes: Record<DocumentType, string> = {
  invoice: 'invoices',
  quote: 'quotes',
  credit_note: 'credit-notes',
}

export default function ShareLinkPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'error' | 'unauthenticated'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function validate() {
      const authToken = localStorage.getItem('faktur_token')
      if (!authToken) {
        // Store the share URL so we can redirect after login
        sessionStorage.setItem('faktur_share_redirect', `/share/${token}`)
        setStatus('unauthenticated')
        return
      }

      const { data, error } = await api.get<{
        message: string
        data: {
          documentType: DocumentType
          documentId: string
          permission: string
          isOwner: boolean
        }
      }>(`/share/validate/${token}`)

      if (error) {
        setStatus('error')
        setErrorMessage(error)
        return
      }

      if (data?.data) {
        const { documentType, documentId } = data.data
        const route = documentRoutes[documentType]
        router.replace(`/dashboard/${route}/${documentId}/edit`)
      }
    }

    validate()
  }, [token, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">V\u00e9rification de l&apos;acc\u00e8s...</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm mx-auto px-6"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-5">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Connexion requise</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Vous devez \u00eatre connect\u00e9 pour acc\u00e9der \u00e0 ce document partag\u00e9.
          </p>
          <Button onClick={() => router.push('/login')} className="gap-2">
            <LogIn className="h-4 w-4" /> Se connecter
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-auto px-6"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Acc\u00e8s refus\u00e9</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {errorMessage || "Ce lien de partage est invalide ou a \u00e9t\u00e9 d\u00e9sactiv\u00e9."}
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Retour au tableau de bord
        </Button>
      </motion.div>
    </div>
  )
}
