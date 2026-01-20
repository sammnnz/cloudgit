import { convertResponse, getRequest, postRequest } from "@/common/utils";
import { REMOTE_SERVER_URL } from "@/common/constants";

export const url = REMOTE_SERVER_URL + '/api/auth/';

export const getCSRFToken = async (): Promise<string | undefined> => {
    const response = await getRequest(url + 'session/csrf/', {
        withCredentials: true
    }),
        token = response?.headers?.get('X-CSRF-Token');
    if (! token) {
        console.warn("X-CSRF-Token was not received.");
        return undefined;
    }

    return token;
}

export const getSessionInfo = async (options = {}) => {
    Object.assign(options, {withCredentials: true});
    const response = await getRequest(url + 'session/info/', options),
        result = {
            'id': undefined,
            'is_authenticated': false,
            'username': undefined
    };
    Object.assign(result, convertResponse(response)?.data)
    return result;
}

export const getSessionLogout = async () => {
    const response = await getRequest(url + 'session/logout/', {
        withCredentials: true
    });
    return convertResponse(response);
}

/**
 * Return True if user exists, False if not exists and undefined when server failed.
 */
export const getUserCheck = async (username: string) => {
    let response = await getRequest(url + `user/check?username=${username}`, {
        withCredentials: true,
    });
    response = convertResponse(response);
    if (+response?.status >= 300 && +response?.status < 200) {
        return;
    }

    return !!response?.data;
}

export const isUserExists = async (username: string) => {
    return await getUserCheck(username);
}

export const postSessionLogin = async (username: string, password: string) => {
    const response = await postRequest(url + 'session/login/', { username, password },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}

export const postUserCreate = async (username: string, email: string, password: string) => {
    const response = await postRequest(url + 'user/create/',
        { username, email, password },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}

export const postUserDelete = async () => {
    const response = await postRequest(url + 'user/delete/',
        {},
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}

export const postUserSSHKeyAdd = async (username: string, keyname: string, sshkey: string) => {
    const response = await postRequest(url + 'user/sshkey/add/',
        { username, keyname, sshkey },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}

export const postUserSSHKeyGet = async (username: string, keynames: string[] = []) => {
    const response = await postRequest(url + 'user/sshkey/get/',
        { username, keynames },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
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