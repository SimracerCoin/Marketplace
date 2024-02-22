import React from 'react';
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import STMarketplace from "./STMarketplace.json";
import SimracerCoin from "./SimracerCoin.json";
import SimthunderOwner from "./SimthunderOwner.json";
import SimracingMomentOwner from "./SimracingMomentOwner.json";
import STSetup from "./STSetup.json";
import STSkin from "./STSkin.json";
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
import CookieConsent, { getCookieConsentValue } from "react-cookie-consent";
import TagManager from 'react-gtm-module'

import "./css/App.css";


//var web3 = new Web3(Web3.givenProvider);

const allowAllWallets = process.env.REACT_APP_ALLOW_ALL_WALLETS === "true";
const NETWORK_ID = Number(process.env.REACT_APP_NETWORK_ID) || 137;
const NETWORK_URL = process.env.REACT_APP_NETWORK_URL;
const INFURA_ID = process.env.REACT_APP_INFURA_ID;
const tagManagerArgs = {
  gtmId: 'G-152H5MJ0P0'
}

//console.log('NETWORK_ID: ' + NETWORK_ID + ' NETWORK_URL: ' + NETWORK_URL + ' INFURA_ID: ' + INFURA_ID);
/**
 * console.log("connectWallet...");
        await web3.eth.getAccounts((err, accounts) => {
 */

// Tell Web3modal what providers we have available.
// Built-in web browser provider (only one can exist as a time)
// like MetaMask, Brave or Opera is added automatically by Web3modal
const providerOptions = {
    /* See Provider Options Section */

    walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID, // required
          rpc:  { NETWORK_ID: NETWORK_URL },
          chainId: NETWORK_ID
        }
      },
      torus: {
        package: Torus, // required
        options: {
          networkParams: {
            host: NETWORK_URL,
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
          rpc: NETWORK_URL, // Optional if `infuraId` is provided; otherwise it's required
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

console.log('providerOptions:', providerOptions);
  
const web3Modal = new Web3Modal({
    //network: "mainnet", // optional
    cacheProvider: true, // optional
    providerOptions // required
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allow_wallets: [],
      isLoggedIn: null,
      wrongNetwork: null,
      currentAccount:null,
      provider: null,
    }

    this.login = this.login.bind(this);
    this.checkCookiesAcceptance = this.checkCookiesAcceptance.bind(this);
  }

  checkCookiesAcceptance = () => {
    if(getCookieConsentValue()) {
      TagManager.initialize(tagManagerArgs);
    }
  }

  setWeb3Options = async () => {
    //set bigger timeouts (provided values according to the documentation examples)
    if(window.web3 && window.web3.eth) {
      // set the transaction block timeout (default is 50)
      window.web3.eth.transactionBlockTimeout = 150;
      // set the transaction polling timeout (default is 750) => 12.5 minutes
      window.web3.eth.transactionPollingTimeout = 1250;  //=> ~20 minutes
    }
  }

  getAccountInfo = async (provider) => {

    const me = this;
    const { allow_wallets } = this.state;

    let isLoggedIn = false;
    let currentAccount = null;
 
    await window.web3.eth.getAccounts(function (err, accounts) {
      if (err != null) {
        console.error("An error occurred: " + err);
      }
      else if (accounts.length !== 0) {
        isLoggedIn = true
        currentAccount = accounts[0];
        console.log('Accounts found: ', accounts);
        allow_wallets.push(currentAccount);

        me.setState({currentAccount, provider, allow_wallets, isLoggedIn });
      }
    });
  }

  //open web3Modal dialog to choose wallet provider
  connectWalletProvider = async () => {
    console.log("will login");
    try {
        //some weird bugs happen if we don´t clear the cache first (one is Metamask now opening if/when selected), other is not shwoing modal on Brave
        //web3Modal.clearCachedProvider()
        const provider = await web3Modal.connect();
        console.log("got wallet provider.. " + provider);
        return provider;
    } catch(e) {
        web3Modal.clearCachedProvider()
        console.error("Could not get a wallet connection", e);
        return null;
    }
  }

  componentDidMount = async () => {
    //if not set or evaluates to false
    const me = this;
    if(!allowAllWallets) {
      await fetch('/allow.json', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }).then(function (response) {
        return response.json();
      }).then(function (myJson) {
        me.setState({allow_wallets: myJson});
      });
    }

    if(localStorage.getItem("isWalletConnected") === "true")
      this.login();
    
    this.checkCookiesAcceptance();
  }

  componentWillUnmount = async () => {
    localStorage.setItem("isWalletConnected", "false");
  }

  render() {
    const { state } = this;

    if(state.allow_wallets.length === 0 && !allowAllWallets) {
      return (<div id="wait-div" className="spinner-outer"><div className="spinner"></div></div>)
    }
    if (state.isLoggedIn) {
      let web3 = window.web3;
      
      const drizzleOptions = {
        contracts: [
          {
            contractName: "STMarketplace",
            web3Contract: new web3.eth.Contract(STMarketplace.abi, STMarketplace.address)
          },
          {
            contractName: "STSetup",
            web3Contract: new web3.eth.Contract(STSetup.abi, STMarketplace.address)
          },
          {
            contractName: "STSkin",
            web3Contract: new web3.eth.Contract(STSkin.abi, STMarketplace.address)
          },
          {
            contractName: "SimracerCoin",
            web3Contract: new web3.eth.Contract(SimracerCoin.abi, SimracerCoin.address)
          },
          {
            contractName: "SimthunderOwner",
            web3Contract: new web3.eth.Contract(SimthunderOwner.abi, SimthunderOwner.address)
          },
          {
            contractName: "SimracingMomentOwner",
            web3Contract: new web3.eth.Contract(SimracingMomentOwner.abi, SimracingMomentOwner.address)
          }
          //,
          //{
          //  contractName: "Descartes",
          //  web3Contract: new web3.eth.Contract(Descartes.abi, Descartes.address, { data: Descartes.deployedBytecode })
          //}
        ],
        //web3: {
        //  customProvider: state.provider
        //}
      };

      const drizzle = new Drizzle(drizzleOptions);

      return (
        <DrizzleContext.Provider drizzle={drizzle}>
          <DrizzleContext.Consumer>
            {drizzleContext => {
              const { drizzle, drizzleState, initialized } = drizzleContext;
              /*if(state.currentAccount) {
                if(drizzleState.accounts.length > 0) {
                  drizzleState.accounts[0] = state.currentAccount;
                }
                else {
                  drizzleState.accounts.push(state.currentAccount);
                }
              }*/
              if (!initialized) {
                return (<div id="wait-div" className="spinner-outer"><div className="spinner"></div></div>)
              }

              if ( (allowAllWallets || state.allow_wallets.includes(drizzleState.accounts[0]) ) && !state.wrongNetwork) {
                return ([
                  <RouterPage drizzle={drizzle} drizzleState={drizzleState} />,
                  <CookieConsent 
                    enableDeclineButton
                    location="bottom"
                    style={{zIndex: 40000}}
                    buttonText="GOT IT!"
                    onAccept={this.checkCookiesAcceptance}>Our website uses cookies to ensure you get the best experience. By proceeding on our website you are consenting to the use of these cookies.</CookieConsent>
                ]
                )
              } else {
                return (
                  <Underconstruction isLoggedIn={state.isLoggedIn} wrongNetwork={state.wrongNetwork} login={this.login}/>
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
  
  login = async () => {

    let provider = this.state.provider;
    //if (typeof web3 !== 'undefined') {

    if(!provider) {
      provider = await this.connectWalletProvider() || Web3.givenProvider;
    }

    if(provider) {
        // Subscribe to accounts change
        provider.on("accountsChanged", (accounts) => {
          console.log("accountsChanged", accounts);
          window.location.reload()
        });
                          
        // Subscribe to chainId change
        provider.on("chainChanged", (chainId) => {
            console.log("chainChanged",chainId);
        });
                          
        // Subscribe to provider connection
        provider.on("connect", (info) => { //{ chainId: number }
            console.log("provider connect", info);
            localStorage.setItem("isWalletConnected", "true")
            //return given provider to main initialization sequence
        });
                          
        // Subscribe to provider disconnection
        provider.on("disconnect", (error) => {//: { code: number; message: string }
            console.log("disconnect", error);
            localStorage.setItem("isWalletConnected", "false")
        });

        window.web3 = new Web3(provider);

        await this.setWeb3Options();
        await this.getAccountInfo(provider).then(() => localStorage.setItem("isWalletConnected", "true"));
    }
  }
  //}
}

export default App;
