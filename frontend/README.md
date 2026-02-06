# Library Frontend

## Технологии

- React 19 + TypeScript
- Redux Toolkit (связка Redux + TypeScript)
- React Router v7
- Material UI (MUI)
- Vite (сборщик)

## Redux

### Установка

```bash
npm install @reduxjs/toolkit react-redux
```

### Структура

```
src/
├── store/
│   ├── index.ts          # Конфигурация store
│   ├── hooks.ts          # Хуки для Redux
│   ├── slices/           # Слайсы (домены)
│   │   ├── authSlice.ts  # Аутентификация
│   │   └── repoSlice.ts  # Репозитории
│   └── middleware/       # Middleware
│       └── persistMiddleware.ts
├── hooks/
│   ├── index.ts          # Все хуки
│   ├── useAuth.ts        # Хук для аутентификации
│   └── useRepo.ts        # Хук для репозиториев
```

### Использование

#### Чтение состояния

```typescript
import { useAppSelector } from '@/store/hooks';

const Component = () => {
  const user = useAppSelector((state) => state.auth.user);
  return <div>Hello, {user.username}</div>;
};
```

#### Отправка действий

```typescript
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const Component = () => {
  const dispatch = useAppDispatch();
  const handleLogout = () => dispatch(logout());
  return <button onClick={handleLogout}>Logout</button>;
};
```

#### Асинхронные операции (рекомендуется)

```typescript
import { useAuth } from '@/hooks/useAuth';

const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  
  const handleSubmit = async (username: string, password: string) => {
    await login(username, password);
  };
  
  return (
    <>
      {error && <div>{error}</div>}
      <button onClick={() => handleSubmit('user', 'pass')} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </>
  );
};
```

### Документация

См. также:
- `REDUX_SETUP.md` — подробное руководство по установке и настройке
- `REDUX_EXAMPLES.md` — примеры использования в разных сценариях

### Проверка установки

```bash
cd frontend
node test-redux.js
```

Должно вывести "✓ Redux готов к использованию!"