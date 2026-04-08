import type { ComponentType } from 'react'


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


export type ProviderId = 'groq'

export interface ProviderConfig {
  id: ProviderId
  name: string
  iconClass: string
  iconBg: string
}

export interface ModelConfig {
  id: string
  name: string
  tier: 'rapide' | 'raisonnement' | 'pro'
  description: string
}

export const CHAT_PROVIDERS: ProviderConfig[] = [
  { id: 'groq', name: 'Groq', iconClass: 'text-orange-500', iconBg: 'bg-orange-500/10' },
]

export const CHAT_MODELS: Record<ProviderId, ModelConfig[]> = {
  groq: [
    { id: 'llama-3.1-8b-instant', name: 'Rapide', tier: 'rapide', description: 'Réponses instantanées' },
    { id: 'llama-3.3-70b-versatile', name: 'Raisonnement', tier: 'raisonnement', description: 'Bon équilibre qualité/vitesse' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'Pro', tier: 'pro', description: 'Meilleur modèle disponible' },
  ],
}


export type AiSourceMode = 'faktur' | 'apikey'

export interface AiSourceConfig {
  id: AiSourceMode
  label: string
  description: string
}


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
  isError?: boolean
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
