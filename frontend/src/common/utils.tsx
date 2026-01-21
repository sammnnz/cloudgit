import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { lazy, Suspense } from "react";
import Loading from "@/components/Loading";
import { DEBUG, REMOTE_SERVER_URL } from "@/common/constants";
import { ApiResponse, Response } from "@/common/types";

export const convertAPIResponse = <T = unknown, D = any>(
    response: ApiResponse<T, D>
): Response<T, D> => {
    if (response instanceof AxiosError)
        return response.response

    return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config,
        request: response.request,
    } as AxiosResponse<T, D>;
}

export const convertResponseData = <T = unknown, D = any>(
    response: Response<T, D>
) => {
    if (!response)
        return undefined

    const data = response.data;
    switch(typeof data) {
        case "undefined":
            return
        case "string":
            return data
        case "object":
            if (data !== null && 'detail' in data) {
                const detail = data.detail;

                if (typeof detail === "string")
                    return detail

                if (detail instanceof Array && detail.length && typeof detail[0] === "object")
                    return detail[0].msg
            }
            return data
        default:
            return
    }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: REMOTE_SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Error handler
apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG)
        console.log(response);

    return response
  },
  (error) => {
    if (DEBUG)
        console.warn(error);

    return Promise.reject(convertAPIResponse(error))
  }
)

export async function apiRequest<T = unknown, D = any>(
    request: () => Promise<Response<T, D>>
): Promise<Response<T, D> & { success: boolean }> {
    return await request()
    .then(response => {
            return {
            ...response,
            success: true,
        } as Response<T, D> & { success: boolean };
    })
    .catch(error => {
        return {
            ...error,
            success: false,
        } as Response<T, D> & { success: boolean };
    })
}

export const isEmailValid = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export const isUsernameValid = (username: string) => {
    const re = /^[0-9A-Za-z_]{1,32}$/;
    return re.test(username);
}

export const lazyLoad = (factory) => () => {
    const Component = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

export const parsePathName = (start = "", index = 0) => {
    if (typeof start !== "string")
        start = ""

    start = start.trim()
    if (typeof index !== "number")
        index = 0;

    let path = window.location.pathname.split("/"),
        afterIndex = 0;
    for (let i in path) {
        const p = path[i].trim()
        if (p !== start && !afterIndex)
            continue;

        if (index < 0 && !afterIndex)
            index = path.length + index - i;

        if (index === afterIndex)
            return p;

        afterIndex += 1
    }
}

export const showServerMessage = (
    response = undefined,
    msg = undefined,
    is_alert = true) => {
    if (DEBUG)
        console.error("Server error: ", response);

    if (is_alert)
        if (msg)
            alert(msg);
        else
            alert("Sorry, some problem with server. Please try again later.");
}

/**
 * @description TODO: remove
 * @deprecated
 */
export const getRequest = async (url: string, options = {}) => {
    return await axios.get(url, options)
    .then(response => {
        console.log('GET-request successful.', DEBUG ? response : '');
        return convertAPIResponse(response);
    })
    .catch(error => {
        console.warn('GET-request failed.', DEBUG ? error : error.message);
        // Convert the error to our typed ApiResponse
        return convertAPIResponse(error);
    });
}

/**
 * @description TODO: remove
 * @deprecated
 */
export const postRequest = async (url, data, options = {}) => {
    return await axios.post(url, data, options)
    .then(response => {
        console.log('POST-request successful.', DEBUG ? response : '');
        // Convert the raw axios response to our typed ApiResponse
        return convertAPIResponse(response);
    })
    .catch(error => {
        console.warn('POST-request failed.', DEBUG ? error : error.message);
        // Convert the error to our typed ApiResponse
        return convertAPIResponse(error);
    });
}
