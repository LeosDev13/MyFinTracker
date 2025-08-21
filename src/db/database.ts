import * as SQLite from 'expo-sqlite';
import { RepositoryFactory } from '../repositories/RepositoryFactory';

export interface Transaction {
  id: string;
  type_id: string;
  category_id: string;
  currency_id: string;
  amount: number;
  date: string;
  settlement_id: string | null;
  recurrence_id: string | null;
  note: string;
  created_at?: string;
  updated_at?: string;
  type_name?: string;
  category_name?: string;
  currency_symbol?: string;
}

export interface TransactionType {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export interface Settlement {
  id: string;
  compensated_transaction_id: string;
  compensation_transaction_id: string;
  amount: number;
}

let db: SQLite.SQLiteDatabase;
const repositoryFactory = RepositoryFactory.getInstance();

const init = async (): Promise<void> => {
  try {
    console.log('Initializing database...');

    db = await SQLite.openDatabaseAsync('myfintracker.db');

    repositoryFactory.setDatabase(db);

    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS type (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS category (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS currency (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurrence (
        id TEXT PRIMARY KEY,
        frequency INTEGER NOT NULL,
        interval INTEGER NOT NULL,
        end_date TEXT
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        currency_id TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        settlement_id TEXT,
        recurrence_id TEXT,
        note TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_id) REFERENCES type(id),
        FOREIGN KEY (category_id) REFERENCES category(id),
        FOREIGN KEY (currency_id) REFERENCES currency(id),
        FOREIGN KEY (recurrence_id) REFERENCES recurrence(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settlement (
        id TEXT PRIMARY KEY,
        compensated_transaction_id TEXT NOT NULL,
        compensation_transaction_id TEXT NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (compensated_transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (compensation_transaction_id) REFERENCES transactions(id)
      );
    `);

    // Add settlement_id foreign key constraint if it doesn't exist
    try {
      await db.execAsync(`
        ALTER TABLE transactions ADD CONSTRAINT fk_settlement 
        FOREIGN KEY (settlement_id) REFERENCES settlement(id);
      `);
    } catch (_error) {
      // Constraint might already exist, ignore error
      console.log('Settlement foreign key constraint may already exist');
    }

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_id ON transactions(type_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
      CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(date DESC, type_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date_category ON transactions(date DESC, category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
      
      -- Composite index for dashboard queries
      CREATE INDEX IF NOT EXISTS idx_transactions_dashboard ON transactions(type_id, date DESC, amount);
      
      -- Index for expense categorization
      CREATE INDEX IF NOT EXISTS idx_transactions_expenses ON transactions(type_id, category_id) WHERE type_id = 'expense';
    `);

    await insertDefaultData();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const insertDefaultData = async (): Promise<void> => {
  try {
    const typeCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM type');
    if ((typeCount as { count: number })?.count > 0) return;

    await db.execAsync(`
      INSERT INTO type (id, name) VALUES 
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('compensation', 'Compensation'),
        ('savings', 'Savings');
    `);

    await db.execAsync(`
      INSERT INTO category (id, name, color, icon) VALUES 
        ('food', 'Food & Dining', '#FF6B6B', 'utensils'),
        ('transport', 'Transportation', '#4ECDC4', 'car'),
        ('entertainment', 'Entertainment', '#45B7D1', 'gamepad-2'),
        ('shopping', 'Shopping', '#96CEB4', 'shopping-bag'),
        ('bills', 'Bills & Utilities', '#FFEAA7', 'receipt'),
        ('health', 'Health & Medical', '#DDA0DD', 'heart'),
        ('salary', 'Salary', '#98D8C8', 'banknote'),
        ('savings', 'Savings', '#7C3AED', 'piggy-bank'),
        ('other', 'Other', '#BDC3C7', 'more-horizontal');
    `);

    await db.execAsync(`
      INSERT INTO currency (id, code, name, symbol) VALUES 
        ('usd', 'USD', 'US Dollar', '$'),
        ('eur', 'EUR', 'Euro', '€'),
        ('gbp', 'GBP', 'British Pound', '£');
    `);
  } catch (error) {
    console.error('Failed to insert default data:', error);
    throw error;
  }
};

const validateTransaction = (transaction: Omit<Transaction, 'id'>): void => {
  if (!transaction.type_id?.trim()) {
    throw new Error('Transaction type is required');
  }
  if (!transaction.category_id?.trim()) {
    throw new Error('Category is required');
  }
  if (!transaction.currency_id?.trim()) {
    throw new Error('Currency is required');
  }
  if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (!transaction.date?.trim()) {
    throw new Error('Date is required');
  }
  if (!transaction.note?.trim()) {
    throw new Error('Note/description is required');
  }

  const date = new Date(transaction.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  if (Number((transaction.amount % 1).toFixed(2)) !== transaction.amount % 1) {
    throw new Error('Amount cannot have more than 2 decimal places');
  }
};

const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  return repositoryFactory.getTransactionRepository().create(transaction);
};

const getTransactions = async (limit?: number, offset?: number): Promise<Transaction[]> => {
  return repositoryFactory.getTransactionRepository().findAll(limit, offset);
};

const getTransactionsCount = async (): Promise<number> => {
  return repositoryFactory.getTransactionRepository().count();
};

const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string,
  limit?: number,
  offset?: number
): Promise<Transaction[]> => {
  return repositoryFactory
    .getTransactionRepository()
    .findByDateRange(startDate, endDate, limit, offset);
};

const searchTransactions = async (
  searchTerm: string,
  limit?: number,
  offset?: number
): Promise<Transaction[]> => {
  return repositoryFactory.getTransactionRepository().search(searchTerm, limit, offset);
};

const getTransactionById = async (id: string): Promise<Transaction | null> => {
  return repositoryFactory.getTransactionRepository().findById(id);
};

const updateTransaction = async (
  id: string,
  updates: Partial<Omit<Transaction, 'id'>>
): Promise<void> => {
  return repositoryFactory.getTransactionRepository().update(id, updates);
};

const deleteTransaction = async (id: string): Promise<void> => {
  return repositoryFactory.getTransactionRepository().delete(id);
};

const getTransactionTypes = async (): Promise<TransactionType[]> => {
  return repositoryFactory.getTransactionTypes();
};

const getCategories = async (): Promise<Category[]> => {
  return repositoryFactory.getCategoryRepository().findAll();
};

const getCurrencies = async (): Promise<Currency[]> => {
  return repositoryFactory.getCurrencies();
};

const getCompensatableTransactions = async (): Promise<Transaction[]> => {
  return repositoryFactory.getTransactionRepository().findCompensatable();
};

const getExpensesByCategory = async (): Promise<
  Array<{
    categoryName: string;
    categoryColor: string;
    amount: number;
    percentage: number;
  }>
> => {
  return repositoryFactory.getTransactionRepository().getExpensesByCategory();
};

const addSettlement = async (settlement: Omit<Settlement, 'id'>): Promise<string> => {
  return repositoryFactory.addSettlement(settlement);
};

const addCategory = async (
  name: string,
  color: string = '#BDC3C7',
  icon: string = 'more-horizontal'
): Promise<string> => {
  return repositoryFactory.getCategoryRepository().create({ name, color, icon });
};

const exportDatabaseToJson = async (): Promise<string> => {
  return repositoryFactory.exportToJson();
};

const exportDatabaseToCsv = async (): Promise<string> => {
  return repositoryFactory.exportToCsv();
};

const importCategories = async (categories: Category[]): Promise<void> => {
  for (const category of categories) {
    await db.runAsync(
      'INSERT OR IGNORE INTO category (id, name, color, icon) VALUES (?, ?, ?, ?)',
      [category.id, category.name, category.color, category.icon]
    );
  }
};

const importCurrencies = async (currencies: Currency[]): Promise<void> => {
  for (const currency of currencies) {
    await db.runAsync(
      'INSERT OR IGNORE INTO currency (id, code, name, symbol) VALUES (?, ?, ?, ?)',
      [currency.id, currency.code, currency.name, currency.symbol]
    );
  }
};

const importTypes = async (types: TransactionType[]): Promise<void> => {
  for (const type of types) {
    await db.runAsync('INSERT OR IGNORE INTO type (id, name) VALUES (?, ?)', [type.id, type.name]);
  }
};

const importTransactions = async (transactions: Transaction[]): Promise<void> => {
  for (const transaction of transactions) {
    await db.runAsync(
      `INSERT INTO transactions 
       (id, type_id, category_id, currency_id, amount, date, settlement_id, recurrence_id, note, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.type_id,
        transaction.category_id,
        transaction.currency_id,
        transaction.amount,
        transaction.date,
        transaction.settlement_id,
        transaction.recurrence_id,
        transaction.note,
        transaction.created_at || new Date().toISOString(),
        transaction.updated_at || new Date().toISOString(),
      ]
    );
  }
};

const importDatabaseFromJson = async (jsonData: string): Promise<void> => {
  try {
    const importData = JSON.parse(jsonData);

    if (!importData.version || !importData.data) {
      throw new Error('Invalid backup file format');
    }

    // Begin transaction for atomic import
    await db.execAsync('BEGIN TRANSACTION');

    try {
      // Clear existing data (optional - could be made configurable)
      await db.execAsync('DELETE FROM transactions');

      // Import data
      if (importData.data.categories) {
        await importCategories(importData.data.categories);
      }
      if (importData.data.currencies) {
        await importCurrencies(importData.data.currencies);
      }
      if (importData.data.types) {
        await importTypes(importData.data.types);
      }
      if (importData.data.transactions) {
        await importTransactions(importData.data.transactions);
      }

      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Failed to import database:', error);
    throw error;
  }
};

const getDatabaseStats = async (): Promise<{
  transactions: number;
  categories: number;
  totalIncome: number;
  totalExpenses: number;
  dbSize: string;
}> => {
  return repositoryFactory.getDatabaseStats();
};

const deleteCategory = async (id: string): Promise<void> => {
  return repositoryFactory.getCategoryRepository().delete(id);
};

const getTransactionCompensationStatus = async (
  transactionId: string
): Promise<{
  originalAmount: number;
  compensatedAmount: number;
  remainingAmount: number;
  isFullyCompensated: boolean;
}> => {
  return repositoryFactory
    .getTransactionRepository()
    .getTransactionCompensationStatus(transactionId);
};

const getTransactionsWithCompensationInfo = async (
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
> => {
  return repositoryFactory.getTransactionRepository().findAllWithCompensationInfo(limit, offset);
};

export const Database = {
  init,
  addTransaction,
  getTransactions,
  getTransactionsCount,
  getTransactionsByDateRange,
  searchTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionTypes,
  getCategories,
  getCurrencies,
  getCompensatableTransactions,
  getExpensesByCategory,
  addSettlement,
  addCategory,
  deleteCategory,
  exportDatabaseToJson,
  exportDatabaseToCsv,
  importDatabaseFromJson,
  getDatabaseStats,
  validateTransaction,
  getTransactionCompensationStatus,
  getTransactionsWithCompensationInfo,
};
