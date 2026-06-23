// services/menu-service/src/migrations/001_initial_menu.ts
// #initial-migration #schema-creation #gin-indexes

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class InitialMenu001000000000001 implements MigrationInterface {
  name = 'InitialMenu001000000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // #categories-table
    await queryRunner.createTable(new Table({
      name: 'categories',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', length: '100' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'sort_order', type: 'integer', default: 0 },
        { name: 'cafe_id', type: 'uuid' },
        { name: 'parent_id', type: 'uuid', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    // #menu-items-table
    await queryRunner.createTable(new Table({
      name: 'menu_items',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', length: '150' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'base_price', type: 'decimal', precision: 10, scale: 2 },
        { name: 'cafe_id', type: 'uuid' },
        { name: 'category_id', type: 'uuid' },
        { name: 'variants', type: 'jsonb', isNullable: true },
        { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'preparation_time_minutes', type: 'integer', default: 0 },
        { name: 'is_available', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    // #modifiers-table
    await queryRunner.createTable(new Table({
      name: 'modifiers',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'name', type: 'varchar', length: '100' },
        { name: 'price_delta', type: 'decimal', precision: 10, scale: 2, default: 0 },
        { name: 'menu_item_id', type: 'uuid' },
        { name: 'is_available', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ]
    }), true);

    // #foreign-keys
    await queryRunner.createForeignKey('menu_items', new TableForeignKey({
      columnNames: ['category_id'],
      referencedTableName: 'categories',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('modifiers', new TableForeignKey({
      columnNames: ['menu_item_id'],
      referencedTableName: 'menu_items',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // #gin-index-for-fulltext
    await queryRunner.query(`CREATE INDEX idx_menu_items_name_gin ON menu_items USING gin(to_tsvector('english', name))`);
    
    // #composite-index-tenant
    await queryRunner.query(`CREATE INDEX idx_menu_items_cafe_category ON menu_items(cafe_id, category_id)`);
    await queryRunner.query(`CREATE INDEX idx_categories_cafe_parent ON categories(cafe_id, parent_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('modifiers');
    await queryRunner.dropTable('menu_items');
    await queryRunner.dropTable('categories');
  }
         }
