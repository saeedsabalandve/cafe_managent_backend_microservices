// services/inventory-service/src/services/inventory.service.ts
// #stock-deduction #reorder-alerts

import { getRepository } from 'typeorm';
import { Ingredient } from '../entities/Ingredient';
import { StockMovement } from '../entities/StockMovement';

export class InventoryService {
  // #deduct-stock
  static async deductStock(ingredientId: string, quantity: number, userId: string, reason: string): Promise<void> {
    const ingredient = await getRepository(Ingredient).findOne(ingredientId);
    if (!ingredient) throw new Error('Ingredient not found');
    if (ingredient.current_stock < quantity) throw new Error('Insufficient stock');

    await getRepository(Ingredient).decrement(
      { id: ingredientId },
      'current_stock',
      quantity
    );

    await getRepository(StockMovement).save({
      ingredient_id: ingredientId,
      quantity_change: -quantity,
      reason,
      performed_by: userId,
    });
  }

  // #add-stock
  static async addStock(ingredientId: string, quantity: number, userId: string): Promise<void> {
    await getRepository(Ingredient).increment(
      { id: ingredientId },
      'current_stock',
      quantity
    );

    await getRepository(StockMovement).save({
      ingredient_id: ingredientId,
      quantity_change: quantity,
      reason: 'purchase',
      performed_by: userId,
    });
  }

  // #check-low-stock
  static async getLowStockItems(cafeId: string): Promise<Ingredient[]> {
    return getRepository(Ingredient)
      .createQueryBuilder('ingredient')
      .where('ingredient.cafe_id = :cafeId', { cafeId })
      .andWhere('ingredient.current_stock <= ingredient.reorder_threshold')
      .andWhere('ingredient.is_active = true')
      .getMany();
  }
      }
