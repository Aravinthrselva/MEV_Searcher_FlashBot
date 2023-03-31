require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path: '.env'});


/** @type import('hardhat/config').HardhatUserConfig */

const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;
const PRV_KEY = process.env.PRV_KEY;

module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url : QUICKNODE_RPC_URL,
      accounts: [PRV_KEY],
    },
  },
};
