import type * as SQLite from 'expo-sqlite';
import type { Transaction } from '../db/database';
import { BaseRepository } from './base/IRepository';
import { buildSafeUpdateClause } from './base/SqlSafetyUtil';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  typeId?: string;
  categoryId?: string;
  currencyId?: string;
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpensesByCategory {
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export class TransactionRepository extends BaseRepository<Transaction, string> {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, 'transactions');
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const result = await this.db.getFirstAsync(
        `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        WHERE t.id = ?
      `,
        [id]
      );

      return result as Transaction | null;
    } catch (error) {
      console.error('Failed to find transaction by id:', error);
      throw error;
    }
  }

  async findAll(limit?: number, offset?: number): Promise<Transaction[]> {
    try {
      let query = `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        ORDER BY t.date DESC, t.created_at DESC, t.created_at DESC
      `;

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
      return result as Transaction[];
    } catch (error) {
      console.error('Failed to find all transactions:', error);
      throw error;
    }
  }

  async create(transaction: Omit<Transaction, 'id'>): Promise<string> {
    try {
      this.validateTransaction(transaction);

      const id = this.generateId();
      const now = new Date().toISOString();

      await this.db.runAsync(
        `INSERT INTO transactions (id, type_id, category_id, currency_id, amount, date, settlement_id, recurrence_id, note, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          transaction.type_id,
          transaction.category_id,
          transaction.currency_id,
          transaction.amount,
          transaction.date,
          transaction.settlement_id,
          transaction.recurrence_id,
          transaction.note,
          now,
          now,
        ]
      );

      return id;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<void> {
    try {
      // If updating core fields, validate them
      if (
        updates.amount !== undefined ||
        updates.type_id ||
        updates.category_id ||
        updates.currency_id ||
        updates.date ||
        updates.note
      ) {
        // Get current transaction to merge with updates for validation
        const current = await this.findById(id);
        this.validateExists(current, 'Transaction');

        const merged = { ...current!, ...updates };
        this.validateTransaction(merged);
      }

      // Add updated_at timestamp
      const updatesWithTimestamp = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Build safe parameterized query with column validation
      const { setClause, values } = buildSafeUpdateClause('transactions', updatesWithTimestamp);

      if (!setClause) return; // No valid fields to update

      await this.db.runAsync(`UPDATE transactions SET ${setClause} WHERE id = ?`, [...values, id]);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    limit?: number,
    offset?: number
  ): Promise<Transaction[]> {
    try {
      let query = `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        WHERE t.date BETWEEN ? AND ?
        ORDER BY t.date DESC, t.created_at DESC
      `;

      const params: (string | number)[] = [startDate, endDate];
      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);

        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.getAllAsync(query, params);
      return result as Transaction[];
    } catch (error) {
      console.error('Failed to find transactions by date range:', error);
      throw error;
    }
  }

  async search(searchTerm: string, limit?: number, offset?: number): Promise<Transaction[]> {
    try {
      let query = `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        WHERE t.note LIKE ? OR category.name LIKE ? OR type.name LIKE ?
        ORDER BY t.date DESC, t.created_at DESC
      `;

      const searchPattern = `%${searchTerm}%`;
      const params: (string | number)[] = [searchPattern, searchPattern, searchPattern];

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);

        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.getAllAsync(query, params);
      return result as Transaction[];
    } catch (error) {
      console.error('Failed to search transactions:', error);
      throw error;
    }
  }

  async findWithFilters(
    filters: TransactionFilters,
    limit?: number,
    offset?: number
  ): Promise<Transaction[]> {
    try {
      let query = `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        WHERE 1=1
      `;

      const params: (string | number)[] = [];

      if (filters.startDate && filters.endDate) {
        query += ' AND t.date BETWEEN ? AND ?';
        params.push(filters.startDate, filters.endDate);
      }

      if (filters.typeId) {
        query += ' AND t.type_id = ?';
        params.push(filters.typeId);
      }

      if (filters.categoryId) {
        query += ' AND t.category_id = ?';
        params.push(filters.categoryId);
      }

      if (filters.currencyId) {
        query += ' AND t.currency_id = ?';
        params.push(filters.currencyId);
      }

      if (filters.searchTerm) {
        query += ' AND (t.note LIKE ? OR category.name LIKE ? OR type.name LIKE ?)';
        const searchPattern = `%${filters.searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters.minAmount !== undefined) {
        query += ' AND t.amount >= ?';
        params.push(filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query += ' AND t.amount <= ?';
        params.push(filters.maxAmount);
      }

      query += ' ORDER BY t.date DESC, t.created_at DESC';

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);

        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.getAllAsync(query, params);
      return result as Transaction[];
    } catch (error) {
      console.error('Failed to find transactions with filters:', error);
      throw error;
    }
  }

  async findCompensatable(): Promise<Transaction[]> {
    try {
      const result = await this.db.getAllAsync(`
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol,
          COALESCE(SUM(s.amount), 0) as compensated_amount
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        LEFT JOIN settlement s ON t.id = s.compensated_transaction_id
        WHERE t.type_id IN ('expense', 'income', 'investment')
        GROUP BY t.id, t.type_id, t.category_id, t.currency_id, t.amount, t.date, t.settlement_id, t.recurrence_id, t.note, t.created_at, t.updated_at, type.name, category.name, currency.symbol
        HAVING t.amount > COALESCE(SUM(s.amount), 0)
        ORDER BY t.date DESC, t.created_at DESC, t.id DESC
      `);
      return result as Transaction[];
    } catch (error) {
      console.error('Failed to find compensatable transactions:', error);
      throw error;
    }
  }

  async getExpensesByCategory(): Promise<ExpensesByCategory[]> {
    try {
      const result = await this.db.getAllAsync(`
        SELECT 
          c.name as categoryName,
          c.color as categoryColor,
          SUM(t.amount - COALESCE(s.compensated_amount, 0)) as amount
        FROM transactions t
        LEFT JOIN category c ON t.category_id = c.id
        LEFT JOIN (
          SELECT 
            compensated_transaction_id,
            SUM(amount) as compensated_amount
          FROM settlement
          GROUP BY compensated_transaction_id
        ) s ON t.id = s.compensated_transaction_id
        WHERE t.type_id = 'expense'
        GROUP BY t.category_id, c.name, c.color
        HAVING amount > 0
        ORDER BY amount DESC
      `);

      const expenses = result as Array<{
        categoryName: string;
        categoryColor: string;
        amount: number;
      }>;

      // Calculate total to determine percentages
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      if (total === 0) return [];

      // Add percentage to each category
      return expenses.map((expense) => ({
        ...expense,
        percentage: Math.round((expense.amount / total) * 100),
      }));
    } catch (error) {
      console.error('Failed to get expenses by category:', error);
      throw error;
    }
  }

  async getTotalByType(typeId: string): Promise<number> {
    try {
      const result = await this.db.getFirstAsync(
        `SELECT COALESCE(SUM(t.amount - COALESCE(s.compensated_amount, 0)), 0) as total 
         FROM transactions t
         LEFT JOIN (
           SELECT 
             compensated_transaction_id,
             SUM(amount) as compensated_amount
           FROM settlement
           GROUP BY compensated_transaction_id
         ) s ON t.id = s.compensated_transaction_id
         WHERE t.type_id = ?`,
        [typeId]
      );
      return (result as { total: number })?.total || 0;
    } catch (error) {
      console.error(`Failed to get total for type ${typeId}:`, error);
      throw error;
    }
  }

  async getBalance(): Promise<number> {
    try {
      const [incomeResult, expenseResult] = await Promise.all([
        this.getTotalByType('income'),
        this.getTotalByType('expense'),
      ]);

      return incomeResult - expenseResult;
    } catch (error) {
      console.error('Failed to calculate balance:', error);
      throw error;
    }
  }

  async bulkCreate(transactions: Omit<Transaction, 'id'>[]): Promise<string[]> {
    return this.executeInTransaction(async () => {
      const ids: string[] = [];
      for (const transaction of transactions) {
        const id = await this.create(transaction);
        ids.push(id);
      }
      return ids;
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    return this.executeInTransaction(async () => {
      for (const id of ids) {
        await this.delete(id);
      }
    });
  }

  async getTransactionCompensationStatus(transactionId: string): Promise<{
    originalAmount: number;
    compensatedAmount: number;
    remainingAmount: number;
    isFullyCompensated: boolean;
  }> {
    try {
      const result = await this.db.getFirstAsync(
        `
        SELECT 
          t.amount as original_amount,
          COALESCE(SUM(s.amount), 0) as compensated_amount
        FROM transactions t
        LEFT JOIN settlement s ON t.id = s.compensated_transaction_id
        WHERE t.id = ?
        GROUP BY t.id, t.amount
      `,
        [transactionId]
      );

      if (!result) {
        throw new Error('Transaction not found');
      }

      const data = result as { original_amount: number; compensated_amount: number };
      const remainingAmount = data.original_amount - data.compensated_amount;

      return {
        originalAmount: data.original_amount,
        compensatedAmount: data.compensated_amount,
        remainingAmount: Math.max(0, remainingAmount),
        isFullyCompensated: remainingAmount <= 0,
      };
    } catch (error) {
      console.error('Failed to get transaction compensation status:', error);
      throw error;
    }
  }

  async findAllWithCompensationInfo(
    limit?: number,
    offset?: number
  ): Promise<
    Array<
      Transaction & {
        compensated_amount?: number;
        remaining_amount?: number;
        is_fully_compensated?: boolean;
      }
    >
  > {
    try {
      let query = `
        SELECT 
          t.*,
          type.name as type_name,
          category.name as category_name,
          currency.symbol as currency_symbol,
          COALESCE(s.compensated_amount, 0) as compensated_amount,
          (t.amount - COALESCE(s.compensated_amount, 0)) as remaining_amount,
          CASE WHEN t.amount <= COALESCE(s.compensated_amount, 0) THEN 1 ELSE 0 END as is_fully_compensated
        FROM transactions t
        LEFT JOIN type ON t.type_id = type.id
        LEFT JOIN category ON t.category_id = category.id  
        LEFT JOIN currency ON t.currency_id = currency.id
        LEFT JOIN (
          SELECT 
            compensated_transaction_id,
            SUM(amount) as compensated_amount
          FROM settlement
          GROUP BY compensated_transaction_id
        ) s ON t.id = s.compensated_transaction_id
        ORDER BY t.date DESC, t.created_at DESC
      `;

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
      return result as Array<
        Transaction & {
          compensated_amount?: number;
          remaining_amount?: number;
          is_fully_compensated?: boolean;
        }
      >;
    } catch (error) {
      console.error('Failed to find transactions with compensation info:', error);
      throw error;
    }
  }

  private validateTransaction(transaction: Omit<Transaction, 'id'>): void {
    this.validateNotEmpty(transaction.type_id, 'Transaction type');
    this.validateNotEmpty(transaction.category_id, 'Category');
    this.validateNotEmpty(transaction.currency_id, 'Currency');
    this.validateNotEmpty(transaction.note, 'Note/description');
    this.validatePositiveNumber(transaction.amount, 'Amount');
    this.validateDate(transaction.date, 'Date');
    this.validateDecimalPrecision(transaction.amount, 'Amount', 2);

    // SQL injection protection
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i;
    if (sqlPatterns.test(transaction.note)) {
      throw new Error('Invalid characters detected in note field');
    }

    // Amount limit validation
    if (transaction.amount > 999999999) {
      throw new Error('Amount exceeds maximum allowed value');
    }
  }
}
