// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { IOpdsPublicationView, IOpdsResultView } from "readium-desktop/common/views/opds";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { GridView } from "readium-desktop/renderer/library/components/utils/GridView";
import { ListView } from "readium-desktop/renderer/library/components/utils/ListView";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";

import PageNavigation from "./PageNavigation";

interface IBaseProps {
    opdsPublicationView: IOpdsPublicationView[] | undefined;
    links: IOpdsResultView["links"];
    pageInfo?: IOpdsResultView["metadata"];
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class EntryPublicationList extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {
        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        return (
            <>
                {this.props.opdsPublicationView
                    ? <>
                        {displayType === DisplayType.Grid ?
                            <GridView
                                normalOrOpdsPublicationViews={this.props.opdsPublicationView}
                                isOpdsView={true}
                            /> :
                            <ListView
                                normalOrOpdsPublicationViews={this.props.opdsPublicationView}
                                isOpdsView={true}
                            />
                        }
                        <PageNavigation
                            pageLinks={this.props.links}
                            pageInfo={this.props.pageInfo}
                        />
                    </>
                    : <Loader />}
            </>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(EntryPublicationList);
