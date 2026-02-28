import { Request, Response, NextFunction } from 'express';
import * as networkService from '../services/networkService';

export function getNetworks(req: Request, res: Response, next: NextFunction): void {
  try {
    const networks = networkService.getAllNetworks();
    res.json(networks);
  } catch (err) {
    next(err);
  }
}

export function getNetwork(req: Request, res: Response, next: NextFunction): void {
  try {
    const network = networkService.getNetworkById(req.params.id);
    if (!network) {
      res.status(404).json({ message: 'Réseau introuvable' });
      return;
    }
    res.json(network);
  } catch (err) {
    next(err);
  }
}

export function createNetwork(req: Request, res: Response, next: NextFunction): void {
  try {
    const { name, slug, description, logoUrl } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Le champ "name" est obligatoire' });
      return;
    }

    const network = networkService.createNetwork({ name, slug, description, logoUrl });
    res.status(201).json(network);
  } catch (err: any) {
    if (err.status === 409) {
      res.status(409).json({ message: err.message });
      return;
    }
    next(err);
  }
}

export function updateNetwork(req: Request, res: Response, next: NextFunction): void {
  try {
    const { name, slug, description, logoUrl } = req.body;
    const network = networkService.updateNetwork(req.params.id, { name, slug, description, logoUrl });
    if (!network) {
      res.status(404).json({ message: 'Réseau introuvable' });
      return;
    }
    res.json(network);
  } catch (err: any) {
    if (err.status === 409) {
      res.status(409).json({ message: err.message });
      return;
    }
    next(err);
  }
}

export function deleteNetwork(req: Request, res: Response, next: NextFunction): void {
  try {
    const deleted = networkService.deleteNetwork(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Réseau introuvable' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    if (err.status === 409) {
      res.status(409).json({ message: err.message });
      return;
    }
    next(err);
  }
}