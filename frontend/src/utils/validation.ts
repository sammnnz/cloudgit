import { ZodSchema, ZodError } from 'zod';

/**
 * Base validation (unsafe)
 */
export function validateData<D, T>(
  data: D,
  schema: ZodSchema<T>,
  context: string = ''
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`Validation failed ${context ? `(${context})` : ''}:`, {
        data,
        error
        // errors: error.errors.map(e => ({
        //   field: e.path.join('.'),
        //   message: e.message,
        // })),
      });
      
      throw new Error(`Invalid response format: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Safe validation
 */
export function safeValidateData<D, T>(
  data: D,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ZodError['errors'] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  console.error('Validation failed:', {
    errors: result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  });
  
  return { success: false, errors: result.error.errors };
}

/**
 * Validation with fallback
 */
export function validateDataWithFallback<D, T>(
  data: D,
  schema: ZodSchema<T>,
  fallback: T,
  context: string = ''
): T {
  try {
    return validateData(data, schema, context);
  } catch (error) {
    console.warn(`Validation failed, using fallback ${context ? `(${context})` : ''}:`, {
      error: error instanceof Error ? error.message : error,
      fallback,
    });
    
    return fallback;
  }
}