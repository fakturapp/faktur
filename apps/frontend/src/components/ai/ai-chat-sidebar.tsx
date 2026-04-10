'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Spinner } from '@/components/ui/spinner'
import { ShinyText } from '@/components/ui/shiny-text'
import { MarkdownRenderer, ModificationBlock } from '@/components/ui/markdown-renderer'
import { useInvoiceSettings } from '@/lib/invoice-settings-context'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Send,
  Sparkles,
  User,
  Settings2,
  Pencil,
  HelpCircle,
  Wand2,
  Check,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react'
import { GroqIcon } from '@/components/icons/groq-icon'
import {
  type ChatMode,
  type ChatMessage,
  type ChatModification,
  type DocumentSnapshot,
  type DocumentLine,
  CHAT_MODES,
  CHAT_MODELS,
  loadChatPreferences,
  saveChatPreferences,
} from '@/lib/ai-chat-config'

const MODE_ICONS = {
  edition: Pencil,
  question: HelpCircle,
  libre: Wand2,
} as const

let messageIdCounter = 0
function nextMsgId() {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

// ─── Thinking steps per mode ────────────────────────────────────────
const THINKING_STEPS: Record<ChatMode, string[]> = {
  edition: [
    'Analyse de votre demande...',
    'Lecture du document actuel...',
    'Application des modifications...',
    'Vérification de la cohérence...',
    'Finalisation du document...',
  ],
  question: [
    'Analyse de votre question...',
    'Vérification des règles légales...',
    'Consultation du Code de commerce...',
    'Rédaction de la réponse...',
  ],
  libre: [
    'Analyse de votre instruction...',
    'Création des éléments...',
    'Ajout des lignes de facturation...',
    'Calcul des montants...',
    'Finalisation des modifications...',
  ],
}

// ─── Props ───────────────────────────────────────────────────────────────

interface AiChatSidebarProps {
  documentType: 'invoice' | 'quote'
  subject: string
  lines: DocumentLine[]
  notes: string
  acceptanceConditions: string
  clientName?: string
  clientSiren?: string
  clientSiret?: string
  clientVatNumber?: string
  clientAddress?: string
  clientEmail?: string
  onDocumentUpdate: (doc: {
    subject?: string
    lines?: DocumentLine[]
    notes?: string
    acceptanceConditions?: string
  }) => void
  onProcessingChange?: (processing: boolean) => void
  onErrorChange?: (error: string | null) => void
  onRetryRef?: React.MutableRefObject<(() => void) | null>
}

export function AiChatSidebar({
  documentType,
  subject,
  lines,
  notes,
  acceptanceConditions,
  clientName,
  clientSiren,
  clientSiret,
  clientVatNumber,
  clientAddress,
  clientEmail,
  onDocumentUpdate,
  onProcessingChange,
  onErrorChange,
  onRetryRef,
}: AiChatSidebarProps) {
  const { settings } = useInvoiceSettings()

  // ─── State ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextMsgId(),
      role: 'assistant',
      content: `Bonjour ! Je suis **Faktur AI**. Choisissez un **mode** pour commencer :\n\n- **Édition** : Modifier le contenu du document\n- **Question** : Poser des questions de conformité\n- **Libre** : Instructions libres avec suggestions`,
      mode: 'edition',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)
  const [chatModel, setChatModel] = useState(settings.aiModel || 'llama-3.3-70b-versatile')
  const [chatMode, setChatMode] = useState<ChatMode>('edition')
  const detailLevel = 'complet' as const
  const [showSettings, setShowSettings] = useState(false)
  const [settingsMenu, setSettingsMenu] = useState<'main' | 'model' | 'mode'>('main')
  const [documentHistory, setDocumentHistory] = useState<DocumentSnapshot[]>([])
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number }>({ bottom: 0, left: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const thinkingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastUserMessageRef = useRef<string>('')

  // ─── Expose retry to parent ─────────────────────────────────────────
  useEffect(() => {
    if (onRetryRef) {
      onRetryRef.current = () => {
        if (lastUserMessageRef.current) handleSend(lastUserMessageRef.current)
      }
    }
  })

  // ─── Restore preferences ────────────────────────────────────────────
  useEffect(() => {
    const prefs = loadChatPreferences()
    if (prefs) {
      setChatModel(prefs.model)
      setChatMode(prefs.mode)
    }
  }, [])

  // ─── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, thinkingStep])

  // ─── Thinking step cycling ──────────────────────────────────────────
  useEffect(() => {
    if (loading) {
      setThinkingStep(0)
      thinkingTimerRef.current = setInterval(() => {
        setThinkingStep((prev) => {
          const steps = THINKING_STEPS[chatMode]
          return prev < steps.length - 1 ? prev + 1 : prev
        })
      }, 2200)
    } else {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current)
        thinkingTimerRef.current = null
      }
      setThinkingStep(0)
    }
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current)
    }
  }, [loading, chatMode])

  // ─── Position dropdown above the button, smart overflow ─────────────
  useLayoutEffect(() => {
    if (!showSettings || !settingsBtnRef.current) return
    const rect = settingsBtnRef.current.getBoundingClientRect()
    const dropdownW = 264
    const bottom = window.innerHeight - rect.top + 6

    let left = rect.left + rect.width / 2 - dropdownW / 2
    if (left + dropdownW > window.innerWidth - 8) {
      left = window.innerWidth - dropdownW - 8
    }
    if (left < 8) {
      left = 8
    }

    setDropdownPos({ bottom, left })
  }, [showSettings])

  // ─── Close settings on outside click ────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        settingsBtnRef.current && !settingsBtnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  // ─── Get current document snapshot ──────────────────────────────────
  const getCurrentSnapshot = useCallback((): DocumentSnapshot => ({
    subject,
    lines: [...lines],
    notes,
    acceptanceConditions,
  }), [subject, lines, notes, acceptanceConditions])

  // ─── Handle modification accept/revert ──────────────────────────────
  function handleModificationAction(messageId: string, modId: string, action: 'accept' | 'revert') {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.modifications) return msg
        return {
          ...msg,
          modifications: msg.modifications.map((mod) => {
            if (mod.id !== modId) return mod
            if (action === 'accept') {
              return { ...mod, accepted: true, reverted: false }
            } else {
              if (mod.documentSnapshot) {
                onDocumentUpdate(mod.documentSnapshot)
              }
              return { ...mod, reverted: true, accepted: false }
            }
          }),
        }
      })
    )
  }

  // ─── Build client context for API ───────────────────────────────────
  function buildClientContext() {
    const ctx: Record<string, string> = {}
    if (clientName) ctx.name = clientName
    if (clientSiren) ctx.siren = clientSiren
    if (clientSiret) ctx.siret = clientSiret
    if (clientVatNumber) ctx.vatNumber = clientVatNumber
    if (clientAddress) ctx.address = clientAddress
    if (clientEmail) ctx.email = clientEmail
    return Object.keys(ctx).length > 0 ? ctx : undefined
  }

  // ─── Send message ───────────────────────────────────────────────────
  async function handleSend(retryMessage?: string) {
    const message = retryMessage || input.trim()
    if (!message || loading) return

    if (!retryMessage) {
      setInput('')
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    }

    lastUserMessageRef.current = message
    onErrorChange?.(null)

    if (!retryMessage) {
      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'user',
        content: message,
        mode: chatMode,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
    }
    setLoading(true)

    const snapshotBefore = getCurrentSnapshot()

    if (chatMode !== 'question') {
      onProcessingChange?.(true)
    }

    saveChatPreferences({ provider: 'groq', model: chatModel, mode: chatMode })

    const { data, error } = await api.post<{
      message: string
      document?: {
        subject: string
        lines: DocumentLine[]
        notes?: string
        acceptanceConditions?: string
      }
      modifications?: Array<{ content: string }>
    }>('/ai/chat-document', {
      message,
      currentDocument: { subject, lines, notes, acceptanceConditions },
      clientContext: buildClientContext(),
      type: documentType,
      detailLevel,
      provider: 'groq',
      model: chatModel,
      mode: chatMode,
      source: 'faktur',
    })

    setLoading(false)
    onProcessingChange?.(false)

    if (error || !data) {
      const errObj = error as any
      const errMsg = errObj?.message || 'Désolé, une erreur est survenue.'
      const errDetail = errObj?.detail ? `\n\n**Détail** :\n\`\`\`\n${errObj.detail}\n\`\`\`` : ''
      onErrorChange?.(errMsg + (errObj?.detail ? '\n\n' + errObj.detail : ''))
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: 'assistant', content: `**Erreur** : ${errMsg}${errDetail}`, mode: chatMode, timestamp: Date.now(), isError: true },
      ])
      return
    }
    onErrorChange?.(null)

    if (chatMode === 'edition') {
      if (data.document) {
        setDocumentHistory((prev) => [...prev, snapshotBefore])
        onDocumentUpdate({
          subject: data.document.subject,
          lines: data.document.lines,
          notes: data.document.notes || '',
          acceptanceConditions: data.document.acceptanceConditions || '',
        })
      }
      setMessages((prev) => [...prev, {
        id: nextMsgId(),
        role: 'assistant',
        content: data.message || '**Document mis à jour !**',
        mode: chatMode,
        timestamp: Date.now(),
        modifications: data.document ? [{ id: `mod_${Date.now()}`, content: 'Les modifications ont été appliquées au document.', documentSnapshot: snapshotBefore }] : undefined,
      }])
    } else if (chatMode === 'question') {
      setMessages((prev) => [...prev, {
        id: nextMsgId(),
        role: 'assistant',
        content: data.message || 'Je n\'ai pas pu générer de réponse.',
        mode: chatMode,
        timestamp: Date.now(),
      }])
    } else if (chatMode === 'libre') {
      if (data.document) {
        setDocumentHistory((prev) => [...prev, snapshotBefore])
        onDocumentUpdate({
          subject: data.document.subject,
          lines: data.document.lines,
          notes: data.document.notes || '',
          acceptanceConditions: data.document.acceptanceConditions || '',
        })
      }
      const modifications: ChatModification[] = data.modifications?.map((m, i) => ({
        id: `mod_${Date.now()}_${i}`, content: m.content, documentSnapshot: snapshotBefore,
      })) || (data.document ? [{ id: `mod_${Date.now()}`, content: data.message || 'Modification appliquée.', documentSnapshot: snapshotBefore }] : [])

      setMessages((prev) => [...prev, {
        id: nextMsgId(),
        role: 'assistant',
        content: data.message || 'Voici les modifications proposées :',
        mode: chatMode,
        timestamp: Date.now(),
        modifications: modifications.length > 0 ? modifications : undefined,
      }])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  // ─── Derived ───────────────────────────────────────────────────────
  const currentMode = CHAT_MODES.find((m) => m.id === chatMode)!
  const CurrentModeIcon = MODE_ICONS[chatMode]
  const currentModelName = CHAT_MODELS.groq?.find(m => m.id === chatModel)?.name || 'Raisonnement'
  const thinkingText = THINKING_STEPS[chatMode][thinkingStep] || 'Réflexion...'
  // ─── Settings dropdown rendered via portal ─────────────────────────
  const settingsDropdown = (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[9999] w-[264px] rounded-xl border border-border/80 bg-card shadow-2xl shadow-black/20 overflow-hidden backdrop-blur-xl"
          style={{
            bottom: dropdownPos.bottom,
            left: dropdownPos.left,
          }}
        >
          {/* Menu content */}
          <div className="p-1.5 max-h-[300px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Main menu */}
              {settingsMenu === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  {/* Model */}
                  <button
                    onClick={() => setSettingsMenu('model')}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-all"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                      <GroqIcon className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground">Modèle</div>
                      <div className="text-[9px] text-muted-foreground">Groq &middot; {currentModelName}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </button>

                  {/* Mode */}
                  <button
                    onClick={() => setSettingsMenu('mode')}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-muted/50 transition-all"
                  >
                    <div className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg',
                      chatMode === 'edition' && 'bg-blue-500/10',
                      chatMode === 'question' && 'bg-amber-500/10',
                      chatMode === 'libre' && 'bg-purple-500/10',
                    )}>
                      <CurrentModeIcon className={cn('h-3.5 w-3.5', currentMode.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground">Mode</div>
                      <div className="text-[9px] text-muted-foreground">{currentMode.label}</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </button>
                </motion.div>
              )}

              {/* Model submenu */}
              {settingsMenu === 'model' && (
                <motion.div
                  key="model"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  <button
                    onClick={() => setSettingsMenu('main')}
                    className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Modèle
                  </button>
                  {CHAT_MODELS.groq?.map((m) => {
                    const isActive = chatModel === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setChatModel(m.id)
                          setShowSettings(false)
                          setSettingsMenu('main')
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                          isActive
                            ? 'bg-primary/5 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-foreground">{m.name}</div>
                          <div className="text-[9px] text-muted-foreground">{m.description}</div>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}

              {/* Mode submenu */}
              {settingsMenu === 'mode' && (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  <button
                    onClick={() => setSettingsMenu('main')}
                    className="flex items-center gap-1.5 px-2 py-1 mb-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Mode
                  </button>
                  {CHAT_MODES.map((m) => {
                    const isActive = chatMode === m.id
                    const ModeIcon = MODE_ICONS[m.id]
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setChatMode(m.id)
                          setShowSettings(false)
                          setSettingsMenu('main')
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                          isActive
                            ? 'bg-primary/5 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg',
                          m.id === 'edition' && 'bg-blue-500/10',
                          m.id === 'question' && 'bg-amber-500/10',
                          m.id === 'libre' && 'bg-purple-500/10',
                        )}>
                          <ModeIcon className={cn('h-3.5 w-3.5', m.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-foreground">{m.label}</div>
                          <div className="text-[9px] text-muted-foreground">{m.description}</div>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px] rounded-[2rem] border border-border/40 bg-card/40 backdrop-blur-2xl liquid-glass shadow-overlay relative overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-card/20 backdrop-blur-md relative z-10">
        <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground shrink-0">Faktur AI</span>

        <div className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ml-auto',
          chatMode === 'edition' && 'bg-blue-500/10 text-blue-400',
          chatMode === 'question' && 'bg-amber-500/10 text-amber-400',
          chatMode === 'libre' && 'bg-purple-500/10 text-purple-400',
        )}>
          <CurrentModeIcon className="h-2.5 w-2.5" />
          {currentMode.label}
        </div>
      </div>

      {/* ─── Messages ───────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
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
              <div className={cn(
                'max-w-[85%] rounded-xl px-3 py-2',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-foreground'
              )}>
                {msg.role === 'user' ? (
                  <div className="text-xs leading-relaxed">{msg.content}</div>
                ) : (
                  <>
                    <MarkdownRenderer content={msg.content} />

                    {msg.modifications?.map((mod) => (
                      <ModificationBlock
                        key={mod.id}
                        content={mod.content}
                        accepted={mod.accepted}
                        reverted={mod.reverted}
                        onAccept={() => handleModificationAction(msg.id, mod.id, 'accept')}
                        onRevert={() => handleModificationAction(msg.id, mod.id, 'revert')}
                      />
                    ))}

                    {msg.isError && lastUserMessageRef.current && (
                      <button
                        onClick={() => handleSend(lastUserMessageRef.current)}
                        disabled={loading}
                        className="flex items-center gap-1 mt-2 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        Réessayer
                      </button>
                    )}

                    <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-border/20">
                      {(() => {
                        const MIcon = MODE_ICONS[msg.mode]
                        return <MIcon className={cn('h-2 w-2', CHAT_MODES.find(m => m.id === msg.mode)?.color)} />
                      })()}
                      <span className="text-[8px] text-muted-foreground/60">
                        {CHAT_MODES.find(m => m.id === msg.mode)?.label}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ─── Thinking animation ─────────────────────────────── */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-start"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 mt-0.5">
              <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
            </div>
            <div className="bg-muted/50 rounded-xl px-3 py-2.5 space-y-1.5 min-w-[180px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={thinkingStep}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Spinner className="h-3 w-3 shrink-0" />
                  <ShinyText
                    text={thinkingText}
                    className="text-xs font-medium"
                    color="#a78bfa"
                    shineColor="#e0e7ff"
                    speed={1.5}
                  />
                </motion.div>
              </AnimatePresence>
              {/* Progress dots */}
              <div className="flex items-center gap-1 pl-5">
                {THINKING_STEPS[chatMode].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 w-1 rounded-full transition-all duration-300',
                      i <= thinkingStep ? 'bg-purple-400' : 'bg-muted-foreground/20'
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── Input ──────────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3">
        {/* Quick mode switcher pills */}
        <div className="flex items-center gap-1 mb-2">
          {CHAT_MODES.map((m) => {
            const MIcon = MODE_ICONS[m.id]
            return (
              <button
                key={m.id}
                onClick={() => setChatMode(m.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium transition-all',
                  chatMode === m.id
                    ? cn(
                        'border',
                        m.id === 'edition' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        m.id === 'question' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                        m.id === 'libre' && 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                      )
                    : 'text-muted-foreground/60 hover:text-muted-foreground border border-transparent'
                )}
              >
                <MIcon className="h-2.5 w-2.5" />
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            disabled={loading}
            rows={1}
            className="flex-1 bg-muted/30 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 resize-none min-h-[36px] max-h-[100px]"
          />

          {/* Settings button — left of send */}
          <button
            ref={settingsBtnRef}
            onClick={() => { setShowSettings(!showSettings); setSettingsMenu('main') }}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all',
              showSettings
                ? 'border-primary/40 bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              chatMode === 'edition' && 'bg-blue-500 text-white hover:bg-blue-600',
              chatMode === 'question' && 'bg-amber-500 text-white hover:bg-amber-600',
              chatMode === 'libre' && 'bg-purple-500 text-white hover:bg-purple-600',
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Portal the dropdown above everything */}
      {typeof document !== 'undefined' && createPortal(settingsDropdown, document.body)}
    </div>
  )
}
