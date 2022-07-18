import React from 'react';
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import STMarketplace from "./STMarketplace.json";
import SimracerCoin from "./SimracerCoin.json";
import SimthunderOwner from "./SimthunderOwner.json"
//import Descartes from "./Descartes.json";
import Underconstruction from "./pages/Underconstruction";
import RouterPage from "./pages/RouterPage";
import Web3 from "web3";


import "./css/App.css";


//var web3 = new Web3(Web3.givenProvider);

var NETWORK_ID = 4;

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
      window.web3 = new Web3(Web3.givenProvider);

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
