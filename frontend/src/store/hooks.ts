import { useDispatch, useSelector } from 'react-redux';
import type { NestedProperty, RootState, AppDispatch, UseAppDispatch, UseAppSelector } from './types';

// ============================================================================
// КАСТОМНЫЕ ХУКИ ДЛЯ REDUX
// ============================================================================

/**
 * Хук для получения dispatch функции с типизацией
 * 
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(loginUser({ username: 'admin', password: '123' }));
 */
export const useAppDispatch: UseAppDispatch<AppDispatch> = () => 
  useDispatch<AppDispatch>();

/**
 * Хук для чтения состояния из store с типизацией
 * 
 * @example
 * const user = useAppSelector((state) => state.auth.user);
 * const isAuthenticated = useAppSelector((state) => state.auth.user.is_authenticated);
 */
export const useAppSelector: UseAppSelector<RootState> = useSelector;

/**
 * Хук для получения значения из состояния по пути
 * 
 * @example
 * const authState = useAppState('auth');
 * const username = useAppState('auth.user.username');
 */
export const useAppState = <T extends keyof RootState, Keys extends (keyof RootState[T])[]>(
  slice: T,
  ...keys: Keys
): NestedProperty<RootState[T], Keys> => {
  return useAppSelector((state) => {
    let current: any = state[slice];
    for (const key of keys) {
      current = current[key];
    }
    return current;
  });
};