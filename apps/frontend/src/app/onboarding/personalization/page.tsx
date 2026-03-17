'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { TEMPLATES } from '@/lib/invoice-templates'
import { TemplateThumbnail } from '@/components/shared/template-thumbnail'
import { Paintbrush, Check, ImagePlus, Trash2 } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
} satisfies Variants

const accentColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Turquoise', value: '#14b8a6' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Noir', value: '#18181b' },
]

export default function OnboardingPersonalizationPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState('classique')
  const [selectedColor, setSelectedColor] = useState('#6366f1')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const { data } = await api.upload<{ logoUrl: string }>('/settings/invoices/logo', formData)
      if (data?.logoUrl) setLogoUrl(data.logoUrl)
    } catch {
      // silently ignore upload errors during onboarding
    }
    setUploading(false)
  }

  function handleSubmit() {
    // Save selections in sessionStorage for the billing step
    sessionStorage.setItem('onboarding_appearance', JSON.stringify({
      template: selectedTemplate,
      accentColor: selectedColor,
      logoUrl,
    }))
    router.push('/onboarding/email')
  }

  function handleSkip() {
    router.push('/onboarding/email')
  }

  return (
    <motion.div initial="hidden" animate="visible">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-8">
          <motion.div variants={fadeUp} custom={0} className="flex flex-col items-center gap-4 text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Paintbrush className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Personnalisez vos documents</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisissez l&apos;apparence de vos factures et devis.
              </p>
            </div>
          </motion.div>

          {/* Logo Upload */}
          <motion.div variants={fadeUp} custom={1} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Logo de vos documents</h2>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                {logoUrl && (
                  <button onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground">PNG ou SVG, fond transparent recommande</p>
                <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <><Spinner /> Envoi...</> : 'Importer un logo'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Template Grid */}
          <motion.div variants={fadeUp} custom={2} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Modele de document</h2>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <TemplateThumbnail
                  key={tpl.id}
                  tpl={tpl}
                  accentColor={selectedColor}
                  selected={selectedTemplate === tpl.id}
                  size="lg"
                  onClick={() => setSelectedTemplate(tpl.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Accent Color */}
          <motion.div variants={fadeUp} custom={3} className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Couleur d&apos;accent</h2>
            <div className="flex flex-wrap gap-2.5">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className="group relative"
                  title={color.name}
                >
                  <div
                    className={`h-9 w-9 rounded-lg transition-all ${
                      selectedColor === color.value
                        ? 'ring-2 ring-offset-2 ring-offset-card scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: color.value,
                      ...(selectedColor === color.value
                        ? ({ '--tw-ring-color': color.value } as React.CSSProperties)
                        : {}),
                    }}
                  />
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={4} className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={uploading}
            >
              Passer cette etape
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={uploading}
            >
              Suivant
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="mt-4">
            <p className="text-xs text-muted-foreground text-center">
              Vous pourrez modifier ces paramètres à tout moment dans les réglages.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
