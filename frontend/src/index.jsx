import React from "react";
import { createRoot } from "react-dom/client";
import CoreProvider from "@/router/core";
import "@/styles/defaults.css";

const app = document.getElementById("app");
if (!app) {
    throw new Error("No 'app' element found.");
}

const root = createRoot(app);
root.render(<CoreProvider />);
