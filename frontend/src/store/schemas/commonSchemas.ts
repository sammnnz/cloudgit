import { z } from 'zod';
import { ErrorObject } from '../types';

// ============================================================================
// СХЕМА ДЛЯ ErrorObject<T = {}>
// ============================================================================

/**
 * Базовая схема для ErrorObject
 * Сохраняет структуру: { msg?: string }
 */
const ErrorObjectSchema = z.custom<ErrorObject<any>>(
  (value) => {
    if (typeof value !== 'object' || value === null) return false;
    if (!('msg' in value)) return false;
    if (value.msg !== undefined && typeof value.msg !== 'string') return false;
    return true;
  },
  { message: 'ErrorObject must have msg?: string' }
);

/**
 * Создаём ErrorObject с дополнительными полями (для кастомных типов)
 * 
 * @example
 * // ErrorObject с кодом ошибки
 * export const ErrorObjectWithCodeSchema = createErrorObjectSchema({
 * code: z.number(),
 * details: z.array(z.string()).optional(),
 * });
 * // ErrorObject с временной меткой
 * export const ErrorObjectWithTimestampSchema = createErrorObjectSchema({
 * timestamp: z.string().datetime(),
 * details: z.array(z.string()).optional(),
 * });

 */
export const createErrorObjectSchema = <T extends z.ZodRawShape>(
  additionalFields?: T
) => {
  const baseSchema = z.object({
    msg: z.string().optional(),
  });
  
  if (additionalFields) {
    return baseSchema.extend(additionalFields);
  }
  
  return baseSchema;
};

export { ErrorObjectSchema };