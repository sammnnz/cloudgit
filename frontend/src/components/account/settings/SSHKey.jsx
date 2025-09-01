import React from "react";
import styles from "@/styles/account/settings/sshkey.module.css"
import { ShadowRoot } from "@/components/ShadowRoot";

const SSHKey = ({name, sshkey}) => {
    return (
            <ShadowRoot pureStyles={[styles]}>
                <div className="container">
                    <h2>{name}</h2>
                    <p>{sshkey}</p>
                </div>
            </ShadowRoot>
    )
}

export default SSHKey;