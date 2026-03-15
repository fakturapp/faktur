<p align="center">
  <img src="apps/frontend/public/logo.svg" alt="Faktur" height="40" />
</p>

<p align="center">
  Logiciel de facturation gratuit et open-source.<br/>
  Creez vos devis, factures et gerez vos clients en toute simplicite.
</p>

---

## Fonctionnalites

- **Devis** — Creation, envoi, suivi de statut (brouillon, envoye, accepte, refuse, expire)
- **Factures** — Creation manuelle ou conversion depuis un devis, suivi de paiement
- **Clients** — Gestion du carnet de clients avec informations completes
- **PDF** — Generation automatique de documents PDF professionnels
- **Factur-X** — Support du format hybride PDF/XML pour la facturation electronique
- **Authentification** — Inscription, connexion, verification email, 2FA (TOTP)
- **Equipes** — Multi-equipes avec roles (super admin, admin, membre, lecteur)
- **Theme** — Mode clair et sombre avec basculement instantane
- **Self-hosted** — Concu pour etre heberge sur votre propre serveur

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Backend | AdonisJS 7 |
| Base de donnees | PostgreSQL |
| Monorepo | Turborepo |
| CSS | Tailwind CSS v4 |
| Animations | Framer Motion |

## Installation

```bash
# Cloner le repo
git clone https://github.com/fakturapp/faktur.git
cd faktur

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Executer les migrations
cd apps/backend
node ace migration:run
cd ../..

# Lancer en developpement
npm run dev
```

## Variables d'environnement

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Hote PostgreSQL |
| `DB_PORT` | Port PostgreSQL (defaut: 5432) |
| `DB_USER` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Mot de passe PostgreSQL |
| `DB_DATABASE` | Nom de la base de donnees |
| `APP_KEY` | Cle secrete de l'application |
| `SMTP_HOST` | Serveur SMTP pour l'envoi d'emails |
| `SMTP_PORT` | Port SMTP |
| `SMTP_USERNAME` | Utilisateur SMTP |
| `SMTP_PASSWORD` | Mot de passe SMTP |

### Frontend (`apps/frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend (defaut: `http://localhost:3333`) |

## Self-hosted

Faktur est concu pour etre auto-heberge. Deployez-le sur votre propre serveur pour garder le controle total de vos donnees de facturation.

## Liens

- Site : [fakturapp.cc](https://fakturapp.cc)
- GitHub : [github.com/fakturapp/faktur](https://github.com/fakturapp/faktur)

## Licence

[MIT](LICENSE)
