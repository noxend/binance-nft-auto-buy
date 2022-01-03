const webpack = require("webpack");
const path = require("path");

const WebpackObfuscator = require("webpack-obfuscator");

module.exports = {
	// plugins: [
	// 	new WebpackObfuscator({
	// 		rotateStringArray: true,
	// 	}),
	// 	new webpack.ContextReplacementPlugin(/^\/modules\/.*\/Module/),
	// ],
	entry: "./src/index.js",
	output: { filename: "index.js", path: path.resolve(__dirname, "dist") },
	target: "node",
	mode: "production",
};
