import { ReactNode } from "react";
import { ThunkAction, Action, Dispatch } from '@reduxjs/toolkit';

// ============================================================================
// БАЗОВЫЕ ТИПЫ ДЛЯ STATE
// ============================================================================

// Пользователь в системе
export interface AuthUser {
    id?: string;
    is_authenticated: boolean;
    username?: string;
}

// Состояние аутентификации
export interface AuthState {
  user: AuthUser;
  loading: boolean;
  error: string | null;
  csrfToken?: string;
}

// Состояние репозиториев
export interface RepoState {
  userRepos: any[];
  currentRepo: any | null;
  repoData: any;
  loading: boolean;
  error: string | null;
  operation: string | null;
}

// Корневое состояние (RootState)
export interface RootState {
  auth: AuthState;
  repo: RepoState;
}

// ============================================================================
// DISPATCH TYPES
// ============================================================================

// AppDispatch — это тип dispatch функции Redux
// Используем Dispatch<Action> из Redux Toolkit
export type AppDispatch = Dispatch<Action>;
// Thunk action для Redux Toolkit
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;

// ============================================================================
// GENERIC TYPE HELPERS
// ============================================================================

// Рекурсивный тип для произвольной глубины
export type NestedProperty<T, Keys extends any[]> = 
  Keys extends [infer First, ...infer Rest]
    ? First extends keyof T
      ? Rest extends any[]
        ? NestedProperty<T[First], Rest>
        : T[First]
      : never
    : T;

// Generic для получения свойства из корневого состояния
// export type StateProperty<T extends keyof RootState> = RootState[T];

// Generic для селектора
export type Selector<TState = RootState, TSelected = any> =
  (state: TState) => TSelected;

// Generic для селектора с параметрами
export type ParametricSelector<TState = RootState, TSelected = any, TParams = any> =
  (state: TState, params: TParams) => TSelected;
// ============================================================================
// ACTION TYPES
// ============================================================================

// Базовый action
export interface AppAction<T = string, P = any> {
  type: T;
  payload?: P;
  error?: boolean;
}

// Async thunk action status
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// ============================================================================
// HOOKS TYPES
// ============================================================================

// Generic хук для dispatch
export type UseAppDispatch<TDispatch = AppDispatch> = () => TDispatch;

// Generic хук для selector
export type UseAppSelector<TState = RootState> = <TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
) => TSelected;
// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface StoreProviderProps {
  children: ReactNode;
}
// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  status?: number;
  message?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Сделать все поля state обязательными
export type RequiredState<T extends RootState> = {
  [K in keyof T]: Required<T[K]>;
};

// Сделать все поля state опциональными
export type PartialState<T extends RootState> = {
  [K in keyof T]?: Partial<T[K]>;
};
// Generic для состояния с загрузкой
export interface LoadingState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// SLICE TYPES
// ============================================================================

// Generic для слайса с состоянием
export interface SliceState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
}

// Generic для ответа слайса
export interface SliceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

