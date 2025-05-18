import React from "react";
import {ShadowRoot} from "@components/ShadowRoot.jsx";

const PriceCard = ({type, price, slide = false}) => {

    const typeContent = () => {
        switch (type.toLowerCase()) {
            case "free":
                return (
                    <p style={slide ? {display: "none"} : {}}>
                        For personal using and open source projects
                    </p>
                )
            default:
                return (
                    <p>
                        Sorry, this plan not allowed now
                    </p>
                )
        }
    }

    const featuresContent = () => {
        switch (type.toLowerCase()) {
            case "free":
                return (
                    <div className="features-content">
                        <p>1 GB storage</p>
                        <p>400 minutes CI/CD</p>
                        <p>Copilot support</p>
                    </div>
                )
            default:
                return (
                    <div className="features-content"></div>
                )
        }
    }

    return (
        <ShadowRoot>
            <link rel="stylesheet" href="./src/styles/pricing/price-card.css"/>
            <div className="price-card">
                <div className="container">
                    <div className="type">
                        <h1>{type}</h1>
                        {typeContent()}
                    </div>
                    <div className="price">
                        <h1>{price}</h1>
                        <p>per month</p>
                    </div>
                    <div className="features" style={slide ? {display: "none"} : {}}>
                        <h2>Features:</h2>
                        {featuresContent()}
                    </div>
                </div>
            </div>
        </ShadowRoot>
    )
}

export default PriceCard;
