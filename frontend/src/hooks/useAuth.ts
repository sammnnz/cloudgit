import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getSession, login as loginSession, createUser, logout as logoutSession } from '@/store/slices/authSlice';
import { useEffect } from 'react';
import type { AuthUser } from '@/store/types';
import { WResponse } from '@/common/types';

// ============================================================================
// RETURN TYPE FOR useAuth HOOK
// ============================================================================

export interface UseAuthReturn {
  user: AuthUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  csrfToken?: string;
  login: (username: string, password: string) => Promise<WResponse>;
  register: (username: string, email: string, password: string) => Promise<WResponse>;
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
 * // Check session
 * if (isAuthenticated) {
 *   console.log(`Hello, ${user.username}!`);
 * }
 * 
 * // Login
 * await login('admin', 'password123');
 * 
 * // Logout
 * logout();
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
  const logout = () => {
    dispatch(logoutSession());
    // Clean localStorage
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
    logout
  };
};