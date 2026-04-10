import env from '#start/env'
import InvoiceSetting from '#models/team/invoice_setting'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

const VALID_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
]

export default class AiService {
  static async isEnabled(teamId: string): Promise<boolean> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    return settings?.aiEnabled ?? false
  }

  private static getApiKey(): string | null {
    return env.get('OPENROUTER_API_KEY', '') || null
  }

  private static isValidModel(model: string): boolean {
    return VALID_MODELS.includes(model)
  }

  private static async getModel(teamId: string, overrideModel?: string): Promise<string> {
    if (overrideModel && AiService.isValidModel(overrideModel)) return overrideModel
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    const stored = settings?.aiModel
    if (stored && AiService.isValidModel(stored)) return stored
    return DEFAULT_MODEL
  }

  static async generate(
    teamId: string,
    _dek: Buffer,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 1024,
    _overrideProvider?: string,
    overrideModel?: string,
    _sourceOverride?: 'faktur' | 'apikey'
  ): Promise<string> {
    const apiKey = AiService.getApiKey()
    const model = await AiService.getModel(teamId, overrideModel)

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured on the server.')
    }

    return AiService.callOpenRouter(apiKey, model, systemPrompt, userPrompt, maxTokens)
  }

  static async chat(
    teamId: string,
    _dek: Buffer,
    systemPrompt: string,
    messages: ChatMessage[],
    maxTokens: number = 1024,
    _overrideProvider?: string,
    overrideModel?: string,
    _sourceOverride?: 'faktur' | 'apikey'
  ): Promise<string> {
    const apiKey = AiService.getApiKey()
    const model = await AiService.getModel(teamId, overrideModel)

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured on the server.')
    }

    return AiService.chatOpenRouter(apiKey, model, systemPrompt, messages, maxTokens)
  }

  private static async callOpenRouter(
    apiKey: string,
    model: string,
    system: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<string> {
    return AiService.chatOpenRouter(
      apiKey,
      model,
      system,
      [{ role: 'user', content: userPrompt }],
      maxTokens
    )
  }

  private static async chatOpenRouter(
    apiKey: string,
    model: string,
    system: string,
    messages: ChatMessage[],
    maxTokens: number
  ): Promise<string> {
    const openaiMessages = [
      { role: 'system' as const, content: system },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://faktur.app',
        'X-Title': 'Faktur AI',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`OpenRouter API error ${res.status}: ${errorText}`)
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content || ''
  }
}
