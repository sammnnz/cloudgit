import { apiRequest, apiClient, convertResponseData } from "@/common/utils";
import { ApiResponse, Response } from "@/common/types";

export const url = '/api/auth';

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
    username: string;
    keyname: string;
    sshkey: string;
}

export interface SSHKeyGetParams {
    username: string;
    keynames?: string[];
}

// Типизированные ответы API
export type SessionInfoResponse = ApiResponse<SessionInfo, { detail: string }>;
export type LoginResponse = ApiResponse<{ message: string }, { detail: string }>;
export type UserCreateResponse = ApiResponse<{ id: string }, { detail: string }>;
export type SSHKeyResponse = Response<{ keys: Array<{ keyname: string, sshkey: string }> }>;
export type BooleanResponse = ApiResponse<boolean, { detail: string }>;

export const getCSRFToken = async (): Promise<string | undefined> => {
    const response = await apiRequest(() => apiClient.get(url + '/session/csrf/', {
        withCredentials: true
    })),
        token = response.headers?.get('X-CSRF-Token');
    if (! token) {
        console.warn("X-CSRF-Token was not received.");
        return undefined;
    }

    return token;
}

export const getSessionInfo = async (options = {}): Promise<SessionInfo> => {
    Object.assign(options, {withCredentials: true});
    const response = await apiRequest(() => apiClient.get(url + '/session/info/', options)),
        result = {
            'id': undefined,
            'is_authenticated': false,
            'username': undefined
    };
    Object.assign(result, convertResponseData(response))
    return result;
}

export const getSessionLogout = async (): Promise<Response> => {
    const response = await apiRequest(() => apiClient.get(url + '/session/logout/', {
        withCredentials: true
    }));
    return response;
}

/**
 * Return True if user exists, False if not exists and undefined when server failed.
 */
export const getUserCheck = async (username: string): Promise<boolean | undefined> => {
    const response = await apiRequest(() => apiClient.get(url + `/user/check?username=${username}`, {
        withCredentials: true,
    }));
    if (!response.success)
        return

    return response.data as boolean;
}

export const isUserExists = async (username: string): Promise<boolean | undefined> => {
    return await getUserCheck(username);
}

export const postSessionLogin = async (username: string, password: string): Promise<Response> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/session/login/', { username, password },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postUserCreate = async (username: string, email: string, password: string): Promise<Response> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/user/create/',
        { username, email, password },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postUserDelete = async (): Promise<Response> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/user/delete/',
        {},
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postUserSSHKeyAdd = async (username: string, keyname: string, sshkey: string): Promise<Response> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/user/sshkey/add/',
        { username, keyname, sshkey },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postUserSSHKeyGet = async (username: string, keynames: string[] = []): Promise<Response> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/user/sshkey/get/',
        { username, keynames },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const authAPI = {
    getCSRFToken,
    getSessionInfo,
    getSessionLogout,
    getUserCheck,
    isUserExists,
    postSessionLogin,
    postUserCreate,
    postUserDelete,
    postUserSSHKeyAdd,
    postUserSSHKeyGet
}