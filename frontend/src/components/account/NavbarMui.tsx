import React from "react";
import { NavbarMui } from "@/components/common/NavbarMui";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
    account: { username: string };
}

const NavbarMuiAccount: React.FC<NavbarProps> = ({ account }) => {
    const { user } = useAuth();
    const accountUsername = account.username;

    const links: Record<string, { href?: string; links?: Record<string, {}> }> = {
        'Profile': {
            href: `/account/${accountUsername}?tab=profile`,
        },
        'Repositories': {
            href: `/account/${accountUsername}?tab=repositories`,
        },
        'Settings': {
            href: `/account/${accountUsername}?tab=settings`,
        }
    };

    // Remove Settings link if user is viewing another user's account
    if (accountUsername !== user.username) {
        delete links['Settings'];
    }

    return <NavbarMui links={links} variant="account" />;
};

export default NavbarMuiAccount;
