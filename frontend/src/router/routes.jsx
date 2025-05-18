import React from "react";
import { lazyLoad } from "@/common/utils";
import { loader as WelcomeLoader } from "@/api/data/welcome";
import { loader as SignupLoader } from "@/api/data/signup";
import { loader as SigninLoader } from "@/api/data/signin";
import { loader as DashboardLoader} from "@/api/data/dashboard";
import { loader as HomeLoader } from "@/api/data/home"

const
    App = lazyLoad(() => import("@/components/App")),
    Welcome = lazyLoad(() => import("@/pages/Welcome")),
    Signup = lazyLoad(() => import("@/pages/Signup")),
    Signin = lazyLoad(() => import("@/pages/SignIn")),
    Dashboard = lazyLoad(() => import("@/pages/Dashboard"));
const routes = [
    {
        Component: App,
        children: [
            {
                path: "/",
                element: <Welcome />,
                loader: WelcomeLoader
            },
            {
                path: "/signup",
                element: <Signup />,
                loader: SignupLoader
            },
            {
                path: "/signin",
                element: <Signin />,
                loader: SigninLoader
            },
            {
                path: "/dashboard",
                element: <Dashboard />,
                loader: DashboardLoader
            },
            {
                path: "/home",
                element: <Welcome />,
                loader: HomeLoader
            }
        ]
    }
]

export default routes;
