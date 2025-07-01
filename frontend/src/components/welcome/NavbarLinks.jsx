import React from "react";
import DropdownBar from "./DropdownBar";
import { ShadowRoot } from "@/components/ShadowRoot";
import dropdownBarCSS from "@/styles/welcome/dropdown-bar.module.css";
import navbarLinksCSS from "@/styles/welcome/navbar-links.module.css";

const NavbarLinks = () => {
    return (
        <ShadowRoot linkstyles={[dropdownBarCSS, navbarLinksCSS]}>
            {/*<link rel="stylesheet" href="./src/styles/welcome/dropdown-bar.css"/>*/}
            {/*<link rel="stylesheet" href="./src/styles/welcome/navbar-links.css"/>*/}
            <div className="container">
                <div className="links">
                    <div className="link-container">
                        <a className="link">Product</a>
                        <DropdownBar>
                        </DropdownBar>
                    </div>
                    <div className="link-container">
                        <a className="link">Platform</a>
                        <DropdownBar>
                            <a>Storage</a>
                            <a>CI/CD</a>
                            <a>CLI</a>
                        </DropdownBar>
                    </div>
                    <div className="link-container">
                        <a className="link">Pricing</a>
                        <DropdownBar>
                            <a>Free</a>
                            <a>Premium</a>
                            <a>Ultimate</a>
                        </DropdownBar>
                    </div>
                    <div className="link-container">
                        <a className="link">About</a>
                        <DropdownBar>
                        </DropdownBar>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default NavbarLinks;
