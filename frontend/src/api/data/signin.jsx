import {getSessionInfo} from "@/api/auth";

export const loader = async () => {
    const sessionInfo = await getSessionInfo();
    if (sessionInfo?.data?.is_authenticated) window.location.href = "/dashboard";
    else return { session: sessionInfo?.data };
}
