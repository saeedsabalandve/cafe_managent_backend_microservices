// services/inventory-service/src/services/forecasting.service.ts
// #consumption-forecast #moving-average

import { getRepository } from 'typeorm';
import { StockMovement } from '../entities/StockMovement';

export class ForecastingService {
  // #simple-moving-average
  static async predictDailyConsumption(ingredientId: string, days: number = 7): Promise<number> {
    const movements = await getRepository(StockMovement)
      .createQueryBuilder('movement')
      .where('movement.ingredient_id = :ingredientId', { ingredientId })
      .andWhere('movement.reason = :reason', { reason: 'consumption' })
      .andWhere('movement.created_at >= :since', { 
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000) 
      })
      .getMany();

    if (movements.length === 0) return 0;

    const totalConsumption = movements.reduce(
      (sum, m) => sum + Math.abs(Number(m.quantity_change)), 0
    );

    return totalConsumption / days;
  }

  // #calculate-reorder-suggestion
  static async getReorderSuggestion(ingredientId: string): Promise<number> {
    const dailyConsumption = await this.predictDailyConsumption(ingredientId);
    return Math.ceil(dailyConsumption * 7); // 1 week supply
  }
}
