// services/menu-service/src/routes/categories.routes.ts
// #category-routes #crud

import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Category } from '../entities/Category';

export const categoriesRouter = Router();

// #list-categories
categoriesRouter.get('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const categories = await getRepository(Category).find({
    where: { cafe_id: cafeId },
    order: { sort_order: 'ASC' },
  });
  res.json(categories);
});

// #create-category
categoriesRouter.post('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const category = getRepository(Category).create({
    ...req.body,
    cafe_id: cafeId,
  });
  const result = await getRepository(Category).save(category);
  res.status(201).json(result);
});

// #update-category
categoriesRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await getRepository(Category).update(id, req.body);
  const updated = await getRepository(Category).findOne(id);
  res.json(updated);
});

// #delete-category
categoriesRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await getRepository(Category).delete(id);
  res.status(204).send();
});
