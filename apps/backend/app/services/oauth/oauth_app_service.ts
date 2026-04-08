import OauthApp from '#models/oauth/oauth_app'
import oauthCrypto from '#services/oauth/oauth_crypto_service'
import encryptionService from '#services/encryption/encryption_service'
import { DateTime } from 'luxon'

export interface CreateOauthAppInput {
  name: string
  description?: string | null
  iconUrl?: string | null
  websiteUrl?: string | null
  redirectUris: string[]
  scopes: string[]
  webhookUrl?: string | null
  webhookEvents?: string[] | null
  kind?: 'desktop' | 'web' | 'cli'
  createdByUserId: string
  isFirstParty?: boolean
}

export interface CreatedOauthApp {
  app: OauthApp
  clientSecret: string
  webhookSecret: string | null
}

const PUBLIC_CLIENT_KINDS = new Set(['desktop', 'cli'])

class OauthAppService {
  async create(input: CreateOauthAppInput): Promise<CreatedOauthApp> {
    const clientId = oauthCrypto.generateToken(16)
    const clientSecret = oauthCrypto.generateClientSecret()
    const clientSecretHash = oauthCrypto.hash(clientSecret)

    let webhookSecret: string | null = null
    let encryptedWebhookSecret: string | null = null
    if (input.webhookUrl) {
      webhookSecret = oauthCrypto.generateClientSecret()
      encryptedWebhookSecret = encryptionService.encrypt(webhookSecret)
    }

    const app = await OauthApp.create({
      name: input.name,
      description: input.description ?? null,
      iconUrl: input.iconUrl ?? null,
      websiteUrl: input.websiteUrl ?? null,
      clientId,
      clientSecretHash,
      redirectUris: input.redirectUris,
      scopes: input.scopes,
      webhookUrl: input.webhookUrl ?? null,
      encryptedWebhookSecret,
      webhookEvents: input.webhookEvents ?? null,
      kind: input.kind ?? 'desktop',
      createdByUserId: input.createdByUserId,
      isActive: true,
      isFirstParty: input.isFirstParty ?? false,
    })

    return { app, clientSecret, webhookSecret }
  }

  async rotateClientSecret(app: OauthApp): Promise<string> {
    const newSecret = oauthCrypto.generateClientSecret()
    app.clientSecretHash = oauthCrypto.hash(newSecret)
    await app.save()
    return newSecret
  }

  async rotateWebhookSecret(app: OauthApp): Promise<string> {
    if (!app.webhookUrl) {
      throw new Error('App has no webhook configured')
    }
    const newSecret = oauthCrypto.generateClientSecret()
    app.encryptedWebhookSecret = encryptionService.encrypt(newSecret)
    await app.save()
    return newSecret
  }

  getWebhookSecret(app: OauthApp): string | null {
    if (!app.encryptedWebhookSecret) return null
    try {
      return encryptionService.decrypt(app.encryptedWebhookSecret)
    } catch {
      return null
    }
  }

  isPublicClient(app: OauthApp): boolean {
    return PUBLIC_CLIENT_KINDS.has(app.kind)
  }

  async authenticateClient(
    clientId: string,
    clientSecret: string | null | undefined
  ): Promise<OauthApp | null> {
    const app = await OauthApp.query()
      .where('client_id', clientId)
      .where('is_active', true)
      .first()
    if (!app) return null

    if (this.isPublicClient(app)) {
      return app
    }

    if (!clientSecret) return null
    const presentedHash = oauthCrypto.hash(clientSecret)
    if (!oauthCrypto.timingSafeEqual(presentedHash, app.clientSecretHash)) {
      return null
    }
    return app
  }

  async deactivate(app: OauthApp): Promise<OauthApp> {
    app.isActive = false
    app.updatedAt = DateTime.now()
    await app.save()
    return app
  }
}

export default new OauthAppService()
