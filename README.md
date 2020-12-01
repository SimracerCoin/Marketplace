# Simthunder Marketplace
Sim racing assets marketplace DApp powered by Simracer Coin

## Introduction
The marketplace DApp and contracts are in the markep-dapp folder. 
This project has 2 folders - **backend** and **frontend**:
    -**backend**: Has all files related to smart contracts and IPFS
    -**frontend**: Has all **react** files
    
##### How to run project
1) Install truffle 

    **npm install -g truffle**

2) Go to **backend** folder and run
    
    **truffle development**
    
3) Inside truffle development, run these commands and don't exit **truffle development**:

    **compile**
    
    **migrate**
    
4) Inside **build/contracts** folder copy **STMarketplace.json**

    **past STMarketplace.json to folder --> client/src/**

5) Go to folder **client** and run command

    **npm install**

6) Run this command to build the Dapp

    **npm run build**
    
7) Run this command to start it:

    **npm run start**

8) Use metamask plugin to interact with the Dapp. Add a custom network with the RPC for your local blokchain, running in truffle.

9) Add one of the accounts shown in truffle console to your metamask plugin.
