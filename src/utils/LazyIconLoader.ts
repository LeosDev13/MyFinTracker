/**
 * Lazy Icon Loader
 * Dynamically imports Lucide icons to reduce initial bundle size
 * Only loads icons when they're actually needed
 */

import type { LucideIcon } from 'lucide-react-native';
// Import all required icons statically for React Native compatibility
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Home,
  Info,
  List,
  Menu,
  MoreVertical,
  PieChart,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';

// Cache for loaded icons to prevent re-lookups
const iconCache = new Map<string, LucideIcon>();

// Static mapping of icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  ArrowLeft,
  Settings,
  Home,
  List,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
  Calendar,
  PieChart,
  BarChart3,
  CreditCard,
  Wallet,
  Target,
  Clock,
  Check,
  X,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreVertical,
  Zap,
  PiggyBank,
  // Support for kebab-case icon names
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'bar-chart-3': BarChart3,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'arrow-left': ArrowLeft,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'more-vertical': MoreVertical,
  'alert-circle': AlertCircle,
  'refresh-cw': RefreshCw,
};

// Common icons that should be preloaded
const CORE_ICONS = [
  'Plus',
  'ArrowLeft',
  'Settings',
  'Home',
  'List',
  'TrendingUp',
  'DollarSign',
  'Eye',
  'EyeOff',
] as const;

type CoreIconName = (typeof CORE_ICONS)[number];

/**
 * Loads an icon from the static map and caches it
 */
export async function loadIcon(iconName: string): Promise<LucideIcon | null> {
  // Return from cache if already loaded
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  try {
    const IconComponent = ICON_MAP[iconName];

    if (IconComponent) {
      iconCache.set(iconName, IconComponent);
      return IconComponent;
    }

    console.warn(`Icon ${iconName} not found in ICON_MAP`);
    return null;
  } catch (error) {
    console.error(`Failed to load icon ${iconName}:`, error);
    return null;
  }
}

/**
 * Preloads core icons during app initialization
 */
export function preloadCoreIcons(): void {
  try {
    CORE_ICONS.forEach((iconName) => {
      loadIcon(iconName);
    });
    console.log('✅ Core icons preloaded');
  } catch (error) {
    console.error('Failed to preload core icons:', error);
  }
}

/**
 * React hook for using lazy-loaded icons
 */
export function useLazyIcon(iconName: string) {
  const [IconComponent, setIconComponent] = useState<LucideIcon | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Since loadIcon is now synchronous, we can use it directly
    loadIcon(iconName).then((icon) => {
      setIconComponent(icon);
      setIsLoading(false);
    });
  }, [iconName]);

  return { icon: IconComponent, isLoading };
}

/**
 * Synchronous icon getter for when you need immediate access
 */
export function getIcon(iconName: string): LucideIcon | null {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    iconCache.set(iconName, IconComponent);
    return IconComponent;
  }

  return null;
}

/**
 * Get all available icon names
 */
export function getAvailableIconNames(): string[] {
  return Object.keys(ICON_MAP);
}

/**
 * Fallback icon component
 */
export const FallbackIcon: LucideIcon = AlertCircle;

// Export core icon names for TypeScript
export type { CoreIconName };
