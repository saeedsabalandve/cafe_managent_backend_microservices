// services/menu-service/src/routes/items.routes.ts
// #menu-item-routes #crud #bulk-import

import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import multer from 'multer';
import { MenuItem } from '../entities/MenuItem';
import { ImageService } from '../services/image.service';
import { MenuService } from '../services/menu.service';
import { MenuRepository } from '../repositories/menu.repository';

export const itemsRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// #list-items
itemsRouter.get('/', async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  const { category_id, page = 1, limit = 20 } = req.query;

  if (category_id) {
    const result = await MenuRepository.getItemsByCategory(
      cafeId,
      category_id as string,
      parseInt(page as string),
      parseInt(limit as string)
    );
    return res.json(result);
  }

  const items = await getRepository(MenuItem).find({
    where: { cafe_id: cafeId },
    relations: ['category', 'modifiers'],
  });
  res.json(items);
});

// #create-item
itemsRouter.post('/', upload.single('image'), async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  
  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = await ImageService.processAndUpload(
      req.file.buffer,
      req.file.originalname,
      cafeId
    );
  }

  const item = getRepository(MenuItem).create({
    ...req.body,
    cafe_id: cafeId,
    image_url: imageUrl,
  });

  const result = await getRepository(MenuItem).save(item);
  res.status(201).json(result);
});

// #update-item
itemsRouter.put('/:id', upload.single('image'), async (req: Request, res: Response) => {
  const cafeId = req.headers['x-cafe-id'] as string;
  
  if (req.file) {
    const imageUrl = await ImageService.processAndUpload(
      req.file.buffer,
      req.file.originalname,
      cafeId
    );
    req.body.image_url = imageUrl;
  }

  await getRepository(MenuItem).update(req.params.id, req.body);
  const updated = await getRepository(MenuItem).findOne(req.params.id);
  res.json(updated);
});

// #delete-item
itemsRouter.delete('/:id', async (req: Request, res: Response) => {
  await getRepository(MenuItem).delete(req.params.id);
  res.status(204).send();
});
