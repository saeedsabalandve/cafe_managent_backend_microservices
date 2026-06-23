// services/inventory-service/src/routes/stock.routes.ts
// #stock-crud #batch-update

import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Ingredient } from '../entities/Ingredient';
import { InventoryService } from '../services/inventory.service';

export const stockRouter = Router();

// #list-ingredients
stockRouter.get('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const ingredients = await getRepository(Ingredient).find({
    where: { cafe_id: cafeId, is_active: true },
  });
  res.json(ingredients);
});

// #add-ingredient
stockRouter.post('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const ingredient = getRepository(Ingredient).create({
    ...req.body,
    cafe_id: cafeId,
  });
  const result = await getRepository(Ingredient).save(ingredient);
  res.status(201).json(result);
});

// #stock-in
stockRouter.post('/:id/add', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { quantity } = req.body;
  await InventoryService.addStock(req.params.id, quantity, userId);
  res.json({ message: 'Stock added' });
});

// #stock-out
stockRouter.post('/:id/deduct', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { quantity, reason } = req.body;
  await InventoryService.deductStock(req.params.id, quantity, userId, reason);
  res.json({ message: 'Stock deducted' });
});

// #low-stock-alerts
stockRouter.get('/alerts', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const lowStock = await InventoryService.getLowStockItems(cafeId);
  res.json(lowStock);
});
