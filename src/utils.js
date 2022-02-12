const UserAgent = require("user-agents");

const logger = require("./logger");
const { api } = require("./constants");

const waitToTime = (timestamp) =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (now >= timestamp) {
        resolve(now);
        clearInterval(interval);
      }
    });
  });

const waitToTimeSync = (timestamp) => {
  while (true) {
    const now = Date.now();

    if (now >= timestamp) {
      return now;
    }
  }
};

const wait = (ms) =>
  new Promise((r) => {
    setTimeout(() => r(), ms);
  });

const randomRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const userAgent = new UserAgent({ deviceCategory: "desktop" });

const viewportSettings = {
  width: userAgent.data.viewportWidth + Math.floor(Math.random() * 100),
  height: userAgent.data.viewportHeight + Math.floor(Math.random() * 100),
  deviceScaleFactor: 1,
  isLandscape: false,
  hasTouch: false,
  isMobile: false,
};

const createPage = async (browser) => {
  const page = await browser.newPage();

  await Promise.all([
    page.exposeFunction("wait", wait),
    page.exposeFunction("waitToTime", waitToTime),
    page.exposeFunction("waitToTimeSync", waitToTimeSync),
  ]);

  await page.setViewport(viewportSettings);

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
    // if (req.url() === api.ORDER_CREATE) {
    // }

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

  page.on("console", (msg) => {
    if (msg.text().includes("pup")) {
      console.log(msg.text());
    }
  });

  page.on("response", (res) => {
    if (res.url() === api.ORDER_CREATE) {
      res.json().then(({ success, message }) => {
        if (success) logger.info("🥳");
        else logger.warn(message);
      });
    }

    if (res.url() === api.MYSTERY_BOX_PURCHASE) {
      res.json().then(({ success, message }) => {
        if (success) logger.info("🥳");
        else logger.warn(message);
      });
    }
  });

  return page;
};

module.exports = { waitToTime, waitToTimeSync, wait, randomRange, createPage };
