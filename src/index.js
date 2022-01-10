const clc = require("cli-color");
const paht = require("path");
const figlet = require("figlet");
const fs = require("fs").promises;
const inquirer = require("inquirer");
const pupExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { createCursor } = require("ghost-cursor");

const logger = require("./logger");
const config = require("./config");
const { getMysteryBoxDetails, getNFTDetails, authorization } = require("./api");
const { startTimeProgressBar } = require("./test");
const { api, modes } = require("./constants");
const {
  waitToTimeSync,
  waitToTime,
  randomRange,
  createPage,
  wait,
} = require("./utils");

const isPkg = typeof process.pkg !== "undefined";

console.log(
  clc.yellow(
    figlet.textSync("Binance NFT bot by", {
      font: "Small Slant",
    })
  )
);

console.log(
  clc.red(
    figlet.textSync("NXND", {
      font: "Slant",
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
  const answers = await inquirer.prompt([
    {
      type: "list",
      choices: modes.valuesToArray(),
      default: config.MODE,
      message: "Mode",
      name: "mode",
    },
    {
      type: "input",
      message: `Please, enter product id`,
      name: "productId",
      default: "20017738",
    },
    {
      message: "Your bid",
      name: "bid",
      type: "input",
      when: ({ mode }) => mode === modes.AUCTION,
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
    const skip = ["saveToEnv", "productId"];

    const toEnvConst = (str) =>
      str.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();

    for (const key in answers) {
      if (skip.includes(key)) continue;
      content += `${toEnvConst(key)} = ${answers[key]}\n`;
    }

    await fs.writeFile("./.env", content);
  }

  console.log("\n");

  logger.info("Initialiation...");

  let nftData = {};

  const page = await createPage(browser);

  const cursor = createCursor(page);

  logger.success("Initialization completed.");

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

  await page.waitForSelector("#header_menu_ba-NFT");

  await cursor.click("#header_menu_ba-NFT");

  await page.waitForTimeout(3000);

  await page.waitForSelector(
    "body > div.css-vp41bv > div > div > div.css-zadena > button.css-qzf033"
  );
  await cursor.click(
    "body > div.css-vp41bv > div > div > div.css-zadena > button.css-qzf033"
  );

  await cursor.click('a[href="/en/nft/marketplace"]');

  await page.waitForSelector(".css-1ql2hru");

  await cursor.move(".css-1ql2hru", {
    moveDelay: randomRange(50, 100),
  });

  await page.evaluate((id) => {
    const a = document.createElement("a");

    a.setAttribute("href", `/en/nft/goods/sale/${id}`);
    a.setAttribute("data-bn-type", "text");
    a.setAttribute("class", "css-7x232n");
    a.setAttribute("id", "link");

    a.textContent = "!!!";

    const parent = document.querySelector(
      "#__APP > div > div:nth-child(1) > header > div.css-11y6cix > div > div.css-1xvga6"
    );

    parent.insertBefore(a, parent.firstChild);
  }, config.PRODUCT_ID_TO_SALE);

  await cursor.click("#link");

  await page.waitForResponse(
    "https://www.binance.com/bapi/nft/v2/public/nft/nft-trade/onsale-config"
  );

  await page.waitForSelector(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(4) > div.css-193cfqa > div.css-17fr0o"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(4) > div.css-193cfqa > div.css-17fr0o"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(8) > div.css-1hjlitu > div:nth-child(3)"
  );

  await cursor.move('div[type="img"]');

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-suffix.css-vurnku > div > div.bn-input-md.css-1vd5j1n"
  );

  await cursor.click("#ETH");

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input"
  );

  await page.type(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input",
    "0.5"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(6) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input"
  );

  await page.type(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input",
    "2"
  );

  //

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(3)"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(7)"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(1)"
  );

  //

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div.css-7y16gy > button.css-19xplxv"
  );

  await page.waitForSelector("body > div.css-vp41bv > div > svg");

  await cursor.move("body > div.css-vp41bv > div > svg");

  await cursor.move(".css-mh5cnv");

  await page.click(".css-mh5cnv");

  const response1 = await page.waitForResponse(api.PRODUCT_ONSLACE);

  const data1 = await response1.json();

  if (data1.code === "10000222") {
    logger.error("Please, restart bot and try again.");
  } else {
    logger.success("OK");
  }

  // // --------------------------------

  logger.info("Waiting for the sale to start...");

  startTimeProgressBar(nftData.startTime - 3000);

  await waitToTime(nftData.startTime - 3000);

  await page.click(".css-mh5cnv");

  const response = await page.waitForResponse(api.PRODUCT_ONSLACE);

  const data = await response.json();

  if (data.code === "10000222") {
    logger.error(data.message);
    return;
  }

  const headers = response.request().headers();

  headers["x-nft-checkbot-sitekey"] = config.GOOGLE_KEY;
  headers["x-nft-checkbot-token"] = "x-nft-checkbot-token";

  waitToTimeSync(nftData.startTime);
  logger.info("Sending requests...");

  switch (answers.mode) {
    case modes.MARKETPLACE:
      await page.evaluate(
        (_url, _data, _headers) => {
          fetch(_url, {
            body: JSON.stringify({
              amount: _data.price,
              productId: _data.productId,
              startTime: _data.startTime,
              tradeType: 0,
            }),
            method: "POST",
            headers: _headers,
          }).then((res) => res.json());
        },
        api.ORDER_CREATE,
        nftData,
        headers,
        answers
      );

      break;

    case modes.MYSTERY_BOX:
      await page.evaluate(
        async (_url, _data, _headers) => {
          fetch(_url, {
            body: JSON.stringify({ amount: 1, productId: _data.productId }),
            method: "POST",
            headers: _headers,
          }).then((res) => res.json());
        },
        api.MYSTERY_BOX_PURCHASE,
        nftData,
        headers,
        answers
      );

      break;

    case modes.AUCTION:
      await page.evaluate(
        async (_url, _body, _headers) => {
          fetch(_url, {
            body: JSON.stringify(_body),
            method: "POST",
            headers: _headers,
          }).then((res) => res.json());
        },
        api.ORDER_CREATE,
        {
          productId: nftData.productId,
          amount: answers.bid,
          userId: user.userId,
          tradeType: 1,
        },
        headers
      );

      break;

    default:
      break;
  }
});

process.on("uncaughtException", (err) => {
  logger.error(err.message);
});
