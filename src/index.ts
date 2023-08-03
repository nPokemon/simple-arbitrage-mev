// import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, utils, Wallet, BigNumber } from "ethers";
import { BUNDLE_EXECUTOR_ABI, UNISWAP_ROUTER_ABI, UNISWAP_PAIR_ABI, ERC20_ABI } from "./abi";
import { UniswappyV2EthPair, GroupedMarkets } from "./UniswappyV2EthPair";
import { FACTORY_ADDRESSES, WETH_ADDRESS, USDT_ADDRESS } from "./addresses";
import { MIN_PROFIT_USDT, IS_TEST_MODE, IS_BIGNUMBER_MODE } from "./config";
// import { Arbitrage } from "./Arbitrage";
import { get } from "https"
import { getDefaultRelaySigningKey } from "./utils";
import stablecoinsList from './data/stablecoins.json';
import { wethData, stablecoinAddressesData, StablecoinAddresses } from './data/stablecoinsdata';
import { buildStablecoinDataFile } from './buildStablesFile';
import { performance } from 'perf_hooks';
import { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Percent } from '@uniswap/sdk';
import { exit } from "process";

const { convertLiquidityPool, getArbPathsDecimals } = require('./FindArb.js');
const { getArbPathsBigNumbers } = require('./FindArbBigNumbers.js');
const getArbPaths = IS_BIGNUMBER_MODE ? getArbPathsBigNumbers : getArbPathsDecimals;

require("dotenv").config();
const fs = require('fs');
const hre = require("hardhat");
const pairs = require('./data/pairs.json');
const chainId = ChainId.MAINNET;
const ALCHEMY_RPC_URL: string = process.env.ALCHEMY_RPC_URL_MAINNET || '';
const UNISWAP_ROUTER_ADDRESS: string = process.env.UNISWAP_ROUTER_ADDRESS || '';
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || ALCHEMY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "";
const allTokens = {
  ...wethData,
  ...stablecoinAddressesData
};
const consoleColourReset = '\x1b[0m';
const consoleColourRed = '\x1b[31m';
const consoleColourGreen = '\x1b[32m';
const consoleColourYellow = '\x1b[33m';

const uniswapRouterAddress: string = process.env.UNISWAP_ROUTER_ADDRESS || '';

// console.log(`*** ${uniswapRouterAddress} ***`);

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

let provider: providers.WebSocketProvider | providers.StaticJsonRpcProvider;
if (IS_TEST_MODE) {
  provider = new hre.ethers.providers.WebSocketProvider(`ws://127.0.0.1:8545/`);
} else {
  provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
}
// const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || ""
const stablecoinAddresses = stablecoinsList.map(stablecoinAddress => stablecoinAddress.address);
const uniswapRouter = new Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, provider);

let marketCheckIteration = 1;

// const arbitrageSigningWallet = new Wallet(PRIVATE_KEY);
// const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);

async function printChainId() {
  // Compare the chain ID to known testnet IDs
  const currentChainId = await provider.getNetwork().then((network) => network.chainId);
  const chainIdStr = `chainId(${currentChainId.toString()})`;

  if (!IS_TEST_MODE && currentChainId.toString() === '1') {
    console.log(consoleColourRed, `\n[ Running on Mainnet ${chainIdStr} ]`, consoleColourReset);
  } else if (IS_TEST_MODE && currentChainId.toString() === '1') {
    console.log(consoleColourGreen, `\n[ Running local dev environment on Mainnet ${chainIdStr} ]`, consoleColourReset);
  } else if (IS_TEST_MODE && currentChainId.toString() === '31337') {
    console.log(consoleColourGreen, `\n[ Running local dev environment on ${chainIdStr} ]`, consoleColourReset);
  } else if (currentChainId.toString() === '3') {
    console.log(consoleColourYellow, `\n[ Running on Ropsten Testnet ${chainIdStr} ]`, consoleColourReset);
  } else if (currentChainId.toString() === '4') {
    console.log(consoleColourYellow, `\n[ Running on Rinkeby Testnet ${chainIdStr} ]`, consoleColourReset);
  } else if (currentChainId.toString() === '42') {
    console.log(consoleColourYellow, `\n[ Running on Kovan Testnet ${chainIdStr} ]`, consoleColourReset);
  } else if (currentChainId.toString() === '5') {
    console.log(consoleColourYellow, `\n[ Running on Goerli Testnet ${chainIdStr} ]`, consoleColourReset);
  } else {
    console.log(consoleColourYellow, `\n[ Running on an unknown network with ${chainIdStr} ]`, consoleColourReset);
  }
  console.log('\n');
}

function healthcheck() {
  if (HEALTHCHECK_URL === "") {
    return
  }
  get(HEALTHCHECK_URL).on('error', console.error);
}

async function saveTradesWithBigNumbers(bestTrades: any) {
  // Custom replacer function for JSON.stringify
  const bigNumberReplacer = (key: string, value: any) => {
    if (BigNumber.isBigNumber(value)) {
      // Convert BigNumber to its original string representation
      return value.toString();
    }
    return value; // For other types, return as is
  };
  
  // Convert the array of objects to a JSON string with custom replacer
  const jsonString = JSON.stringify(bestTrades, bigNumberReplacer, 2);
  
  // Write the JSON string to the file
  fs.writeFileSync('last-best-trades.json', jsonString);
}

// build stablecoin data file
// buildStablecoinDataFile(stablecoinsList, BUNDLE_EXECUTOR_ABI, provider);

// const getWethPriceInUsdt = async () => {
//   const amountIn = utils.parseUnits('1', 18); // 1 WETH
//   const path = ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '0xdac17f958d2ee523a2206206994597c13d831ec7']; // WETH to USDT
//   const amounts = await uniswapRouter.getAmountsOut(amountIn, path);
//   return amounts[1].toString();
// };

async function getGasPrice() {
  const gasPrice = await provider.getGasPrice();
  return gasPrice.toString();
}

const getUsdtToWethPrice = async (usdtAmount: number) => {
  const usdt = new Contract(USDT_ADDRESS, ['function decimals() view returns (uint8)'], provider);
  const usdtDecimals = await usdt.decimals();
  const weth = new Contract(WETH_ADDRESS, ['function decimals() view returns (uint8)'], provider);
  const wethDecimals = await weth.decimals();
  const amountIn = utils.parseUnits(usdtAmount.toString(), usdtDecimals);
  const amounts = await uniswapRouter.getAmountsOut(amountIn, [USDT_ADDRESS, WETH_ADDRESS]);
  const amountOut = amounts[1];
  const formattedAmountOut = utils.formatUnits(amountOut, wethDecimals);

  return formattedAmountOut;
};

printChainId();

if (IS_TEST_MODE) {
  // Read the contents of the file
  const rawData = fs.readFileSync('last-best-trades.json', 'utf-8');
  // Parse the JSON data into an array object
  const bestTrades = JSON.parse(rawData);
  bestTrades.map((trade: any) => console.table(trade.route));

  console.log('\nexiting testnet ..\n');
  exit();
}

async function main() {
  // console.log("Searcher Wallet Address: " + await arbitrageSigningWallet.getAddress())
  // console.log("Flashbots Relay Signing Wallet Address: " + await flashbotsRelaySigningWallet.getAddress())
  // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  // const arbitrage = new Arbitrage(
  //   arbitrageSigningWallet,
  //   flashbotsProvider,
  //   new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider) )
  console.log('\nfinding your paths ...\n');

  let markets: GroupedMarkets;
  const minProfitWeth = await getUsdtToWethPrice(MIN_PROFIT_USDT);
  const gasPrice = await getGasPrice();

  console.log(`${MIN_PROFIT_USDT} USDT = ${minProfitWeth} WETH`);
  console.log(`Gas Price: ${utils.formatEther(gasPrice)} ETH`);

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

      // console.log('*** markets.allMarketPairs ***');
      // console.log(markets.allMarketPairs[0].originalLP);
      // console.log(markets.marketsByToken);

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
      console.log(`block number: ${blockNumber}\n`);
      console.log(`filteredMarketPairs length: ${filteredMarketPairs.length}\n`);

      const convertedFilteredMarketPairs = filteredMarketPairs.map(convertLiquidityPool);

      // console.log('*** convertedFilteredMarketPairs ***');
      // console.log((convertedFilteredMarketPairs[0] as { originalLp: any })['originalLp']);
      
      let startFindArb = performance.now();
      const bestTrades = await getArbPaths(convertedFilteredMarketPairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5, MIN_PROFIT_USDT, minProfitWeth, gasPrice, provider);
      // let bestTrades = await FindArbRoutes(convertedFilteredMarketPairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5, MIN_PROFIT_USDT, minProfitWeth);
      // let bestTrades = await FindArbRoutes(pairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5);
      let finishFindArb = performance.now();
      const totalTimeFindArb = (finishFindArb - startFindArb) / 1000;
      if (totalTimeFindArb >= 60) {
        const minutes = Math.floor(totalTimeFindArb / 60);
        const seconds = (totalTimeFindArb % 60).toFixed(2);
        console.log(`\nThe asynchronous call took ${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} seconds to complete.\n`);
      } else {
        console.log(`\nThe asynchronous call took ${totalTimeFindArb.toFixed(2)} seconds to complete.\n`);
      }
      if (IS_BIGNUMBER_MODE) {
        saveTradesWithBigNumbers(bestTrades);
      }

      console.log('\x1b[32m%s\x1b[0m', '\n*************************');
      console.log('\x1b[32m%s\x1b[0m', '**       SUCCESS       **');
      console.log('\x1b[32m%s\x1b[0m', '*************************');

      console.log('bestTrades: ');
      console.log(bestTrades);
      bestTrades.map((trade: any) => console.table(trade.route));
      // DEBUG: PRIMARY CONSOLE DUMP
      // bestTrades.map((trade: any) => console.table(trade.calculatedRoutes));
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
