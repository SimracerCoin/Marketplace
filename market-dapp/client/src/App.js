import React from 'react';
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import STMarketplace from "./STMarketplace.json";
import SimthunderOwner from "./SimthunderOwner.json"
import Descartes from "./Descartes.json";
import Underconstruction from "./pages/Underconstruction";
import RouterPage from "./pages/RouterPage";
import Web3 from "web3";


import "./css/App.css";

//var web3 = new Web3(Web3.givenProvider);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allow_wallets: []
    }

    this.login = this.login.bind(this);
  }

  componentDidMount = async () => {
    var allow_wallets = [];

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

    let isLoggedIn = false;
    if(typeof web3 !== 'undefined') {
      window.web3 = new Web3(Web3.givenProvider);

      await window.web3.eth.getAccounts(function(err, accounts) {
          if (err != null) console.error("An error occurred: "+err);
          else if (accounts.length != 0) isLoggedIn = true;
      });
    }

    this.setState({ allow_wallets: allow_wallets, isLoggedIn: isLoggedIn });
  }

  login() {
    this.setState({
      isLoggedIn: true
    })
  }

  render() {
    const { state } = this;

    if (state.isLoggedIn) {
      let web3 = window.web3;

      const drizzleOptions = {
        contracts: [
          {
            contractName: "STMarketplace",
            web3Contract: new web3.eth.Contract(STMarketplace.abi, STMarketplace.address, { data: STMarketplace.deployedBytecode })
          },
          {
            contractName: "SimthunderOwner",
            web3Contract: new web3.eth.Contract(SimthunderOwner.abi, SimthunderOwner.address, { data: SimthunderOwner.deployedBytecode })
          },
          {
            contractName: "Descartes",
            web3Contract: new web3.eth.Contract(Descartes.abi, Descartes.address, { data: Descartes.deployedBytecode })
          }
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

              if (state.allow_wallets.includes(drizzleState.accounts[0])) {
                return (
                  <RouterPage drizzle={drizzle} drizzleState={drizzleState} />
                )
              } else {
                return (
                  <Underconstruction isLoggedIn={state.isLoggedIn} />
                )
              }
            }}
          </DrizzleContext.Consumer>
        </DrizzleContext.Provider>
      );
    }

    return (
      <Underconstruction isLoggedIn={state.isLoggedIn} login={this.login} />
    )
  }
}

export default App;
