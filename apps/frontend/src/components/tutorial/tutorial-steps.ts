import type { LucideIcon } from 'lucide-react'
import {
  Sparkles, Building2, UserPlus, Package, FileText,
  Eye, Mail, Receipt, CreditCard, Trophy,
} from 'lucide-react'

export interface TutorialHighlight {
  target: string
  label: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  route?: string
  spotlight?: boolean
  prefill?: string
  highlights?: TutorialHighlight[]
}

export interface TutorialLevel {
  id: number
  name: string
  subtitle: string
  icon: LucideIcon
  color: string

  steps: TutorialStep[]
}

export const TUTORIAL_LEVELS: TutorialLevel[] = [
  /* ──── Niveau 1 : Bienvenue ──── */
  {
    id: 1, name: 'Bienvenue', subtitle: 'Découvrez votre espace de travail',
    icon: Sparkles, color: '#6366f1',    steps: [
      {
        id: '1-1',
        title: 'Bienvenue sur Faktur !',
        description: 'Ce didacticiel vous guide à travers toutes les fonctionnalités essentielles. Suivez les étapes pour maîtriser Faktur en quelques minutes.',
      },
      {
        id: '1-2',
        title: 'Votre tableau de bord',
        description: 'Voici votre tableau de bord — l\'aperçu de votre activité : chiffre d\'affaires, factures récentes et statistiques.',
        route: '/dashboard',
        target: '[data-tutorial="main-content"]',
        position: 'bottom', spotlight: true,
      },
      {
        id: '1-3',
        title: 'La barre latérale',
        description: 'Votre centre de navigation. Toutes les sections sont accessibles ici.',
        target: '[data-tutorial="sidebar"]',
        position: 'right', spotlight: true,
        highlights: [
          { target: '[data-tutorial="nav-invoices"]', label: 'Factures', position: 'right' },
          { target: '[data-tutorial="nav-quotes"]', label: 'Devis', position: 'right' },
          { target: '[data-tutorial="nav-clients"]', label: 'Clients', position: 'right' },
          { target: '[data-tutorial="nav-products"]', label: 'Produits', position: 'right' },
          { target: '[data-tutorial="nav-expenses"]', label: 'Dépenses', position: 'right' },
        ],
      },
      {
        id: '1-4',
        title: 'Créer en un clic',
        description: 'Ce bouton ouvre le menu de création rapide : facture, devis ou avoir.',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '1-5',
        title: 'Votre profil',
        description: 'Accédez à votre profil, changez de thème, gérez votre équipe et votre compte.',
        target: '[data-tutorial="user-dropdown"]',
        position: 'top', spotlight: true,
      },
    ],
  },

  /* ──── Niveau 2 : Votre entreprise ──── */
  {
    id: 2, name: 'Votre Entreprise', subtitle: 'Vérifiez les informations de votre société',
    icon: Building2, color: '#8b5cf6',
    steps: [
      {
        id: '2-1',
        title: 'Informations de l\'entreprise',
        description: 'Ces données apparaîtront sur toutes vos factures et devis.',
        route: '/dashboard/settings/company',
        target: '[data-tutorial="main-content"]',
        position: 'bottom', spotlight: true,
        highlights: [
          { target: '#companyName', label: 'Nom de l\'entreprise', position: 'right' },
          { target: '#siren', label: 'SIREN', position: 'right' },
          { target: '#vatNumber', label: 'N° TVA', position: 'right' },
        ],
      },
      {
        id: '2-2',
        title: 'Adresse et contact',
        description: 'L\'adresse complète et les coordonnées de contact sont obligatoires pour la facturation.',
        route: '/dashboard/settings/company',
        prefill: 'company',
        highlights: [
          { target: '#address', label: 'Adresse', position: 'right' },
          { target: '#city', label: 'Ville', position: 'right' },
          { target: '#email', label: 'Email de contact', position: 'right' },
        ],
      },
      {
        id: '2-3',
        title: 'Coordonnées bancaires',
        description: 'Ajoutez vos coordonnées bancaires pour les paiements par virement.',
        route: '/dashboard/settings/company/bank',
        highlights: [
          { target: '#iban', label: 'Votre IBAN', position: 'right' },
          { target: '#bic', label: 'Code BIC', position: 'right' },
        ],
      },
      {
        id: '2-4',
        title: 'Moyens de paiement',
        description: 'Choisissez les moyens de paiement affichés sur vos factures.',
        route: '/dashboard/settings/company/payment',
      },
    ],
  },

  /* ──── Niveau 3 : Premier client ──── */
  {
    id: 3, name: 'Premier Client', subtitle: 'Créez votre premier contact',
    icon: UserPlus, color: '#10b981',
    steps: [
      {
        id: '3-1',
        title: 'La page Clients',
        description: 'Gérez votre carnet d\'adresses : entreprises, particuliers, coordonnées.',
        route: '/dashboard/clients',
        target: '[data-tutorial="nav-clients"]',
        position: 'right', spotlight: true,
      },
      {
        id: '3-2',
        title: 'Nouveau client',
        description: 'Ouvrez le menu Créer pour ajouter un client professionnel ou particulier.',
        route: '/dashboard/clients',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '3-3',
        title: 'Remplir les informations',
        description: 'Renseignez les informations du client. Utilisez « Préremplir » pour un exemple.',
        route: '/dashboard/clients/create',
        prefill: 'client',
      },
      {
        id: '3-4',
        title: 'Client créé !',
        description: 'Votre premier client est prêt. Vous pourrez le sélectionner sur vos factures et devis.',
      },
    ],
  },

  /* ──── Niveau 4 : Premier produit ──── */
  {
    id: 4, name: 'Premier Produit', subtitle: 'Ajoutez un produit ou service',
    icon: Package, color: '#f59e0b',
    steps: [
      {
        id: '4-1',
        title: 'Le catalogue',
        description: 'Vos articles et services avec prix et TVA, ajoutables en un clic sur vos factures.',
        route: '/dashboard/products',
        target: '[data-tutorial="nav-products"]',
        position: 'right', spotlight: true,
      },
      {
        id: '4-2',
        title: 'Créer un produit',
        description: 'Définissez un nom, une description, un prix unitaire HT et le taux de TVA.',
        route: '/dashboard/products',
        prefill: 'product',
      },
      {
        id: '4-3',
        title: 'Produit enregistré !',
        description: 'Votre produit est dans le catalogue. Passons à la création de votre première facture.',
      },
    ],
  },

  /* ──── Niveau 5 : Première facture ──── */
  {
    id: 5, name: 'Première Facture', subtitle: 'Créez votre première facture',
    icon: FileText, color: '#3b82f6',
    steps: [
      {
        id: '5-1',
        title: 'Les Factures',
        description: 'Le cœur de Faktur. Voyons comment créer une facture complète.',
        route: '/dashboard/invoices',
        target: '[data-tutorial="nav-invoices"]',
        position: 'right', spotlight: true,
      },
      {
        id: '5-2',
        title: 'Nouvelle facture',
        description: 'Cliquez sur Créer pour démarrer : facture vierge, depuis un devis, ou avec l\'IA.',
        route: '/dashboard/invoices',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '5-3',
        title: 'Remplir la facture',
        description: 'Sélectionnez un client, ajoutez des lignes de produits, vérifiez les totaux.',
        route: '/dashboard/invoices/new',
        prefill: 'invoice',
      },
      {
        id: '5-4',
        title: 'Facture créée !',
        description: 'Votre première facture est en brouillon. Vous pouvez la modifier, prévisualiser et envoyer.',
      },
    ],
  },

  /* ──── Niveau 6 : Aperçu & PDF ──── */
  {
    id: 6, name: 'Aperçu & PDF', subtitle: 'Prévisualisez et exportez',
    icon: Eye, color: '#06b6d4',
    steps: [
      {
        id: '6-1',
        title: 'Aperçu',
        description: 'Cliquez sur une facture pour voir l\'aperçu exact du document final.',
        route: '/dashboard/invoices',
      },
      {
        id: '6-2',
        title: 'Panneau de détails',
        description: 'Le panneau latéral affiche statut, dates, montants et actions rapides.',
      },
      {
        id: '6-3',
        title: 'Exporter en PDF',
        description: 'Téléchargez un PDF professionnel. Le design est personnalisable dans Paramètres > Documents.',
      },
    ],
  },

  /* ──── Niveau 7 : Envoi par email ──── */
  {
    id: 7, name: 'Envoi Email', subtitle: 'Envoyez depuis Faktur',
    icon: Mail, color: '#ec4899',
    steps: [
      {
        id: '7-1',
        title: 'Configurer l\'email',
        description: 'Connectez Gmail, Outlook ou un serveur SMTP dans Paramètres > Email.',
        route: '/dashboard/settings/email/accounts',
      },
      {
        id: '7-2',
        title: 'Envoyer une facture',
        description: 'Depuis l\'aperçu, cliquez « Envoyer ». Faktur compose l\'email avec le PDF en pièce jointe.',
      },
      {
        id: '7-3',
        title: 'Mode didacticiel',
        description: 'Les emails ne sont pas envoyés en mode didacticiel. En production, ils partent depuis votre compte.',
      },
    ],
  },

  /* ──── Niveau 8 : Devis ──── */
  {
    id: 8, name: 'Devis', subtitle: 'Proposez et convertissez',
    icon: Receipt, color: '#f97316',
    steps: [
      {
        id: '8-1',
        title: 'Les Devis',
        description: 'Proposez un prix avant de facturer. Le client peut accepter ou refuser.',
        route: '/dashboard/quotes',
        target: '[data-tutorial="nav-quotes"]',
        position: 'right', spotlight: true,
      },
      {
        id: '8-2',
        title: 'Créer un devis',
        description: 'Même processus qu\'une facture : client, lignes, totaux.',
        route: '/dashboard/quotes',
        prefill: 'quote',
      },
      {
        id: '8-3',
        title: 'Convertir en facture',
        description: 'Devis accepté ? Convertissez-le en facture en un clic. Tout est repris automatiquement.',
      },
    ],
  },

  /* ──── Niveau 9 : Paiements ──── */
  {
    id: 9, name: 'Paiements', subtitle: 'Gérez vos encaissements',
    icon: CreditCard, color: '#22c55e',
    steps: [
      {
        id: '9-1',
        title: 'Statuts de facture',
        description: 'Brouillon → Envoyée → Payée. Suivez chaque étape du cycle de vie.',
        route: '/dashboard/invoices',
      },
      {
        id: '9-2',
        title: 'Encaisser un paiement',
        description: 'Marquez une facture comme payée. Faktur met à jour votre chiffre d\'affaires.',
      },
      {
        id: '9-3',
        title: 'Relances',
        description: 'Configurez des rappels automatiques pour les factures en retard.',
        route: '/dashboard/settings/reminders',
      },
    ],
  },

  /* ──── Niveau 10 : Maîtrise ──── */
  {
    id: 10, name: 'Maîtrise', subtitle: 'Fonctionnalités avancées',
    icon: Trophy, color: '#eab308',
    steps: [
      {
        id: '10-1',
        title: 'Récurrences',
        description: 'Factures automatiques pour les abonnements et prestations régulières.',
        route: '/dashboard/recurring-invoices',
      },
      {
        id: '10-2',
        title: 'Avoirs',
        description: 'Annulez partiellement ou totalement une facture avec un avoir.',
        route: '/dashboard/credit-notes',
      },
      {
        id: '10-3',
        title: 'Dépenses',
        description: 'Suivez vos dépenses professionnelles par catégorie.',
        route: '/dashboard/expenses',
        target: '[data-tutorial="nav-expenses"]',
        position: 'right', spotlight: true,
      },
      {
        id: '10-4',
        title: 'Collaboration',
        description: 'Invitez des membres avec différents niveaux d\'accès.',
        route: '/dashboard/settings/members',
      },
      {
        id: '10-5',
        title: 'Vous maîtrisez Faktur !',
        description: 'Félicitations ! Relancez le didacticiel à tout moment depuis Aide > Didacticiel.',
      },
    ],
  },
]

export function getLevel(id: number): TutorialLevel | undefined {
  return TUTORIAL_LEVELS.find((l) => l.id === id)
}
