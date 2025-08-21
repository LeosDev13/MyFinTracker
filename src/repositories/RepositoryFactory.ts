import type * as SQLite from 'expo-sqlite';
import { TransactionRepository } from './TransactionRepository';
import { CategoryRepository } from './CategoryRepository';
import type { Currency, TransactionType, Settlement } from '../db/database';

export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private db: SQLite.SQLiteDatabase | null = null;

  private transactionRepository: TransactionRepository | null = null;
  private categoryRepository: CategoryRepository | null = null;

  private constructor() {}

  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  setDatabase(db: SQLite.SQLiteDatabase): void {
    this.db = db;
    // Reset repositories to force recreation with new db
    this.transactionRepository = null;
    this.categoryRepository = null;
  }

  getTransactionRepository(): TransactionRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call setDatabase() first.');
    }

    if (!this.transactionRepository) {
      this.transactionRepository = new TransactionRepository(this.db);
    }

    return this.transactionRepository;
  }

  getCategoryRepository(): CategoryRepository {
    if (!this.db) {
      throw new Error('Database not initialized. Call setDatabase() first.');
    }

    if (!this.categoryRepository) {
      this.categoryRepository = new CategoryRepository(this.db);
    }

    return this.categoryRepository;
  }

  // Helper methods for other entities that don't have full repositories yet
  async getCurrencies(): Promise<Currency[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync('SELECT * FROM currency ORDER BY code');
      return result as Currency[];
    } catch (error) {
      console.error('Failed to get currencies:', error);
      throw error;
    }
  }

  async getTransactionTypes(): Promise<TransactionType[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync('SELECT * FROM type ORDER BY name');
      return result as TransactionType[];
    } catch (error) {
      console.error('Failed to get transaction types:', error);
      throw error;
    }
  }

  async addSettlement(settlement: Omit<Settlement, 'id'>): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const id = `stl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await this.db.runAsync(
        `INSERT INTO settlement (id, compensated_transaction_id, compensation_transaction_id, amount) 
         VALUES (?, ?, ?, ?)`,
        [
          id,
          settlement.compensated_transaction_id,
          settlement.compensation_transaction_id,
          settlement.amount,
        ]
      );

      return id;
    } catch (error) {
      console.error('Failed to add settlement:', error);
      throw error;
    }
  }

  // Utility methods
  async exportToJson(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const [transactions, categories, types, currencies] = await Promise.all([
        this.db.getAllAsync('SELECT * FROM transactions ORDER BY created_at'),
        this.db.getAllAsync('SELECT * FROM category'),
        this.db.getAllAsync('SELECT * FROM type'),
        this.db.getAllAsync('SELECT * FROM currency'),
      ]);

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          transactions,
          categories,
          types,
          currencies,
        },
        meta: {
          transactionCount: transactions.length,
          categoryCount: categories.length,
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export database:', error);
      throw error;
    }
  }

  async exportToCsv(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const transactions = await this.db.getAllAsync(`
        SELECT 
          t.id,
          t.amount,
          t.date,
          t.note,
          type.name as type,
          category.name as category,
          currency.symbol as currency
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        ORDER BY t.date DESC
      `);

      if (transactions.length === 0) {
        return 'No transactions to export';
      }

      // CSV headers
      const headers = ['ID', 'Amount', 'Date', 'Note', 'Type', 'Category', 'Currency'];
      let csv = `${headers.join(',')}\n`;

      // CSV rows
      for (const transaction of transactions as Array<{
        id: string;
        amount: number;
        date: string;
        note: string;
        type: string;
        category: string;
        currency: string;
      }>) {
        const row = [
          `"${transaction.id}"`,
          transaction.amount,
          `"${transaction.date}"`,
          `"${transaction.note.replace(/"/g, '""')}"`, // Escape quotes
          `"${transaction.type}"`,
          `"${transaction.category}"`,
          `"${transaction.currency}"`,
        ];
        csv += `${row.join(',')}\n`;
      }

      return csv;
    } catch (error) {
      console.error('Failed to export database to CSV:', error);
      throw error;
    }
  }

  async getDatabaseStats(): Promise<{
    transactions: number;
    categories: number;
    totalIncome: number;
    totalExpenses: number;
    dbSize: string;
  }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const transactionRepo = this.getTransactionRepository();
      const categoryRepo = this.getCategoryRepository();

      const [transactionCount, categoryCount, totalIncome, totalExpenses] = await Promise.all([
        transactionRepo.count(),
        categoryRepo.count(),
        transactionRepo.getTotalByType('income'),
        transactionRepo.getTotalByType('expense'),
      ]);

      return {
        transactions: transactionCount,
        categories: categoryCount,
        totalIncome,
        totalExpenses,
        dbSize: 'N/A', // SQLite file size not easily accessible in Expo
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}
