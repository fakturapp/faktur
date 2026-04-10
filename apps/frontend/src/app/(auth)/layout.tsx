'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BlurText from '@/components/ui/blur-text'

const ADVANTAGES = [
  { title: 'Facturation instantanée', desc: 'Créez et envoyez des factures professionnelles en quelques secondes.' },
  { title: 'Devis en un clic', desc: 'Transformez vos devis acceptés en factures automatiquement.' },
  { title: 'Gratuit, pour toujours', desc: 'Pas de frais cachés. Faktur est gratuit pour les indépendants.' },
  { title: 'Paiement en ligne', desc: 'Vos clients paient directement depuis la facture par carte bancaire.' },
  { title: 'Conforme et sécurisé', desc: 'Numérotation légale, TVA automatique, données chiffrées.' },
  { title: 'Suivi en temps réel', desc: 'Tableau de bord intelligent avec alertes et relances automatiques.' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % ADVANTAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Sidebar gauche — formulaire */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 flex w-full md:w-[520px] lg:w-[580px] shrink-0 flex-col bg-overlay shadow-overlay rounded-r-[2rem]"
      >
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 md:px-12 lg:px-16 overflow-y-auto">
          <div className="w-full max-w-[380px]">
            {children}
          </div>
        </div>
        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            Gratuit, pour toujours.
          </p>
        </div>
      </motion.div>

      {/* Fond derrière les arrondis de la sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-0 w-[520px] lg:w-[580px] bg-overlay" aria-hidden="true" />

      {/* Côté droit — fond avec textes animés */}
      <div className="relative hidden md:flex flex-1 flex-col items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#5957e8]/[0.08] blur-[120px] animate-[gradient-drift_14s_ease-in-out_infinite]" />
          <div className="absolute bottom-0 -left-20 h-[400px] w-[400px] rounded-full bg-[#7c5ce8]/[0.06] blur-[100px] animate-[gradient-drift_18s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-[#a78bfa]/[0.04] blur-[90px] animate-[gradient-drift_22s_ease-in-out_infinite]" />
        </div>

        {/* Texte animé */}
        <div className="relative z-10 max-w-md px-12 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <BlurText
                text={ADVANTAGES[currentIndex].title}
                className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight justify-center"
                delay={80}
                animateBy="words"
              />
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {ADVANTAGES[currentIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Indicateurs */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {ADVANTAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-8 bg-accent' : 'w-1.5 bg-foreground/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
