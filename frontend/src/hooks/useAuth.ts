import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { checkAuthSession, loginUser, registerUser, logout, fetchCSRFToken } from '@/store/slices/authSlice';
import { useEffect } from 'react';
import type { AuthUser, ApiResponse } from '@/store/types';

// ============================================================================
// RETURN TYPE FOR useAuth HOOK
// ============================================================================

export interface UseAuthReturn {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  csrfToken?: string;
  login: (username: string, password: string) => Promise<ApiResponse>;
  register: (username: string, email: string, password: string) => Promise<ApiResponse>;
  logout: () => void;
}

// ============================================================================
// useAuth HOOK
// ============================================================================

/**
 * Хук для работы с аутентификацией
 * 
 * @example
 * const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();
 * 
 * // Проверка авторизации
 * if (isAuthenticated) {
 *   console.log(`Hello, ${user.username}!`);
 * }
 * 
 * // Вход в систему
 * await login('admin', 'password123');
 * 
 * // Выход
 * logout();
 */
export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    // При первом mount компонента проверяем сессию
    dispatch(checkAuthSession());
  }, [dispatch]);

  /**
   * Вход в систему
   */
  const login = async (username: string, password: string): Promise<ApiResponse> => {
    const result = await dispatch(loginUser({ username, password })).unwrap();
    // После логина обновляем CSRF token
    await dispatch(fetchCSRFToken());
    return result;
  };

  /**
   * Регистрация пользователя
   */
  const register = async (username: string, email: string, password: string): Promise<ApiResponse> => {
    return await dispatch(registerUser({ username, email, password })).unwrap();
  };

  /**
   * Выход из системы
   */
  const logoutUser = () => {
    dispatch(logout());
    // Очищаем localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('csrf_token');
  };

  return {
    ...auth,
    user: auth.user,
    isAuthenticated: auth.user?.is_authenticated,
    isLoading: auth.loading,
    error: auth.error,
    csrfToken: auth.csrfToken,
    login,
    register,
    logout: logoutUser,
  };
};