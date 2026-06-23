// services/menu-service/src/repositories/menu.repository.ts
// #menu-repository #optimized-queries #fulltext-search

import { getRepository } from 'typeorm';
import { MenuItem } from '../entities/MenuItem';

export class MenuRepository {
  // #recursive-cte-categories
  static async getCategoryTree(cafeId: string) {
    const repository = getRepository('Category');
    return repository.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, sort_order, 0 AS level
        FROM categories
        WHERE cafe_id = $1 AND parent_id IS NULL
        
        UNION ALL
        
        SELECT c.id, c.name, c.parent_id, c.sort_order, ct.level + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level, sort_order
    `, [cafeId]);
  }

  // #fulltext-search-tsvector
  static async searchItems(cafeId: string, query: string) {
    return getRepository(MenuItem)
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.modifiers', 'modifier')
      .where('item.cafe_id = :cafeId', { cafeId })
      .andWhere(`to_tsvector('english', item.name || ' ' || COALESCE(item.description, '')) @@ plainto_tsquery('english', :query)`, { query })
      .getMany();
  }

  // #paginated-items
  static async getItemsByCategory(cafeId: string, categoryId: string, page: number = 1, limit: number = 20) {
    const [items, total] = await getRepository(MenuItem)
      .findAndCount({
        where: { cafe_id: cafeId, category_id: categoryId },
        relations: ['modifiers'],
        skip: (page - 1) * limit,
        take: limit,
        order: { name: 'ASC' },
      });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
          }
