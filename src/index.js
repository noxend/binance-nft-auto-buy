require("puppeteer-extra-plugin-stealth/evasions/chrome.app");
require("puppeteer-extra-plugin-stealth/evasions/chrome.csi");
require("puppeteer-extra-plugin-stealth/evasions/chrome.loadTimes");
require("puppeteer-extra-plugin-stealth/evasions/chrome.runtime");
require("puppeteer-extra-plugin-stealth/evasions/iframe.contentWindow");
require("puppeteer-extra-plugin-stealth/evasions/media.codecs");
require("puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency");
require("puppeteer-extra-plugin-stealth/evasions/navigator.languages");
require("puppeteer-extra-plugin-stealth/evasions/navigator.permissions");
require("puppeteer-extra-plugin-stealth/evasions/navigator.plugins");
require("puppeteer-extra-plugin-stealth/evasions/navigator.vendor");
require("puppeteer-extra-plugin-stealth/evasions/navigator.webdriver");
require("puppeteer-extra-plugin-stealth/evasions/sourceurl");
require("puppeteer-extra-plugin-stealth/evasions/user-agent-override");
require("puppeteer-extra-plugin-stealth/evasions/webgl.vendor");
require("puppeteer-extra-plugin-stealth/evasions/window.outerdimensions");
require("puppeteer-extra-plugin-stealth/evasions/defaultArgs");

//

const path = require("path");
const qrcode = require("qrcode-terminal");
const pupExtra = require("puppeteer-extra");
const puppeteerAfp = require("puppeteer-afp");
const imageDataURI = require("image-data-uri");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const uaAnonimizer = require("puppeteer-extra-plugin-anonymize-ua");
const { createCursor } = require("ghost-cursor");
const UserAgent = require("user-agents");
const { Solver } = require("2captcha");

const logger = require("./logger");
const config = require("./config");
const { api, pages } = require("./constants");
const { wait, randomRange } = require("./utils");

const isPkg = typeof process.pkg !== "undefined";

const chromiumExecutablePath = isPkg
  ? pupExtra
      .executablePath()
      .replace(
        /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
        path.join(path.dirname(process.execPath), "chromium")
      )
  : pupExtra.executablePath();

const solver = new Solver(config.TWO_CAPTCHA_KEY);

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
pupExtra.use(uaAnonimizer());

const options = {
  args,
  headless: true,
  ignoreHTTPSErrors: true,
  executablePath: chromiumExecutablePath,
};

const userAgent = new UserAgent();

pupExtra.launch(options).then(async (browser) => {
  logger.info("Initialization...");

  let headers = {};
  let nftData = {};
  let captcha = [];

  const [p] = await browser.pages();

  const page = puppeteerAfp(p);

  await page.setViewport({
    width: userAgent.data.viewportWidth,
    height: userAgent.data.viewportHeight,
    deviceScaleFactor: 1,
    isLandscape: false,
    hasTouch: false,
    isMobile: false,
  });

  await page.setUserAgent(userAgent.data.userAgent);

  await page.setRequestInterception(true);

  page.on("request", (req) => {
    if (req.url() === api.CHECK) {
      headers = req.headers();
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

  // page.on("response", async (res) => {
  //   if (res.url() === api.PRODUCT_ONSLACE) {
  //     const json = await res.json();

  //     if (json.code === "10000222") {
  //       logger.error(json.message);
  //       return;
  //     }

  //     headers["x-nft-checkbot-sitekey"] = config.GOOGLE_KEY;

  //     const buyResults = await page.evaluate(
  //       (url, body, _headers, _captcha) =>
  //         new Promise(async (resolve) => {
  //           const responses = [];

  //           const wait = (ms) =>
  //             new Promise((r) => {
  //               setTimeout(() => r(), ms);
  //             });

  //           const count = Array(Number(config.COUNT_REQUESTS)).fill();

  //           for (const c of count) {
  //             fetch(url, {
  //               body: JSON.stringify(body),
  //               method: "POST",
  //               headers: {
  //                 "x-nft-checkbot-sitekey": _headers["x-nft-checkbot-sitekey"],
  //                 "device-info": _headers["device-info"],
  //                 "bnc-uuid": _headers["bnc-uuid"],
  //                 csrftoken: _headers["csrftoken"],
  //                 "x-nft-checkbot-token": _captcha[0],

  //                 "content-type": "application/json",
  //                 clienttype: "web",
  //               },
  //             }).then(async (res) => {
  //               responses.push(await res.json());
  //             });

  //             await wait(10);
  //           }

  //           setInterval(() => {
  //             if (responses.length === _captcha.length) {
  //               resolve(responses);
  //             }
  //           }, 1000);
  //         }),
  //       api.ORDER_CREATE,
  //       {
  //         amount: nftData.amount,
  //         productId: config.NFT_ID,
  //         tradeType: 0,
  //       },
  //       headers,
  //       captcha
  //     );

  //     const status = Array(buyResults).some(({ success }) => success);

  //     console.log(buyResults);

  //     logger.info("You can close the terminal.");
  //   }
  // });

  const cursor = createCursor(page);

  // ------------------------

  await authorization(page);

  nftData = await getProductDetails(page);

  logger.info("Waitin for start sale...");

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
  }, config.NFT_SALE_ID);

  // await page.screenshot({ path: "bla.png" });

  await cursor.click("#link");

  await page.waitForResponse(
    "https://www.binance.com/bapi/nft/v2/public/nft/nft-trade/onsale-config"
  );

  await page.waitForSelector(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(4) > div.css-193cfqa > div.css-17fr0o"
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(4) > div.css-193cfqa > div.css-17fr0o",
    {
      moveDelay: randomRange(500, 1000),
    }
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(8) > div.css-1hjlitu > div:nth-child(3)",
    {
      moveDelay: randomRange(500, 1000),
    }
  );

  await cursor.move('div[type="img"]', {
    moveDelay: randomRange(500, 1000),
  });

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-suffix.css-vurnku > div > div.bn-input-md.css-1vd5j1n"
  );

  await cursor.click("#ETH");

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input"
  );

  await page.type(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input",
    "0.5",
    { delay: randomRange(500, 1000) }
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(6) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input"
  );

  await page.type(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-prefix.css-vurnku > input",
    "2",
    { delay: randomRange(500, 1000) }
  );

  //

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(3)",
    { moveDelay: randomRange(500, 1000) }
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(7)",
    { moveDelay: randomRange(500, 1000) }
  );

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(12) > div.css-q2wk8b > div:nth-child(1)",
    { moveDelay: randomRange(500, 1000) }
  );

  //

  await cursor.click(
    "#__APP > div > div.css-tq0shg > main > div > div > div.css-7y16gy > button.css-19xplxv"
  );

  await page.waitForSelector("body > div.css-vp41bv > div > svg");

  await cursor.move("body > div.css-vp41bv > div > svg", {
    moveDelay: randomRange(500, 1000),
  });

  await cursor.move(".css-mh5cnv", {
    moveDelay: randomRange(500, 1000),
  });

  // // --------------------------------

  logger.info("Captcha resolving...");

  // captcha = await Promise.all(
  //   Array(1)
  //     .fill()
  //     .map(() =>
  //       solver
  //         .recaptcha(config.GOOGLE_KEY, pages.SALE(config.NFT_ID))
  //         .then(({ data }) => data)
  //         .catch(() => null)
  //     )
  // );

  await page.click(".css-mh5cnv");

  const response = await page.waitForResponse(api.PRODUCT_ONSLACE);

  console.log(await response.json());
});

const authorization = async (page) => {
  page.goto("https://accounts.binance.com/en/login");

  const qrResponse = await page.waitForResponse(
    "https://accounts.binance.com/bapi/accounts/v1/public/qrcode/login/get"
  );

  const { data: qrData } = await qrResponse.json();

  qrcode.generate(`https://www.binance.com/en/qr/${qrData}`, { small: true });

  logger.info("Please, scan the QR code to log in.");

  await page.waitForSelector("canvas");

  const dataUri = await page.evaluate(() =>
    document.querySelector("canvas").toDataURL()
  );

  // await imageDataURI.outputFile(dataUri, "qr-code.png");

  await page.waitForResponse(api.AUTH, { timeout: 60000 });

  logger.info("Authorization was successful.");
};

const getProductDetails = async (page) => {
  logger.info("Getting NFT data...");

  const data = await page.evaluate(
    async (url, nftid) => {
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ productId: nftid }),
        headers: {
          "content-type": "application/json",
        },
      });

      const { data } = await res.json();

      return data;
    },
    api.PRODUCT_DETAIL,
    config.NFT_ID
  );

  const formttedData = {
    title: data.productDetail.title,
    amount: data.productDetail.amount,
    currency: data.productDetail.currency,
  };

  console.log(formttedData);

  return formttedData;
};

process.on("uncaughtException", (err) => {
  logger.error(err.message);
});
