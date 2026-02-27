require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
    },
    sepolia: {
      provider: () => new HDWalletProvider(process.env.PRIVATE_KEY, `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`),
      network_id: 11155111,       // Sepolia's id
      gas: 5500000,               // Gas limit
      confirmations: 2,           // # of confirmations to wait between deployments
      timeoutBlocks: 200,         // # of blocks before a deployment times out
      skipDryRun: true            // Skip dry run before migrations? (default: false for public nets )
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
