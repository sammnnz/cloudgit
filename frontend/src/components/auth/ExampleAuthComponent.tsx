import React from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Пример использования useAuth с автоматической persistence
 */
export const ExampleAuthComponent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorObject,
    csrfToken,
    login,
    register,
    logout,
  } = useAuth();

  // Пример 1: Отображение состояния аутентификации
  const renderAuthStatus = () => {
    if (isLoading) {
      return (
        <div className="loading-spinner">
          Проверка сессии...
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="login-form">
          <h2>Войдите в систему</h2>
          <button onClick={() => login('admin', 'password123')}>
            Быстрый вход (для демо)
          </button>
        </div>
      );
    }

    return (
      <div className="user-dashboard">
        <h2>Добро пожаловать, {user.username}!</h2>
        <p>User ID: {user.id}</p>
        <p>Статус: Аутентифицирован</p>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <button 
          onClick={async () => {
            await logout();
            // После logout данные автоматически удаляются из localStorage
            // и состояния loading, error, csrfToken сбрасываются
          }}
          className="logout-btn"
        >
          Выйти из системы
        </button>
      </div>
    );
  };

  return (
    <div className="auth-example">
      <h1>Auth Persistence Demo</h1>
      
      {/* Техническая информация для отладки */}
      <div className="debug-info" style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <h3>Текущее состояние (для отладки):</h3>
        <pre>
          {JSON.stringify({
            isAuthenticated,
            loading: isLoading,
            error: error,
            user: user,
            csrfToken: csrfToken ? '*** (скрыт)' : undefined,
          }, null, 2)}
        </pre>
        
        <h3>Данные в localStorage:</h3>
        <pre>
          {(() => {
            const stored = localStorage.getItem('auth_state');
            return stored 
              ? JSON.stringify(JSON.parse(stored), null, 2)
              : 'Нет данных';
          })()}
        </pre>
        
        <div style={{ marginTop: '10px' }}>
          <strong>Примечания:</strong>
          <ul>
            <li>❌ НЕ сохраняется: loading, error, csrfToken</li>
            <li>✅ Сохраняется: user.id, user.username, user.is_authenticated</li>
            <li>🔄 При перезагрузке страницы сохранённые данные восстанавливаются</li>
            <li>🔒 CSRF токен не сохраняется (безопасность)</li>
            <li>⏱️ Данные автоматически устаревают через 30 дней</li>
          </ul>
        </div>
      </div>

      <div className="auth-content" style={{ marginTop: '20px' }}>
        {renderAuthStatus()}
      </div>
    </div>
  );
};

export default ExampleAuthComponent;