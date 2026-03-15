'use client'

import { Check } from 'lucide-react'
import type { TemplateConfig } from '@/lib/invoice-templates'

export function TemplateThumbnail({
  tpl,
  accentColor,
  selected,
  size = 'sm',
  onClick,
}: {
  tpl: TemplateConfig
  accentColor: string
  selected: boolean
  size?: 'sm' | 'lg'
  onClick?: () => void
}) {
  const T = tpl
  const isLg = size === 'lg'
  const p = isLg ? 'p-3.5' : 'p-2'
  const contrastCol = '#ffffff'

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper onClick={onClick} className="group text-center w-full">
      <div
        className={`relative rounded-lg overflow-hidden transition-all ${
          selected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg'
            : 'border border-border/60 hover:border-border hover:shadow-md'
        }`}
        style={{ aspectRatio: '210 / 297' }}
      >
        <div className={`h-full w-full ${p} flex flex-col relative`} style={{ backgroundColor: T.docBg }}>

          {/* ── CLASSIQUE: dashed borders, blue-gray ── */}
          {T.id === 'classique' && (<>
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-0.5">
                <div className="h-2 w-8 rounded" style={{ backgroundColor: '#bfcee1', opacity: 0.4 }} />
                <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: '#88A0BF', opacity: 0.2 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: '#88A0BF', opacity: 0.15 }} />
              </div>
              <div className="space-y-0.5 mt-2">
                <div className="h-1 w-6 rounded-full border border-dashed" style={{ borderColor: '#bfcee1' }} />
                <div className="h-1 w-8 rounded-full border border-dashed" style={{ borderColor: '#bfcee1' }} />
              </div>
            </div>
            <div className="mb-1.5 pb-1">
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
            </div>
          </>)}

          {/* ── MODERNE: full-width colored banner ── */}
          {T.id === 'moderne' && (<>
            <div className="rounded-md px-2 py-1.5 mb-2 -mx-1 -mt-1" style={{ backgroundColor: accentColor }}>
              <div className="flex justify-between items-center">
                <div className="h-2 w-7 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                <div className="text-right">
                  <div className="h-1.5 w-5 rounded-full ml-auto" style={{ backgroundColor: contrastCol, opacity: 0.9 }} />
                  <div className="h-0.5 w-4 rounded-full ml-auto mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.5 }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1 space-y-0.5">
                <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.3 }} />
                <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.3 }} />
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              </div>
            </div>
          </>)}

          {/* ── COMPACT ── */}
          {T.id === 'compact' && (<>
            <div className="flex justify-between items-start mb-1">
              <div className="h-2 w-8 rounded-none bg-gray-200" />
              <div className="text-right space-y-0.5">
                <div className="h-1.5 w-5 rounded-none" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
                <div className="h-0.5 w-4 rounded-none bg-gray-300" />
              </div>
            </div>
            <div className="border border-gray-300 px-1 py-0.5 mb-1">
              <div className="h-1 w-5 rounded-none bg-gray-200 mb-0.5" />
              <div className="h-0.5 w-8 rounded-none bg-gray-100" />
            </div>
          </>)}

          {/* ── ELEGANCE ── */}
          {T.id === 'elegance' && (<>
            <div className="flex justify-between items-start mb-1.5">
              <div className="space-y-0.5">
                <div className="h-1.5 w-7 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
            </div>
            <div className="h-px mb-2" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
            <div className="mb-2 pb-1" style={{ borderBottom: `0.5px solid ${T.borderLight}` }}>
              <div className="h-0.5 w-3 rounded-full mb-0.5" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
              <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              <div className="h-0.5 w-8 rounded-full mt-0.5" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
            </div>
          </>)}

          {/* ── AUDACIEUX ── */}
          {T.id === 'audacieux' && (<>
            <div className="rounded-xl px-2 py-2.5 mb-2 -mx-1 -mt-1 relative overflow-hidden" style={{ backgroundColor: accentColor }}>
              <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.08 }} />
              <div className="absolute -right-1 -bottom-3 w-6 h-6 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.05 }} />
              <div className="h-2.5 w-8 rounded-full mb-1" style={{ backgroundColor: contrastCol, opacity: 0.9 }} />
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.5 }} />
            </div>
            <div className="rounded-lg px-1 py-1 mb-1.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
              <div className="h-1 w-5 rounded-full mb-0.5" style={{ backgroundColor: T.text, opacity: 0.2 }} />
              <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.15 }} />
            </div>
          </>)}

          {/* ── LATERAL ── */}
          {T.id === 'lateral' && (<>
            <div className="absolute top-0 left-0 bottom-0 flex" style={{ width: '28%' }}>
              <div className="h-full w-full flex flex-col p-1.5 pt-2" style={{ backgroundColor: accentColor }}>
                <div className="h-2 w-5 rounded-full mb-1.5" style={{ backgroundColor: contrastCol, opacity: 0.8 }} />
                <div className="h-0.5 w-full rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.3 }} />
                <div className="h-0.5 w-4/5 rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.2 }} />
                <div className="h-0.5 w-3/5 rounded-full mb-2" style={{ backgroundColor: contrastCol, opacity: 0.2 }} />
                <div className="h-0.5 w-full rounded-full mb-0.5" style={{ backgroundColor: contrastCol, opacity: 0.15 }} />
                <div className="h-0.5 w-4/5 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.15 }} />
              </div>
            </div>
            <div style={{ marginLeft: '30%' }}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
                <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
              </div>
              <div className="rounded px-1 py-0.5 mb-1.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
                <div className="h-1 w-5 rounded-full mb-0.5" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
            </div>
          </>)}

          {/* ── MINIMALISTE ── */}
          {T.id === 'minimaliste' && (<>
            <div className="flex justify-between items-start mb-3">
              <div className="h-2 w-7 rounded-full" style={{ backgroundColor: T.text, opacity: 0.1 }} />
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
            </div>
            <div className="h-px mb-3" style={{ backgroundColor: T.borderLight }} />
            <div className="space-y-0.5 mb-2">
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.2 }} />
              <div className="h-1 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.12 }} />
            </div>
          </>)}

          {/* ── DUO ── */}
          {T.id === 'duo' && (<>
            <div className="flex -mx-1 -mt-1 mb-2 overflow-hidden rounded-md">
              <div className="flex-1 px-1.5 py-1.5" style={{ backgroundColor: accentColor }}>
                <div className="h-2 w-6 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.7 }} />
                <div className="h-0.5 w-5 rounded-full mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.3 }} />
              </div>
              <div className="flex-1 px-1.5 py-1.5" style={{ backgroundColor: '#1e293b' }}>
                <div className="h-1.5 w-5 rounded-full ml-auto" style={{ backgroundColor: contrastCol, opacity: 0.8 }} />
                <div className="h-0.5 w-4 rounded-full ml-auto mt-0.5" style={{ backgroundColor: contrastCol, opacity: 0.4 }} />
              </div>
            </div>
            <div className="flex gap-1.5 mb-2">
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.2 }} />
                <div className="h-0.5 w-7 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.12 }} />
              </div>
              <div className="flex-1 rounded px-1 py-0.5" style={{ backgroundColor: T.clientBlockBg, border: `0.5px solid ${T.clientBlockBorder}` }}>
                <div className="h-1 w-4 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              </div>
            </div>
          </>)}

          {/* ── LIGNE ── */}
          {T.id === 'ligne' && (<>
            <div className="flex justify-between items-start mb-1">
              <div className="space-y-0.5">
                <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
                <div className="h-0.5 w-9 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
              </div>
              <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.6 }} />
            </div>
            <div className="h-[2px] mb-1.5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
            <div className="space-y-0.5 mb-1.5 pb-1" style={{ borderBottom: `1.5px solid ${accentColor}40` }}>
              <div className="h-1 w-5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15 }} />
              <div className="h-0.5 w-8 rounded-full" style={{ backgroundColor: T.textMuted, opacity: 0.1 }} />
            </div>
          </>)}

          {/* ── Common: table + totals ── */}
          <div style={T.id === 'lateral' ? { marginLeft: '30%' } : undefined} className="flex-1 flex flex-col">
            <>
              <div className="px-0.5 py-0.5 mb-px" style={{ backgroundColor: accentColor, borderRadius: T.id === 'compact' ? '0' : '2px 2px 0 0' }}>
                <div className="flex gap-1">
                  <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                  <div className="flex-1" />
                  <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: contrastCol, opacity: 0.6 }} />
                </div>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="px-0.5 py-[2px]" style={{ backgroundColor: i % 2 === 0 ? T.rowEven : T.rowOdd, borderBottom: `0.5px solid ${T.borderLight}` }}>
                  <div className="flex gap-0.5 items-center">
                    <div className="h-0.5 rounded-full" style={{ backgroundColor: T.text, opacity: 0.15, width: `${8 + i * 2}px` }} />
                    <div className="flex-1" />
                    <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: T.text, opacity: 0.1 }} />
                  </div>
                </div>
              ))}
            </>
            <div className="flex-1" />
            <div className="flex justify-end mt-1">
              <div className="rounded px-1 py-0.5" style={{ backgroundColor: `${accentColor}15`, borderRadius: T.id === 'compact' ? '0' : '3px' }}>
                <div className="h-1 w-6 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
              </div>
            </div>
            <div className="mt-1 pt-0.5" style={{ borderTop: `0.5px solid ${T.footerBorder}` }}>
              <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: T.textFooter, opacity: 0.15 }} />
            </div>
          </div>
        </div>

        {selected && (
          <div className="absolute top-1.5 right-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
      <p className={`text-[11px] mt-1.5 font-medium transition-colors ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {T.name}
      </p>
      {isLg && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{T.description}</p>
      )}
    </Wrapper>
  )
}
