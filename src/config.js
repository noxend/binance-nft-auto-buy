require("dotenv").config();

const { modes } = require("./constants");

const config = {
  GOOGLE_KEY: "6LeUPckbAAAAAIX0YxfqgiXvD3EOXSeuq0OpO8u_",
  TWO_CAPTCHA_KEY: "547f077bae7fd0fd67474d93b85c2636",
  DELAY_BETWEN_REQUESTS: process.env.DELAY_BETWEN_REQUESTS || 10,
  COUNT_REQUESTS: process.env.COUNT_REQUESTS || 1,
  MODE: process.env.MODE || modes.MARKETPLACE,
  PRODUCT_ID_TO_SALE: 1,
};

module.exports = config;
