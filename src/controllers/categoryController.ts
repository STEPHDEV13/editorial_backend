import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/categoryService';

export function getCategories(req: Request, res: Response, next: NextFunction): void {
  try {
    const categories = categoryService.getAllCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export function createCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    const category = categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export function updateCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    const category = categoryService.updateCategory(req.params.id, req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export function deleteCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    categoryService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
