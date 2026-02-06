import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignupBlock from "@/components/signup/SignupBlock";

const Signup = () => {
    const data = useLoaderData();

    return (
        <div className="signup-container">
            <Header />
            <SignupBlock />
            <Footer />
        </div>
    );
}

export default Signup;
