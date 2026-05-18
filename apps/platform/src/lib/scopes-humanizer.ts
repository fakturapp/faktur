const RESOURCE_LABELS: Record<string, string> = {
  invoices: 'Factures',
  quotes: 'Devis',
  clients: 'Clients',
  products: 'Produits',
  expenses: 'Dépenses',
  payments: 'Paiements',
  bank: 'Banque',
  users: 'Utilisateurs',
  teams: 'Équipes',
  team_members: 'Membres d’équipe',
  webhooks: 'Webhooks',
  api_keys: 'Clés API',
  api_projects: 'Projets API',
  companies: 'Société',
  company: 'Société',
  documents: 'Documents',
  files: 'Fichiers',
  notifications: 'Notifications',
  audit_logs: 'Journal d’audit',
  reports: 'Rapports',
  recurring_invoices: 'Factures récurrentes',
  credit_notes: 'Avoirs',
  taxes: 'Taxes',
  subscriptions: 'Abonnements',
  oauth_apps: 'Apps OAuth',
  einvoicing: 'Facturation électronique',
  ai: 'IA',
}

const ACTION_LABELS: Record<string, string> = {
  read: 'Lecture',
  list: 'Lister',
  write: 'Écriture',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  manage: 'Gestion',
  admin: 'Administration',
  send: 'Envoi',
  export: 'Export',
  import: 'Import',
}

export function humanizeResource(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource.replace(/_/g, ' ')
}

export function humanizeAction(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function humanizeScope(scope: string): { label: string; resource: string; action: string } {
  const [resourceRaw, actionRaw] = scope.split(':')
  const resource = humanizeResource(resourceRaw ?? scope)
  const action = humanizeAction(actionRaw ?? '')
  return {
    label: actionRaw ? `${resource} — ${action}` : resource,
    resource,
    action,
  }
}
