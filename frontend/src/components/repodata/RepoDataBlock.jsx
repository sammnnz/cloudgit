import React, {useEffect, useState} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import repoDataBlockCSS from "@/styles/repodata/repodata-block.module.css";
import {postRepoDelete, postRepoGet, postRepoDataGet} from "@api/repo.jsx";
import FileExplorer from "@/components/mui/FileExplorer";
import MUIShadowProvider from "@components/MUIShadowProvider.jsx";

const RepoDataBlock = ({account, session, repo}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;

    if (sessionUsername !== accountUsername && repo.access === 'private')
        throw new Error("Access denied.");

    const [branch, setBranch] = useState("main"),
        [repositoryData, setRepositoryData] = useState(null),
        [path, setPath] = useState("/");

    // const onRepoDelete = async () => {
    //     const response = await postRepoDelete(account.username, repo.repo_name),
    //         status = response?.status;
    //     if (200 <= status && status < 300) {
    //         window.location.href = `/account/${accountUsername}`;
    //     } else {
    //         alert("Delete failed. Please try again.");
    //     }
    // }

    async function loadRepositoryData () {
        const response = await postRepoDataGet(accountUsername, repo.repo_name, branch, path),
            status = response?.status;

        if (200 > status || status >= 300) {
            setRepositoryData(null)
            return
        }

        const data = response.data;
        setRepositoryData(data);
    }

    useEffect(() => {
        loadRepositoryData();
    }, [])

    return (
        <ShadowRoot pureStyles={[repoDataBlockCSS]}>
            <div className="repodata-block">
                <MUIShadowProvider>
                    {repositoryData ? <FileExplorer items={repositoryData}/> : null}
                </MUIShadowProvider>
                {/*<div className="container">*/}
                {/*    <h1>{repo.repo_name}</h1>*/}
                {/*    <button className="button button-accent" onClick={onRepoDelete}>Delete repository</button>*/}
                {/*</div>*/}
            </div>
        </ShadowRoot>
    );
}

export default RepoDataBlock;
