import { AxiosError, AxiosResponse } from 'axios';

export type ApiResponse<T = unknown, D = any, H = {}> = 
    | AxiosResponse<T, D, H> 
    | AxiosError<T, D>;

export type Response<T = unknown, D = any> = 
    | AxiosResponse<T, D>
    | undefined;
