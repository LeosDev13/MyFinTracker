import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { Category, Currency, Transaction, TransactionType } from '../db/database';
import { RepositoryFactory } from '../repositories/RepositoryFactory';

// Types
export interface LoadingState {
  transactions: boolean;
  categories: boolean;
  currencies: boolean;
  types: boolean;
  dashboard: boolean;
}

export interface ErrorState {
  transactions: string | null;
  categories: string | null;
  currencies: string | null;
  types: string | null;
  dashboard: string | null;
  general: string | null;
}

export type TransactionWithCompensation = Transaction & {
  compensated_amount?: number;
  remaining_amount?: number;
  is_fully_compensated?: boolean;
};

export interface AppState {
  // Data
  transactions: TransactionWithCompensation[];
  categories: Category[];
  currencies: Currency[];
  transactionTypes: TransactionType[];

  // Pagination
  transactionsCount: number;
  currentPage: number;
  itemsPerPage: number;

  // Loading states
  loading: LoadingState;

  // Error states
  errors: ErrorState;

  // Calculated values
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;

  // UI State
  refreshing: boolean;
}

export interface AppContextType {
  state: AppState;

  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<string>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  loadTransactionsPage: (page: number) => Promise<void>;
  searchTransactions: (searchTerm: string) => Promise<void>;

  // Category actions
  addCategory: (name: string, color: string, icon?: string) => Promise<string>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;

  // Currency actions
  refreshCurrencies: () => Promise<void>;

  // General actions
  refreshAll: () => Promise<void>;
  clearError: (type: keyof ErrorState) => void;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: { key: keyof LoadingState; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof ErrorState; value: string | null } }
  | {
      type: 'SET_TRANSACTIONS';
      payload: { transactions: TransactionWithCompensation[]; count: number };
    }
  | { type: 'ADD_TRANSACTION'; payload: TransactionWithCompensation }
  | {
      type: 'UPDATE_TRANSACTION';
      payload: { id: string; transaction: TransactionWithCompensation };
    }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_CURRENCIES'; payload: Currency[] }
  | { type: 'SET_TRANSACTION_TYPES'; payload: TransactionType[] }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'CALCULATE_TOTALS' };

// Initial state
const initialState: AppState = {
  transactions: [],
  categories: [],
  currencies: [],
  transactionTypes: [],
  transactionsCount: 0,
  currentPage: 1,
  itemsPerPage: 20,
  loading: {
    transactions: false,
    categories: false,
    currencies: false,
    types: false,
    dashboard: false,
  },
  errors: {
    transactions: null,
    categories: null,
    currencies: null,
    types: null,
    dashboard: null,
    general: null,
  },
  balance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  totalSavings: 0,
  refreshing: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_TRANSACTIONS': {
      const newState = {
        ...state,
        transactions: action.payload.transactions,
        transactionsCount: action.payload.count,
      };
      return calculateTotals(newState);
    }

    case 'ADD_TRANSACTION': {
      const addState = {
        ...state,
        transactions: [action.payload, ...state.transactions],
        transactionsCount: state.transactionsCount + 1,
      };
      return calculateTotals(addState);
    }

    case 'UPDATE_TRANSACTION': {
      const updateState = {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload.transaction : t
        ),
      };
      return calculateTotals(updateState);
    }

    case 'DELETE_TRANSACTION': {
      const deleteState = {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
        transactionsCount: state.transactionsCount - 1,
      };
      return calculateTotals(deleteState);
    }

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };

    case 'SET_CURRENCIES':
      return {
        ...state,
        currencies: action.payload,
      };

    case 'SET_TRANSACTION_TYPES':
      return {
        ...state,
        transactionTypes: action.payload,
      };

    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };

    case 'SET_REFRESHING':
      return {
        ...state,
        refreshing: action.payload,
      };

    case 'CALCULATE_TOTALS':
      return calculateTotals(state);

    default:
      return state;
  }
}

// Helper function to calculate totals
function calculateTotals(state: AppState): AppState {
  const totalIncome = state.transactions
    .filter((t) => t.type_name === 'Income')
    .reduce((sum, t) => {
      const effectiveAmount = t.remaining_amount !== undefined ? t.remaining_amount : t.amount;
      return sum + effectiveAmount;
    }, 0);

  const totalExpenses = state.transactions
    .filter((t) => t.type_name === 'Expense')
    .reduce((sum, t) => {
      const effectiveAmount = t.remaining_amount !== undefined ? t.remaining_amount : t.amount;
      return sum + effectiveAmount;
    }, 0);

  const totalSavings = state.transactions
    .filter((t) => t.type_name === 'Savings')
    .reduce((sum, t) => {
      const effectiveAmount = t.remaining_amount !== undefined ? t.remaining_amount : t.amount;
      return sum + effectiveAmount;
    }, 0);

  // Balance excludes savings - it's just income minus expenses
  const balance = totalIncome - totalExpenses;

  return {
    ...state,
    totalIncome,
    totalExpenses,
    totalSavings,
    balance,
  };
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get repository factory instance
  const repositoryFactory = RepositoryFactory.getInstance();

  // Helper to handle async operations with loading and error states
  const handleAsync = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      loadingKey: keyof LoadingState,
      errorKey: keyof ErrorState
    ): Promise<T | null> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, value: true } });
        dispatch({ type: 'SET_ERROR', payload: { key: errorKey, value: null } });

        const result = await operation();
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        dispatch({ type: 'SET_ERROR', payload: { key: errorKey, value: errorMessage } });
        console.error(`Error in ${loadingKey}:`, error);
        return null;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, value: false } });
      }
    },
    []
  );

  // Transaction actions
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
      const result = await handleAsync(
        async () => {
          const transactionRepo = repositoryFactory.getTransactionRepository();
          const id = await transactionRepo.create(transaction);

          // Get the newly created transaction with all joined data and compensation info
          const newTransactions = await transactionRepo.findAllWithCompensationInfo(1, 0);
          const newTransaction = newTransactions.find((t) => t.id === id);
          if (newTransaction) {
            dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
          }

          return id;
        },
        'transactions',
        'transactions'
      );

      return result || '';
    },
    [handleAsync, repositoryFactory]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<void> => {
      await handleAsync(
        async () => {
          const transactionRepo = repositoryFactory.getTransactionRepository();
          await transactionRepo.update(id, updates);

          // Get the updated transaction with compensation info
          const updatedTransactions = await transactionRepo.findAllWithCompensationInfo();
          const updatedTransaction = updatedTransactions.find((t) => t.id === id);
          if (updatedTransaction) {
            dispatch({
              type: 'UPDATE_TRANSACTION',
              payload: { id, transaction: updatedTransaction },
            });
          }
        },
        'transactions',
        'transactions'
      );
    },
    [handleAsync, repositoryFactory]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      await handleAsync(
        async () => {
          const transactionRepo = repositoryFactory.getTransactionRepository();
          await transactionRepo.delete(id);
          dispatch({ type: 'DELETE_TRANSACTION', payload: id });
        },
        'transactions',
        'transactions'
      );
    },
    [handleAsync, repositoryFactory]
  );

  const refreshTransactions = useCallback(async (): Promise<void> => {
    await handleAsync(
      async () => {
        const transactionRepo = repositoryFactory.getTransactionRepository();
        const [transactions, count] = await Promise.all([
          transactionRepo.findAllWithCompensationInfo(
            state.itemsPerPage,
            (state.currentPage - 1) * state.itemsPerPage
          ),
          transactionRepo.count(),
        ]);

        dispatch({ type: 'SET_TRANSACTIONS', payload: { transactions, count } });
      },
      'transactions',
      'transactions'
    );
  }, [handleAsync, repositoryFactory, state.currentPage, state.itemsPerPage]);

  const loadTransactionsPage = useCallback(
    async (page: number): Promise<void> => {
      dispatch({ type: 'SET_PAGE', payload: page });

      await handleAsync(
        async () => {
          const transactionRepo = repositoryFactory.getTransactionRepository();
          const transactions = await transactionRepo.findAllWithCompensationInfo(
            state.itemsPerPage,
            (page - 1) * state.itemsPerPage
          );

          dispatch({
            type: 'SET_TRANSACTIONS',
            payload: { transactions, count: state.transactionsCount },
          });
        },
        'transactions',
        'transactions'
      );
    },
    [handleAsync, repositoryFactory, state.itemsPerPage, state.transactionsCount]
  );

  const searchTransactions = useCallback(
    async (searchTerm: string): Promise<void> => {
      await handleAsync(
        async () => {
          const transactionRepo = repositoryFactory.getTransactionRepository();
          const transactions = searchTerm.trim()
            ? await transactionRepo.search(searchTerm, state.itemsPerPage)
            : await transactionRepo.findAll(state.itemsPerPage);

          dispatch({
            type: 'SET_TRANSACTIONS',
            payload: { transactions, count: transactions.length },
          });
        },
        'transactions',
        'transactions'
      );
    },
    [handleAsync, repositoryFactory, state.itemsPerPage]
  );

  // Category actions
  const addCategory = useCallback(
    async (name: string, color: string, icon = 'more-horizontal'): Promise<string> => {
      const result = await handleAsync(
        async () => {
          const categoryRepo = repositoryFactory.getCategoryRepository();
          const id = await categoryRepo.create({ name, color, icon });

          // Add to local state
          dispatch({ type: 'ADD_CATEGORY', payload: { id, name, color, icon } });

          return id;
        },
        'categories',
        'categories'
      );

      return result || '';
    },
    [handleAsync, repositoryFactory]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      await handleAsync(
        async () => {
          const categoryRepo = repositoryFactory.getCategoryRepository();
          await categoryRepo.delete(id);
          dispatch({ type: 'DELETE_CATEGORY', payload: id });
        },
        'categories',
        'categories'
      );
    },
    [handleAsync, repositoryFactory]
  );

  const refreshCategories = useCallback(async (): Promise<void> => {
    await handleAsync(
      async () => {
        const categoryRepo = repositoryFactory.getCategoryRepository();
        const categories = await categoryRepo.findAll();
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      },
      'categories',
      'categories'
    );
  }, [handleAsync, repositoryFactory]);

  // Currency actions
  const refreshCurrencies = useCallback(async (): Promise<void> => {
    await handleAsync(
      async () => {
        const currencies = await repositoryFactory.getCurrencies();
        dispatch({ type: 'SET_CURRENCIES', payload: currencies });
      },
      'currencies',
      'currencies'
    );
  }, [handleAsync, repositoryFactory]);

  // General actions
  const refreshAll = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_REFRESHING', payload: true });

    try {
      await Promise.all([
        refreshTransactions(),
        refreshCategories(),
        refreshCurrencies(),
        handleAsync(
          async () => {
            const types = await repositoryFactory.getTransactionTypes();
            dispatch({ type: 'SET_TRANSACTION_TYPES', payload: types });
          },
          'types',
          'types'
        ),
      ]);
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [refreshTransactions, refreshCategories, refreshCurrencies, handleAsync, repositoryFactory]);

  const clearError = useCallback((type: keyof ErrorState): void => {
    dispatch({ type: 'SET_ERROR', payload: { key: type, value: null } });
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized) {
      refreshAll().then(() => setIsInitialized(true));
    }
  }, [isInitialized, refreshAll]);

  const contextValue: AppContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
    loadTransactionsPage,
    searchTransactions,
    addCategory,
    deleteCategory,
    refreshCategories,
    refreshCurrencies,
    refreshAll,
    clearError,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
