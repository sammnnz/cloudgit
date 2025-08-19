import React from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import settingsBlockBlockCSS from "@/styles/repodata/settings/settings-block.module.css";
import {postRepoDelete} from "@api/repo.jsx";

const SettingsBlock = ({account, repo, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username,
        repoName = repo.repo_name;

    if (sessionUsername !== accountUsername)
        throw new Error("Access denied.");

    const onRepoDelete = async () => {
        const response = await postRepoDelete(accountUsername, repoName),
            status = response?.status;
        if (200 <= status && status < 300) {
            window.location.href = "/account/" + accountUsername;
        } else {
            alert("Delete failed. Please try again.");
        }
    }

    return (
        <ShadowRoot pureStyles={[settingsBlockBlockCSS]}>
            <div className="settings-block">
                <div className="container">
                    <button className="button button-accent" onClick={onRepoDelete}>Delete repository</button>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SettingsBlock;
