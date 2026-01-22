import {getSessionInfo} from "@/api/auth";

export const loader = async () => {
    const session = await getSessionInfo({timeout: 20000});
    if (session.is_authenticated)
        return { session };
    else
        window.location.href = "/";
}
