import { AxiosError, AxiosResponse } from 'axios';

export type ApiResponse<T = unknown, D = any, H = {}> = 
    | AxiosResponse<T, D, H> 
    | AxiosError<T, D>;

export type UResponse<T = unknown, D = any> = 
    | AxiosResponse<T, D>
    | undefined;

export type WrapResponse<T = unknown, D = any> = UResponse<T, D> & { success: boolean } | { success: boolean }