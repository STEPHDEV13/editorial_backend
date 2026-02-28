import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { validateBody } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../services/categoryService';

const router = Router();

// GET /api/categories
router.get('/', categoryController.getCategories);

// POST /api/categories
router.post('/', validateBody(createCategorySchema), categoryController.createCategory);

// PUT /api/categories/:id
router.put('/:id', validateBody(updateCategorySchema), categoryController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', categoryController.deleteCategory);

export default router;
