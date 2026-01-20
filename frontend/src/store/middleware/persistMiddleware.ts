import { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';

/**
 * Middleware для сохранения определенных частей state в localStorage
 * Помогает сохранить сессию и другие важные данные между перезагрузками
 */
export const persistMiddleware: Middleware = (store) => (next) => (action: UnknownAction) => {
  // Сначала выполняем действие
  const result = next(action);
  
  // После выполнения сохраняем нужные части state
  const state: RootState = store.getState();
  
  // Сохраняем только необходимые данные
  try {
    // Сохраняем информацию о пользователе
    if (state.auth.user.is_authenticated) {
      localStorage.setItem('user', JSON.stringify(state.auth.user));
    } else {
      localStorage.removeItem('user');
    }
    
    // Сохраняем CSRF токен (если нужно)
    if (state.auth.csrfToken) {
      localStorage.setItem('csrf_token', state.auth.csrfToken);
    }
  } catch (error) {
    console.warn('Failed to persist state to localStorage:', error);
  }
  
  return result;
};

/**
 * Функция для загрузки начального состояния из localStorage
 */
export const loadPersistedState = (): Partial<RootState> => {
  try {
    const user = localStorage.getItem('user');
    const csrfToken = localStorage.getItem('csrf_token');
    
    const state: Partial<RootState> = {};
    
    if (user) {
      state.auth = {
        ...(state.auth || {}),
        user: JSON.parse(user),
      } as any;
    }
    
    if (csrfToken) {
      state.auth = {
        ...(state.auth || {}),
        csrfToken,
      } as any;
    }
    
    return state;
  } catch (error) {
    console.warn('Failed to load persisted state:', error);
    return {};
  }
};