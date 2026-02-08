import { useAuth } from "@/hooks/useAuth";
import { NavbarMui } from "@/components/common/NavbarMui";

interface NavbarProps {
    account: { username: string };
}

const Navbar = ({account}: NavbarProps) => {
    const {user} = useAuth();
    const accountUsername = account.username;

    // Only include Settings link if user is viewing their own account
    const shouldShowSettings = accountUsername === user.username;

    const links: Record<string, { href: string }> = {
        'Profile': {
            href: '/account/' + accountUsername + '?tab=profile',
        },
        'Repositories': {
            href: '/account/' + accountUsername + '?tab=repositories',
        },
    };

    if (shouldShowSettings) {
        links['Settings'] = {
            href: '/account/' + accountUsername + '?tab=settings',
        };
    }

    return (
        <NavbarMui links={links} variant="account" />
    );
}

export default Navbar;
