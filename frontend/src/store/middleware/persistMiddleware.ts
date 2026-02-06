import { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import {
  mapAuthStateToPersisted,
  mapPersistedToAuthState,
  isValidPersistedAuthState,
  clearPersistedAuthState,
  shouldClearPersistedState,
  shouldSkipPersistence,
  PERSISTED_AUTH_KEYS,
  AUTH_PERSISTENCE_CONFIG,
} from './persistence/authPersistence';

/**
 * Функция для очистки старых ключей из localStorage
 * (для backward compatibility)
 */
function cleanupOldKeys(): void {
  try {
    // Старые ключи, которые были в первой версии
    const oldKeys = ['user', 'csrf_token'];
    
    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        console.log(`[persistMiddleware] Removing deprecated key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('[persistMiddleware] Error cleaning old keys:', error);
  }
}

/**
 * Middleware для сохранения auth state в localStorage
 * Сохраняет только безопасные данные пользователя между сессиями
 * НЕ сохраняет: loading, error, csrfToken (для безопасности)
 */
export const persistMiddleware: Middleware = (store) => (next) => (action: UnknownAction) => {
  // Сохраняем предыдущий state для сравнения
  const prevState: RootState = store.getState();
  
  // Выполняем действие
  const result = next(action);
  
  // Получаем новый state после выполнения
  const nextState: RootState = store.getState();
  
  // Очищаем старые ключи при первом запуске
  if (action.type === '@@redux/INIT') {
    cleanupOldKeys();
  }

  // Обрабатываем persistence только для auth слайса
  try {
    const authState = nextState.auth;
    const prevAuthState = prevState.auth;

    // ⚠️ Проверяем, нужно ли очистить данные (logout или ошибка)
    if (shouldClearPersistedState(authState, prevAuthState)) {
      clearPersistedAuthState();
      return result;
    }

    // ⚠️ Проверяем, нужно ли пропустить сохранение
    const actionType = action.type || 'unknown';
    if (shouldSkipPersistence(authState, actionType)) {
      if (AUTH_PERSISTENCE_CONFIG.debug) {
        console.log(`[persistMiddleware] Skipping persistence for action: ${actionType}`);
      }
      return result;
    }

    // Проверяем, есть ли что сохранять (user должен быть аутентифицирован)
    if (authState.user.is_authenticated) {
      const persisted = mapAuthStateToPersisted(authState);
      
      // Сохраняем только если данные валидны
      if (persisted.data.user.id || persisted.data.user.username) {
        localStorage.setItem(
          PERSISTED_AUTH_KEYS.state,
          JSON.stringify(persisted)
        );
        
        if (AUTH_PERSISTENCE_CONFIG.debug) {
          console.log('[persistMiddleware] Auth state saved:', persisted);
        }
      }
    } else {
      // ❌ Если не аутентифицирован — очищаем (на всякий случай)
      localStorage.removeItem(PERSISTED_AUTH_KEYS.state);
      
      if (AUTH_PERSISTENCE_CONFIG.debug) {
        console.log('[persistMiddleware] User not authenticated, cleared stored state');
      }
    }

  } catch (error) {
    console.error('[persistMiddleware] Error persisting auth state:', error);
    // Пытаемся очистить повреждённые данные
    try {
      localStorage.removeItem(PERSISTED_AUTH_KEYS.state);
    } catch (e) {
      // Игнорируем ошибки очистки
    }
  }
  
  return result;
};

/**
 * Функция для загрузки начального состояния из localStorage
 * ВАЖНО: loading и error всегда сбрасываются для безопасности!
 */
export const loadPersistedState = (): Partial<RootState> => {
  try {
    // Сначала пробуем новый формат
    let stored = localStorage.getItem(PERSISTED_AUTH_KEYS.state);
    
    // Для backward compatibility: если нового формата нет, пробуем старый
    if (!stored) {
      const oldUser = localStorage.getItem('user');
      if (oldUser) {
        console.log('[persistMiddleware] Found old format data, migrating...');
        const oldData = JSON.parse(oldUser);
        
        // Конвертируем в новый формат
        const migrated = {
          version: '1.0.0',
          timestamp: Date.now(),
          data: {
            user: {
              id: oldData.id,
              username: oldData.username,
              is_authenticated: oldData.is_authenticated,
            },
          },
        };
        
        // Сохраняем в новом формате
        localStorage.setItem(PERSISTED_AUTH_KEYS.state, JSON.stringify(migrated));
        
        // Удаляем старый ключ
        localStorage.removeItem('user');
        localStorage.removeItem('csrf_token');
        
        stored = JSON.stringify(migrated);
      }
    }
    
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored);
    
    // ВАЛИДАЦИЯ данных перед загрузкой
    if (!isValidPersistedAuthState(parsed)) {
      if (AUTH_PERSISTENCE_CONFIG.debug) {
        console.log('[persistMiddleware] Invalid persisted data, clearing');
      }
      // Очищаем повреждённые данные
      localStorage.removeItem(PERSISTED_AUTH_KEYS.state);
      return {};
    }

    const authState = mapPersistedToAuthState(parsed);
    
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[persistMiddleware] Loaded persisted auth state:', authState);
    }
    
    return {
      auth: authState as any,
    };
  } catch (error) {
    console.error('[persistMiddleware] Error loading persisted state:', error);
    // Очищаем повреждённые данные
    try {
      localStorage.removeItem(PERSISTED_AUTH_KEYS.state);
    } catch (e) {
      // Игнорируем ошибки очистки
    }
    return {};
  }
};