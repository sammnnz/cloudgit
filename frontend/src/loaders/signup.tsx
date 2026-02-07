import { store } from "@/store"
import { redirect } from 'react-router-dom';

export const loader = async () => {
    const { auth } = store.getState();
    if (auth.user.is_authenticated)
        throw redirect(`/account/${auth.user.username}`);

    return null;
}