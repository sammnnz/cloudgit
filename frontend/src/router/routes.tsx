import { lazyLoad } from "@/common/utils";
// TODO: turn on public/protected route
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

// Loaders
import { loader as WelcomeLoader } from "@/loaders/welcome";
import { loader as SignupLoader } from "@/loaders/signup";
import { loader as SigninLoader } from "@/loaders/signin";
import { loader as HomeLoader } from "@/loaders/home";
import { loader as AccountLoader } from "@/loaders/account";
import { loader as RepoDataLoader } from "@/loaders/repodata";


const
    App = lazyLoad(() => import("@/components/App")),
    Welcome = lazyLoad(() => import("@/pages/Welcome")),
    Signup = lazyLoad(() => import("@/pages/Signup")),
    Signin = lazyLoad(() => import("@/pages/Signin")),
    Account = lazyLoad(() => import("@/pages/Account")),
    RepoData = lazyLoad(() => import("@/pages/RepoData"));
const routes = [
    {
        Component: App,
        children: [
            // ============================
            // PUBLIC ROUTES
            // ============================
            {
                path: "/",
                element: <Welcome />,
                // element: <PublicRoute><Welcome /></PublicRoute>,
                loader: WelcomeLoader
            },
            {
                path: "/signup",
                element: <Signup />,
                // element: <PublicRoute><Signup /></PublicRoute>,
                loader: SignupLoader
            },
            {
                path: "/signin",
                element: <Signin />,
                // element: <PublicRoute><Signin /></PublicRoute>,
                loader: SigninLoader
            },
            {
                path: "/home",
                element: <Welcome />,
                // element: <PublicRoute><Welcome /></PublicRoute>,
                loader: HomeLoader
            },

            // ============================
            // PROTECTED ROUTES
            // ============================
            {
                path: "/account/:username",  // ?tab=profile    ?tab=repositories    ?tab=settings
                element: <Account />,
                // element: <ProtectedRoute><Account /></ProtectedRoute>,
                loader: AccountLoader
            },
            {
                path: "/account/:username/:reponame",  // ?tab=settings    ?tab=statistics
                element: <RepoData />,
                // element: <ProtectedRoute><RepoData /></ProtectedRoute>,
                loader: RepoDataLoader
            },
        ]
    }
]

export default routes;
