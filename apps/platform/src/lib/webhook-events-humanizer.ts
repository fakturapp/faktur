import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  ArrowDownToLine,
  Ban,
  Bell,
  CheckCircle2,
  Edit3,
  FileText,
  Mail,
  PenLine,
  Plus,
  Receipt,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'

type Tone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

const ACTION_LABELS: Record<string, string> = {
  created: 'Création',
  updated: 'Modification',
  deleted: 'Suppression',
  sent: 'Envoi',
  paid: 'Paiement',
  cancelled: 'Annulation',
  canceled: 'Annulation',
  refunded: 'Remboursement',
  finalized: 'Finalisation',
  voided: 'Annulation',
  accepted: 'Acceptation',
  rejected: 'Refus',
  archived: 'Archivage',
  unarchived: 'Désarchivage',
  failed: 'Échec',
  succeeded: 'Succès',
  reminder: 'Relance',
  added: 'Ajout',
  removed: 'Retrait',
  imported: 'Import',
  exported: 'Export',
  expired: 'Expiré',
  duplicated: 'Duplication',
}

const ACTION_ICONS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  created: { icon: Plus, tone: 'accent' },
  added: { icon: UserPlus, tone: 'accent' },
  updated: { icon: PenLine, tone: 'accent' },
  deleted: { icon: Trash2, tone: 'danger' },
  removed: { icon: Trash2, tone: 'danger' },
  sent: { icon: Send, tone: 'accent' },
  paid: { icon: CheckCircle2, tone: 'success' },
  cancelled: { icon: Ban, tone: 'danger' },
  canceled: { icon: Ban, tone: 'danger' },
  refunded: { icon: ArrowDownToLine, tone: 'warning' },
  finalized: { icon: CheckCircle2, tone: 'success' },
  voided: { icon: Ban, tone: 'danger' },
  accepted: { icon: CheckCircle2, tone: 'success' },
  rejected: { icon: XCircle, tone: 'danger' },
  archived: { icon: FileText, tone: 'muted' },
  unarchived: { icon: FileText, tone: 'accent' },
  failed: { icon: AlertTriangle, tone: 'danger' },
  succeeded: { icon: CheckCircle2, tone: 'success' },
  reminder: { icon: Bell, tone: 'warning' },
  imported: { icon: ArrowDownToLine, tone: 'accent' },
  exported: { icon: Receipt, tone: 'accent' },
  expired: { icon: AlertTriangle, tone: 'warning' },
  duplicated: { icon: Edit3, tone: 'accent' },
}

const TONE_CLASSES: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent',
  muted: 'text-muted-foreground',
}

export function humanizeWebhookEvent(event: string): {
  label: string
  icon: LucideIcon
  toneClass: string
} {
  const [, action] = event.split('.')
  const label = ACTION_LABELS[action ?? ''] ?? action ?? event
  const cfg = ACTION_ICONS[action ?? ''] ?? { icon: Mail, tone: 'muted' as Tone }
  return {
    label,
    icon: cfg.icon,
    toneClass: TONE_CLASSES[cfg.tone],
  }
}

export interface WebhookPreset {
  id: string
  label: string
  description: string
  matches: (event: string) => boolean
}

export const WEBHOOK_PRESETS: WebhookPreset[] = [
  {
    id: 'all',
    label: 'Tous les événements',
    description: 'Réception de chaque événement émis par Faktur.',
    matches: () => true,
  },
  {
    id: 'invoices_only',
    label: 'Factures uniquement',
    description: 'Création, modification et paiement des factures.',
    matches: (e) => e.startsWith('invoice.') || e.startsWith('payment.'),
  },
  {
    id: 'quotes_only',
    label: 'Devis uniquement',
    description: 'Création, envoi, acceptation et refus des devis.',
    matches: (e) => e.startsWith('quote.'),
  },
  {
    id: 'clients_products',
    label: 'CRM (clients & produits)',
    description: 'Mises à jour de votre base clients et produits.',
    matches: (e) => e.startsWith('client.') || e.startsWith('product.'),
  },
  {
    id: 'custom',
    label: 'Personnalisé',
    description: 'Choisissez exactement les événements à recevoir.',
    matches: () => false,
  },
]

export function resolveWebhookPreset(allEvents: string[], presetId: string): string[] {
  const preset = WEBHOOK_PRESETS.find((p) => p.id === presetId)
  if (!preset || preset.id === 'custom') return []
  return allEvents.filter((e) => preset.matches(e))
}

export { RefreshCw }
