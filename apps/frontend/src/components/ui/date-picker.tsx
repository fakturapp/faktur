'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function parseDate(s: string) {
  if (!s) return null
  const parts = s.split('-')
  if (parts.length !== 3) return null
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) }
}

export function DatePicker({
  value,
  onChange,
  lang = 'fr',
  className,
  accentColor = '#6366f1',
}: {
  value: string
  onChange?: (v: string) => void
  lang?: string
  className?: string
  accentColor?: string
}) {
  const parsed = parseDate(value)
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth())
  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const months = lang === 'en' ? MONTHS_EN : MONTHS_FR
  const days = lang === 'en' ? DAYS_EN : DAYS_FR

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.year)
      setViewMonth(parsed.month)
    }
  }, [open])

  // Calculate position when open
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popupH = 340 // approximate height
    const popupW = 280
    let top = rect.bottom + 4
    let left = rect.left

    // Flip up if not enough space below
    if (top + popupH > window.innerHeight) {
      top = rect.top - popupH - 4
    }
    // Clamp to right edge
    if (left + popupW > window.innerWidth) {
      left = window.innerWidth - popupW - 8
    }
    setPos({ top, left })
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }, [viewMonth])

  const selectDay = useCallback((day: number) => {
    onChange?.(toDateStr(viewYear, viewMonth, day))
    setOpen(false)
  }, [viewYear, viewMonth, onChange])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())

  const formattedValue = value
    ? (() => {
        try {
          return new Date(value).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        } catch {
          return value
        }
      })()
    : '...'

  const popup = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[280px] select-none"
          style={{ top: pos.top, left: pos.left, fontFamily: 'inherit' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={prevMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {months[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-1">
            {days.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isToday = dateStr === todayStr

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-all',
                    isSelected
                      ? 'text-white font-semibold'
                      : isToday
                        ? 'font-semibold text-gray-900 ring-1 ring-inset ring-gray-300'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                  style={isSelected ? { backgroundColor: accentColor } : undefined}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Today button */}
          <button
            onClick={() => {
              onChange?.(todayStr)
              setOpen(false)
            }}
            className="w-full mt-2 text-xs font-medium text-center py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: accentColor }}
          >
            {lang === 'en' ? 'Today' : "Aujourd'hui"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={triggerRef} className={cn('relative inline-block', className)}>
      <span
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setOpen(!open)}
      >
        {formattedValue}
      </span>

      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </div>
  )
}
