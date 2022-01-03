import ora from "ora";
import qrcode from "qrcode-terminal";
import cliSpinners from "cli-spinners";
import pupExtra from "puppeteer-extra";
import puppeteerAfp from "puppeteer-afp";
import imageDataURI from "image-data-uri";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import uaAnonimizer from "puppeteer-extra-plugin-anonymize-ua";
import { createCursor } from "ghost-cursor";
import { Solver } from "2captcha";

import config from "./config.mjs";
import { api, pages } from "./constants.mjs";

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
	defaultViewport: {
		width: 1440,
		height: 700,
	},
}

pupExtra.launch(options).then(async (browser) => {

	let headers = {};
	let nftData = {};
	let captcha = [];

	const [p] = await browser.pages();

	const page = puppeteerAfp(p);

	await page.setRequestInterception(true);


	page.on("request", (req) => {
		if (req.url() === api.CHECK) {
			headers = req.headers();
		}

		req.continue();
	});

	page.on("response", async (res) => {
		if (res.url() === api.PRODUCT_ONSLACE) {
			const json = await res.json();

			if (json.code === "10000222") {
				console.log('Ble')
				return
			}

			headers["x-nft-checkbot-sitekey"] = config.GOOGLE_KEY;

			const buyResults = await page.evaluate(
				(url, body, _headers, _captcha) => new Promise(async (resolve) => {
					const responses = []

					const awaitTimeout = (ms) =>
						new Promise((r) => {
							setTimeout(() => r(), ms);
						});

					for (const c of _captcha) {
						fetch(url, {
							body: JSON.stringify(body),
							method: "POST",
							headers: {
								"x-nft-checkbot-sitekey": _headers["x-nft-checkbot-sitekey"],
								"device-info": _headers["device-info"],
								"bnc-uuid": _headers["bnc-uuid"],
								csrftoken: _headers["csrftoken"],
								"x-nft-checkbot-token": c,

								"content-type": "application/json",
								clienttype: "web",
							},
						}).then(async (res) => {
							responses.push(await res.json())
						})

						await awaitTimeout(250)
					}

					setInterval(() => {
						if (responses.length === _captcha.length) {
							resolve(responses)
						}
					}, 1000)
				}),
				api.ORDER_CREATE,
				{
					amount: nftData.productDetail.amount,
					productId: config.NFT_ID,
					tradeType: 0,
				},
				headers,
				captcha
			);

			console.log(buyResults)
		}
	});

	const cursor = createCursor(page);

	await page.goto("https://accounts.binance.com/en/login");

	const qrResponse = await p.waitForResponse(
		"https://accounts.binance.com/bapi/accounts/v1/public/qrcode/login/get"
	);

	const { data: qrData } = await qrResponse.json();

	qrcode.generate(`https://www.binance.com/en/qr/${qrData}`, { small: true });

	let spinner = ora({
		spinner: cliSpinners.default,
		text: "Please, scan the QR code to log in.",
	}).start();

	await page.waitForSelector("canvas");

	const dataUri = await page.evaluate(() =>
		document.querySelector("canvas").toDataURL()
	);

	await imageDataURI.outputFile(dataUri, "qr-code.png");

	await page.waitForResponse(api.AUTH, { timeout: 60000 });

	spinner.succeed();

	// ------------------------

	spinner = ora("Getting NFT data.").start();

	const { data } = await page.evaluate(
		async (url, _headers, _nftid) => {
			const res = await fetch(url, {
				method: "POST",
				body: JSON.stringify({ productId: _nftid }),
				headers: {
					"content-type": "application/json",
				},
			});

			const data = await res.json();

			return data;
		},
		api.PRODUCT_DETAIL,
		headers,
		config.NFT_ID
	);

	nftData = data;

	spinner.succeed()

	spinner = ora({
		spinner: cliSpinners.default,
		text: "Initialization.",
	}).start();

	// !!!!!!!!!!!!!!!!!

	// modal
	await page.goto("https://www.binance.com/en/nft/home");

	await page.waitForSelector(".css-1utqo5w .css-qzf033");
	await cursor.click(".css-1utqo5w .css-qzf033");

	await cursor.click('a[href="/en/nft/marketplace"]');

	await page.waitForSelector(".css-1ql2hru");

	await cursor.move(".css-1ql2hru", { moveDelay: 10 });

	await page.click('a[href="/en/nft/balance"]');

	await page.waitForNavigation({ waitUntil: "domcontentloaded" });

	await page.waitForTimeout(5000)

	await page.evaluate(() => {
		const a = document.createElement("a");

		a.setAttribute("href", "/en/nft/goods/sale/2");
		a.setAttribute("data-bn-type", "text");
		a.setAttribute("class", "css-7x232n");
		a.setAttribute("id", "link");

		a.textContent = "!!!";

		const parent = document.querySelector('#__APP > div > div:nth-child(1) > header > div.css-11y6cix > div > div.css-1xvga6')

		parent.insertBefore(a, parent.firstChild)
	});

	await page.screenshot({ path: 'bla.png' })

	await cursor.click("#link");

	await page.waitForTimeout(5000);

	await cursor.click(".css-193cfqa div:nth-child(2)");

	await cursor.click(".css-193cfqa div:nth-child(1)");

	await cursor.move('div[type="img"]');

	await cursor.move(
		"#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(10) > div.css-13lidqh"
	);

	await cursor.move(
		"#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(7) > div.css-193cfqa > div.css-17fr0o"
	);

	await cursor.click(
		"#__APP > div > div.css-tq0shg > main > div > div > div:nth-child(5) > div.inputNumber.css-vurnku > div > div.bn-input-suffix.css-vurnku > div > div.bn-input-md.css-1vd5j1n"
	);

	await cursor.click("#ETH");

	await cursor.click(".inputNumber input");

	await page.type(".inputNumber input", "0.5", { delay: 12 });

	await cursor.click(".css-7y16gy .css-19xplxv");

	await page.waitForSelector(".css-mh5cnv");

	spinner.succeed();

	// --------------------------------

	spinner.start("Waiting for sale...");

	spinner.start("Preparing for sale...");

	captcha = await Promise.all(
		Array(config.COUNT_REQUESTS)
			.fill()
			.map(() =>
				solver
					.recaptcha(config.GOOGLE_KEY, pages.SALE(config.NFT_SALE_ID))
					.then(({ data }) => data)
					.catch(() => null)
			)
	);

	spinner.succeed("Preparing for sale...");

	const interval = setInterval(async () => {
		if (1641188729000 <= Date.now()) {
			clearInterval(interval);

			await cursor.click(".css-mh5cnv");
		}
	}, 1);
})
