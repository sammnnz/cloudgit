// This file contains constants used throughout the application
const stringToBoolean = (str) => {
    str = str.trim();
    return str === 'false' || str === '' ? false : true;
}

export const DEBUG = stringToBoolean(import.meta.env.VITE_DEBUG);
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL.trim();
