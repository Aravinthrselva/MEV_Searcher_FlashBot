const{FlashbotsBundleProvider} = require('@flashbots/ethers-provider-bundle');
const {ethers} = require('hardhat');
require('dotenv').config({path:'.env'});
const {BigNumber} = require('ethers');

async function main() {

  // Deploy FakeNFT Contract
  const fakeNFT = await ethers.getContractFactory('FakeNFT');
  const FakeNFT = await fakeNFT.deploy();
  await FakeNFT.deployed();
  console.log("FakeNFT Contract Address:", FakeNFT.address);

  // Create a Quicknode WebSocket Provider
  const provider = new ethers.providers.WebSocketProvider(
    process.env.QUICKNODE_WS_URL,
    "goerli"
    );

  // Wrap your private key in the ethers Wallet class
  const signer = new ethers.Wallet(process.env.PRV_KEY, provider);

  // Create a Flashbots Provider which will forward the request to the relayer
  // Which will further send it to the flashbot miner

  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    signer,
    // URL for the flashbots relayer
    "https://relay-goerli.flashbots.net",
    "goerli"    
  );

  provider.on('block', async(blockNumber) => {
    console.log("Block Number:", blockNumber);

    // Send a bundle of transactions to the flashbot relayer
    const bundleResponse = await flashbotsProvider.sendBundle(
      [
        {
          transaction: {
            // ChainId for the Goerli network
            chainId: 5,
            // EIP-1559
            type: 2,
            // Value of 1 FakeNFT
            value: ethers.utils.parseEther("0.01"),
            // Address of the FakeNFT
            to: FakeNFT.address,
            // In the data field, we pass the function selctor of the mint function
            data: FakeNFT.interface.getSighash("mint()"),
            // Max Gas Fes you are willing to pay
            maxFeePerGas: BigNumber.from(10).pow(9).mul(3),
            // Max Priority gas fees you are willing to pay
            maxPriorityFeePerGas: BigNumber.from(10).pow(9).mul(2),

            gasLimit: 2201501,
        },
        signer: signer,
      }, 
    ],
    blockNumber + 1
  );

      // If an error is present, log it
      if ("error" in bundleResponse){
        console.log(bundleResponse.error.message);
      }
  });
}

main();




/*

1. we deployed the FakeNFT contract 

2. After that we create a Quicknode WebSocket Provider, a signer and a Flashbots provider

-  Note the reason why we created a WebSocket provider this time is because 
  we want to create a socket to listen to every new block that comes in Goerli network

- HTTP Providers, as we had been using previously, 
  work on a request-response model, 
  where a client sends a request to a server, and the server responds back

- In the case of WebSockets, however, the client opens a connection with the WebSocket server once, 
  and then the server continuously sends them updates as long as the connection remains open. 
  Therefore the client does not need to send requests again and again.  

- The reason to do that is that all miners in Goerli network are not flashbot miners. 
  This means for some blocks it might happen that the bundle of transactions you send dont get included.

- As a reason, we listen for each block and send a request in each block 
  so that when the coinbase miner(miner of the current block) is a flashbots miner, our transaction gets included.


3. After initializing the providers and signers, we use our provider to listen for the block event
Every time a block event is called, we print the block number and send a bundle of transactions to mint the NFT

(Note the bundle we are sending may or may not get included in the current block 
depending on whether the coinbase miner is a flashbot miner or not.)  


***bundleResponse***

4. Now to create the transaction object, we specify the

a-'chainId' which is 5 for Goerli, 
b- 'type' which is 2 because we will use the Post-London Upgrade gas model EIP-1559. 
c- 'value' which is 0.01 -- the amount for minting 1 NFT 
d- 'to' address which is the address of FakeNFT contract.
e- 'data' we need to specify the function selector 
    which is the first four bytes of the Keccak-256 (SHA-3) hash of the name and the arguments of the function 
    This will determine which function are we trying to call, 
    in our case, it will be the mint function.  
f-  then we specify 'maxFeePerGas' and 'maxPriorityFeePerGas' to be 3 GWEI and 2 GWEI respectively. 
    Note the values we got here are from looking at the transactions which were mined previously in the network 
    and what Gas Fees they were using.    

   1 GWEI = 10*WEI = 10*10^8 = 10^9

5  We want the transaction to be mined in the next block, so we add 1 to the current blocknumber and send this bundle of transactions.

6. After sending the bundle, 
we get a bundleResponse on which we check if there was an error or not, 
if yes we log it.

7. Now note, getting a response doesn't guarantee that our bundle will get included in the next block or not. 
To check if it gets included in the next block or not 
you can use bundleResponse.wait() but for the sake of this tutorial, 
we will just wait patiently for a few blocks and observe.

8. After an address is printed on your terminal, 
go to Goerli Etherscan and keep refreshing the page till you see Mint transaction appear
(Note it takes some time for it to appear 
  cause the flashbot miner has to be the coinbase miner for our bundle to be included in the block)


*/