'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import BlurText from '@/components/ui/blur-text'

const Iridescence = dynamic(() => import('@/components/ui/iridescence'), { ssr: false })

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
    <div className="relative min-h-screen">
      {/* Iridescence — couvre TOUTE la page, visible derrière les arrondis de la sidebar */}
      <div className="fixed inset-0 z-0">
        <Iridescence color={[0.4, 0.3, 1]} speed={0.6} amplitude={0.15} />
      </div>
      {/* Overlay sombre — couvre TOUTE la page (y compris derrière les arrondis) */}
      <div className="fixed inset-0 z-[1] bg-black/30 pointer-events-none" />

      {/* Sidebar gauche — par dessus le background */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.8 }}
        className="fixed inset-y-0 left-0 z-10 flex w-full md:w-[480px] lg:w-[540px] flex-col bg-overlay shadow-overlay rounded-r-[2rem]"
      >
        {/* Logo Faktur centré */}
        <div className="flex items-center justify-center gap-2.5 pt-10 pb-2">
          <img src="/logo.svg" alt="Faktur" className="h-9 w-9" />
          <span className="text-xl font-bold tracking-[-0.03em] text-foreground">Faktur</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-8 py-8 md:px-14 lg:px-20 overflow-y-auto">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            Powered by danbenba
          </p>
        </div>
      </motion.div>

      {/* Texte animé — côté droit, overlay sombre pour lisibilité */}
      <div className="hidden md:flex fixed inset-y-0 right-0 left-[480px] lg:left-[540px] z-[1] flex-col items-center justify-center">
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
                className="text-3xl lg:text-4xl font-bold text-white tracking-tight justify-center drop-shadow-lg"
                delay={80}
                animateBy="words"
              />
              <p className="mt-4 text-base text-white/80 leading-relaxed drop-shadow-md">
                {ADVANTAGES[currentIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-2">
            {ADVANTAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
