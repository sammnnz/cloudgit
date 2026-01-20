import routes from "@/router/routes";
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter(routes);

export const RouteProvider = () => {
    return (
        <RouterProvider router={router} />
    );
}