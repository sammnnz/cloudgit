import React from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import settingsBlockBlockCSS from "@/styles/account/settings/settings-block.module.css";
import {postUserDelete} from "@api/auth.jsx";

const SettingsBlock = ({account, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;

    if (sessionUsername !== accountUsername)
        throw new Error("Access denied.");

    const onUserDelete = async () => {
        const response = await postUserDelete(),
            status = response?.status;
        if (200 <= status && status < 300) {
            let path = window.location.href;
            window.location.href = path;
        } else {
            alert("Delete failed. Please try again.");
        }
    }

    return (
        <ShadowRoot pureStyles={[settingsBlockBlockCSS]}>
            <div className="settings-block">
                <div className="container">
                    <button className="button button-accent" onClick={onUserDelete}>Delete account</button>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SettingsBlock;
