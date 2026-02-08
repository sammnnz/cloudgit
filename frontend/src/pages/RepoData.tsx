import React from "react";
import {useLoaderData, useParams, useSearchParams} from "react-router";
import {showServerMessage} from "@common/utils";
import Navbar from "@/components/repodata/NavbarMui";
import RepoDataBlock from "@/components/repodata/RepoDataBlock"
import SettingsBlock from "@/components/repodata/settings/SettingsBlock"

const RepoData = () => {
    const {username} = useParams(),
        account = {username};
    const data = useLoaderData(),
        {session, repo} = data;
    if (!session) showServerMessage();

    const [searchParams] = useSearchParams(),
        tab = searchParams.get("tab");

    let Component;
    switch (tab) {
        case "settings":
            Component = SettingsBlock;
            break;
        // case "statistics":
        //     Component = StatisticsBlock;
        //     break;
        default:
            Component = RepoDataBlock;
    }

    return (
        <div className="repodata-container">
            <Navbar account={account} repo={repo} session={session}/>
            {Component ? <Component account={account} repo={repo} session={session}/> : null}
        </div>
    );
}

export default RepoData;
