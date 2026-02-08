import React from "react";
import { NavbarMui } from "@/components/common/NavbarMui";

interface NavbarProps {
    account: { username: string };
    repo: { repo_name: string };
    session: { username: string };
}

const NavbarMuiRepoData: React.FC<NavbarProps> = ({ account, repo, session }) => {
    const accountUsername = account.username;
    const sessionUsername = session.username;
    const repoName = repo.repo_name;

    const links: Record<string, { href?: string; links?: Record<string, {}> }> = {
        'Profile': {
            href: `/account/${accountUsername}?tab=profile`,
        },
        'Settings': {
            href: `/account/${accountUsername}/${repoName}?tab=settings`,
        },
        'Statistics': {
            href: `/account/${accountUsername}/${repoName}?tab=statistics`,
        }
    };

    // Remove Settings link if user is viewing another user's account
    if (accountUsername !== sessionUsername) {
        delete links['Settings'];
    }

    return <NavbarMui links={links} variant="account" />;
};

export default NavbarMuiRepoData;
