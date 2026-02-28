# Backend - CMS Editorial API

## Description

API REST complète pour un back-office de gestion de contenus éditoriaux. Elle permet de gérer des **articles**, des **catégories**, des **réseaux de diffusion** et des **notifications**, avec import JSON, pagination avancée et validation robuste.

---

## Stack technique

| Outil | Rôle |
|---|---|
| **Node.js** | Runtime JavaScript côté serveur |
| **Express** | Framework HTTP REST |
| **TypeScript** | Typage statique, maintenabilité |
| **Zod** | Validation des données côté serveur |
| **JSON file storage** | Persistance légère via `src/data/db.json` |
| **UUID** | Génération d'identifiants uniques |
| **ts-node-dev** | Rechargement automatique en développement |

---

## Installation

### 1. Cloner le projet

```bash
git clone <repo>
cd backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Contenu du `.env` :

```
PORT=4000
NODE_ENV=development
```

### 4. Lancer en mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:4000` avec rechargement automatique.

### 5. Build & démarrage en production

```bash
npm run build
npm start
```

---

## URL de base de l'API

```
http://localhost:4000
```

Point de contrôle santé :

```
GET http://localhost:4000/health
```

---

## Documentation des endpoints

### Articles

#### `GET /api/articles` — Liste paginée avec filtres

**Query params :**

| Paramètre | Type | Description |
|---|---|---|
| `page` | number | Page courante (défaut: 1) |
| `limit` | number | Résultats par page (défaut: 10, max: 100) |
| `search` | string | Recherche dans titre, extrait, auteur |
| `status` | string | `draft` \| `published` \| `archived` |
| `categoryIds` | string | IDs de catégories séparés par virgule |
| `networkId` | string | ID du réseau |
| `featured` | boolean | `true` \| `false` |
| `sortBy` | string | `createdAt` \| `updatedAt` \| `publishedAt` \| `title` |
| `sortDir` | string | `asc` \| `desc` |

**Exemple de réponse :**

```json
{
  "items": [
    {
      "id": "art-001",
      "title": "Réforme électorale : les partis divisés sur la proportionnelle",
      "slug": "reforme-electorale-partis-divises-proportionnelle",
      "excerpt": "Le projet de loi...",
      "content": "<p>...</p>",
      "status": "published",
      "featured": true,
      "categoryIds": ["cat-001"],
      "networkId": "net-001",
      "authorName": "Sophie Marchand",
      "coverImageUrl": "https://...",
      "publishedAt": "2024-02-15T09:00:00.000Z",
      "createdAt": "2024-02-14T17:30:00.000Z",
      "updatedAt": "2024-02-15T09:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 12,
  "totalPages": 2
}
```

---

#### `GET /api/articles/:id` — Récupérer un article

```
GET /api/articles/art-001
```

Réponse : objet `Article` complet.

---

#### `POST /api/articles` — Créer un article

**Body JSON :**

```json
{
  "title": "Mon article",
  "excerpt": "Résumé de l'article en quelques lignes.",
  "content": "<p>Contenu HTML complet.</p>",
  "status": "draft",
  "featured": false,
  "categoryIds": ["cat-001"],
  "networkId": "net-001",
  "authorName": "Jean Dupont",
  "coverImageUrl": "https://example.com/image.jpg"
}
```

Réponse `201` : objet `Article` créé.

---

#### `PUT /api/articles/:id` — Mettre à jour un article

**Body JSON :** mêmes champs que POST (tous optionnels en PUT).

Réponse `200` : objet `Article` mis à jour.

---

#### `DELETE /api/articles/:id` — Supprimer un article

Réponse `204` sans corps.

---

#### `PATCH /api/articles/:id/status` — Changer le statut

**Body JSON :**

```json
{ "status": "published" }
```

Réponse `200` : objet `Article` mis à jour.

---

#### `POST /api/articles/:id/notify` — Envoyer une notification

Génère une notification en base et retourne un aperçu HTML de l'email.

**Réponse `200` :**

```json
{
  "message": "Notification created successfully",
  "notification": { "id": "notif-xxx", "type": "success" },
  "emailPreview": "<!DOCTYPE html>..."
}
```

---

### Categories

#### `GET /api/categories` — Lister les catégories

```json
[
  {
    "id": "cat-001",
    "name": "Politique",
    "slug": "politique",
    "description": "Actualités politiques",
    "color": "#E63946",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### `POST /api/categories` — Créer une catégorie

```json
{
  "name": "Environnement",
  "description": "Écologie et développement durable",
  "color": "#52B788"
}
```

#### `PUT /api/categories/:id` — Mettre à jour une catégorie

**Body JSON :** mêmes champs (tous optionnels).

#### `DELETE /api/categories/:id` — Supprimer une catégorie

Réponse `204`. Les références dans les articles sont automatiquement nettoyées.

---

### Networks

#### `GET /api/networks` — Lister les réseaux

```json
[
  {
    "id": "net-001",
    "name": "Le Quotidien National",
    "slug": "le-quotidien-national",
    "description": "Premier réseau d'information",
    "logoUrl": "https://...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### Import

#### `POST /api/import/articles` — Importer des articles en masse

**Body JSON :**

```json
{
  "articles": [
    {
      "title": "Article importé",
      "excerpt": "Résumé de l'article importé.",
      "content": "<p>Contenu.</p>",
      "status": "published",
      "authorName": "Auteur Test",
      "categoryIds": ["cat-001"],
      "networkId": "net-002"
    }
  ]
}
```

**Réponse `200` :**

```json
{
  "imported": 1,
  "skipped": 0,
  "errors": [],
  "articles": [{ "id": "art-xxx", "title": "Article importé", "..." : "..." }]
}
```

---

### Notifications

#### `GET /api/notifications` — Lister les notifications

```json
[
  {
    "id": "notif-001",
    "type": "success",
    "title": "Article publié",
    "message": "L'article a été publié.",
    "articleId": "art-005",
    "read": false,
    "createdAt": "2024-03-10T07:30:05.000Z"
  }
]
```

---

## Structure du projet

```
src/
├── server.ts               # Point d'entrée Express, CORS, routes, démarrage
├── models/
│   └── index.ts            # Interfaces TypeScript (Article, Category, Network...)
├── data/
│   └── db.json             # Base de données JSON (persistance fichier)
├── routes/
│   ├── articles.ts         # Routes articles
│   ├── categories.ts       # Routes catégories
│   ├── networks.ts         # Routes réseaux
│   ├── notifications.ts    # Routes notifications
│   └── import.ts           # Route import
├── controllers/
│   ├── articleController.ts
│   ├── categoryController.ts
│   ├── networkController.ts
│   ├── notificationController.ts
│   └── importController.ts
├── services/
│   ├── articleService.ts       # Logique métier articles + schémas Zod
│   ├── categoryService.ts      # Logique métier catégories + schémas Zod
│   ├── networkService.ts       # Lecture des réseaux
│   ├── notificationService.ts  # Création et lecture des notifications
│   └── importService.ts        # Import JSON en masse
├── middlewares/
│   ├── errorHandler.ts         # Gestion centralisée des erreurs
│   └── validate.ts             # Middleware de validation Zod (body & query)
└── utils/
    ├── fileStorage.ts          # Lecture/écriture du db.json
    ├── idGenerator.ts          # Génération d'UUID avec préfixe
    ├── slugify.ts              # Génération de slug URL-safe
    └── emailTemplate.ts        # Template HTML email réutilisable
```

---

## Données initiales

Le fichier `src/data/db.json` est pré-rempli au démarrage avec :

- **5 catégories** : Politique, Économie, Technologie, Culture, Sport
- **3 réseaux** : Le Quotidien National, Média Plus, InfoTech 24
- **12 articles** : statuts variés (published, draft, archived), catégories multiples, auteurs différents
- **3 notifications** : succès, info, warning

> **Note :** Le fichier `db.json` est modifié en temps réel lors des opérations CRUD. Pour réinitialiser les données de démo, restaurez le fichier `db.json` depuis le dépôt git.

---

## Améliorations possibles

- **Authentification** : JWT + middleware de protection des routes (rôles admin/éditeur)
- **Base de données réelle** : migration vers PostgreSQL ou SQLite avec Prisma/Drizzle
- **Pagination SQL** : `OFFSET / LIMIT` avec index pour de meilleures performances sur grands volumes
- **Upload d'images** : intégration Multer + stockage S3/Cloudinary pour les images de couverture
- **Envoi d'emails réel** : intégration Nodemailer ou Resend pour l'envoi effectif des notifications
- **Tests automatisés** : Jest + Supertest pour les routes et services
- **Swagger / OpenAPI** : documentation interactive générée depuis les schémas Zod
- **Rate limiting** : protection contre les abus via `express-rate-limit`
- **Cache** : mise en cache Redis pour les listes fréquemment consultées
- **Logs structurés** : Winston ou Pino pour la traçabilité en production
