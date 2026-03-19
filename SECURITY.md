<div align="center">

  <img src="apps/frontend/public/logo.svg" alt="Faktur" height="40" />

  <p><strong>Politique de s&eacute;curit&eacute;</strong></p>

</div>

---

## Signaler une vuln&eacute;rabilit&eacute;

La s&eacute;curit&eacute; des donn&eacute;es de nos utilisateurs est une priorit&eacute; absolue. Si vous d&eacute;couvrez une vuln&eacute;rabilit&eacute;, merci de la signaler de mani&egrave;re responsable.

**Ne cr&eacute;ez pas d'issue publique.** Envoyez un email &agrave; :

> **contact@fakturapp.cc**

Incluez dans votre rapport :

- Une description claire de la vuln&eacute;rabilit&eacute;
- Les &eacute;tapes pour la reproduire
- L'impact potentiel estim&eacute;
- Une suggestion de correctif, si possible

Nous nous engageons &agrave; :

- Accuser r&eacute;ception sous **48 heures**
- Fournir une &eacute;valuation initiale sous **7 jours**
- Corriger les vuln&eacute;rabilit&eacute;s critiques dans les plus brefs d&eacute;lais

---

## Architecture de chiffrement

Faktur utilise une architecture de chiffrement **zero-access** inspir&eacute;e de [Proton Mail](https://proton.me). Le serveur ne stocke jamais aucune cl&eacute; de d&eacute;chiffrement en clair.

### Hi&eacute;rarchie des cl&eacute;s

```
Mot de passe ─── Argon2id (64 Mo, 3 it&eacute;rations) ───→ KEK (Key Encryption Key)
                                                          │
                                                   AES-256-GCM
                                                          │
                                                          ▼
                                                    DEK (Data Encryption Key)
                                                    Unique par &eacute;quipe
                                                          │
                                                   AES-256-GCM (IV unique)
                                                          │
                                                          ▼
                                                   Champs chiffr&eacute;s
```

### Donn&eacute;es prot&eacute;g&eacute;es

| Donn&eacute;e | M&eacute;thode |
|--------|----------|
| Noms et contacts clients | AES-256-GCM par champ |
| Adresses email | AES-256-GCM par champ |
| Adresses postales | AES-256-GCM par champ |
| IBAN / BIC | AES-256-GCM par champ |
| Notes et commentaires | AES-256-GCM par champ |
| Mots de passe | Scrypt (hash, jamais stock&eacute;s en clair) |
| Secrets 2FA | Chiffr&eacute;s avec `APP_KEY` (AdonisJS) |

### Ce que le serveur ne stocke jamais

- Le mot de passe en clair
- La KEK (d&eacute;riv&eacute;e &agrave; chaque session, jamais persist&eacute;e)
- La DEK en clair (stock&eacute;e uniquement sous forme chiffr&eacute;e)

### Sc&eacute;nario de compromission

M&ecirc;me avec un acc&egrave;s complet au serveur (base de donn&eacute;es, code source, variables d'environnement), un attaquant n'obtient que des donn&eacute;es chiffr&eacute;es illisibles.

| &Eacute;l&eacute;ment | &Eacute;tat |
|---------|-------|
| Champs sensibles | Chiffr&eacute;s : `v1:<salt>:<iv>:<ciphertext>` |
| DEK | Chiffr&eacute;e avec la KEK (inutilisable sans le mot de passe) |
| Salt Argon2id | Inutile sans le mot de passe |
| `APP_KEY` | N'intervient pas dans le chiffrement zero-access |

---

## Bonnes pratiques

- Utilisez un mot de passe fort (12 caract&egrave;res minimum)
- Activez l'authentification &agrave; deux facteurs (2FA)
- Conservez vos codes de r&eacute;cup&eacute;ration 2FA en lieu s&ucirc;r
- Ne partagez jamais votre mot de passe ou vos tokens d'acc&egrave;s

---

## Versions support&eacute;es

Seule la derni&egrave;re version de Faktur re&ccedil;oit les correctifs de s&eacute;curit&eacute;.

| Version | Support |
|---------|---------|
| Derni&egrave;re version | Correctifs de s&eacute;curit&eacute; actifs |
| Versions ant&eacute;rieures | Non support&eacute;es |

---

## D&eacute;pendances

Les d&eacute;pendances sont r&eacute;guli&egrave;rement audit&eacute;es. Les mises &agrave; jour de s&eacute;curit&eacute; critiques sont appliqu&eacute;es en priorit&eacute;.

---

<div align="center">
  <sub>Voir le <a href="README.md">README principal</a> pour la vue d'ensemble du projet.</sub>
</div>
