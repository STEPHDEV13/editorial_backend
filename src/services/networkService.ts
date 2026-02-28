import { Network } from '../models';
import { readDb } from '../utils/fileStorage';

export function getAllNetworks(): Network[] {
  return readDb().networks;
}
