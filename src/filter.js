const axios = require("axios").default;

// const main = async () => {
//   for (let index = 0; index < 100; index++) {
//     axios
//       .post("https://www.binance.com/bapi/nft/v1/friendly/nft/product-list", {
//         currency: "BUSD",
//         mediaType: "",
//         tradeType: 0,
//         amountFrom: "",
//         amountTo: "",
//         categorys: [],
//         keyword: "",
//         orderBy: "favorites",
//         orderType: 1,
//         page: index + 1,
//         rows: 100,
//         productIds: [],
//       })
//       .then(({ data: { data } }) => {
//         const filtered = data.rows
//           .map((row) => {
//             const diff = row.setStartTime - Date.now();
//             if (diff > 0 && diff < 1000 * 60 * 60 * 5) {
//               return `https://www.binance.com/uk-UA/nft/goods/detail?productId=${row.productId}&isProduct=1`;
//             }
//           })
//           .filter((row) => row);

//         console.table(filtered);
//       });
//   }
// };

const main = async () => {
  for (let index = 0; index < 50; index++) {
    axios
      .post(
        "https://www.binance.com/bapi/nft/v1/friendly/nft/layer-product-list",
        {
          reSale: "",
          tradeType: "",
          currency: "BUSD",
          amountFrom: "140",
          amountTo: "",
          keyword: "",
          orderBy: "list_time",
          orderType: -1,
          page: 1,
          rows: 100,
          collectionId: "523778886900232193",
        }
      )
      .then(({ data: { data } }) => {
        const filtered = data.rows
          .map((data) => {
            if (data.favorites === 1) {
              console.log(
                `https://www.binance.com/uk-UA/nft/goods/detail?productId=${data.productId}&isProduct=1`
              );
            }
          })
          .filter((row) => row);
      });
  }
};

main();
