import React, {useEffect, useRef, useState} from "react";
import { ShadowRoot } from "@/components/ShadowRoot";
import settingsBlockBlockCSS from "@/styles/account/settings/settings-block.module.css";
import {postUserDelete, postUserSSHKeyAdd, postUserSSHKeyGet} from "@api/auth.jsx";
import AutoResizeInput from "@components/common/AutoResizeInput.jsx";
import {Loading, ServerError} from "@components/Actions.jsx";
import actionsCSS from "@/styles/actions.module.css"
import ReactShadowRoot from "react-shadow-root";
import {getResponseData, showServerMessage} from "@common/utils.jsx";
import SSHKey from "@/components/account/settings/SSHKey.jsx";

const NoSSHKeys = () => {
    return (
        <div className="action-data">No SSH keys yet.</div>
    )
}

const SettingsBlock = ({account, session}) => {
    const accountUsername = account.username,
        sessionUsername = session.username;

    if (sessionUsername !== accountUsername)
        throw new Error("Access denied.");

    const [sshkey, setSSHKey] = useState(""),
        addButtonRef = useRef(null),
        delButtonRef = useRef(null),
        sshKeySettingRef = useRef(null);

    const [sshKeys, setSSHKeys] = useState([]),
        [error, setError] = useState(null),
        [loading, setLoading] = useState((
            <Loading/>
        )),
        noSSHKeysError = (
            <NoSSHKeys/>
        ),
        serverError = (
            <ServerError/>
        );

    const addSSHKey = async () => {
        let keyName = sshKeySettingRef
                .current.querySelector('.shadow-root').shadowRoot.querySelector('#input').value,
            sshKey = sshKeySettingRef
                .current.querySelector('#sshkeyinput').value;
        keyName = keyName.trim().toLowerCase();
        sshKey = sshKey.trim();
        if (keyName === "" || sshKey === "") {
            alert("SSH key and key's name must be not empty.");
            if (addButtonRef.current)
                addButtonRef.current.addEventListener('click', addSSHKey, {once: true});
            return;
        }

        const response = await postUserSSHKeyAdd(accountUsername, keyName, sshKey),
            status = response?.status

        if (!status || 200 > status || status >= 300) {
            const errorMsg = getResponseData(response);
            showServerMessage(response, errorMsg);
            if (addButtonRef.current)
                addButtonRef.current.addEventListener('click', addSSHKey, {once: true});

            return;
        }

        setSSHKey("");
        if (addButtonRef.current)
            addButtonRef.current.addEventListener('click', addSSHKey, {once: true});

        await loadSSHKeys()
    }

    const userDelete = async () => {
        const response = await postUserDelete(),
            status = response?.status;
        if (200 <= status && status < 300) {
            window.location.href = "/";
        } else {
            alert("Delete failed. Please try again.");
            delButtonRef.current.addEventListener('click', userDelete, {once: true});
        }
    }

    function* getSSHKeys (keys = []) {
        for (const key of keys) {
            yield (
                <SSHKey name={key.keyname} sshkey={key.sshkey} />
            )
        }
    }

    async function loadSSHKeys () {
        const response = await postUserSSHKeyGet(accountUsername, []),
            status = response?.status;

        if (200 > status || status >= 300) {
            setLoading(null);
            setError(serverError);
            const errorMsg = getResponseData(response);
            showServerMessage(response, errorMsg);
            return
        }

        const keys = response.data;
        if (keys === null) {
            setLoading(null);
            setError(noSSHKeysError);
            return
        }

        if (!(keys instanceof Array)) {
            setLoading(null);
            setError(serverError);
            return
        }

        setLoading(null);
        setError(null);
        setSSHKeys(keys);
    }

    useEffect(() => {
        loadSSHKeys().then(() => console.log("SSH keys loaded."));
    }, [])

    const actionsStyle = `
.${actionsCSS["action-data"]}, .action-data{
    font-size: 16px !important;
}
`
    const { constructableStylesheetsSupported } = ReactShadowRoot,
        actionsSheet = new CSSStyleSheet();
    if (constructableStylesheetsSupported) {
        actionsSheet.replaceSync(actionsStyle);
    }

    const onShadowRootLoad = () => {
        if (addButtonRef.current)
            addButtonRef.current.addEventListener('click', addSSHKey, {once: true});

        if (delButtonRef.current)
            delButtonRef.current.addEventListener('click', userDelete, {once: true});
    }

    return (
        <ShadowRoot onload={onShadowRootLoad}
                    pureStyles={[actionsCSS, settingsBlockBlockCSS]}
                    nopureStyles={[actionsCSS]}
                    stylesheets={[actionsSheet]}>
            <div className="settings-block">
                <div className="container">
                    <h1 className="title">SSH Keys</h1>
                    <div ref={sshKeySettingRef} className="setting">
                        <AutoResizeInput placeholder={"enter ssh key name"} maxlength={32}
                                         cursor={true}></AutoResizeInput>
                        <textarea id="sshkeyinput"
                                  aria-label=""
                                  className="input-default sshkey-input"
                                  value={sshkey}
                                  onChange={(e) => setSSHKey(e.target.value)}
                                  placeholder="add key for SSH connection"></textarea>
                        <button ref={addButtonRef} className="button button-accent-dark sshkey-btn">Add</button>
                        <div className="sshkeys">
                            {...getSSHKeys(sshKeys)}
                            {loading}
                            {error}
                        </div>
                    </div>
                    <h1 className="title title-danger">Danger zone</h1>
                    <div className="setting">
                        <button ref={delButtonRef} className="button button-base">Delete account</button>
                    </div>
                </div>
            </div>
        </ShadowRoot>
    );
}

export default SettingsBlock;
