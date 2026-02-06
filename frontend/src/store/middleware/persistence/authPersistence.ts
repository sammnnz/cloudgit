import { AuthUser, AuthState } from '@/store/types';

// ============================================================================
// КОНФИГУРАЦИЯ PERSISTENCE
// ============================================================================

/**
 * Версия схемы для миграций
 * Увеличиваем при изменениях структуры persisted data
 */
export const AUTH_PERSISTENCE_VERSION = '1.1.0';

/**
 * Конфигурация миддлвара
 */
export interface AuthPersistenceConfig {
  version: string;
  ttl?: number; // Time to live в мс (0 = неограниченно)
  debug?: boolean;
}

export const AUTH_PERSISTENCE_CONFIG: AuthPersistenceConfig = {
  version: AUTH_PERSISTENCE_VERSION,
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 дней
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Ключи для localStorage
 */
export const PERSISTED_AUTH_KEYS = {
  user: 'auth_user',
  state: 'auth_state', // Для backward compatibility
} as const;

// ============================================================================
// ТИПЫ ДЛЯ СОХРАНЯЕМЫХ ДАННЫХ
// ============================================================================

/**
 * Формат данных, который сохраняем в localStorage
 */
export interface PersistedAuthState {
  version: string;
  timestamp: number;
  data: {
    // Основные данные пользователя
    user: {
      id: string | undefined;
      username: string | undefined;
      is_authenticated: boolean;
    };
    // UI состояния (осторожно!)
    // loading: boolean; // УБРАЛ: будет сбрасываться при перезагрузке
    // error: string | null; // УБРАЛ: старые ошибки не должны сохраняться
    // csrfToken: string | undefined; // УБРАЛ: проблема безопасности
  };
}

// ============================================================================
// ВАЛИДАЦИЯ ДАННЫХ
// ============================================================================

/**
 * Проверяем, валидны ли сохраненные данные
 */
export function isValidPersistedAuthState(
  data: PersistedAuthState | null
): data is PersistedAuthState {
  if (!data) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] No data to validate');
    }
    return false;
  }

  // Проверяем версию
  if (data.version !== AUTH_PERSISTENCE_VERSION) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log(
        `[AuthPersistence] Version mismatch: saved=${data.version}, current=${AUTH_PERSISTENCE_VERSION}`
      );
    }
    return false;
  }

  // Проверяем timestamp (не старше TTL)
  if (AUTH_PERSISTENCE_CONFIG.ttl && data.timestamp > 0) {
    const age = Date.now() - data.timestamp;
    if (age > AUTH_PERSISTENCE_CONFIG.ttl) {
      if (AUTH_PERSISTENCE_CONFIG.debug) {
        const days = Math.round(age / (24 * 60 * 60 * 1000));
        console.log(`[AuthPersistence] Data expired: age=${days}d`);
      }
      return false;
    }
  }

  // Проверяем наличие user data
  if (!data.data?.user) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] Missing user data');
    }
    return false;
  }

  // Валидация данных пользователя
  const { user } = data.data;
  if (typeof user.is_authenticated !== 'boolean') {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] Invalid is_authenticated type');
    }
    return false;
  }

  return true;
}

// ============================================================================
// МАППИНГ STATE <-> PERSISTED
// ============================================================================

/**
 * Преобразует AuthState в формат для сохранения
 */
export function mapAuthStateToPersisted(
  authState: AuthState
): PersistedAuthState {
  return {
    version: AUTH_PERSISTENCE_VERSION,
    timestamp: Date.now(),
    data: {
      user: {
        id: authState.user.id,
        username: authState.user.username,
        is_authenticated: authState.user.is_authenticated,
      },
      // ❌ НЕ сохраняем loading и error в localStorage!
      // loading: authState.loading,
      // error: authState.error,
      // csrfToken: authState.csrfToken, // ❌ НЕ сохраняем! Проблема безопасности!
    },
  };
}

/**
 * Преобразует сохраненные данные обратно в AuthState
 * ЗАМЕЧАНИЕ: loading и error сбрасываются для безопасности!
 */
export function mapPersistedToAuthState(
  persisted: PersistedAuthState
): Partial<AuthState> {
  return {
    user: {
      id: persisted.data.user.id,
      username: persisted.data.user.username,
      is_authenticated: persisted.data.user.is_authenticated,
    },
    // ⚠️ СБРОС: loading и error должны быть свежими!
    // Иначе при перезагрузке можем застрять в старом loading или error
    loading: false,
    error: null,
    errorObject: { msg: undefined },
    csrfToken: undefined, // ❌ НЕ восстанавливаем! Сервер даст новый!
  };
}

// ============================================================================
// ОЧИСТКА ДАННЫХ
// ============================================================================

/**
 * Очищает сохранённые данные (вызывается при logout или ошибке)
 */
export function clearPersistedAuthState(): void {
  if (AUTH_PERSISTENCE_CONFIG.debug) {
    console.log('[AuthPersistence] Clearing persisted data');
  }
  
  try {
    Object.values(PERSISTED_AUTH_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[AuthPersistence] Error clearing data:', error);
  }
}

/**
 * Проверяет, нужно ли очистить данные (при выходе или ошибке)
 */
export function shouldClearPersistedState(
  authState: AuthState,
  prevState: AuthState
): boolean {
  // ❌ Если user разлогинился — очищаем
  if (prevState.user.is_authenticated && !authState.user.is_authenticated) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] User logged out, clearing data');
    }
    return true;
  }

  // ❌ Если пришла критическая ошибка сессии — очищаем
  if (
    authState.error?.includes('session') ||
    authState.error?.includes('unauthorized') ||
    authState.error?.includes('not authenticated')
  ) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] Session error, clearing data');
    }
    return true;
  }

  return false;
}

/**
 * Проверяет, нужно ли пропустить сохранение (например, при ошибке API)
 */
export function shouldSkipPersistence(
  authState: AuthState,
  actionType: string
): boolean {
  // Не сохраняем, если мы в состоянии ошибки
  // ИНАЧЕ: при перезагрузке покажем старую ошибку
  if (authState.error && !authState.user.is_authenticated) {
    if (AUTH_PERSISTENCE_CONFIG.debug) {
      console.log('[AuthPersistence] Skipping persistence due to error');
    }
    return true;
  }

  // Не сохраняем промежуточные состояния (pending)
  if (actionType.endsWith('/pending')) {
    return true;
  }

  return false;
}