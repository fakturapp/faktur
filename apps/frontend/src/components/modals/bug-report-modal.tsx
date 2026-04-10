'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormSelect } from '@/components/ui/dropdown'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Bug, CheckCircle2 } from 'lucide-react'

interface BugReportModalProps {
  open: boolean
  onClose: () => void
}

export function BugReportModal({ open, onClose }: BugReportModalProps) {
  const { toast } = useToast()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function reset() {
    setSubject('')
    setDescription('')
    setStepsToReproduce('')
    setSeverity('medium')
    setSubmitting(false)
    setSubmitted(false)
  }

  function handleClose() {
    if (submitting) return
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)

    const { error } = await api.post('/bug-report', {
      subject: subject.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim() || null,
      severity,
    })

    if (error) {
      toast(error, 'error')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-lg">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Bug className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Signaler un bug</DialogTitle>
                <DialogDescription className="mt-0">
                  Décrivez le problème rencontré
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bugSubject">Sujet</FieldLabel>
                  <Input
                    id="bugSubject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Titre du bug"
                    autoFocus
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bugDescription">Description</FieldLabel>
                  <Textarea
                    id="bugDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le problème en détail..."
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bugSteps">Étapes pour reproduire (optionnel)</FieldLabel>
                  <Textarea
                    id="bugSteps"
                    value={stepsToReproduce}
                    onChange={(e) => setStepsToReproduce(e.target.value)}
                    placeholder="1. Aller sur...&#10;2. Cliquer sur...&#10;3. Observer..."
                    rows={3}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bugSeverity">Sévérité</FieldLabel>
                  <FormSelect
                    id="bugSeverity"
                    value={severity}
                    onChange={setSeverity}
                    options={[
                      { value: 'low', label: 'Faible' },
                      { value: 'medium', label: 'Moyenne' },
                      { value: 'high', label: 'Haute' },
                      { value: 'critical', label: 'Critique' },
                    ]}
                  />
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!subject.trim() || !description.trim() || submitting}
              >
                {submitting ? <Spinner size="sm" className="mr-2" /> : null}
                Envoyer
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
            <p className="text-sm font-medium text-foreground">Bug signalé avec succès !</p>
            <p className="text-xs text-muted-foreground">
              Nous examinerons votre rapport rapidement.
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
