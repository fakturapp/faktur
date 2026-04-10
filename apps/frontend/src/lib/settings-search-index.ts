import {
  Building2,
  CreditCard,
  Receipt,
  UsersRound,
  Paintbrush,
  Settings2,
  ClipboardList,
  FileCheck,
  Sparkles,
  Mail,
  Bell,
} from 'lucide-react'
import type { ElementType } from 'react'

export interface SettingsSearchItem {
  href: string
  label: string
  description: string
  section: string
  icon: ElementType
  keywords: string[]
}

export const settingsSearchIndex: SettingsSearchItem[] = [
  {
    href: '/dashboard/settings/company',
    label: 'Informations',
    description: 'Raison sociale, SIREN, SIRET, adresse, contact',
    section: 'Entreprise',
    icon: Building2,
    keywords: ['entreprise', 'siren', 'siret', 'tva', 'adresse', 'logo', 'raison sociale', 'informations'],
  },
  {
    href: '/dashboard/settings/company/bank',
    label: 'Banque',
    description: 'Comptes bancaires, IBAN, BIC, coordonnées bancaires',
    section: 'Entreprise',
    icon: CreditCard,
    keywords: ['banque', 'iban', 'bic', 'compte bancaire', 'bancaires', 'swift'],
  },
  {
    href: '/dashboard/settings/company/payment',
    label: 'Paiement',
    description: 'Devise, conditions de paiement, moyens de paiement',
    section: 'Entreprise',
    icon: Receipt,
    keywords: ['paiement', 'devise', 'euro', 'conditions', 'virement', 'espèces', 'stripe', 'paypal'],
  },
  {
    href: '/dashboard/settings/members',
    label: 'Membres',
    description: 'Gestion des membres de l\'équipe et rôles',
    section: 'Équipe',
    icon: UsersRound,
    keywords: ['membres', 'équipe', 'team', 'rôle', 'invitation', 'collaborateur'],
  },
  {
    href: '/dashboard/settings/documents/invoices',
    label: 'Apparence',
    description: 'Template, logo, couleur, police des documents',
    section: 'Facturation',
    icon: Paintbrush,
    keywords: ['apparence', 'template', 'modèle', 'logo', 'couleur', 'police', 'dark mode', 'thème'],
  },
  {
    href: '/dashboard/settings/documents/invoices/options',
    label: 'Options',
    description: 'Type de facturation et moyens de paiement documents',
    section: 'Facturation',
    icon: Settings2,
    keywords: ['options', 'facturation', 'rapide', 'détaillé', 'complet', 'paiement'],
  },
  {
    href: '/dashboard/settings/documents/invoices/defaults',
    label: 'Valeurs par défaut',
    description: 'Objet, conditions, pied de page, langue, nommage',
    section: 'Facturation',
    icon: ClipboardList,
    keywords: ['défaut', 'objet', 'conditions', 'footer', 'langue', 'signature', 'fichier', 'nommage'],
  },
  {
    href: '/dashboard/settings/documents/invoices/e-invoicing',
    label: 'E-Facturation',
    description: 'Factur-X, PDP, B2Brouter, réforme 2026',
    section: 'Facturation',
    icon: FileCheck,
    keywords: ['e-facturation', 'factur-x', 'pdp', 'b2brouter', 'réforme', 'électronique', 'xml'],
  },
  {
    href: '/dashboard/settings/documents/invoices/ai',
    label: 'Faktur AI',
    description: 'Assistant IA, Gemini, intelligence artificielle',
    section: 'Facturation',
    icon: Sparkles,
    keywords: ['ia', 'ai', 'faktur', 'gemini', 'google', 'intelligence', 'artificielle', 'api'],
  },
  {
    href: '/dashboard/settings/email/accounts',
    label: 'Comptes email',
    description: 'Configuration des comptes email d\'envoi',
    section: 'Communication',
    icon: Mail,
    keywords: ['email', 'mail', 'smtp', 'envoi', 'compte', 'communication'],
  },
  {
    href: '/dashboard/settings/reminders',
    label: 'Relances',
    description: 'Relances automatiques de paiement',
    section: 'Communication',
    icon: Bell,
    keywords: ['relances', 'rappel', 'automatique', 'paiement', 'impayé'],
  },
]

export function searchSettings(query: string): SettingsSearchItem[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return settingsSearchIndex.filter((item) =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.section.toLowerCase().includes(q) ||
    item.keywords.some((k) => k.includes(q))
  )
}
