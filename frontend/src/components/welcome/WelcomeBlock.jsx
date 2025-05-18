import React, {useState} from "react";
import PriceCard from "@/components/pricing/PriceCard"
import { ShadowRoot } from "@/components/ShadowRoot";
import Slider from "react-slick";
import {isEmailValid} from "@/common/utils";

const WelcomeBlock = () => {
    const slickSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        autoplay: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true,
        arrows: false
    };

    const [email, setEmail] = useState("");
    const onChange = (e) => {
        setEmail(e.target.value);
        if (! isEmailValid(e.target.value)) e.target.classList.add("input-error");
        else e.target.classList.remove("input-error");
    };

    const onClick = (e) => {
        if (! isEmailValid(email)) {
            e.preventDefault();
            window.location.href = `/signup`;
        }
    }

    return (
        <ShadowRoot>
            <link rel="stylesheet" href="./src/styles/welcome/welcome-block.css"/>
            <link rel="stylesheet" href="./node_modules/slick-carousel/slick/slick.css"/>
            <link rel="stylesheet" href="./node_modules/slick-carousel/slick/slick-theme.css"/>
            <div className="welcome-block">
                <div className="container">
                    <div className="content">
                        <h1>Cloud storage for <span>GIT</span> repositories.</h1>
                        <p>Explore our features and get started.</p>
                        <div className="signup-block">
                            <input aria-label=""
                                   className="input-default"
                                   value={email}
                                   type="email"
                                   onChange={onChange}
                                   placeholder="Enter email"></input>
                            <a className="button button-accent-dark sign-up-btn"
                               href={"/signup?email=" + encodeURIComponent(email)}
                               onClick={onClick}>
                                Sign up
                            </a>
                        </div>
                    </div>
                    <div className="banners">
                        <div className="slider-container">
                            <Slider {...slickSettings}>
                                <div className="banner"><PriceCard type={"Free"} price={"0"} slide={false}/></div>
                                <div className="banner"><PriceCard type={"Premium"} price={"4"} slide={false}/></div>
                                <div className="banner"><PriceCard type={"Ultimate"} price={"10"} slide={false}/></div>
                            </Slider>
                        </div>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default WelcomeBlock;
