import type { Transaction } from '../db/database';

export interface TransactionWithCompensation extends Transaction {
  compensated_amount?: number;
  remaining_amount?: number;
  is_fully_compensated?: boolean;
}

interface CacheConfig {
  maxInMemoryItems: number;
  windowSize: number;
  preloadBuffer: number;
}

interface CacheWindow {
  startIndex: number;
  endIndex: number;
  transactions: TransactionWithCompensation[];
}

/**
 * Smart cache for managing transactions in memory with virtual windowing
 * Prevents memory leaks by keeping only a limited number of items in memory
 */
export class TransactionCache {
  private config: CacheConfig;
  private cache: Map<number, TransactionWithCompensation> = new Map();
  private windows: CacheWindow[] = [];
  private totalCount: number = 0;
  private currentWindow: CacheWindow | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxInMemoryItems: 100, // Maximum transactions to keep in memory
      windowSize: 50, // Size of each cache window
      preloadBuffer: 20, // Number of items to preload outside visible area
      ...config,
    };
  }

  /**
   * Add transactions to cache with intelligent windowing
   */
  addTransactions(
    transactions: TransactionWithCompensation[],
    startIndex: number,
    totalCount: number
  ): void {
    this.totalCount = totalCount;

    // Add transactions to cache
    transactions.forEach((transaction, i) => {
      const globalIndex = startIndex + i;
      this.cache.set(globalIndex, transaction);
    });

    // Create or update window
    const endIndex = startIndex + transactions.length - 1;
    const window: CacheWindow = {
      startIndex,
      endIndex,
      transactions: [...transactions],
    };

    // Update windows
    this.updateWindows(window);

    // Cleanup old items if cache is too large
    this.cleanupCache();
  }

  /**
   * Get transactions for a specific range (virtual windowing)
   */
  getTransactions(startIndex: number, count: number): TransactionWithCompensation[] {
    const endIndex = startIndex + count - 1;
    const result: TransactionWithCompensation[] = [];

    for (let i = startIndex; i <= endIndex && i < this.totalCount; i++) {
      const transaction = this.cache.get(i);
      if (transaction) {
        result.push(transaction);
      }
    }

    return result;
  }

  /**
   * Get all cached transactions in order (for current window)
   */
  getAllCachedTransactions(): TransactionWithCompensation[] {
    const transactions: TransactionWithCompensation[] = [];
    const sortedIndices = Array.from(this.cache.keys()).sort((a, b) => a - b);

    for (const index of sortedIndices) {
      const transaction = this.cache.get(index);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  }

  /**
   * Check if a range is cached
   */
  isRangeCached(startIndex: number, count: number): boolean {
    const endIndex = startIndex + count - 1;
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.cache.has(i)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get missing ranges that need to be loaded
   */
  getMissingRanges(startIndex: number, count: number): Array<{ start: number; count: number }> {
    const endIndex = startIndex + count - 1;
    const missingRanges: Array<{ start: number; count: number }> = [];
    let rangeStart: number | null = null;

    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.cache.has(i)) {
        if (rangeStart === null) {
          rangeStart = i;
        }
      } else {
        if (rangeStart !== null) {
          missingRanges.push({
            start: rangeStart,
            count: i - rangeStart,
          });
          rangeStart = null;
        }
      }
    }

    // Handle case where missing range extends to the end
    if (rangeStart !== null) {
      missingRanges.push({
        start: rangeStart,
        count: endIndex - rangeStart + 1,
      });
    }

    return missingRanges;
  }

  /**
   * Add a single transaction (for new transactions)
   */
  addTransaction(transaction: TransactionWithCompensation, index?: number): void {
    if (index !== undefined) {
      // Insert at specific position
      this.cache.set(index, transaction);
      this.totalCount = Math.max(this.totalCount, index + 1);
    } else {
      // Add at the beginning (most common case for new transactions)
      this.shiftIndicesForward();
      this.cache.set(0, transaction);
      this.totalCount++;
    }

    this.cleanupCache();
  }

  /**
   * Remove a transaction from cache
   */
  removeTransaction(transactionId: string): boolean {
    let removedIndex: number | null = null;

    // Find and remove the transaction
    for (const [index, transaction] of this.cache.entries()) {
      if (transaction.id === transactionId) {
        this.cache.delete(index);
        removedIndex = index;
        break;
      }
    }

    if (removedIndex !== null) {
      // Shift subsequent indices backward
      this.shiftIndicesBackward(removedIndex);
      this.totalCount--;
      return true;
    }

    return false;
  }

  /**
   * Update a transaction in cache
   */
  updateTransaction(updatedTransaction: TransactionWithCompensation): boolean {
    for (const [index, transaction] of this.cache.entries()) {
      if (transaction.id === updatedTransaction.id) {
        this.cache.set(index, updatedTransaction);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.windows = [];
    this.currentWindow = null;
    this.totalCount = 0;
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    cacheSize: number;
    totalCount: number;
    memoryUsage: string;
    windows: number;
  } {
    const cacheSize = this.cache.size;
    const memoryUsage = `${Math.round((cacheSize / this.config.maxInMemoryItems) * 100)}%`;

    return {
      cacheSize,
      totalCount: this.totalCount,
      memoryUsage,
      windows: this.windows.length,
    };
  }

  /**
   * Private method to update windows
   */
  private updateWindows(newWindow: CacheWindow): void {
    // Remove overlapping windows
    this.windows = this.windows.filter(
      (window) =>
        window.endIndex < newWindow.startIndex || window.startIndex > newWindow.endIndex
    );

    // Add new window
    this.windows.push(newWindow);
    this.currentWindow = newWindow;

    // Keep only recent windows
    if (this.windows.length > 3) {
      this.windows = this.windows.slice(-3);
    }
  }

  /**
   * Private method to cleanup cache when it grows too large
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.config.maxInMemoryItems) {
      return;
    }

    // Find the range of indices to keep (around current window)
    const sortedIndices = Array.from(this.cache.keys()).sort((a, b) => a - b);
    const midPoint = Math.floor(sortedIndices.length / 2);
    const keepStart = Math.max(0, midPoint - Math.floor(this.config.maxInMemoryItems / 2));
    const keepEnd = Math.min(sortedIndices.length - 1, keepStart + this.config.maxInMemoryItems - 1);

    // Create new cache with only the items we want to keep
    const newCache = new Map<number, TransactionWithCompensation>();
    
    for (let i = keepStart; i <= keepEnd; i++) {
      const index = sortedIndices[i];
      const transaction = this.cache.get(index);
      if (transaction) {
        newCache.set(index, transaction);
      }
    }

    this.cache = newCache;

    console.log(`🧹 Cache cleanup: kept ${this.cache.size}/${this.config.maxInMemoryItems} items`);
  }

  /**
   * Private method to shift indices forward (when adding at beginning)
   */
  private shiftIndicesForward(): void {
    const entries = Array.from(this.cache.entries()).sort((a, b) => b[0] - a[0]); // Sort descending
    this.cache.clear();

    for (const [index, transaction] of entries) {
      this.cache.set(index + 1, transaction);
    }
  }

  /**
   * Private method to shift indices backward (when removing)
   */
  private shiftIndicesBackward(removedIndex: number): void {
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[0] - b[0]); // Sort ascending
    this.cache.clear();

    for (const [index, transaction] of entries) {
      if (index > removedIndex) {
        this.cache.set(index - 1, transaction);
      } else {
        this.cache.set(index, transaction);
      }
    }
  }
}