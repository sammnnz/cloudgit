import {ChangeEvent, useState} from "react";
import { useNavigate } from "react-router";
import { ShadowRoot } from "@/components/ShadowRoot";
import {isEmailValid, isUsernameValid, passwordParams} from "@common/utils";
import {isUserExists} from "@/api/auth";
import { useAuth } from "@/hooks";
import signupCSS from "@/styles/signup.module.css";
import validator from "validator/es";

const SignupBlock = () => {
    const navigate = useNavigate();
    const { login, register, isLoading, error } = useAuth();

    const urlParams = new URLSearchParams(window.location.search);

    const [email, setEmail] = useState(urlParams.get("email") || "");
    const [emailMessage, setEmailMessage] = useState("");
    const [password, setPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [username, setUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [serverError, setServerError] = useState("");
    const [timer, setTimer] = useState(0);

    const clearTimer = () => {
        clearTimeout(timer);
        setTimer(0);
    }

    const updateTimer = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearTimeout(timer);
        setTimer(setTimeout(async (username: string) => {
            if (!isUsernameValid(username)) {
                setUsernameMessage("Invalid username. " +
                    "Use any letters of the English alphabet " +
                    "(upper and lower case), numbers (0-9), " +
                    "and the underscore (_)");
                return;
            }

            setUsernameMessage("");
            switch (await isUserExists(username)) {
                case undefined: // unkwown case (may be error in endpoint)
                    setUsernameMessage("Server problem");
                    break
                case true:
                    setUsernameMessage("Username is already exists");
                    break
                default:
                    setUsernameMessage("");
                    break
            }
        }, 1000, username));
    };

    const updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!Boolean(value))
            setEmailMessage("Email is required");
        else if (!isEmailValid(value)) 
            setEmailMessage("Invalid email");
        else
            setEmailMessage("");

        setEmail(value);
    }

    const updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!Boolean(value))
            setUsernameMessage("Username is required");
        
        setUsername(value);
    }

    const updatePassword = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (!Boolean(value))
            setPasswordMessage("Password is required");
        else if (!validator.isStrongPassword(value, passwordParams))
            setPasswordMessage(
              'Not Strong Password. Please use at least 8 characters, 1 lowercase ' +
              'letter, 1 uppercase letter, 1 number and 1 symbol'
            )
        else
            setPasswordMessage("")
        
        setPassword(value);
    }

    const handleSignUp = async (e: React.MouseEvent) => {
        e.preventDefault();
        setServerError("");

        try {
            let response = await register(
                username, 
                email, 
                password
            );

            if (response.success) {
                try {
                    response = await login(username, password)
                
                    if (response.success) {
                        navigate(document.referrer || "/");
                        return
                    }
                } catch {
                    alert(
                        `User ${username} was created, ` + 
                        `but due to server problems we were unable to authorize him.`)
                    return
                }
            }
        } catch {

        }
    }

    return (
        <ShadowRoot pureStyles={[signupCSS]}>
            <div className="signup-block">
                <div className="container">
                    <div className="content">
                        <h1>Sign up to CloudGit!</h1>
                        <div className="signup-content">
                            <p>Username</p>
                            <input id="username"
                                   aria-label=""
                                   className={usernameMessage === "" ? "input-default" : "input-default input-error"}
                                   value={username}
                                   type="text"
                                   onChange={updateUsername}
                                   onKeyUp={updateTimer}
                                   onKeyDown={clearTimer}
                                   disabled={isLoading}
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
                                   className={emailMessage === "" ? "input-default" : "input-default input-error"}
                                   value={email}
                                   type="email"
                                   onChange={updateEmail}
                                   disabled={isLoading}
                                   placeholder="Enter username"></input>
                            {emailMessage === "" ?
                                null :
                                <span className="message-error">
                                    {emailMessage}
                                </span>
                            }
                        </div>
                        <div className="signup-content">
                            <p>Password</p>
                            <input id="password"
                                   aria-label=""
                                   className={passwordMessage === "" ? "input-default" : "input-default input-error"}
                                   value={password}
                                   type="password"
                                   onChange={updatePassword}
                                   disabled={isLoading}
                                   placeholder="Enter password"></input>
                            {passwordMessage === "" ?
                                null :
                                <span className="message-error">
                                    {passwordMessage}
                                </span>
                            }
                        </div>

                        {error || serverError ? (
                            <span className="message-error">
                                {error || serverError}
                            </span>
                        ) : null}

                        <button
                            onClick={handleSignUp}
                            className="button button-accent signup-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing up ..." : "Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SignupBlock;
