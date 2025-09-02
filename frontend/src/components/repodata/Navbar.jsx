import React from "react";
import {Navbar as _Navbar} from "@/components/common/Navbar";
import navbarCSS from "@/styles/repodata/navbar.module.css"

const Navbar = ({account, repo, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username,
        repoName = repo.repo_name;

    const links = {
        'Profile': {
            href: '/account/' + accountUsername + '?tab=profile',
            links: undefined
        },
        'Settings': {
            href: '/account/' + accountUsername + '/' + repoName + '?tab=settings',
            links: undefined
        },
        'Statistics': {
            href: '/account/' + accountUsername + '/' + repoName + '?tab=statistics',
            links: undefined
        }
    }

    if (accountUsername !== sessionUsername)
        delete links['Settings'];

    return (
        <_Navbar session={session} links={links} styles={[navbarCSS]}/>
    );
}

export default Navbar;
