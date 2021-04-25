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

var web3 = new Web3(Web3.givenProvider);

console.log = function() {}
window.console = console;

const drizzleOptions = {
  contracts: [
    {
      contractName: "STMarketplace",
      web3Contract: new web3.eth.Contract(STMarketplace.abi, STMarketplace.address, { data: STMarketplace.deployedBytecode })
    },
    {
      contractName: "SimthunderOwner",
      web3Contract: new web3.eth.Contract(SimthunderOwner.abi, SimthunderOwner.address, {data: SimthunderOwner.deployedBytecode })
    },
    { 
      contractName: "Descartes",
      web3Contract: new web3.eth.Contract(Descartes.abi, Descartes.address, { data: Descartes.deployedBytecode })
    }
  ]
};

const drizzle = new Drizzle(drizzleOptions);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      allow_wallets: []
    }
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
    })
      .then(function (myJson) {
        allow_wallets = myJson;
      });

    this.setState({ allow_wallets: allow_wallets });
  }

  render() {
    const { state } = this;

    return (
      <DrizzleContext.Provider drizzle={drizzle}>
        <DrizzleContext.Consumer>
          {drizzleContext => {
            const { drizzle, drizzleState, initialized } = drizzleContext;

            if (!initialized) {
              return (<div className="spinner"></div>)
            }

            if (state.allow_wallets.includes(drizzleState.accounts[0])) {
              return (
                <RouterPage drizzle={drizzle} drizzleState={drizzleState} />
              )
            } else {
              return (
                <Underconstruction />
              )
            }
          }}
        </DrizzleContext.Consumer>
      </DrizzleContext.Provider>
    );
  }

}

export default App;
