'use client'

import { useAuth } from '@/lib/auth'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Users, Shield, Building2, Palette, Mail, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/version'

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
        <Skeleton className="h-8 w-32" />
      </div>
    )
  }

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-(--sidebar-width) flex-col bg-sidebar border-r border-sidebar-border rounded-r-[2rem] shadow-2xl overflow-hidden">
        {}
        <div className="px-3 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Faktur" className="h-10 w-10 shrink-0 drop-shadow-sm" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[18px] font-semibold text-foreground font-lexend tracking-tight leading-tight whitespace-nowrap">
                Faktur
              </span>
              <span className="text-[9px] text-muted-foreground/40 font-medium leading-none whitespace-nowrap">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-3 h-px bg-border" />

        {}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[10px] font-bold text-muted-secondary uppercase tracking-[0.15em] mb-1">
            Bienvenue
          </p>
          <p className="text-[13px] font-semibold text-foreground leading-snug">
            Configurons votre compte
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">
            {currentStepIndex + 1} / {steps.length}
          </p>
        </div>

        {}
        <div className="mx-4 mb-4">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            />
          </div>
        </div>

        {/* Steps list */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-1 space-y-1">
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
                  'flex items-center gap-3 w-full rounded-lg px-2.5 py-[9px] text-[13px] font-medium transition-all duration-200 relative text-left',
                  isActive && 'bg-surface dark:bg-white/[0.06] shadow-sm text-foreground',
                  isCompleted && 'text-foreground hover:bg-muted/40 dark:hover:bg-white/[0.04] cursor-pointer',
                  isPending && 'text-muted-foreground/50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive && 'bg-primary/15 text-primary',
                    isCompleted && 'bg-emerald-500/15 text-emerald-500',
                    isPending && 'bg-muted text-muted-foreground/40'
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
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground/40'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mx-3 h-px bg-border" />

        {/* Footer with user */}
        <div className="p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent text-[10px] font-bold">
              {(user.fullName || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground truncate leading-tight">
                {user.fullName || user.email}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Installation en cours…
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className="relative h-screen flex flex-col overflow-hidden bg-background pl-(--sidebar-width)">
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6 md:p-10">
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
        </div>
      </main>
    </div>
  )
}
