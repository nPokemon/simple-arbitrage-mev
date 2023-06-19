const Decimal = require('decimal.js');
import { wethData, stablecoinAddressesData } from './data/stablecoinsdata';

var _pj;
const d997 = new Decimal(997);
const d1000 = new Decimal(1000);
const allTokens = {
  ...wethData,
  ...stablecoinAddressesData
};

function _pj_snippets(container) {
  function _assert(comp, msg) {
    function PJAssertionError(message) {
      this.name = "PJAssertionError";
      this.message = message || "Custom error PJAssertionError";

      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error(message).stack;
      }
    }

    PJAssertionError.prototype = Object.create(Error.prototype);
    PJAssertionError.prototype.constructor = PJAssertionError;
    msg = msg || "Assertion failed.";

    if (!comp) {
      throw new PJAssertionError(msg);
    }
  }

  container["_assert"] = _assert;
  return container;
}

_pj = {};

_pj_snippets(_pj);

function getOptimalAmount(Ea, Eb) {
  if (Ea > Eb) {
    return null;
  }

  if (!(Ea instanceof Decimal)) {
    Ea = new Decimal(Ea);
  }

  if (!(Eb instanceof Decimal)) {
    Eb = new Decimal(Eb);
  }

  return new Decimal(Number.parseInt((Decimal.sqrt(Ea * Eb * d997 * d1000) - Ea * d1000) / d997));
}

function adjustReserve(token, amount) {
  return amount;
}

function toInt(n) {
  return new Decimal(Number.parseInt(n));
}

function getAmountOut(amountIn, reserveIn, reserveOut) {
  _pj._assert(amountIn > 0, null);

  _pj._assert(reserveIn > 0 && reserveOut > 0, null);

  if (!(amountIn instanceof Decimal)) {
    amountIn = new Decimal(amountIn);
  }

  if (!(reserveIn instanceof Decimal)) {
    reserveIn = new Decimal(reserveIn);
  }

  if (!(reserveOut instanceof Decimal)) {
    reserveOut = new Decimal(reserveOut);
  }

  return d997 * amountIn * reserveOut / (d1000 * reserveIn + d997 * amountIn);
}

// getEaEb calculates the values of Ea and Eb, which are used in the previous function getAmountOut.
// 
// Ea and Eb represent the effective reserve values of the tokens being swapped, taking into account the reserves 
// of all the pairs involved in the swap. The effective reserve values are used to calculate the amount of output tokens 
// that will be received in exchange for a certain amount of input tokens.
// 
// The function takes two arguments, tokenIn and pairs. tokenIn represents the input token being swapped, and pairs is an 
// array of objects representing the pairs of tokens involved in the swap.
// 
// The function iterates through each pair in pairs and calculates the values of Ra, Rb, Rb1, and Rc, which are adjusted 
// reserve values of the tokens in the pairs. These adjusted reserve values are used to calculate the values of Ea and Eb.
// 
// The function returns an array containing the values of Ea and Eb.
function getEaEb(tokenIn, pairs) {
  var Ea, Eb, Ra, Rb, Rb1, Rc, idx, temp, tokenOut;
  Ea = null;
  Eb = null;
  idx = 0;
  tokenOut = { ...tokenIn };

  for (var pair, _pj_c = 0, _pj_a = pairs, _pj_b = _pj_a.length; _pj_c < _pj_b; _pj_c += 1) {
    pair = _pj_a[_pj_c];

    if (idx === 0) {
      if (tokenIn["address"] === pair["token0"]["address"]) {
        tokenOut = pair["token1"];
      } else {
        tokenOut = pair["token0"];
      }
    }

    if (idx === 1) {
      Ra = adjustReserve(pairs[0]["token0"], pairs[0]["reserve0"]);
      Rb = adjustReserve(pairs[0]["token1"], pairs[0]["reserve1"]);

      if (tokenIn["address"] === pairs[0]["token1"]["address"]) {
        temp = Ra;
        Ra = Rb;
        Rb = temp;
      }

      Rb1 = adjustReserve(pair["token0"], pair["reserve0"]);
      Rc = adjustReserve(pair["token1"], pair["reserve1"]);

      if (tokenOut["address"] === pair["token1"]["address"]) {
        temp = Rb1;
        Rb1 = Rc;
        Rc = temp;
        tokenOut = pair["token0"];
      } else {
        tokenOut = pair["token1"];
      }

      Ea = toInt(d1000 * Ra * Rb1 / (d1000 * Rb1 + d997 * Rb));
      Eb = toInt(d997 * Rb * Rc / (d1000 * Rb1 + d997 * Rb));
    }

    if (idx > 1) {
      Ra = Ea;
      Rb = Eb;
      Rb1 = adjustReserve(pair["token0"], pair["reserve0"]);
      Rc = adjustReserve(pair["token1"], pair["reserve1"]);

      if (tokenOut["address"] === pair["token1"]["address"]) {
        temp = Rb1;
        Rb1 = Rc;
        Rc = temp;
        tokenOut = pair["token0"];
      } else {
        tokenOut = pair["token1"];
      }

      Ea = toInt(d1000 * Ra * Rb1 / (d1000 * Rb1 + d997 * Rb));
      Eb = toInt(d997 * Rb * Rc / (d1000 * Rb1 + d997 * Rb));
    }

    idx += 1;
  }

  return [Ea, Eb];
}

function sortTrades(trades, newTrade) {
  trades.push(newTrade);
  return trades.sort(function (a, b) {
    return a.profit - b.profit;
  });
}

// Convert market pair LPs from eth node into algo expected format
// FROM:
// {
//   "_marketAddress": "0x3926a168C11a816e10c13977f75F488BffFE88E4",
//   "_tokens": [
//     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
//   ],
//   "_protocol": "",
//   "_tokenBalances": {
//     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": {
//       "type": "BigNumber",
//       "hex": "0x03ced367cc"
//     },
//     "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": {
//       "type": "BigNumber",
//       "hex": "0x8051533cca360064"
//     }
//   }
// }
// INTO:
// {
//   "index": 0,
//   "address": "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
//   "token0": {
//     "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//     "symbol": "USDC",
//     "decimal": 6
//   },
//   "token1": {
//     "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
//     "symbol": "WETH",
//     "decimal": 18
//   },
//   "reserve0": 176560092727090,
//   "reserve1": 5.2459530415773e+23
// }

export function convertLiquidityPool(lp, index) {
  const token0Address = lp._tokens[0];
  const token1Address = lp._tokens[1];
  const token0 = allTokens[token0Address.toLowerCase()];
  const token1 = allTokens[token1Address.toLowerCase()];

  return {
    index,
    address: lp._marketAddress,
    token0: {
      address: token0.address,
      symbol: token0.symbol,
      decimals: token0.decimals
    },
    token1: {
      address: token1.address,
      symbol: token1.symbol,
      decimals: token1.decimals
    },
    reserve0: parseInt(lp._tokenBalances[token0Address]._hex, 16),
    reserve1: parseInt(lp._tokenBalances[token1Address]._hex, 16)
  };
}

const calculateRouteNodeCapital = (
  startingCapital,
  currentSymbol,
  token0Symbol,
  token1Symbol,
  priceToken0inToken1,
  priceToken1inToken0
) => {
  if (token0Symbol === currentSymbol) {
    return { amount: (startingCapital * priceToken0inToken1), symbolFrom: token0Symbol, symbolTo: token1Symbol };
  }
  if (token1Symbol === currentSymbol) {
    return { amount: (startingCapital * priceToken1inToken0), symbolFrom: token1Symbol, symbolTo: token0Symbol };
  }
};

const calculateGasOnRoute = async (route, gasPrice, provider) => {
  const poolAddress = route.poolAddress.toLowerCase();
  const addressFrom = route.addressFrom.toLowerCase();
  const addressTo = route.addressTo.toLowerCase();
  // console.log(route);
  console.log('checkpoint #0');
  // console.log(provider);
  // console.log(poolAddress);
  // console.log(UNISWAP_PAIR_ABI);
  const pool = new Contract(poolAddress, UNISWAP_PAIR_ABI, provider);
  // console.log('pool contract: ');
  // console.log(pool);
  console.log('checkpoint #1');
  const tokenA = new Contract(addressFrom, ERC20_ABI, provider);
  console.log('checkpoint #2');
  const tokenB = new Contract(addressTo, ERC20_ABI, provider);
  console.log('checkpoint #3');
  const tokenFromDecimals = allTokens[addressFrom].decimals;
  console.log('checkpoint #4');
  const tokenToDecimals = allTokens[addressTo].decimals;
  const amountA = utils.parseUnits(route.amountFrom, tokenFromDecimals);
  const amountB = utils.parseUnits(route.amountTo, tokenToDecimals);

  const tokenAOut = await pool.getAmountsOut(amountA, [addressFrom, addressTo]);
  const tokenBOut = await pool.getAmountsOut(amountB, [addressTo, addressFrom]);

  const gasEstimateA = await pool.estimateGas.swapExactTokensForTokens(amountA, tokenAOut[1], [addressFrom, addressTo], gasPrice, { gasLimit });
  const gasEstimateB = await pool.estimateGas.swapExactTokensForTokens(amountB, tokenBOut[1], [addressTo, addressFrom], gasPrice, { gasLimit });

  const gasCost = utils.formatEther(gasEstimateA.add(gasEstimateB).mul(gasPrice));
  return gasCost;
  // return {
  //   ...route,
  //   gas: gasCost,
  // };
};

export async function getArbPaths(
  pairs,
  tokenIn,
  tokenOut,
  maxHops,
  currentPairs,
  path,
  bestTrades,
  count = 5,
  minProfitUsdt,
  minProfitWeth,
  gasPrice,
  provider
) {
  // const arbRoutes = await FindArbRoutes(pairs, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades, count, minProfitUsdt, minProfitWeth);
  const arbRoutes = await FindArbRoutesBigNumbers(pairs, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades, count, minProfitUsdt, minProfitWeth);

  // const testGasCost = await calculateGasOnRoute({
  //   // poolAddress: '0x397FF1542f962076d0BFE58eA045FfA2d347ACa0',
  //   poolAddress: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
  //   addressFrom: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  //   addressTo: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  //   amountFrom: 10.006187978818492,
  //   amountTo: 18270.676194306485,
  //   provider
  // },
  //   gasPrice);
  // console.log(`\n************************************ ...`);
  // console.log(`*** gas cost: ${testGasCost} *** ...`);
  // console.log(`************************************ ...\n`);

  const addFeesToRoute = async (route) => {
    const updatedRoute = {
      ...route,
      fees: 0
    };
    // simulate an asynchronous operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return updatedRoute;
  };
  // DEBUG: PRIMARY CONSOLE DUMP
  // console.log(arbRoutes);
  return Promise.all(arbRoutes.map(async (trade) => {
    return {
      ...trade,
      // calculatedRoutes: await Promise.all(trade.calculatedRoutes.map(route => addFeesToRoute(route)))
      calculatedRoutes: trade.calculatedRoutes
    };
  }));
  // return Promise.all(arbRoutes.map(async (trade) => {
  //   const calculatedRoutes = await Promise.all(trade.calculatedRoutes.map(async route => await addFeesToRoute(route)));
  //   return {
  //     ...trade,
  //     calculatedRoutes
  //   };
  // }));

  // return Promise.all(arbRoutes.map(async (trade) => {
  //   return {
  //     ...trade,
  //     calculatedRoutes: await Promise.all(trade.calculatedRoutes.map(route => calculateGasOnRoute(route, gasPrice)))
  //   };
  // }));
}

const formatAccumulatorRouteNode = (
  poolAddress,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  reserveIn,
  reserveOut
) => {
  return {
    tokenIn: tokenIn.address,          // Address of the token being sold
    tokenOut: tokenOut.address,         // Address of the token being bought
    tokenInSymbol: tokenIn.symbol,          // Address of the token being sold
    tokenOutSymbol: tokenOut.symbol,         // Address of the token being bought
    amountIn: amountIn, // Amount of tokenIn to be sold
    amountOut: amountOut,   // Expected amount of tokenOut to be received
    markets: [
      {
        tokenA: tokenIn.address,       // Address of tokenA in the market
        tokenB: tokenOut.address,       // Address of tokenB in the market
        pairAddress: poolAddress,  // Address of the Uniswap V2 pair contract
        reserveA: BigNumber.from(reserveIn), // Reserve of tokenA in the market
        reserveB: BigNumber.from(reserveOut),   // Reserve of tokenB in the market
        uniswapV2: true           // Indicates it is a Uniswap V2 market
      }
    ]
  };
}
  // Declare variables used in the function
  let Ea, Eb, newPath, newTrade, pair, pairsExcludingThisPair, tempOut;

  // Loop through all pairs in the pairs array
  for (let i = 0, _pj_a = pairs.length; i < _pj_a; i += 1) {
    // Make a copy of the current path
    newPath = path.slice();
    // Get the current pair
    pair = pairs[i];

    // Check if the current pair contains the tokenIn as either token0 or token1
    // console.log(`pair: ${JSON.stringify(pair, null, 2)}`);
    if (!(pair["token0"]["address"].toLowerCase() === tokenIn["address"].toLowerCase()) && !(pair["token1"]["address"].toLowerCase() === tokenIn["address"].toLowerCase())) {
      continue; // Skip to the next pair if tokenIn is not in the current pair
    }

    // Check if the reserves of either token0 or token1 in the current pair are less than 1
    if (pair["reserve0"] / Math.pow(10, pair["token0"]["decimals"]) < 1 || pair["reserve1"] / Math.pow(10, pair["token1"]["decimals"]) < 1) {
      continue; // Skip to the next pair if either reserve is less than 14
    }
    // Determine which token in the current pair is the output token
    if (tokenIn["address"].toLowerCase() === pair["token0"]["address"].toLowerCase()) {
      tempOut = pair["token1"]; // If tokenIn is token0, then token1 is the output token
    } else {
      tempOut = pair["token0"]; // If tokenIn is token1, then token0 is the output token
    }

    // Add the output token to the path
    newPath.push(tempOut);

    // Check if the output token is the desired tokenOut and the path has more than 2 tokens
    if (tempOut["address"].toLowerCase() === tokenOut["address"].toLowerCase() && path.length > 2) {
      // Calculate Ea and Eb using the currentPairs array plus the current pair
      // Ea represents the effective price of buying tokenOut, while Eb represents the effective price of selling tokenOut.
      // [Ea, Eb] = getEaEb(tokenOut, currentPairs + [pair]);
      [Ea, Eb] = getEaEb(tokenOut, currentPairs.concat([pair]));
      // Create a new trade object with the current path, currentPairs array plus the current pair, and Ea and Eb

      const route = currentPairs.concat([pair]).map(obj => {
        return {
          ...obj,
          index: obj.index,
          address: obj.address,
          reserve0: obj.reserve0,
          reserve1: obj.reserve1,
          token0Symbol: obj.token0.symbol,
          token1Symbol: obj.token1.symbol,
          // token0Address: obj.token0.address,
          // token1Address: obj.token1.address,
          priceToken0inToken1: (obj.reserve1 / obj.reserve0 * 10 ** (obj.token0.decimals - obj.token1.decimals)).toFixed(15),
          priceToken1inToken0: (1 / (obj.reserve1 / obj.reserve0 * 10 ** (obj.token0.decimals - obj.token1.decimals))).toFixed(15),
        };
      });

      newTrade = {
        "lp": pair,
        "route": route,
        "path": newPath,
        "pathString": newPath.reduce((accumulator, currentToken) => { return `${!!accumulator ? `${accumulator}, ` : ''}${currentToken.symbol}`; }, ''),
        "Ea": Ea,
        "Eb": Eb
      };

      // Check if Ea and Eb are both defined and Ea is less than Eb
      if (Ea && Eb && Ea < Eb) {
        // Calculate the optimal amount of tokenOut for the trade
        newTrade["optimalAmount"] = getOptimalAmount(Ea, Eb);

        // Check if the optimal amount is greater than 0
        if (newTrade["optimalAmount"] > 0) {
          // Calculate the output amount for the trade
          newTrade["outputAmount"] = getAmountOut(newTrade["optimalAmount"], Ea, Eb);
          // Calculate the profit for the trade
          newTrade["profit"] = newTrade["outputAmount"] - newTrade["optimalAmount"];
          // Calculate the profit as a percentage of the output token
          newTrade["p"] = `${Number.parseInt(newTrade["profit"]) / Math.pow(10, tokenOut["decimals"])} ${tokenOut.symbol}`;

          const oneWETHProfitStartingCapital = 1;
          const oneWETHProfit = route.reduce((accumulator, routeNode) => {
            // find which is WETH token; tokenFromNode1 = WETH token
            if (routeNode.token0.symbol === accumulator.currentTokenSymbol) {
              accumulator.capital = accumulator.capital * routeNode.priceToken0inToken1;
              accumulator.currentTokenSymbol = routeNode.token1.symbol;
              return accumulator;
            }
            if (routeNode.token1.symbol === accumulator.currentTokenSymbol) {
              accumulator.capital = accumulator.capital * routeNode.priceToken1inToken0
              accumulator.currentTokenSymbol = routeNode.token0.symbol;
              return accumulator;
            }
          }, { currentTokenSymbol: 'WETH', capital: oneWETHProfitStartingCapital });
          // newTrade["oneWETHProfit"] = `${oneWETHProfitStartingCapital - oneWETHProfit.capital} ${oneWETHProfit.currentTokenSymbol}`;
          newTrade["oneWETHProfit"] = oneWETHProfitStartingCapital - oneWETHProfit.capital;
          newTrade["startingCapForTenBucks"] = `${1.005 / oneWETHProfit.capital} WETH`;

        } else {
          continue;
        }

        bestTrades = sortTrades(bestTrades, newTrade);
        bestTrades.reverse();
        bestTrades = bestTrades.slice(0, count);
      }
    } else {
      if (maxHops > 1 && pairs.length > 1) {
        pairsExcludingThisPair = pairs.slice(0, i).concat(pairs.slice(i + 1));
        bestTrades = FindArb(pairsExcludingThisPair, tempOut, tokenOut, maxHops - 1, currentPairs.concat([pair]), newPath, bestTrades, count);
      }
    }
  }

  return bestTrades.filter(trade => trade.oneWETHProfit > 0);
}
