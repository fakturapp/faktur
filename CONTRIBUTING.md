<div align="center">

  <img src="apps/frontend/public/logo.svg" alt="Faktur" height="40" />

  <p><strong>Guide de contribution</strong></p>

</div>

---

## Avant de contribuer

Faktur est distribu&eacute; sous la [Personal Use License](LICENSE). Le code source est disponible pour transparence et audit, mais les contributions sont limit&eacute;es.

Avant de soumettre une contribution, veuillez prendre connaissance des r&egrave;gles ci-dessous.

---

## Ce que vous pouvez faire

- **Signaler des bugs** via les [issues GitHub](https://github.com/faktur/fakturapp/issues)
- **Signaler des vuln&eacute;rabilit&eacute;s** par email &agrave; security@fakturapp.cc (voir [SECURITY.md](SECURITY.md))
- **Proposer des am&eacute;liorations** via les issues GitHub
- **Soumettre des correctifs** (bugs, fautes, documentation)

---

## Pr&eacute;requis

| Outil | Version |
|-------|---------|
| Node.js | >= 24.0.0 |
| PostgreSQL | 14+ |
| npm | Inclus avec Node.js |

---

## Installation locale

```bash
# Cloner le repo
git clone https://github.com/faktur/fakturapp.git
cd faktur

# Installer les d&eacute;pendances
npm install

# Configurer les variables d'environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Cr&eacute;er la base de donn&eacute;es
createdb faktur

# Ex&eacute;cuter les migrations
cd apps/backend && node ace migration:run && cd ../..

# Lancer en d&eacute;veloppement
npm run dev
```

> **Frontend** `http://localhost:3000` &middot; **API** `http://localhost:3333`

---

## Structure du projet

```
faktur/
├── apps/
│   ├── backend/      API AdonisJS 7
│   └── frontend/     Application Next.js 16
├── turbo.json        Configuration Turborepo
└── package.json      Workspaces npm
```

Consultez les README de chaque application pour plus de d&eacute;tails :
- [`apps/backend/README.md`](apps/backend/README.md)
- [`apps/frontend/README.md`](apps/frontend/README.md)

---

## Soumettre un correctif

### 1. Cr&eacute;er une branche

```bash
git checkout -b fix/description-courte
```

Conventions de nommage :
- `fix/` pour les corrections de bugs
- `feat/` pour les nouvelles fonctionnalit&eacute;s
- `docs/` pour la documentation

### 2. Effectuer vos modifications

- Respectez le style de code existant
- Les contr&ocirc;leurs backend suivent le pattern **single action** (une m&eacute;thode `handle` par classe)
- Les imports backend utilisent les alias `#` (ex : `#models/account/user`)
- L'interface est en fran&ccedil;ais
- Utilisez TypeScript strict

### 3. V&eacute;rifier votre code

```bash
npm run lint
npm run typecheck
npm run build
```

### 4. Cr&eacute;er un commit

Utilisez des messages de commit clairs et concis en anglais :

```bash
git commit -m "fix: description of the fix"
```

Pr&eacute;fixes : `fix:`, `feat:`, `docs:`, `refactor:`, `chore:`

### 5. Ouvrir une Pull Request

- D&eacute;crivez clairement les modifications
- R&eacute;f&eacute;rencez l'issue associ&eacute;e le cas &eacute;ch&eacute;ant
- Assurez-vous que le build passe

---

## R&egrave;gles

- Pas de d&eacute;pendances inutiles
- Pas de code g&eacute;n&eacute;r&eacute; par IA non relu
- Pas de secrets ou cl&eacute;s dans le code
- Respectez la licence du projet

---

## Code de conduite

Ce projet adh&egrave;re au [Code de conduite](CODE_OF_CONDUCT.md). En participant, vous vous engagez &agrave; le respecter.

---

<div align="center">
  <sub>Voir le <a href="README.md">README principal</a> pour la vue d'ensemble du projet.</sub>
</div>
