import React, {useRef} from "react";
import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Navbar from "@/components/welcome/Navbar";
import WelcomeBlock from "@/components/welcome/WelcomeBlock";
import Footer from "@/components/Footer";
import {showServerMessage} from "@common/utils.jsx";

const Welcome = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    return (
        <div className="welcome-container">
            <Header/>
            <Navbar session={session}/>
            <WelcomeBlock/>
            <Footer/>
        </div>
    );
}

export default Welcome;
