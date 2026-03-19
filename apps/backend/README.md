<div align="center">

  <img src="../frontend/public/logo.svg" alt="Faktur" height="40" />

  <p><strong>Faktur Backend — API REST AdonisJS 7</strong></p>

  <p>
    API de facturation avec chiffrement zero-access, authentification 2FA<br/>
    et génération PDF Factur-X.
  </p>

</div>

---

## Vue d'ensemble

Le backend est une API REST construite avec [AdonisJS 7](https://adonisjs.com), qui gère l'ensemble de la logique métier : authentification, gestion des équipes, création de devis et factures, chiffrement des données sensibles, génération de PDF et envoi d'emails.

Chaque contrôleur suit le pattern **single action** (une méthode `handle` par classe). Les imports utilisent les alias `#` d'AdonisJS (ex : `#models/account/user`, `#services/crypto/zero_access_crypto_service`).

---

## Stack

| | Technologie |
|---|---|
| **Framework** | [AdonisJS 7](https://adonisjs.com) · TypeScript 5.9 |
| **ORM** | [Lucid](https://lucid.adonisjs.com) (PostgreSQL) |
| **Validation** | [VineJS](https://vinejs.dev) |
| **Auth** | Bearer tokens · 2FA TOTP ([speakeasy](https://github.com/speakeasyjs/speakeasy)) |
| **Chiffrement** | AES-256-GCM · Argon2id · HKDF |
| **PDF** | Puppeteer (Chrome headless) · Factur-X (XML) |
| **Email** | [Resend](https://resend.com) · Gmail OAuth |
| **Sécurité** | Helmet · Shield (CSRF) · Rate limiting |
| **Tests** | [Japa](https://japa.dev) |

---

## Structure

```
app/
├── controllers/
│   ├── auth/           Inscription, connexion, 2FA, mot de passe, email verification
│   │   ├── session/    Login, logout, me
│   │   └── security/   2FA, crypto recover, crypto wipe
│   ├── account/        Profil, avatar, email, mot de passe, sessions
│   ├── client/         CRUD clients, recherche SIREN
│   ├── company/        Informations entreprise, finances, logo
│   ├── dashboard/      Statistiques, graphiques, compteurs
│   ├── einvoicing/     Soumission e-facturation (PDP)
│   ├── email/          Comptes email, OAuth Gmail, envoi, logs
│   ├── invoice/        CRUD factures, export PDF, opérations
│   ├── onboarding/     Création équipe, entreprise, personnalisation
│   ├── quote/          CRUD devis, export PDF, opérations
│   ├── settings/       Paramètres factures, upload logo
│   └── team/           CRUD équipes, invitations, membres
│
├── middleware/
│   ├── auth/           auth, emailVerified, twoFactorVerified, onboardingCompleted
│   ├── core/           containerBindings, forceJsonResponse
│   ├── crypto/         vault (déchiffrement zero-access en mémoire)
│   └── security/       helmet, rate limiting
│
├── models/
│   ├── account/        User, LoginHistory
│   ├── client/         Client
│   ├── email/          EmailAccount, EmailLog
│   ├── invoice/        Invoice, InvoiceLine
│   ├── quote/          Quote, QuoteLine
│   ├── shared/         AuditLog
│   └── team/           Team, TeamMember, Company, BankAccount, InvoiceSetting
│
├── services/
│   ├── auth/           Gestion des tokens, service 2FA
│   ├── crypto/         zero_access_crypto_service, field_encryption_helper, key_store
│   ├── pdf/            Génération PDF, templates HTML, Factur-X
│   ├── email/          Envoi d'emails (Resend, Gmail)
│   ├── einvoicing/     Intégration PDP (plateforme de dématérialisation)
│   └── team/           Logique métier équipes
│
├── validators/         Schémas de validation VineJS
└── transformers/       Transformation des réponses API
```

---

## Chiffrement zero-access

L'architecture cryptographique est inspirée de [Proton Mail](https://proton.me). Le serveur ne stocke jamais aucune clé de déchiffrement en clair.

### Flux de chiffrement

```
                        ┌─────────────────────────────────┐
                        │         Mot de passe             │
                        └────────────┬────────────────────┘
                                     │
                              Argon2id (64 Mo, 3 itérations)
                                     │
                                     ▼
                        ┌─────────────────────────────────┐
                        │    KEK (Key Encryption Key)      │
                        │    Jamais stockée sur le serveur  │
                        └────────────┬────────────────────┘
                                     │
                              AES-256-GCM
                                     │
                                     ▼
                        ┌─────────────────────────────────┐
                        │    DEK (Data Encryption Key)     │
                        │    Unique par équipe              │
                        │    Stockée chiffrée en base       │
                        └────────────┬────────────────────┘
                                     │
                              AES-256-GCM (IV unique par opération)
                                     │
                                     ▼
                        ┌─────────────────────────────────┐
                        │    Champs chiffrés               │
                        │    Noms, emails, adresses,       │
                        │    IBAN, BIC, notes               │
                        └─────────────────────────────────┘
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `services/crypto/zero_access_crypto_service.ts` | Dérivation KEK, chiffrement/déchiffrement DEK |
| `services/crypto/field_encryption_helper.ts` | Chiffrement par champ (AES-256-GCM) |
| `services/crypto/key_store.ts` | Stockage de la DEK déchiffrée en mémoire (par session) |
| `middleware/crypto/vault.ts` | Middleware qui déchiffre la DEK à chaque requête authentifiée |
| `controllers/auth/security/crypto_recover.ts` | Récupération crypto après changement de mot de passe |
| `controllers/auth/security/crypto_wipe.ts` | Suppression complète des données (avec confirmation mot de passe) |

### Scénario de compromission

Même avec un accès complet au serveur, un attaquant obtient :

| Donnée | État |
|--------|------|
| Champs sensibles | Chiffrés : `v1:<salt>:<iv>:<ciphertext>` |
| DEK | Chiffrée avec la KEK (inutilisable sans le mot de passe) |
| Salt Argon2id | Inutile sans le mot de passe |
| `APP_KEY` | N'intervient pas dans le chiffrement zero-access |
| Code source | Ne contient aucun secret cryptographique |

---

## Endpoints principaux

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/sign-up` | Inscription |
| `POST` | `/auth/verify-email` | Vérification email |
| `POST` | `/auth/login` | Connexion |
| `POST` | `/auth/login/2fa` | Vérification 2FA |
| `POST` | `/auth/password/forgot` | Demande de réinitialisation |
| `POST` | `/auth/password/reset` | Réinitialisation du mot de passe |
| `GET` | `/auth/me` | Utilisateur courant |
| `POST` | `/auth/logout` | Déconnexion |
| `POST` | `/auth/crypto/recover` | Récupération crypto |
| `POST` | `/auth/crypto/wipe` | Suppression des données |

### Ressources

| Domaine | Routes | Description |
|---------|--------|-------------|
| Clients | `/clients` | CRUD + recherche SIREN |
| Devis | `/quotes` | CRUD + export PDF + opérations |
| Factures | `/invoices` | CRUD + export PDF + conversion + paiement |
| Équipes | `/teams` | CRUD + invitations + membres |
| Entreprise | `/company` | Profil entreprise + finances |
| Paramètres | `/settings` | Configuration documents |
| Email | `/email` | Comptes + envoi + logs |
| Dashboard | `/dashboard` | Statistiques + graphiques |

---

## Base de données

25 fichiers de migration couvrant :

- **Utilisateurs** — Comptes avec 2FA, vérification email, colonnes crypto (saltKdf, keyVersion, cryptoResetNeeded)
- **Équipes** — Workspaces avec rôles (super_admin, admin, member, reader)
- **Entreprises** — Profils légaux (SIREN, SIRET, TVA)
- **Clients** — Contacts avec champs chiffrés
- **Devis / Factures** — Documents avec lignes, TVA, remises
- **Comptes bancaires** — IBAN/BIC chiffrés
- **Emails** — Comptes OAuth, logs d'envoi
- **Paramètres** — Templates PDF, numérotation, personnalisation
- **Audit** — Historique de connexion, journal d'audit

Toutes les tables utilisent des **UUID** comme clé primaire (`gen_random_uuid()`).

---

## Développement

```bash
# Depuis la racine du monorepo
npm run dev

# Depuis apps/backend
node ace serve --hmr

# Migrations
node ace migration:run
node ace migration:rollback

# Générer une clé d'application
node ace generate:key
```

---

## Licence

**[Personal Use License](../../LICENSE)** — Copyright (c) 2026 danbenba

---

<div align="center">
  <sub>Voir le <a href="../../README.md">README principal</a> pour la vue d'ensemble du projet.</sub>
</div>
