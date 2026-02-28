import { z } from 'zod';
import { Category } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId } from '../utils/idGenerator';
import { slugify } from '../utils/slugify';
import { AppError } from '../middlewares/errorHandler';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g. #FF0000)')
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export function getAllCategories(): Category[] {
  return readDb().categories;
}

export function getCategoryById(id: string): Category {
  const db = readDb();
  const category = db.categories.find((c) => c.id === id);
  if (!category) throw new AppError(404, `Category with id "${id}" not found`);
  return category;
}

export function createCategory(input: CreateCategoryInput): Category {
  const db = readDb();

  const slug = slugify(input.name);
  if (db.categories.some((c) => c.slug === slug)) {
    throw new AppError(409, `A category with the name "${input.name}" already exists`);
  }

  const now = new Date().toISOString();
  const newCategory: Category = {
    id: generateId('cat'),
    name: input.name,
    slug,
    description: input.description,
    color: input.color,
    createdAt: now,
    updatedAt: now,
  };

  db.categories.push(newCategory);
  writeDb(db);
  return newCategory;
}

export function updateCategory(id: string, input: UpdateCategoryInput): Category {
  const db = readDb();
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) throw new AppError(404, `Category with id "${id}" not found`);

  const existing = db.categories[index];

  if (input.name && input.name !== existing.name) {
    const newSlug = slugify(input.name);
    if (db.categories.some((c) => c.slug === newSlug && c.id !== id)) {
      throw new AppError(409, `A category with the name "${input.name}" already exists`);
    }
    existing.slug = newSlug;
  }

  const updated: Category = {
    ...existing,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.color !== undefined && { color: input.color }),
    updatedAt: new Date().toISOString(),
  };
  if (input.name) updated.slug = slugify(input.name);

  db.categories[index] = updated;
  writeDb(db);
  return updated;
}

export function deleteCategory(id: string): void {
  const db = readDb();
  const index = db.categories.findIndex((c) => c.id === id);
  if (index === -1) throw new AppError(404, `Category with id "${id}" not found`);

  // Remove category references from articles
  db.articles = db.articles.map((a) => ({
    ...a,
    categoryIds: a.categoryIds.filter((cid) => cid !== id),
  }));

  db.categories.splice(index, 1);
  writeDb(db);
}
