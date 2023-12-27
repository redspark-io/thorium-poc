// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TLinkMayBeOpds } from "../type/link.type";
import { ILinkFilter } from "../type/linkFilter.interface";

export function filterRelLink(
    ln: TLinkMayBeOpds,
    filter: ILinkFilter) {

    let relFlag = false;
    if (filter.rel) {
        if (ln.Rel?.length) {
            ln.Rel.forEach((rel) => {
                if (Array.isArray(filter.rel) && filter.rel.includes(rel)) {
                    relFlag = true;
                } else if (filter.rel instanceof RegExp && filter.rel.test(rel)) {
                    relFlag = true;
                } else if (rel?.replace(/\s/g, "") === filter.rel) {
                    relFlag = true;
                }
            });
        }
    }

    return relFlag;
}

export function filterTypeLink(
    ln: TLinkMayBeOpds,
    filter: ILinkFilter) {

    let typeFlag = false;
    if (ln.TypeLink) {
        if (Array.isArray(filter.type) && filter.type.includes(ln.TypeLink)) {
            typeFlag = true;
        } else if (filter.type instanceof RegExp && filter.type.test(ln.TypeLink)) {
            typeFlag = true;
        } else if (typeof filter.type === "string") {

            // compare typeSet and filterSet
            const filterSet = new Set(filter.type.split(";"));
            const typeArray = new Set(ln.TypeLink.replace(/\s/g, "").split(";"));

            typeFlag = true;
            for (const i of filterSet) {
                if (!typeArray.has(i)) {
                    typeFlag = false;
                    break;
                }
            }
        }
    }

    return typeFlag;
}
