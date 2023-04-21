// import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, Wallet } from "ethers";
import { BUNDLE_EXECUTOR_ABI } from "./abi";
import { UniswappyV2EthPair, GroupedMarkets } from "./UniswappyV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
// import { Arbitrage } from "./Arbitrage";
import { get } from "https"
import { getDefaultRelaySigningKey } from "./utils";
import stablecoinsList from './data/stablecoins.json';
import { wethData, stablecoinAddressesData, StablecoinAddresses } from './data/stablecoinsdata';
import { buildStablecoinDataFile } from './buildStablesFile';
import { performance } from 'perf_hooks';

const pairs = require('./data/pairs.json');
const { FindArb, convertLiquidityPool } = require('./FindArb.js');

// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://eth-goerli.g.alchemy.com/v2/2I4tGEHZgeRbdF0TyOKx-c9H_824BAJk"
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/4D8EexfXmKF7f4rNQ0IE9SdTJDqu-Dgy"
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || ""

// const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || getDefaultRelaySigningKey();

// const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "80")

// if (PRIVATE_KEY === "") {
//   console.warn("Must provide PRIVATE_KEY environment variable")
//   process.exit(1)
// }
// if (BUNDLE_EXECUTOR_ADDRESS === "") {
//   console.warn("Must provide BUNDLE_EXECUTOR_ADDRESS environment variable. Please see README.md")
//   process.exit(1)
// }

// if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
//   console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY. Please see https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md")
//   process.exit(1)
// }

const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || ""
const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
const stablecoinAddresses = stablecoinsList.map(stablecoinAddress => stablecoinAddress.address);
let marketCheckIteration = 1;

// const arbitrageSigningWallet = new Wallet(PRIVATE_KEY);
// const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);

function healthcheck() {
  if (HEALTHCHECK_URL === "") {
    return
  }
  get(HEALTHCHECK_URL).on('error', console.error);
}

// build stablecoin data file
// buildStablecoinDataFile(stablecoinsList, BUNDLE_EXECUTOR_ABI, provider);

async function main() {
  // console.log("Searcher Wallet Address: " + await arbitrageSigningWallet.getAddress())
  // console.log("Flashbots Relay Signing Wallet Address: " + await flashbotsRelaySigningWallet.getAddress())
  // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  // const arbitrage = new Arbitrage(
  //   arbitrageSigningWallet,
  //   flashbotsProvider,
  //   new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider) )
  console.log('\nfinding your paths ...\n');
  // console.log(stablecoinAddresses);
  // console.log(stablecoinAddressesData);
  let markets: GroupedMarkets;

  try {
    markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
  } catch (error) {
    console.error(`\nError retrieving Uniswap markets...\n`);
  }

  provider.on('block', async (blockNumber) => {
    try {
      await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
      console.log(`\n************************************ ...`);
      console.log(`*** checking market iteration #${marketCheckIteration++} *** ...`);
      console.log(`************************************ ...\n`);

      // define vars for finding arbitrage pathways
      const wethDataObj = Object.values(wethData)[0];
      const wethAddress = wethDataObj.address.toLowerCase();
      let tokenIn = {
        'address': wethAddress,
        'symbol': wethDataObj.symbol,
        'decimals': wethDataObj.decimals,
      };
      let tokenOut = {
        'address': wethAddress,
        'symbol': wethDataObj.symbol,
        'decimals': wethDataObj.decimals,
      };
      const maxHops = 7;

      // get list of all stable coins
      // filter pairs for only stable coins using list for new list of stablecoin pairs
      const filteredMarketPairs = markets.allMarketPairs.filter(pool => {
        const poolTokens = pool["_tokens"].map(token => token.toLowerCase());

        if (poolTokens[0].toLowerCase() === wethAddress) {
          return !!stablecoinAddressesData[poolTokens[1].toLowerCase()];
        } else if (poolTokens[1].toLowerCase() === wethAddress) {
          return !!stablecoinAddressesData[poolTokens[0].toLowerCase()];
        } else {
          return false;
        }
      });
      
      // in FindArb convert each pair object to the one expected by FindArb
      console.log(`filteredMarketPairs length: ${filteredMarketPairs.length}\n`);
  
      const convertedFilteredMarketPairs = filteredMarketPairs.map(convertLiquidityPool);
      let startFindArb = performance.now();
      let bestTrades = await FindArb(convertedFilteredMarketPairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5);
      // let bestTrades = await FindArb(pairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5);
      let finishFindArb = performance.now();
      const totalTimeFindArb = (finishFindArb - startFindArb) / 1000;
      if (totalTimeFindArb >= 60) {
        const minutes = Math.floor(totalTimeFindArb / 60);
        const seconds = (totalTimeFindArb % 60).toFixed(2);
        console.log(`\nThe asynchronous call took ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} seconds to complete.\n`);
      } else {
        console.log(`\nThe asynchronous call took ${totalTimeFindArb.toFixed(2)} seconds to complete.\n`);
      }

      console.log('\x1b[32m%s\x1b[0m', '\n*************************');
      console.log('\x1b[32m%s\x1b[0m', '**       SUCCESS       **');
      console.log('\x1b[32m%s\x1b[0m', '*************************');
      console.log('bestTrades: ')
      console.log(bestTrades);
      bestTrades.map((trade: any) => console.table(trade.route));
    } catch (error) { 
      console.log('\x1b[31m%s\x1b[0m', '\n*************************');
      console.log('\x1b[31m%s\x1b[0m', '**        ERROR        **');
      console.log('\x1b[31m%s\x1b[0m', '*************************');
      console.error(`\nError during updateReserves ...\n`);
      console.error(`error: ${(error as any)}\n`);
      console.error(`trying again ...\n`);
    }

    // const filteredData = filterByAddress(data, addressesToFilterBy);

    // const bestCrossedMarkets = await arbitrage.evaluateMarkets(markets.marketsByToken);
    // if (bestCrossedMarkets.length === 0) {
    //   console.log("No crossed markets")
    //   return
    // }
    // bestCrossedMarkets.forEach(Arbitrage.printCrossedMarket);
    // arbitrage.takeCrossedMarkets(bestCrossedMarkets, blockNumber, MINER_REWARD_PERCENTAGE).then(healthcheck).catch(console.error)
  })
}

main();
