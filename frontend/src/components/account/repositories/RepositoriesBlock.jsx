import React, {useEffect, useState} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import repositoriesBlockCSS from "@/styles/account/repositories/repositories-block.module.css";
import RepoCreateForm from "@/components/account/repositories/RepoCreateForm.jsx"
import {postRepoGet} from "@api/repo.jsx";
import MUIShadowProvider from "@components/MUIShadowProvider.jsx";
import AddButton from "@components/mui/AddButton.jsx"
import addButtonCSS from "@styles/mui/add-button.module.css"

const Loading = () => {
    return (
        <div className="no-repositories">loading...</div>
    )
}

const NoRepositories = () => {
    return (
        <div className="no-repositories">No repositories yet.</div>
    )
}

const ServerError = () => {
    return (
        <div className="no-repositories">Server error.</div>
    )
}

const RepositoriesBlock = ({account, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username,
        access = accountUsername === sessionUsername ? null : 'public',
        noRepositoriesError = (
            <NoRepositories />
        ),
        serverError = (
            <ServerError/>
        );

    const [repos, setRepos] = useState([]),
        [error, setError] = useState(null),
        [loading, setLoading] = useState((
            <Loading/>
        )),
        [disabledRepoForm, setDisabledRepoForm] = useState(true);

    function* getRepositories (repos = []) {
        for (const repo of repos) {
            console.log(repo);
            yield (
                <RepoCreateForm lock={true}
                                access={repo.access}
                                reponame={repo.repo_name}
                                description={repo.description}
                                href={accountUsername + "/" + repo.repo_name}/>
            )
        }
    }

    async function loadRepositories () {
        const repoResponse = await postRepoGet(accountUsername, null, access),
            repoStatus = repoResponse?.status;

        if (200 > repoStatus || repoStatus >= 300) {
            setLoading(null);
            if (repoStatus === 404) {
                setError(noRepositoriesError);
            } else {
                setError(serverError);
            }
            return
        }

        const repos = repoResponse.data;
        if (!(repos instanceof Array)) {
            setLoading(null);
            setError(serverError);
            return
        }

        setLoading(null);
        setRepos(repos);
    }

    useEffect(() => {
        loadRepositories();
    }, [])

    const onClickAddButton = (e) => {
        setDisabledRepoForm(false);
    }

    return (
        <ShadowRoot onload={null} pureStyles={[repositoriesBlockCSS]} nopureStyles={[addButtonCSS]}>
            <MUIShadowProvider>
                <div className="repositories-block">
                    <div className="container">
                        {accountUsername === sessionUsername && disabledRepoForm ?
                            <AddButton text={"add"} onclick={disabledRepoForm ? onClickAddButton : null}/>
                            : null}
                        {disabledRepoForm ?
                            null :
                            <RepoCreateForm/>}
                        {...getRepositories(repos)}
                        {loading}
                        {error}
                    </div>
                </div>
            </MUIShadowProvider>
        </ShadowRoot>
    );
}

export default RepositoriesBlock;
