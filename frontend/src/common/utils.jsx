import axios from "axios";
import React, { lazy, Suspense } from "react";
import Loading from "@/components/Loading";
import { DEBUG } from "@/common/constants";

export const convertResponse = (response) => {
    if (response instanceof Error) return response?.response;
    return response;
}

export const convertResponseData = (response) => {
    if (!response)
        return undefined

    if (typeof response.data === "undefined")
        return undefined

    if (typeof response.data === "string")
        return response.data

    if (typeof response.data === "object") {
        const detail = response.data.detail;
        if (typeof detail === "string")
            return detail

        if (detail instanceof Array && detail.length && typeof detail[0] === "object")
            return detail[0].msg
    }

    return undefined
}

export const getRequest = async (url, options = {}) => {
    return await axios.get(url, options)
    .then(response => {
        console.log('GET-request successful.', DEBUG ? response : '');
        return response;
    })
    .catch(error => {
        console.warn('GET-request failed.', DEBUG ? error : error.message);
        return error;
    });
}

export const isEmailValid = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export const isUsernameValid = (username) => {
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

export const postRequest = async (url, data, options = {}) => {
    return await axios.post(url, data, options)
    .then(response => {
        console.log('GET-request successful.', DEBUG ? response : '');
        return response;
    })
    .catch(error => {
        console.warn('GET-request failed.', DEBUG ? error : error.message);
        return error;
    });
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
