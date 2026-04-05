'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, FlaskConical, AlertTriangle, Zap, Eye, MousePointer2, Share2 } from 'lucide-react'

export default function CollaborationSettingsPage() {
  const { settings, updateSettings, loading } = useInvoiceSettings()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const enabled = settings.collaborationEnabled

  const handleToggle = () => {
    if (!enabled) {
      setConfirmOpen(true)
    } else {
      updateSettings({ collaborationEnabled: false })
      toast('Collaboration d\u00e9sactiv\u00e9e', 'info')
    }
  }

  const handleConfirmEnable = () => {
    updateSettings({ collaborationEnabled: true })
    toast('Collaboration activ\u00e9e', 'success')
    setConfirmOpen(false)
  }

  if (loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-2xl px-4 lg:px-6 py-4 md:py-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10">
          <Users className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
            Collaboration en temps r&eacute;el
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-500 uppercase tracking-wider">
              <FlaskConical className="h-2.5 w-2.5" />
              B&ecirc;ta
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            &Eacute;ditez vos documents &agrave; plusieurs en temps r&eacute;el, comme sur Figma ou Canva.
          </p>
        </div>
      </div>

      {/* Toggle card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">
              {enabled ? 'Collaboration activ\u00e9e' : 'Collaboration d\u00e9sactiv\u00e9e'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-lg">
              {enabled
                ? 'Les membres de votre \u00e9quipe peuvent voir qui \u00e9dite un document et collaborer en temps r\u00e9el. Les curseurs, la pr\u00e9sence et le partage sont actifs.'
                : 'Activez pour permettre l\'\u00e9dition collaborative en temps r\u00e9el sur vos factures, devis et avoirs.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
              enabled ? 'bg-purple-500' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Features description */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Fonctionnalit&eacute;s incluses
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: MousePointer2, title: 'Curseurs en temps r\u00e9el', desc: 'Voyez o\u00f9 se trouve chaque collaborateur sur le document' },
            { icon: Zap, title: 'Synchronisation instantan\u00e9e', desc: 'Chaque modification est visible instantan\u00e9ment par tous les participants' },
            { icon: Eye, title: 'Pr\u00e9sence en direct', desc: 'Avatars des personnes connect\u00e9es sur chaque document dans la liste' },
            { icon: Share2, title: 'Partage par lien', desc: 'G\u00e9n\u00e9rez des liens de partage avec permissions personnalis\u00e9es' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`rounded-xl border border-border p-4 transition-all duration-200 ${enabled ? 'opacity-100 bg-card/50' : 'opacity-40 bg-transparent'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${enabled ? 'bg-purple-500/10' : 'bg-muted'}`}>
                  <Icon className={`h-4 w-4 ${enabled ? 'text-purple-500' : 'text-muted-foreground'}`} />
                </div>
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-11">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md">
        <DialogTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p>Fonctionnalit&eacute; en b&ecirc;ta extr&ecirc;me</p>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">Lisez attentivement avant d&apos;activer</p>
          </div>
        </DialogTitle>

        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            La collaboration en temps r&eacute;el est une fonctionnalit&eacute;{' '}
            <span className="font-semibold text-amber-500">exp&eacute;rimentale en b&ecirc;ta extr&ecirc;me</span>.
            De nombreux bugs peuvent survenir.
          </p>

          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-600 dark:text-amber-400 space-y-2">
            <p className="font-bold text-sm">Risques connus :</p>
            <ul className="list-disc list-inside space-y-1 leading-relaxed">
              <li>Des bugs d&apos;affichage ou de synchronisation peuvent survenir</li>
              <li>Les curseurs peuvent &ecirc;tre d&eacute;cal&eacute;s dans certaines situations</li>
              <li>Des conflits d&apos;&eacute;dition sont possibles si deux personnes modifient le m&ecirc;me champ</li>
              <li>La fonctionnalit&eacute; peut &ecirc;tre instable ou lente selon la connexion</li>
              <li>Des pertes de donn&eacute;es mineures sont possibles en cas de d&eacute;connexion</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Vous pourrez d&eacute;sactiver cette fonctionnalit&eacute; &agrave; tout moment depuis cette page.
            Aucune donn&eacute;e ne sera perdue en d&eacute;sactivant.
          </p>
        </div>

        <DialogFooter className="mt-5">
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleConfirmEnable} className="bg-purple-500 hover:bg-purple-600 gap-2">
            <FlaskConical className="h-3.5 w-3.5" />
            Activer la b&ecirc;ta
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
