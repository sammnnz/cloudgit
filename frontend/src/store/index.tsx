import { configureStore } from '@reduxjs/toolkit';
import { Provider } from "react-redux";
import authReducer from './slices/authSlice';
import repoReducer from './slices/repoSlice';
import { persistMiddleware, loadPersistedState } from './middleware/persistMiddleware';
import type { StoreProviderProps, RootState, AppDispatch } from './types';

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

// Загружаем начальное состояние из localStorage
const persistedState = loadPersistedState();

// Создаем Redux Store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    repo: repoReducer,
  },
  preloadedState: persistedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Тип корневого состояния (RootState)
export type { RootState };

// Тип dispatch функции
export type { AppDispatch };

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * StoreProvider — компонент-обертка для предоставления Redux Store
 * 
 * @example
 * <StoreProvider>
 *   <RouteProvider />
 * </StoreProvider>
 */
export const StoreProvider = ({ children }: StoreProviderProps) => {
  return (
    <Provider store={store}>
      { children }
    </Provider>
  )
}