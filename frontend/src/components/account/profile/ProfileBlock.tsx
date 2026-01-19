import React from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import AddIcon from "@mui/icons-material/Add";
import Fab from "@mui/material/Fab";
import MUIShadowProvider from "@components/MUIShadowProvider.jsx";

const ProfileBlock = ({account, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;


    return (
        <ShadowRoot pureStyles={[]}>
            <MUIShadowProvider>
                <div className="profile-block">
                    <div className="container">

                    </div>
                </div>
            </MUIShadowProvider>
        </ShadowRoot>
    );
}

export default ProfileBlock;
