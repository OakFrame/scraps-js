//const ClosurePlugin = require('closure-webpack-plugin');

module.exports = {
    entry: './prepack.js',
    output: {
        library:"Scraps",
        filename: 'postpack.js'
    },
    target: "web",
    module: {
        rules: [        ],
    },

    mode:"production",
    optimization: {
        minimizer: [
         //    new ClosurePlugin({mode: 'AGGRESSIVE_BUNDLE'}, {
                // compiler flags here
                //
                // for debugging help, try these:
                //
                // formatting: 'PRETTY_PRINT'
                // debug: true,
                // renaming: false
          //  })
        ]
    }
};
