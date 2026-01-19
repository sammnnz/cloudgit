import React from "react";
import {useLoaderData, useParams, useSearchParams} from "react-router";
import {showServerMessage} from "@common/utils";
import Navbar from "@/components/account/Navbar";
import RepositoriesBlock from "@components/account/repositories/RepositoriesBlock.jsx";
import SettingsBlock from "@components/account/settings/SettingsBlock.jsx";
import ProfileBlock from "@components/account/profile/ProfileBlock.jsx"

const Account = () => {
    const {username} = useParams(),
        account = {username};
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    const [searchParams] = useSearchParams(),
        tab = searchParams.get("tab");

    let Component;
    switch (tab) {
        case "repositories":
            Component = RepositoriesBlock;
            break;
        case "settings":
            Component = SettingsBlock;
            break;
        case "profile":
            Component = ProfileBlock;
            break;
    }

    return (
        <div className="account-container">
            <Navbar account={account} session={session}/>
            {Component ? <Component account={account} session={session}/> : null}
        </div>
    );
}

export default Account;
