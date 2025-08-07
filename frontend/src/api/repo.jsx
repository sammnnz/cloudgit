import { convertResponse, getRequest, postRequest } from "@/common/utils";
import { REMOTE_SERVER_URL } from "@/common/constants";
import {getCSRFToken} from "@api/auth.jsx";

export const url = REMOTE_SERVER_URL + '/api/repo/';

/**
 * Return True if repo exists, False if not exists and undefined when server failed.
 */
export const getRepoCheck = async (username, reponame) => {
    let response = await getRequest(url + `repo/check?username=${username}&reponame=${reponame}`, {
        withCredentials: true,
    });
    response = convertResponse(response);
    if (+response?.status >= 300 && +response?.status < 200) {
        return;
    }

    return !!response?.data;
}

/**
 * @param username
 * @param reponame If null, return all user's repositories
 * @param access Only with `reponame=null`. If null, return all (private and public) repositories
 */
export const postRepoGet = async (username, reponame = null, access = null) => {
    if (typeof reponame !== "string")
        reponame = null;

    if (reponame !== null)
        access = null;

    if (typeof access === "string" && ! ["private", "public"].includes(access))
        access = null;

    const response = await postRequest(url + 'repo/get/', { username, reponame, access },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}

export const postRepoCreate = async (username, reponame, access, description) => {
    const response = await postRequest(url + 'repo/create/', { username, reponame, access, description },
        {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': await getCSRFToken(),
        },
        withCredentials: true,
    });
    return convertResponse(response);
}