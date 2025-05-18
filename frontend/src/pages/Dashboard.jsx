import React from "react";
import {getSessionLogout} from "@api/auth";
import {useLoaderData} from "react-router";
import {showServerError} from "@common/utils.jsx";

const Dashboard = () => {
    const data = useLoaderData(),
        {session} = data;
    if (!session) showServerError();

    const onClick = async () => {
        const response = await getSessionLogout();
        if (response) {
            window.location.href = "/";
        } else {
            alert("Logout failed. Please try again.");
        }
    }

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <p>This is the home page of our application.</p>
            <button className="button button-accent" onClick={onClick}>Logout</button>
        </div>
    );
}

export default Dashboard;
