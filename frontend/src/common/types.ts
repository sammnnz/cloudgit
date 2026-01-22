import { AxiosError, AxiosResponse } from 'axios';

/**
 * General Axios Response (AxiosError or AxiosResponse)
 */
export type AResponse<T = unknown, D = any, H = {}> = 
    | AxiosResponse<T, D, H> 
    | AxiosError<T, D>;

/**
 * Concatenate of AxiosError and AxiosResponse
 */
export type UResponse<T = unknown, D = any> = AxiosResponse<T, D> & Omit<AxiosError<T, D>, 'response'>

/**
 * Wrap of `UResponse` with 'success' field
 */
export type WResponse<T = unknown, D = any> = UResponse<T, D> & { success: boolean }