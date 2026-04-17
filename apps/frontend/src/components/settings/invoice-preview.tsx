'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { getTemplate } from '@/lib/invoice-templates'
import { Eye, ImagePlus } from 'lucide-react'

export function InvoicePreview() {
  const { settings, companyLogoUrl } = useInvoiceSettings()
  const currentTemplate = getTemplate(settings.template, settings.darkMode)
  const effectiveLogoUrl = settings.logoSource === 'company' ? companyLogoUrl : settings.logoUrl
  const detailedColumns =
    settings.billingType === 'detailed'
      ? [
          { key: 'quantity', width: 'w-8', visible: settings.defaultShowQuantityColumn },
          { key: 'unit', width: 'w-10', visible: settings.defaultShowUnitColumn },
          { key: 'unitPrice', width: 'w-14', visible: settings.defaultShowUnitPriceColumn },
          { key: 'vat', width: 'w-10', visible: settings.defaultShowVatColumn },
        ].filter((column) => column.visible)
      : []
  const previewRowCount = settings.billingType === 'detailed' ? 4 : 3
  const previewVatRate = Number(settings.defaultVatRate ?? 20)

  return (
    <div className="sticky top-6">
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Apercu du document</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTemplate.name} | {settings.billingType === 'quick' ? 'Rapide' : 'Complet'}
            </p>
          </div>
          <div className="bg-muted/30 p-4">
            <div
              className="relative mx-auto overflow-hidden rounded-lg shadow-sm"
              style={{
                aspectRatio: '210 / 270',
                maxHeight: '420px',
                backgroundColor: currentTemplate.docBg,
                border: settings.darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
              }}
            >
              <div className="flex h-full flex-col p-5">
                {currentTemplate.layout === 'banner' && (
                  <div
                    className="-mx-2 -mt-2 mb-4 rounded-lg px-4 py-3"
                    style={{ backgroundColor: settings.accentColor }}
                  >
                    <div className="flex items-center justify-between">
                      {effectiveLogoUrl ? (
                        <img
                          src={effectiveLogoUrl}
                          alt="Logo"
                          className="h-7 w-auto max-w-[80px] object-contain"
                          style={{ borderRadius: `${settings.logoBorderRadius}px` }}
                        />
                      ) : (
                        <div className="h-2.5 w-16 rounded-full bg-white/50" />
                      )}
                      <p className="text-xs font-bold tracking-wide text-white">FACTURE</p>
                    </div>
                  </div>
                )}

                {currentTemplate.layout !== 'banner' && (
                  <div className="mb-5 flex items-start justify-between">
                    <div className="space-y-2">
                      {effectiveLogoUrl ? (
                        <img
                          src={effectiveLogoUrl}
                          alt="Logo"
                          className="h-10 w-auto max-w-[120px] object-contain"
                          style={{ borderRadius: `${settings.logoBorderRadius}px` }}
                        />
                      ) : (
                        <div
                          className="flex h-10 w-20 items-center justify-center border border-dashed"
                          style={{
                            borderRadius: currentTemplate.borderRadius,
                            backgroundColor: currentTemplate.borderLight,
                            borderColor: currentTemplate.editBorderDashed,
                          }}
                        >
                          <ImagePlus className="h-5 w-5" style={{ color: currentTemplate.editBorderDashed }} />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                        <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                        <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm font-bold tracking-wide" style={{ color: settings.accentColor }}>
                        FACTURE
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: currentTemplate.textMuted }}>
                        #F-2026-001
                      </p>
                      <p className="text-[10px]" style={{ color: currentTemplate.textMuted }}>
                        14/03/2026
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-5 h-[2px] rounded-full" style={{ backgroundColor: settings.accentColor }} />

                <div className="mb-6 grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>
                      Emetteur
                    </p>
                    <div className="space-y-0.5">
                      <div className="h-2 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      <div className="h-1.5 w-36 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: settings.accentColor }}>
                      Client
                    </p>
                    <div className="space-y-0.5">
                      <div className="h-2 w-24 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      <div className="h-1.5 w-32 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                      <div className="h-1.5 w-28 rounded-full" style={{ backgroundColor: currentTemplate.borderLight, opacity: 0.6 }} />
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1">
                  <div
                    className="flex items-center px-3 py-2"
                    style={{
                      backgroundColor: `${settings.accentColor}12`,
                      borderTopLeftRadius: currentTemplate.borderRadius,
                      borderTopRightRadius: currentTemplate.borderRadius,
                    }}
                  >
                    <div className="flex w-full items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: `${settings.accentColor}50` }} />
                      <div className="flex-1" />
                      {detailedColumns.map((column) => (
                        <div
                          key={column.key}
                          className={`h-1.5 rounded-full ${column.width}`}
                          style={{ backgroundColor: `${settings.accentColor}50` }}
                        />
                      ))}
                      <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: `${settings.accentColor}50` }} />
                    </div>
                  </div>

                  {[...Array(previewRowCount)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center px-3 py-2.5"
                      style={{
                        backgroundColor: i % 2 === 0 ? currentTemplate.rowEven : currentTemplate.rowOdd,
                        borderBottom:
                          i < previewRowCount - 1 ? `1px solid ${currentTemplate.borderLight}` : undefined,
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${60 + (i % 3) * 15}px`,
                            backgroundColor: currentTemplate.borderLight,
                          }}
                        />
                        <div className="flex-1" />
                        {detailedColumns.map((column) => (
                          <div
                            key={column.key}
                            className={`h-1.5 rounded-full ${column.width}`}
                            style={{
                              backgroundColor: currentTemplate.borderLight,
                              opacity: column.key === 'vat' ? 0.7 : 0.6,
                            }}
                          />
                        ))}
                        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 mt-4 flex justify-end">
                  <div className="w-48 space-y-1.5">
                    {settings.billingType === 'detailed' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>
                            Sous-total HT
                          </p>
                          <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                        </div>
                        {settings.defaultShowVatColumn && (
                          <div className="flex items-center justify-between">
                            <p className="text-[9px]" style={{ color: currentTemplate.textMuted }}>
                              TVA ({previewVatRate}%)
                            </p>
                            <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: currentTemplate.borderLight }} />
                          </div>
                        )}
                        <div className="my-1 h-px" style={{ backgroundColor: currentTemplate.borderLight }} />
                      </>
                    )}
                    <div
                      className="flex items-center justify-between px-3 py-2"
                      style={{
                        backgroundColor: settings.accentColor + currentTemplate.totalBg,
                        borderRadius: currentTemplate.borderRadius,
                      }}
                    >
                      <p className="text-[10px] font-semibold" style={{ color: settings.accentColor }}>
                        Total TTC
                      </p>
                      <p className="text-xs font-bold" style={{ color: settings.accentColor }}>
                        1 234,00 EUR
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-2 pt-3" style={{ borderTop: `1px solid ${currentTemplate.borderLight}` }}>
                  {settings.paymentMethods.length > 0 && (
                    <div>
                      <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: currentTemplate.textMuted }}>
                        Moyens de paiement
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {settings.paymentMethods.includes('bank_transfer') && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[8px]"
                            style={{
                              backgroundColor: currentTemplate.paymentBadgeBg,
                              border: `1px solid ${currentTemplate.paymentBadgeBorder}`,
                              color: currentTemplate.paymentBadgeText,
                            }}
                          >
                            Virement
                          </span>
                        )}
                        {settings.paymentMethods.includes('cash') && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[8px]"
                            style={{
                              backgroundColor: currentTemplate.paymentBadgeBg,
                              border: `1px solid ${currentTemplate.paymentBadgeBorder}`,
                              color: currentTemplate.paymentBadgeText,
                            }}
                          >
                            Especes
                          </span>
                        )}
                        {settings.paymentMethods.includes('custom') && settings.customPaymentMethod && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[8px]"
                            style={{
                              backgroundColor: currentTemplate.paymentBadgeBg,
                              border: `1px solid ${currentTemplate.paymentBadgeBorder}`,
                              color: currentTemplate.paymentBadgeText,
                            }}
                          >
                            {settings.customPaymentMethod}
                          </span>
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
