import React from 'react';
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import STMarketplace from "./STMarketplace.json";
import SimracerCoin from "./SimracerCoin.json";
import SimthunderOwner from "./SimthunderOwner.json"
import SimracingMomentOwner from "./SimracingMomentOwner.json"
//import Descartes from "./Descartes.json";
import Underconstruction from "./pages/Underconstruction";
import RouterPage from "./pages/RouterPage";
import Web3 from "web3";

//web3 login stuff
import Web3Modal from "web3modal";
//wallet providers
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import WalletLink from "walletlink";

import "./css/App.css";


//var web3 = new Web3(Web3.givenProvider);

var NETWORK_ID = Number(process.env.REACT_APP_NETWORK_ID) || 137;
const INFURA_ID = "af8deeef6ddf41fb816e3403139f00b3";

// Tell Web3modal what providers we have available.
// Built-in web browser provider (only one can exist as a time)
// like MetaMask, Brave or Opera is added automatically by Web3modal
const providerOptions = {
    /* See Provider Options Section */

    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID, // required
          rpc:  { NETWORK_ID: process.env.NETWORK_URL },
          chainId: NETWORK_ID
        }
      },
      torus: {
        package: Torus, // required
        options: {
          networkParams: {
            host: process.env.NETWORK_URL,
            chainId: NETWORK_ID, // optional
            networkId: NETWORK_ID // optional
          }
        }
      },
      walletlink: {
        package: WalletLink, // Required
        options: {
          appName: "Simthunder", // Required
          infuraId: INFURA_ID, // Required unless you provide a JSON RPC url; see `rpc` below
          rpc: process.env.NETWORK_URL, // Optional if `infuraId` is provided; otherwise it's required
          chainId: NETWORK_ID, // Optional. It defaults to 1 if not provided
          //appLogoUrl: null, // Optional. Application logo image URL. favicon is used if unspecified
          //darkMode: false // Optional. Use dark theme, defaults to false
        }
      },
      //venly: {
      //  package: Venly, // required (previously Arkane network)
      //  options: {
      //  clientId: process.env.VENLY_CLIENT_ID // required VENLY_CLIENT_ID,"Testaccount" for their staging env
      //  }
     //}
  };
  
const web3Modal = new Web3Modal({
    //network: "mainnet", // optional
    cacheProvider: false, // optional
    providerOptions // required
});


//open web3Modal dialog to choose wallet provider
async function connectWalletProvider() {
    
    let provider = null;
    try {
        //some weird bugs happen if we don´t clear the cache first (one is Metamask now opening if/when selected), other is not shwoing modal on Brave
        web3Modal.clearCachedProvider()
        provider = await web3Modal.connect();
        console.log("got wallet provider.. " + provider);
        return provider;
    } catch(e) {
        console.log("Could not get a wallet connection", e);
        return null;
    }

}

const allowAllWallets = (process.env.REACT_APP_ALLOW_ALL_WALLETS == "true" ? true : false);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allow_wallets: [],
      isLoggedIn: null,
      wrongNetwork: null
    }

    this.login = this.login.bind(this);
  }

  componentDidMount = async () => {
    var allow_wallets = [];

    //if not set or evaluates to false
    if(!allowAllWallets) {

      await fetch('/allow.json', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).then(function (response) {
        return response.json();
      }).then(function (myJson) {
        allow_wallets = myJson;
      });
    }

    

    let isLoggedIn = false;
    let networkId = 0;
    if (typeof web3 !== 'undefined') {

      let provider = await connectWalletProvider();

      if(provider) {

          // Subscribe to accounts change
          provider.on("accountsChanged", (accounts) => {
            console.log("accountsChanged", accounts);
          });
                            
          // Subscribe to chainId change
          provider.on("chainChanged", (chainId) => {
              console.log("chainChanged",chainId);
          });
                            
          // Subscribe to provider connection
          provider.on("connect", (info) => { //{ chainId: number }
              console.log("provider connect", info);
              //return given provider to main initialization sequence
          });
                            
          // Subscribe to provider disconnection
          provider.on("disconnect", (error) => {//: { code: number; message: string }
              console.log("disconnect", error);
          });
          window.web3 = new Web3(provider);
      } else {
        //defaukts to built-in Metamask
        window.web3 = new Web3(Web3.givenProvider);
      }

      


      //set bigger timeouts (provided values according to the documentation examples)
      if(window.web3 && window.web3.eth) {
        // set the transaction block timeout (default is 50)
        window.web3.eth.transactionBlockTimeout = 150;
        // set the transaction polling timeout (default is 750) => 12.5 minutes
        window.web3.eth.transactionPollingTimeout = 1250;  //=> ~20 minutes
      }

      //let networkname = await window.web3.eth.net.getNetworkType();
      networkId = await window.web3.eth.net.getId();
      //console.log('network: ' + networkname);
      console.log('network: ' + networkId);
      await window.web3.eth.getAccounts(function (err, accounts) {
        if (err != null) console.error("An error occurred: " + err);
        else if (accounts.length !== 0) isLoggedIn = true;
      });
    }

    this.setState({ allow_wallets: allow_wallets, isLoggedIn: isLoggedIn, wrongNetwork: (networkId !== NETWORK_ID) });
  }

  login() {
    this.setState({
      isLoggedIn: true
    })
  }

  render() {
    const { state } = this;

    if(state.allow_wallets.length === 0 && !allowAllWallets)
      return (<div id="wait-div" className="spinner-outer"><div className="spinner"></div></div>)

    if (state.isLoggedIn) {
      let web3 = window.web3;
      
      const drizzleOptions = {
        contracts: [
          {
            contractName: "STMarketplace",
            web3Contract: new web3.eth.Contract(STMarketplace.abi, STMarketplace.address, { data: STMarketplace.deployedBytecode })
          },
          {
            contractName: "SimracerCoin",
            web3Contract: new web3.eth.Contract(SimracerCoin.abi, SimracerCoin.address, { data: SimracerCoin.deployedBytecode })
          },
          {
            contractName: "SimthunderOwner",
            web3Contract: new web3.eth.Contract(SimthunderOwner.abi, SimthunderOwner.address, { data: SimthunderOwner.deployedBytecode })
          },
          {
            contractName: "SimracingMomentOwner",
            web3Contract: new web3.eth.Contract(SimracingMomentOwner.abi, SimracingMomentOwner.address, { data: SimracingMomentOwner.deployedBytecode })
          }
          //,
          //{
          //  contractName: "Descartes",
          //  web3Contract: new web3.eth.Contract(Descartes.abi, Descartes.address, { data: Descartes.deployedBytecode })
          //}
        ]
      };

      const drizzle = new Drizzle(drizzleOptions);

      return (
        <DrizzleContext.Provider drizzle={drizzle}>
          <DrizzleContext.Consumer>
            {drizzleContext => {
              const { drizzle, drizzleState, initialized } = drizzleContext;
              if (!initialized) {
                return (<div id="wait-div" className="spinner-outer"><div className="spinner"></div></div>)
              }

              if ( (allowAllWallets || state.allow_wallets.includes(drizzleState.accounts[0]) ) && !state.wrongNetwork) {
                return (
                  <RouterPage drizzle={drizzle} drizzleState={drizzleState} />
                )
              } else {
                return (
                  <Underconstruction isLoggedIn={state.isLoggedIn} wrongNetwork={state.wrongNetwork} />
                )
              }
            }}
          </DrizzleContext.Consumer>
        </DrizzleContext.Provider>
      );
    }

    return (
      <Underconstruction isLoggedIn={state.isLoggedIn} wrongNetwork={state.wrongNetwork} login={this.login} />
    )
  }
}

export default App;
