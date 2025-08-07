import React, { useRef, useState } from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import {convertResponseData, showServerMessage} from "@/common/utils";
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
            usernameRef.current?.value, passwordRef.current?.value),
            codeErrors = [404, 422],
            errorMsg = convertResponseData(response),
            status = +response?.status;
        if (200 <= status && status < 300) {
            window.history.back();
            return;
        }
        else if (status === 403) {
            alert("No access to account.");
            console.warn("Warning: CSRF-Token was not received.");
        }
        else if (codeErrors.includes(status))
            showServerMessage(response, errorMsg);
        else if (response)
            showServerMessage(response);

        buttonRef.current.addEventListener('click', signIn, {once: true});
    }

    const onShadowRootLoad = () => {
        buttonRef.current.addEventListener('click', signIn, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[signupCSS]}>
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
