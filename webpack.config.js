var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: __dirname,
    entry: './src/app.js',
    devtool: 'source-map',
    output: {
        path: __dirname + '/build',
        filename: 'app.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    stage: 2
                }
            },
            {
                test: /\.scss$/,
                loader: "style!css!sass"
            },
        ]
    },
    plugins: [
/*
        new webpack.DefinePlugin({
            NODE_ENV: 'production',
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
*/
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),
    ],
    devServer: {
        contentBase: './src',
        progress: true,
        colors: true,
        port: 8081,
        inline: true,
    }
};
