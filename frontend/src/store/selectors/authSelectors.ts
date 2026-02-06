import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/types';

// ============================================================================
// БАЗОВЫЕ СЕЛЕКТОРЫ
// ============================================================================

/**
 * Селектор для получения всего auth state
 */
export const selectAuthState = (state: RootState) => state.auth;

/**
 * Селектор для получения user data
 */
export const selectUser = createSelector(
  selectAuthState,
  (auth) => auth.user
);

/**
 * Селектор для проверки аутентификации
 */
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (auth) => auth.user.is_authenticated
);

/**
 * Селектор для получения user ID
 */
export const selectUserId = createSelector(
  selectAuthState,
  (auth) => auth.user.id
);

/**
 * Селектор для получения username
 */
export const selectUsername = createSelector(
  selectAuthState,
  (auth) => auth.user.username
);

// ============================================================================
// UI СЕЛЕКТОРЫ
// ============================================================================

/**
 * Селектор для состояния загрузки
 */
export const selectIsLoading = createSelector(
  selectAuthState,
  (auth) => auth.loading
);

/**
 * Селектор для ошибки
 */
export const selectAuthError = createSelector(
  selectAuthState,
  (auth) => auth.error
);

/**
 * Селектор для объекта ошибки
 */
export const selectAuthErrorObject = createSelector(
  selectAuthState,
  (auth) => auth.errorObject
);

// ============================================================================
// ТЕХНИЧЕСКИЕ СЕЛЕКТОРЫ
// ============================================================================

/**
 * Селектор для CSRF токена
 */
export const selectCsrfToken = createSelector(
  selectAuthState,
  (auth) => auth.csrfToken
);

/**
 * Селектор для проверки, есть ли хотя бы один user id
 */
export const selectHasUserId = createSelector(
  selectAuthState,
  (auth) => !!auth.user.id
);

/**
 * Селектор для получения user data для сохранения (safe subset)
 */
export const selectUserForPersistence = createSelector(
  selectAuthState,
  (auth) => ({
    id: auth.user.id,
    username: auth.user.username,
    is_authenticated: auth.user.is_authenticated,
  })
);

// ============================================================================
// COMPOUND SELECTORS
// ============================================================================

/**
 * Селектор для получения состояния UI (безопасно для отображения)
 */
export const selectAuthUIState = createSelector(
  [selectIsAuthenticated, selectIsLoading, selectAuthError, selectUser],
  (isAuthenticated, isLoading, error, user) => ({
    isAuthenticated,
    isLoading,
    error,
    user,
  })
);

/**
 * Селектор для проверки, нужно ли показывать лоадер
 */
export const selectShouldShowLoader = createSelector(
  [selectIsLoading, selectIsAuthenticated],
  (isLoading, isAuthenticated) => {
    // Показываем лоадер, если идёт проверка сессии
    // и мы ещё не знаем, аутентифицирован ли пользователь
    return isLoading && !isAuthenticated;
  }
);

/**
 * Селектор для получения полной информации о пользователе
 */
export const selectUserInfo = createSelector(
  [selectUser, selectIsLoading, selectAuthError],
  (user, isLoading, error) => ({
    ...user,
    isLoading,
    error,
  })
);