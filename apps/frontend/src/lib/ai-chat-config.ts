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
    placeholder: 'Que veut-tu modifier',
  },
  {
    id: 'question',
    label: 'Question',
    description: 'Poser une question',
    icon: '❓',
    color: 'text-amber-400',
    placeholder: 'Poser une question',
  },
  {
    id: 'libre',
    label: 'Libre',
    description: 'Instructions libres avec suggestions',
    icon: '🔮',
    color: 'text-purple-400',
    placeholder: 'Donner une instruction',
  },
]


export type ProviderId = 'gemini'

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
  { id: 'gemini', name: 'Faktur AI', iconClass: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
]

export const CHAT_MODELS: Record<ProviderId, ModelConfig[]> = {
  gemini: [
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Rapide', tier: 'rapide', description: 'Reponses instantanees' },
    { id: 'google/gemma-4-31b-it:free', name: 'Raisonnement', tier: 'raisonnement', description: 'Bon equilibre qualite/vitesse' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Pro', tier: 'pro', description: 'Meilleur modele disponible' },
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
