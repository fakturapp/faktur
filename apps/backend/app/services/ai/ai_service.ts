import env from '#start/env'
import InvoiceSetting from '#models/team/invoice_setting'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

export default class AiService {
  /**
   * Check if AI is enabled for the team.
   */
  static async isEnabled(teamId: string): Promise<boolean> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    return settings?.aiEnabled ?? false
  }

  /**
   * Get the Groq API key from env.
   */
  private static getApiKey(): string | null {
    return env.get('GROQ_API_KEY', '') || null
  }

  /**
   * Resolve the model from team settings (or use override).
   */
  private static async getModel(teamId: string, overrideModel?: string): Promise<string> {
    if (overrideModel) return overrideModel
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    return settings?.aiModel || DEFAULT_MODEL
  }

  /**
   * Simple single-prompt generation via Groq.
   */
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
      throw new Error('GROQ_API_KEY is not configured on the server.')
    }

    return AiService.callGroq(apiKey, model, systemPrompt, userPrompt, maxTokens)
  }

  /**
   * Chat with messages array via Groq.
   */
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
      throw new Error('GROQ_API_KEY is not configured on the server.')
    }

    return AiService.chatGroq(apiKey, model, systemPrompt, messages, maxTokens)
  }

  // ─── Groq (OpenAI-compatible) ──────────────────────────────

  private static async callGroq(
    apiKey: string,
    model: string,
    system: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<string> {
    return AiService.chatGroq(
      apiKey,
      model,
      system,
      [{ role: 'user', content: userPrompt }],
      maxTokens
    )
  }

  private static async chatGroq(
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

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Groq API error ${res.status}: ${errorText}`)
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content || ''
  }
}
