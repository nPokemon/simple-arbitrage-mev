import { toInteger } from "lodash";
import BigNumber from "bignumber.js";
import pairsData from "./pairsData.json"; // Adjust the path if needed

// Import the functions you want to test
const {
  getAmountOut,
  getOptimalAmount,
  getEaEb,
  getArbPathsBigNumbers,
  adjustReserve,
} = require("../src/FindArbBigNumbers");
const Decimal = require("decimal.js");
const _ = require("lodash");

describe("[BIGNUMBERS] Arbitrage Functions", () => {
  describe("getAmountOut", () => {
    it("calculates the amount out correctly", () => {
      // Test the getAmountOut function with example values
      const amountIn = new BigNumber(100);
      const reserveIn = new BigNumber(2000);
      const reserveOut = new BigNumber(5000);
      const result = getAmountOut(amountIn, reserveIn, reserveOut);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(BigNumber.isBigNumber(result)).toBe(true);
      expect(result.toString()).toBe("237.41486879077963518598"); // Replace 42 with your expected result
    });
  });

  describe("getOptimalAmount", () => {
    it("calculates the optimal amount correctly", () => {
      // Test the getOptimalAmount function with example values
      const Ea = new BigNumber(1000);
      const Eb = new BigNumber(2000);

      const result = getOptimalAmount(Ea, Eb);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(BigNumber.isBigNumber(result)).toBe(true);
      expect(result.toString()).toBe("413.33064057001832689401"); // Replace 42 with your expected result
    });
  });

  describe("adjustReserve", () => {
    it("gets the reserve from given", () => {
      // Test the getOptimalAmount function with example values
      const token0 = {
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        symbol: "USDC",
        decimals: 6,
      };
      const token1 = {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        decimals: 18,
      };
      const reserve0 = "258560993553";
      const reserve1 = "162239848101889028470";
      const Ra = adjustReserve(token0, reserve0);
      const Rb = adjustReserve(token1, reserve1);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(Ra.toString()).toBe("258560993553");
      expect(Rb.toString()).toBe("162239848101889028470");
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
                _hex: "0x3c336fa911",
              },
              TokenB: {
                type: "BigNumber",
                _hex: "0x08cb87ba43de6db176",
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
                _hex: "0x0316f14f04a70a8448",
              },
              TokenC: {
                type: "BigNumber",
                _hex: "0x151df3bbc8",
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
      const expectedEa = "67366894298";
      const expectedEb = "67066179147";

      // Replace these assertions with expected values based on your calculations
      expect(BigNumber.isBigNumber(Ea)).toBe(true);
      expect(BigNumber.isBigNumber(Eb)).toBe(true);
      expect(Ea.toString()).toBe(expectedEa);
      expect(Eb.toString()).toBe(expectedEb);
    });
  });

  describe("getArbPathsBigNumbers function", () => {
    it("Find arb paths in BigNumber format", async () => {
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

      const bestTrades = await getArbPathsBigNumbers(
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
          amountFrom: "1.0030893925139283664",
          amountTo: "1606.699124162620297104705831044786981495872",
          symbolFrom_token1: "WETH",
          symbolTo_token0: "USDC",
          addressFrom: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          addressTo: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          reserve0: "3949673010",
          reserve1: "2465847550825304400",
          priceToken0inToken1: "0.00062431688511482736643051876337",
          priceToken1inToken0: "1601.75068757923339982548",
        },
        {
          poolAddress: "0x3Aa370AacF4CB08C7E1E7AA8E8FF9418D73C7e0F",
          amountFrom: "1606.699124162620297104705831044786981495872",
          amountTo:
            "1.00815911274006310666998676202595446342437946270692081075413910404695872",
          symbolFrom_token0: "USDC",
          symbolTo_token1: "WETH",
          addressFrom: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          addressTo: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          reserve0: "258560993553",
          reserve1: "162239848101889028470",
          priceToken0inToken1: "0.00062747224889756234355755287501",
          priceToken1inToken0: "1593.69597899660177827269",
        },
        {
          poolAddress: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
          amountFrom:
            "1.00815911274006310666998676202595446342437946270692081075413910404695872",
          amountTo:
            "1606.8247324177194849895848612322116775893960831648418498027199523480010590105130851178754682432",
          symbolFrom_token1: "WETH",
          symbolTo_token0: "USDC",
          addressFrom: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          addressTo: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          reserve0: "27742880325410",
          reserve1: "1.7406526704150862837977e+22",
          priceToken0inToken1: "0.00062742319831182198370634225005",
          priceToken1inToken0: "1593.82057069399545531981",
        },
        {
          poolAddress: "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0",
          amountFrom:
            "1606.8247324177194849895848612322116775893960831648418498027199523480010590105130851178754682432",
          amountTo:
            "1.008695998655325886564090678969002223904213036370752467304909757246562018756531485426193142991661231928831441379929266674816",
          symbolFrom_token0: "USDC",
          symbolTo_token1: "WETH",
          addressFrom: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          addressTo: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          reserve0: "6267619815315",
          reserve1: "3.934544260647798716644e+21",
          priceToken0inToken1: "0.00062775732679791701097343220738",
          priceToken1inToken0: "1592.97224789207851538211",
        },
      ];

      // console.table(bestTrades[0]);

      expect(JSON.stringify(bestTrades[0].calculatedRoutes)).toEqual(
        JSON.stringify(expectedPath0)
      );
    });
  });
});
