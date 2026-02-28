import fs from 'fs';
import path from 'path';
import { Database } from '../models';

const DB_PATH = path.join(__dirname, '../data/db.json');

export function readDb(): Database {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw) as Database;
}

export function writeDb(data: Database): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
