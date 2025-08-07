import React from "react";
import {useLoaderData, useParams} from "react-router";
import {showServerMessage} from "@common/utils";
import Navbar from "@/components/account/Navbar";

const RepoInstance = () => {
    const {username, reponame} = useParams(),
        account = {username};
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    return (
        <div className="repoinstance-container">
            <Navbar account={account} session={session}/>
            <h1>{reponame} repository.</h1>
        </div>
    );
}

export default RepoInstance;
