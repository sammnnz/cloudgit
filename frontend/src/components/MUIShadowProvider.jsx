import React, {useEffect, useRef, useState} from "react";
import {createTheme, ThemeProvider} from "@mui/material";
import {CacheProvider} from "@emotion/react";
import createCache from '@emotion/cache';

const MUIShadowProvider = ({children, autoTheme = false}) => {
    const containerRef = useRef(null),
        [cache, setCache] = useState(null),
        [theme, setTheme] = useState(null);

    useEffect(() => {
        if (! containerRef?.current)
            return;

        setCache(getCache(containerRef.current));
        if (autoTheme)
            setTheme(getTheme(containerRef.current));
    }, [containerRef]);

    const getCache = (shadowContainer) => {
        return createCache({
            key: 'css',
            prepend: true,
            container: shadowContainer,
        });
    }

    const getTheme = (shadowContainer) => {
        return createTheme({
            cssVariables: {
                rootSelector: ':host',
                colorSchemeSelector: 'class',
            },
            components: {
                MuiPopover: {
                  defaultProps: {
                    container: shadowContainer,
                  },
                },
                MuiPopper: {
                  defaultProps: {
                    container: shadowContainer,
                  },
                },
                MuiModal: {
                  defaultProps: {
                    container: shadowContainer,
                  },
                }
            },
        });
    }

    return (
        <div ref={containerRef}>
            {cache ?
                <CacheProvider value={cache}>
                    {theme ?
                        <ThemeProvider theme={theme} colorSchemeNode={containerRef.current}>
                            {children}
                        </ThemeProvider>
                        : children
                    }
                </CacheProvider>
                : null
            }
        </div>
    )
}

export default MUIShadowProvider;