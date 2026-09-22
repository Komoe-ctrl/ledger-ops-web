# ledger-ops-web

Back-office web de **ledger-ops** (Next.js). Sera initialisé au jalon 2.

Backend : [ledger-ops-api](../ledger-ops-api).

Le front ne touche jamais la base de données : il consomme uniquement l'API. Les types TypeScript des requêtes et réponses sont **générés depuis le contrat OpenAPI** exposé par l'API (`openapi-typescript`), pour que front et back ne divergent jamais.
