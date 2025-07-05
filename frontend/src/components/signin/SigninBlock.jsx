import React, { useRef, useState } from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import { showServerError } from "@/common/utils";
import { postSessionLogin } from "@/api/auth";
import signupCSS from "@/styles/signup.module.css";

const SigninBlock = () => {
    const
        buttonRef = useRef(null),
        passwordRef = useRef(null),
        usernameRef = useRef(null),
        [password, setPassword] = useState(""),
        [username, setUsername] = useState("");

    // WARNING: Not use `useState` hook
    const signIn = async (e) => {
        const response = await postSessionLogin(
            usernameRef.current?.value, passwordRef.current?.value);
        if (+response?.status === 200) {
            window.location.href = "/dashboard";
            return;
        }
        else if (+response?.status === 400)
            alert("Invalid username or password. Please check your input.");
        else if (+response?.status === 403) {
            alert("No access to account.");
            console.warn("Warning: CSRF-Token was not received.");
        }
        else if (+response?.status === 404)
            showServerError(response);
        else if (!response)
            showServerError(response);

        buttonRef.current.addEventListener('click', signIn, {once: true});
    }

    const onShadowRootLoad = () => {
        buttonRef.current.addEventListener('click', signIn, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} linkstyles={[signupCSS]}>
            {/*<link rel="stylesheet" href="./src/styles/signup.css"/>*/}
            <div className="signup-block">
                <div className="container">
                    <div className="content">
                        <h1>Sign in to CloudGit!</h1>
                        <div className="signup-content">
                            <p>Username</p>
                            <input id="username"
                                   ref={usernameRef}
                                   aria-label=""
                                   className="input-default"
                                   value={username}
                                   type="text"
                                   onChange={(e => setUsername(e.target.value))}
                                   placeholder="Enter username"></input>
                        </div>
                        <div className="signup-content">
                            <p>Password</p>
                            <input id="password"
                                   ref={passwordRef}
                                   aria-label=""
                                   className="input-default"
                                   value={password}
                                   type="password"
                                   onChange={(e => setPassword(e.target.value))}
                                   placeholder="Enter password"></input>
                        </div>
                        <button ref={buttonRef}
                                id="signup-btn"
                                className="button button-accent signup-btn">
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SigninBlock;
