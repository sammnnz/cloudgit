import axios from "axios";
import React, { lazy, Suspense } from "react";
import Loading from "@/components/Loading";
import { DEBUG } from "@/common/constants";

export const convertResponse = (response) => {
    if (response instanceof Error) return response?.response;
    return response;
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

export const showServerError = (
    error = undefined,
    msg = "Sorry, some problem with server. Please try again later.") => {
    if (+error?.response?.status === 500) {
        console.error("Server error: ", DEBUG ? error : error?.message ? error.message : msg);
    }

    alert(msg);
}
