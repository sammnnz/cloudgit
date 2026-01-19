import React from "react";
import styles from "@/styles/actions.module.css"

export const Loading = () => {
    return (
        <div className={styles["action-data"]}>loading...</div>
    )
}

export const ServerError = () => {
    return (
        <div className={styles["action-data"]}>Server error.</div>
    )
}