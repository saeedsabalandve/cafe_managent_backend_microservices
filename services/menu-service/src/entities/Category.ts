// services/menu-service/src/entities/Category.ts
// #category-entity #postgresql #typeorm

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { MenuItem } from './MenuItem';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @Column({ type: 'uuid' })
  cafe_id: string;

  // #self-referencing-hierarchy
  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => Category, category => category.children, { nullable: true })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @OneToMany(() => MenuItem, item => item.category)
  items: MenuItem[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  }
