// services/menu-service/src/services/menu.service.ts
// #business-logic #price-calculation #availability

import { MenuItem } from '../entities/MenuItem';

export class MenuService {
  // #calculate-final-price
  static calculateItemPrice(item: MenuItem, selectedVariant?: string, selectedModifiers?: string[]): number {
    let price = Number(item.base_price);

    if (selectedVariant && item.variants) {
      const variant = item.variants.find(v => v.name === selectedVariant);
      if (variant) {
        price += variant.price_delta;
      }
    }

    if (selectedModifiers && item.modifiers) {
      for (const modId of selectedModifiers) {
        const modifier = item.modifiers.find(m => m.id === modId);
        if (modifier) {
          price += Number(modifier.price_delta);
        }
      }
    }

    return Math.max(0, price);
  }

  // #check-availability
  static isItemAvailable(item: MenuItem): boolean {
    if (!item.is_available) return false;
    if (!item.category.is_active) return false;
    return true;
  }

  // #bulk-import-validation
  static validateBulkImport(data: any[]): { valid: MenuItem[]; errors: string[] } {
    const valid: MenuItem[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      if (!row.name) {
        errors.push(`Row ${index + 1}: Name is required`);
        return;
      }
      if (!row.base_price || isNaN(row.base_price)) {
        errors.push(`Row ${index + 1}: Valid price required`);
        return;
      }
      valid.push(row as MenuItem);
    });

    return { valid, errors };
  }
}
