import {useRef} from "react";
import { ShadowRoot } from "@components/ShadowRoot";
import NavbarLinks from "@/components/common/NavbarLinks";
import navbarCSS from "@styles/common/navbar.module.css";
import iconAvatarDefault from "@static/img/icon-avatar-default.svg";
import logoVariant from "@static/img/logo-variant.svg";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = ({links, styles}) => {
    if (!(styles instanceof Array))
        styles = []

    const navigate = useNavigate();
    const {user, isAuthenticated, logout, error } = useAuth()
    const buttonRef = useRef(null);

    const handleLogout = async () => {
        try {
            const response = await logout();

            if (response.success)
                navigate(window.location.href)
        } catch {
            alert(error ?? "Logout failed. Please try again.")
        }
    }

    const authButtons = [
        (<button key={1} ref={buttonRef} className="button button-base">
            Logout
        </button>),
        (<a key={2} href={`/account/${user.username}`}>
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
            buttonRef.current.addEventListener('click', handleLogout, {once: true});
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
                        {isAuthenticated ? authButtons : noAuthButtons}
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}
