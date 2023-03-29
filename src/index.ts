// import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, Wallet } from "ethers";
// import { BUNDLE_EXECUTOR_ABI } from "./abi";
import { UniswappyV2EthPair, GroupedMarkets } from "./UniswappyV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
// import { Arbitrage } from "./Arbitrage";
import { get } from "https"
import { getDefaultRelaySigningKey } from "./utils";
// import * as stablecoinAddressesData from './data/stablecoins.json';
import stablecoinAddressesData from './data/stablecoins.json';
const pairs = require('./data/pairs.json');
const { helloworld } = require('./helloworld.js');
const { FindArb } = require('./FindArb.js');

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
const stablecoinAddresses = stablecoinAddressesData.map(stablecoinAddress => stablecoinAddress.address);
let marketCheckIteration = 1;

const usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
let tokenIn = {
  'address': usdt,
  'symbol': 'USDT',
  'decimal': 6,
};
let tokenOut = {
  'address': usdt,
  'symbol': 'USDT',
  'decimal': 6,
};
const maxHops = 5

// const arbitrageSigningWallet = new Wallet(PRIVATE_KEY);
// const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);

type Address = string;
type Symbol = string;

interface ObjectWithAddress {
  address: Address;
  symbol: Symbol;
}

function healthcheck() {
  if (HEALTHCHECK_URL === "") {
    return
  }
  get(HEALTHCHECK_URL).on('error', console.error);
}

// function filterByAddress(arr: ObjectWithAddress[], addresses: string[]): ObjectWithAddress[] {
//   const map = new Map<string, ObjectWithAddress>();
//   for (const obj of arr) {
//     map.set(obj.address, obj);
//   }
//   return addresses.map(addr => map.get(addr)).filter(Boolean) as ObjectWithAddress[];
// }

function createAddressMap(arr: ObjectWithAddress[]): Map<Address, ObjectWithAddress> {
  const map = new Map();
  for (const obj of arr) {
    map.set(obj.address, obj);
  }
  return map;
}

async function main() {
  // console.log("Searcher Wallet Address: " + await arbitrageSigningWallet.getAddress())
  // console.log("Flashbots Relay Signing Wallet Address: " + await flashbotsRelaySigningWallet.getAddress())
  // const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  // const arbitrage = new Arbitrage(
  //   arbitrageSigningWallet,
  //   flashbotsProvider,
  //   new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider) )
  console.log('running main...');
  console.log(stablecoinAddresses);
  let markets: GroupedMarkets;

  try {
    markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
  } catch (error) {
    console.error(`Error retrieving Uniswap markets...`);
  }

  provider.on('block', async (blockNumber) => {
    try {
      await UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
      console.log(`*** checking market iteration #${marketCheckIteration++}  ...`);
      console.log(JSON.stringify(markets.allMarketPairs.slice(0, 10), null, 2));
  
      // var bestTrades = findArb(data.slice(0, 100), tokenIn, tokenOut, maxHops, [], [], bestTrades, count = 5);
      // trades = findArb(pairs, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades)
      let bestTrades = await FindArb(pairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5);
      console.log(bestTrades);
    } catch (error) { 
      console.error(`Error during updateReserves, trying again...`);
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
