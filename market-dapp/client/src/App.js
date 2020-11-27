import React, { Component } from 'react';
import './App.css';
import ipfs from './ipfs';
import IPFSInboxContract from "./IPFSInbox.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "@truffle/contract";
import BigNumber from "bignumber.js";

class App extends Component {

  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      web3: null,
      accounts: null,
      currentAccount: null,
      contract: null,
      ipfsHash: null,
      listItems: null,
      formIPFS: "",
      formAddress: "",
      filePrice: "",
      receivedIPFS: ""
    }

    this.handleChangeAddress = this.handleChangeAddress.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.handleReceiveIPFS = this.handleReceiveIPFS.bind(this);
    this.handleChangeIPFS = this.handleChangeIPFS.bind(this);
    this.handleChangeFilePrice = this.handleChangeFilePrice.bind(this);
  };


  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const currentAccount = accounts[0];
      const contract = await truffleContract(IPFSInboxContract);
      contract.setProvider(web3.currentProvider);
      const instance = await contract.deployed();

      instance.inboxResponse()
        .on('data', result => {
          this.setState({ receivedIPFS: result.args[0] })
        });

      this.setState({ web3, accounts, currentAccount, contract: instance }, this.runExample);

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  // BELOW ADDED
  handleChangeAddress(event) {
    this.setState({ formAddress: event.target.value });
  }

  handleChangeIPFS(event) {
    this.setState({ formIPFS: event.target.value });
  }

  handleChangeFilePrice(event) {
    this.setState({ filePrice: event.target.value });

  }

  handleSend(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]
    const price = new BigNumber(this.state.filePrice)

    document.getElementById('new-notification-form').reset()
    this.setState({ showNotification: true });
    contract.saveIPFS(this.state.currentAccount, this.state.formIPFS, price, { from: account })
      .then(result => {
        this.setState({ formAddress: "" });
        this.setState({ formIPFS: "" });
        this.setState({ filePrice: "" });
      })
  }

  handleReceiveIPFS(event) {
    event.preventDefault();
    const contract = this.state.contract
    const account = this.state.accounts[0]
    contract.checkInbox({ from: account })
  }

  convertToBuffer = async (reader) => {
    //file is converted to a buffer for upload to IPFS
    const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
    this.setState({ buffer });
  };

  captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)
  };

  onIPFSSubmit = async (event) => {
    event.preventDefault();

    //bring in user's metamask account address
    const accounts = this.state.accounts;

    console.log('Sending from Metamask account: ' + accounts[0]);


    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 

    const response = await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err, ipfsHash);
      //setState by setting ipfsHash to ipfsHash[0].hash 
      //this.setState({ ipfsHash: ipfsHash[0].hash });

    })

    console.log(response)
    console.log(response.path)
    this.setState({ ipfsHash: response.path })
  };


  getItems = async (event) => {
    event.preventDefault();

    const items = await this.state.contract.getItems({ from: this.state.currentAccount })

    console.log("Items: " + items);
  }



  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h2> Add file to IPFS </h2>
        <form id="ipfs-hash-form" className="scep-form" onSubmit={this.onIPFSSubmit}>
          <input
            type="file"
            onChange={this.captureFile}
          />
          <button type="submit">Send It</button>
        </form>
        <p> The IPFS hash is: {this.state.ipfsHash}</p>
        <h2>Send notifications here </h2>
        <form id="new-notification-form" className="scep-form" onSubmit={this.handleSend}>
          <label>
            Vendor Address: {this.state.currentAccount}
            {/* <input type="text" value={this.state.value} onChange={this.handleChangeAddress} /> */}
          </label>
          <br></br>
          <br></br>
          <label>
            IPFS Address:
              <input type="text" onChange={this.handleChangeIPFS} />
          </label>
          <br></br>
          <br></br>
          <label>
            File Price:
              <input type="text" onChange={this.handleChangeFilePrice} />
          </label>
          <br></br>
          <br></br>
          <input type="submit" value="Submit" />
        </form>
        <h2>Receive Notifications </h2>
        <button onClick={this.handleReceiveIPFS}>Receive IPFS</button>
        <p>{this.state.receivedIPFS}</p>
      </div>
    );
  }
}


export default App;
