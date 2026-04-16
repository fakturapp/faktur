'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { getTemplate } from '@/lib/invoice-templates'
import { formatCurrency } from '@/lib/currency'
import { useCompanySettings } from '@/lib/company-settings-context'
import { Eye, ImagePlus } from 'lucide-react'

export function InvoicePreview() {
  const { settings, companyLogoUrl } = useInvoiceSettings()
  const { company } = useCompanySettings()
  const currentTemplate = getTemplate(settings.template, settings.darkMode)
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl
  const currency = company?.currency || 'EUR'

  return (
    <div className="sticky top-6">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Apercu du document</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTemplate.name} &middot; {settings.billingType === 'quick' ? 'Rapide' : 'Complet'}
            </p>
          </div>
          <div className="p-4 bg-muted/30">
            <div className="rounded-lg shadow-sm overflow-hidden relative mx-auto"
              style={{
                aspectRatio: '210 / 270', maxHeight: '420px', backgroundColor: currentTemplate.docBg,
                border: settings.darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
              }}>
              <div className="h-full flex flex-col p-5 relative">
                {}
                {currentTemplate.layout === 'banner' && (
                  <div className="rounded-lg px-4 py-3 mb-4 -mx-2 -mt-2" style={{ backgroundColor: settings.accentColor }}>
                    <div className="flex justify-between items-center">
                      {effectiveLogoUrl ? (
                        <img src={effectiveLogoUrl} alt="Logo" className="h-7 w-auto max-w-[80px] object-contain" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                      ) : (
                        <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: '#fff', opacity: 0.5 }} />
                      )}
                      <p className="text-xs font-bold tracking-wide" style={{ color: '#fff' }}>FACTURE</p>
                    </div>
                  </div>
                )}
                {/* Standard header */}
                {currentTemplate.layout !== 'banner' && (
                  <div className="flex items-start justify-between mb-5">
                    <div className="space-y-2">
                      {effectiveLogoUrl ? (
                        <img src={effectiveLogoUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" style={{ borderRadius: `${settings.logoBorderRadius}px` }} />
                      ) : (
                        <div className="h-10 w-20 border border-dashed flex items-center justify-center" style={{ borderRadius: currentTemplate.borderRadius, backgroundColor: currentTemplate.borderLight, borderColor: currentTemplate.editBorderDashed }}>
                          <ImagePlus className="h-5 w-5" style={{ color: currentTemplate.editBorderDashed }} />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                        <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                        <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold tracking-wide" style={{ color: settings.accentColor }}>FACTURE</p>
                      <p className="text-[10px] font-medium" style={{ color: currentTemplate.textMuted }}>#F-2026-001</p>
                      <p className="text-[10px]" style={{ color: currentTemplate.textMuted }}>14/03/2026</p>
                    </div>
                  </div>
                )}
                <div className="h-[2px] rounded-full mb-5" style={{ backgroundColor: settings.accentColor }} />
                {/* Addresses */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>Émetteur</p>
                    <div className="space-y-0.5">
                      <div className="h-2 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      <div className="h-1.5 w-36 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>Client</p>
                    <div className="space-y-0.5">
                      <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
                {/* Items table */}
                <div className="flex-1 min-h-0">
                  <div className="px-3 py-2 flex items-center" style={{ backgroundColor: settings.accentColor + '12', borderTopLeftRadius: currentTemplate.borderRadius, borderTopRightRadius: currentTemplate.borderRadius }}>
                    <div className="flex w-full items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                      <div className="flex-1" />
                      {settings.billingType === 'detailed' && (<>
                        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                      </>)}
                      <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                      <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: settings.accentColor + '50' }} />
                    </div>
                  </div>
                  {[...Array(settings.billingType === 'detailed' ? 4 : 3)].map((_, i) => (
                    <div key={i} className="px-3 py-2.5 flex items-center" style={{ backgroundColor: i % 2 === 0 ? currentTemplate.rowEven : currentTemplate.rowOdd, borderBottom: i < (settings.billingType === 'detailed' ? 3 : 2) ? `1px solid ${currentTemplate.borderLight}` : undefined }}>
                      <div className="flex w-full items-center gap-2">
                        <div className="h-1.5 rounded-full" style={{ width: `${60 + (i % 3) * 15}px`, backgroundColor: currentTemplate.borderLight }} />
                        <div className="flex-1" />
                        {settings.billingType === 'detailed' && (<>
                          <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                        </>)}
                        <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Totals */}
                <div className="flex justify-end mt-4 mb-4">
                  <div className="w-48 space-y-1.5">
                    {settings.billingType === 'detailed' && (<>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>Sous-total HT</p>
                        <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>TVA (20%)</p>
                        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      </div>
                      <div className="h-px my-1" style={{ backgroundColor: currentTemplate.borderLight }} />
                    </>)}
                    <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: settings.accentColor + currentTemplate.totalBg, borderRadius: currentTemplate.borderRadius }}>
                      <p className="text-[10px] font-semibold" style={{ color: settings.accentColor }}>Total TTC</p>
                      <p className="text-xs font-bold" style={{ color: settings.accentColor }}>{formatCurrency(1234, currency)}</p>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="pt-3 mt-auto space-y-2" style={{ borderTop: `1px solid ${currentTemplate.borderLight}` }}>
                  {settings.paymentMethods.length > 0 && (
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: currentTemplate.textMuted }}>Moyens de paiement</p>
                      <div className="flex flex-wrap gap-1.5">
                        {settings.paymentMethods.includes('bank_transfer') && (
                          <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>Virement</span>
                        )}
                        {settings.paymentMethods.includes('cash') && (
                          <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>Espèces</span>
                        )}
                        {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                          <span className="text-[8px] rounded-md px-2 py-0.5" style={{ backgroundColor: currentTemplate.paymentBadgeBg, border: `1px solid ${currentTemplate.paymentBadgeBorder}`, color: currentTemplate.paymentBadgeText }}>{settings.customPaymentMethod}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
