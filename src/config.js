require("dotenv").config();

const { modes } = require("./constants");

const config = {
  GOOGLE_KEY: "6LeUPckbAAAAAIX0YxfqgiXvD3EOXSeuq0OpO8u_",
  DELAY_BETWEN_REQUESTS: process.env.DELAY_BETWEN_REQUESTS || 10,
  COUNT_REQUESTS: process.env.COUNT_REQUESTS || 1,
  MODE: process.env.MODE || modes.MARKETPLACE,
  PRODUCT_ID: process.env.PRODUCT_ID,
  AMOUNT: process.env.AMOUNT || 1,
  PRODUCT_ID_TO_SALE: 1,
};

module.exports = config;
