const pages = {
	LOGIN: "https://accounts.binance.com/en/login",
	PRODUCT: (productId) =>
		`https://www.binance.com/en/nft/goods/detail?productId=${productId}&isProduct=1`,
	SALE: (productId) => `https://www.binance.com/en/nft/goods/sale/${productId}`,
};

const api = {
	AUTH: "https://www.binance.com/bapi/accounts/v1/public/authcenter/auth",
	PRODUCT_DETAIL:
		"https://www.binance.com/bapi/nft/v1/friendly/nft/nft-trade/product-detail",
	ORDER_CREATE:
		"https://www.binance.com/bapi/nft/v1/private/nft/nft-trade/order-create",
	PRODUCT_ONSLACE:
		"https://www.binance.com/bapi/nft/v1/private/nft/nft-trade/product-onsale",
	CHECK: "https://www.binance.com/bapi/nft/v1/private/nft/compliance/check",
};

module.exports = { api, pages };
