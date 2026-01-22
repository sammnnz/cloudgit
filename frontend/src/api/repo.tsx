import { apiClient, apiRequest, getResponseData } from "@/common/utils";
import { getCSRFToken } from "@/api/auth";
import { WrapResponse } from "@/common/types";

export const url = '/api/repo';

/**
 * Return True if repo exists, False if not exists and undefined when server failed.
 */
export const getRepoCheck = async (
    username: string, 
    reponame: string
): Promise<boolean | undefined> => {
    let response = await apiRequest(() => apiClient.get(url + `/repo/check?username=${username}&reponame=${reponame}`, {
        withCredentials: true,
    }));
    if (!response.success) {
        return
    }

    return getResponseData(response) as boolean;
}

/**
 * @param username
 * @param reponame If null, return all user's repositories
 * @param access Only with `reponame=null`. If null, return all (private and public) repositories
 */
export const postRepoGet = async <T = unknown, D = any>(
    username: string, 
    reponame: string | null = null, 
    access: "private" | "public" | null = null
): Promise<WrapResponse<T, D>> => {
    if (typeof reponame !== "string")
        reponame = null;

    if (reponame !== null)
        access = null;

    if (typeof access === "string" && ! ["private", "public"].includes(access))
        access = null;

    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/repo/get/', { username, reponame, access },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postRepoCreate = async <T = unknown, D = any>(
    username: string, 
    reponame: string, 
    access: "private" | "public", description: string
): Promise<WrapResponse<T, D>> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/repo/create/', { username, reponame, access, description },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postRepoDelete = async <T = unknown, D = any>(
    username: string, 
    reponame: string
): Promise<WrapResponse<T, D>> => {
    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/repo/delete/', { username, reponame },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const postRepoDataGet = async <T = unknown, D = any>(
    username: string, 
    reponame: string, 
    branch = 'main', 
    dir?: string
): Promise<WrapResponse<T, D>>=> {
    if (!dir)
        dir = ""

    const token = await getCSRFToken()
        , response = await apiRequest(() => apiClient.post(url + '/repo/data/get/', { username, reponame, branch, dir },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
        },
        withCredentials: true,
    }));
    return response;
}

export const repoAPI = {
    getRepoCheck,
    postRepoGet,
    postRepoCreate,
    postRepoDelete,
    postRepoDataGet
}