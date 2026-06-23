// services/inventory-service/src/entities/Ingredient.ts
// #ingredient-entity #stock-management

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { StockMovement } from './StockMovement';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  unit: string; // kg, g, l, ml, pcs

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  current_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reorder_threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reorder_quantity: number;

  @Column({ type: 'uuid' })
  cafe_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => StockMovement, movement => movement.ingredient)
  movements: StockMovement[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
