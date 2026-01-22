import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ShadowRoot } from "@/components/ShadowRoot";
import signupCSS from "@/styles/signup.module.css";

const SigninBlock = () => {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuth();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [serverError, setServerError] = useState("");

    const handleSignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        setServerError("");
        
        try {
            const response = await login(username, password);
        
            if (response.success) {
                navigate(document.referrer || "/");
                return
            }
        } catch (e) {
            setServerError("Login failed")
        }       
    };

    return (
        <ShadowRoot pureStyles={[signupCSS]}>
            <div className="signup-block">
                <div className="container">
                    <div className="content">
                        <h1>Sign in to CloudGit!</h1>
                        <div className="signup-content">
                            <p>Username</p>
                            <input
                                id="username"
                                aria-label=""
                                className="input-default"
                                value={username}
                                type="text"
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="signup-content">
                            <p>Password</p>
                            <input
                                id="password"
                                aria-label=""
                                className="input-default"
                                value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                disabled={isLoading}
                            />
                        </div>
                        
                        {/* Показываем ошибку если есть */}
                        {error || serverError ? (
                            <span className="message-error">
                                {error || serverError}
                            </span>
                        ) : null}

                        <button
                            id="signup-btn"
                            className="button button-accent signup-btn"
                            onClick={handleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in ..." : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
};

export default SigninBlock;