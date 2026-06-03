import { Package, Zap, Crown, type LucideIcon } from 'lucide-react'

export type PlanId = 'free' | 'pro' | 'team'

export interface PlanMeta {
  id: PlanId
  name: string
  label: string
  tagline: string
  priceMonthly: number
  priceAnnual: number
  recommended?: boolean
  icon: LucideIcon
  accentText: string
  accentSoft: string
  accentRing: string
  features: string[]
}

export const PLAN_IDS: PlanId[] = ['free', 'pro', 'team']

export const PLANS: Record<PlanId, PlanMeta> = {
  free: {
    id: 'free',
    name: 'Gratuit',
    label: 'Plan Gratuit',
    tagline: 'Pour démarrer votre facturation, sans aucun frais.',
    priceMonthly: 0,
    priceAnnual: 0,
    icon: Package,
    accentText: 'text-muted-foreground',
    accentSoft: 'bg-muted',
    accentRing: 'border-border',
    features: [
      'Factures & devis illimités',
      'Clients & produits illimités',
      'Export PDF',
      '50 Mo de stockage',
      '1 équipe',
      'Support communautaire',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    label: 'Plan Pro',
    tagline: 'Pour les indépendants qui veulent aller plus loin.',
    priceMonthly: 7.99,
    priceAnnual: 4.99,
    recommended: true,
    icon: Zap,
    accentText: 'text-primary',
    accentSoft: 'bg-primary/10',
    accentRing: 'border-primary',
    features: [
      'Tout le plan Gratuit',
      'Relances automatiques',
      'Factures récurrentes & surfacturation',
      'Modèles de documents personnalisés',
      'Faktur AI',
      '1 Go de stockage',
      'Support prioritaire',
    ],
  },
  team: {
    id: 'team',
    name: 'Team',
    label: 'Plan Team',
    tagline: 'Pour collaborer à plusieurs sur vos documents.',
    priceMonthly: 14.99,
    priceAnnual: 11.99,
    icon: Crown,
    accentText: 'text-amber-500',
    accentSoft: 'bg-amber-500/10',
    accentRing: 'border-amber-500',
    features: [
      'Tout le plan Pro',
      'Invitez plusieurs membres',
      'Rôles & permissions avancés',
      'Collaboration en temps réel',
      "Journal d'audit de l'équipe",
      '20 Go de stockage',
      'Support dédié',
    ],
  },
}

export function getPlan(id: string | null | undefined): PlanMeta {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : 'free']
}

export function formatPlanPrice(amount: number): string {
  if (amount <= 0) return 'Gratuit'
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
