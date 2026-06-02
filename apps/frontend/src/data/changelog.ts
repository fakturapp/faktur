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
        body: `Les codes promotionnels font leur entrée au moment du paiement. Un champ dédié sur la page de règlement permet d'appliquer une réduction avant de valider son abonnement, avec un recalcul immédiat du montant à régler et une réduction détaillée à côté du sous-total et du total. Une animation de confirmation vient saluer chaque transaction réussie. Côté coulisses, vous créez, listez et désactivez vos codes en quelques clics depuis le [panneau administrateur](/dashboard/admin/promo-codes), et les évènements de paiement sont dédupliqués pour qu'une réduction ne soit jamais comptée deux fois.`,
      },
      {
        id: 'changements-forfait',
        title: 'Changements de forfait en cours de période',
        body: `La gestion des abonnements gagne en souplesse, car changer de formule ne vous fait plus jamais perdre le temps déjà payé. Une montée en gamme s'applique immédiatement via le paiement intégré, avec un crédit correspondant au temps restant, tandis qu'une rétrogradation est programmée pour la fin de la période en cours, sans interruption de service. Le passage du mensuel à l'annuel se fait à la souscription, et l'annuel vers le mensuel est planifié pour la fin de la période. Un récapitulatif clair affiche la prochaine échéance ainsi que l'indication « Vous passerez à … le … », avec la possibilité d'annuler le changement programmé à tout moment.`,
      },
      {
        id: 'relances-paiement',
        title: 'Suivi des paiements et relances automatiques',
        body: `Faktur veille désormais sur la santé de votre abonnement et vous prévient au bon moment. En cas d'échec de prélèvement, le propriétaire de l'équipe reçoit un courriel l'informant du délai de grâce de sept jours, envoyé une seule fois par cycle quel que soit l'ordre des évènements. Une bannière dans le tableau de bord ouvre directement le portail de paiement pour régulariser la situation, et un automatisme rétrograde proprement les équipes qui dépassent le délai, même hors connexion. Le statut est suivi en quasi temps réel pour que la bannière disparaisse dès la régularisation.`,
      },
      {
        id: 'gestion-abonnement',
        title: "Page de gestion d'abonnement repensée",
        body: `La [page des forfaits](/dashboard/settings/plan) adopte un design plus généreux et beaucoup plus lisible. On y retrouve des cartes de forfait agrandies avec un indicateur visuel animé propre à chaque niveau d'offre, l'affichage du véritable moyen de paiement enregistré, qu'il s'agisse d'une carte avec sa marque et ses quatre derniers chiffres ou de Link, ainsi que l'historique complet des factures, consultable et paginé sur toutes les formules. Un écran de bienvenue festif, avec confettis et badge « Actif » animé, accompagne chaque souscription.`,
      },
      {
        id: 'checkout-facture',
        title: 'Paiement en page facture',
        body: `La page de paiement adopte l'apparence d'une véritable facture Faktur, pour un parcours d'achat sobre et rassurant. Le récapitulatif se présente comme une facture, avec un en-tête dédié, un champ de carte épuré et une mise en page minimaliste inspirée des meilleures expériences de paiement. Lors d'un changement de forfait, la ligne de crédit correspondant au temps déjà payé y figure clairement, pour que le montant débité ne réserve aucune surprise.`,
      },
      {
        id: 'synchronisation-stripe',
        title: 'Synchronisation et états Stripe',
        body: `L'abonnement se resynchronise automatiquement avec Stripe à chaque ouverture du tableau de bord, de façon discrète, limitée et réservée au propriétaire. Faktur sait désormais reconnaître les états particuliers : une annulation effectuée depuis Stripe est détectée et reflétée dans l'application, une suspension affiche un état clair avec un badge et une marche à suivre, et les abonnements orphelins sont réconciliés automatiquement pour éviter toute incohérence.`,
      },
      {
        id: 'plan-suivi-temps-reel',
        title: 'Forfait à jour partout',
        body: `Le forfait affiché dans la barre latérale se met à jour tout seul, sans avoir à visiter la page des forfaits. Une rétrogradation programmée ou un changement de formule se reflète quasi instantanément dans l'interface, grâce à une actualisation automatique après chaque synchronisation et à un rafraîchissement périodique. La barre latérale gagne au passage une présentation plus affirmée de la marque, avec le suffixe du forfait et un accès simplifié à la mise à niveau.`,
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
        body: `Faktur introduit ses formules d'abonnement, déclinées en facturation mensuelle ou annuelle, avec trois offres pour s'adapter à chaque usage. L'offre Gratuit permet de démarrer et de gérer ses premiers documents, l'offre Pro s'adresse aux indépendants qui veulent aller plus loin, et l'offre Team accompagne les équipes qui collaborent au quotidien. La souscription, le changement de formule et la gestion se font directement dans l'application via un [paiement intégré](/dashboard/settings/plan/upgrade), et l'état de l'abonnement reste synchronisé en permanence pour refléter au plus juste la situation de chaque équipe.`,
      },
      {
        id: 'portail-api',
        title: 'Portail développeurs et API publique',
        body: `Un véritable portail développeurs voit le jour, accompagné d'une API publique complète qui couvre l'ensemble de vos ressources, des factures aux devis et avoirs, en passant par les clients, les produits, les dépenses, les factures récurrentes et les informations d'entreprise. Les développeurs peuvent créer des clés d'API par projet, définir des permissions fines, restreindre les accès par adresse IP et configurer des webhooks pour être notifiés en temps réel de chaque évènement.`,
      },
      {
        id: 'documentation-developpeurs',
        title: 'Documentation et explorateur',
        body: `La documentation développeurs s'enrichit d'un contenu complet et soigné, avec des pages de référence pour chaque ressource et les formats attendus, les concepts clés que sont l'authentification, les erreurs, la pagination, les limites d'appels, les webhooks et l'idempotence, ainsi que des tutoriels de bout en bout et des exemples de code prêts à copier. L'explorateur d'API permet de composer une requête, de choisir une clé et une méthode, puis d'observer la réponse mise en forme et coloriée, sans quitter le portail.`,
      },
      {
        id: 'quotas-api',
        title: "Suivi de l'usage de l'API",
        body: `Une page d'usage présente votre consommation d'API en temps réel. Vous y suivez une fenêtre de session glissante de cinq heures qui démarre au premier appel, un quota hebdomadaire roulant sur sept jours, et les vingt requêtes les plus récentes avec leur adresse IP et leur statut. Chaque appel est journalisé et apparaît dans le flux d'activité, et un bouton de rafraîchissement met à jour les compteurs à la demande.`,
      },
      {
        id: 'chiffrement-modes',
        title: 'Modes de chiffrement Privé et Standard',
        body: `Chaque équipe peut désormais choisir son niveau de protection. Le mode Privé conserve le chiffrement de bout en bout, où seul vous détenez les clés, tandis que le mode Standard offre une expérience plus fluide pour les usages qui ne nécessitent pas ce niveau d'isolement, notamment l'accès par l'API. Une assistance guidée permet de migrer d'un mode à l'autre en toute sécurité, et l'interface indique clairement le mode actif de l'équipe par un badge dédié.`,
      },
      {
        id: 'admin',
        title: "Panneau d'administration enrichi",
        body: `Le panneau d'administration s'étoffe d'une vue détaillée des utilisateurs et des équipes, organisée par profils et par hiérarchie. Les administrateurs peuvent modifier un compte, vérifier une adresse ou supprimer un utilisateur, renommer une équipe, ajuster son forfait ou la supprimer, et consulter la composition des équipes ainsi que les rôles de chacun. Chaque action sensible est protégée par une confirmation par mot de passe administrateur et, pour les suppressions, par une saisie de confirmation.`,
      },
      {
        id: 'modeles-emails',
        title: "Personnalisation des modèles d'e-mails",
        body: `Un éditeur dédié permet de personnaliser entièrement les modèles d'e-mails envoyés à vos clients, avec une coloration syntaxique, un formateur intégré, un aperçu façon messagerie présenté avec ou sans données d'exemple, et un retour au modèle d'origine d'un simple clic. Les courriels de facture, de devis et d'avoir bénéficient de gabarits soignés et entièrement traduits en français.`,
      },
      {
        id: 'documents-multipages',
        title: 'Documents multi-pages et aperçu fidèle',
        body: `L'éditeur gère désormais les documents qui s'étendent sur plusieurs pages A4, avec une pagination naturelle proche d'un traitement de texte et un passage automatique à la page suivante. L'aperçu affiche le véritable PDF généré, page par page, avec un sélecteur de page, et une mise en cache intelligente ne recalcule le document que lorsqu'il change, pour une prévisualisation instantanée. Un avertissement signale clairement lorsque le contenu dépasse la page.`,
      },
      {
        id: 'numerotation-civilite',
        title: 'Numérotation et civilité',
        body: `Une page dédiée à la numérotation permet de composer le format de vos numéros de facture et de devis grâce à un éditeur de variables avec aperçu en direct, de forcer le prochain numéro lorsque c'est nécessaire, et de visualiser le rendu final sur une maquette de document. Les fiches clients gagnent par ailleurs une civilité, M. ou Mme, affichée devant le nom dans l'éditeur comme sur le document final.`,
      },
      {
        id: 'parcours-suppression',
        title: 'Parcours guidés et reprise de progression',
        body: `Les actions sensibles passent désormais par des assistants en pleine page qui identifient clairement l'équipe concernée, qu'il s'agisse de quitter une équipe dont vous n'êtes pas propriétaire, de transférer la propriété à un autre membre, ou de supprimer une équipe ou votre compte. Le parcours de suppression reprend exactement là où vous vous étiez arrêté, et chaque issue, réussie ou annulée, vous ramène au bon endroit avec un message clair.`,
      },
      {
        id: 'audit-trail',
        title: "Journal d'activité",
        body: `Les évènements importants liés à vos documents et à votre facturation électronique sont désormais consignés, depuis la création et la modification des factures jusqu'aux changements de statut et aux paiements, sans oublier les exports PDF et les soumissions à la plateforme de dématérialisation. Cette traçabilité apporte un suivi précieux pour la gestion et la conformité.`,
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
        body: `Faktur adopte une toute nouvelle identité visuelle, inspirée de Link by Stripe et de Revolut. La refonte touche tout l'écran, avec une bibliothèque de composants entièrement repensée et des jetons de design cohérents, des tableaux de bord, des listes et des formulaires redessinés un à un, des fenêtres, des menus et des pages d'authentification harmonisés, ainsi que des animations soignées et des fonds en dégradés colorés. Le résultat est une expérience moderne, fluide et homogène d'un bout à l'autre de l'application.`,
      },
      {
        id: 'liens-paiement',
        title: 'Liens de paiement et règlement en ligne',
        body: `Il devient possible de générer un lien de paiement pour une facture et de l'envoyer à votre client. Le parcours complet est pris en charge, avec une page de paiement publique et sécurisée où le client règle par carte, des notifications par e-mail à chaque étape, un suivi des statuts de règlement, une confirmation automatique du paiement qui promeut la facture en envoyée, et l'expiration automatique du lien quelques minutes après la confirmation.`,
      },
      {
        id: 'collaboration',
        title: 'Collaboration en temps réel',
        body: `Plusieurs membres d'une équipe peuvent désormais travailler ensemble sur un même document. La collaboration affiche les curseurs et la présence des collaborateurs en direct, synchronise les modifications à la volée champ par champ, et permet de partager un document via un lien avec gestion des accès et des permissions, sans oublier un mode lecture seule et une notification lorsqu'un collaborateur enregistre.`,
      },
      {
        id: 'oauth',
        title: 'Applications connectées et OAuth',
        body: `Faktur ouvre un système d'autorisation complet, permettant à des applications tierces et à l'application de bureau de se connecter de façon sécurisée. Un écran de consentement clair détaille les accès demandés, une page recense les applications connectées et permet de les déconnecter, et les administrateurs gèrent les applications, font tourner leurs secrets et révoquent les sessions.`,
      },
      {
        id: 'passkeys',
        title: "Clés d'accès et connexion par e-mail",
        body: `L'authentification se modernise avec la prise en charge des clés d'accès, qui permettent de se connecter par biométrie sans saisir de mot de passe. Une page de gestion dédiée dans les paramètres de sécurité permet d'en ajouter, d'en renommer et d'en supprimer, et le parcours de connexion commence désormais par l'adresse e-mail, avec une vérification en direct et des animations.`,
      },
      {
        id: 'academy-desktop',
        title: 'Faktur Academy et application de bureau',
        body: `Un système de tutoriel guidé en dix niveaux, baptisé Faktur Academy, accompagne désormais les nouveaux utilisateurs, avec un bac à sable pour s'exercer sans risque et un surlignage des éléments à l'écran. Une [page de téléchargement](/download) présente par ailleurs les applications de bureau et mobiles, avec la détection automatique de votre plateforme et une carte de mise à jour intégrée lorsque vous utilisez Faktur Desktop.`,
      },
      {
        id: 'tableau-bord-bento',
        title: 'Tableau de bord personnalisable',
        body: `La page d'accueil adopte une disposition en mosaïque que vous pouvez réorganiser à votre main. Déplacez les cartes par glisser-déposer en activant le mode édition, choisissez parmi plusieurs cartes thématiques selon vos priorités, et profitez d'un fond animé aux dégradés colorés qui s'adapte au thème.`,
      },
      {
        id: 'quota-ai',
        title: "Quotas pour l'assistant IA",
        body: `L'assistant Faktur AI dispose désormais d'un suivi de consommation transparent. Des limites horaires et hebdomadaires sont affichées directement dans ses réglages, chaque requête est journalisée, et l'usage est contrôlé de façon équitable dans toute l'application pour que vous sachiez à tout moment où vous en êtes.`,
      },
      {
        id: 'sidebar-repliable',
        title: 'Barre latérale repliable',
        body: `La barre latérale peut désormais se replier pour ne montrer que des icônes centrées, puis se déployer au survol grâce à une animation fluide. Elle gagne aussi une carte de mise à jour pour l'application de bureau et une entrée dédiée à l'installation, pour garder l'essentiel à portée de clic.`,
      },
      {
        id: 'editeur-logo',
        title: 'Éditeur de logo interactif',
        body: `Un éditeur de logo s'intègre directement à la feuille A4. Vous pouvez importer une image, la redimensionner, arrondir ses coins ou la retirer en quelques gestes, et le logo se manipule là où il apparaît, dans les factures, les devis et les avoirs.`,
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
        body: `Faktur voit le jour avec tout l'essentiel d'une solution de facturation moderne, à savoir la création de compte et la gestion des équipes avec rôles et invitations, les fiches clients et le catalogue de produits, un système de factures et de devis complet avec numérotation automatique et génération de PDF, et un tableau de bord qui offre une vue d'ensemble de l'activité, statistiques et graphiques de chiffre d'affaires à l'appui.`,
      },
      {
        id: 'devis-avoirs',
        title: 'Devis, avoirs et factures récurrentes',
        body: `Au-delà de la facture classique, Faktur couvre tout le cycle de vos documents, avec la création de devis convertibles en factures en un clic, la gestion des avoirs générés depuis une facture, les factures récurrentes produites automatiquement, et le suivi des dépenses avec extraction des reçus par reconnaissance optique. Les paiements partiels, les relances et la détection automatique des factures en retard complètent la gestion du quotidien.`,
      },
      {
        id: 'editeur-modeles',
        title: 'Éditeur de documents et modèles personnalisables',
        body: `L'éditeur permet de composer ses documents directement sur une feuille A4 interactive. Vous modifiez les champs en place sans formulaire séparé, mettez en forme le texte grâce à une barre d'outils enrichie, choisissez parmi une dizaine de modèles au style distinct, et personnalisez le logo, les polices, le pied de page et les couleurs. Les noms de fichiers PDF et les motifs de numérotation sont eux aussi entièrement configurables.`,
      },
      {
        id: 'chiffrement-zero-acces',
        title: 'Chiffrement zéro accès et coffre-fort',
        body: `Faktur protège les données sensibles grâce à un chiffrement de bout en bout dit à zéro accès, où seul l'utilisateur détient les clés. Le dispositif repose sur un coffre-fort qui se déverrouille à la connexion, une clé de récupération pour retrouver l'accès en cas d'oubli, et une procédure de récupération qui sécurise les changements de mot de passe.`,
      },
      {
        id: 'e-invoicing',
        title: 'Facturation électronique et Factur-X',
        body: `En anticipation de la réforme de la facturation électronique, Faktur intègre les briques nécessaires à la conformité, à savoir la génération de factures au format Factur-X conforme au profil EN 16931, la transmission via une plateforme de dématérialisation partenaire, et les champs réglementaires requis dont la catégorie d'opération. Des rapports de TVA, un export FEC et une prévision de trésorerie viennent enrichir la dimension comptable.`,
      },
      {
        id: 'faktur-ai',
        title: 'Assistant Faktur AI',
        body: `Un assistant intelligent fait son apparition pour aider à rédiger et générer des documents. Compatible avec plusieurs fournisseurs de modèles, il propose un mode conversationnel directement dans les éditeurs, des suggestions contextuelles adaptées à votre document, et la possibilité d'utiliser votre propre clé d'API.`,
      },
      {
        id: 'google-emails-import',
        title: 'Connexion Google, e-mails et import-export',
        body: `Plusieurs portes d'entrée et de sortie s'ouvrent pour vos comptes et vos données, avec l'inscription et la connexion via Google, une protection anti-robots et le blocage des adresses e-mail jetables, plusieurs fournisseurs d'envoi d'e-mails dont Gmail et un mode SMTP, et l'export puis le réimport de l'intégralité des données d'une équipe, avec chiffrement optionnel de l'archive.`,
      },
      {
        id: 'comptes-bancaires',
        title: 'Comptes bancaires et coordonnées',
        body: `Faktur permet d'enregistrer plusieurs comptes bancaires chiffrés et de les associer à vos factures, avec un formatage automatique des champs IBAN et BIC, la récupération automatique du logo de la banque, et la possibilité de masquer les coordonnées sensibles à l'écran comme sur le document PDF.`,
      },
      {
        id: 'onboarding-multi-etapes',
        title: 'Parcours de bienvenue guidé',
        body: `Un parcours d'accueil en plusieurs étapes accompagne la création d'une équipe et vous aide à renseigner les informations de l'entreprise, à saisir un numéro de téléphone avec recherche d'indicatif, et à importer un logo puis régler les options de facturation. La saisie d'adresse profite par ailleurs d'une autocomplétion pour aller plus vite.`,
      },
      {
        id: 'themes-i18n',
        title: 'Thèmes clair, sombre et bilingue',
        body: `L'application s'adapte à vos préférences et à votre langue. Vous basculez entre un thème clair et un thème sombre, choisissez une couleur d'accent personnalisée, et utilisez l'interface comme vous générez vos documents, en français ou en anglais.`,
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
