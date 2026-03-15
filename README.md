<p align="center">
  <img src="apps/frontend/public/logo.svg" alt="Faktur" height="40" />
</p>

<p align="center">
  Logiciel de facturation gratuit et open-source.<br/>
  Créez vos devis, factures et gérez vos clients en toute simplicité.
</p>

---

## Fonctionnalités

- **Devis** — Création, envoi, suivi de statut (brouillon, envoyé, accepté, refusé, expiré)
- **Factures** — Création manuelle ou conversion depuis un devis, suivi de paiement
- **Clients** — Gestion du carnet de clients avec informations complètes
- **PDF** — Génération automatique de documents PDF professionnels
- **Factur-X** — Support du format hybride PDF/XML pour la facturation électronique
- **Authentification** — Inscription, connexion, vérification email, 2FA (TOTP)
- **Équipes** — Multi-équipes avec rôles (super admin, admin, membre, lecteur)
- **Thème** — Mode clair et sombre avec basculement instantané
- **Self-hosted** — Conçu pour être hébergé sur votre propre serveur

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Backend | AdonisJS 7 |
| Base de données | PostgreSQL |
| Monorepo | Turborepo |
| CSS | Tailwind CSS v4 |
| Animations | Framer Motion |

## Installation

```bash
# Cloner le repo
git clone https://github.com/fakturapp/faktur.git
cd faktur

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Exécuter les migrations
cd apps/backend
node ace migration:run
cd ../..

# Lancer en développement
npm run dev
```

## Variables d'environnement

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Hôte PostgreSQL |
| `DB_PORT` | Port PostgreSQL (défaut: 5432) |
| `DB_USER` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `DB_DATABASE` | Nom de la base de données |
| `APP_KEY` | Clé secrète de l'application |
| `SMTP_HOST` | Serveur SMTP pour l'envoi d'emails |
| `SMTP_PORT` | Port SMTP |
| `SMTP_USERNAME` | Utilisateur SMTP |
| `SMTP_PASSWORD` | Mot de passe SMTP |

### Frontend (`apps/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend (défaut: `http://localhost:3333`) |

## Self-hosted

Faktur est conçu pour être auto-hébergé. Déployez-le sur votre propre serveur pour garder le contrôle total de vos données de facturation.

## Liens

- Site : [fakturapp.cc](https://fakturapp.cc)
- GitHub : [github.com/fakturapp/faktur](https://github.com/fakturapp/faktur)

## Licence

[MIT](LICENSE)
