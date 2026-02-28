import { Router } from 'express';
import * as articleController from '../controllers/articleController';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  createArticleSchema,
  updateArticleSchema,
  patchStatusSchema,
  articleQuerySchema,
} from '../services/articleService';

const router = Router();

// GET /api/articles — list with pagination & filters
router.get('/', validateQuery(articleQuerySchema), articleController.getArticles);

// GET /api/articles/:id
router.get('/:id', articleController.getArticleById);

// POST /api/articles
router.post('/', validateBody(createArticleSchema), articleController.createArticle);

// PUT /api/articles/:id
router.put('/:id', validateBody(updateArticleSchema), articleController.updateArticle);

// DELETE /api/articles/:id
router.delete('/:id', articleController.deleteArticle);

// PATCH /api/articles/:id/status
router.patch(
  '/:id/status',
  validateBody(patchStatusSchema),
  articleController.patchArticleStatus
);

// POST /api/articles/:id/notify
router.post('/:id/notify', articleController.notifyArticle);

export default router;
