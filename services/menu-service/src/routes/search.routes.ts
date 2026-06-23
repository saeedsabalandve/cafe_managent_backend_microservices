// services/menu-service/src/routes/search.routes.ts
// #search-routes #fulltext-search #tsvector

import { Router, Request, Response } from 'express';
import { MenuRepository } from '../repositories/menu.repository';

export const searchRouter = Router();

// #fulltext-search
searchRouter.get('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const results = await MenuRepository.searchItems(cafeId, q as string);
  res.json(results);
});

// #faceted-search
searchRouter.get('/faceted', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { q, category_id, min_price, max_price, available } = req.query;

  let query = getRepository(MenuItem)
    .createQueryBuilder('item')
    .leftJoinAndSelect('item.category', 'category')
    .where('item.cafe_id = :cafeId', { cafeId });

  if (q) {
    query = query.andWhere(`to_tsvector('english', item.name) @@ plainto_tsquery('english', :q)`, { q });
  }
  if (category_id) {
    query = query.andWhere('item.category_id = :category_id', { category_id });
  }
  if (min_price) {
    query = query.andWhere('item.base_price >= :min_price', { min_price });
  }
  if (max_price) {
    query = query.andWhere('item.base_price <= :max_price', { max_price });
  }
  if (available === 'true') {
    query = query.andWhere('item.is_available = true');
  }

  const results = await query.getMany();
  res.json(results);
});
