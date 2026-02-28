import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';

const router = Router();

// GET /api/notifications
router.get('/', notificationController.getNotifications);

export default router;
