import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService';

export function getNotifications(req: Request, res: Response, next: NextFunction): void {
  try {
    const notifications = notificationService.getAllNotifications();
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}
