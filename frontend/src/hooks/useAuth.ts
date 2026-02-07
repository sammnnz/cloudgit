import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getSession, login as loginSession, createUser, logout as logoutSession } from '@/store/slices/authSlice';
import { useEffect, useState } from 'react';
import type { AuthUser, ErrorObject } from '@/store/types';
import { WResponse } from '@/common/types';

// ============================================================================
// RETURN TYPE FOR useAuth HOOK
// ============================================================================

export interface UseAuthReturn<E = {}> {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  isChecking: boolean; // session
  error: string | null;
  errorObject: ErrorObject<E>;
  csrfToken?: string;
  login: (username: string, password: string) => Promise<WResponse>;
  register: (username: string, email: string, password: string) => Promise<WResponse>;
  logout: () => Promise<WResponse>;
  checkSession: () => Promise<void>;
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
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  /**
   * Check session
   */
  const checkSession = async (): Promise<void> => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      await dispatch(getSession()).unwrap();
    } catch (error) {
      // Ошибка уже обработана в slice
      console.log('Session check failed, user will see login page');
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Login
   */
  const login = async (username: string, password: string): Promise<WResponse> => {
    const result = await dispatch(loginSession({ username, password })).unwrap();
    // await checkSession();
    // await dispatch(fetchCSRFToken());
    return result;
  };

  /**
   * Logout
   */
  const logout = async () => {
    const result = await dispatch(logoutSession({})).unwrap();
    // ❌ УБИРАЕМ: очистка теперь происходит автоматически в persistMiddleware
    // Если нужно очистить что-то дополнительно, делайте это в middleware
    return result
  };

  /**
   * Register
   */
  const register = async (username: string, email: string, password: string): Promise<WResponse> => {
    const result = await dispatch(createUser({ username, email, password })).unwrap();
    return result
  };

  return {
    ...auth,
    user: auth.user,
    isAuthenticated: auth.user?.is_authenticated,
    isLoading: auth.loading,
    isChecking,
    error: auth.error,
    errorObject: auth.errorObject,
    csrfToken: auth.csrfToken,
    login,
    register,
    logout,
    checkSession
  };
};