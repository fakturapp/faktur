import type { LucideIcon } from 'lucide-react'
import {
  GraduationCap, Building2, UserPlus, Package, FileText,
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
  /* ═══════════════ Niveau 1 : Bienvenue ═══════════════ */
  {
    id: 1, name: 'Bienvenue', subtitle: 'Découvrez votre espace de travail',
    icon: GraduationCap, color: '#6366f1',
    steps: [
      {
        id: '1-1',
        title: 'Bienvenue sur Faktur !',
        description: 'Faktur est votre logiciel de facturation. Il vous permet de créer des factures, des devis, de gérer vos clients et vos produits — le tout depuis une seule interface.\n\nCe didacticiel va vous guider étape par étape. Vous pouvez le quitter à tout moment et le reprendre plus tard. Vous pouvez aussi déplacer cette fenêtre si elle vous gêne.',
      },
      {
        id: '1-2',
        title: 'Le tableau de bord',
        description: 'C\'est ici que vous atterrissez quand vous vous connectez. Le tableau de bord vous donne un aperçu rapide de votre activité :\n\n• Votre chiffre d\'affaires du mois\n• Les factures en attente de paiement\n• Les derniers documents créés\n• Des graphiques de suivi',
        route: '/dashboard',
        target: '[data-tutorial="main-content"]',
        position: 'bottom', spotlight: true,
      },
      {
        id: '1-3',
        title: 'La barre de navigation',
        description: 'À gauche, voici votre menu principal. Chaque section a un rôle précis. Regardez les éléments encadrés :',
        target: '[data-tutorial="sidebar"]',
        position: 'right', spotlight: true,
        highlights: [
          { target: '[data-tutorial="nav-invoices"]', label: 'Vos factures', position: 'right' },
          { target: '[data-tutorial="nav-quotes"]', label: 'Vos devis', position: 'right' },
          { target: '[data-tutorial="nav-clients"]', label: 'Votre carnet clients', position: 'right' },
          { target: '[data-tutorial="nav-products"]', label: 'Votre catalogue', position: 'right' },
          { target: '[data-tutorial="nav-expenses"]', label: 'Vos dépenses', position: 'right' },
        ],
      },
      {
        id: '1-4',
        title: 'Le bouton Créer',
        description: 'Ce bouton est votre raccourci principal. En cliquant dessus, un menu déroulant s\'ouvre et vous propose :\n\n• Créer une facture vierge\n• Créer une facture depuis un devis existant\n• Créer un devis\n\nVous pouvez y accéder depuis n\'importe quelle page.',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '1-5',
        title: 'Votre espace utilisateur',
        description: 'Tout en bas de la barre latérale, cliquez sur votre nom pour accéder à :\n\n• Mon compte — vos informations personnelles\n• Changer de thème — clair, sombre ou automatique\n• Changer d\'équipe — si vous gérez plusieurs entreprises\n• Aide & informations — et ce didacticiel !\n• Se déconnecter',
        target: '[data-tutorial="user-dropdown"]',
        position: 'top', spotlight: true,
      },
    ],
  },

  /* ═══════════════ Niveau 2 : Votre entreprise ═══════════════ */
  {
    id: 2, name: 'Votre Entreprise', subtitle: 'Les informations de votre société',
    icon: Building2, color: '#8b5cf6',
    steps: [
      {
        id: '2-1',
        title: 'Pourquoi c\'est important',
        description: 'Les informations de votre entreprise apparaissent sur TOUTES vos factures et devis. C\'est une obligation légale en France :\n\n• Le nom de l\'entreprise\n• Le numéro SIREN / SIRET\n• Le numéro de TVA intracommunautaire\n• L\'adresse du siège social\n• L\'email et le téléphone de contact\n\nSi ces informations sont incorrectes ou manquantes, vos factures ne seront pas conformes.',
        route: '/dashboard/settings/company',
      },
      {
        id: '2-2',
        title: 'La page Informations',
        description: 'Voici la page des paramètres de votre entreprise. C\'est ici que vous renseignez toutes vos données. Utilisez « Préremplir » pour voir un exemple complet.',
        route: '/dashboard/settings/company',
        target: '[data-tutorial="main-content"]',
        position: 'bottom', spotlight: true,
        prefill: 'company',
        highlights: [
          { target: '#companyName', label: 'Nom de l\'entreprise', position: 'right' },
          { target: '#siren', label: 'Numéro SIREN', position: 'right' },
          { target: '#vatNumber', label: 'N° TVA intracommunautaire', position: 'right' },
        ],
      },
      {
        id: '2-3',
        title: 'Les coordonnées bancaires',
        description: 'Rendez-vous dans l\'onglet Banque. C\'est ici que vous renseignez vos coordonnées bancaires (IBAN et BIC).\n\nQuand le virement est activé comme moyen de paiement, ces informations s\'affichent automatiquement en bas de chaque facture pour que votre client sache où envoyer le paiement.',
        route: '/dashboard/settings/company/bank',
        highlights: [
          { target: '#iban', label: 'Votre IBAN — numéro de compte', position: 'right' },
          { target: '#bic', label: 'Code BIC — identifiant de la banque', position: 'right' },
        ],
      },
      {
        id: '2-4',
        title: 'Les moyens de paiement',
        description: 'L\'onglet Paiement vous permet de choisir comment vos clients peuvent vous payer :\n\n• Virement bancaire — le plus courant en B2B\n• Espèces — pour les paiements en personne\n• Carte bancaire via Stripe — paiement en ligne\n• Moyen personnalisé — chèque, PayPal, etc.\n\nChaque moyen activé apparaîtra sur vos factures.',
        route: '/dashboard/settings/company/payment',
      },
    ],
  },

  /* ═══════════════ Niveau 3 : Premier client ═══════════════ */
  {
    id: 3, name: 'Premier Client', subtitle: 'Créez votre premier contact',
    icon: UserPlus, color: '#10b981',
    steps: [
      {
        id: '3-1',
        title: 'La page Clients',
        description: 'C\'est ici que vous gérez votre carnet d\'adresses. Tous vos clients — entreprises et particuliers — sont listés ici avec leurs coordonnées, le nombre de factures, et le chiffre d\'affaires généré.\n\nC\'est le point de départ avant de créer une facture, car chaque facture doit être associée à un client.',
        route: '/dashboard/clients',
        target: '[data-tutorial="nav-clients"]',
        position: 'right', spotlight: true,
      },
      {
        id: '3-2',
        title: 'Créer un nouveau client',
        description: 'Pour créer un client, cliquez sur le bouton « Créer » dans la barre latérale, ou sur le bouton « Nouveau client » en haut de la page.\n\nDeux types de clients :\n• Professionnel — une entreprise (SIREN, TVA, etc.)\n• Particulier — une personne physique (nom, prénom)',
        route: '/dashboard/clients',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '3-3',
        title: 'Remplir les informations',
        description: 'Le formulaire de création vous demande :\n\n1. Le type — professionnel ou particulier\n2. Le nom — de l\'entreprise ou de la personne\n3. L\'email — pour envoyer les factures\n4. L\'adresse — obligatoire sur les factures\n5. Le pays — pour la TVA\n\nCliquez « Préremplir » pour voir un exemple complet avec des données fictives.',
        route: '/dashboard/clients/create',
        prefill: 'client',
      },
      {
        id: '3-4',
        title: 'L\'adresse de facturation',
        description: 'L\'adresse que vous renseignez apparaîtra sur toutes les factures et devis destinés à ce client.\n\nPour un client professionnel, assurez-vous de mettre l\'adresse du siège social. C\'est une obligation légale pour les factures en France.\n\nVous pouvez aussi ajouter un complément d\'adresse (bâtiment, étage, etc.).',
        route: '/dashboard/clients/create',
      },
      {
        id: '3-5',
        title: 'Client créé !',
        description: 'Excellent ! Votre client est maintenant dans votre carnet d\'adresses.\n\nQuand vous créerez une facture ou un devis, vous pourrez le sélectionner en un clic et toutes ses informations (nom, adresse, TVA) seront automatiquement ajoutées au document.\n\nPassons à la création d\'un produit.',
      },
    ],
  },

  /* ═══════════════ Niveau 4 : Premier produit ═══════════════ */
  {
    id: 4, name: 'Premier Produit', subtitle: 'Votre catalogue de produits et services',
    icon: Package, color: '#f59e0b',
    steps: [
      {
        id: '4-1',
        title: 'Le catalogue Produits',
        description: 'Le catalogue stocke vos articles et services avec leurs prix. Quand vous créez une facture, au lieu de retaper le nom et le prix à chaque fois, vous sélectionnez simplement un produit du catalogue.\n\nC\'est un gain de temps énorme si vous facturez souvent les mêmes prestations.',
        route: '/dashboard/products',
        target: '[data-tutorial="nav-products"]',
        position: 'right', spotlight: true,
      },
      {
        id: '4-2',
        title: 'Créer un produit',
        description: 'Pour chaque produit ou service, vous devez renseigner :\n\n• Le nom — ex : « Création site web »\n• La description — ce qui sera affiché sur la facture\n• Le prix unitaire HT — toujours hors taxes\n• Le taux de TVA — 0%, 5,5%, 10% ou 20%\n• L\'unité — forfait, heure, jour, pièce, etc.\n\nCliquez « Préremplir » pour voir un exemple.',
        route: '/dashboard/products',
        prefill: 'product',
      },
      {
        id: '4-3',
        title: 'Produit enregistré !',
        description: 'Votre produit est dans le catalogue. Vous pouvez en créer autant que nécessaire.\n\nAstuce : quand vous ajouterez ce produit sur une facture, Faktur reprendra automatiquement le prix et la TVA. Vous pourrez toujours modifier la quantité et le prix directement sur la facture.\n\nMaintenant, créons votre première facture !',
      },
    ],
  },

  /* ═══════════════ Niveau 5 : Première facture ═══════════════ */
  {
    id: 5, name: 'Première Facture', subtitle: 'De A à Z, votre première facture',
    icon: FileText, color: '#3b82f6',
    steps: [
      {
        id: '5-1',
        title: 'La section Factures',
        description: 'C\'est le cœur de Faktur. Cette page liste toutes vos factures avec :\n\n• Le numéro de facture\n• Le client\n• Le montant TTC\n• Le statut — brouillon, envoyée, payée, en retard\n• La date d\'émission et d\'échéance\n\nVous pouvez filtrer, trier et rechercher vos factures.',
        route: '/dashboard/invoices',
        target: '[data-tutorial="nav-invoices"]',
        position: 'right', spotlight: true,
      },
      {
        id: '5-2',
        title: 'Créer une facture',
        description: 'Cliquez sur « Créer » dans la barre latérale. Le menu propose :\n\n• Facture vierge — vous partez de zéro\n• Depuis un devis — convertit un devis accepté\n• Avec l\'IA — Faktur génère le contenu pour vous\n\nChoisissez « Facture vierge » pour commencer.',
        route: '/dashboard/invoices',
        target: '[data-tutorial="create-button"]',
        position: 'right', spotlight: true,
      },
      {
        id: '5-3',
        title: 'L\'éditeur de facture',
        description: 'L\'éditeur se compose de plusieurs sections :\n\n1. En-tête — numéro, dates, client\n2. Lignes — les produits/services facturés\n3. Totaux — sous-total HT, TVA, total TTC\n4. Notes — conditions de paiement, mentions\n\nCommencez par sélectionner le client que vous avez créé, puis ajoutez le produit de votre catalogue.\n\nCliquez « Préremplir » pour remplir automatiquement.',
        route: '/dashboard/invoices/new',
        prefill: 'invoice',
      },
      {
        id: '5-4',
        title: 'Les totaux',
        description: 'Faktur calcule automatiquement tout :\n\n• Sous-total HT — la somme de toutes les lignes hors taxes\n• TVA — détaillée par taux (20%, 10%, etc.)\n• Total TTC — ce que le client doit payer\n• Montant dû — TTC moins les éventuels acomptes\n\nVérifiez toujours les totaux avant d\'enregistrer. Une fois la facture envoyée, la modifier nécessite un avoir.',
        route: '/dashboard/invoices/new',
      },
      {
        id: '5-5',
        title: 'Facture en brouillon',
        description: 'Votre facture est enregistrée en « Brouillon ». Tant qu\'elle est en brouillon, vous pouvez la modifier librement.\n\nLe cycle de vie d\'une facture :\n• Brouillon → vous pouvez modifier\n• Envoyée → le client l\'a reçue\n• Payée → le paiement est enregistré\n\nPassons maintenant à l\'aperçu et l\'export PDF.',
      },
    ],
  },

  /* ═══════════════ Niveau 6 : Aperçu & PDF ═══════════════ */
  {
    id: 6, name: 'Aperçu & PDF', subtitle: 'Prévisualisez et exportez',
    icon: Eye, color: '#06b6d4',
    steps: [
      {
        id: '6-1',
        title: 'L\'aperçu de la facture',
        description: 'Cliquez sur une facture dans la liste pour ouvrir l\'aperçu. Il s\'ouvre en overlay au centre de l\'écran.\n\nVous voyez exactement à quoi ressemblera le PDF final : votre logo, les informations de l\'entreprise, le client, les lignes, les totaux, et les mentions légales.\n\nSi quelque chose ne va pas, fermez l\'aperçu et modifiez la facture.',
        route: '/dashboard/invoices',
      },
      {
        id: '6-2',
        title: 'Le panneau de détails',
        description: 'Sur le côté droit de l\'aperçu, un panneau affiche :\n\n• Le statut actuel de la facture\n• Les dates (émission, échéance)\n• Le montant total\n• Les boutons d\'action : envoyer, télécharger, dupliquer, supprimer\n• L\'historique d\'activité : qui a fait quoi et quand\n\nC\'est votre centre de commande pour chaque facture.',
      },
      {
        id: '6-3',
        title: 'Télécharger et imprimer',
        description: 'Depuis le panneau de détails :\n\n• « Télécharger PDF » — génère un fichier PDF professionnel au format A4\n• « Imprimer » — ouvre la boîte de dialogue d\'impression de votre navigateur\n\nLe design du PDF est personnalisable dans Paramètres > Documents > Apparence (couleurs, police, mise en page).',
      },
    ],
  },

  /* ═══════════════ Niveau 7 : Envoi par email ═══════════════ */
  {
    id: 7, name: 'Envoi Email', subtitle: 'Envoyez directement depuis Faktur',
    icon: Mail, color: '#ec4899',
    steps: [
      {
        id: '7-1',
        title: 'Configurer un compte email',
        description: 'Avant de pouvoir envoyer des factures par email, vous devez connecter un compte email.\n\nAllez dans Paramètres > Email > Comptes. Trois options :\n\n• Gmail — connexion en un clic via Google\n• Outlook / Office 365 — connexion Microsoft\n• SMTP — pour les autres fournisseurs\n\nL\'email partira de VOTRE adresse, pas d\'une adresse Faktur.',
        route: '/dashboard/settings/email/accounts',
      },
      {
        id: '7-2',
        title: 'Envoyer une facture',
        description: 'Depuis l\'aperçu d\'une facture, cliquez « Envoyer par email ». Faktur prépare l\'email pour vous :\n\n• Destinataire — l\'email du client (pré-rempli)\n• Objet — « Facture N° XXX » (personnalisable)\n• Corps — un texte professionnel (personnalisable)\n• Pièce jointe — le PDF de la facture\n\nVous pouvez tout modifier avant d\'envoyer.',
      },
      {
        id: '7-3',
        title: 'Envoi simulé',
        description: 'En mode didacticiel, les emails ne sont PAS réellement envoyés. C\'est une simulation.\n\nEn production, le mail part directement depuis votre adresse email. Le statut de la facture passe automatiquement à « Envoyée » et l\'envoi est tracé dans l\'historique.',
      },
    ],
  },

  /* ═══════════════ Niveau 8 : Devis ═══════════════ */
  {
    id: 8, name: 'Devis', subtitle: 'Proposez et convertissez',
    icon: Receipt, color: '#f97316',
    steps: [
      {
        id: '8-1',
        title: 'À quoi sert un devis ?',
        description: 'Un devis est une proposition commerciale que vous envoyez à un client AVANT de facturer.\n\nIl contient les mêmes informations qu\'une facture (client, lignes, montants) mais n\'a pas de valeur fiscale. Le client peut l\'accepter ou le refuser.\n\nUne fois accepté, vous pouvez le convertir en facture en un clic.',
        route: '/dashboard/quotes',
        target: '[data-tutorial="nav-quotes"]',
        position: 'right', spotlight: true,
      },
      {
        id: '8-2',
        title: 'Créer un devis',
        description: 'La création d\'un devis est identique à celle d\'une facture :\n\n1. Sélectionnez un client\n2. Ajoutez des lignes (produits/services)\n3. Définissez une date de validité — après cette date, l\'offre expire\n4. Enregistrez en brouillon\n\nCliquez « Préremplir » pour un exemple.',
        route: '/dashboard/quotes',
        prefill: 'quote',
      },
      {
        id: '8-3',
        title: 'Le cycle de vie d\'un devis',
        description: 'Un devis passe par ces étapes :\n\n• Brouillon — en cours de rédaction\n• Envoyé — le client l\'a reçu\n• Accepté — le client a dit oui ✓\n• Refusé — le client a dit non ✗\n• Converti — transformé en facture\n\nLe bouton « Convertir en facture » crée une facture avec toutes les informations du devis. Vous n\'avez rien à re-saisir.',
      },
    ],
  },

  /* ═══════════════ Niveau 9 : Paiements ═══════════════ */
  {
    id: 9, name: 'Paiements', subtitle: 'Suivez vos encaissements',
    icon: CreditCard, color: '#22c55e',
    steps: [
      {
        id: '9-1',
        title: 'Les statuts de facture',
        description: 'Chaque facture a un statut qui indique où elle en est :\n\n• Brouillon — pas encore envoyée, modifiable\n• Envoyée — le client l\'a reçue\n• En retard — la date d\'échéance est dépassée\n• Payée — le client a payé ✓\n• Annulée — la facture est annulée (nécessite un avoir)\n\nLes statuts sont visibles d\'un coup d\'œil dans la liste des factures grâce aux badges colorés.',
        route: '/dashboard/invoices',
      },
      {
        id: '9-2',
        title: 'Enregistrer un paiement',
        description: 'Quand votre client vous paie :\n\n1. Ouvrez l\'aperçu de la facture\n2. Cliquez sur « Marquer comme payée »\n3. Faktur enregistre la date de paiement\n4. Le montant est ajouté à votre chiffre d\'affaires\n\nVous pouvez aussi changer le statut manuellement depuis le menu déroulant de statut.',
      },
      {
        id: '9-3',
        title: 'Les relances automatiques',
        description: 'Pour les clients qui tardent à payer, Faktur peut envoyer des rappels automatiques.\n\nDans Paramètres > Relances, configurez :\n\n• Quand relancer — X jours après l\'échéance\n• Combien de fois — une relance, puis toutes les X jours\n• Le texte — personnalisable avec des variables ({numero}, {montant}, etc.)\n\nLes relances ne partent que pour les factures en statut « Envoyée » ou « En retard ».',
        route: '/dashboard/settings/reminders',
      },
    ],
  },

  /* ═══════════════ Niveau 10 : Maîtrise ═══════════════ */
  {
    id: 10, name: 'Maîtrise', subtitle: 'Les fonctionnalités avancées',
    icon: Trophy, color: '#eab308',
    steps: [
      {
        id: '10-1',
        title: 'Les factures récurrentes',
        description: 'Pour les clients avec un abonnement ou une prestation mensuelle, créez une facture récurrente.\n\nVous définissez :\n• La fréquence — tous les mois, trimestres, etc.\n• La date de début et de fin\n• Le contenu de la facture\n\nFaktur génère automatiquement la facture à chaque échéance. Vous n\'avez rien à faire.',
        route: '/dashboard/recurring-invoices',
      },
      {
        id: '10-2',
        title: 'Les avoirs (notes de crédit)',
        description: 'Un avoir est le contraire d\'une facture : il annule tout ou partie d\'un montant facturé.\n\nQuand l\'utiliser :\n• Erreur sur une facture envoyée\n• Remboursement partiel\n• Retour de marchandise\n\nUn avoir est TOUJOURS lié à une facture existante. Il a la même valeur juridique qu\'une facture.',
        route: '/dashboard/credit-notes',
      },
      {
        id: '10-3',
        title: 'Le suivi des dépenses',
        description: 'Enregistrez vos dépenses professionnelles pour avoir une vue complète de votre activité.\n\nPour chaque dépense :\n• Montant HT et TVA\n• Catégorie — fournitures, abonnements, déplacements...\n• Fournisseur\n• Justificatif\n\nCela vous aide à suivre vos coûts et préparer votre comptabilité.',
        route: '/dashboard/expenses',
        target: '[data-tutorial="nav-expenses"]',
        position: 'right', spotlight: true,
      },
      {
        id: '10-4',
        title: 'La collaboration',
        description: 'Vous pouvez inviter des collaborateurs dans votre équipe :\n\n• Lecteur — peut voir les documents, pas les modifier\n• Membre — peut créer des factures et devis\n• Administrateur — peut gérer les membres et les paramètres\n\nChaque collaborateur a son propre compte et reçoit une invitation par email.',
        route: '/dashboard/settings/members',
      },
      {
        id: '10-5',
        title: 'Vous maîtrisez Faktur !',
        description: 'Félicitations, vous avez terminé le didacticiel complet !\n\nVous savez maintenant :\n✓ Configurer votre entreprise\n✓ Gérer vos clients et produits\n✓ Créer des factures et des devis\n✓ Exporter en PDF et envoyer par email\n✓ Suivre les paiements et relancer\n✓ Utiliser les fonctionnalités avancées\n\nRelancez le didacticiel à tout moment depuis le menu Aide > Didacticiel.',
      },
    ],
  },
]

export function getLevel(id: number): TutorialLevel | undefined {
  return TUTORIAL_LEVELS.find((l) => l.id === id)
}
