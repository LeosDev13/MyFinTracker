import type * as SQLite from 'expo-sqlite';
import type { Category } from '../db/database';
import { BaseRepository } from './base/IRepository';

export interface CategoryUsage {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  totalAmount: number;
}

export class CategoryRepository extends BaseRepository<Category, string> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'category');
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const result = await this.db.getFirstAsync('SELECT * FROM category WHERE id = ?', [id]);
      return result as Category | null;
    } catch (error) {
      console.error('Failed to find category by id:', error);
      throw error;
    }
  }

  async findAll(limit?: number, offset?: number): Promise<Category[]> {
    try {
      let query = 'SELECT * FROM category ORDER BY name';
      const params: (string | number)[] = [];

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);

        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.getAllAsync(query, params);
      return result as Category[];
    } catch (error) {
      console.error('Failed to find all categories:', error);
      throw error;
    }
  }

  async create(category: Omit<Category, 'id'>): Promise<string> {
    try {
      this.validateCategory(category);

      // Generate ID from name
      const id = category.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      // Check if ID already exists
      const existing = await this.findById(id);
      if (existing) {
        throw new Error(`Category with name "${category.name}" already exists`);
      }

      await this.db.runAsync('INSERT INTO category (id, name, color, icon) VALUES (?, ?, ?, ?)', [
        id,
        category.name,
        category.color || '#BDC3C7',
        category.icon || 'more-horizontal',
      ]);

      return id;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<Category, 'id'>>): Promise<void> {
    try {
      // If updating name, validate it
      if (updates.name !== undefined) {
        this.validateNotEmpty(updates.name, 'Category name');

        // Check if new name conflicts with existing category
        const newId = updates.name
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        if (newId !== id) {
          const existing = await this.findById(newId);
          if (existing) {
            throw new Error(`Category with name "${updates.name}" already exists`);
          }
        }
      }

      const fields = Object.keys(updates);
      const values = Object.values(updates);

      if (fields.length === 0) return;

      const setClause = fields.map((field) => `${field} = ?`).join(', ');
      await this.db.runAsync(`UPDATE category SET ${setClause} WHERE id = ?`, [...values, id]);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if category is used in transactions
      const usageCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
        [id]
      );

      if ((usageCount as { count: number })?.count > 0) {
        throw new Error('Cannot delete category that is used in transactions');
      }

      await this.db.runAsync('DELETE FROM category WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<Category | null> {
    try {
      const result = await this.db.getFirstAsync('SELECT * FROM category WHERE name = ?', [name]);
      return result as Category | null;
    } catch (error) {
      console.error('Failed to find category by name:', error);
      throw error;
    }
  }

  async search(searchTerm: string, limit?: number): Promise<Category[]> {
    try {
      let query = 'SELECT * FROM category WHERE name LIKE ? ORDER BY name';
      const params: (string | number)[] = [`%${searchTerm}%`];

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const result = await this.db.getAllAsync(query, params);
      return result as Category[];
    } catch (error) {
      console.error('Failed to search categories:', error);
      throw error;
    }
  }

  async findUnused(): Promise<Category[]> {
    try {
      const result = await this.db.getAllAsync(`
        SELECT c.* 
        FROM category c
        LEFT JOIN transactions t ON c.id = t.category_id
        WHERE t.category_id IS NULL
        ORDER BY c.name
      `);
      return result as Category[];
    } catch (error) {
      console.error('Failed to find unused categories:', error);
      throw error;
    }
  }

  async getCategoryUsage(): Promise<CategoryUsage[]> {
    try {
      const result = await this.db.getAllAsync(`
        SELECT 
          c.id as categoryId,
          c.name as categoryName,
          COUNT(t.id) as transactionCount,
          COALESCE(SUM(t.amount), 0) as totalAmount
        FROM category c
        LEFT JOIN transactions t ON c.id = t.category_id
        GROUP BY c.id, c.name
        ORDER BY transactionCount DESC, totalAmount DESC
      `);
      return result as CategoryUsage[];
    } catch (error) {
      console.error('Failed to get category usage:', error);
      throw error;
    }
  }

  async getMostUsedCategories(limit: number = 5): Promise<Category[]> {
    try {
      const result = await this.db.getAllAsync(
        `
        SELECT c.*
        FROM category c
        INNER JOIN (
          SELECT category_id, COUNT(*) as usage_count
          FROM transactions
          GROUP BY category_id
          ORDER BY usage_count DESC
          LIMIT ?
        ) t ON c.id = t.category_id
        ORDER BY t.usage_count DESC
      `,
        [limit]
      );
      return result as Category[];
    } catch (error) {
      console.error('Failed to get most used categories:', error);
      throw error;
    }
  }

  async bulkCreate(categories: Omit<Category, 'id'>[]): Promise<string[]> {
    return this.executeInTransaction(async () => {
      const ids: string[] = [];
      for (const category of categories) {
        const id = await this.create(category);
        ids.push(id);
      }
      return ids;
    });
  }

  async bulkImport(categories: Category[]): Promise<void> {
    return this.executeInTransaction(async () => {
      for (const category of categories) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO category (id, name, color, icon) VALUES (?, ?, ?, ?)',
          [category.id, category.name, category.color, category.icon]
        );
      }
    });
  }

  async getDefaultCategories(): Promise<Category[]> {
    try {
      const defaultCategoryIds = [
        'food',
        'transport',
        'entertainment',
        'shopping',
        'bills',
        'health',
        'salary',
        'investment',
        'other',
      ];
      const result = await this.db.getAllAsync(
        `
        SELECT * FROM category 
        WHERE id IN (${defaultCategoryIds.map(() => '?').join(',')})
        ORDER BY name
      `,
        defaultCategoryIds
      );
      return result as Category[];
    } catch (error) {
      console.error('Failed to get default categories:', error);
      throw error;
    }
  }

  async ensureDefaultCategories(): Promise<void> {
    try {
      const existingCategories = await this.findAll();
      if (existingCategories.length > 0) return;

      const defaultCategories = [
        { name: 'Food & Dining', color: '#FF6B6B', icon: 'utensils' },
        { name: 'Transportation', color: '#4ECDC4', icon: 'car' },
        { name: 'Entertainment', color: '#45B7D1', icon: 'gamepad-2' },
        { name: 'Shopping', color: '#96CEB4', icon: 'shopping-bag' },
        { name: 'Bills & Utilities', color: '#FFEAA7', icon: 'receipt' },
        { name: 'Health & Medical', color: '#DDA0DD', icon: 'heart' },
        { name: 'Salary', color: '#98D8C8', icon: 'banknote' },
        { name: 'Investment', color: '#2E7D32', icon: 'trending-up' },
        { name: 'Other', color: '#BDC3C7', icon: 'more-horizontal' },
      ];

      await this.bulkCreate(defaultCategories);
    } catch (error) {
      console.error('Failed to ensure default categories:', error);
      throw error;
    }
  }

  private validateCategory(category: Omit<Category, 'id'>): void {
    this.validateNotEmpty(category.name, 'Category name');

    // Validate color format (hex color)
    if (category.color && !/^#[0-9A-F]{6}$/i.test(category.color)) {
      throw new Error('Color must be a valid hex color code (e.g., #FF6B6B)');
    }

    // Validate icon name (basic validation)
    if (category.icon && category.icon.length > 50) {
      throw new Error('Icon name cannot exceed 50 characters');
    }

    // Validate name length
    if (category.name.length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }
  }
}
