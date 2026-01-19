import React from "react";
import routes from "@/router/routes";
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter(routes);

const CoreProvider = () => {
    return (
        <RouterProvider router={router}></RouterProvider>
    );
}

export default CoreProvider;
