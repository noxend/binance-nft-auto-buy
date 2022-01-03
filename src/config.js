require("dotenv").config();

const config = {
	GOOGLE_KEY: "6LeUPckbAAAAAIX0YxfqgiXvD3EOXSeuq0OpO8u_",
	TWO_CAPTCHA_KEY: "547f077bae7fd0fd67474d93b85c2636",
	NFT_ID: process.env.NFT_ID,
	COUNT_REQUESTS: 5,
};

module.exports = config;
