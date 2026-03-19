<div align="center">

  <img src="public/logo.svg" alt="Faktur" height="40" />

  <p><strong>Faktur Frontend — Application Next.js 16</strong></p>

  <p>
    Interface utilisateur de Faktur.<br/>
    App Router, Tailwind CSS v4, Framer Motion, thème sombre par défaut.
  </p>

</div>

---

## Vue d'ensemble

Le frontend est une application [Next.js 16](https://nextjs.org) avec App Router et Turbopack. Il communique avec l'API backend via un client REST avec authentification Bearer.

L'interface est entièrement en français, avec un système d'internationalisation pour les documents PDF (factures, devis).

---

## Stack

| | Technologie |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) · React 19 · Turbopack |
| **Styles** | [Tailwind CSS v4](https://tailwindcss.com) · class-variance-authority |
| **Animations** | [Framer Motion](https://www.framer.com/motion) |
| **Icônes** | [Lucide React](https://lucide.dev) |
| **Graphiques** | [Recharts](https://recharts.org) |
| **WebGL** | [OGL](https://ogl.dev) |
| **TypeScript** | 5.9 (strict mode) |

---

## Structure

```
src/
├── app/
│   ├── (auth)/                 Route group — Pages d'authentification
│   │   ├── login/              Connexion
│   │   ├── register/           Inscription
│   │   ├── 2fa/                Vérification 2FA
│   │   ├── forgot-password/    Mot de passe oublié
│   │   ├── reset-password/     Réinitialisation
│   │   ├── verify-email/       Vérification email
│   │   └── invite/[token]/     Acceptation d'invitation
│   │
│   ├── dashboard/              Pages principales
│   │   ├── page.tsx            Tableau de bord
│   │   ├── clients/            Gestion clients (liste, création, édition)
│   │   ├── invoices/           Factures (liste, brouillons, création, édition)
│   │   ├── quotes/             Devis (liste, brouillons, création, édition)
│   │   ├── company/            Informations entreprise
│   │   ├── account/            Compte utilisateur (profil, sécurité, sessions)
│   │   ├── team/               Gestion d'équipe (membres, invitations)
│   │   ├── settings/           Paramètres (email, factures)
│   │   └── about/              À propos
│   │
│   ├── onboarding/             Flux d'onboarding (répertoire réel)
│   │   ├── team/               Création d'équipe
│   │   ├── company/            Configuration entreprise
│   │   ├── personalization/    Personnalisation
│   │   ├── email/              Configuration email
│   │   └── billing/            Configuration facturation
│   │
│   ├── layout.tsx              Layout racine (providers)
│   ├── page.tsx                Redirection (/ → dashboard ou login)
│   └── globals.css             Styles globaux (Tailwind v4)
│
├── components/
│   ├── ui/                     21 composants de base (Button, Dialog, Input, etc.)
│   ├── modals/                 Modales (crypto-reset, export, security-verification)
│   ├── layout/                 Sidebar, header, barre de progression
│   ├── clients/                Composants spécifiques clients
│   ├── invoices/               Composants spécifiques factures
│   ├── quotes/                 Composants spécifiques devis
│   ├── dashboard/              Composants tableau de bord
│   └── shared/                 Composants partagés
│
├── hooks/
│   └── use-unsaved-changes.ts  Prévention de navigation avec changements non sauvegardés
│
├── lib/
│   ├── api.ts                  Client API REST (Bearer auth, gestion sessions)
│   ├── auth.tsx                AuthProvider + useAuth hook
│   ├── theme.tsx               ThemeProvider (sombre / clair / système)
│   ├── i18n.tsx                Internationalisation
│   ├── invoice-i18n.ts         Traductions documents (FR/EN)
│   ├── invoice-settings-context.tsx   Cache paramètres factures
│   ├── invoice-templates.ts    Définition des templates PDF
│   ├── email-context.tsx       Contexte comptes email
│   └── utils.ts                Utilitaire cn() (clsx + tailwind-merge)
│
└── locales/
    ├── fr.json                 Traductions françaises
    └── en.json                 Traductions anglaises
```

---

## Design system

Le design utilise un thème sombre par défaut basé sur les couleurs **zinc** avec un accent **indigo**.

| Token | Valeur |
|-------|--------|
| Background | zinc-950 / zinc-900 |
| Cards | zinc-800 |
| Accent | indigo-500 |
| Texte primaire | zinc-50 |
| Texte secondaire | zinc-400 |

Les composants UI (`src/components/ui/`) utilisent :
- **CVA** (class-variance-authority) pour les variantes de style
- **cn()** (clsx + tailwind-merge) pour la composition de classes
- **Framer Motion** pour les animations et transitions

---

## Flux d'authentification

```
Inscription → Vérification email → Connexion
                                      │
                                      ├── Si 2FA activé → Code TOTP
                                      │
                                      ▼
                                  Token Bearer
                                      │
                                      ├── onboardingCompleted = false → /onboarding/team
                                      ├── cryptoResetNeeded = true → Modal récupération crypto
                                      └── OK → /dashboard
```

Le `AuthProvider` (dans `lib/auth.tsx`) gère toute la logique de redirection et expose le hook `useAuth()` avec : `user`, `loading`, `login()`, `logout()`, `refreshUser()`.

Le token est stocké dans `localStorage` sous la clé `faktur_token`.

---

## Développement

```bash
# Depuis la racine du monorepo
npm run dev

# Depuis apps/frontend
npm run dev    # Next.js avec Turbopack (port 3000)
npm run build  # Compilation production
npm run start  # Serveur de production
```

---

## Licence

**[Personal Use License](../../LICENSE)** — Copyright (c) 2026 danbenba

---

<div align="center">
  <sub>Voir le <a href="../../README.md">README principal</a> pour la vue d'ensemble du projet.</sub>
</div>
