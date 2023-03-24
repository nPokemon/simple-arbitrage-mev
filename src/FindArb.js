const data = require('./data/pairs.json');
const Decimal = require('decimal.js');

var _pj;
const d997 = new Decimal(997);
const d1000 = new Decimal(1000);

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

export function FindArb(pairs, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades, count = 5) {
  // Declare variables used in the function
  var Ea, Eb, newPath, newTrade, pair, pairsExcludingThisPair, tempOut;

  // Loop through all pairs in the pairs array
  for (var i = 0, _pj_a = pairs.length; i < _pj_a; i += 1) {
    // Make a copy of the current path
    newPath = path.slice();
    // Get the current pair
    pair = pairs[i];

    // Check if the current pair contains the tokenIn as either token0 or token1
    // console.log(`pair: ${JSON.stringify(pair, null, 2)}`);
    if (!(pair["token0"]["address"] === tokenIn["address"]) && !(pair["token1"]["address"] === tokenIn["address"])) {
      continue; // Skip to the next pair if tokenIn is not in the current pair
    }

    // Check if the reserves of either token0 or token1 in the current pair are less than 1
    if (pair["reserve0"] / Math.pow(10, pair["token0"]["decimal"]) < 1 || pair["reserve1"] / Math.pow(10, pair["token1"]["decimal"]) < 1) {
      continue; // Skip to the next pair if either reserve is less than 1
    }

    // Determine which token in the current pair is the output token
    if (tokenIn["address"] === pair["token0"]["address"]) {
      tempOut = pair["token1"]; // If tokenIn is token0, then token1 is the output token
    } else {
      tempOut = pair["token0"]; // If tokenIn is token1, then token0 is the output token
    }

    // Add the output token to the path
    newPath.push(tempOut);

    // Check if the output token is the desired tokenOut and the path has more than 2 tokens
    if (tempOut["address"] === tokenOut["address"] && path.length > 2) {
      // Calculate Ea and Eb using the currentPairs array plus the current pair
      // Ea represents the effective price of buying tokenOut, while Eb represents the effective price of selling tokenOut.
      // [Ea, Eb] = getEaEb(tokenOut, currentPairs + [pair]);
      [Ea, Eb] = getEaEb(tokenOut, currentPairs.concat([pair]));
      // Create a new trade object with the current path, currentPairs array plus the current pair, and Ea and Eb
      newTrade = {
        "route": currentPairs + [pair],
        "path": newPath,
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
          newTrade["p"] = Number.parseInt(newTrade["profit"]) / Math.pow(10, tokenOut["decimal"]);
        } else {
          continue;
        }

        bestTrades = sortTrades(bestTrades, newTrade);
        bestTrades.reverse();
        bestTrades = bestTrades.slice(0, count);
      }
    } else {
      if (maxHops > 1 && pairs.length > 1) {
        bestTrades = findArb(pairsExcludingThisPair, tempOut, tokenOut, maxHops - 1, currentPairs.concat([pair]), newPath, bestTrades, count);
      }
    }
  }
  return bestTrades;
}
