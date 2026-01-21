import { useLoaderData } from "react-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SigninBlockRedux from "@/components/signin/SigninBlockRedux";
import {showServerMessage} from "@common/utils.jsx";

const SignIn = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    return (
        <div className="signin-container">
            <Header />
            <SigninBlockRedux />
            <Footer />
        </div>
    );
}

export default SignIn;
