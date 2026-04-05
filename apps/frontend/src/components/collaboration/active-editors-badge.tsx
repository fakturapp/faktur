'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface EditorInfo {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  color: string
}

const ROUTE_MAP: Record<DocumentType, string> = {
  invoice: 'invoices',
  quote: 'quotes',
  credit_note: 'credit-notes',
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ── Hook to fetch active editors ──────────────────────────────────────────

export function useActiveEditors(documentType: DocumentType) {
  const [editors, setEditors] = useState<Record<string, EditorInfo[]>>({})

  const refresh = useCallback(async () => {
    const { data } = await api.get<{ data: Record<string, EditorInfo[]> }>(
      `/collaboration/active-editors/${documentType}`
    )
    if (data?.data) setEditors(data.data)
  }, [documentType])

  useEffect(() => {
    refresh()
    // Poll every 8 seconds
    const interval = setInterval(refresh, 8000)
    return () => clearInterval(interval)
  }, [refresh])

  return editors
}

// ── Inline badge for document rows ────────────────────────────────────────

interface ActiveEditorsBadgeProps {
  documentId: string
  documentType: DocumentType
  editors: Record<string, EditorInfo[]>
}

export function ActiveEditorsBadge({ documentId, documentType, editors }: ActiveEditorsBadgeProps) {
  const router = useRouter()
  const docEditors = editors[documentId]
  if (!docEditors || docEditors.length === 0) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/${ROUTE_MAP[documentType]}/${documentId}/edit`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 shrink-0"
      title={`${docEditors.map((e) => e.fullName || e.email).join(', ')} — Cliquer pour rejoindre`}
    >
      <div className="flex -space-x-1.5">
        <AnimatePresence mode="popLayout">
          {docEditors.slice(0, 3).map((editor) => (
            <motion.div
              key={editor.userId}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.3 }}
              className="relative"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-card"
                style={{ backgroundColor: editor.color }}
              >
                {editor.avatarUrl ? (
                  <img src={editor.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials(editor.fullName, editor.email)
                )}
              </div>
              {/* Pulsing dot */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-card" />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {docEditors.length > 3 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-card">
            +{docEditors.length - 3}
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium text-green-500 hidden sm:inline">
        En ligne
      </span>
    </button>
  )
}
