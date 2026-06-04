'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Star } from '@/components/ui/icons'

interface FeedbackItem {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { id: string; fullName: string | null; email: string; avatarUrl: string | null }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <Star
          key={v}
          className={cn(
            'h-4 w-4',
            v <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
          )}
        />
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminFeedbacksPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/dashboard')
      return
    }
    api.get<{ feedbacks: FeedbackItem[] }>('/admin/feedbacks').then(({ data, error }) => {
      if (data?.feedbacks) setFeedbacks(data.feedbacks)
      if (error) toast(error, 'error')
      setLoading(false)
    })
  }, [user, router])

  if (!user?.isAdmin) return null

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avis</h1>
          <p className="text-sm text-muted-foreground">
            {feedbacks.length} avis — Note moyenne : {avgRating}/5
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-20">
          <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucun avis pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={f.user.avatarUrl}
                    alt={f.user.fullName || f.user.email}
                    fallback={
                      f.user.fullName
                        ? f.user.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                        : f.user.email.slice(0, 2).toUpperCase()
                    }
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {f.user.fullName || f.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{f.user.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Stars rating={f.rating} />
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(f.createdAt)}</p>
                </div>
              </div>
              {f.comment && (
                <p className="mt-3 text-sm text-foreground/80 bg-muted/30 rounded-lg p-3">
                  {f.comment}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
