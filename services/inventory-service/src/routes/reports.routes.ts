// services/inventory-service/src/routes/reports.routes.ts
// #inventory-reports #consumption-analysis #wastage-tracking

import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { StockMovement } from '../entities/StockMovement';
import { Ingredient } from '../entities/Ingredient';

export const reportsRouter = Router();

// #consumption-report
reportsRouter.get('/consumption', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { start_date, end_date } = req.query;

  const query = getRepository(StockMovement)
    .createQueryBuilder('movement')
    .leftJoinAndSelect('movement.ingredient', 'ingredient')
    .where('ingredient.cafe_id = :cafeId', { cafeId })
    .andWhere('movement.reason = :reason', { reason: 'consumption' });

  if (start_date) {
    query.andWhere('movement.created_at >= :start_date', { start_date });
  }
  if (end_date) {
    query.andWhere('movement.created_at <= :end_date', { end_date });
  }

  const movements = await query.orderBy('movement.created_at', 'DESC').getMany();

  // #aggregate-by-ingredient
  const aggregated = movements.reduce((acc: any, movement: StockMovement) => {
    const key = movement.ingredient_id;
    if (!acc[key]) {
      acc[key] = {
        ingredient: movement.ingredient.name,
        unit: movement.ingredient.unit,
        total_consumed: 0,
        movements: [],
      };
    }
    acc[key].total_consumed += Math.abs(Number(movement.quantity_change));
    acc[key].movements.push(movement);
    return acc;
  }, {});

  res.json(Object.values(aggregated));
});

// #wastage-report
reportsRouter.get('/wastage', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { start_date, end_date } = req.query;

  const query = getRepository(StockMovement)
    .createQueryBuilder('movement')
    .leftJoinAndSelect('movement.ingredient', 'ingredient')
    .where('ingredient.cafe_id = :cafeId', { cafeId })
    .andWhere('movement.reason = :reason', { reason: 'wastage' });

  if (start_date) {
    query.andWhere('movement.created_at >= :start_date', { start_date });
  }
  if (end_date) {
    query.andWhere('movement.created_at <= :end_date', { end_date });
  }

  const movements = await query.orderBy('movement.created_at', 'DESC').getMany();

  // #calculate-wastage-cost
  const wastageWithCost = movements.map(m => ({
    ...m,
    estimated_cost: Math.abs(Number(m.quantity_change)) * 5, // Simplified cost calculation
  }));

  res.json({
    total_wastage_events: wastageWithCost.length,
    estimated_total_cost: wastageWithCost.reduce((sum, m) => sum + m.estimated_cost, 0),
    items: wastageWithCost,
  });
});

// #stock-level-report
reportsRouter.get('/stock-levels', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;

  const ingredients = await getRepository(Ingredient).find({
    where: { cafe_id: cafeId, is_active: true },
    order: { name: 'ASC' },
  });

  const report = ingredients.map(ing => ({
    name: ing.name,
    unit: ing.unit,
    current_stock: Number(ing.current_stock),
    reorder_threshold: Number(ing.reorder_threshold),
    reorder_quantity: Number(ing.reorder_quantity),
    status: Number(ing.current_stock) <= Number(ing.reorder_threshold) ? 'low' : 'normal',
    needs_reorder: Number(ing.current_stock) <= Number(ing.reorder_threshold),
  }));

  const summary = {
    total_items: report.length,
    low_stock_items: report.filter(r => r.status === 'low').length,
    normal_stock_items: report.filter(r => r.status === 'normal').length,
  };

  res.json({ summary, items: report });
});

// #purchase-history
reportsRouter.get('/purchases', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { start_date, end_date, page = 1, limit = 50 } = req.query;

  const [movements, total] = await getRepository(StockMovement)
    .createQueryBuilder('movement')
    .leftJoinAndSelect('movement.ingredient', 'ingredient')
    .where('ingredient.cafe_id = :cafeId', { cafeId })
    .andWhere('movement.reason = :reason', { reason: 'purchase' })
    .skip((Number(page) - 1) * Number(limit))
    .take(Number(limit))
    .orderBy('movement.created_at', 'DESC')
    .getManyAndCount();

  res.json({
    data: movements,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
});
