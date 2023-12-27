// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { lcpActions } from "../actions";
import { ILcpState } from "../states/lcp";

const initialState: ILcpState = {
    publicationFileLocks: {},
};

export function lcpReducer(
    state: ILcpState = initialState,
    action: lcpActions.publicationFileLock.TAction,
): ILcpState {
    switch (action.type) {
        case lcpActions.publicationFileLock.ID:
            return {
                publicationFileLocks: {
                    ...state.publicationFileLocks,
                    ...action.payload.publicationFileLocks,
                },
            };
        default:
            return state;
    }
}
