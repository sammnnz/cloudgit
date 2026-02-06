import {Navbar as _Navbar} from "@/components/common/Navbar";
import navbarCSS from "@/styles/account/navbar.module.css"
import { useAuth } from "@/hooks/useAuth";

const Navbar = ({account}) => {
    const {user} = useAuth();
    const accountUsername = account.username;

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

    if (accountUsername !== user.username)
        delete links['Settings'];

    return (
        <_Navbar links={links} styles={[navbarCSS]}/>
    );
}

export default Navbar;
