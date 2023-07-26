// hardhat.config.js
require("dotenv").config();
require("@nomiclabs/hardhat-waffle");

module.exports = {
    networks: {
        hardhat: {
            forking: {
                url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            },
        },
    },
    solidity: {
        version: "0.6.12", // Use the appropriate Solidity version for your contracts
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};
