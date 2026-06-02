export interface ChangelogEntry {
  id: string
  title: string
  body: string
}

export interface ChangelogMonth {
  id: string
  label: string
  entries: ChangelogEntry[]
}

export interface ChangelogMeta {
  title: string
  author: string
  updatedAtIso: string
  updatedAtLabel: string
}

export const CHANGELOG_META: ChangelogMeta = {
  title: 'Mises à jour de Faktur',
  author: "L'équipe Faktur",
  updatedAtIso: '2026-06-02',
  updatedAtLabel: '2 juin 2026',
}

export const CHANGELOG: ChangelogMonth[] = [
  {
    id: 'juin-2026',
    label: 'Juin 2026',
    entries: [
      {
        id: 'codes-promo',
        title: 'Codes promo',
        body: `Les codes promotionnels font leur entrée au moment du paiement. Un champ dédié sur la page de règlement permet désormais d'appliquer une réduction avant de valider son abonnement, et une animation de confirmation vient saluer chaque transaction réussie. Côté administration, un assistant complet permet de créer, lister et désactiver ces codes en quelques clics depuis le [panneau administrateur](/dashboard/admin/promo-codes).`,
      },
      {
        id: 'changements-forfait',
        title: 'Changements de forfait en cours de période',
        body: `La gestion des abonnements gagne en souplesse. Lorsque vous basculez entre une facturation mensuelle et annuelle, ou que vous rétrogradez vers une offre inférieure, Faktur calcule automatiquement le crédit correspondant au temps déjà payé et l'applique à la nouvelle formule. Les rétrogradations sont programmées pour la fin de la période en cours, avec un récapitulatif clair de la prochaine échéance et la possibilité d'annuler le changement à tout moment.`,
      },
      {
        id: 'relances-paiement',
        title: 'Suivi des paiements et relances automatiques',
        body: `En cas d'échec de prélèvement, le propriétaire de l'équipe reçoit désormais un courriel l'informant du délai de grâce de sept jours, envoyé une seule fois par cycle quel que soit l'ordre des évènements. Une bannière dans le tableau de bord ouvre directement le portail de paiement pour régulariser la situation, et un automatisme veille à rétrograder proprement les équipes qui dépassent ce délai, même hors connexion.`,
      },
      {
        id: 'gestion-abonnement',
        title: "Page de gestion d'abonnement repensée",
        body: `La [page des forfaits](/dashboard/settings/plan) adopte un design plus généreux, avec des cartes animées, un indicateur visuel par niveau d'offre et l'affichage du véritable moyen de paiement enregistré, qu'il s'agisse d'une carte ou de Link. L'historique des factures est désormais consultable et paginé sur toutes les formules, et un écran de bienvenue festif accompagne chaque souscription.`,
      },
      {
        id: 'page-nouveautes',
        title: 'Page de nouveautés',
        body: `Cette page de changelog au format éditorial fait son apparition, avec une table des matières interactive qui suit votre lecture, pour découvrir d'un coup d'œil tout ce qui a évolué dans Faktur.`,
      },
    ],
  },
  {
    id: 'mai-2026',
    label: 'Mai 2026',
    entries: [
      {
        id: 'abonnements',
        title: 'Abonnements Gratuit, Pro et Team',
        body: `Faktur introduit ses formules d'abonnement, avec une offre Gratuit, une offre Pro et une offre Team, déclinées en facturation mensuelle ou annuelle. La souscription, le changement de formule et la gestion se font directement dans l'application via un [paiement intégré](/dashboard/settings/plan/upgrade), et l'état de l'abonnement reste synchronisé en permanence pour refléter au plus juste la situation de chaque équipe.`,
      },
      {
        id: 'portail-api',
        title: 'Portail développeurs et API publique',
        body: `Un véritable portail développeurs voit le jour, accompagné d'une API publique complète couvrant factures, devis, clients, produits, dépenses, avoirs et factures récurrentes. Les développeurs peuvent créer des clés d'API par projet, définir des permissions fines, restreindre les accès par adresse IP et configurer des webhooks pour être notifiés en temps réel. Un explorateur d'API interactif et une documentation détaillée complètent l'ensemble.`,
      },
      {
        id: 'chiffrement-modes',
        title: 'Modes de chiffrement Privé et Standard',
        body: `Chaque équipe peut désormais choisir son niveau de protection. Le mode Privé conserve le chiffrement de bout en bout, tandis que le mode Standard offre une expérience plus fluide pour les usages qui ne nécessitent pas ce niveau d'isolement, notamment l'accès par l'API. Une assistance guidée permet de migrer d'un mode à l'autre en toute sécurité, et l'interface indique clairement le mode actif de l'équipe.`,
      },
      {
        id: 'admin',
        title: "Panneau d'administration enrichi",
        body: `Le panneau d'administration s'étoffe avec une vue détaillée des utilisateurs et des équipes, organisée par profils et par hiérarchie. Les administrateurs peuvent modifier un compte, vérifier une adresse, ajuster un forfait ou supprimer une ressource, le tout protégé par une confirmation par mot de passe administrateur.`,
      },
      {
        id: 'modeles-emails',
        title: "Personnalisation des modèles d'e-mails",
        body: `Un éditeur dédié permet de personnaliser entièrement les modèles d'e-mails envoyés aux clients, avec coloration syntaxique, aperçu façon messagerie et possibilité de revenir au modèle d'origine d'un simple clic. Les courriels de facture, de devis et d'avoir bénéficient de gabarits soignés et entièrement traduits en français.`,
      },
      {
        id: 'documents-multipages',
        title: 'Documents multi-pages et aperçu fidèle',
        body: `L'éditeur gère désormais les documents qui s'étendent sur plusieurs pages A4, avec une pagination naturelle proche d'un traitement de texte et un aperçu qui affiche le véritable PDF généré, page par page. Une mise en cache intelligente accélère la prévisualisation en ne recalculant le document que lorsqu'il change.`,
      },
    ],
  },
  {
    id: 'avril-2026',
    label: 'Avril 2026',
    entries: [
      {
        id: 'refonte-ui',
        title: "Refonte complète de l'interface",
        body: `Faktur adopte une toute nouvelle identité visuelle, inspirée de Link by Stripe et de Revolut, avec une bibliothèque de composants entièrement repensée, des jetons de design cohérents et des animations soignées. Les tableaux de bord, les listes, les formulaires, les fenêtres et les pages d'authentification ont été redessinés un à un pour offrir une expérience moderne et homogène.`,
      },
      {
        id: 'liens-paiement',
        title: 'Liens de paiement et règlement en ligne',
        body: `Il devient possible de générer un lien de paiement pour une facture et de l'envoyer à son client, qui peut alors régler en ligne par carte via une page de paiement sécurisée. Les notifications par e-mail, le suivi des statuts de règlement et la confirmation automatique accompagnent tout le parcours, jusqu'à l'expiration automatique du lien une fois le paiement confirmé.`,
      },
      {
        id: 'collaboration',
        title: 'Collaboration en temps réel',
        body: `Plusieurs membres d'une équipe peuvent désormais travailler ensemble sur un même document. Le système affiche les curseurs et la présence des collaborateurs en direct, synchronise les modifications à la volée et permet de partager un document via un lien avec gestion des accès et des permissions.`,
      },
      {
        id: 'oauth',
        title: 'Applications connectées et OAuth',
        body: `Faktur ouvre un système d'autorisation complet, permettant à des applications tierces et à l'application de bureau de se connecter de façon sécurisée. Les utilisateurs disposent d'un écran de consentement clair et d'une page recensant les applications connectées, tandis que les administrateurs gèrent les applications, font tourner leurs secrets et révoquent les sessions.`,
      },
      {
        id: 'passkeys',
        title: "Clés d'accès et connexion par e-mail",
        body: `L'authentification se modernise avec la prise en charge des clés d'accès, qui permettent de se connecter par biométrie sans saisir de mot de passe, et une page de gestion dédiée dans les paramètres de sécurité. La page de connexion adopte par ailleurs un parcours commençant par l'adresse e-mail, avec vérification en direct et animations.`,
      },
      {
        id: 'academy-desktop',
        title: 'Faktur Academy et application de bureau',
        body: `Un système de tutoriel guidé en dix niveaux, baptisé Faktur Academy, accompagne désormais les nouveaux utilisateurs grâce à un bac à sable et à un surlignage des éléments à l'écran. En parallèle, une [page de téléchargement](/download) présente les applications de bureau et mobiles, avec détection de la plateforme et carte de mise à jour intégrée lorsque vous utilisez Faktur Desktop.`,
      },
    ],
  },
  {
    id: 'mars-2026',
    label: 'Mars 2026',
    entries: [
      {
        id: 'fondations',
        title: 'Les fondations de Faktur',
        body: `Faktur voit le jour avec tout l'essentiel d'une solution de facturation moderne : création de compte, gestion des équipes avec rôles et invitations, fiches clients, catalogue de produits, et un système de factures et de devis complet avec numérotation automatique et génération de PDF. Le tableau de bord offre une vue d'ensemble de l'activité avec statistiques et graphiques de chiffre d'affaires.`,
      },
      {
        id: 'devis-avoirs',
        title: 'Devis, avoirs et factures récurrentes',
        body: `Au-delà de la facture classique, Faktur propose la création de devis convertibles en factures, la gestion des avoirs, les factures récurrentes générées automatiquement, ainsi que le suivi des dépenses avec extraction des reçus par reconnaissance optique. Les paiements partiels, les relances et la détection automatique des factures en retard complètent la gestion du quotidien.`,
      },
      {
        id: 'editeur-modeles',
        title: 'Éditeur de documents et modèles personnalisables',
        body: `L'éditeur permet de composer ses documents directement sur une feuille A4 interactive, avec des champs modifiables en place, une barre de mise en forme enrichie, le choix parmi une dizaine de modèles et la personnalisation du logo, des polices, du pied de page et des couleurs. Les noms de fichiers PDF et les motifs de numérotation sont entièrement configurables.`,
      },
      {
        id: 'chiffrement-zero-acces',
        title: 'Chiffrement zéro accès et coffre-fort',
        body: `Faktur protège les données sensibles grâce à un chiffrement de bout en bout dit à zéro accès, où seul l'utilisateur détient les clés. Un coffre-fort se déverrouille à la connexion, une clé de récupération permet de retrouver l'accès en cas d'oubli, et une procédure de récupération sécurise les changements de mot de passe.`,
      },
      {
        id: 'e-invoicing',
        title: 'Facturation électronique et Factur-X',
        body: `En anticipation de la réforme de la facturation électronique, Faktur intègre la génération de factures au format Factur-X conforme au profil EN 16931, la transmission via une plateforme de dématérialisation partenaire et les champs réglementaires nécessaires. Des rapports de TVA, un export FEC et une prévision de trésorerie viennent enrichir la dimension comptable.`,
      },
      {
        id: 'faktur-ai',
        title: 'Assistant Faktur AI',
        body: `Un assistant intelligent fait son apparition pour aider à rédiger et générer des documents. Compatible avec plusieurs fournisseurs de modèles, il propose un mode conversationnel directement dans les éditeurs, des suggestions contextuelles et la possibilité d'utiliser sa propre clé d'API.`,
      },
      {
        id: 'google-emails-import',
        title: 'Connexion Google, e-mails et import-export',
        body: `L'inscription et la connexion via Google sont disponibles, aux côtés d'une protection anti-robots et du blocage des adresses e-mail jetables. Plusieurs fournisseurs d'envoi d'e-mails sont pris en charge, dont Gmail et un mode SMTP, et les équipes peuvent exporter puis réimporter l'intégralité de leurs données, avec chiffrement optionnel de l'archive.`,
      },
    ],
  },
]

export const CHANGELOG_SECTION_IDS: string[] = CHANGELOG.flatMap((m) => [
  m.id,
  ...m.entries.map((e) => e.id),
])

export const CHANGELOG_READ_MINUTES: number = Math.max(
  1,
  Math.round(
    CHANGELOG.reduce(
      (n, m) => n + m.entries.reduce((s, e) => s + e.body.split(/\s+/).length, 0),
      0
    ) / 200
  )
)
