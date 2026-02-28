import { z } from 'zod';
import { Article, ArticleStatus } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId } from '../utils/idGenerator';
import { slugify } from '../utils/slugify';

// ─── Zod Schema for imported article ────────────────────────────────────────

const importArticleSchema = z.object({
  title: z.string().min(3).max(300),
  excerpt: z.string().min(10).max(1000),
  content: z.string().min(10),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  featured: z.boolean().optional().default(false),
  categoryIds: z.array(z.string()).optional().default([]),
  networkId: z.string().nullable().optional().default(null),
  authorName: z.string().min(2).max(200),
  coverImageUrl: z.string().url().optional(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const importPayloadSchema = z.object({
  articles: z.array(importArticleSchema).min(1, 'At least one article is required'),
});

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ index: number; error: string }>;
  articles: Article[];
};

export function importArticles(payload: unknown): ImportResult {
  const parseResult = importPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    const messages = parseResult.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Invalid import payload: ${messages}`);
  }

  const db = readDb();
  const validCategoryIds = new Set(db.categories.map((c) => c.id));
  const validNetworkIds = new Set(db.networks.map((n) => n.id));
  const existingSlugs = new Set(db.articles.map((a) => a.slug));

  const imported: Article[] = [];
  const errors: ImportResult['errors'] = [];

  parseResult.data.articles.forEach((raw, index) => {
    try {
      // Validate foreign keys (warn but don't block)
      const invalidCats = raw.categoryIds.filter((id) => !validCategoryIds.has(id));
      if (invalidCats.length > 0) {
        throw new Error(`Unknown category id(s): ${invalidCats.join(', ')}`);
      }
      if (raw.networkId && !validNetworkIds.has(raw.networkId)) {
        throw new Error(`Unknown network id: "${raw.networkId}"`);
      }

      // Generate unique slug
      let baseSlug = slugify(raw.title);
      let slug = baseSlug;
      let counter = 1;
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${counter++}`;
      }
      existingSlugs.add(slug);

      const now = new Date().toISOString();
      const article: Article = {
        id: generateId('art'),
        title: raw.title,
        slug,
        excerpt: raw.excerpt,
        content: raw.content,
        status: raw.status as ArticleStatus,
        featured: raw.featured,
        categoryIds: raw.categoryIds,
        networkId: raw.networkId,
        authorName: raw.authorName,
        coverImageUrl: raw.coverImageUrl,
        publishedAt: raw.publishedAt ?? (raw.status === 'published' ? now : null),
        createdAt: now,
        updatedAt: now,
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
    skipped: errors.length,
    errors,
    articles: imported,
  };
}
