import { store } from "@/store"
import { getSession } from "@/store/slices/authSlice";

export const loader = async () => {
    const { auth } = store.getState();
    if (auth.user?.is_authenticated)
        window.location.href = `/account/${auth.user.username}`;

    try {
        const session = await store.dispatch(getSession()).unwrap();
        if (auth.user.is_authenticated)
            window.location.href = `/account/${auth.user.username}`
    } catch {}

}
