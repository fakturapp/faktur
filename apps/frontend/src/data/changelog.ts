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
        body: `Saisissez désormais un **code promo** directement sur la page de paiement, via le lien discret « J'ai un code promo ».

- Validation **en temps réel** par Stripe : le code est accepté, refusé ou signalé comme expiré instantanément.
- Les codes peuvent être **limités à un forfait** (Pro et/ou Team), à une **date d'expiration** et à un **nombre d'utilisations**.
- Tout est créé et géré depuis le **panneau administrateur** — ou directement depuis Stripe, les deux restent synchronisés.`,
      },
      {
        id: 'paiement-fluide',
        title: 'Un paiement plus fluide',
        body: `La page de paiement a été repensée pour aller à l'essentiel.

- Récapitulatif clair : abonnement, **report de votre ancien abonnement**, taxes et montant dû aujourd'hui.
- Une **animation de confirmation** s'affiche dans le bouton dès que le paiement est validé.
- Les messages d'erreur passent désormais par des **notifications** plutôt que d'encombrer le formulaire.`,
      },
      {
        id: 'fiabilite-api',
        title: 'Fiabilité & API à jour',
        body: `Sous le capot, la facturation gagne en robustesse.

- Mise à jour vers la dernière version de l'**API Stripe** (\`2026-05-27.dahlia\`).
- Les événements Stripe sont désormais **traités de façon idempotente** : aucun double traitement, même en cas de renvoi.
- Des **clés d'idempotence** protègent chaque création de coupon, code promo et planification.`,
      },
    ],
  },
  {
    id: 'mai-2026',
    label: 'Mai 2026',
    entries: [
      {
        id: 'abonnements-pro-team',
        title: 'Abonnements Pro & Team',
        body: `Faktur passe au **modèle d'abonnement par équipe** avec trois forfaits : **Gratuit**, **Pro** et **Team**.

- Facturation **mensuelle ou annuelle**, avec une remise sur l'engagement annuel.
- Les prix s'animent lorsque vous basculez entre mensuel et annuel.
- De nouveaux **indicateurs animés** illustrent chaque forfait.`,
      },
      {
        id: 'credit-proratise',
        title: 'Crédit proratisé au changement de forfait',
        body: `Quand vous changez de forfait en cours de période, le **temps déjà payé** de votre ancien abonnement est repris sous forme de crédit, appliqué automatiquement au montant dû.`,
      },
      {
        id: 'retrogradation-programmee',
        title: 'Rétrogradation programmée',
        body: `Une rétrogradation (par exemple Team → Pro, ou annuel → mensuel) ne casse plus rien.

- Vous **conservez votre forfait actuel jusqu'à la fin de la période** déjà payée.
- À cette date, le changement s'applique **automatiquement** — rien n'est prélevé aujourd'hui.
- Vous pouvez **annuler le changement** à tout moment avant l'échéance.`,
      },
      {
        id: 'relances-paiement',
        title: 'Relances de paiement',
        body: `En cas d'échec de paiement, Faktur vous accompagne.

- Une **bannière** apparaît et un **e-mail** vous prévient, avec 7 jours pour régulariser.
- Passé ce délai, l'abonnement repasse automatiquement en **Gratuit**, même hors ligne.`,
      },
      {
        id: 'nouveau-menu',
        title: 'Nouveau menu utilisateur',
        body: `Le menu de profil a été entièrement repensé : sections claires (compte, équipes, aide), changement de **thème** intégré, icônes d'équipe et accès direct au changement de forfait.`,
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
