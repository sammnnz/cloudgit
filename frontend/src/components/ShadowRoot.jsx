import React, { useRef } from "react";
import ReactShadowRoot from 'react-shadow-root';
import defaults from '@/styles/defaults.module.css';

const getStyleSheets = (tables = [], pure = true) => {
    if (! (tables instanceof Array)) throw new Error("Tables must be an array.");

    if (! tables.length) tables = [];

    tables.push(defaults);
    const startKey = "_start_module",
        finishKey = "_finish_module";

    const styleSheets = [];
    let currentTable = undefined;
    for (let styleSheet of document.styleSheets) {
        if (! tables.length) break;

        for (let cssRule of styleSheet.cssRules) {
            if (currentTable) {
                if (cssRule.selectorText?.match(currentTable[startKey]))
                    throw new Error("Two equal start selectors found: " + currentTable[startKey]);

                if (cssRule.selectorText?.match(currentTable[finishKey])) currentTable = undefined;

                if (currentTable) {
                    let cssText = cssRule.cssText;
                    if (pure) {
                        for (let key in currentTable) {
                            if (cssRule.selectorText?.match(currentTable[key])) {
                                cssText = cssText.replace(currentTable[key], key);
                            }
                        }
                    }

                    styleSheets.at(-1).insertRule(cssText);
                }
            }

            let i = 0;
            for (let table of tables) {
                i += 1;
                if (! (table instanceof Object) ||
                    ! (startKey in table) ||
                    ! (finishKey in table)) continue;

                if (cssRule.selectorText?.match(table[startKey])) {
                    currentTable = table;
                    delete tables[i - 1];
                    styleSheets.push(new CSSStyleSheet());
                } else if (cssRule.selectorText?.match(table[finishKey])) {
                    console.log("Error:", styleSheet, table)
                    throw new Error("Finish selector found without start selector: " + table[finishKey]);
                }
            }
        }
    }

    return styleSheets;
}

export const ShadowRoot = ({ children, onload, linkstyles, stylesheets }) => {
    const img = useRef(null);

    const postLoad = (...args) => {
        const params = [...args];
        if (img.current) {
            params.push(img.current.parentNode);
            img.current.remove();
        }

        if (onload instanceof Function)
            onload(...params);
    }

    if (! (linkstyles instanceof Array)) linkstyles = [];

    const { constructableStylesheetsSupported } = ReactShadowRoot;
    if (! (stylesheets instanceof Array)) stylesheets = [];

    const styleSheets = [...getStyleSheets(linkstyles, true), ...stylesheets]
    return (
        <div className={defaults["shadow-root"] + " shadow-root"}>
            <ReactShadowRoot mode={'open'} stylesheets={
                constructableStylesheetsSupported ? styleSheets : []}>
                {children}
                <img ref={img} alt="" src=" " onError={postLoad} style={{ display: "none" }}/>
            </ReactShadowRoot>
        </div>
    );
}
