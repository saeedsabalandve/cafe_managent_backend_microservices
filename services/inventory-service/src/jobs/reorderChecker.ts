// services/inventory-service/src/jobs/reorderChecker.ts
// #cron-job #reorder-alerts #background-task

import { InventoryService } from '../services/inventory.service';
import { ForecastingService } from '../services/forecasting.service';

export class ReorderChecker {
  private static interval: NodeJS.Timeout;

  // #start-cron
  static start(intervalHours: number = 4): void {
    console.log(`Reorder checker started (every ${intervalHours}h)`);
    
    this.interval = setInterval(async () => {
      try {
        await this.checkAllCafes();
      } catch (error) {
        console.error('Reorder check failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  // #check-all-cafes
  private static async checkAllCafes(): Promise<void> {
    // Get distinct cafe IDs
    const cafes = await getRepository(Ingredient)
      .createQueryBuilder('i')
      .select('DISTINCT i.cafe_id', 'cafe_id')
      .getRawMany();

    for (const { cafe_id } of cafes) {
      const lowStock = await InventoryService.getLowStockItems(cafe_id);
      
      if (lowStock.length > 0) {
        // Generate reorder suggestions
        const suggestions = await Promise.all(
          lowStock.map(async (item) => ({
            ingredient: item.name,
            currentStock: item.current_stock,
            threshold: item.reorder_threshold,
            suggestedReorder: await ForecastingService.getReorderSuggestion(item.id),
          }))
        );

        // Log alert (in production, send notification/email)
        console.log(`Reorder alert for cafe ${cafe_id}:`, suggestions);
      }
    }
  }

  // #stop-cron
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
