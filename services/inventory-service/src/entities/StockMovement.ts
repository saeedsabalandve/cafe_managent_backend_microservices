// services/inventory-service/src/entities/StockMovement.ts
// #audit-log #stock-movement

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ingredient } from './Ingredient';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ingredient_id: string;

  @ManyToOne(() => Ingredient, ingredient => ingredient.movements)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity_change: number;

  @Column({ type: 'varchar', length: 50 })
  reason: string; // purchase, consumption, wastage, correction

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  performed_by: string;

  @CreateDateColumn()
  created_at: Date;
}
