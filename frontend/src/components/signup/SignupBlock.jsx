import React, {useRef, useState} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import {convertResponseData, isEmailValid, isUsernameValid, showServerMessage} from "@common/utils";
import validator from "validator/es";
import {isUserExists, postSessionLogin, postUserCreate} from "@/api/auth";
import signupCSS from "@/styles/signup.module.css";

const SignupBlock = () => {
    const
        urlParams = new URLSearchParams(window.location.search),
        passwordParams = {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        };
    const
        buttonRef = useRef(null),
        [email, setEmail] = useState(urlParams.get("email") || ""),
        [emailMessage, setEmailMessage] = useState(""),
        [password, setPassword] = useState(""),
        [passwordMessage, setPasswordMessage] = useState(""),
        [timer, setTimer] = useState(0),
        [username, setUsername] = useState(""),
        [usernameMessage, setUsernameMessage] = useState("");

    const clearTimer = () => {
        clearTimeout(timer);
        setTimer(0);
    }

    const updateTimer = (e) => {
        clearTimeout(timer);
        setTimer(setTimeout(async (username) => {
            if (! isUsernameValid(username)) {
                setUsernameMessage("Invalid username. " +
                    "Use any letters of the English alphabet " +
                    "(upper and lower case), numbers (0-9), " +
                    "and the underscore (_).");
                e.target.classList.add("input-error");
                return;
            } else {
                setUsernameMessage("");
                e.target.classList.remove("input-error");
            }

            const isExists = await isUserExists(username);
            if (isExists === undefined) {
                setUsernameMessage("Server problem.");
                e.target.classList.add("input-error");
            }
            else if (isExists) {
                setUsernameMessage("Username is already exists.");
                e.target.classList.add("input-error");
            }
            else {
                setUsernameMessage("");
                e.target.classList.remove("input-error");
            }
        }, 1000, username));
    }

    const updateEmail = (e) => {
        const value = e.target.value;
        if (! isEmailValid(value)) {
            setEmailMessage("Invalid Email.");
            e.target.classList.add("input-error");
        } else {
            setEmailMessage("Valid Email.");
            e.target.classList.remove("input-error");
        }

        setEmail(value);
    }

    const updatePassword = (e) => {
        const value = e.target.value;

        if (value === "") {
            setPasswordMessage("Invalid Password.");
            e.target.classList.add("input-error");
        }
        else if (validator.isStrongPassword(value, passwordParams)) {
            setPasswordMessage('Valid Password.');
            e.target.classList.remove("input-error");
        } else {
            setPasswordMessage(
                'Not Strong Password. Please use at least 8 characters, 1 lowercase letter, ' +
                '1 uppercase letter, 1 number and 1 symbol.');
            e.target.classList.add("input-error");
        }

        setPassword(value);
    }

    // WARNING: Not use `useState` hook
    const signUp = async (e) => {
        let isValid = true;
        const parentNode = e.target.parentNode;
        const username = parentNode.querySelector("#username");
        if (! isUsernameValid(username.value)) {
            username.classList.add("input-error");
            isValid = false;
        } else {
            let isExists = username.value === "" ? true : await isUserExists(username.value);
            isExists = isExists === undefined ? true : isExists;
            if (isExists) {
                username.classList.add("input-error");
                isValid = false;
            }
        }

        const email = parentNode.querySelector("#email");
        if (! isEmailValid(email.value)) {
            email.classList.add("input-error");
            isValid = false;
        }

        const password = parentNode.querySelector("#password");
        if (! validator.isStrongPassword(password.value, passwordParams)) {
            password.classList.add("input-error");
            isValid = false;
        }

        if (! isValid) {
            buttonRef.current.addEventListener('click', signUp, {once: true});

            return;
        }

        let response = await postUserCreate(
            username.value, email.value, password.value
        ),
            codeErrors = [404, 422],
            errorMsg = convertResponseData(response),
            status = +response?.status;

        if (200 <= status && status < 300) {
            response = await postSessionLogin(username.value, password.value);
            if (200 <= status && status < 300) {
                window.history.back();
                return;
            }

            showServerMessage(response, `User ${username.value} was created, ` +
            `but due to server problems we were unable to authorize him.`);
        }
        else if (status === 403)
            console.warn("Warning: CSRF-Token was not received.");
        else if (codeErrors.includes(status))
            showServerMessage(response, errorMsg);
        else if (response)
            showServerMessage(response);

        buttonRef.current.addEventListener('click', signUp, {once: true});
    }

    const onShadowRootLoad = () => {
        if (buttonRef.current)
            buttonRef.current.addEventListener('click', signUp, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[signupCSS]}>
            <div className="signup-block">
                <div className="container">
                    <div className="content">
                        <h1>Sign up to CloudGit!</h1>
                        <div className="signup-content">
                            <p>Username</p>
                            <input id="username"
                                   aria-label=""
                                   className="input-default"
                                   value={username}
                                   type="text"
                                   onChange={(e => setUsername(e.target.value))}
                                   onKeyUp={updateTimer}
                                   onKeyDown={clearTimer}
                                   placeholder="Enter username"></input>
                            {usernameMessage === "" ?
                                <span className="message-success">
                                    {usernameMessage}
                                </span> :
                                <span className="message-error">
                                    {usernameMessage}
                                </span>
                            }
                        </div>
                        <div className="signup-content">
                            <p>Email</p>
                            <input id="email"
                                   aria-label=""
                                   className="input-default"
                                   value={email}
                                   type="email"
                                   onChange={updateEmail}
                                   placeholder="Enter username"></input>
                            {emailMessage === "Valid Email." ?
                                <span className="message-success">
                                    {emailMessage}
                                </span> :
                                <span className="message-error">
                                    {emailMessage}
                                </span>
                            }
                        </div>
                        <div className="signup-content">
                            <p>Password</p>
                            <input id="password"
                                   aria-label=""
                                   className="input-default"
                                   value={password}
                                   type="password"
                                   onChange={updatePassword}
                                   placeholder="Enter password"></input>
                            {passwordMessage === "Valid Password." ?
                                <span className="message-success">
                                    {passwordMessage}
                                </span> :
                                <span className="message-error">
                                    {passwordMessage}
                                </span>
                            }
                        </div>
                        <button ref={buttonRef}
                                className="button button-accent signup-btn">
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SignupBlock;
