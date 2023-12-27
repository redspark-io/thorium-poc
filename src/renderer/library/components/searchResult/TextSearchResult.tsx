// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router-dom";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/library/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { GridView } from "readium-desktop/renderer/library/components/utils/GridView";
import { ListView } from "readium-desktop/renderer/library/components/utils/ListView";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, ILibrarySearchText, IRouterLocationState, routes } from "readium-desktop/renderer/library/routing";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    publicationViews: PublicationView[] | undefined;
}

export class TextSearchResult extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            // "catalog/addEntry",
            "publication/updateTags",
        ], this.searchPublications);
    }

    public componentDidUpdate(prevProps: IProps) {

        const text = matchPath<keyof ILibrarySearchText, string>(
            routes["/library/search/text"].path,
            this.props.location.pathname,
        ).params.value;

        const prevText = matchPath<keyof ILibrarySearchText, string>(
            routes["/library/search/text"].path,
            prevProps.location.pathname,
        ).params.value;

        if (text !== prevText) {
            // Refresh searched pubs
            this.searchPublications();
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const { __ } = this.props;

        const title = matchPath<keyof ILibrarySearchText, string>(
            routes["/library/search/text"].path,
            this.props.location.pathname,
        ).params.value;

        const secondaryHeader = <Header/>;
        const breadCrumb = <BreadCrumb breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title }]}/>;

        return (
            <LibraryLayout
                title={`${__("catalog.myBooks")} / ${title}`}
                secondaryHeader={secondaryHeader}
                breadCrumb={breadCrumb}
            >
                <div>
                    {this.state.publicationViews ?
                        (displayType === DisplayType.Grid ?
                            <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                            <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>}
                </div>
            </LibraryLayout>
        );
    }

    private searchPublications = (text?: string) => {
        if (!text) {

            text = matchPath<keyof ILibrarySearchText, string>(
                routes["/library/search/text"].path,
                this.props.location.pathname,
            ).params.value;
        }
        apiAction("publication/search", text)
            .then((publicationViews) => this.setState({ publicationViews }))
            .catch((error) => console.error("Error to fetch api publication/search", error));
    };
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(TextSearchResult));
