import { toInteger } from "lodash";
import BigNumber from "bignumber.js";

// Import the functions you want to test
const { getAmountOut, getOptimalAmount, getEaEb } = require('../src/FindArbBigNumbers');
const Decimal = require('decimal.js');

describe('Arbitrage Functions', () => {
  describe('getAmountOut', () => {
    it('calculates the amount out correctly', () => {
      // Test the getAmountOut function with example values
      const amountIn = new BigNumber(100);
      const reserveIn = new BigNumber(2000);
      const reserveOut = new BigNumber(5000);
      const result = getAmountOut(amountIn, reserveIn, reserveOut);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(BigNumber.isBigNumber(result)).toBe(true);
      expect(result.toString()).toBe('237.41486879077963518598'); // Replace 42 with your expected result
    });
  });

  describe('getOptimalAmount', () => {
    it('calculates the optimal amount correctly', () => {
      // Test the getOptimalAmount function with example values
      const Ea = new BigNumber(1000);
      const Eb = new BigNumber(2000);

      const result = getOptimalAmount(Ea, Eb);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(BigNumber.isBigNumber(result)).toBe(true);
      expect(result.toString()).toBe('413.33064057001832689401'); // Replace 42 with your expected result
    });
  });

  describe('getEaEb function', () => {
    it('calculates Ea and Eb correctly with 2 tokens', () => {
      const tokenIn = { address: 'TokenA' };
      const pairs = [
        {
          token0: { address: 'TokenA' },
          token1: { address: 'TokenB' },
          reserve0: 1000,
          reserve1: 2000,
          originalLp: {
            _tokens: ['TokenA', 'TokenB'],
            _tokenBalances: {
              TokenA: new BigNumber(1000),
              TokenB: new BigNumber(2000)
            }
          }
        },
        {
          token0: { address: 'TokenB' },
          token1: { address: 'TokenC' },
          reserve0: 2000,
          reserve1: 3000,
          originalLp: {
            _tokens: ['TokenB', 'TokenC'],
            _tokenBalances: {
              TokenB: new BigNumber(2000),
              TokenC: new BigNumber(3000)
            }
          }
        },
      ];
  
      const [Ea, Eb] = getEaEb(tokenIn, pairs);

      // Replace these assertions with expected values based on your calculations
      expect(BigNumber.isBigNumber(Ea)).toBe(true);
      expect(BigNumber.isBigNumber(Eb)).toBe(true);
      expect(Ea.toString()).toBe('500.75112669003505257887');
      expect(Eb.toString()).toBe('1497.7466199298948422634');
    });

    it('calculates Ea and Eb correctly with 3 tokens', () => {
        const tokenIn = { address: 'TokenX' };
        const tokenX = {
          address: 'TokenXAddress',
        };
      
        const tokenY = {
          address: 'TokenYAddress',
        };
      
        const tokenZ = {
          address: 'TokenZAddress',
        };
        const pairs = [
          {
            token0: tokenX,
            token1: tokenY,
            reserve0: 500,
            reserve1: 1000,
            originalLp: {
              _tokens: [tokenX.address, tokenY.address],
              _tokenBalances: {
                TokenXAddress: new BigNumber(500),
                TokenYAddress: new BigNumber(1000)
              }
            }
          },
          {
            token0: tokenY,
            token1: tokenZ,
            reserve0: 800,
            reserve1: 1500,
            originalLp: {
              _tokens: [tokenY.address, tokenZ.address],
              _tokenBalances: {
                TokenYAddress: new BigNumber(800),
                TokenZAddress: new BigNumber(1500)
              }
            }
          },
          {
            token0: tokenZ,
            token1: tokenX,
            reserve0: 1200,
            reserve1: 600,
            originalLp: {
              _tokens: [tokenZ.address, tokenX.address],
              _tokenBalances: {
                TokenZAddress: new BigNumber(1200),
                TokenXAddress: new BigNumber(600)
              }
            }
          },
        ];
      
        // Calculate Ea and Eb using the function
        const [Ea, Eb] = getEaEb(tokenIn, pairs);
      
        // Calculate expected values for Pair 1
        // const R0 = 1000; // reserve0 of Pair 1
        // const R1 = 1500; // reserve1 of Pair 1
        // const R2 = 500;  // reserve0 of Pair 2
        // const R3 = 800;  // reserve1 of Pair 2
        // const R4 = 1200; // reserve0 of Pair 3
        // const R5 = 600;  // reserve1 of Pair 3
        // const expectedEaPair2 = 1000 * R2 * R3 / (1000 * R3 + 997 * R0);
        // const expectedEbPair2 = 997 * R0 * R1 / (1000 * R3 + 997 * R0);
        // const expectedEaPair3 = 1000 * expectedEaPair2 * R4 / (1000 * R4 + 997 * expectedEbPair2);
        // const expectedEbPair3 = 997 * expectedEbPair2 * R5 / (1000 * R4 + 997 * expectedEbPair2);
        const expectedEa = '131.60010511558396107269';
        const expectedEb = '245.27191666094343292857';

        // Check if the calculated values match the expected values
        expect(Ea.toString()).toBe(expectedEa);
        expect(Eb.toString()).toBe(expectedEb);
      });
      
      
  });
});
