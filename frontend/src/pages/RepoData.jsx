import React from "react";
import {useLoaderData, useParams} from "react-router";
import {showServerMessage} from "@common/utils";
import Navbar from "@/components/account/Navbar";
import RepoDataBlock from "@/components/repodata/RepoDataBlock"

const RepoData = () => {
    const {username} = useParams(),
        account = {username};
    const data = useLoaderData(),
        {session, repo} = data;
    if (!session) showServerMessage();

    return (
        <div className="repodata-container">
            <Navbar account={account} session={session}/>
            <RepoDataBlock account={account} session={session} repo={repo}/>
        </div>
    );
}

export default RepoData;
