'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { ShinyText } from '@/components/ui/shiny-text'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Send, Sparkles, User, ChevronDown } from 'lucide-react'
import { AnthropicIcon } from '@/components/icons/anthropic-icon'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GroqIcon } from '@/components/icons/groq-icon'

const AI_CHAT_MODEL_KEY = 'faktur_ai_chat_model_pref'

const CHAT_PROVIDERS = [
  { id: 'gemini' as const, name: 'Gemini', icon: GoogleIcon, iconClass: '', iconBg: 'bg-blue-500/10' },
  { id: 'groq' as const, name: 'Groq', icon: GroqIcon, iconClass: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  { id: 'claude' as const, name: 'Claude', icon: AnthropicIcon, iconClass: 'text-violet-500', iconBg: 'bg-violet-500/10' },
] as const

const CHAT_MODELS: Record<string, { id: string; name: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash-lite', name: 'Flash Lite' },
    { id: 'gemini-2.5-flash', name: 'Flash' },
    { id: 'gemini-2.5-pro', name: 'Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
  ],
  claude: [
    { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet' },
    { id: 'claude-opus-4-6', name: 'Opus' },
  ],
}

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
  onProcessingChange?: (processing: boolean) => void
}

export function AiChatSidebar({
  documentType,
  subject,
  lines,
  notes,
  acceptanceConditions,
  onDocumentUpdate,
  onProcessingChange,
}: AiChatSidebarProps) {
  const { settings } = useInvoiceSettings()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA. Vous pouvez me demander de modifier le contenu : ajouter/supprimer des lignes, changer les prix, modifier l'objet, etc.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatProvider, setChatProvider] = useState(settings.aiProvider)
  const [chatModel, setChatModel] = useState(settings.aiModel)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Restore model pref
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_CHAT_MODEL_KEY)
      if (raw) {
        const pref = JSON.parse(raw)
        setChatProvider(pref.provider)
        setChatModel(pref.model)
      }
    } catch {}
  }, [])

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
    onProcessingChange?.(true)

    try {
      localStorage.setItem(AI_CHAT_MODEL_KEY, JSON.stringify({ provider: chatProvider, model: chatModel }))
    } catch {}

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
      provider: chatProvider,
      model: chatModel,
    })

    setLoading(false)
    onProcessingChange?.(false)

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
      <div className="relative flex items-center gap-2 px-4 py-3 border-b border-border">
        <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground shrink-0">Assistant IA</span>
        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          {(() => {
            const p = CHAT_PROVIDERS.find((x) => x.id === chatProvider)
            const Icon = p?.icon
            return Icon ? <Icon className={cn('h-3 w-3', p.iconClass)} /> : null
          })()}
          <span className="max-w-[60px] truncate">{CHAT_MODELS[chatProvider]?.find((m) => m.id === chatModel)?.name || 'Modèle'}</span>
          <ChevronDown className={cn('h-3 w-3 transition-transform', showModelPicker && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-2 mt-1 z-20 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            >
              {CHAT_PROVIDERS.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.id}>
                    <div className="px-3 py-1 flex items-center gap-1.5 border-b border-border/50 bg-muted/30">
                      <Icon className={cn('h-2.5 w-2.5', p.iconClass)} />
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{p.name}</span>
                    </div>
                    {CHAT_MODELS[p.id]?.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setChatProvider(p.id)
                          setChatModel(m.id)
                          setShowModelPicker(false)
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-left text-[11px] transition-all',
                          chatProvider === p.id && chatModel === m.id
                            ? 'bg-primary/5 text-primary font-medium'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
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
                text="Réflexion..."
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
