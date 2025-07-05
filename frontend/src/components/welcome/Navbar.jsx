import React, {useRef} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import NavbarLinks from "./NavbarLinks";
import {getSessionLogout} from "@api/auth.jsx";
import navbarCSS from "@/styles/welcome/navbar.module.css";
import logoVariant from "@/static/img/logo-variant.svg";

const Navbar = ({isAuth}) => {
    if ((isAuth instanceof Boolean))
        isAuth = false;

    const buttonRef = useRef(null);

    const onClick = async () => {
        const response = await getSessionLogout();
        if (response) {
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
            buttonRef.current.addEventListener('click', onClick, {once: true});
        }
    }

    const onShadowLoad = () => {
        if (buttonRef.current)
            buttonRef.current.addEventListener('click', onClick, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowLoad} linkstyles={[navbarCSS]}>
            {/*<link rel="stylesheet" href="./src/styles/welcome/navbar.css"/>*/}
            <div className="navbar">
                <div className="container">
                    <div className="logo">
                        <img src={logoVariant} height="16px" alt=""/>
                    </div>
                    <div className="content">
                        <NavbarLinks />
                    </div>
                    {isAuth ?
                        <div className="buttons">
                            <button ref={buttonRef}
                                    className="button button-base sign-in-btn">
                                Logout
                            </button>
                        </div> :
                        <div className="buttons">
                            <a className="button button-base sign-in-btn" href="/signin">
                                Sign in
                            </a>
                            <a className="button button-accent-dark sign-up-btn" href="/signup">
                                Sign up
                            </a>
                        </div>
                    }
                </div>
            </div>
        </ShadowRoot>
    );
}

export default Navbar;
