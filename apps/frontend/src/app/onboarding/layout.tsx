'use client'

import { useAuth } from '@/lib/auth'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Users, Shield, Building2, Palette, Mail, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Step {
  id: string
  label: string
  path: string
  icon: React.ElementType
}

const steps: Step[] = [
  { id: 'team', label: 'Équipe', path: '/onboarding/team', icon: Users },
  { id: 'recovery-key', label: 'Sécurité', path: '/onboarding/recovery-key', icon: Shield },
  { id: 'company', label: 'Entreprise', path: '/onboarding/company', icon: Building2 },
  { id: 'personalization', label: 'Apparence', path: '/onboarding/personalization', icon: Palette },
  { id: 'email', label: 'Email', path: '/onboarding/email', icon: Mail },
  { id: 'billing', label: 'Facturation', path: '/onboarding/billing', icon: Receipt },
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    )
  }

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Sidebar gauche — étapes */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 flex w-[280px] lg:w-[320px] shrink-0 flex-col bg-overlay shadow-overlay rounded-r-[2rem]"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <p className="text-[10px] font-bold text-muted-secondary uppercase tracking-[0.15em] mb-1">
            Configuration
          </p>
          <p className="text-[15px] font-semibold text-foreground leading-snug tracking-[-0.015em]">
            Configurons votre compte
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Étape {currentStepIndex + 1} sur {steps.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mx-5 mb-4">
          <div className="h-1 rounded-full bg-surface overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>

        <div className="mx-5 h-px bg-separator" />

        {/* Steps */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isActive = i === currentStepIndex
            const isCompleted = i < currentStepIndex
            const isClickable = isCompleted
            const isPending = i > currentStepIndex

            return (
              <button
                key={step.id}
                onClick={() => isClickable && router.push(step.path)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 text-left',
                  isActive && 'bg-surface text-foreground',
                  isCompleted && 'text-foreground hover:bg-surface-hover cursor-pointer',
                  isPending && 'text-muted-secondary cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive && 'bg-accent-soft text-accent',
                    isCompleted && 'bg-success-soft text-success',
                    isPending && 'bg-surface text-muted-secondary'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="flex-1 whitespace-nowrap">{step.label}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono tabular-nums',
                    isActive ? 'text-accent font-semibold' : 'text-muted-secondary'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mx-5 h-px bg-separator" />

        {/* Footer user */}
        <div className="p-4">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-[10px] font-bold">
              {(user.fullName || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                {user.fullName || user.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Installation en cours
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Fond derrière les arrondis de la sidebar */}
      <div className="fixed inset-y-0 left-0 z-0 w-[280px] lg:w-[320px] bg-overlay" aria-hidden="true" />

      {/* Contenu principal — droite */}
      <main className="relative flex-1 overflow-y-auto">
        {/* Gradient orbs */}
        <div className="pointer-events-none fixed top-0 right-0 bottom-0 left-[320px] overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#5957e8]/[0.06] blur-[120px] animate-[gradient-drift_14s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 left-[10%] h-[400px] w-[400px] rounded-full bg-[#7c5ce8]/[0.04] blur-[100px] animate-[gradient-drift_18s_ease-in-out_infinite_reverse]" />
        </div>

        {/* Header avec logo Faktur */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-6 pb-2">
          <Link href="/" className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Faktur" className="h-7 w-7" />
            <span className="text-base font-semibold tracking-[-0.02em]">Faktur</span>
          </Link>
        </div>

        {/* Contenu des étapes */}
        <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-6 md:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-2xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
