import React from "react";
import "@/styles/header.css";
import logo from "@/static/img/logo.svg";

const Header = () => {
    return (
        <header>
            <img className="logo" src={logo} alt=""/>
        </header>
    );
}

export default Header;
