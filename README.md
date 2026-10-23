# ledger-ops-web

Vitrine de démonstration de **ledger-ops** (Next.js App Router, TanStack Query, shadcn/ui, Tailwind).
Trois écrans au total : tableau de bord, rapprochement, audit.

Backend : [ledger-ops-api](../ledger-ops-api).

Le front ne touche jamais la base de données : il consomme uniquement l'API. Les types TypeScript
sont **générés depuis le contrat OpenAPI** (`openapi-typescript`), rien n'est écrit à la main.

## Démarrage
```bash
npm install
cp .env.local.example .env.local   # URL de l'API + clés de démo (facultatif)
npm run dev                        # http://localhost:3001 si l'API occupe le 3000
```

## Contrat d'API
```bash
npm run api:fetch    # télécharge /docs-json depuis NEXT_PUBLIC_API_URL puis régénère les types
npm run api:types    # régénère seulement les types depuis openapi/ledger-ops.json
```

## Règles
- Montants : chaînes en unité mineure, formatées en FCFA à l'affichage, jamais de calcul en JavaScript.
- La clé API reste dans le navigateur (`sessionStorage`), jamais envoyée à un serveur Next.
- Aucun chiffre estimé : une donnée que l'API ne fournit pas s'affiche « indisponible ».
