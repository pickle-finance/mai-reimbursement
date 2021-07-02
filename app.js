const axios = require("axios");
const BigNumber = require("bignumber.js");
const fs = require("fs");
require("dotenv").config();
const jsonexport = require("jsonexport");

const jar = "0xf12bb9dcd40201b5a110e11e38dcddf4d11e6f83";
const lpToken = "0x160532d2536175d65c03b97b0630a9802c274dad";
const strategy = "0xb35C8E85b4866422a135bFfaA46A6AAaB436CF05";

const isSameAddress = (a, b) => {
  return a.toLowerCase() === b.toLowerCase();
};

const main = async () => {
  const apiURL = `https://api.polygonscan.com/api?module=account&action=tokentx&contractAddress=${lpToken}&address=${jar}&endblock=latest&sort=asc&apikey=${process.env.APIKEY}`;
  let depositAmount = {};
  const {
    data: { result },
  } = await axios.get(apiURL);

  for (const txn of result) {
    const { from, to, value, tokenSymbol } = txn;

    if (isSameAddress(to, jar) && tokenSymbol === "UNI-V2") {
      if (!isSameAddress(from, strategy)) depositAmount[from] = new BigNumber(depositAmount[from] || 0).plus(value);
    } else if (isSameAddress(from, jar) && tokenSymbol === "UNI-V2") {
      depositAmount[to] = new BigNumber(depositAmount[to] || 0).minus(value);
    }
  }

  let count = 0;
  let output = [];
  Object.keys(depositAmount).forEach((key) => {
    if (depositAmount[key].isGreaterThan(0)) {
      output.push({
        address: key,
        amount: parseInt(depositAmount[key].multipliedBy(0.995).toFixed(0)) / 1e18,
      });
      count = new BigNumber(count).plus(parseInt(depositAmount[key].multipliedBy(0.995).toFixed(0)) / 1e18)
    }
  });
  console.log(count.toString());
  // //multisender csv
  jsonexport(output, { includeHeaders: false }, function (err, csv) {
    if (err) return console.error(err);
    fs.writeFile("output.csv", csv, "utf8", function (err) {
      if (err) {
        console.log(`Some error occured - output.csv file either not saved or corrupted file saved.`);
      } else {
        console.log(`output.csv saved!`);
      }
    });
  });
};

main();
