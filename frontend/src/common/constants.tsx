// This file contains constants used throughout the application
const stringToBoolean = (str) => {
    str = str.trim();
    return !(str === 'false' || str === '');
}

export const DEBUG = stringToBoolean(import.meta.env.VITE_DEBUG);
export const REMOTE_SERVER_URL = import.meta.env.VITE_REMOTE_SERVER_URL.trim();
