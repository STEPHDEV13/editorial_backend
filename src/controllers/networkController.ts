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
