import AsyncStorage from '@react-native-async-storage/async-storage';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import type { Currency } from '../db/database';
import { RepositoryFactory } from '../repositories/RepositoryFactory';

// Types
export interface AppSettings {
  // Currency settings
  defaultCurrency: string;

  // Display settings
  theme: 'light' | 'dark' | 'system';

  // Financial settings
  monthStartDay: number; // 1-28, for custom month cycles

  // Formatting settings
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  numberFormat: 'en-US' | 'es-ES' | 'de-DE'; // For number formatting

  // Behavior settings
  confirmBeforeDelete: boolean;
  autoBackup: boolean;
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly';

  // Privacy settings
  requireAuth: boolean;
  autoLockTimeout: number; // minutes, 0 = disabled

  // Data settings
  defaultTransactionType: string;
  defaultCategory: string;
  itemsPerPage: number;

  // Notification settings
  budgetAlerts: boolean;
  goalReminders: boolean;
}

export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  currencies: Currency[];
}

export interface SettingsContextType {
  state: SettingsState;

  // Settings actions
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (settingsJson: string) => Promise<void>;

  // Helper getters
  getFormattedDate: (date: Date) => string;
  getFormattedNumber: (amount: number) => string;
  getFormattedCurrency: (amount: number, currencySymbol?: string) => string;
  getDefaultCurrency: () => Currency | undefined;
}

// Action types
type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | {
      type: 'UPDATE_SETTING';
      payload: { key: keyof AppSettings; value: AppSettings[keyof AppSettings] };
    }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENCIES'; payload: Currency[] };

// Default settings
const defaultSettings: AppSettings = {
  defaultCurrency: 'usd',
  theme: 'light',
  monthStartDay: 1,
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'en-US',
  confirmBeforeDelete: true,
  autoBackup: false,
  autoBackupFrequency: 'weekly',
  requireAuth: false,
  autoLockTimeout: 0,
  defaultTransactionType: 'expense',
  defaultCategory: 'other',
  itemsPerPage: 20,
  budgetAlerts: true,
  goalReminders: true,
};

// Initial state
const initialState: SettingsState = {
  settings: defaultSettings,
  loading: false,
  error: null,
  isInitialized: false,
  currencies: [],
};

// Storage keys
const STORAGE_KEY = '@MyFinTracker:settings';

// Reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };

    case 'UPDATE_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
      };

    case 'SET_CURRENCIES':
      return {
        ...state,
        currencies: action.payload,
      };

    default:
      return state;
  }
}

// Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider
interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const repositoryFactory = RepositoryFactory.getInstance();

  // Load settings from AsyncStorage
  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsedSettings = JSON.parse(stored);

        // Merge with defaults to handle new settings in app updates
        const mergedSettings = {
          ...defaultSettings,
          ...parsedSettings,
        };

        dispatch({ type: 'SET_SETTINGS', payload: mergedSettings });
      } else {
        // First time - save defaults
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
        dispatch({ type: 'SET_SETTINGS', payload: defaultSettings });
      }

      // Load currencies
      try {
        const currencies = await repositoryFactory.getCurrencies();
        dispatch({ type: 'SET_CURRENCIES', payload: currencies });
      } catch (error) {
        console.warn('Failed to load currencies:', error);
        // Set fallback currencies
        dispatch({
          type: 'SET_CURRENCIES',
          payload: [
            { id: 'usd', code: 'USD', name: 'US Dollar', symbol: '$' },
            { id: 'eur', code: 'EUR', name: 'Euro', symbol: '€' },
          ],
        });
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to load settings:', error);

      // Fallback to defaults
      dispatch({ type: 'SET_SETTINGS', payload: defaultSettings });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [repositoryFactory]);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async (settings: AppSettings): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }, []);

  // Update single setting
  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });

        const newSettings = {
          ...state.settings,
          [key]: value,
        };

        await saveSettings(newSettings);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update setting';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.settings, saveSettings]
  );

  // Update multiple settings
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>): Promise<void> => {
      try {
        dispatch({ type: 'SET_ERROR', payload: null });

        const newSettings = {
          ...state.settings,
          ...updates,
        };

        dispatch({ type: 'SET_SETTINGS', payload: newSettings });
        await saveSettings(newSettings);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.settings, saveSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_SETTINGS', payload: defaultSettings });
      await saveSettings(defaultSettings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [saveSettings]);

  // Export settings
  const exportSettings = useCallback(async (): Promise<string> => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: state.settings,
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.settings]);

  // Import settings
  const importSettings = useCallback(
    async (settingsJson: string): Promise<void> => {
      try {
        const importData = JSON.parse(settingsJson);

        if (!importData.settings) {
          throw new Error('Invalid settings file format');
        }

        // Merge with defaults to handle missing settings
        const mergedSettings = {
          ...defaultSettings,
          ...importData.settings,
        };

        await updateSettings(mergedSettings);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to import settings';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [updateSettings]
  );

  // Formatting helpers
  const getFormattedDate = useCallback(
    (date: Date): string => {
      const { dateFormat } = state.settings;

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();

      switch (dateFormat) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        default:
          return `${day}/${month}/${year}`;
      }
    },
    [state.settings]
  );

  const getFormattedNumber = useCallback(
    (amount: number): string => {
      const { numberFormat } = state.settings;

      return new Intl.NumberFormat(numberFormat, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [state.settings]
  );

  const getFormattedCurrency = useCallback(
    (amount: number, currencySymbol?: string): string => {
      const formattedNumber = getFormattedNumber(amount);

      // Use provided symbol or default currency symbol
      let symbol = currencySymbol;
      if (!symbol) {
        const defaultCurrency = state.currencies.find(
          (c) => c.id === state.settings.defaultCurrency
        );
        symbol = defaultCurrency?.symbol || '$';
      }

      // Different currency positioning based on locale
      const { numberFormat } = state.settings;

      switch (numberFormat) {
        case 'en-US':
          return `${symbol}${formattedNumber}`;
        case 'es-ES':
          return `${formattedNumber} ${symbol}`;
        case 'de-DE':
          return `${formattedNumber} ${symbol}`;
        default:
          return `${symbol}${formattedNumber}`;
      }
    },
    [getFormattedNumber, state.settings, state.currencies]
  );

  const getDefaultCurrency = useCallback((): Currency | undefined => {
    return state.currencies.find((c) => c.id === state.settings.defaultCurrency);
  }, [state.currencies, state.settings.defaultCurrency]);

  // Initialize settings on mount
  useEffect(() => {
    if (!state.isInitialized) {
      loadSettings();
    }
  }, [state.isInitialized, loadSettings]);

  const contextValue: SettingsContextType = {
    state,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getFormattedDate,
    getFormattedNumber,
    getFormattedCurrency,
    getDefaultCurrency,
  };

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};

// Hook
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
