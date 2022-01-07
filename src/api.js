const axios = require("axios").default;
const qrcode = require("qrcode-terminal");
const imageDataURI = require("image-data-uri");

const logger = require("./logger");
const { api, pages } = require("./constants");

const getMysteryBoxDetails = async (productId) => {
  const {
    data: { data },
  } = await axios.get(api.MYSTERY_BOX_DETAIL(productId));

  const formttedData = {
    name: data.name,
    price: data.price,
    currency: data.currency,
    startTime: data.startTime,
    productId: data.productId,
  };

  console.table(formttedData);

  return formttedData;
};

const getNFTDetails = async (productId) => {
  const {
    data: { data },
  } = await axios.post(api.PRODUCT_DETAIL, { productId });

  const formttedData = {
    title: data.productDetail.title,
    productId: data.productDetail.id,
    price: data.productDetail.amount,
    currency: data.productDetail.currency,
    startTime: data.productDetail.setStartTime,
  };

  console.table(formttedData);

  return formttedData;
};

const authorization = async (page) => {
  page.goto(pages.LOGIN);

  const qrResponse = await page.waitForResponse(
    "https://accounts.binance.com/bapi/accounts/v1/public/qrcode/login/get"
  );

  const { data } = await qrResponse.json();

  qrcode.generate(`https://www.binance.com/en/qr/${data}`, { small: true });

  logger.info("Please, scan the QR code to log in.");

  await page.waitForSelector("canvas");

  const dataUri = await page.evaluate(() =>
    document.querySelector("canvas").toDataURL()
  );

  await imageDataURI.outputFile(dataUri, "qr-code.png");

  await page.waitForResponse(api.AUTH, { timeout: 120000 });

  logger.success("Authorization was successful.");
};

module.exports = { getMysteryBoxDetails, getNFTDetails, authorization };
