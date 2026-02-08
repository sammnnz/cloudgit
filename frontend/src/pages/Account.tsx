import {useParams, useSearchParams} from "react-router";
import Navbar from "@/components/account/NavbarMui";
import RepositoriesBlock from "@components/account/repositories/RepositoriesBlock.jsx";
import SettingsBlock from "@components/account/settings/SettingsBlock.jsx";
import ProfileBlock from "@components/account/profile/ProfileBlock.jsx"

const Account = () => {
    const {username} = useParams(),
        account = {username};

    const [searchParams] = useSearchParams(),
        tab = searchParams.get("tab");

    let Component;
    switch (tab) {
        case "repositories":
            Component = RepositoriesBlock;
            break;
        case "settings":
            Component = SettingsBlock;
            break;
        case "profile":
            Component = ProfileBlock;
            break;
    }

    return (
        <div className="account-container">
            <Navbar account={account}/>
            {Component ? <Component account={account}/> : null}
        </div>
    );
}

export default Account;
