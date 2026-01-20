import { lazyLoad } from "@/common/utils";
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
    Account = lazyLoad(() => import("@/pages/Account.jsx")),
    RepoData = lazyLoad(() => import("@/pages/RepoData.jsx"));
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
                path: "/account/:username/:reponame",  // ?tab=settings    ?tab=statistics
                element: <RepoData />,
                loader: RepoDataLoader
            },
        ]
    }
]

export default routes;
