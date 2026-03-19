'use client'

import { motion } from 'framer-motion'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 lg:px-6 py-4 md:py-6 max-w-3xl mx-auto"
    >
      {children}
    </motion.div>
  )
}
