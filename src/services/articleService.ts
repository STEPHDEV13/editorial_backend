import { z } from 'zod';
import { Article, ArticleFilters, ArticleStatus, PaginatedResult } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId } from '../utils/idGenerator';
import { slugify } from '../utils/slugify';
import { AppError } from '../middlewares/errorHandler';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const createArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters').max(1000),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  networkId: z.string().nullable().default(null),
  authorName: z.string().min(2, 'Author name must be at least 2 characters').max(200),
  coverImageUrl: z.string().url('Cover image must be a valid URL').optional(),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const patchStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  categoryIds: z.string().optional(), // comma-separated
  networkId: z.string().optional(),
  featured: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'publishedAt', 'title'])
    .default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type PatchStatusInput = z.infer<typeof patchStatusSchema>;

// ─── Service Functions ───────────────────────────────────────────────────────

export function getArticles(filters: ArticleFilters): PaginatedResult<Article> {
  const db = readDb();
  let items = [...db.articles];

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
    );
  }

  // Status filter
  if (filters.status) {
    items = items.filter((a) => a.status === filters.status);
  }

  // Category filter (article must contain ALL requested categoryIds)
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    items = items.filter((a) =>
      filters.categoryIds!.every((cid) => a.categoryIds.includes(cid))
    );
  }

  // Network filter
  if (filters.networkId) {
    items = items.filter((a) => a.networkId === filters.networkId);
  }

  // Featured filter
  if (filters.featured !== undefined) {
    items = items.filter((a) => a.featured === filters.featured);
  }

  // Sort
  const sortBy = (filters.sortBy as keyof Article) || 'createdAt';
  const sortDir = filters.sortDir || 'desc';
  items.sort((a, b) => {
    const aVal = a[sortBy] ?? '';
    const bVal = b[sortBy] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Pagination
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = items.slice(offset, offset + limit);

  return { items: paginated, page, limit, total, totalPages };
}

export function getArticleById(id: string): Article {
  const db = readDb();
  const article = db.articles.find((a) => a.id === id);
  if (!article) throw new AppError(404, `Article with id "${id}" not found`);
  return article;
}

export function createArticle(input: CreateArticleInput): Article {
  const db = readDb();

  // Validate categoryIds exist
  validateCategoryIds(input.categoryIds, db.categories.map((c) => c.id));

  // Validate networkId exists
  if (input.networkId) {
    validateNetworkId(input.networkId, db.networks.map((n) => n.id));
  }

  const slug = ensureUniqueSlug(slugify(input.title), db.articles);
  const now = new Date().toISOString();

  const article: Article = {
    id: generateId('art'),
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content: input.content,
    status: input.status as ArticleStatus,
    featured: input.featured,
    categoryIds: input.categoryIds,
    networkId: input.networkId,
    authorName: input.authorName,
    coverImageUrl: input.coverImageUrl,
    publishedAt:
      input.publishedAt !== undefined
        ? input.publishedAt
        : input.status === 'published'
          ? now
          : null,
    createdAt: now,
    updatedAt: now,
  };

  db.articles.push(article);
  writeDb(db);
  return article;
}

export function updateArticle(id: string, input: UpdateArticleInput): Article {
  const db = readDb();
  const index = db.articles.findIndex((a) => a.id === id);
  if (index === -1) throw new AppError(404, `Article with id "${id}" not found`);

  if (input.categoryIds) {
    validateCategoryIds(input.categoryIds, db.categories.map((c) => c.id));
  }
  if (input.networkId) {
    validateNetworkId(input.networkId, db.networks.map((n) => n.id));
  }

  const existing = db.articles[index];
  const now = new Date().toISOString();

  const updated: Article = {
    ...existing,
    ...input,
    updatedAt: now,
  } as Article;

  // Recalculate slug if title changed
  if (input.title && input.title !== existing.title) {
    updated.slug = ensureUniqueSlug(slugify(input.title), db.articles, id);
  }

  // Auto-set publishedAt when status changes to published
  if (input.status === 'published' && !updated.publishedAt) {
    updated.publishedAt = now;
  }

  db.articles[index] = updated;
  writeDb(db);
  return updated;
}

export function deleteArticle(id: string): void {
  const db = readDb();
  const index = db.articles.findIndex((a) => a.id === id);
  if (index === -1) throw new AppError(404, `Article with id "${id}" not found`);
  db.articles.splice(index, 1);
  writeDb(db);
}

export function patchArticleStatus(id: string, status: ArticleStatus): Article {
  const db = readDb();
  const index = db.articles.findIndex((a) => a.id === id);
  if (index === -1) throw new AppError(404, `Article with id "${id}" not found`);

  const existing = db.articles[index];
  const now = new Date().toISOString();

  const updated: Article = {
    ...existing,
    status,
    publishedAt:
      status === 'published' && !existing.publishedAt ? now : existing.publishedAt,
    updatedAt: now,
  };

  db.articles[index] = updated;
  writeDb(db);
  return updated;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateCategoryIds(ids: string[], validIds: string[]): void {
  const invalid = ids.filter((id) => !validIds.includes(id));
  if (invalid.length > 0) {
    throw new AppError(400, `Invalid category id(s): ${invalid.join(', ')}`);
  }
}

function validateNetworkId(id: string, validIds: string[]): void {
  if (!validIds.includes(id)) {
    throw new AppError(400, `Invalid network id: "${id}"`);
  }
}

function ensureUniqueSlug(
  baseSlug: string,
  articles: Article[],
  excludeId?: string
): string {
  let slug = baseSlug;
  let counter = 1;
  while (articles.some((a) => a.slug === slug && a.id !== excludeId)) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}
