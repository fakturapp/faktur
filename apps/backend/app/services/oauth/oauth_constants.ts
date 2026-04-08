
export const OAUTH_CODE_TTL_MINUTES = 10
export const OAUTH_ACCESS_TOKEN_TTL_HOURS = 1
export const OAUTH_REFRESH_TOKEN_TTL_DAYS = 60

export const OAUTH_SCOPES = {
  profile: {
    id: 'profile',
    label: 'Lire votre profil',
    description: 'Accéder à votre nom, email et photo de profil.',
    dangerous: false,
  },
  'invoices:read': {
    id: 'invoices:read',
    label: 'Lire vos factures',
    description: 'Consulter vos factures, devis et avoirs.',
    dangerous: false,
  },
  'invoices:write': {
    id: 'invoices:write',
    label: 'Créer et modifier vos factures',
    description: 'Créer, éditer et supprimer vos documents.',
    dangerous: true,
  },
  'clients:read': {
    id: 'clients:read',
    label: 'Lire votre carnet clients',
    description: 'Accéder à la liste de vos clients et leurs coordonnées.',
    dangerous: false,
  },
  'clients:write': {
    id: 'clients:write',
    label: 'Gérer vos clients',
    description: 'Ajouter, modifier et supprimer des clients.',
    dangerous: true,
  },
  'vault:unlock': {
    id: 'vault:unlock',
    label: 'Débloquer le coffre-fort',
    description: 'Déverrouiller votre coffre-fort pour accéder aux données chiffrées.',
    dangerous: true,
  },
  offline_access: {
    id: 'offline_access',
    label: 'Accès hors-ligne',
    description: 'Rester connecté via un refresh token.',
    dangerous: false,
  },
} as const

export type OauthScopeId = keyof typeof OAUTH_SCOPES

export const OAUTH_SCOPE_IDS = Object.keys(OAUTH_SCOPES) as OauthScopeId[]

export const OAUTH_WEBHOOK_EVENTS = [
  'session.revoked',
  'token.issued',
  'token.refreshed',
  'vault.unlocked',
  'vault.locked',
  'authorization.granted',
  'authorization.revoked',
] as const

export type OauthWebhookEvent = (typeof OAUTH_WEBHOOK_EVENTS)[number]

export const OAUTH_ERRORS = {
  invalid_request: 'invalid_request',
  invalid_client: 'invalid_client',
  invalid_grant: 'invalid_grant',
  unauthorized_client: 'unauthorized_client',
  unsupported_grant_type: 'unsupported_grant_type',
  invalid_scope: 'invalid_scope',
  access_denied: 'access_denied',
  server_error: 'server_error',
  temporarily_unavailable: 'temporarily_unavailable',
} as const
