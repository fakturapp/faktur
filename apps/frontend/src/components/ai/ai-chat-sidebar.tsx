'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { ShinyText } from '@/components/ui/shiny-text'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Send, Sparkles, User } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface DocumentLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

interface AiChatSidebarProps {
  documentType: 'invoice' | 'quote'
  subject: string
  lines: DocumentLine[]
  notes: string
  acceptanceConditions: string
  onDocumentUpdate: (doc: {
    subject?: string
    lines?: DocumentLine[]
    notes?: string
    acceptanceConditions?: string
  }) => void
}

export function AiChatSidebar({
  documentType,
  subject,
  lines,
  notes,
  acceptanceConditions,
  onDocumentUpdate,
}: AiChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Document généré avec succès ! Vous pouvez me demander de modifier le contenu : ajouter/supprimer des lignes, changer les prix, modifier l'objet, etc.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)

    const { data, error } = await api.post<{
      document: {
        subject: string
        lines: DocumentLine[]
        notes?: string
        acceptanceConditions?: string
      }
    }>('/ai/chat-document', {
      message,
      currentDocument: {
        subject,
        lines,
        notes,
        acceptanceConditions,
      },
      type: documentType,
    })

    setLoading(false)

    if (error || !data?.document) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez.' },
      ])
      return
    }

    // Apply changes
    onDocumentUpdate({
      subject: data.document.subject,
      lines: data.document.lines,
      notes: data.document.notes || '',
      acceptanceConditions: data.document.acceptanceConditions || '',
    })

    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Document mis à jour !' },
    ])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px] rounded-2xl border border-border bg-card/50">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-semibold text-foreground">Assistant IA</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 mt-0.5">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-foreground'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
              <Sparkles className="h-3 w-3 text-purple-500" />
            </div>
            <div className="bg-muted/50 rounded-xl px-3 py-2 flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              <ShinyText
                text="Génération..."
                className="text-xs font-medium"
                color="#a78bfa"
                shineColor="#e0e7ff"
                speed={1.5}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Modifier le document..."
            disabled={loading}
            className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
