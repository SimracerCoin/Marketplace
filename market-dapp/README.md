## Introduction
This project has 2 folders - **backend** and **frontend**:
    -**backend**: Has all files related to smart contracts and IPFS
    -**frontend**: Has all **react** files
    
##### How to run project
1) Install truffle 

    **npm install -g truffle**

2) Go to **backend** folder and run
    
    **truffle development**
    
3) Inside truffle development, run these commands and don't exit **truffle development**:

    **truffle compile**
    
    **truffle migrate**
    
4) Inside **build/contracts** folder copy **IPFSInbox.json**

    **past IPFSInbox.json to folder --> client/src/**

5) Go to folder **client** and run command

    **npm install**
    
6) Run this command to start:

    **npm start**