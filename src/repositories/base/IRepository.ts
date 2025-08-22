import type * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { validateSqlIdentifier } from './SqlSafetyUtil';

export interface IRepository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(limit?: number, offset?: number): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<K>;
  update(id: K, updates: Partial<Omit<T, 'id'>>): Promise<void>;
  delete(id: K): Promise<void>;
  count(): Promise<number>;
}

export abstract class BaseRepository<T, K = string> implements IRepository<T, K> {
  protected db: SQLite.SQLiteDatabase;
  protected tableName: string;

  constructor(db: SQLite.SQLiteDatabase, tableName: string) {
    // Validate table name to prevent injection
    if (!validateSqlIdentifier(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    this.db = db;
    this.tableName = tableName;
  }

  abstract findById(id: K): Promise<T | null>;
  abstract findAll(limit?: number, offset?: number): Promise<T[]>;
  abstract create(entity: Omit<T, 'id'>): Promise<K>;
  abstract update(id: K, updates: Partial<Omit<T, 'id'>>): Promise<void>;
  abstract delete(id: K): Promise<void>;

  async count(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return (result as { count: number })?.count || 0;
    } catch (error) {
      console.error(`Failed to count ${this.tableName}:`, error);
      throw error;
    }
  }

  protected generateId(): string {
    return uuidv4();
  }

  protected validateExists(entity: unknown, entityName: string): void {
    if (!entity) {
      throw new Error(`${entityName} not found`);
    }
  }

  protected validateNotEmpty(value: string | undefined | null, fieldName: string): void {
    if (!value?.trim()) {
      throw new Error(`${fieldName} is required`);
    }
  }

  protected validatePositiveNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${fieldName} must be a positive number`);
    }
  }

  protected validateDate(dateString: string, fieldName: string): void {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`${fieldName} must be a valid date`);
    }
  }

  protected validateDecimalPrecision(
    value: number,
    fieldName: string,
    maxDecimals: number = 2
  ): void {
    if (Number((value % 1).toFixed(maxDecimals)) !== value % 1) {
      throw new Error(`${fieldName} cannot have more than ${maxDecimals} decimal places`);
    }
  }

  protected async executeInTransaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.db.execAsync('BEGIN TRANSACTION');
    try {
      const result = await callback();
      await this.db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }
}
