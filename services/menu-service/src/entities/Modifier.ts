// services/menu-service/src/entities/Modifier.ts
// #modifier-entity #item-options

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity('modifiers')
export class Modifier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_delta: number;

  @Column({ type: 'uuid' })
  menu_item_id: string;

  @ManyToOne(() => MenuItem, item => item.modifiers)
  @JoinColumn({ name: 'menu_item_id' })
  menu_item: MenuItem;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
