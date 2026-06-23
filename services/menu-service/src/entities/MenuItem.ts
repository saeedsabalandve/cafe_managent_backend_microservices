// services/menu-service/src/entities/MenuItem.ts
// #menu-item-entity #jsonb-variants

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './Category';
import { Modifier } from './Modifier';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_price: number;

  @Column({ type: 'uuid' })
  cafe_id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @ManyToOne(() => Category, category => category.items)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // #jsonb-for-flexible-variants
  @Column({ type: 'jsonb', nullable: true })
  variants: Array<{
    name: string;
    price_delta: number;
    is_default: boolean;
  }>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'integer', default: 0 })
  preparation_time_minutes: number;

  @OneToMany(() => Modifier, modifier => modifier.menu_item)
  modifiers: Modifier[];

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  }
