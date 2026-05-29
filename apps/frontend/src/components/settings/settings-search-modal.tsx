'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { searchSettings, type SettingsSearchItem } from '@/lib/settings-search-index'

interface SettingsSearchModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsSearchModal({ open, onClose }: SettingsSearchModalProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const results = searchSettings(query)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const navigate = useCallback((item: SettingsSearchItem) => {
    const url = query.trim()
      ? `${item.href}?highlight=${encodeURIComponent(query.trim())}`
      : item.href
    router.push(url)
    onClose()
  }, [router, onClose, query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher dans les paramètres..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Esc
                </kbd>
                <button onClick={onClose} className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors sm:hidden">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {query.trim() === '' ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Tapez pour rechercher...</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Entreprise, banque, facturation, AI...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Aucun résultat pour « {query} »</p>
                </div>
              ) : (
                results.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        i === selectedIndex ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        i === selectedIndex ? 'bg-primary/15' : 'bg-muted'
                      }`}>
                        <Icon className={`h-4 w-4 ${i === selectedIndex ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0">{item.section}</span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer hint */}
            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">↑</kbd>
                  <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">↓</kbd>
                  naviguer
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-4 items-center rounded border border-border bg-muted px-1 font-mono">↵</kbd>
                  ouvrir
                </span>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
