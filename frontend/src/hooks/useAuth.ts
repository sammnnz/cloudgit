import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getSession, login as loginSession, createUser, logout as logoutSession } from '@/store/slices/authSlice';
import { useEffect } from 'react';
import type { AuthUser, ErrorObject } from '@/store/types';
import { WResponse } from '@/common/types';

// ============================================================================
// RETURN TYPE FOR useAuth HOOK
// ============================================================================

export interface UseAuthReturn<E = {}> {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  errorObject: ErrorObject<E>;
  csrfToken?: string;
  login: (username: string, password: string) => Promise<WResponse>;
  register: (username: string, email: string, password: string) => Promise<WResponse>;
  logout: () => Promise<WResponse>;
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
 * // Check session
 * if (isAuthenticated) {
 *   console.log(`Hello, ${user.username}!`);
 * }
 * 
 * // Login
 * await login('admin', 'password123');
 * 
 * // Logout
 * await logout();
 */
export const useAuth = (): UseAuthReturn => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getSession());
  }, [dispatch]);

  /**
   * Login
   */
  const login = async (username: string, password: string): Promise<WResponse> => {
    const result = await dispatch(loginSession({ username, password })).unwrap();
    // await dispatch(fetchCSRFToken());
    return result;
  };

  /**
   * Sign up
   */
  const register = async (username: string, email: string, password: string): Promise<WResponse> => {
    return await dispatch(createUser({ username, email, password })).unwrap();
  };

  /**
   * Logout
   */
  const logout = async () => {
    const response = await dispatch(logoutSession({})).unwrap();
    // ❌ УБИРАЕМ: очистка теперь происходит автоматически в persistMiddleware
    // Если нужно очистить что-то дополнительно, делайте это в middleware
    return response
  };

  return {
    ...auth,
    user: auth.user,
    isAuthenticated: auth.user?.is_authenticated,
    isLoading: auth.loading,
    error: auth.error,
    errorObject: auth.errorObject,
    csrfToken: auth.csrfToken,
    login,
    register,
    logout
  };
};