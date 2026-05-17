export const OAUTH_CODE_TTL_MINUTES = 10
export const OAUTH_ACCESS_TOKEN_TTL_HOURS = 1
export const OAUTH_REFRESH_TOKEN_TTL_DAYS = 60

export const OAUTH_SCOPES = {
  'profile': {
    id: 'profile',
    label: 'Lire votre profil',
    description: 'Accéder à votre nom, email et photo de profil.',
    dangerous: false,
  },
  'offline_access': {
    id: 'offline_access',
    label: 'Accès hors-ligne',
    description: 'Rester connecté via un refresh token.',
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
  'invoices:send': {
    id: 'invoices:send',
    label: 'Envoyer vos factures',
    description: 'Envoyer des factures par email à vos clients.',
    dangerous: true,
  },

  'quotes:read': {
    id: 'quotes:read',
    label: 'Lire vos devis',
    description: 'Consulter vos devis et leur statut.',
    dangerous: false,
  },
  'quotes:write': {
    id: 'quotes:write',
    label: 'Créer et modifier vos devis',
    description: 'Créer, éditer et supprimer vos devis.',
    dangerous: true,
  },
  'quotes:send': {
    id: 'quotes:send',
    label: 'Envoyer vos devis',
    description: 'Envoyer des devis par email.',
    dangerous: true,
  },

  'credit_notes:read': {
    id: 'credit_notes:read',
    label: 'Lire vos avoirs',
    description: 'Consulter vos avoirs.',
    dangerous: false,
  },
  'credit_notes:write': {
    id: 'credit_notes:write',
    label: 'Créer et modifier vos avoirs',
    description: 'Émettre, éditer et supprimer des avoirs.',
    dangerous: true,
  },

  'recurring_invoices:read': {
    id: 'recurring_invoices:read',
    label: 'Lire vos factures récurrentes',
    description: 'Consulter vos factures récurrentes et leur planning.',
    dangerous: false,
  },
  'recurring_invoices:write': {
    id: 'recurring_invoices:write',
    label: 'Gérer vos factures récurrentes',
    description: 'Créer, éditer, suspendre et supprimer vos factures récurrentes.',
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

  'products:read': {
    id: 'products:read',
    label: 'Lire votre catalogue produits',
    description: 'Consulter vos produits et services.',
    dangerous: false,
  },
  'products:write': {
    id: 'products:write',
    label: 'Gérer votre catalogue',
    description: 'Ajouter, modifier et supprimer des produits.',
    dangerous: true,
  },

  'expenses:read': {
    id: 'expenses:read',
    label: 'Lire vos dépenses',
    description: 'Consulter vos dépenses et leurs justificatifs.',
    dangerous: false,
  },
  'expenses:write': {
    id: 'expenses:write',
    label: 'Gérer vos dépenses',
    description: 'Enregistrer, éditer et supprimer des dépenses.',
    dangerous: true,
  },

  'payment_links:read': {
    id: 'payment_links:read',
    label: 'Lire vos liens de paiement',
    description: 'Voir les liens de paiement émis sur vos factures.',
    dangerous: false,
  },
  'payment_links:write': {
    id: 'payment_links:write',
    label: 'Gérer vos liens de paiement',
    description: 'Créer et supprimer des liens de paiement.',
    dangerous: true,
  },

  'bank_accounts:read': {
    id: 'bank_accounts:read',
    label: 'Lire vos comptes bancaires',
    description: 'Voir vos IBAN configurés (masqués).',
    dangerous: false,
  },
  'bank_accounts:write': {
    id: 'bank_accounts:write',
    label: 'Gérer vos comptes bancaires',
    description: 'Ajouter, modifier et supprimer des IBAN.',
    dangerous: true,
  },

  'reminders:read': {
    id: 'reminders:read',
    label: 'Lire vos relances',
    description: 'Consulter vos campagnes de relance.',
    dangerous: false,
  },
  'reminders:write': {
    id: 'reminders:write',
    label: 'Gérer vos relances',
    description: 'Programmer et envoyer des relances.',
    dangerous: true,
  },

  'company:read': {
    id: 'company:read',
    label: 'Lire les infos de votre entreprise',
    description: 'Accéder à la raison sociale, SIREN, adresse, TVA, etc.',
    dangerous: false,
  },
  'company:write': {
    id: 'company:write',
    label: 'Modifier les infos de votre entreprise',
    description: 'Éditer la raison sociale, le SIREN, l’adresse, la TVA.',
    dangerous: true,
  },

  'team:read': {
    id: 'team:read',
    label: 'Lire les infos de votre équipe',
    description: 'Voir le nom de l’équipe et la liste des membres.',
    dangerous: false,
  },

  'einvoicing:read': {
    id: 'einvoicing:read',
    label: 'Lire vos factures électroniques',
    description: 'Consulter le statut de soumission aux PDPs.',
    dangerous: false,
  },
  'einvoicing:submit': {
    id: 'einvoicing:submit',
    label: 'Soumettre des factures électroniques',
    description: 'Envoyer vos factures à un PDP (Chorus Pro, etc.).',
    dangerous: true,
  },

  'webhooks:manage': {
    id: 'webhooks:manage',
    label: 'Gérer les webhooks',
    description: 'Configurer les endpoints webhook et leurs secrets.',
    dangerous: true,
  },

  'api_keys:manage': {
    id: 'api_keys:manage',
    label: 'Gérer les clés API',
    description: 'Créer, révoquer et rotater les clés API de votre équipe.',
    dangerous: true,
  },

  'files:read': {
    id: 'files:read',
    label: 'Lire vos fichiers',
    description: 'Télécharger les PDFs et pièces jointes.',
    dangerous: false,
  },

  'email:send': {
    id: 'email:send',
    label: 'Envoyer des emails depuis votre compte',
    description: 'Envoyer factures, devis et relances par email.',
    dangerous: true,
  },

  'ai:use': {
    id: 'ai:use',
    label: 'Utiliser l’assistant IA',
    description: 'Générer et analyser des documents via l’IA.',
    dangerous: false,
  },

  'vault:unlock': {
    id: 'vault:unlock',
    label: 'Débloquer le coffre-fort',
    description: 'Déverrouiller votre coffre-fort pour accéder aux données chiffrées.',
    dangerous: true,
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
