import { Network } from '../models';
import { readDb, writeDb } from '../utils/fileStorage';
import { generateId, slugify, now } from '../utils/helpers';

export function getAllNetworks(): Network[] {
  return readDb().networks;
}

export function getNetworkById(id: string): Network | undefined {
  return readDb().networks.find(n => n.id === id);
}

export function createNetwork(data: {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}): Network {
  const db   = readDb();
  const slug = data.slug?.trim() || slugify(data.name);

  // Slug uniqueness check
  if (db.networks.some(n => n.slug === slug)) {
    const err: any = new Error(`Un réseau avec le slug "${slug}" existe déjà`);
    err.status = 409;
    throw err;
  }

  const network: Network = {
    id:          generateId(),
    name:        data.name.trim(),
    slug,
    description: data.description?.trim(),
    logoUrl:     data.logoUrl?.trim(),
    createdAt:   now(),
    updatedAt:   now(),
  };

  db.networks.push(network);
  writeDb(db);
  return network;
}

export function updateNetwork(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
  }
): Network | null {
  const db  = readDb();
  const idx = db.networks.findIndex(n => n.id === id);
  if (idx === -1) return null;

  const existing = db.networks[idx];
  const newSlug  = data.slug?.trim() || (data.name ? slugify(data.name) : existing.slug);

  // Slug uniqueness check (exclude self)
  if (newSlug !== existing.slug && db.networks.some(n => n.slug === newSlug && n.id !== id)) {
    const err: any = new Error(`Un réseau avec le slug "${newSlug}" existe déjà`);
    err.status = 409;
    throw err;
  }

  const updated: Network = {
    ...existing,
    name:        data.name?.trim()        ?? existing.name,
    slug:        newSlug,
    description: data.description?.trim() ?? existing.description,
    logoUrl:     data.logoUrl?.trim()     ?? existing.logoUrl,
    updatedAt:   now(),
  };

  db.networks[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteNetwork(id: string): boolean {
  const db  = readDb();
  const idx = db.networks.findIndex(n => n.id === id);
  if (idx === -1) return false;

  // Prevent deletion if articles reference this network
  const inUse = db.articles.some(a => a.networkId === id);
  if (inUse) {
    const err: any = new Error('Ce réseau est utilisé par des articles et ne peut pas être supprimé');
    err.status = 409;
    throw err;
  }

  db.networks.splice(idx, 1);
  writeDb(db);
  return true;
}