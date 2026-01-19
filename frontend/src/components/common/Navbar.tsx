import React, {useRef} from "react";
import { ShadowRoot } from "@components/ShadowRoot";
import NavbarLinks from "@/components/common/NavbarLinks";
import {getSessionLogout} from "@api/auth.jsx";
import navbarCSS from "@styles/common/navbar.module.css";
import iconAvatarDefault from "@static/img/icon-avatar-default.svg";
import logoVariant from "@static/img/logo-variant.svg";

export const Navbar = ({links, styles, session}) => {
    if (!(styles instanceof Array))
        styles = []

    const isAuth = session.is_authenticated,
        sessionUsername = session.username,
        buttonRef = useRef(null);

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

    const authButtons = [
        (<button key={1} ref={buttonRef} className="button button-base">
            Logout
        </button>),
        (<a key={2} href={`/account/${sessionUsername}`}>
            <img src={iconAvatarDefault} height="24px" alt=""/>
        </a>)
    ]

    const noAuthButtons = [
        (<a key={1} className="button button-base sign-in-btn" href="/signin">
            Sign in
        </a>),
        (<a key={2} className="button button-accent-dark sign-up-btn" href="/signup">
            Sign up
        </a>)
    ]

    const onShadowLoad = () => {
        if (buttonRef.current)
            buttonRef.current.addEventListener('click', onLogout, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowLoad} pureStyles={[navbarCSS, ...styles]}>
            <div className="navbar">
                <div className="container">
                    <div className="logo">
                        <a href="/home">
                            <img src={logoVariant} height="16px" alt=""/>
                        </a>
                    </div>
                    <div className="content">
                        <NavbarLinks links={links}/>
                    </div>
                    <div className="buttons">
                        {isAuth ? authButtons : noAuthButtons}
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}
