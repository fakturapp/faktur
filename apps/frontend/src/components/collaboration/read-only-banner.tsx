'use client'

import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'

export function ReadOnlyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm text-amber-600 dark:text-amber-400"
    >
      <Eye className="h-4 w-4" />
      <span>Lecture seule — vous pouvez consulter ce document mais pas le modifier</span>
    </motion.div>
  )
}
