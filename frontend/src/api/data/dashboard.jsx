import React from "react";
import {getSessionInfo} from "@/api/auth";

export const loader = async () => {
    const sessionInfo = await getSessionInfo();
    if (sessionInfo?.data?.is_authenticated) return { session: sessionInfo.data };
    else window.location.href = "/";
}
