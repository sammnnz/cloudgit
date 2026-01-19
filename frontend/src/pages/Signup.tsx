import React from "react";
import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignupBlock from "@/components/signup/SignupBlock";
import {showServerMessage} from "@common/utils";

const Signup = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    return (
        <div className="signup-container">
            <Header />
            <SignupBlock />
            <Footer />
        </div>
    );
}

export default Signup;
