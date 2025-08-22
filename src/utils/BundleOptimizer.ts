/**
 * Bundle Optimizer
 * Utilities for reducing bundle size and improving app performance
 */

import type React from 'react';

// Track loaded modules to avoid duplicate imports
const loadedModules = new Set<string>();

/**
 * Dynamic import with caching to prevent duplicate loads
 */
export async function importWithCache<T>(modulePath: string): Promise<T> {
  if (loadedModules.has(modulePath)) {
    // Module already loaded, import again (will use cache)
    return import(modulePath) as Promise<T>;
  }

  try {
    const module = await import(modulePath);
    loadedModules.add(modulePath);
    return module as T;
  } catch (error) {
    console.error(`Failed to import module ${modulePath}:`, error);
    throw error;
  }
}

/**
 * Lazy component wrapper with error boundary
 */
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  return React.lazy(importFn);
}

/**
 * Preload modules based on user interaction patterns
 */
export class ModulePreloader {
  private static instance: ModulePreloader;
  private preloadedModules = new Set<string>();
  private preloadQueue: string[] = [];

  static getInstance(): ModulePreloader {
    if (!ModulePreloader.instance) {
      ModulePreloader.instance = new ModulePreloader();
    }
    return ModulePreloader.instance;
  }

  /**
   * Add module to preload queue
   */
  queuePreload(modulePath: string): void {
    if (!this.preloadedModules.has(modulePath) && !this.preloadQueue.includes(modulePath)) {
      this.preloadQueue.push(modulePath);
    }
  }

  /**
   * Preload queued modules during idle time
   */
  async preloadQueued(): Promise<void> {
    while (this.preloadQueue.length > 0) {
      const modulePath = this.preloadQueue.shift()!;

      try {
        await importWithCache(modulePath);
        this.preloadedModules.add(modulePath);
        console.log(`📦 Preloaded: ${modulePath}`);

        // Small delay to prevent blocking main thread
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        console.warn(`Failed to preload ${modulePath}:`, error);
      }
    }
  }

  /**
   * Preload based on navigation patterns
   */
  preloadForRoute(route: string): void {
    const routeModules: Record<string, string[]> = {
      dashboard: ['./widgets/BalanceTrendWidget', './widgets/ExpensesByCategoryWidget'],
      transactions: ['./TransactionItem', './VirtualizedTransactionList'],
      settings: ['./AddCategoryModal', './ColorPicker'],
    };

    const modules = routeModules[route] || [];
    modules.forEach((module) => this.queuePreload(module));

    // Start preloading in background
    this.preloadQueued();
  }
}

/**
 * Bundle size analyzer (development only)
 */
export class BundleSizeAnalyzer {
  private static importSizes = new Map<string, number>();

  static trackImport(moduleName: string, estimatedSize: number): void {
    if (__DEV__) {
      this.importSizes.set(moduleName, estimatedSize);
      console.log(`📊 ${moduleName}: ~${estimatedSize}KB`);
    }
  }

  static getReport(): { module: string; size: number }[] {
    if (!__DEV__) return [];

    return Array.from(this.importSizes.entries())
      .map(([module, size]) => ({ module, size }))
      .sort((a, b) => b.size - a.size);
  }

  static logReport(): void {
    if (!__DEV__) return;

    const report = this.getReport();
    const totalSize = report.reduce((sum, item) => sum + item.size, 0);

    console.group('📦 Bundle Size Report');
    console.log(`Total tracked size: ~${totalSize}KB`);
    report.slice(0, 10).forEach(({ module, size }) => {
      console.log(`${module}: ~${size}KB`);
    });
    console.groupEnd();
  }
}

// Export singleton instance
export const preloader = ModulePreloader.getInstance();
