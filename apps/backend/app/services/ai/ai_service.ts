import env from '#start/env'
import InvoiceSetting from '#models/team/invoice_setting'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'

type AiProvider = 'claude' | 'gemini' | 'groq'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Default models per provider
const DEFAULT_MODELS: Record<AiProvider, string> = {
  claude: 'claude-sonnet-4-5-20250929',
  gemini: 'gemini-2.5-flash-lite',
  groq: 'llama-3.3-70b-versatile',
}

// Default env key names
const ENV_KEYS: Record<AiProvider, string> = {
  claude: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
}

export default class AiService {
  /**
   * Check if AI is enabled for the team.
   */
  async isEnabled(teamId: string): Promise<boolean> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    return settings?.aiEnabled ?? false
  }

  /**
   * Resolve the provider for the team.
   */
  private async getProvider(teamId: string): Promise<AiProvider> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    return (settings?.aiProvider as AiProvider) || 'gemini'
  }

  /**
   * Resolve the API key: custom team key (decrypted) or default env key.
   */
  private async getApiKey(teamId: string, dek: Buffer): Promise<string | null> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    const provider = (settings?.aiProvider as AiProvider) || 'gemini'

    if (settings?.aiCustomApiKey) {
      try {
        return zeroAccessCryptoService.decryptField(settings.aiCustomApiKey, dek)
      } catch {
        // Decryption failed, fall through to default key
      }
    }

    return env.get(ENV_KEYS[provider] as any, '')
  }

  /**
   * Resolve the model from team settings.
   */
  private async getModel(teamId: string): Promise<string> {
    const settings = await InvoiceSetting.findBy('teamId', teamId)
    const provider = (settings?.aiProvider as AiProvider) || 'gemini'
    return settings?.aiModel || DEFAULT_MODELS[provider]
  }

  /**
   * Simple single-prompt generation (delegates to the right provider).
   */
  async generate(
    teamId: string,
    dek: Buffer,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 1024
  ): Promise<string> {
    const provider = await this.getProvider(teamId)
    const apiKey = await this.getApiKey(teamId, dek)
    const model = await this.getModel(teamId)

    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}. Set ${ENV_KEYS[provider]} or add a custom key in settings.`)
    }

    switch (provider) {
      case 'claude':
        return this.callClaude(apiKey, model, systemPrompt, userPrompt, maxTokens)
      case 'gemini':
        return this.callGemini(apiKey, model, systemPrompt, userPrompt, maxTokens)
      case 'groq':
        return this.callGroq(apiKey, model, systemPrompt, userPrompt, maxTokens)
      default:
        throw new Error(`Unknown AI provider: ${provider}`)
    }
  }

  /**
   * Chat with messages array (delegates to the right provider).
   */
  async chat(
    teamId: string,
    dek: Buffer,
    systemPrompt: string,
    messages: ChatMessage[],
    maxTokens: number = 1024
  ): Promise<string> {
    const provider = await this.getProvider(teamId)
    const apiKey = await this.getApiKey(teamId, dek)
    const model = await this.getModel(teamId)

    if (!apiKey) {
      throw new Error(`No API key configured for ${provider}.`)
    }

    switch (provider) {
      case 'claude':
        return this.chatClaude(apiKey, model, systemPrompt, messages, maxTokens)
      case 'gemini':
        return this.chatGemini(apiKey, model, systemPrompt, messages, maxTokens)
      case 'groq':
        return this.chatGroq(apiKey, model, systemPrompt, messages, maxTokens)
      default:
        throw new Error(`Unknown AI provider: ${provider}`)
    }
  }

  // ─── Claude (Anthropic) ────────────────────────────────────

  private async callClaude(apiKey: string, model: string, system: string, userPrompt: string, maxTokens: number): Promise<string> {
    return this.chatClaude(apiKey, model, system, [{ role: 'user', content: userPrompt }], maxTokens)
  }

  private async chatClaude(apiKey: string, model: string, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Claude API error ${res.status}: ${errorText}`)
    }

    const data = await res.json() as { content: Array<{ type: string; text: string }> }
    return data.content?.[0]?.text || ''
  }

  // ─── Gemini (Google) ───────────────────────────────────────

  private async callGemini(apiKey: string, model: string, system: string, userPrompt: string, maxTokens: number): Promise<string> {
    return this.chatGemini(apiKey, model, system, [{ role: 'user', content: userPrompt }], maxTokens)
  }

  private async chatGemini(apiKey: string, model: string, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Gemini API error ${res.status}: ${errorText}`)
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  // ─── Groq (OpenAI-compatible) ──────────────────────────────

  private async callGroq(apiKey: string, model: string, system: string, userPrompt: string, maxTokens: number): Promise<string> {
    return this.chatGroq(apiKey, model, system, [{ role: 'user', content: userPrompt }], maxTokens)
  }

  private async chatGroq(apiKey: string, model: string, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
    const openaiMessages = [
      { role: 'system' as const, content: system },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Groq API error ${res.status}: ${errorText}`)
    }

    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content || ''
  }
}
