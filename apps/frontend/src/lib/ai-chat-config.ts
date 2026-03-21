import type { ComponentType } from 'react'

// ─── Chat Modes ─────────────────────────────────────────────────────────

export type ChatMode = 'edition' | 'question' | 'libre'

export interface ChatModeConfig {
  id: ChatMode
  label: string
  description: string
  icon: string
  color: string
  placeholder: string
}

export const CHAT_MODES: ChatModeConfig[] = [
  {
    id: 'edition',
    label: 'Édition',
    description: 'Modifier le contenu du document',
    icon: '✏️',
    color: 'text-blue-400',
    placeholder: 'Décrivez ce que vous voulez modifier...',
  },
  {
    id: 'question',
    label: 'Question',
    description: 'Poser des questions sur la conformité',
    icon: '❓',
    color: 'text-amber-400',
    placeholder: 'Posez votre question sur les règles...',
  },
  {
    id: 'libre',
    label: 'Libre',
    description: 'Instructions libres avec suggestions',
    icon: '🔮',
    color: 'text-purple-400',
    placeholder: 'Donnez une instruction libre...',
  },
]

// ─── Providers & Models ──────────────────────────────────────────────────

export type ProviderId = 'gemini' | 'groq' | 'claude'

export interface ProviderConfig {
  id: ProviderId
  name: string
  iconClass: string
  iconBg: string
}

export interface ModelConfig {
  id: string
  name: string
  badge?: 'Rapide' | 'Intelligent' | 'Équilibré'
  badgeColor?: string
}

export const CHAT_PROVIDERS: ProviderConfig[] = [
  { id: 'gemini', name: 'Gemini', iconClass: '', iconBg: 'bg-blue-500/10' },
  { id: 'groq', name: 'Groq', iconClass: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  { id: 'claude', name: 'Claude', iconClass: 'text-violet-500', iconBg: 'bg-violet-500/10' },
]

export const CHAT_MODELS: Record<ProviderId, ModelConfig[]> = {
  gemini: [
    { id: 'gemini-2.5-flash-lite', name: 'Flash Lite', badge: 'Rapide', badgeColor: 'bg-emerald-500/10 text-emerald-400' },
    { id: 'gemini-2.5-flash', name: 'Flash', badge: 'Équilibré', badgeColor: 'bg-blue-500/10 text-blue-400' },
    { id: 'gemini-2.5-pro', name: 'Pro', badge: 'Intelligent', badgeColor: 'bg-purple-500/10 text-purple-400' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', badge: 'Intelligent', badgeColor: 'bg-purple-500/10 text-purple-400' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', badge: 'Rapide', badgeColor: 'bg-emerald-500/10 text-emerald-400' },
  ],
  claude: [
    { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet', badge: 'Équilibré', badgeColor: 'bg-blue-500/10 text-blue-400' },
    { id: 'claude-opus-4-6', name: 'Opus', badge: 'Intelligent', badgeColor: 'bg-purple-500/10 text-purple-400' },
  ],
}

// ─── Chat Messages ───────────────────────────────────────────────────────

export interface ChatModification {
  id: string
  content: string
  accepted?: boolean
  reverted?: boolean
  documentSnapshot?: DocumentSnapshot
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: ChatMode
  timestamp: number
  modifications?: ChatModification[]
}

export interface DocumentLine {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
}

export interface DocumentSnapshot {
  subject: string
  lines: DocumentLine[]
  notes: string
  acceptanceConditions: string
}

// ─── Storage Key ─────────────────────────────────────────────────────────

export const AI_CHAT_PREF_KEY = 'faktur_ai_chat_pref'

export interface ChatPreferences {
  provider: ProviderId
  model: string
  mode: ChatMode
}

export function loadChatPreferences(): ChatPreferences | null {
  try {
    const raw = localStorage.getItem(AI_CHAT_PREF_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function saveChatPreferences(prefs: ChatPreferences) {
  try {
    localStorage.setItem(AI_CHAT_PREF_KEY, JSON.stringify(prefs))
  } catch {}
}
