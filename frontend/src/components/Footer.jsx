import React from "react";
import "@/styles/footer.css";
import logo from "@/static/img/logo.svg";

const Footer = () => {
    return (
        <footer>
            <img className="logo" src={logo} alt=""/>
        </footer>
    );
}

export default Footer;
