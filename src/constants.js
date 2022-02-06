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
  MYSTERY_BOX_DETAIL: (productId) =>
    `https://www.binance.com/bapi/nft/v1/friendly/nft/mystery-box/detail?productId=${productId}`,
  MYSTERY_BOX_PURCHASE:
    "https://www.binance.com/bapi/nft/v1/private/nft/mystery-box/purchase",
  SIMPLE_INFO:
    "https://www.binance.com/bapi/nft/v1/private/nft/user-info/simple-info",
};

const modes = {
  MARKETPLACE: "marketplace",
  MYSTERY_BOX: "mystery-box",
  AUCTION: "auction",
};
modes.valuesToArray = () =>
  Object.values(modes).filter((value) => typeof value !== "function");

const TEST_START_TIME = Date.now() + 60000;

module.exports = { api, pages, modes, TEST_START_TIME };
