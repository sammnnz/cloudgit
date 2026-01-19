import React, {useRef} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import settingsBlockBlockCSS from "@/styles/account/settings/settings-block.module.css";
import {postRepoDelete} from "@api/repo.jsx";

const SettingsBlock = ({account, repo, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username,
        repoName = repo.repo_name;

    if (sessionUsername !== accountUsername)
        throw new Error("Access denied.");

    const delButtonRef = useRef(null);

    const onRepoDelete = async () => {
        const response = await postRepoDelete(accountUsername, repoName),
            status = response?.status;
        if (200 <= status && status < 300) {
            window.location.href = "/account/" + accountUsername;
        } else {
            alert("Delete failed. Please try again.");
            delButtonRef.current.addEventListener('click', onRepoDelete, {once: true});
        }
    }

    const onShadowRootLoad = () => {
        if (delButtonRef.current)
            delButtonRef.current.addEventListener('click', onRepoDelete, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[settingsBlockBlockCSS]}>
            <div className="settings-block">
                <div className="container">
                    <h1 className="title title-danger">Danger zone</h1>
                    <div className="setting">
                        <button ref={delButtonRef} className="button button-base">Delete repository</button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SettingsBlock;
