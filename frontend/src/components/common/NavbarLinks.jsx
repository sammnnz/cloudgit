import React from "react";
import DropdownBar from "@components/common/DropdownBar.jsx";
import { ShadowRoot } from "@components/ShadowRoot.jsx";
import dropdownBarCSS from "@styles/common/dropdown-bar.module.css";
import navbarLinksCSS from "@styles/common/navbar-links.module.css";

const NavbarLinks = ({links}) => {
    function* getLinks (links, top = true) {
        for (let link in links) {
            if (typeof link !== "string")
                throw new Error("link must be a string.")

            const href = links[link]?.href,
                sublinks = links[link]?.links;
            yield (
                <div className="link-container">
                    <a href={href ? href : null} className={top ? "link" : null}>{link}</a>
                    {typeof sublinks === 'undefined' ? null :
                        <DropdownBar>
                            {...getLinks(sublinks, false)}
                        </DropdownBar>
                    }
                </div>
            )
        }
    }

    return (
        <ShadowRoot pureStyles={[dropdownBarCSS, navbarLinksCSS]}>
            <div className="container">
                <div className="links">
                    {...getLinks(links)}
                </div>
            </div>
        </ShadowRoot>
    );
}

export default NavbarLinks;
