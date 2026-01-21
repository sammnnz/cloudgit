import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/store/hooks";
import { ShadowRoot } from "@/components/ShadowRoot";
import signupCSS from "@/styles/signup.module.css";

const SigninBlockRedux = () => {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuth();
    const csrfToken = useAppSelector((state) => state.auth.csrfToken);
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [serverError, setServerError] = useState("");

    const handleSignIn = async (e: React.MouseEvent) => {
        e.preventDefault();
        setServerError("");

        try {
            await login(username, password);
            // После успешного входа перенаправляем
            const referrer = document.referrer;
            navigate(referrer || "/");
        } catch (err: any) {
            // Обработка ошибок
            if (err?.status === 403) {
                setServerError("No access to account.");
                console.warn("Warning: CSRF-Token was not received.");
            } else if (err?.status === 404 || err?.status === 422) {
                setServerError(err?.message || "Invalid credentials");
            } else {
                setServerError("Login failed. Please try again.");
            }
        }
    };

    const onShadowRootLoad = () => {
        // ShadowRoot логика при необходимости
    };

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[signupCSS]}>
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
                            <div style={{ color: "red", margin: "10px 0" }}>
                                {error || serverError}
                            </div>
                        ) : null}

                        <button
                            id="signup-btn"
                            className="button button-accent signup-btn"
                            onClick={handleSignIn}
                            disabled={isLoading || !username || !password}
                        >
                            {isLoading ? "Signing in ..." : "Sign in"}
                        </button>

                        {/* Вывод CSRF для отладки */}
                        {csrfToken && (
                            <div style={{ fontSize: "10px", opacity: 0.5 }}>
                                CSRF: {csrfToken.substring(0, 10)}...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
};

export default SigninBlockRedux;