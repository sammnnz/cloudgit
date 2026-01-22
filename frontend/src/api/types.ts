// import { ApiResponse, UResponse } from "@/common/types";

// Типы для данных сессии
export interface SessionInfo {
    id?: string;
    is_authenticated: boolean;
    username?: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface UserCreateData {
    username: string;
    email: string;
    password: string;
}

export interface SSHKeyData {
    keyname: string;
    sshkey: string;
}

export interface SSHKeyGetParams {
    username: string;
    keynames?: string[];
}

// Типизированные ответы API
// export type SessionInfoResponse = ApiResponse<SessionInfo, { detail: string }>;
// export type LoginResponse = ApiResponse<{ message: string }, { detail: string }>;
// export type UserCreateResponse = ApiResponse<{ id: string }, { detail: string }>;
// export type SSHKeyResponse = UResponse<{ keys: Array<{ keyname: string, sshkey: string }> }>;
// export type BooleanResponse = ApiResponse<boolean, { detail: string }>;