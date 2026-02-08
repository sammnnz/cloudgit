import React from "react";
import { NavbarMui } from "@/components/common/NavbarMui";

const NavbarMuiWelcome: React.FC = () => {
    const links = {
        'Product': {},
        'Platform': {
            href: undefined,
            links: {
                'Storage': {},
                'CI/CD': {},
                'CLI': {},
            }
        },
        'Pricing': {
            href: undefined,
            links: {
                'Free': {},
                'Premium': {},
                'Ultimate': {},
            }
        },
        'About': {},
    };

    return <NavbarMui links={links} variant="default" />;
};

export default NavbarMuiWelcome;
