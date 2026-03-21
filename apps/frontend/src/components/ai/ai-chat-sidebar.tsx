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
  ChevronDown,
  Settings2,
  Pencil,
  HelpCircle,
  Wand2,
  Check,
  Server,
  Key,
} from 'lucide-react'
import { AnthropicIcon } from '@/components/icons/anthropic-icon'
import { GoogleIcon } from '@/components/icons/google-icon'
import { GroqIcon } from '@/components/icons/groq-icon'
import {
  type ChatMode,
  type ProviderId,
  type AiSourceMode,
  type ChatMessage,
  type ChatModification,
  type DocumentSnapshot,
  type DocumentLine,
  CHAT_MODES,
  CHAT_PROVIDERS,
  CHAT_MODELS,
  loadChatPreferences,
  saveChatPreferences,
} from '@/lib/ai-chat-config'

const PROVIDER_ICONS: Record<ProviderId, typeof AnthropicIcon> = {
  gemini: GoogleIcon,
  groq: GroqIcon,
  claude: AnthropicIcon,
}

const MODE_ICONS = {
  edition: Pencil,
  question: HelpCircle,
  libre: Wand2,
} as const

let messageIdCounter = 0
function nextMsgId() {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

// ─── Props ───────────────────────────────────────────────────────────────

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

  // ─── State ──────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextMsgId(),
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA. Choisissez un **mode** dans les paramètres pour commencer :\n\n- **Édition** : Modifier le contenu du document\n- **Question** : Poser des questions de conformité\n- **Libre** : Instructions libres avec suggestions`,
      mode: 'edition',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatProvider, setChatProvider] = useState<ProviderId>(settings.aiProvider)
  const [chatModel, setChatModel] = useState(settings.aiModel)
  const [chatMode, setChatMode] = useState<ChatMode>('edition')
  const [aiSource, setAiSource] = useState<AiSourceMode>('faktur')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'source' | 'provider' | 'model' | 'mode'>('source')
  const [documentHistory, setDocumentHistory] = useState<DocumentSnapshot[]>([])
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number }>({ bottom: 0, left: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const settingsBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Restore preferences ────────────────────────────────────────────
  useEffect(() => {
    const prefs = loadChatPreferences()
    if (prefs) {
      setChatProvider(prefs.provider)
      setChatModel(prefs.model)
      setChatMode(prefs.mode)
    }
  }, [])

  // ─── Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // ─── Position dropdown above the button, smart overflow ─────────────
  useLayoutEffect(() => {
    if (!showSettings || !settingsBtnRef.current) return
    const rect = settingsBtnRef.current.getBoundingClientRect()
    const dropdownW = 264
    const bottom = window.innerHeight - rect.top + 6

    let left = rect.left + rect.width / 2 - dropdownW / 2
    // Overflow right
    if (left + dropdownW > window.innerWidth - 8) {
      left = window.innerWidth - dropdownW - 8
    }
    // Overflow left
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

  // ─── Send message ───────────────────────────────────────────────────
  async function handleSend() {
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    const userMsg: ChatMessage = {
      id: nextMsgId(),
      role: 'user',
      content: message,
      mode: chatMode,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const snapshotBefore = getCurrentSnapshot()

    if (chatMode !== 'question') {
      onProcessingChange?.(true)
    }

    saveChatPreferences({ provider: chatProvider, model: chatModel, mode: chatMode })

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
      type: documentType,
      provider: chatProvider,
      model: chatModel,
      mode: chatMode,
      source: aiSource,
    })

    setLoading(false)
    onProcessingChange?.(false)

    if (error || !data) {
      setMessages((prev) => [
        ...prev,
        { id: nextMsgId(), role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez.', mode: chatMode, timestamp: Date.now() },
      ])
      return
    }

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
  const currentProvider = CHAT_PROVIDERS.find((p) => p.id === chatProvider)!
  const currentModelName = CHAT_MODELS[chatProvider]?.find((m) => m.id === chatModel)?.name || 'Modèle'
  const CurrentModeIcon = MODE_ICONS[chatMode]
  const ProviderIcon = PROVIDER_ICONS[chatProvider]

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
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['source', 'provider', 'model', 'mode'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                className={cn(
                  'flex-1 px-1.5 py-2 text-[9px] font-medium transition-colors relative',
                  settingsTab === tab
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'source' ? 'Source' : tab === 'provider' ? 'Provider' : tab === 'model' ? 'Modèle' : 'Mode'}
                {settingsTab === tab && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-1.5 max-h-[300px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Source tab */}
              {settingsTab === 'source' && (
                <motion.div
                  key="source"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  <button
                    onClick={() => { setAiSource('faktur'); setSettingsTab('provider') }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                      aiSource === 'faktur'
                        ? 'bg-primary/5 border border-primary/20'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Server className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground">Faktur AI</div>
                      <div className="text-[9px] text-muted-foreground">Clé serveur intégrée</div>
                    </div>
                    {aiSource === 'faktur' && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                  <button
                    onClick={() => { setAiSource('apikey'); setSettingsTab('provider') }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                      aiSource === 'apikey'
                        ? 'bg-primary/5 border border-primary/20'
                        : 'hover:bg-muted/50 border border-transparent'
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                      <Key className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground">Api Key</div>
                      <div className="text-[9px] text-muted-foreground">Votre propre clé API</div>
                    </div>
                    {aiSource === 'apikey' && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                </motion.div>
              )}

              {/* Provider tab */}
              {settingsTab === 'provider' && (
                <motion.div
                  key="provider"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  {CHAT_PROVIDERS.map((p) => {
                    const Icon = PROVIDER_ICONS[p.id]
                    const isActive = chatProvider === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setChatProvider(p.id)
                          const firstModel = CHAT_MODELS[p.id]?.[0]
                          if (firstModel) setChatModel(firstModel.id)
                          setSettingsTab('model')
                        }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                          isActive
                            ? 'bg-primary/5 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', p.iconBg)}>
                          <Icon className={cn('h-3.5 w-3.5', p.iconClass)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-foreground">{p.name}</div>
                          <div className="text-[9px] text-muted-foreground">
                            {CHAT_MODELS[p.id]?.length} modèles
                          </div>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}

              {/* Model tab */}
              {settingsTab === 'model' && (
                <motion.div
                  key="model"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  <div className="px-2 py-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <ProviderIcon className={cn('h-2.5 w-2.5', currentProvider.iconClass)} />
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {currentProvider.name}
                      </span>
                    </div>
                  </div>
                  {CHAT_MODELS[chatProvider]?.map((m) => {
                    const isActive = chatModel === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setChatModel(m.id)
                          setShowSettings(false)
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
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}

              {/* Mode tab */}
              {settingsTab === 'mode' && (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  {CHAT_MODES.map((m) => {
                    const isActive = chatMode === m.id
                    const ModeIcon = MODE_ICONS[m.id]
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setChatMode(m.id)
                          setShowSettings(false)
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px] rounded-2xl border border-border bg-card/50">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
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
                text={chatMode === 'question' ? 'Analyse...' : chatMode === 'libre' ? 'Création...' : 'Modification...'}
                className="text-xs font-medium"
                color="#a78bfa"
                shineColor="#e0e7ff"
                speed={1.5}
              />
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
            onClick={() => setShowSettings(!showSettings)}
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
            onClick={handleSend}
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
