import { toInteger } from "lodash";

// Import the functions you want to test
const { getAmountOut, getOptimalAmount, getEaEb } = require('../src/FindArb');
const Decimal = require('decimal.js');

describe('Arbitrage Functions', () => {
  describe('getAmountOut', () => {
    it('calculates the amount out correctly', () => {
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

  describe('getOptimalAmount', () => {
    it('calculates the optimal amount correctly', () => {
      // Test the getOptimalAmount function with example values
      const Ea = 1000;
      const Eb = 2000;

      const result = getOptimalAmount(Ea, Eb);

      // Replace this assertion with the expected value for your specific use case
      // This is just a placeholder example assertion
      expect(result.equals(new Decimal(413))).toBe(true);
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
        },
        {
          token0: { address: 'TokenB' },
          token1: { address: 'TokenC' },
          reserve0: 2000,
          reserve1: 3000,
        },
      ];
  
      const [Ea, Eb] = getEaEb(tokenIn, pairs);
  
      // Replace these assertions with expected values based on your calculations
      expect(Ea.equals(new Decimal(500))).toBe(true);
      expect(Eb.equals(new Decimal(1497))).toBe(true);
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
          },
          {
            token0: tokenY,
            token1: tokenZ,
            reserve0: 800,
            reserve1: 1500,
          },
          {
            token0: tokenZ,
            token1: tokenX,
            reserve0: 1200,
            reserve1: 600,
          },
        ];
      
        // Calculate Ea and Eb using the function
        const [Ea, Eb] = getEaEb(tokenIn, pairs);
      
        // Calculate expected values for Pair 1
        const R0 = 1000; // reserve0 of Pair 1
        const R1 = 1500; // reserve1 of Pair 1
        const R2 = 500;  // reserve0 of Pair 2
        const R3 = 800;  // reserve1 of Pair 2
        const R4 = 1200; // reserve0 of Pair 3
        const R5 = 600;  // reserve1 of Pair 3
        const expectedEaPair2 = toInteger(1000 * R2 * R3 / (1000 * R3 + 997 * R0));
        const expectedEbPair2 = toInteger(997 * R0 * R1 / (1000 * R3 + 997 * R0));
        const expectedEaPair3 = toInteger(1000 * expectedEaPair2 * R4 / (1000 * R4 + 997 * expectedEbPair2));
        const expectedEbPair3 = toInteger(997 * expectedEbPair2 * R5 / (1000 * R4 + 997 * expectedEbPair2));

        // Check if the calculated values match the expected values
        expect(Ea.equals(new Decimal(expectedEaPair3))).toBe(true);
        expect(Eb.equals(new Decimal(expectedEbPair3))).toBe(true);
      });
      
      
  });
});
