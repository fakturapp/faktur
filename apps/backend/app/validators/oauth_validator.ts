import vine from '@vinejs/vine'

/**
 * /oauth/authorize — query string presented by the OAuth app when it
 * opens the consent screen in the user's browser.
 */
export const authorizeRequestValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().maxLength(128),
    redirect_uri: vine.string().trim().maxLength(500),
    response_type: vine.string().trim().maxLength(20),
    scope: vine.string().trim().maxLength(500).optional(),
    state: vine.string().trim().maxLength(256).optional(),
    code_challenge: vine.string().trim().maxLength(128).optional(),
    code_challenge_method: vine.string().trim().maxLength(10).optional(),
  })
)

/**
 * /oauth/authorize/consent — form submission from the consent screen.
 * decision = 'allow' | 'deny'.
 */
export const consentSubmitValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().maxLength(128),
    redirect_uri: vine.string().trim().maxLength(500),
    scope: vine.string().trim().maxLength(500),
    state: vine.string().trim().maxLength(256).optional(),
    code_challenge: vine.string().trim().maxLength(128).optional(),
    code_challenge_method: vine.string().trim().maxLength(10).optional(),
    decision: vine.string().trim().maxLength(10),
  })
)

/**
 * /oauth/token — RFC 6749 token endpoint body.
 * Supports authorization_code and refresh_token grants.
 */
export const tokenRequestValidator = vine.compile(
  vine.object({
    grant_type: vine.string().trim().maxLength(30),
    client_id: vine.string().trim().maxLength(128),
    client_secret: vine.string().trim().maxLength(200),
    code: vine.string().trim().maxLength(200).optional(),
    redirect_uri: vine.string().trim().maxLength(500).optional(),
    code_verifier: vine.string().trim().maxLength(200).optional(),
    refresh_token: vine.string().trim().maxLength(200).optional(),
    device_name: vine.string().trim().maxLength(255).optional(),
    device_platform: vine.string().trim().maxLength(50).optional(),
    device_os: vine.string().trim().maxLength(100).optional(),
  })
)

/**
 * /oauth/revoke — client revokes a token it no longer needs (logout).
 */
export const revokeRequestValidator = vine.compile(
  vine.object({
    client_id: vine.string().trim().maxLength(128),
    client_secret: vine.string().trim().maxLength(200),
    token: vine.string().trim().maxLength(200),
    token_type_hint: vine.string().trim().maxLength(20).optional(),
  })
)

/**
 * Admin — create/update an OAuth app.
 */
export const createOauthAppValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(2000).optional().nullable(),
    iconUrl: vine.string().trim().maxLength(500).optional().nullable(),
    websiteUrl: vine.string().trim().maxLength(500).optional().nullable(),
    redirectUris: vine.array(vine.string().trim().maxLength(500)).minLength(1),
    scopes: vine.array(vine.string().trim().maxLength(50)).minLength(1),
    webhookUrl: vine.string().trim().maxLength(500).optional().nullable(),
    webhookEvents: vine.array(vine.string().trim().maxLength(50)).optional().nullable(),
    kind: vine.string().trim().maxLength(20).optional(),
    isFirstParty: vine.boolean().optional(),
  })
)

export const updateOauthAppValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().maxLength(2000).optional().nullable(),
    iconUrl: vine.string().trim().maxLength(500).optional().nullable(),
    websiteUrl: vine.string().trim().maxLength(500).optional().nullable(),
    redirectUris: vine.array(vine.string().trim().maxLength(500)).minLength(1).optional(),
    scopes: vine.array(vine.string().trim().maxLength(50)).minLength(1).optional(),
    webhookUrl: vine.string().trim().maxLength(500).optional().nullable(),
    webhookEvents: vine.array(vine.string().trim().maxLength(50)).optional().nullable(),
    isActive: vine.boolean().optional(),
  })
)
