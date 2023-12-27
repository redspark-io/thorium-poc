const path = require("path");

module.exports = {
    plugins: [
        require("postcss-import")({
            filter: (p) => {
                const ok = p && p.indexOf("mixin") >= 0;
                console.log("POSTCSS IMPORT? =====> ", p, ok);
                return ok;

                // console.log("POSTCSS IMPORT (skip) =====> ", p);
                // return false;
            },
        }),
        require("postcss-mixins")({
            // mixinsFiles: path.join(__dirname, "src/renderer/assets/styles", "**/*(mixin|mixins).css"),
        }),
        require("postcss-nesting")({
            // mixinsFiles: path.join(__dirname, "src/renderer/assets/styles", "**/*(mixin|mixins).css"),
        }),
        // require("postcss-preset-env")({
        //     stage: 2,
        //     browsers: "last 2 Chrome versions",
        //     // autoprefixer: false,
        //     features: {
        //         "nesting-rules": true,
        //     },
        //     // importFrom: [
        //     //     "src/renderer/assets/styles/partials/variables.css",
        //     //     "src/renderer/assets/styles/variable.css",
        //     // ],
        // }),
        // require("postcss-cssnext")({
        //     // CSS compatible with the last 4 chrome versions
        //     browsers: ["last 4 Chrome versions"],
        //     // features: {
        //     //     customProperties: {
        //     //         variables: {
        //     //             "main-color": "#4d4d4d",
        //     //             "secondary-color": "white",
        //     //             "disabled-color": "#767676",
        //     //             "color-primary": "#4d4d4d",
        //     //             "color-secondary": "#fff",
        //     //             "color-tertiary": "#67a3e0",
        //     //             "color-disabled": "#b7b7b7",
        //     //             "color-light-grey": "#f1f1f1",
        //     //             "color-medium-grey": "#e5e5e5",
        //     //             "color-accent": "rgb(0, 188, 212)",
        //     //             "color-accent-contrast": "#fff",
        //     //         },
        //     //     },
        //     // },
        // }),
    ],
};
