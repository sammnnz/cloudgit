import React from "react";
import { lazyLoad } from "@/common/utils";
import { loader as WelcomeLoader } from "@/loaders/welcome";
import { loader as SignupLoader } from "@/loaders/signup";
import { loader as SigninLoader } from "@/loaders/signin";
// import { loader as DashboardLoader} from "@/loaders/_draft/03082025/dashboard.jsx";
import { loader as HomeLoader } from "@/loaders/home";
import { loader as AccountLoader } from "@/loaders/account";
import { loader as RepoInstanceLoader } from "@/loaders/repoinstance";


const
    App = lazyLoad(() => import("@/components/App")),
    Welcome = lazyLoad(() => import("@/pages/Welcome")),
    Signup = lazyLoad(() => import("@/pages/Signup")),
    Signin = lazyLoad(() => import("@/pages/Signin")),
    // Dashboard = lazyLoad(() => import("@pages/_draft/03082025/Dashboard.jsx")),
    Account = lazyLoad(() => import("@pages/Account.jsx")),
    RepoInstance = lazyLoad(() => import("@/pages/RepoInstance"));
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
            // {
            //     path: "/dashboard",
            //     element: <Dashboard />,
            //     loader: DashboardLoader
            // },
            {
                path: "/home",
                element: <Welcome />,
                loader: HomeLoader
            },
            {
                path: "/account/:username",  // ?tab=profile    ?tab=repositories    ?tab=settings
                element: <Account />,
                loader: AccountLoader
            },
            {
                path: "/account/:username/:reponame",
                element: <RepoInstance />,
                loader: RepoInstanceLoader
            },
        ]
    }
]

export default routes;
