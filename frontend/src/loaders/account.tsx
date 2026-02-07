import {getUserCheck} from "@/api/auth";
import {parsePathName} from "@/common/utils";
import { store } from "@/store";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // const url = new URL(request.url);
    const { auth } = store.getState();
    const username = parsePathName("account", 1);
    if (!username) {
        if (auth.user.is_authenticated) {
            window.location.href = `/account/${auth.user.username}`
            return
            // throw redirect(`/account/${auth.user.username}`)
        }

        throw redirect("/");
    }

    const isExists = await getUserCheck(username);

    if (!isExists) {
        throw new Error("Could not find user account.");
    }
}
