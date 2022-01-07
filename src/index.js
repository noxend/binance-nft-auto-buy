const clc = require("cli-color");
const axios = require("axios").default;

const figlet = require("figlet");
const fs = require("fs").promises;
const inquirer = require("inquirer");
const UserAgent = require("user-agents");
const pupExtra = require("puppeteer-extra");
const puppeteerAfp = require("puppeteer-afp");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const { createCursor } = require("ghost-cursor");

const logger = require("./logger");
const config = require("./config");
const { getMysteryBoxDetails, getNFTDetails, authorization } = require("./api");
const { waitToTime, randomRange, wait, waitToTimeSync } = require("./utils");
const { startTimeProgressBar } = require("./test");
const { api, modes } = require("./constants");

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

pupExtra.use(AdblockerPlugin({ blockTrackers: true }));
pupExtra.use(StealthPlugin());

const options = {
  args,
  headless: true,
  ignoreHTTPSErrors: true,
  executablePath: chromiumExecutablePath,
};

const userAgent = new UserAgent({ deviceCategory: "desktop" });

pupExtra.launch(options).then(async (browser) => {
  const answers = await inquirer.prompt([
    {
      type: "number",
      default: Number(config.COUNT_REQUESTS),
      message: "Count requests",
      name: "countRequests",
    },
    {
      type: "number",
      default: Number(config.DELAY_BETWEN_REQUESTS),
      message: "Delay between requests (ms)",
      name: "delayBetweenRequests",
    },
    {
      type: "list",
      choices: modes.valuesToArray(),
      default: config.MODE,
      message: "Mode",
      name: "mode",
    },
    {
      type: "input",
      message: `Please, enter product id (use comma for multiple choice)`,
      name: "productIds",
      default: "20017738",
      filter: (values) => {
        return values.split(",");
      },
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
    const skip = ["saveToEnv", "productIds"];

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

  let headers = {};
  let nftData = {};

  const [p] = await browser.pages();

  const page = puppeteerAfp(p);

  await page.exposeFunction("wait", wait);
  await page.exposeFunction("waitToTime", waitToTime);
  await page.exposeFunction("waitToTimeSync", waitToTimeSync);

  await page.setViewport({
    width: userAgent.data.viewportWidth + Math.floor(Math.random() * 100),
    height: userAgent.data.viewportHeight + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    isLandscape: false,
    hasTouch: false,
    isMobile: false,
  });

  await page.setUserAgent(userAgent.data.userAgent);

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  await page.evaluateOnNewDocument(() => {
    window.chrome = {
      runtime: {},
    };
  });

  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;

    return (window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters));
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5, 6, 7],
    });
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  await page.setRequestInterception(true);

  page.on("request", (req) => {
    if (req.url() === api.CHECK) {
      headers = req.headers();
    }

    if (req.url() === api.ORDER_CREATE) {
      console.log(
        Date.now() > nftData.startTime,
        Date.now() - nftData.startTime
      );
    }

    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
      return;
    }

    req.continue();
  });

  page.on("response", (res) => {
    if (res.url() === api.ORDER_CREATE) {
      res.json().then(({ success }) => {
        if (success) logger.success("🥳");
        else logger.warn(data.message);
      });
    }

    if (res.url() === api.MYSTERY_BOX_PURCHASE) {
      res.json().then((body) => {
        console.log("mystery", body);
      });
    }
  });

  const cursor = createCursor(page);

  logger.success("Initialization completed.");

  // ------------------------

  await authorization(page);

  switch (answers.mode) {
    case modes.MARKETPLACE:
      nftData = await getNFTDetails(page, answers.productIds[0]);
      break;

    case modes.MYSTERY_BOX:
      nftData = await getMysteryBoxDetails(page, answers.productIds[0]);
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

  // // --------------------------------

  logger.info("Waiting for the sale to start...");

  nftData.startTime = Date.now() + 15000;

  startTimeProgressBar(nftData.startTime - 4000);

  await waitToTime(nftData.startTime - 3000);

  await page.click(".css-mh5cnv");

  const response = await page.waitForResponse(api.PRODUCT_ONSLACE);

  const data = await response.json();
  if (data.code === "10000222") {
    logger.error(data.message);
    return;
  }

  headers["x-nft-checkbot-sitekey"] = config.GOOGLE_KEY;

  waitToTime(nftData.startTime).then(() => {
    logger.info("Sending requests...");
  });

  switch (answers.mode) {
    case modes.MARKETPLACE:
      await page.evaluate(
        async (
          _url,
          _data,
          _headers,
          { countRequests, delayBetweenRequests }
        ) => {
          waitToTimeSync(_data.startTime);

          for (const _ of Array(Number(countRequests)).fill()) {
            fetch(_url, {
              body: JSON.stringify({
                amount: _data.price,
                productId: _data.productId,
                tradeType: 0,
              }),
              method: "POST",
              headers: {
                "x-nft-checkbot-sitekey": _headers["x-nft-checkbot-sitekey"],
                "device-info": _headers["device-info"],
                "bnc-uuid": _headers["bnc-uuid"],
                csrftoken: _headers["csrftoken"],

                "x-nft-checkbot-token": "x-nft-checkbot-token",

                "content-type": "application/json",
                clienttype: "web",
              },
            }).then((res) => res.json());

            await wait(delayBetweenRequests);
          }
        },
        api.ORDER_CREATE,
        nftData,
        headers,
        answers
      );

      break;

    case modes.MYSTERY_BOX:
      await page.evaluate(
        async (
          _url,
          _data,
          _headers,
          { countRequests, delayBetweenRequests }
        ) => {
          waitToTimeSync(_data.startTime);

          for (const _ of Array(Number(countRequests)).fill()) {
            fetch(_url, {
              body: JSON.stringify({ amount: 1, productId: _data.productId }),
              method: "POST",
              headers: {
                "x-nft-checkbot-sitekey": _headers["x-nft-checkbot-sitekey"],
                "device-info": _headers["device-info"],
                "bnc-uuid": _headers["bnc-uuid"],
                csrftoken: _headers["csrftoken"],

                "x-nft-checkbot-token": "x-nft-checkbot-token",

                "content-type": "application/json",
                clienttype: "web",
              },
            }).then((res) => res.json());

            await wait(delayBetweenRequests);
          }
        },
        api.MYSTERY_BOX_PURCHASE,
        nftData,
        headers,
        answers
      );

      break;

    default:
      break;
  }
});

process.on("uncaughtException", (err) => {
  logger.error(err.message);
});
