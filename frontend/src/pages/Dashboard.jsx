import React from "react";
import {getSessionLogout, postUserDelete} from "@/api/auth";
import {useLoaderData} from "react-router";
import {showServerMessage} from "@common/utils";

const Dashboard = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerMessage();

    const onLogout = async () => {
        const response = await getSessionLogout();
        if (response) {
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
        }
    }

    const onUserDelete = async () => {
        const response = await postUserDelete()
        if (response) {
            window.location.href = "/";
        } else {
            alert("Delete failed. Please try again.");
        }
    }

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <p>This is the home page of our application.</p>
            <button className="button button-accent" onClick={onLogout}>Logout</button>
            <button className="button button-accent" onClick={onUserDelete}>Delete account</button>
        </div>
    );
}

export default Dashboard;
