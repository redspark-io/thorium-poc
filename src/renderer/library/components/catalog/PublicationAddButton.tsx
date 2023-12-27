// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { acceptedExtensionArray, acceptedExtensionObject } from "readium-desktop/common/extension";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { TChangeEventOnInput } from "readium-desktop/typings/react";
import { Dispatch } from "redux";

import { TranslatorProps, withTranslator } from "../../../common/components/hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export class PublicationAddButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.importFile = this.importFile.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        // not necessary as input is located suitably for mouse hit testing
        // htmlFor="epubInput"
        return (
            <label
                className={classNames(stylesButtons.button_primary_small, stylesButtons.button_icon)}
            >
                <SVG ariaHidden={true} svg={PlusIcon} title={__("header.importTitle")} />
                <input
                    id="epubInput"
                    type="file"
                    aria-label={__("accessibility.importFile")}
                    onChange={this.importFile}
                    multiple
                    accept={acceptedExtensionArray.map((ext) => {
                        if (ext === acceptedExtensionObject.nccHtml) { // !ext.startsWith(".")
                            return ".html";
                        }
                        return ext;
                    }).join(", ")}
                />
            </label>
        );
    }

    private importFile(event: TChangeEventOnInput) {
        const files = event.target.files;
        const paths: string[] = [];

        for (const f of files) {
            paths.push(f.path);
        }

        event.target.value = "";
        event.target.files = null;

        this.props.import(paths);
    }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    import: apiDispatch(dispatch)()("publication/importFromFs"),
});

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationAddButton));
