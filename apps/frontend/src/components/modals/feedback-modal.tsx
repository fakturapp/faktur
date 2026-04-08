'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Star, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      api.get<{ feedback: { rating: number; comment: string | null } | null }>('/feedback/mine').then(({ data }) => {
        if (data?.feedback) {
          setRating(data.feedback.rating)
          setComment(data.feedback.comment || '')
          setIsEdit(true)
        }
        setLoading(false)
      })
    }
  }, [open])

  function reset() {
    setRating(0)
    setHoveredRating(0)
    setComment('')
    setSubmitting(false)
    setSubmitted(false)
    setLoading(false)
    setIsEdit(false)
  }

  function handleClose() {
    if (submitting) return
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (rating === 0) return
    setSubmitting(true)

    const { error } = await api.post('/feedback', { rating, comment: comment.trim() || null })
    if (error) {
      toast(error, 'error')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Spinner size="md" className="text-primary" />
          </motion.div>
        ) : !submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{isEdit ? 'Modifier votre avis' : 'Laisser un avis'}</DialogTitle>
                <DialogDescription className="mt-0">
                  {isEdit
                    ? 'Vous pouvez mettre à jour votre avis'
                    : 'Votre retour nous aide à améliorer l\u0027application'}
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-4">
              {}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(value)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        (hoveredRating || rating) >= value
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>

              {}
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Un commentaire ? (optionnel)"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
                {submitting ? <Spinner size="sm" className="mr-2" /> : null}
                {isEdit ? 'Modifier' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">
              {isEdit ? 'Avis mis à jour !' : 'Merci pour votre avis !'}
            </p>
            <p className="text-xs text-muted-foreground">
              Votre retour a bien été enregistré.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Fermer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
