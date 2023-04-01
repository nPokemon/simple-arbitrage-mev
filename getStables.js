const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://coinmarketcap.com';
const pageOnePostFix = '/view/stablecoin/';
const pageTwoPostFix = '/view/stablecoin/?page=2';
// const coinGeckoEurStables = 'https://www.coingecko.com/en/categories/eur-stablecoin';

async function scrapeContractAddresses() {
    const response = await axios.get(baseUrl + pageTwoPostFix);
    const $ = cheerio.load(response.data);

    // Find all links to coin pages and extract their href attributes
    const coins = [];

    $('tbody tr').each((i, el) => {
        const coin = $(el).find('a.cmc-link').attr('href');
        const coinSymbol = $(el).find('.coin-item-symbol').text().trim() || $(el).find('.crypto-symbol').text().trim();
        coins.push({ url: `${baseUrl}${coin}`, symbol: coinSymbol });
    });

    // Visit each coin page and extract the contract address
    const contractAddresses = {};
    console.log('retrieving stable contract addresses...');
    for (const coin of coins) {
        const response = await axios.get(coin.url);
        const $ = cheerio.load(response.data);
        const anchorElement = $('a.cmc-link:has(span.mainChainTitle:contains("Ethereum"))');
        let tokenAddress = false;

        if (anchorElement.length > 0) {
            const hrefValue = anchorElement.attr('href');
            const regExp = /\/token\/([a-z0-9]+)/i;
            const match = hrefValue.match(regExp);
            if (match !== null) {
                tokenAddress = match[1];
            }
        }

        if (tokenAddress) {
            contractAddresses[coin.symbol] = tokenAddress;
        }
    }

    return contractAddresses;
}

scrapeContractAddresses()
    .then(contractAddresses => console.log(contractAddresses))
    .catch(error => console.error(error));
