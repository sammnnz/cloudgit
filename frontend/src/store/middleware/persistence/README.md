# Auth Persistence Middleware

## 🎯 Назначение

Middleware для автоматического сохранения и восстановления состояния аутентификации в localStorage. Позволяет пользователю оставаться аутентифицированным после перезагрузки страницы.

## 📦 Что сохраняется

### ✅ Сохраняется в localStorage:
- `user.id` — ID пользователя
- `user.username` — имя пользователя
- `user.is_authenticated` — статус аутентификации

### ❌ НЕ сохраняется (остаётся только в памяти):
- `loading` — состояние загрузки (сбрасывается при перезагрузке)
- `error` — ошибки (сбрасываются при перезагрузке)
- `csrfToken` — **По соображениям безопасности** (генерируется сервером)
- `errorObject` — детали ошибок

## 🔐 Меры безопасности

### 1. **CSRF Token НЕ сохраняется**
```typescript
// ❌ НЕ правильно:
localStorage.setItem('csrf_token', token);

// ✅ Правильно: сервер генерирует новый токен при каждом запросе
// Или хранить в HttpOnly cookies (рекомендуется)
```

### 2. **Версионирование схемы**
```typescript
export const AUTH_PERSISTENCE_VERSION = '1.1.0';
```
При изменении структуры данных увеличиваем версию, чтобы старые данные автоматически очистились.

### 3. **TTL (Time To Live)**
```typescript
export const AUTH_PERSISTENCE_CONFIG: AuthPersistenceConfig = {
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 дней
};
```
Данные устаревают через 30 дней и автоматически очищаются.

### 4. **Автоматическая очистка**
При следующих условиях данные автоматически удаляются:
- Выход из системы (`logout`)
- Ошибка сессии (`session`, `unauthorized`)
- Невалидные данные в localStorage

## 🔄 Как это работает

### 1. **Загрузка при старте приложения**

```typescript
// frontend/src/store/index.tsx
const persistedState = loadPersistedState();

export const store = configureStore({
  reducer: { ... },
  preloadedState: persistedState, // ← Загружаем сохранённые данные
});
```

### 2. **Сохранение при изменениях**

```typescript
// Middleware автоматически сохраняет после каждого действия:
// - login
// - getSession
// - logout
// - createUser
```

### 3. **Очистка при выходе**

```typescript
// authSlice.ts
.addCase(logout.fulfilled, (state) => {
  state.user = { is_authenticated: false };
  // ⚠️ persistMiddleware автоматически удаляет данные из localStorage
})
```

## 🎨 Пример использования

```typescript
// ✅ Автоматическая работа
import { useAuth } from '@/hooks/useAuth';

function App() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  // При перезагрузке страницы:
  // 1. loadPersistedState() загрузит user из localStorage
  // 2. is_authenticated будет true, если данные валидны
  // 3. Можно сразу показать защищённый контент
  
  if (!isAuthenticated && !isLoading) {
    return <LoginForm />;
  }
  
  return <Dashboard username={user.username} />;
}
```

## 🔄 Сценарии использования

### Сценарий 1: Обычная перезагрузка страницы
```
1. Пользователь логинится → данные сохраняются
2. Закрывает вкладку → данные в localStorage
3. Открывает вкладку → loadPersistedState() загружает данные
4. Показываем Dashboard сразу без повторного логина
```

### Сценарий 2: Устаревшие данные
```
1. Пользователь логинится → данные сохраняются
2. Через 31 день перезагружает страницу → TTL истёк
3. Данные автоматически удаляются
4. Перенаправляем на страницу логина
```

### Сценарий 3: Ошибка сессии
```
1. Пользователь логинится → данные сохраняются
2. Сессия истекает на сервере
3. getSession() возвращает ошибку
4. persistMiddleware удаляет данные из localStorage
5. Перенаправляем на страницу логина
```

## 🔧 Конфигурация

### Изменение TTL

```typescript
// frontend/src/store/middleware/persistence/authPersistence.ts
export const AUTH_PERSISTENCE_CONFIG: AuthPersistenceConfig = {
  version: AUTH_PERSISTENCE_VERSION,
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 дней
  debug: process.env.NODE_ENV === 'development',
};
```

### Изменение версии схемы

```typescript
// frontend/src/store/middleware/persistence/authPersistence.ts
export const AUTH_PERSISTENCE_VERSION = '1.2.0'; // Увеличиваем
```

## 🚨 Важные замечания

### ❌ Ошибки, которых нужно избегать:

1. **НЕ сохранять CSRF token в localStorage**
   - Проблема: XSS-атаки могут получить доступ
   - Решение: Использовать HttpOnly cookies

2. **НЕ сохранять чувствительные данные**
   - Пароли
   - Секретные ключи
   - Данные, которые могут быть украдены

3. **НЕ сохранять временные состояния**
   - `loading: true` → при перезагрузке застрянет в бесконечном лоадере
   - `error: 'message'` → старая ошибка будет показываться вечно

### ✅ Правила:

1. **Только public данные** (id, username, email)
2. **Версионирование** при изменении структуры
3. **Автоматическая очистка** при выходе или ошибке
4. **TTL** для автоматического устаревания

## 📁 Структура файлов

```
frontend/src/store/
├── middleware/
│   ├── persistMiddleware.ts         # Основной middleware
│   ├── persistence/
│   │   ├── index.ts                 # Экспорты
│   │   ├── authPersistence.ts       # Конфигурация auth
│   │   └── README.md                # Эта документация
│   └── README.md                    # Общая документация
├── slices/
│   └── authSlice.ts                 # Auth slice (без изменений)
└── index.tsx                        # Store конфигурация
```

## 🧪 Тестирование

### Тест 1: Сохранение при логине

```typescript
// После успешного login
expect(localStorage.getItem('auth_state')).toBeDefined();
const data = JSON.parse(localStorage.getItem('auth_state'));
expect(data.data.user.is_authenticated).toBe(true);
```

### Тест 2: Очистка при logout

```typescript
// После logout
expect(localStorage.getItem('auth_state')).toBeNull();
```

### Тест 3: Загрузка при старте

```typescript
// При перезагрузке страницы
const persistedState = loadPersistedState();
expect(persistedState.auth.user.is_authenticated).toBe(true);
```

## 🔗 Связанные файлы

- `frontend/src/store/middleware/persistMiddleware.ts` — Основная логика
- `frontend/src/store/middleware/persistence/authPersistence.ts` — Конфигурация
- `frontend/src/store/slices/authSlice.ts` — Auth slice
- `frontend/src/hooks/useAuth.ts` — Custom hook
- `frontend/src/store/types.ts` — Типы

## 📚 Дополнительные ресурсы

- [Redux Toolkit Middleware](https://redux-toolkit.js.org/usage/migrating-to-modern-redux#middleware)
- [LocalStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#security)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)