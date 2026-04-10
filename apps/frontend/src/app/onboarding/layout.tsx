'use client'

import { useAuth } from '@/lib/auth'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Users, Shield, Building2, Palette, Mail, Receipt, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false })

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
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0 bg-surface" />
        <div className="fixed inset-0 z-[1] bg-black/10" />
        {/* Skeleton sidebar */}
        <div className="fixed inset-y-0 left-0 z-10 flex w-[280px] lg:w-[320px] flex-col bg-overlay shadow-overlay rounded-r-[2rem]">
          <div className="px-5 pt-6 pb-4 space-y-2">
            <Skeleton className="h-2 w-16 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-2 w-20 rounded" />
          </div>
          <div className="mx-5 mb-4"><Skeleton className="h-1 w-full rounded-full" /></div>
          <div className="mx-5 h-px bg-separator" />
          <div className="flex-1 px-4 py-3 space-y-1">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="mx-5 h-px bg-separator" />
          <div className="p-4">
            <div className="flex items-center gap-2.5 px-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-2 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
        {/* Skeleton contenu */}
        <div className="fixed inset-y-0 right-0 left-[280px] lg:left-[320px] z-[2] flex items-center justify-center">
          <div className="w-full max-w-2xl px-10 space-y-6">
            <Skeleton className="h-6 w-48 rounded-lg mx-auto" />
            <Skeleton className="h-3 w-64 rounded mx-auto" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))

  return (
    <div className="relative min-h-screen">
      {/* Iridescence — couvre TOUTE la page, visible derrière les arrondis de la sidebar */}
      <div className="fixed inset-0 z-0">
        <Iridescence color={[0.4, 0.3, 1]} speed={0.4} amplitude={0.1} />
      </div>
      {/* Overlay sombre — couvre TOUTE la page (y compris derrière les arrondis) */}
      <div className="fixed inset-0 z-[1] bg-black/25 pointer-events-none" />

      {/* Sidebar gauche — par dessus le background */}
      <motion.aside
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-y-0 left-0 z-10 flex w-[280px] lg:w-[320px] flex-col bg-overlay shadow-overlay rounded-r-[2rem]"
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
            <button
              onClick={() => { localStorage.removeItem('faktur_token'); window.location.href = '/login' }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Contenu principal — droite, offset par la sidebar */}
      <main className="fixed inset-y-0 right-0 left-[280px] lg:left-[320px] z-[1] overflow-y-auto">
        <div className="relative h-full">
        {/* Header avec logo Faktur — centré */}
        <div className="flex items-center justify-center px-8 pt-6 pb-2">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity drop-shadow-md">
            <img src="/logo.svg" alt="Faktur" className="h-7 w-7" />
            <span className="text-base font-semibold tracking-[-0.02em] text-white">Faktur</span>
          </Link>
        </div>

        {/* Contenu des étapes */}
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 md:px-10">
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
