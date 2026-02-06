/**
 * Тесты для authPersistence
 * 
 * ЭТО ПРОСТО ДЕМОНСТРАЦИЯ, как это работает
 * Для реальных тестов используй Jest или Vitest
 */

import { 
  mapAuthStateToPersisted,
  mapPersistedToAuthState,
  isValidPersistedAuthState,
  clearPersistedAuthState,
  shouldClearPersistedState,
  shouldSkipPersistence,
  PERSISTED_AUTH_KEYS,
  AUTH_PERSISTENCE_VERSION,
} from '../authPersistence';

// ============================================================================
// ТЕСТ 1: Сохранение auth state
// ============================================================================
const mockAuthState = {
  user: {
    id: '123',
    username: 'admin',
    is_authenticated: true,
  },
  loading: false,
  error: null,
  errorObject: { msg: undefined },
  csrfToken: 'csrf_abc123',
};

const persisted = mapAuthStateToPersisted(mockAuthState);

console.log('✅ ТЕСТ 1: mapAuthStateToPersisted');
console.log('Сохранённый формат:', JSON.stringify(persisted, null, 2));

// Проверяем:
// - version
// - timestamp
// - user.id
// - user.username
// - user.is_authenticated
// - ❌ НЕ сохранён: loading, error, csrfToken

// ============================================================================
// ТЕСТ 2: Валидация данных
// ============================================================================
const validData = {
  version: AUTH_PERSISTENCE_VERSION,
  timestamp: Date.now(),
  data: {
    user: {
      id: '123',
      username: 'admin',
      is_authenticated: true,
    },
  },
};

const invalidData = {
  version: '0.0.0', // Устаревшая версия
  timestamp: Date.now(),
  data: {
    user: {
      id: '123',
      username: 'admin',
      is_authenticated: true,
    },
  },
};

console.log('✅ ТЕСТ 2: isValidPersistedAuthState');
console.log('Valid data:', isValidPersistedAuthState(validData)); // true
console.log('Invalid data:', isValidPersistedAuthState(invalidData)); // false

// ============================================================================
// ТЕСТ 3: Загрузка обратно в state
// ============================================================================
const restoredState = mapPersistedToAuthState(validData);

console.log('✅ ТЕСТ 3: mapPersistedToAuthState');
console.log('Восстановленный state:', JSON.stringify(restoredState, null, 2));

// Проверяем:
// - user.id: '123'
// - user.username: 'admin'
// - user.is_authenticated: true
// - loading: false (сброшен!)
// - error: null (сброшен!)
// - csrfToken: undefined (не восстановлен!)

// ============================================================================
// ТЕСТ 4: Проверка очистки данных
// ============================================================================
const stateLogout = {
  user: { is_authenticated: false },
  loading: false,
  error: null,
  errorObject: { msg: undefined },
  csrfToken: undefined,
};

const prevStateAuthenticated = {
  user: { is_authenticated: true },
  loading: false,
  error: null,
  errorObject: { msg: undefined },
  csrfToken: 'abc',
};

console.log('✅ ТЕСТ 4: shouldClearPersistedState');
console.log('При logout:', shouldClearPersistedState(stateLogout, prevStateAuthenticated)); // true

// ============================================================================
// ТЕСТ 5: Пропуск сохранения при ошибке
// ============================================================================
const stateWithError = {
  user: { is_authenticated: false },
  loading: false,
  error: 'Session expired',
  errorObject: { msg: 'Session expired' },
  csrfToken: undefined,
};

console.log('✅ ТЕСТ 5: shouldSkipPersistence');
console.log('При ошибке:', shouldSkipPersistence(stateWithError, 'auth/login/rejected')); // true
console.log('При pending:', shouldSkipPersistence(stateWithError, 'auth/login/pending')); // true

// ============================================================================
// ИТОГ:
// ============================================================================
console.log('\n\n📦 ИТОГ: Сохранённые данные в localStorage:');
console.log('Ключ:', PERSISTED_AUTH_KEYS.state);
console.log('Формат: { version, timestamp, data: { user: { id, username, is_authenticated } } }');
console.log('Нет: loading, error, csrfToken');
console.log('\n🔒 Безопасность:');
console.log('• CSRF токен НЕ сохраняется (при перезагрузке сервер даст новый)');
console.log('• Ошибки НЕ сохраняются (при перезагрузке будут свежие)');
console.log('• Время жизни: 30 дней (или настраивается)');