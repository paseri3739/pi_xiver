const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    mode: "development",
    entry: "./src/main.ts", // TypeScript のエントリーポイント
    target: "node", // Node.js 用
    externals: [nodeExternals()], // node_modules のライブラリをバンドル対象から除外
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        devtoolModuleFilenameTemplate: "[absolute-resource-path]", // ソースマップの解決を正しくする
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: "ts-loader",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    devtool: "source-map", // デバッグ用に Source Map を有効化
};
