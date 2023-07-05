// import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, utils, Wallet, BigNumber } from "ethers";
import { BUNDLE_EXECUTOR_ABI, UNISWAP_ROUTER_ABI, UNISWAP_PAIR_ABI, ERC20_ABI } from "./abi";
import { UniswappyV2EthPair, GroupedMarkets } from "./UniswappyV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
// import { Arbitrage } from "./Arbitrage";
import { get } from "https"
import { getDefaultRelaySigningKey } from "./utils";
import stablecoinsList from './data/stablecoins.json';
import { wethData, stablecoinAddressesData, StablecoinAddresses } from './data/stablecoinsdata';
import { buildStablecoinDataFile } from './buildStablesFile';
import { performance } from 'perf_hooks';
import { ALCHEMY_RPC_URL, UNISWAP_ROUTER_ADDRESS } from './constants.js';
import dotenv from 'dotenv';
import { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType, Percent } from '@uniswap/sdk';

const pairs = require('./data/pairs.json');
const { FindArbRoutes, convertLiquidityPool, getArbPaths } = require('./FindArb.js');
const chainId = ChainId.MAINNET;
dotenv.config({ path: '../../.env' });

// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
// const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://eth-goerli.g.alchemy.com/v2/2I4tGEHZgeRbdF0TyOKx-c9H_824BAJk"
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || ALCHEMY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "";
const allTokens = {
  ...wethData,
  ...stablecoinAddressesData
};

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

const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || ""
const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
const stablecoinAddresses = stablecoinsList.map(stablecoinAddress => stablecoinAddress.address);
const uniswapRouter = new Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, provider);
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
  const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
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

// const calculateGasOnRoute = async (poolAddress: string, addressFrom: string, addressTo: string, amountFrom: string, amountTo: string, gasPrice: string) => {
//   const gasLimit = 150000;
//   const amountFromNumber = parseFloat(amountFrom);
//   const amountToNumber = parseFloat(amountTo);
//   console.log('checkpoint #0');
//   const pool = new Contract(poolAddress, UNISWAP_ROUTER_ABI, provider);
//   console.log('checkpoint #3');
//   const tokenFromDecimals = allTokens[addressFrom.toLowerCase()].decimals;
//   console.log('tokenFromDecimals: ', tokenFromDecimals);
//   console.log('checkpoint #4');
//   const tokenToDecimals = allTokens[addressTo.toLowerCase()].decimals;
//   const amountFromFixed = amountFromNumber.toFixed(tokenFromDecimals);
//   const amountToixed = amountToNumber.toFixed(tokenToDecimals);
//   console.log('checkpoint #5');
//   console.log('amountFrom: ', amountFrom);
//   console.log('typeof amountFrom: ', typeof amountFrom);
//   const amountA = utils.parseUnits(amountFromFixed, tokenFromDecimals);
//   console.log('checkpoint #6');
//   const amountB = utils.parseUnits(amountToixed, tokenToDecimals);
//   console.log('checkpoint #7 --');
  
//   console.log('pool:');
//   console.log(pool);
//   console.log('amountA: ', amountA);
//   console.log('addressFrom: ', addressFrom);
//   console.log('addressTo: ', addressTo);

//   const tokenAOut = await pool.getAmountsOut(amountA, [addressFrom, addressTo]);
//   console.log('checkpoint #8');
//   const tokenBOut = await pool.getAmountsOut(amountB, [addressTo, addressFrom]);
//   console.log('checkpoint #9');
  
//   const gasEstimateA = await pool.estimateGas.swapExactTokensForTokens(amountA, tokenAOut[1], [addressFrom, addressTo], gasPrice, { gasLimit });
//   console.log('checkpoint #10');
//   const gasEstimateB = await pool.estimateGas.swapExactTokensForTokens(amountB, tokenBOut[1], [addressTo, addressFrom], gasPrice, { gasLimit });

//   const gasCost = utils.formatEther(gasEstimateA.add(gasEstimateB).mul(gasPrice));
//   return gasCost;
// };

async function estimateGasLimitForTokenSwap(
  poolAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  tokenInAmount: string,
  tokenOutAmount: string,
  gasPrice: string
) {
  const now = new Date();
  const dexRouterContract = new Contract(poolAddress, UNISWAP_ROUTER_ABI, provider);
  const deadline = now.setTime(now.getTime() + (30 * 60 * 1000));
  const tokenInSymbol = allTokens[tokenInAddress.toLowerCase()].symbol;
  const tokenOutSymbol = allTokens[tokenOutAddress.toLowerCase()].symbol;

  const tokenInAddressChecksummed = utils.getAddress(tokenInAddress);
  const tokenOutAddressChecksummed = utils.getAddress(tokenOutAddress);
    
  const tokenInDecimals = allTokens[tokenInAddress.toLowerCase()].decimals;
  const tokenOutDecimals = allTokens[tokenOutAddress.toLowerCase()].decimals;

console.log('gasPrice: ', gasPrice);

  // const tokenInAmountParsed = BigNumber.from(tokenInAmount).mul(BigNumber.from(10).pow(tokenInDecimals));
  const tokenInAmountParsed = utils.parseUnits(tokenInAmount, tokenInDecimals);
  // const tokenOutAmountParsed = BigNumber.from(tokenOutAmount).mul(BigNumber.from(10).pow(tokenOutDecimals));
  // const tokenInParsed = new BigNumber(Number(tokenInAmount).toFixed(tokenInDecimals));
  const tokenInParsed = Number(tokenInAmount).toFixed(tokenInDecimals);
  const tokenOutParsed = Number(tokenOutAmount).toFixed(tokenOutDecimals);
  const tokenIn = await Fetcher.fetchTokenData(chainId, tokenInAddressChecksummed, provider);
  const tokenOut = await Fetcher.fetchTokenData(chainId, tokenOutAddressChecksummed, provider);
  const pair = await Fetcher.fetchPairData(tokenIn, tokenOut, provider);
  const route = new Route([pair], tokenIn);
  // const trade = new Trade(route, new TokenAmount(tokenIn, tokenInAmount), TradeType.EXACT_INPUT);
  const trade = new Trade(
    route,
    new TokenAmount(tokenIn, tokenInAmountParsed.toString()),
    TradeType.EXACT_INPUT
    );

  const slippageTolerance = new Percent('90', '100');
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();
  // const amountOutMinParsed = Number(amountOutMin).toFixed(tokenOutDecimals);
  const amountOutMinParsed = utils.formatUnits(amountOutMin, tokenOutDecimals);
  // const gasPriceBig = BigNumber.from(gasPrice).mul(1000000);
  const gasPriceBig = BigNumber.from(gasPrice).mul(10).pow(11);

  console.log('slippageTolerance: ', slippageTolerance);
  console.log('tokenInParsed: ', tokenInParsed);
  console.log('amountOutMinParsed: ', amountOutMinParsed);

  // const amountOutMinParsed = Number(trade.minimumAmountOut(slippageTolerance).raw.toString()).toFixed(tokenOutDecimals);
  // const amountOutMinParsed = BigNumber.from(tokenOutAmount).mul(BigNumber.from(10).pow(tokenOutDecimals));

  // const amountOutMinParsed = Number(trade.minimumAmountOut(slippageTolerance).raw.toString()).toFixed(tokenOutDecimals);
  // const amountOutMinParsedString = amountOutMinParsed.toString(); 

  const gasLimit = await dexRouterContract.estimateGas.swapExactTokensForTokens(
    utils.parseUnits(tokenInParsed, tokenInDecimals),
    // utils.parseUnits(tokenOutParsed, tokenOutDecimals),
    utils.parseUnits(amountOutMinParsed, tokenOutDecimals),
      [
          tokenInAddress,
          tokenOutAddress
      ],
      dexRouterContract.address,
      deadline,
      {
        from: dexRouterContract.address,
        // gasLimit: 300000, // Set the desired gas limit here
        gasPrice: gasPriceBig,
        value: 0
      }
  );
  return gasLimit.toString();
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
  const minProfitUsdt = 5;
  const minProfitWeth = await getUsdtToWethPrice(minProfitUsdt);
  const gasPrice = await getGasPrice();

  console.log(`${minProfitUsdt} USDT = ${minProfitWeth} WETH`);
  console.log(`Gas Price: ${utils.formatEther(gasPrice)} ETH`);

  try {
    markets = await UniswappyV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES);
  } catch (error) {
    console.error(`\nError retrieving Uniswap markets...\n`);
  }

  // const testGasCost = await estimateGasLimitForTokenSwap(
  //   '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
  //   '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  //   '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  //   "10.079778468325394",
  //   "18710.131703823405",
  //   utils.formatEther(gasPrice)
  // );
  // console.log(`\n************************************ ...`);
  // console.log(`*** gas cost: ${testGasCost} *** ...`);
  // console.log(`************************************ ...\n`);

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
      const bestTrades = await getArbPaths(convertedFilteredMarketPairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5, minProfitUsdt, minProfitWeth, gasPrice, provider);
      // let bestTrades = await FindArbRoutes(convertedFilteredMarketPairs, tokenIn, tokenOut, maxHops, [], [tokenIn], [], 5, minProfitUsdt, minProfitWeth);
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

      console.log('\x1b[32m%s\x1b[0m', '\n*************************');
      console.log('\x1b[32m%s\x1b[0m', '**       SUCCESS       **');
      console.log('\x1b[32m%s\x1b[0m', '*************************');
      console.log('bestTrades: ')
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
