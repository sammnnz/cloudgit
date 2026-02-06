import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Navbar from "@/components/welcome/Navbar";
import WelcomeBlock from "@/components/welcome/WelcomeBlock";
import Footer from "@/components/Footer";

const Welcome = () => {
    const data = useLoaderData();

    return (
        <div className="welcome-container">
            <Header/>
            <Navbar/>
            <WelcomeBlock/>
            <Footer/>
        </div>
    );
}

export default Welcome;
