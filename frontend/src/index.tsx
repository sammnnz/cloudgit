// import React from "react";  // react <17
import { createRoot } from "react-dom/client";
import { RouteProvider } from "@/router";
import { StoreProvider } from "@/store";
import "@/styles/defaults.css";

const app = document.getElementById("app");

if (!app) {
    throw new Error("No 'app' element found.");
}

const root = createRoot(app);

root.render(
    <StoreProvider>
        <RouteProvider />
    </StoreProvider>
);