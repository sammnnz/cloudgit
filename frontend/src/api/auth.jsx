import { convertResponse, getRequest, postRequest } from "@/common/utils";
import { BACKEND_URL } from "@/common/constants";

export const url = BACKEND_URL + '/api/auth/';
export const getCSRFToken = async () => {
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
    const response = await getRequest(url + 'session/info/', options);
    return convertResponse(response);
}

export const getSessionLogout = async () => {
    const response = await getRequest(url + 'session/logout/', {
        withCredentials: true
    });
    return convertResponse(response);
}

export const getUserCheck = async (username) => {
    const response = await getRequest(url + `user/check?username=${username}`, {
        withCredentials: true,
    });
    return convertResponse(response);
}

export const isUserExists = async (username) => {
    const response = await getUserCheck(username);
    if (+response?.status >= 300 && +response?.status < 200) {
        return;
    }

    return !!response?.data;
}

export const postSessionLogin = async (username, password) => {
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

export const postUserCreate = async (username, email, password) => {
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