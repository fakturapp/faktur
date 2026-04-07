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
  // The raw secrets exist only in this object returned to the caller;
  // they are immediately dropped from memory by the controller after
  // being flushed once to the admin's screen.
  clientSecret: string
  webhookSecret: string | null
}

class OauthAppService {
  /**
   * Creates an OAuth app with freshly-generated client_id, client_secret
   * and (optionally) webhook signing secret. The raw secrets are
   * returned exactly once — only their hashes/ciphertexts are kept.
   */
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

  /**
   * Rotates the client_secret for an app. Returns the new raw secret
   * which the admin must copy immediately — only the hash is persisted.
   */
  async rotateClientSecret(app: OauthApp): Promise<string> {
    const newSecret = oauthCrypto.generateClientSecret()
    app.clientSecretHash = oauthCrypto.hash(newSecret)
    await app.save()
    return newSecret
  }

  /**
   * Rotates the webhook signing secret. Returns the new raw value.
   * Throws if the app doesn't have a webhook configured.
   */
  async rotateWebhookSecret(app: OauthApp): Promise<string> {
    if (!app.webhookUrl) {
      throw new Error('App has no webhook configured')
    }
    const newSecret = oauthCrypto.generateClientSecret()
    app.encryptedWebhookSecret = encryptionService.encrypt(newSecret)
    await app.save()
    return newSecret
  }

  /**
   * Decrypts the stored webhook secret for dispatching. Used only
   * server-side right before signing an outbound payload.
   */
  getWebhookSecret(app: OauthApp): string | null {
    if (!app.encryptedWebhookSecret) return null
    try {
      return encryptionService.decrypt(app.encryptedWebhookSecret)
    } catch {
      return null
    }
  }

  /**
   * Verifies a presented client_secret against the stored hash in constant
   * time. Returns the app iff the credentials are valid and the app is
   * still active.
   */
  async authenticateClient(clientId: string, clientSecret: string): Promise<OauthApp | null> {
    const app = await OauthApp.query()
      .where('client_id', clientId)
      .where('is_active', true)
      .first()
    if (!app) return null

    const presentedHash = oauthCrypto.hash(clientSecret)
    if (!oauthCrypto.timingSafeEqual(presentedHash, app.clientSecretHash)) {
      return null
    }
    return app
  }

  /**
   * Soft-delete: marks the app as inactive and returns it. Existing
   * tokens are NOT auto-revoked here so the admin can choose to revoke
   * them separately via the UI (and emit the proper webhook).
   */
  async deactivate(app: OauthApp): Promise<OauthApp> {
    app.isActive = false
    app.updatedAt = DateTime.now()
    await app.save()
    return app
  }
}

export default new OauthAppService()
