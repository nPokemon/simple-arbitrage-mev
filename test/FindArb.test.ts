import { toInteger } from "lodash";
import pairsData from "./pairsData.json"; // Adjust the path if needed

// Import the functions you want to test
const {
  getAmountOut,
  getOptimalAmount,
  getEaEb,
  getArbPathsDecimals,
} = require("../src/FindArb");
const Decimal = require("decimal.js");
const _ = require("lodash");

describe("[DECIMALS] Arbitrage Functions", () => {
  describe("getAmountOut", () => {
    it("calculates the amount out correctly", () => {
      // Test the getAmountOut function with example values
      const amountIn = 100;
      const reserveIn = 2000;
      const reserveOut = 5000;

      const result = getAmountOut(amountIn, reserveIn, reserveOut);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(result).toBe(237.41486879077962); // Replace 42 with your expected result
    });
  });

  describe("getOptimalAmount", () => {
    it("calculates the optimal amount correctly", () => {
      // Test the getOptimalAmount function with example values
      const Ea = 1000;
      const Eb = 2000;

      const result = getOptimalAmount(Ea, Eb);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(result.equals(new Decimal(413))).toBe(true);
    });
  });

  describe("getEaEb function", () => {
    it("calculates Ea and Eb correctly with 2 tokens", () => {
      const tokenIn = { address: "TokenA" };
      const pairs = [
        {
          index: 0,
          originalLp: {
            _marketAddress: "0x3Aa370AacF4CB08C7E1E7AA8E8FF9418D73C7e0F",
            _tokens: ["TokenA", "TokenB"],
            _protocol: "",
            _tokenBalances: {
              TokenA: {
                type: "BigNumber",
                hex: "0x3c336fa911",
              },
              TokenB: {
                type: "BigNumber",
                hex: "0x08cb87ba43de6db176",
              },
            },
          },
          address: "0x3Aa370AacF4CB08C7E1E7AA8E8FF9418D73C7e0F",
          token0: {
            address: "TokenA",
            symbol: "USDC",
            decimals: 6,
          },
          token1: {
            address: "TokenB",
            symbol: "WETH",
            decimals: 18,
          },
          reserve0: 258560993553,
          reserve1: 162239848101889000000,
        },
        {
          index: 2,
          originalLp: {
            _marketAddress: "0x74C99F3f5331676f6AEc2756e1F39b4FC029a83E",
            _tokens: ["TokenB", "TokenC"],
            _protocol: "",
            _tokenBalances: {
              TokenB: {
                type: "BigNumber",
                hex: "0x0316f14f04a70a8448",
              },
              TokenC: {
                type: "BigNumber",
                hex: "0x151df3bbc8",
              },
            },
          },
          address: "0x74C99F3f5331676f6AEc2756e1F39b4FC029a83E",
          token0: {
            address: "TokenB",
            symbol: "WETH",
            decimals: 18,
          },
          token1: {
            address: "TokenC",
            symbol: "USDT",
            decimals: 6,
          },
          reserve0: 56993421640751284000,
          reserve1: 90696825800,
        },
      ];

      const [Ea, Eb] = getEaEb(tokenIn, pairs);
      const expectedEa = "67366894298.705574";
      const expectedEb = "67066179147.01099";

      // Replace these assertions with expected values based on your calculations
      expect(Ea.toString()).toEqual(parseInt(expectedEa).toString());
      expect(Eb.toString()).toEqual(parseInt(expectedEb).toString());
    });
  });

  describe("getArbPathsDecimals function", () => {
    it("Find arb paths in decimal format", async () => {
      const pairs = pairsData;
      const tokenIn = {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
        decimals: 18,
      };
      const tokenOut = {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        symbol: "WETH",
        decimals: 18,
      };
      const maxHops = 7;
      const currentPairs: any[] = [];
      const path = [tokenIn];
      const bestTradesInput: any[] = [];
      const count = 5;
      const minProfitUsdt = 5;
      const minProfitWeth = "0.003106660174389184";

      const bestTrades = await getArbPathsDecimals(
        pairs,
        tokenIn,
        tokenOut,
        maxHops,
        currentPairs,
        path,
        bestTradesInput,
        count,
        minProfitUsdt,
        minProfitWeth,
        null,
        null
      );

      const expectedPath0 = [
        {
          poolAddress: "0x3926a168C11a816e10c13977f75F488BffFE88E4",
          amountFrom: 9.947506678299693,
          amountTo: 15933.42566166555,
          symbolFrom_token1: "WETH",
          symbolTo_token0: "USDC",
          addressFrom: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          addressTo: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          reserve0: 3949673010,
          reserve1: 2465847550825304600,
          priceToken0inToken1: "0.000624316885115",
          priceToken1inToken0: "1601.750687579233499",
        },
        {
          poolAddress: "0x3Aa370AacF4CB08C7E1E7AA8E8FF9418D73C7e0F",
          amountFrom: 15933.42566166555,
          amountTo: 9.997782432574386,
          symbolFrom_token0: "USDC",
          symbolTo_token1: "WETH",
          addressFrom: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          addressTo: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          reserve0: 258560993553,
          reserve1: 162239848101889000000,
          priceToken0inToken1: "0.000627472248898",
          priceToken1inToken0: "1593.695978996601980",
        },
        {
          poolAddress: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
          amountFrom: 9.997782432574386,
          amountTo: 15934.67130236011,
          symbolFrom_token1: "WETH",
          symbolTo_token0: "USDC",
          addressFrom: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          addressTo: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          reserve0: 27742880325410,
          reserve1: 1.7406526704150863e22,
          priceToken0inToken1: "0.000627423198312",
          priceToken1inToken0: "1593.820570693995478",
        },
        {
          poolAddress: "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
          amountFrom: 15934.67130236011,
          amountTo: 10.003106660174387,
          symbolFrom_token0: "USDC",
          symbolTo_token1: "WETH",
          addressFrom: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          addressTo: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          reserve0: 6267619815315,
          reserve1: 3.934544260647799e21,
          priceToken0inToken1: "0.000627757326798",
          priceToken1inToken0: "1592.972247892078485",
        },
      ];

      // console.log(JSON.stringify(bestTrades[0].calculatedRoutes, null, 2));
      expect(_.isEqual(bestTrades[0].calculatedRoutes, expectedPath0)).toBe(
        true
      );
    });

    xit("Find arb paths in decimal format", async () => {
      const tokenIn = {
        address: "TokenA",
        symbol: "WETH",
        decimals: 18,
      };
      const tokenOut = {
        address: "TokenA",
        symbol: "WETH",
        decimals: 18,
      };
      const pairs = [
        {
          index: 0,
          address: "LP1",
          token0: {
            address: "TokenA",
            symbol: "WETH",
            decimals: 18,
          },
          token1: {
            address: "TokenB",
            symbol: "TOKB",
            decimals: 18,
          },
          reserve0: 1000000000000000000000,
          reserve1: 500000000000000000000,
        },
        {
          index: 1,
          address: "LP2",
          token0: {
            address: "TokenB",
            symbol: "TOKB",
            decimals: 18,
          },
          token1: {
            address: "TokenC",
            symbol: "TOKC",
            decimals: 18,
          },
          reserve0: 500000000000000000000,
          reserve1: 2000000000000000000000,
        },
        {
          index: 2,
          address: "LP3",
          token0: {
            address: "TokenC",
            symbol: "TOKC",
            decimals: 18,
          },
          token1: {
            address: "TokenA",
            symbol: "WETH",
            decimals: 18,
          },
          reserve0: 750000000000000000000,
          reserve1: 1500000000000000000000,
        },
      ];
      const maxHops = 3;
      const currentPairs: any[] = [];
      const path = [tokenIn];
      const bestTradesInput: any[] = [];
      const count = 3;
      const minProfitUsdt = 5;
      const minProfitWeth = "0.0031";

      const bestTrades = await getArbPathsDecimals(
        pairs,
        tokenIn,
        tokenOut,
        maxHops,
        currentPairs,
        path,
        bestTradesInput,
        count,
        minProfitUsdt,
        minProfitWeth,
        null,
        null
      );

      const expectedPath0 = [
        {
          poolAddress: "LP1",
          amountFrom: 2.500775,
          amountTo: 1.2503875,
          symbolFrom_token0: "WETH",
          symbolTo_token1: "TOKB",
          addressFrom: "TokenA",
          addressTo: "TokenB",
          reserve0: 1e21,
          reserve1: 500000000000000000000,
          priceToken0inToken1: "0.500000000000000",
          priceToken1inToken0: "2.000000000000000",
        },
        {
          poolAddress: "LP2",
          amountFrom: 1.2503875,
          amountTo: 5.00155,
          symbolFrom_token0: "TOKB",
          symbolTo_token1: "TOKC",
          addressFrom: "TokenB",
          addressTo: "TokenC",
          reserve0: 500000000000000000000,
          reserve1: 2e21,
          priceToken0inToken1: "4.000000000000000",
          priceToken1inToken0: "0.250000000000000",
        },
        {
          poolAddress: "LP3",
          amountFrom: 5.00155,
          amountTo: 10.0031,
          symbolFrom_token0: "TOKC",
          symbolTo_token1: "WETH",
          addressFrom: "TokenC",
          addressTo: "TokenA",
          reserve0: 750000000000000000000,
          reserve1: 1.5e21,
          priceToken0inToken1: "2.000000000000000",
          priceToken1inToken0: "0.500000000000000",
        },
      ];

      // console.log(JSON.stringify(bestTrades[0].calculatedRoutes, null, 2));
      expect(_.isEqual(bestTrades[0].calculatedRoutes, expectedPath0)).toBe(
        true
      );
    });
  });
});
