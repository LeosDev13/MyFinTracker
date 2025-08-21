import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import type { Widget, WidgetType } from '../types/widget';
import { AVAILABLE_WIDGETS } from '../types/widget';

// Types
export interface WidgetState {
  widgets: Widget[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface WidgetContextType {
  state: WidgetState;

  // Widget actions
  addWidget: (type: WidgetType) => Promise<void>;
  removeWidget: (widgetId: string) => Promise<void>;
  reorderWidgets: (widgetIds: string[]) => Promise<void>;
  toggleWidget: (widgetId: string) => Promise<void>;
  updateWidgetConfig: (widgetId: string, config: Record<string, any>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

// Action types
type WidgetAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WIDGETS'; payload: Widget[] }
  | { type: 'ADD_WIDGET'; payload: Widget }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; updates: Partial<Widget> } }
  | { type: 'REORDER_WIDGETS'; payload: string[] }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: WidgetState = {
  widgets: [],
  loading: false,
  error: null,
  isInitialized: false,
};

// Storage key
const STORAGE_KEY = '@MyFinTracker:widgets';

// Generate default widgets
const generateDefaultWidgets = (): Widget[] => {
  return AVAILABLE_WIDGETS.filter((config) => config.defaultActive).map((config, index) => ({
    id: `${config.type}_${Date.now()}_${index}`,
    type: config.type,
    title: config.title,
    description: config.description,
    icon: config.icon,
    isActive: true,
    order: index,
    config: {},
  }));
};

// Reducer
function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_WIDGETS':
      return { ...state, widgets: action.payload };

    case 'ADD_WIDGET':
      return {
        ...state,
        widgets: [...state.widgets, action.payload].sort((a, b) => a.order - b.order),
      };

    case 'REMOVE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter((w) => w.id !== action.payload),
      };

    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
        ),
      };

    case 'REORDER_WIDGETS':
      const reorderedWidgets = action.payload
        .map((id, index) => {
          const widget = state.widgets.find((w) => w.id === id);
          return widget ? { ...widget, order: index } : null;
        })
        .filter(Boolean) as Widget[];

      return { ...state, widgets: reorderedWidgets };

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    default:
      return state;
  }
}

// Context
const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

// Provider
interface WidgetProviderProps {
  children: React.ReactNode;
}

export const WidgetProvider: React.FC<WidgetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(widgetReducer, initialState);

  // Load widgets from storage
  const loadWidgets = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const widgets = JSON.parse(stored);
        dispatch({ type: 'SET_WIDGETS', payload: widgets });
      } else {
        // First time - create default widgets
        const defaultWidgets = generateDefaultWidgets();
        dispatch({ type: 'SET_WIDGETS', payload: defaultWidgets });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultWidgets));
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load widgets';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to load widgets:', error);

      // Fallback to defaults
      const defaultWidgets = generateDefaultWidgets();
      dispatch({ type: 'SET_WIDGETS', payload: defaultWidgets });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save widgets to storage
  const saveWidgets = useCallback(async (widgets: Widget[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save widgets:', error);
      throw new Error('Failed to save widgets');
    }
  }, []);

  // Add widget
  const addWidget = useCallback(
    async (type: WidgetType): Promise<void> => {
      try {
        // Check if widget type already exists
        if (state.widgets.some((w) => w.type === type)) {
          throw new Error('Widget type already added');
        }

        const config = AVAILABLE_WIDGETS.find((c) => c.type === type);
        if (!config) {
          throw new Error('Unknown widget type');
        }

        const newWidget: Widget = {
          id: `${type}_${Date.now()}`,
          type,
          title: config.title,
          description: config.description,
          icon: config.icon,
          isActive: true,
          order: state.widgets.length,
          config: {},
        };

        const updatedWidgets = [...state.widgets, newWidget];
        dispatch({ type: 'ADD_WIDGET', payload: newWidget });
        await saveWidgets(updatedWidgets);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add widget';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.widgets, saveWidgets]
  );

  // Remove widget
  const removeWidget = useCallback(
    async (widgetId: string): Promise<void> => {
      try {
        const updatedWidgets = state.widgets.filter((w) => w.id !== widgetId);
        dispatch({ type: 'REMOVE_WIDGET', payload: widgetId });
        await saveWidgets(updatedWidgets);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove widget';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.widgets, saveWidgets]
  );

  // Toggle widget active state
  const toggleWidget = useCallback(
    async (widgetId: string): Promise<void> => {
      try {
        const widget = state.widgets.find((w) => w.id === widgetId);
        if (!widget) return;

        const updatedWidgets = state.widgets.map((w) =>
          w.id === widgetId ? { ...w, isActive: !w.isActive } : w
        );

        dispatch({
          type: 'UPDATE_WIDGET',
          payload: { id: widgetId, updates: { isActive: !widget.isActive } },
        });

        await saveWidgets(updatedWidgets);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to toggle widget';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.widgets, saveWidgets]
  );

  // Reorder widgets
  const reorderWidgets = useCallback(
    async (widgetIds: string[]): Promise<void> => {
      try {
        const reorderedWidgets = widgetIds
          .map((id, index) => {
            const widget = state.widgets.find((w) => w.id === id);
            return widget ? { ...widget, order: index } : null;
          })
          .filter(Boolean) as Widget[];

        dispatch({ type: 'REORDER_WIDGETS', payload: widgetIds });
        await saveWidgets(reorderedWidgets);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reorder widgets';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.widgets, saveWidgets]
  );

  // Update widget config
  const updateWidgetConfig = useCallback(
    async (widgetId: string, config: Record<string, any>): Promise<void> => {
      try {
        const updatedWidgets = state.widgets.map((w) =>
          w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
        );

        dispatch({
          type: 'UPDATE_WIDGET',
          payload: { id: widgetId, updates: { config } },
        });

        await saveWidgets(updatedWidgets);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update widget config';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        throw error;
      }
    },
    [state.widgets, saveWidgets]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<void> => {
    try {
      const defaultWidgets = generateDefaultWidgets();
      dispatch({ type: 'SET_WIDGETS', payload: defaultWidgets });
      await saveWidgets(defaultWidgets);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset widgets';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [saveWidgets]);

  // Initialize widgets on mount
  useEffect(() => {
    if (!state.isInitialized) {
      loadWidgets();
    }
  }, [state.isInitialized, loadWidgets]);

  const contextValue: WidgetContextType = {
    state,
    addWidget,
    removeWidget,
    reorderWidgets,
    toggleWidget,
    updateWidgetConfig,
    resetToDefaults,
  };

  return <WidgetContext.Provider value={contextValue}>{children}</WidgetContext.Provider>;
};

// Hook
export const useWidgets = (): WidgetContextType => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
};

export default WidgetContext;
