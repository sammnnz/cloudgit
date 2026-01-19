import React from "react";
import {getSessionInfo, getUserCheck} from "@api/auth.jsx";
import {parsePathName} from "@common/utils.jsx";

export const loader = async () => {
    const username = parsePathName("account", 1),
        isAccountExists = await getUserCheck(username);

    if (!isAccountExists) {
        throw new Error("Could not find user account.");
    }

    const session = await getSessionInfo();
    return { session };
}
