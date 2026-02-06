# 📋 АРХИТЕКТУРА AUTH PERSISTENCE

## ✅ ГОТОВАЯ СТРУКТУРА

```
frontend/src/
├── store/
│   ├── middleware/
│   │   ├── persistMiddleware.ts          ✅ Основная логика
│   │   └── persistence/
│   │       ├── index.ts                  ✅ Экспорты
│   │       ├── authPersistence.ts        ✅ Конфигурация
│   │       ├── README.md                 ✅ Документация
│   │       └── __tests__/
│   │           └── authPersistence.test.ts ✅ Тесты (демо)
│   ├── selectors/
│   │   └── authSelectors.ts              ✅ Селекторы
│   ├── slices/
│   │   └── authSlice.ts                  ✅ Без изменений
│   └── index.tsx                        ✅ Подключён автоматически
├── hooks/
│   └── useAuth.ts                       ✅ Очистка в ручном logout
├── components/
│   └── auth/
│       └── ExampleAuthComponent.tsx     ✅ Пример использования
├── ARCHITECTURE-PERSIST.md              ✅ Эта документация
└── README.md                            ✅ Добавить ссылку сюда
```

---

## 🔐 ЧТО СОХРАНЯЕТСЯ

### ✅ Данные пользователя:
```json
{
  "version": "1.1.0",
  "timestamp": 1234567890123,
  "data": {
    "user": {
      "id": "123",
      "username": "admin",
      "is_authenticated": true
    }
  }
}
```

### 🗝️ Ключ в localStorage:
```
Key: auth_state
Value: {"version":"1.1.0",...}
```

---

## ❌ ЧТО НЕ СОХРАНЯЕТСЯ

1. **Loading state** → Сбрасывается в `false` при загрузке
2. **Error** → Сбрасывается в `null` при загрузке
3. **CSRF Token** → НЕ сохраняется (безопасность!)
4. **ErrorObject** → НЕ сохраняется

---

## 🔒 МЕРЫ БЕЗОПАСНОСТИ

### 1. **CSRF Token**
- ❌ **НЕ сохраняется** в localStorage
- ✅ Сервер генерирует новый токен при каждом запросе
- ⚡ Или используй HttpOnly cookies (рекомендуется)

### 2. **Версионирование схемы**
```typescript
export const AUTH_PERSISTENCE_VERSION = '1.1.0';
```
- При изменении структуры увеличиваем версию
- Старые данные автоматически удаляются

### 3. **TTL (Time To Live)**
```typescript
ttl: 30 * 24 * 60 * 60 * 1000 // 30 дней
```
- Данные автоматически устаревают
- Предотвращает хранение устаревших сессий

### 4. **Автоматическая очистка**
Удаление данных при:
- ✅ Выходе из системы (logout)
- ✅ Ошибке сессии (`session`, `unauthorized`)
- ✅ Невалидных данных в localStorage

---

## 🔄 КАК ЭТО РАБОТАЕТ

### Сценарий 1: Обычная работа

```
1. Пользователь логинится
   ↓
2. `persistMiddleware` сохраняет в localStorage
   ↓
3. Пользователь закрывает вкладку
   ↓
4. Открывает вкладку
   ↓
5. `loadPersistedState()` загружает данные
   ↓
6. Redux store инициализируется с сохранёнными данными
   ↓
7. Компоненты сразу видят аутентифицированного пользователя
```

### Сценарий 2: Выход из системы

```
1. Пользователь нажимает logout
   ↓
2. `auth/logout/fulfilled` action
   ↓
3. `shouldClearPersistedState()` возвращает true
   ↓
4. `clearPersistedAuthState()` удаляет данные
   ↓
5. localStorage пуст
```

### Сценарий 3: Устаревшие данные

```
1. Данные в localStorage старше 30 дней
   ↓
2. При загрузке `isValidPersistedAuthState()` возвращает false
   ↓
3. Данные автоматически удаляются
   ↓
4. Пользователь видит страницу логина
```

---

## 🧪 ПРОВЕРКА РАБОТЫ

### В браузере (DevTools):

1. **Откройте консоль:**
   ```javascript
   localStorage.getItem('auth_state')
   ```

2. **Посмотрите данные:**
   ```javascript
   JSON.parse(localStorage.getItem('auth_state'))
   ```

3. **Удалите данные вручную:**
   ```javascript
   localStorage.removeItem('auth_state')
   ```

4. **Очистить всё:**
   ```javascript
   localStorage.clear()
   ```

### В коде:

```typescript
import { useAuth } from '@/hooks/useAuth';

const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  // Пользователь аутентифицирован (данные восстановлены)
  console.log(user.username);
}
```

---

## 🎨 ИСПОЛЬЗОВАНИЕ В КОМПОНЕНТАХ

### Способ 1: С хуком useAuth (рекомендуется)

```typescript
import { useAuth } from '@/hooks/useAuth';

function ProtectedComponent() {
  const { isAuthenticated, isLoading, error, user, logout } = useAuth();

  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;
  if (!isAuthenticated) return <Login />;

  return <div>Привет, {user.username}!</div>;
}
```

### Способ 2: С селекторами (оптимально)

```typescript
import { 
  selectIsAuthenticated,
  selectUser,
  selectIsLoading,
} from '@/store/selectors/authSelectors';

function ProtectedComponent() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Login />;

  return <div>Привет, {user.username}!</div>;
}
```

---

## ⚙️ КОНФИГУРАЦИЯ

### Изменить TTL (время жизни):

```typescript
// frontend/src/store/middleware/persistence/authPersistence.ts
export const AUTH_PERSISTENCE_CONFIG: AuthPersistenceConfig = {
  version: AUTH_PERSISTENCE_VERSION,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 дней вместо 30
  debug: process.env.NODE_ENV === 'development',
};
```

### Изменить версию схемы:

```typescript
// frontend/src/store/middleware/persistence/authPersistence.ts
export const AUTH_PERSISTENCE_VERSION = '1.2.0'; // Увеличиваем
```

### Включить отладку:

```typescript
// автоматически включено в dev-режиме
// посмотрите консоль браузера для логов
```

---

## 📦 ЭКСПОРТЫ

### Из папки `store/middleware/persistence`:

```typescript
export {
  mapAuthStateToPersisted,
  mapPersistedToAuthState,
  isValidPersistedAuthState,
  clearPersistedAuthState,
  shouldClearPersistedState,
  shouldSkipPersistence,
  PERSISTED_AUTH_KEYS,
  AUTH_PERSISTENCE_CONFIG,
  AUTH_PERSISTENCE_VERSION,
  type PersistedAuthState,
  type AuthPersistenceConfig,
} from './authPersistence';
```

### Из `store/middleware`:

```typescript
export { persistMiddleware, loadPersistedState } from './persistMiddleware';
```

### Из `store/selectors`:

```typescript
export {
  selectAuthState,
  selectUser,
  selectIsAuthenticated,
  selectUserId,
  selectUsername,
  selectIsLoading,
  selectAuthError,
  selectAuthErrorObject,
  selectCsrfToken,
  selectHasUserId,
  selectUserForPersistence,
  selectAuthUIState,
  selectShouldShowLoader,
  selectUserInfo,
} from './selectors/authSelectors';
```

---

## 🎯 КЛЮЧЕВЫЕ МОМЕНТЫ

### ✅ Сделано:
1. **Безопасность:** CSRF токен не сохраняется
2. **Версионирование:** При изменении структуры данные очищаются
3. **TTL:** Данные устаревают через 30 дней
4. **Автоочистка:** При logout или ошибке
5. **Backward compatibility:** Миграция со старого формата
6. **Документация:** Подробный README.md
7. **Тесты:** Демо-тесты для понимания логики

### 🔥 Про редьюсер logout:
В твоём `authSlice`:
```typescript
export const logout = createAsyncThunk<WResponse, {}>(
  'auth/logout',
  async ({}, thunkAPI) => { ... }
);
```

Да, **обязательно передавать пустой объект `{}`**. Это стандарт Redux Toolkit для `createAsyncThunk`. Если нужно, можно переделать на:

```typescript
// Если действительно не нужны аргументы
export const logout = createAsyncThunk<WResponse>(
  'auth/logout',
  async () => {
    return await auth.getSessionLogout();
  }
);
```

Но текущий вариант `{}` тоже полностью валидный.

---

## 🚀 БЫСТРЫЙ СТАРТ

1. **Скопировать файлы** в нужные папки
2. **Перезапустить** проект (`npm run dev`)
3. **Проверить** в консоли браузера
4. **Протестировать** вход → перезагрузку → выход

Данные должны автоматически сохраняться и восстанавливаться!

---

## 📚 ССЫЛКИ

- [Redux Toolkit Middleware](https://redux-toolkit.js.org/usage/migrating-to-modern-redux#middleware)
- [LocalStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#security)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)
- [React Hooks](https://react.dev/reference/react/hooks)