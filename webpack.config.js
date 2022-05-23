const path = require("path")
const HTMLWebpackPlugin = require("html-webpack-plugin")

module.exports = {
	mode: "development",
	entry: {
		index: "./src/index.js"
	},
	devtool: 'inline-source-map',
	plugins: [
		new HTMLWebpackPlugin({
			title: "Development"
		}) 
	],
	devServer: {
		static: './dist'
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		clean: true
	},
	optimization: {
		runtimeChunk: 'single'
	}
}
