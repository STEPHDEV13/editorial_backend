import { Router } from 'express';
import * as importController from '../controllers/importController';

const router = Router();

// POST /api/import/articles
router.post('/articles', importController.importArticles);

export default router;
