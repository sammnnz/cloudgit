import React, {useRef} from "react";
import {Navbar as _Navbar} from "@/components/common/Navbar";
import {getSessionLogout, postUserDelete} from "@api/auth.jsx";
import iconAvatarDefault from "@static/img/icon-avatar-default.svg";
import navbarCSS from "@/styles/account/navbar.module.css"
import {useParams} from "react-router";

const Navbar = ({account, session}) => {
    const isAuth = session.is_authenticated,
        accountUsername = account.username,
        // userID = +session?.id,
        sessionUsername = session.username;

    const onLogout = async () => {
        const response = await getSessionLogout(),
            status = response?.status;
        if (200 <= status && status < 300) {
            let path = window.location.href;
            window.location.href = path;
        } else {
            alert("Logout failed. Please try again.");
        }
    }

    const buttonRef = useRef(null);

    const authButtons = [
        (<button ref={buttonRef} className="button button-base">
            Logout
        </button>),
        (<a href={`/account/${sessionUsername}`}>
            <img src={iconAvatarDefault} height="24px" alt=""/>
        </a>)
    ]

    const noAuthButtons = [
        (<a className="button button-base sign-in-btn" href="/signin">
            Sign in
        </a>),
        (<a className="button button-accent-dark sign-up-btn" href="/signup">
            Sign up
        </a>)
    ]

    const onNavbarLoad = () => {
        if (buttonRef.current)
            buttonRef.current.addEventListener('click', onLogout, {once: true});
    }

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
        <_Navbar links={links}
                 buttons={isAuth ? authButtons : noAuthButtons}
                 onload={onNavbarLoad}
                 styles={[navbarCSS]}/>
    );
}

export default Navbar;
