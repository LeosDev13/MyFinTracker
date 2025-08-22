/**
 * SQL Safety Utilities for preventing SQL injection attacks
 * Provides column name validation and safe SQL building
 */

export interface TableSchema {
  [tableName: string]: {
    columns: string[];
    requiredColumns?: string[];
  };
}

/**
 * Database schema defining allowed columns for each table
 */
export const ALLOWED_SCHEMAS: TableSchema = {
  transactions: {
    columns: [
      'id',
      'amount',
      'description',
      'note',
      'date',
      'type_id',
      'category_id',
      'currency_id',
      'created_at',
      'updated_at',
    ],
    requiredColumns: ['amount', 'type_id', 'currency_id', 'date'],
  },
  category: {
    columns: ['id', 'name', 'color', 'icon', 'created_at', 'updated_at'],
    requiredColumns: ['name', 'color'],
  },
  currency: {
    columns: ['id', 'name', 'code', 'symbol', 'created_at', 'updated_at'],
    requiredColumns: ['name', 'code', 'symbol'],
  },
  type: {
    columns: ['id', 'name', 'created_at', 'updated_at'],
    requiredColumns: ['name'],
  },
};

/**
 * Validates that all field names are allowed for the specified table
 * Prevents SQL injection through column name injection
 */
export function validateColumnNames(tableName: string, fieldNames: string[]): void {
  const schema = ALLOWED_SCHEMAS[tableName];
  if (!schema) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  for (const fieldName of fieldNames) {
    if (!schema.columns.includes(fieldName)) {
      throw new Error(`Invalid column '${fieldName}' for table '${tableName}'`);
    }
  }
}

/**
 * Safely builds a parameterized UPDATE SET clause
 * All column names are validated against schema
 */
export function buildSafeUpdateClause(
  tableName: string,
  updates: Record<string, unknown>
): { setClause: string; values: unknown[] } {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) {
    return { setClause: '', values: [] };
  }

  // Validate all column names against schema
  validateColumnNames(tableName, fields);

  // Build safe parameterized SET clause
  const setClause = fields.map((field) => `${field} = ?`).join(', ');

  return { setClause, values };
}

/**
 * Validates WHERE clause column names for safe queries
 */
export function validateWhereColumns(tableName: string, whereColumns: string[]): void {
  validateColumnNames(tableName, whereColumns);
}

/**
 * Safely builds ORDER BY clause with column validation
 */
export function buildSafeOrderByClause(
  tableName: string,
  orderBy?: { column: string; direction?: 'ASC' | 'DESC' }
): string {
  if (!orderBy) return '';

  validateColumnNames(tableName, [orderBy.column]);

  const direction = orderBy.direction === 'DESC' ? 'DESC' : 'ASC';
  return `ORDER BY ${orderBy.column} ${direction}`;
}

/**
 * Escapes SQL LIKE pattern special characters
 */
export function escapeLikePattern(pattern: string): string {
  return pattern
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/%/g, '\\%') // Escape percent signs
    .replace(/_/g, '\\_'); // Escape underscores
}

/**
 * Validates that a string contains only safe characters for SQL identifiers
 * Used for table names, column names, etc.
 */
export function validateSqlIdentifier(identifier: string): boolean {
  // Allow alphanumeric characters, underscores, but not starting with number
  const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return pattern.test(identifier) && identifier.length <= 64;
}
