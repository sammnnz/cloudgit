import { store } from "@/store"
import { redirect } from 'react-router-dom';

export const loader = async () => {
    const { auth } = store.getState();
    if (auth.user.is_authenticated)
        return null;

    throw redirect("/");
}