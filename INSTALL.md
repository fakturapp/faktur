<div align="center">

  <img src="apps/frontend/public/logo.svg" alt="Faktur" height="40" />

  <p><strong>Guide d'installation</strong></p>

</div>

---

## Pr&eacute;requis

| Outil | Version |
|-------|---------|
| [Node.js](https://nodejs.org) | >= 24.0.0 |
| [PostgreSQL](https://www.postgresql.org) | 14+ |
| npm | Inclus avec Node.js |

---

## Installation rapide

```bash
# Cloner le d&eacute;p&ocirc;t
git clone https://github.com/faktur/fakturapp.git
cd faktur

# Installer les d&eacute;pendances
npm install

# Configurer les variables d'environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Cr&eacute;er la base de donn&eacute;es PostgreSQL
createdb faktur

# G&eacute;n&eacute;rer la cl&eacute; d'application
cd apps/backend && node ace generate:key

# Ex&eacute;cuter les migrations
node ace migration:run
cd ../..

# Lancer en d&eacute;veloppement
npm run dev
```

> **Frontend** `http://localhost:3000` &middot; **API** `http://localhost:3333`

---

## Variables d'environnement

### Backend &mdash; `apps/backend/.env`

| Variable | Description | Requis |
|----------|-------------|--------|
| `APP_KEY` | Cl&eacute; secr&egrave;te de l'application | Oui |
| `DB_HOST` | H&ocirc;te PostgreSQL | Oui |
| `DB_PORT` | Port PostgreSQL (d&eacute;faut : `5432`) | Non |
| `DB_USER` | Utilisateur PostgreSQL | Oui |
| `DB_PASSWORD` | Mot de passe PostgreSQL | Oui |
| `DB_DATABASE` | Nom de la base de donn&eacute;es | Oui |
| `RESEND_API_KEY` | Cl&eacute; API [Resend](https://resend.com) pour l'envoi d'emails | Non |
| `GOOGLE_CLIENT_ID` | Client ID Google (Gmail OAuth) | Non |
| `GOOGLE_CLIENT_SECRET` | Secret Google | Non |
| `GOOGLE_REDIRECT_URI` | URI de redirection OAuth | Non |

> G&eacute;n&eacute;rer `APP_KEY` : `cd apps/backend && node ace generate:key`

### Frontend &mdash; `apps/frontend/.env`

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_API_URL` | URL de l'API backend (d&eacute;faut : `http://localhost:3333`) | Non |

---

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer backend + frontend en d&eacute;veloppement |
| `npm run build` | Compiler les deux applications |
| `npm run start` | D&eacute;marrer en production |
| `npm run lint` | Linter le code |
| `npm run typecheck` | V&eacute;rifier les types TypeScript |
| `npm run test` | Ex&eacute;cuter les tests |

### Scripts backend (depuis `apps/backend/`)

| Commande | Description |
|----------|-------------|
| `node ace serve --hmr` | Lancer le serveur avec hot reload |
| `node ace migration:run` | Ex&eacute;cuter les migrations |
| `node ace migration:rollback` | Annuler la derni&egrave;re migration |
| `node ace generate:key` | G&eacute;n&eacute;rer une cl&eacute; d'application |

---

## D&eacute;ploiement

Faktur est d&eacute;ploy&eacute; avec [Dokploy](https://dokploy.com) et [Nixpacks](https://nixpacks.com).

### Production

```bash
# Compiler
npm run build

# D&eacute;marrer
npm run start
```

Assurez-vous que toutes les variables d'environnement requises sont configur&eacute;es avant le d&eacute;marrage en production.

---

## Structure du projet

```
faktur/
├── apps/
│   ├── backend/      API AdonisJS 7      → voir apps/backend/README.md
│   └── frontend/     Application Next.js  → voir apps/frontend/README.md
├── turbo.json        Configuration Turborepo
├── package.json      Workspaces npm
└── LICENSE           Personal Use License
```

---

<div align="center">
  <sub>Voir le <a href="README.md">README principal</a> pour la vue d'ensemble du projet.</sub>
</div>
