/**
 * Test suite for SQL Safety Utilities
 * Tests SQL injection prevention mechanisms
 */

import {
  buildSafeUpdateClause,
  validateColumnNames,
  validateSqlIdentifier,
  escapeLikePattern,
  buildSafeOrderByClause,
  ALLOWED_SCHEMAS,
} from '../SqlSafetyUtil';

describe('SqlSafetyUtil', () => {
  describe('validateColumnNames', () => {
    it('should allow valid column names for transactions table', () => {
      expect(() => validateColumnNames('transactions', ['amount', 'description'])).not.toThrow();
    });

    it('should reject invalid column names', () => {
      expect(() => validateColumnNames('transactions', ['evil_column'])).toThrow(
        "Invalid column 'evil_column' for table 'transactions'"
      );
    });

    it('should reject unknown table names', () => {
      expect(() => validateColumnNames('evil_table', ['id'])).toThrow('Unknown table: evil_table');
    });
  });

  describe('buildSafeUpdateClause', () => {
    it('should build safe UPDATE clause for valid columns', () => {
      const updates = { amount: 100, description: 'test' };
      const { setClause, values } = buildSafeUpdateClause('transactions', updates);

      expect(setClause).toBe('amount = ?, description = ?');
      expect(values).toEqual([100, 'test']);
    });

    it('should reject malicious column names', () => {
      const maliciousUpdates = { 'amount; DROP TABLE transactions; --': 100 };

      expect(() => buildSafeUpdateClause('transactions', maliciousUpdates)).toThrow();
    });

    it('should handle empty updates', () => {
      const { setClause, values } = buildSafeUpdateClause('transactions', {});

      expect(setClause).toBe('');
      expect(values).toEqual([]);
    });
  });

  describe('validateSqlIdentifier', () => {
    it('should allow valid SQL identifiers', () => {
      expect(validateSqlIdentifier('valid_table')).toBe(true);
      expect(validateSqlIdentifier('transactions')).toBe(true);
      expect(validateSqlIdentifier('column_name')).toBe(true);
    });

    it('should reject malicious identifiers', () => {
      expect(validateSqlIdentifier('table; DROP TABLE users; --')).toBe(false);
      expect(validateSqlIdentifier("table'; DROP TABLE users; --")).toBe(false);
      expect(validateSqlIdentifier('123table')).toBe(false); // Can't start with number
      expect(validateSqlIdentifier('table-name')).toBe(false); // No hyphens allowed
    });

    it('should reject overly long identifiers', () => {
      const longName = 'a'.repeat(65);
      expect(validateSqlIdentifier(longName)).toBe(false);
    });
  });

  describe('escapeLikePattern', () => {
    it('should escape LIKE pattern special characters', () => {
      expect(escapeLikePattern('test%pattern')).toBe('test\\%pattern');
      expect(escapeLikePattern('test_pattern')).toBe('test\\_pattern');
      expect(escapeLikePattern('test\\pattern')).toBe('test\\\\pattern');
    });

    it('should handle multiple special characters', () => {
      expect(escapeLikePattern('test%_\\pattern')).toBe('test\\%\\_\\\\pattern');
    });
  });

  describe('buildSafeOrderByClause', () => {
    it('should build safe ORDER BY clause', () => {
      const orderBy = buildSafeOrderByClause('transactions', { column: 'date' });
      expect(orderBy).toBe('ORDER BY date ASC');
    });

    it('should handle DESC direction', () => {
      const orderBy = buildSafeOrderByClause('transactions', {
        column: 'amount',
        direction: 'DESC',
      });
      expect(orderBy).toBe('ORDER BY amount DESC');
    });

    it('should validate column names', () => {
      expect(() => buildSafeOrderByClause('transactions', { column: 'evil_column' })).toThrow();
    });

    it('should return empty string for no orderBy', () => {
      const orderBy = buildSafeOrderByClause('transactions');
      expect(orderBy).toBe('');
    });
  });

  describe('SQL injection attack simulation', () => {
    it('should prevent column name injection in UPDATE', () => {
      const maliciousUpdates = {
        'amount = 0; DELETE FROM transactions; --': 100,
        normal_field: 'safe_value',
      };

      expect(() => buildSafeUpdateClause('transactions', maliciousUpdates)).toThrow();
    });

    it('should prevent table name injection', () => {
      expect(() =>
        validateColumnNames("transactions'; DROP TABLE users; --", ['amount'])
      ).toThrow();
    });

    it('should validate schema exists for table', () => {
      expect(ALLOWED_SCHEMAS.transactions).toBeDefined();
      expect(ALLOWED_SCHEMAS.category).toBeDefined();
      expect(ALLOWED_SCHEMAS.currency).toBeDefined();
      expect(ALLOWED_SCHEMAS.type).toBeDefined();
    });
  });
});
