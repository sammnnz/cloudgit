import React, {useRef} from "react";
import {ShadowRoot} from "@/components/ShadowRoot";
import repoCreateFormCSS from "@/styles/account/repositories/repo-create-form.module.css"
import AutoResizeInput from "@components/common/AutoResizeInput.jsx";
import ReactShadowRoot from "react-shadow-root";
import {postRepoCreate} from "@api/repo.jsx";
import {useParams} from "react-router";
import {convertResponseData, showServerMessage} from "@common/utils.jsx";

const RepoCreateForm = ({lock = false,
                         access = 'public',
                         reponame = 'new-repo',
                         description = '',
                         href = ''}) => {
    const accessButtonRef = useRef(null),
        createButtonRef = useRef(null),
        repoNameContentRef = useRef(null),
        repoDescriptionContentRef = useRef(null),
        {username} = useParams();

    const onAccessButton = () => {
        if (accessButtonRef.current.innerHTML === 'private')
            accessButtonRef.current.innerHTML = 'public';
        else if (accessButtonRef.current.innerHTML === 'public')
            accessButtonRef.current.innerHTML = 'private';
    }

    const descriptionStyle = `
.input{
    color: var(--color-font-notimportant);
}
`
    const repoNameStyle = `
.input, .input-buffer{
    font-weight: bold;
    font-size: 16px
}
.input-lock{
    color: #000000;
}
.input-lock:hover{
    color: var(--color-base-accent);
}
`
    const { constructableStylesheetsSupported } = ReactShadowRoot,
        descriptionSheet = new CSSStyleSheet(),
        repoNameSheet = new CSSStyleSheet();
    if (constructableStylesheetsSupported) {
        descriptionSheet.replaceSync(descriptionStyle);
        repoNameSheet.replaceSync(repoNameStyle);
    }

    const onCreate = async () => {
        const repoAccess = accessButtonRef.current.innerHTML,
            repoName = repoNameContentRef
                .current.querySelector('.shadow-root').shadowRoot.querySelector('#input').value,
            repoDescription = repoDescriptionContentRef
                .current.querySelector('.shadow-root').shadowRoot.querySelector('#input').value;

        console.log(username, repoName, repoAccess, repoDescription);
        const response = await postRepoCreate(username, repoName, repoAccess, repoDescription),
            codeErrors = [404, 422],
            errorMsg = convertResponseData(response),
            status = +response?.status;

        if (200 <= status && status < 300) {
            window.location.href = `/account/${username}/${repoName}`;
            return;
        }
        else if (status === 403)
            console.warn("Warning: CSRF-Token was not received.");
        else if (codeErrors.includes(status))
            showServerMessage(response, errorMsg);
        else if (response)
            showServerMessage(response);

        createButtonRef.current.addEventListener("click", onCreate, {once: true});
    }

    const onRepoNameChange = (e) => {
        // TODO: make inputs validation
    }

    const onShadowRootLoad = () => {
        if (! lock) {
            accessButtonRef.current.addEventListener("click", onAccessButton);
            createButtonRef.current.addEventListener("click", onCreate, {once: true});
        }
    }

    return (
        <ShadowRoot onload={onShadowRootLoad} pureStyles={[repoCreateFormCSS]}>
            <div className="container">
                <div className="form">
                    <div className="content-1">
                        <div ref={repoNameContentRef} className="reponame-content">
                            <AutoResizeInput
                                cursor={!lock}
                                defaultValue={reponame}
                                placeholder={"Enter repository name"}
                                stylesheets={[repoNameSheet]}
                                lock={lock}
                                maxlength="32"
                                onchange={onRepoNameChange}
                                href={href}/>
                        </div>
                        <div className="repoaccess-content">
                            <button ref={accessButtonRef} className={lock ? "access-label-lock" : "access-label"}>{access}</button>
                        </div>
                    </div>
                    <div ref={repoDescriptionContentRef} className="content-2">
                        <AutoResizeInput
                            cursor={!lock}
                            defaultValue={description}
                            placeholder={"Enter description"}
                            stylesheets={[descriptionSheet]}
                            lock={lock}
                            maxlength="50"/>
                    </div>
                </div>
                {lock ? null : <button ref={createButtonRef}
                                       className="button button-accent-dark create-btn">Create</button>}
            </div>
        </ShadowRoot>
    )
}

export default RepoCreateForm;