import React from "react";
import { ShadowRoot } from "@components/ShadowRoot";
import NavbarLinks from "@/components/common/NavbarLinks";
import navbarCSS from "@styles/common/navbar.module.css";
import logoVariant from "@static/img/logo-variant.svg";

export const Navbar = ({links, buttons, onload, styles}) => {
    if (!(styles instanceof Array))
        styles = []
    return (
        <ShadowRoot onload={onload} pureStyles={[navbarCSS, ...styles]}>
            <div className="navbar">
                <div className="container">
                    <div className="logo">
                        <img src={logoVariant} height="16px" alt=""/>
                    </div>
                    <div className="content">
                        <NavbarLinks links={links}/>
                    </div>
                    <div className="buttons">
                        {...buttons}
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}
