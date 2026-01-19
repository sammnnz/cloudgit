import React from "react";
import {Navbar as _Navbar} from "@/components/common/Navbar";
import navbarCSS from "@/styles/account/navbar.module.css"

const Navbar = ({session}) => {
    const links = {
        'Product': undefined,
        'Platform': {
            href: undefined,
            links: {
                'Storage': undefined,
                'CI/CD': undefined,
                'CLI': undefined
            }
        },
        'Pricing': {
            href: undefined,
            links: {
                'Free': undefined,
                'Premium': undefined,
                'Ultimate': undefined
            }
        },
        'About': undefined,
    }

    return (
        <_Navbar links={links} session={session} styles={navbarCSS}/>
    );
}

export default Navbar;
