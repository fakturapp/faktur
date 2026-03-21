'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ShinyText } from '@/components/ui/shiny-text'

interface AiSheetOverlayProps {
  open: boolean
}

export function AiSheetOverlay({ open }: AiSheetOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-20 flex items-center justify-center rounded-xl overflow-hidden"
        >
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

          {/* Center content */}
          <div className="relative flex flex-col items-center">
            {/* Galaxy AI animation (compact) */}
            <div className="relative h-20 w-20 mb-4">
              {/* Glow */}
              <motion.div
                className="absolute -inset-3 rounded-full blur-xl"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Ring 1 */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  border: '1.5px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.1), rgba(59,130,246,0.6)) border-box',
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />

              {/* Ring 2 */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  border: '1px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(225deg, rgba(236,72,153,0.5), rgba(139,92,246,0.1), rgba(99,102,241,0.5)) border-box',
                }}
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              />

              {/* Ring 3 */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{
                  border: '1px solid transparent',
                  background: 'linear-gradient(0deg, transparent, transparent) padding-box, linear-gradient(45deg, rgba(59,130,246,0.5), rgba(139,92,246,0.1), rgba(236,72,153,0.5)) border-box',
                }}
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />

              {/* Inner orb */}
              <motion.div
                className="absolute inset-6 rounded-full"
                animate={{
                  background: [
                    'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                    'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                  ],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-5 w-5 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                </motion.div>
              </div>

              {/* Particles */}
              {[...Array(6)].map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180
                const radius = 36 + (i % 2) * 6
                const colors = ['bg-purple-400/60', 'bg-indigo-400/60', 'bg-blue-400/60', 'bg-pink-400/60']
                return (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full ${colors[i % colors.length]}`}
                    style={{ width: 2, height: 2, top: '50%', left: '50%' }}
                    animate={{
                      x: [0, Math.cos(angle) * radius, 0],
                      y: [0, Math.sin(angle) * radius, 0],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.3,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  />
                )
              })}
            </div>

            <ShinyText
              text="Modification en cours..."
              className="text-sm font-semibold"
              color="#a78bfa"
              shineColor="#e0e7ff"
              speed={1.5}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
