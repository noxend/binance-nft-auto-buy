const axios = require("axios").default;

const main = async () => {
  for (let index = 0; index < 100; index++) {
    axios
      .post("https://www.binance.com/bapi/nft/v1/friendly/nft/product-list", {
        currency: "BUSD",
        mediaType: "",
        tradeType: 0,
        amountFrom: "",
        amountTo: "",
        categorys: [],
        keyword: "",
        orderBy: "favorites",
        orderType: 1,
        page: index + 1,
        rows: 100,
        productIds: [],
      })
      .then(({ data: { data } }) => {
        const filtered = data.rows
          .map((row) => {
            const diff = row.setStartTime - Date.now();
            if (diff > 0 && diff < 1000 * 60 * 60 * 5) {
              return `https://www.binance.com/uk-UA/nft/goods/detail?productId=${row.productId}&isProduct=1`;
            }
          })
          .filter((row) => row);

        console.table(filtered);
      });
  }
};

main();
