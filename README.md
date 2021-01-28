# Simthunder Marketplace
Sim racing assets marketplace DApp powered by Simracer Coin. This is a work in progress, preliminary front-end focused on providing a view of how users will interact with the marketplace (i.e., list assets, buy an asset, download purchased asset, challenge/complain about a purchase).

## Introduction
The marketplace DApp and contracts are in the market-dapp folder. 

This project has 2 folders, **backend** and **frontend**:
    
**backend**: Has all files related to smart contracts and IPFS

**frontend**: Has all **react** files
    
##### How to run project
1) Go to **backend** and install project

    **yarn**

2) Start development environment containing hardhat node with compiled and deployed projects and dependencies, along with two Descartes nodes for `alice` and `bob`
    
    **docker-compose up**
    
3) Inside **deployments/localhost** folder copy **STMarketplace.json**

    **paste STMarketplace.json to folder --> client/src/**

4) Go to folder **client** and run command

    **yarn**

5) Run this command to build the Dapp

    **yarn build**
    
6) Run this command to start it:

    **yarn start**

7) Use metamask plugin to interact with the Dapp. Add a custom network with the RPC for your local blockchain, running at `localhost:8545`.

8) Add one of the accounts for the blockchain, which by default are the ones listed [here](https://hardhat.org/hardhat-network/#hardhat-network-initial-state) (e.g., `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`); or simply log into Metamask using the default mnemonic `test test test test test test test test test test test junk`.
