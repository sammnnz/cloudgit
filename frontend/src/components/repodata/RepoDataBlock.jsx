import React, {useEffect, useState} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import repoDataBlockCSS from "@/styles/repodata/repodata-block.module.css";
import {postRepoDataGet} from "@api/repo.jsx";
import FileExplorer from "@/components/mui/FileExplorer";
import Selector from "@/components/mui/Selector"
import MUIShadowProvider from "@components/MUIShadowProvider.jsx";

const RepoDataBlock = ({account, session, repo}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;

    if (sessionUsername !== accountUsername && repo.access === 'private')
        throw new Error("Access denied.");

    const [branch, setBranch] = useState("main"),
        [repositoryData, setRepositoryData] = useState(null);

    async function loadRepositoryData () {
        const response = await postRepoDataGet(accountUsername, repo.repo_name, branch, ""),
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
                    {/*<Selector name={"branch"}/>*/}
                    {repositoryData ? <FileExplorer items={repositoryData}/> : null}
                </MUIShadowProvider>
            </div>
        </ShadowRoot>
    );
}

export default RepoDataBlock;
