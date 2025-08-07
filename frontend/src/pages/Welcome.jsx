import React, {useRef} from "react";
import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import {Navbar} from "@/components/common/Navbar";
import WelcomeBlock from "@/components/welcome/WelcomeBlock";
import Footer from "@/components/Footer";
import {showServerMessage} from "@common/utils.jsx";
import {getSessionLogout} from "@api/auth.jsx";

const Welcome = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    const isAuth = !!session?.is_authenticated;

    const buttonRef = useRef(null);

    const onLogout = async () => {
        const response = await getSessionLogout();
        if (response) {
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
            buttonRef.current.addEventListener('click', onLogout, {once: true});
        }
    }

    const onNavbarLoad = () => {
        if (buttonRef.current)
            buttonRef.current.addEventListener('click', onLogout, {once: true});
    }

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

    const noAuthButtons = [
        (<a className="button button-base sign-in-btn" href="/signin">
            Sign in
        </a>),
        (<a className="button button-accent-dark sign-up-btn" href="/signup">
            Sign up
        </a>)
    ]

    const authButtons = [
        (<button ref={buttonRef}
                 className="button button-base sign-in-btn">
            Logout
        </button>)
    ]
    return (
        <div className="welcome-container">
            <Header/>
            <Navbar links={links} 
                    buttons={isAuth ? authButtons : noAuthButtons}
                    onload={onNavbarLoad}/>
            <WelcomeBlock/>
            <Footer/>
        </div>
    );
}

export default Welcome;
