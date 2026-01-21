import React, { useRef } from "react";
import ReactShadowRoot from 'react-shadow-root';
import defaults from '@/styles/defaults.module.css';

const styleSheetsPureCache = {},
    styleSheetsNotPureCache = {};

const getStyleSheets = (tables = [], pure = true) => {
    if (! (tables instanceof Array)) throw new Error("Tables must be an array.");

    if (! tables.length) tables = [];

    tables.push(defaults);
    const startKey = "_start_module",
        finishKey = "_finish_module",
        styleSheets = [];
    let i = 0,
        length = 0;
    for (let table of tables) {
        i += 1;
        length += 1;
        if (!(table instanceof Object) ||
            !(startKey in table) ||
            !(finishKey in table)) delete tables[i - 1];
        else if (pure && (table[startKey] in styleSheetsPureCache)) {
            styleSheets.push(styleSheetsPureCache[table[startKey]]);
            delete tables[i - 1];
        }
        else if (!pure && (table[startKey] in styleSheetsNotPureCache)) {
            styleSheets.push(styleSheetsNotPureCache[table[startKey]]);
            delete tables[i - 1];
        }
        else length -= 1;
    }

    if (tables.length === length) return styleSheets;

    let currentTable = undefined;
    for (let styleSheet of document.styleSheets) {
        if (tables.length === length) break;
        
        let cssRules;
        try {
            cssRules = styleSheet.cssRules || styleSheet.rules;
            if (!cssRules) continue;
        } catch (error) {
            console.warn('Cannot access cssRules for:', styleSheet.href, error);
            continue;
        }

        for (let cssRule of cssRules) {
            if (currentTable) {
                if (cssRule.selectorText?.match(currentTable[startKey]))
                    throw new Error("Two equal start selectors found: " + currentTable[startKey]);

                if (cssRule.selectorText?.match(currentTable[finishKey])) {
                    if (pure) {
                        styleSheetsPureCache[currentTable[startKey]] = styleSheets.at(-1);
                    } else {
                        styleSheetsNotPureCache[currentTable[startKey]] = styleSheets.at(-1);
                    }

                    currentTable = undefined;
                }

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
                if (! table) continue;

                if (cssRule.selectorText?.match(table[startKey])) {
                    currentTable = table;
                    delete tables[i - 1];
                    length += 1;
                    styleSheets.push(new CSSStyleSheet());
                    break;
                } else if (cssRule.selectorText?.match(table[finishKey])) {
                    throw new Error("Finish selector found without start selector: " + table[finishKey]);
                }
            }
        }
    }

    return styleSheets;
}

export const ShadowRoot = ({ children, onload, nopureStyles, pureStyles, stylesheets }) => {
    const img = useRef(null);

    const afterLoad = (...args) => {
        const params = [...args];
        if (img.current) {
            params.push(img.current.parentNode);
            // img.current.remove();
        }

        if (onload instanceof Function)
            onload(...params);
    }

    if (! (nopureStyles instanceof Array)) nopureStyles = [];
    if (! (pureStyles instanceof Array)) pureStyles = [];

    const { constructableStylesheetsSupported } = ReactShadowRoot;
    if (! (stylesheets instanceof Array)) stylesheets = [];

    const styleSheets = [
        ...getStyleSheets(nopureStyles, false),
        ...getStyleSheets(pureStyles, true),
        ...stylesheets
    ];
    return (
        <div className={defaults["shadow-root"] + " shadow-root"}>
            <ReactShadowRoot mode={'open'} stylesheets={
                constructableStylesheetsSupported ? styleSheets : []}>
                {children}
                <img ref={img} alt="" src=" " onError={afterLoad} style={{ display: "none" }}/>
            </ReactShadowRoot>
        </div>
    );
}
