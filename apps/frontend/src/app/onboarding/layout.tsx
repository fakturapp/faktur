'use client'

import { useAuth } from '@/lib/auth'
import { usePathname } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: 'team', label: 'Équipe', path: '/onboarding/team' },
  { id: 'company', label: 'Entreprise', path: '/onboarding/company' },
  { id: 'personalization', label: 'Apparence', path: '/onboarding/personalization' },
  { id: 'email', label: 'Email', path: '/onboarding/email' },
  { id: 'billing', label: 'Facturation', path: '/onboarding/billing' },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Progress steps */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-3"
      >
        {steps.map((step, i) => {
          const isActive = i === currentStepIndex
          const isCompleted = i < currentStepIndex

          return (
            <div key={step.id} className="flex items-center gap-3">
              {i > 0 && <div className="h-px w-12 bg-border" />}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    isCompleted && 'bg-success text-white',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        {children}
      </motion.div>
    </div>
  )
}
