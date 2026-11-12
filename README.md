# The Box — Zone de décision tactique

Tableau blanc tactique pour les entraîneurs : schémas et animations sur terrain officiel, gestion de l'effectif, mode Live Match, partage et export HD. Plusieurs sports (football, basketball, rugby, handball).

Édité par PixUp.

## Stack

- Next.js 15 (App Router), React 19, Tailwind CSS 4
- Firebase (Authentification, Firestore) et Firebase Admin côté serveur
- Stripe pour les abonnements PRO et PRO+
- Nodemailer (SMTP) pour les e-mails transactionnels
- Playwright pour les tests end-to-end

## Lancer en local

**Prérequis :** Node.js 20 ou plus.

1. Installer les dépendances : `npm install`
2. Copier `.env.example` vers `.env.local`, puis renseigner les clés (Stripe, SMTP, compte de service Firebase).
3. Démarrer : `npm run dev`, puis ouvrir http://localhost:3000

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | Lint |
| `npm run test:e2e` | Tests end-to-end (Playwright) |

## Tests end-to-end

Les tests qui demandent une connexion utilisent un compte de test, déclaré dans `.env.local` :

```
E2E_EMAIL=...
E2E_PASSWORD=...
# facultatif, compte avec isAdmin: true pour les tests d'administration
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

Sans ces variables, ces tests sont ignorés. Les autres s'exécutent normalement.

## Documentation

- [GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md) : guide d'utilisation
- [CAHIER_DE_TESTS.md](CAHIER_DE_TESTS.md) : scénarios de test
- [SECURITY.md](SECURITY.md) : sécurité
