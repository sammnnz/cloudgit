import Header from "@/components/Header";
import Navbar from "@/components/welcome/NavbarMui";
import WelcomeBlock from "@/components/welcome/WelcomeBlock";
import Footer from "@/components/Footer";

const Welcome = () => {
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
