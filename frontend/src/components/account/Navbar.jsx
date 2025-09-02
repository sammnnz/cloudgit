import React from "react";
import {Navbar as _Navbar} from "@/components/common/Navbar";
import navbarCSS from "@/styles/account/navbar.module.css"

const Navbar = ({account, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;

    const links = {
        'Profile': {
            href: '/account/' + accountUsername + '?tab=profile',
            links: undefined
        },
        'Repositories': {
            href: '/account/' + accountUsername + '?tab=repositories',
            links: undefined
        },
        'Settings': {
            href: '/account/' + accountUsername + '?tab=settings',
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
