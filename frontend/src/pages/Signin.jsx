import React from "react";
import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SigninBlock from "@/components/signin/SigninBlock";
import {showServerError} from "@common/utils.jsx";

const SignIn = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerError();

    return (
        <div className="signin-container">
            <Header />
            <SigninBlock />
            <Footer />
        </div>
    );
}

export default SignIn;
