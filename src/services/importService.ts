// ─────────────────────────────────────────────────────────────────────────────
// services/importService.ts
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';
import { Article, ArticleStatus } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId } from '../utils/idGenerator';
import { slugify } from '../utils/slugify';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Accepte string ou number → toujours string */
const coercedString = z.union([z.string(), z.number()]).transform(v => String(v));

/** Accepte string | number | null | undefined → string | null */
const coercedStringNullable = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform(v => (v == null || v === '' ? null : String(v)));

// ── Schema ────────────────────────────────────────────────────────────────────
// Adapté au format réel du fichier importé :
//   - excerpt et authorName absents → générés automatiquement
//   - categoryId (singulier, number) au lieu de categoryIds[]
//   - imageUrl au lieu de coverImageUrl
//   - networkId peut être un number

const importArticleSchema = z.object({
  title:   z.string().min(3).max(300),
  content: z.string().min(10),

  // Optionnels : générés automatiquement si absents
  excerpt:    z.string().optional().or(z.literal('')),
  summary:    z.string().nullable().optional(),
  authorName: z.string().optional(),

  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),

  featured: z
    .union([z.boolean(), z.number(), z.string()])
    .optional()
    .default(false)
    .transform(v => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number')  return v !== 0;
      return v === 'true' || v === '1';
    }),

  // Support categoryId singulier (number ou string) ET categoryIds tableau
  categoryId: coercedString.optional(),
  categoryIds: z
    .union([z.array(coercedString), coercedString, z.null(), z.undefined()])
    .optional()
    .transform(v => {
      if (v == null) return [];
      if (Array.isArray(v)) return v.map(String);
      return [String(v)];
    }),

  networkId: coercedStringNullable,

  // Support imageUrl ET coverImageUrl
  imageUrl:      z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  coverImageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),

  slug: z.string().optional().or(z.literal('')).transform(v => v || undefined),

  publishedAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
});

// Accepte tableau brut [...] OU { articles: [...] } — résout le double-wrap
const importPayloadSchema = z
  .union([
    z.array(importArticleSchema).min(1, 'Au moins un article est requis'),
    z.object({
      articles: z.array(importArticleSchema).min(1, 'Au moins un article est requis'),
    }),
  ])
  .transform(v => ({
    articles: Array.isArray(v) ? v : v.articles,
  }));

// ── Types ─────────────────────────────────────────────────────────────────────

export type ImportResult = {
  imported: number;
  skipped:  number;
  total:    number;
  errors:   Array<{ index: number; error: string }>;
  articles: Article[];
};

// ── Service ───────────────────────────────────────────────────────────────────

export function importArticles(payload: unknown): ImportResult {
  const parseResult = importPayloadSchema.safeParse(payload);

  if (!parseResult.success) {
    const messages = parseResult.error.issues
      .map(i => `[${i.path.join('.')}] ${i.message}`)
      .join('; ');
    console.error('[importService] validation failed:', parseResult.error.issues);
    throw new Error(`Invalid import payload: ${messages}`);
  }

  const db = readDb();

  const validCategoryIds = new Set(db.categories.map(c => c.id));
  const validNetworkIds  = new Set(db.networks.map(n => n.id));
  const existingSlugs    = new Set(db.articles.map(a => a.slug));

  const imported: Article[] = [];
  const errors: ImportResult['errors'] = [];

  parseResult.data.articles.forEach((raw, index) => {
    try {
      // ── Résolution categoryIds ──────────────────────────────────────────
      // Priorité : categoryIds[] > categoryId singulier
      const categoryIds: string[] =
        raw.categoryIds && raw.categoryIds.length > 0
          ? raw.categoryIds
          : raw.categoryId
          ? [raw.categoryId]
          : [];

      // ── Validation foreign keys ─────────────────────────────────────────
      const invalidCats = categoryIds.filter(id => !validCategoryIds.has(id));
      if (invalidCats.length > 0) {
        throw new Error(`Catégorie(s) inconnue(s): ${invalidCats.join(', ')}`);
      }

      if (raw.networkId && !validNetworkIds.has(raw.networkId)) {
        throw new Error(`Réseau inconnu: "${raw.networkId}"`);
      }

      // ── Slug unique ─────────────────────────────────────────────────────
      const baseSlug = raw.slug || slugify(raw.title);
      let slug       = baseSlug;
      let counter    = 1;
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
      existingSlugs.add(slug);

      const nowIso = new Date().toISOString();

      // ── Auto-génération des champs manquants ────────────────────────────
      const excerpt = raw.excerpt?.trim()
        || raw.summary?.trim()
        || raw.content.replace(/<[^>]*>/g, '').slice(0, 200).trim();

      const authorName = raw.authorName?.trim() || 'Import';

      const article: Article = {
        id:            generateId('art'),
        title:         raw.title,
        slug,
        excerpt,
        content:       raw.content,
        status:        raw.status as ArticleStatus,
        featured:      raw.featured,
        categoryIds,
        networkId:     raw.networkId ?? null,
        authorName,
        coverImageUrl: raw.coverImageUrl ?? raw.imageUrl,
        publishedAt:   raw.publishedAt ?? (raw.status === 'published' ? nowIso : null),
        createdAt:     nowIso,
        updatedAt:     nowIso,
      };

      db.articles.push(article);
      imported.push(article);
    } catch (err) {
      errors.push({
        index,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  if (imported.length > 0) {
    writeDb(db);
  }

  return {
    imported: imported.length,
    skipped:  errors.length,
    total:    parseResult.data.articles.length,
    errors,
    articles: imported,
  };
}