import { Router } from 'express';
import * as networkController from '../controllers/networkController';

const router = Router();

// GET /api/networks
router.get('/', networkController.getNetworks);

export default router;
