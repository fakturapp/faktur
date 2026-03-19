# Faktur

<a href="https://fakturapp.cc"><img src="https://img.shields.io/badge/Site-fakturapp.cc-6366f1?style=flat-square" alt="Site" /></a>
<a href="https://dash.fakturapp.cc"><img src="https://img.shields.io/badge/App-dash.fakturapp.cc-818cf8?style=flat-square" alt="App" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/Licence-Personal_Use-ef4444?style=flat-square" alt="Licence" /></a>

Logiciel de facturation gratuit avec chiffrement zero-access. Cr&eacute;ez vos devis et factures en toute confiance &mdash; Faktur chiffre vos donn&eacute;es avec votre mot de passe, m&ecirc;me nous ne pouvons pas les lire.

Ce monorepo contient l'ensemble de l'application :

- **[Faktur Backend](apps/backend)** &mdash; API REST AdonisJS 7 (TypeScript, PostgreSQL, chiffrement AES-256-GCM)
- **[Faktur Frontend](apps/frontend)** &mdash; Application Next.js 16 (React 19, Tailwind CSS v4, Framer Motion)

La licence est disponible dans le fichier [LICENSE](./LICENSE).

Pour la politique de s&eacute;curit&eacute;, voir [SECURITY](./SECURITY.md).

Pour contribuer, voir [CONTRIBUTING](./CONTRIBUTING.md).

Pour l'installation, voir [INSTALL](./INSTALL.md).

## S&eacute;curit&eacute;

Faktur utilise une architecture de chiffrement **zero-access** inspir&eacute;e de [Proton](https://proton.me). Le serveur ne stocke jamais aucune cl&eacute; de d&eacute;chiffrement en clair. Voir [SECURITY.md](./SECURITY.md) pour les d&eacute;tails.

## Licence

**[Personal Use License](LICENSE)** &mdash; Copyright (c) 2026 danbenba

Usage personnel uniquement. Pas d'utilisation commerciale, pas de redistribution, pas de produits d&eacute;riv&eacute;s.
