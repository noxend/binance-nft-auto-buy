require("dotenv").config();

const config = {
	GOOGLE_KEY: process.env.GOOGLE_KEY,
	TWO_CAPTCHA_KEY: process.env.TWO_CAPTCHA_KEY,
	NFT_ID: process.env.NFT_ID,
	NFT_SALE_ID: process.env.NFT_SALE_ID,
	COUNT_REQUESTS: 5,
};

module.exports = config;
