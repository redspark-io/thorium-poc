// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { PublicationView } from "readium-desktop/common/views/publication";
import AddTag from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/AddTag";
import {
    TagButton,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagButton";
import {
    TagList,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/tag/tagList";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { deleteTag } from "readium-desktop/renderer/common/logics/publicationInfos/tags/deleteTag";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { TDispatch } from "readium-desktop/typings/redux";

// Logger
const debug = debug_("readium-desktop:renderer:reader:components:dialog:publicationInfos:TagManager");
debug("tagManager");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

export class TagManager extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            newTagName: "",
        };
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const setTagsCb =
            (tagsArray: string[]) =>
                this.props.setTags(
                    this.props.pubId,
                    this.props.publication as PublicationView,
                    tagsArray,
                );

        const updateTagsCb =
            (index: number) =>
                () =>
                    deleteTag(this.props.tagArray, setTagsCb)(index);

        return (
            <div>
                <TagList tagArray={this.props.tagArray}>
                    {
                        (tag) =>
                            <TagButton
                                tag={tag}
                                __={__}
                                pubId={this.props.pubId}
                                onClickDeleteCb={updateTagsCb}
                            >
                            </TagButton>
                    }
                </TagList>
                <AddTag
                    pubId={this.props.pubId}
                    tagArray={this.props.tagArray}
                    __={__}
                    setTags={setTagsCb}
                />
            </div>
        );
    }
}

const mapStateToProps = (state: IReaderRootState) => ({
    tagArray: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication?.tags,
    pubId: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication?.identifier,
    publication: (state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader])?.publication,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    setTags: (pubId: string, publication: PublicationView, tagsName: string[]) => {
        apiDispatch(dispatch)()("publication/updateTags")(pubId, tagsName);
        dispatch(
            dialogActions.updateRequest.build<DialogTypeName.PublicationInfoLib>(
                {
                    publication: {
                        ...publication,
                        ...{
                            tags: tagsName,
                        },
                    },
                },
            ),
        );
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(TagManager));
