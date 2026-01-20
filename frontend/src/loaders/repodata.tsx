import {getSessionInfo} from "@api/auth.jsx";
import {parsePathName} from "@common/utils.jsx";
import {postRepoGet} from "@api/repo.jsx";

export const loader = async () => {
    const username = parsePathName("account", 1),
        reponame = parsePathName("account", 2),
        repoResponse = await postRepoGet(username, reponame),
        repoStatus = repoResponse?.status,
        session = await getSessionInfo();

    if (200 > repoStatus && repoStatus >= 300)
        throw new Error(`Could not find repository '${reponame}'.`);

    let repo = repoResponse.data;
    if (!(repo instanceof Array) || repo.length !== 1)
        throw new Error(`Could not find repository '${reponame}'.`);

    repo = repo[0];
    if (session.username === username || repo.access === 'public')
        return { session, repo }

    throw new Error(`Could not find repository '${reponame}'.`);
}
