import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SigninBlock from "@/components/signin/SigninBlock";
import {showServerMessage} from "@common/utils.jsx";

const SignIn = () => {
    const data = useLoaderData();

    return (
        <div className="signin-container">
            <Header />
            <SigninBlock />
            <Footer />
        </div>
    );
}

export default SignIn;
