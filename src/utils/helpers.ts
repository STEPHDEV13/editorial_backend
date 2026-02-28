import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function now(): string {
  return new Date().toISOString();
}
