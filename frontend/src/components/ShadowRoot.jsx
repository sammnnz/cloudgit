import React, { useRef } from "react";
import ReactShadowRoot from 'react-shadow-root';

export const ShadowRoot = ({ children, onload }) => {
    const img = useRef(null);

    const onError = (...args) => {
        const params = [...args];
        if (img.current) {
            params.push(img.current.parentNode);
            img.current.remove();
        }

        if (onload instanceof Function)
            onload(...params);
    }

    return (
        <div className="shadow-root">
            <ReactShadowRoot>
                <link rel="stylesheet" href="./src/styles/defaults.css"/>
                {children}
                <img ref={img} alt="" src=" " onError={onError} style={{ display: "none"}}/>
            </ReactShadowRoot>
        </div>
    );
}
