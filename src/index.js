const axios = require("axios").default;
const path = require("path");
const clear = require("clear");
const figlet = require("figlet");
const clc = require("cli-color");
const fs = require("fs").promises;
const inquirer = require("inquirer");
const pupExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { createCursor } = require("ghost-cursor");

const logger = require("./logger");
const config = require("./config");
const startTimeProgressBar = require("./progress-bar");
const { getMysteryBoxDetails, getNFTDetails, authorization } = require("./api");
const { api, modes } = require("./constants");
const {
  waitToTimeSync,
  waitToTime,
  randomRange,
  createPage,
} = require("./utils");

const isPkg = typeof process.pkg !== "undefined";

clear();

console.log(
  clc.cyan(
    figlet.textSync("Binance NFT bot", {
      font: "Small Slant",
    })
  )
);

const chromiumExecutablePath = isPkg
  ? pupExtra
      .executablePath()
      .replace(
        /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
        path.join(path.dirname(process.execPath), "chromium")
      )
  : pupExtra.executablePath();

const args = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-infobars",
  "--window-position=0,0",
  "--ignore-certifcate-errors",
  "--ignore-certifcate-errors-spki-list",
  '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
];

pupExtra.use(StealthPlugin());

const options = {
  args,
  headless: true,
  ignoreHTTPSErrors: true,
  executablePath: chromiumExecutablePath,
};

pupExtra.launch(options).then(async (browser) => {
  console.log();

  const futureMysteryBoxes = (
    await axios.get(
      "https://www.binance.com/bapi/nft/v1/public/nft/mystery-box/list?page=1&size=10"
    )
  ).data.data
    .slice(0, 10)
    .filter(({ startTime }) => startTime > Date.now());

  const answers = await inquirer.prompt([
    {
      type: "list",
      choices: modes.valuesToArray(),
      default: config.MODE,
      message: "Mode",
      name: "mode",
    },
    {
      choices: futureMysteryBoxes.map(
        ({ productId, name, currency, price }) => ({
          value: productId,
          name: `${name} (${price} ${currency})`,
        })
      ),
      message: "Select mystery box",
      name: "productId",
      type: "list",
      when: ({ mode }) => mode === modes.MYSTERY_BOX,
    },
    {
      when: ({ productId }) => !productId,
      type: "input",
      message: "Please, enter product id",
      name: "productId",
      default: config.PRODUCT_ID,
    },
    {
      message: "Your bid",
      name: "bid",
      type: "number",
      when: ({ mode }) => mode === modes.AUCTION,
    },
    {
      message: "Amount",
      name: "amount",
      type: "number",
      default: config.AMOUNT,
      when: ({ mode }) => mode === modes.MYSTERY_BOX,
    },
    {
      message: "Save your settings?",
      name: "saveToEnv",
      type: "confirm",
      default: false,
    },
  ]);

  if (answers.saveToEnv) {
    let content = "";
    const skip = ["saveToEnv"];

    const toEnvConst = (str) =>
      str.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();

    for (const key in answers) {
      if (skip.includes(key)) continue;
      content += `${toEnvConst(key)} = ${answers[key]}\n`;
    }

    await fs.writeFile("./.env", content);
  }

  console.log("\n");

  let nftData = {};

  const page = await createPage(browser);

  const cursor = createCursor(page);

  // ------------------------

  const user = await authorization(page);

  switch (answers.mode) {
    case modes.AUCTION:
    case modes.MARKETPLACE:
      nftData = await getNFTDetails(answers.productId);
      break;

    case modes.MYSTERY_BOX:
      nftData = await getMysteryBoxDetails(answers.productId);
      break;

    default:
      break;
  }

  logger.info("Bypass captcha...");

  await page.goto(
    `https://www.binance.com/en/nft/goods/sale/${config.PRODUCT_ID_TO_SALE}`
  );

  await page.waitForSelector("body > div.css-vp41bv");

  await cursor.click(
    "body > div.css-vp41bv > div > div > div.css-zadena > button.css-lolz04"
  );

  await page.type(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input",
    "999"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div.css-7y16gy > button.css-wfo2sb"
  );

  await page.waitForSelector("body > div.css-vp41bv > div > div > h5");

  await page.click(
    "body > div.css-vp41bv > div > div > div.css-sr9689 > button.css-1hqz9c5"
  );

  const response1 = await page.waitForResponse(api.PRODUCT_ONSLACE);

  const data1 = await response1.json();

  if (data1.code === "10000222") {
    logger.error("Please, restart bot and try again.");
    return;
  } else {
    logger.info("OK");
  }

  // // --------------------------------

  logger.info("Waiting for the sale to start...");

  switch (answers.mode) {
    case modes.MARKETPLACE:
      await makePurchase(page, {
        url: api.ORDER_CREATE,
        triggerTime: nftData.startTime,
        body: {
          amount: nftData.price,
          productId: nftData.productId,
          tradeType: 0,
        },
      });

      break;

    case modes.MYSTERY_BOX:
      await makePurchase(page, {
        url: api.MYSTERY_BOX_PURCHASE,
        triggerTime: nftData.startTime,
        timeOffset: -50,
        body: { number: answers.amount, productId: nftData.productId },
      });

      break;

    case modes.AUCTION:
      await makePurchase(page, {
        url: api.ORDER_CREATE,
        triggerTime: nftData.endTime,
        timeOffset: -2000,
        body: {
          productId: nftData.productId,
          amount: answers.bid,
          userId: user.userId,
          tradeType: 1,
        },
      });

      break;

    default:
      break;
  }
});

const makePurchase = async (
  page,
  { url, triggerTime, body, timeOffset = 0 }
) => {
  startTimeProgressBar(triggerTime + timeOffset + -3000);

  await waitToTime(triggerTime + timeOffset + -3000);

  await page.click(
    "body > div.css-vp41bv > div > div > div.css-sr9689 > button.css-1hqz9c5"
  );

  const response = await page.waitForResponse(api.PRODUCT_ONSLACE);
  const headers = response.request().headers();

  headers["x-nft-checkbot-sitekey"] = config.GOOGLE_KEY;
  headers["x-nft-checkbot-token"] = "x-nft-checkbot-token";

  waitToTimeSync(triggerTime + timeOffset);

  return page.evaluate(
    ({ url, body, headers }) => {
      fetch(url, {
        body: JSON.stringify(body),
        method: "POST",
        headers,
      }).then((res) => res.json());
    },
    { url, body, headers }
  );
};

process.on("uncaughtException", (err) => {
  logger.error(err.message);
});
