import React, {useCallback, useRef, useState} from "react";
import {ShadowRoot} from "@/components/ShadowRoot"
import autoResizeInputCSS from "@/styles/common/auto-resize-input.module.css"

const AutoResizeInput = ({
                             cursor,
                             defaultValue,
                             displace,
                             placeholder,
                             lock,
                             styles,
                             stylesheets,
                             maxlength,
                             onchange
}) => {
    if (typeof cursor !== "boolean")
        cursor = false;

    if (typeof defaultValue !== "string")
        defaultValue = "";

    if (typeof displace !== "bigint")
        displace = 18;

    if (typeof placeholder !== "string")
        placeholder = "";

    if (typeof lock !== "boolean")
        lock = false;

    if (!(styles instanceof Array))
        styles = []

    if (!(stylesheets instanceof Array))
        stylesheets = []

    if (typeof maxlength !== "bigint" && maxlength < 0)
        maxlength = 32;

    if (typeof onchange !== "function")
        onchange = (e) => {};

    const displaceStyle = `
.cursor.displace:before {
    transform: translateX(-${displace}px);
}
`

    const getDynamicDisplaceStyle = (displace) => `
.cursor.displace:before {
    transform: translateX(-${displace}px);
}
`

    const
        [dynamicDisplaceStyle, setDynamicDisplaceStyle] = useState(displaceStyle),
        [inputValue, setInputValue] = useState(defaultValue),
        inputRef = useRef(null),
        inputBufferRef = useRef(null);

    // https://qna.habr.com/q/222136
    const autoresize = () => {
        const value = inputRef.current.value;
        inputBufferRef.current.innerHTML = value;
        if (value === "" && placeholder !== "") {
            inputBufferRef.current.innerHTML = placeholder;
            setDynamicDisplaceStyle(getDynamicDisplaceStyle(inputBufferRef.current.offsetWidth + displace));
        } else if (placeholder !== "") {
            setDynamicDisplaceStyle(getDynamicDisplaceStyle(displace));
        }

        inputRef.current.style.width = inputBufferRef.current.offsetWidth + displace + 'px';
    }

    const onInputChange = (e) => {
        onchange(e);
        setInputValue(e.target.value);
    }

    const onShadowRootLoad = () => {
        if (! lock) {
            inputRef.current.addEventListener('input', autoresize);
            autoresize();
        }
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[autoResizeInputCSS, ...styles]} stylesheets={stylesheets}>
            <style>{dynamicDisplaceStyle}</style>
            {lock ? <div className="input input-lock">{defaultValue}</div> :
                <input id="input"
                       className="input"
                       ref={inputRef}
                       aria-label=""
                       value={inputValue}
                       type="text"
                       onChange={onInputChange}
                       placeholder={placeholder}
                       maxLength={maxlength}></input>
            }
            {cursor ? <label className="cursor displace"></label> : null}
            <div ref={inputBufferRef} className="input-buffer"></div>
        </ShadowRoot>
    )
}

export default AutoResizeInput;