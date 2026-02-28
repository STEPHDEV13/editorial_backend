import { Request, Response, NextFunction } from 'express';
import * as importService from '../services/importService';
import * as notificationService from '../services/notificationService';

export function importArticles(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = importService.importArticles(req.body);

    // Create a notification summarizing the import
    notificationService.createNotification({
      type: result.errors.length === 0 ? 'success' : 'warning',
      title: 'Import d\'articles terminé',
      message: `${result.imported} article(s) importé(s) avec succès. ${result.skipped} ignoré(s).`,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
