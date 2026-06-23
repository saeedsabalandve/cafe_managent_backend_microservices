// services/menu-service/src/repositories/category.repository.ts
// #category-repository #materialized-path

import { getRepository } from 'typeorm';
import { Category } from '../entities/Category';

export class CategoryRepository {
  // #get-with-children
  static async getCategoryWithChildren(categoryId: string) {
    return getRepository(Category)
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.items', 'items')
      .where('category.id = :id', { id: categoryId })
      .orderBy('children.sort_order', 'ASC')
      .getOne();
  }

  // #reorder-categories
  static async reorderCategories(cafeId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
    }));

    await getRepository(Category)
      .createQueryBuilder()
      .update(Category)
      .set({ sort_order: () => `CASE id ${updates.map(u => `WHEN '${u.id}' THEN ${u.sort_order}`).join(' ')} END` })
      .where('id IN (:...ids)', { ids: orderedIds })
      .execute();
  }
             }
