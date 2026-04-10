'use client'

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Gift,
  Download,
  Shapes,
  BrainCircuit,
  MonitorSmartphone,
  LayoutDashboard,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface WhatsNewModalProps {
  open: boolean
  onClose: () => void
}

interface NewsEntry {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  cta?: { label: string; href: string; external?: boolean }
  badge?: string
}

const NEWS_ENTRIES: NewsEntry[] = [
  {
    icon: <Download className="h-4 w-4 text-primary" />,
    iconBg: 'bg-primary/10',
    title: 'Télécharge Faktur Desktop & Mobile',
    description:
      'Accède à Faktur sur ton ordinateur ou ton téléphone. Applications natives macOS, Windows, Linux, iOS et Android — dispo maintenant via notre checkout.',
    cta: {
      label: 'checkout.fakturapp.com',
      href: 'https://checkout.fakturapp.com',
      external: true,
    },
    badge: 'Nouveau',
  },
  {
    icon: <Shapes className="h-4 w-4 text-pink-500" />,
    iconBg: 'bg-pink-500/10',
    title: 'Nouvelle suite d\'icônes SVG',
    description:
      'Un jeu complet d\'icônes SVG retravaillées pour s\'intégrer au style de Faktur. Plus cohérentes, plus lisibles.',
  },
  {
    icon: <BrainCircuit className="h-4 w-4 text-purple-500" />,
    iconBg: 'bg-purple-500/10',
    title: 'Faktur AI : améliorations',
    description:
      'Génération de documents plus rapide, meilleures suggestions, résumé de tableau de bord amélioré et corrections de bugs.',
    cta: { label: 'Ouvrir les réglages AI', href: '/dashboard/settings/documents/invoices/ai' },
  },
  {
    icon: <MonitorSmartphone className="h-4 w-4 text-indigo-500" />,
    iconBg: 'bg-indigo-500/10',
    title: 'Faktur Desktop : améliorations',
    description:
      'Mises à jour automatiques plus fiables, meilleure intégration OS et corrections diverses pour l\'app desktop.',
  },
  {
    icon: <LayoutDashboard className="h-4 w-4 text-emerald-500" />,
    iconBg: 'bg-emerald-500/10',
    title: 'Refonte de l\'interface',
    description:
      'Nouvelle organisation du dashboard, refonte visuelle et nouvelle page de téléchargement avec les apps Desktop et Mobile pour macOS, Windows et Linux.',
  },
]

export function WhatsNewModal({ open, onClose }: WhatsNewModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <DialogHeader
        onClose={onClose}
        icon={<Gift className="h-5 w-5 text-primary" />}
      >
        <DialogTitle>Quoi de neuf ?</DialogTitle>
        <DialogDescription>
          Les dernières nouveautés et améliorations de Faktur
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
        {NEWS_ENTRIES.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
            className="group relative rounded-2xl border border-border/60 bg-surface/50 p-3.5 transition-all hover:border-border hover:bg-surface"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.iconBg}`}
              >
                {entry.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  {entry.badge && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                      {entry.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
                {entry.cta && (
                  entry.cta.external ? (
                    <a
                      href={entry.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {entry.cta.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link
                      href={entry.cta.href}
                      onClick={onClose}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {entry.cta.label}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Dialog>
  )
}
