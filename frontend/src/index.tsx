// import React from "react";  // react <17
import { createRoot } from "react-dom/client";
import { RouteProvider } from "@/router";
import { StoreProvider } from "@/store";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "@/styles/defaults.css";

const theme = createTheme({
    typography: {
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: '#ffffff',
                    boxShadow: 'none',
                    borderBottom: '1px solid #e0e0e0',
                },
            },
        },
    },
});

const app = document.getElementById("app");

if (!app) {
    throw new Error("No 'app' element found.");
}

const root = createRoot(app);

root.render(
    <StoreProvider>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <RouteProvider />
        </ThemeProvider>
    </StoreProvider>
);