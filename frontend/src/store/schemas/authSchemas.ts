import { z } from 'zod';
import { ErrorObjectSchema } from './commonSchemas';
import { ErrorObject } from '../types';

/**
 * AuthUser scheme
 * 
 * @example
 * // Пример для расширения схемы
 * export const AuthUserWithExtraSchema = AuthUserSchema.extend({
 *   email: z.string().email().optional(),
 *   role: z.enum(['user', 'admin', 'guest']).optional(),
 *   lastLogin: z.string().datetime().optional(),
 * });
 */
const AuthUserSchema = z.object({
  id: z.string().or(z.number()).optional().nullable(),
  is_authenticated: z.boolean(),
  username: z.string().optional(),
});

/**
 * AuthState schema
 */
const AuthStateSchema = z.object({
  user: AuthUserSchema,
  loading: z.boolean(),
  error: z.string().nullable(),
  errorObject: ErrorObjectSchema,
});

/**
 * Fabric for scheme with custom error
 */
const createAuthStateSchema = <E extends z.ZodRawShape>(
  errorObjectSchema?: z.ZodType<ErrorObject<z.infer<E>>>
) => {
  return z.object({
    user: AuthUserSchema,
    loading: z.boolean(),
    error: z.string().nullable(),
    errorObject: errorObjectSchema ?? ErrorObjectSchema,
  });
};

// ============================================================================
// СХЕМЫ ДЛЯ API ОТВЕТОВ
// ============================================================================

const ApiSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  status: z.number().optional(),
});

const UserApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: AuthUserSchema,
  }),
  message: z.string().optional(),
  status: z.number().optional(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  status: z.number(),
  error: z.any().optional(),
});

// ============================================================================
// СХЕМЫ ДЛЯ ВХОДНЫХ ДАННЫХ
// ============================================================================

const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const RegisterRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

export {
  AuthUserSchema,
  AuthStateSchema,
  ApiSuccessResponseSchema,
  createAuthStateSchema,
  UserApiResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
};