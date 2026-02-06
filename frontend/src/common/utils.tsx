import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosResponse } from "axios";
import { ComponentType, lazy, Suspense } from "react";
import Loading from "@/components/Loading";
import { DEBUG, REMOTE_SERVER_URL } from "@/common/constants";
import { AResponse, UResponse, WResponse } from "@/common/types";

export const convertAPIResponse = <T = unknown, D = any>(
    response: AResponse<T, D>
): UResponse<T, D> => {
    if (response instanceof AxiosError){
        const error = response;
        return {
            data: error.response?.data ?? ("" as T),
            status: error.response?.status ?? 0,
            statusText: error.response?.statusText ?? "",
            headers: error.response?.headers ?? {},
            config: error.config ?? {headers: new AxiosHeaders()},
            request: error.request,
            message: error.message ?? "",
            code: error.code
        } as UResponse<T, D>;
    }

    return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config,
        request: response.request,
        message: "",
        code: undefined
    } as UResponse<T, D>;
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
  (response: AxiosResponse) => {
    if (DEBUG)
        console.log(response);

    return convertAPIResponse(response)
  },
  (error: AxiosError) => {
    if (DEBUG)
        console.warn(error);

    return Promise.reject(convertAPIResponse(error))
  }
)

export async function apiRequest<T = unknown, D = any>(
    request: () => Promise<AResponse<T, D>>
): Promise<WResponse<T, D>> {
    return await request()
    .then(response => {
        return {
            ...response,
            success: true,
        } as WResponse<T, D>;
    })
    .catch(error => {
        return {
            ...error,
            success: false,
        } as WResponse<T, D>;
    })
}

export const getResponseData = <T = unknown, D = any>(
    response: UResponse<T, D> | WResponse<T, D>
): undefined | string | T => {
    const data = response.data;
    switch(typeof data) {
        case "object":
            if (data !== null && 'detail' in data) {
                const detail = data.detail;

                if (typeof detail === "string")
                    return detail

                if (detail instanceof Array && detail.length && typeof detail[0] === "object")
                    return detail[0].msg as string
            }

            if (data === null)
                return
            
            return data
        default:
            return data
    }
}

export const isEmailValid = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export const isUsernameValid = (username: string) => {
    const re = /^[0-9A-Za-z_]{1,32}$/;
    return re.test(username);
}

export const lazyLoad = (
    factory: () => Promise<{default: ComponentType<any>;}>
) => () => {
    const Component = lazy(factory);
    return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

export const parsePathName = (start: string = "", index: number = 0) => {
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
            index = path.length + index - +i;

        if (index === afterIndex)
            return p;

        afterIndex += 1
    }
}

export const passwordParams = {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
}

/**
 * @deprecated 
 */
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