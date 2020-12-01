import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { withRouter } from "react-router";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import ipfs from "../ipfs";
const BufferList = require('bl/BufferList');

class ItemPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            itemId: props.location.state.selectedItemId,
            track: props.location.state.selectedTrack,
            simulator: props.location.state.selectedSimulator,
            season: props.location.state.selectedSeason,
            price: props.location.state.selectedPrice,
            car: props.location.state.selectedCarBrand,
            vendorAddress: props.location.state.vendorAddress,
            ipfsHash: props.location.state.ipfsHash,
            contract: null,
            currentAccount: "",
        }
        console.log(props)
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const currentAccount = this.state.drizzleState.accounts[0];
        this.setState({ currentAccount: currentAccount, contract: contract });
    }

    buyItem = async (event) => {
        event.preventDefault();

        const response = await this.state.contract.methods.purchaseRequest(this.state.itemId).send({ from: this.state.currentAccount });
        console.log(response);

        // const responseFile = await ipfs.get(this.state.ipfsHash);
        // for await (const file of ipfs.get(this.state.ipfsHash)) {
        //     console.log(file.path)
        //     console.log(file);
          
        //     const content = new BufferList()
        //     for await (const chunk of file.content) {
        //       content.append(chunk)
        //     }
        //     console.log(content.toString())
        //   }
        alert('Download you file at https://ipfs.io/ipfs/' + this.state.ipfsHash);

        confirmAlert({
            title: 'Review purchased item',
            message: 'Review the purchased item and accept it or challenge the purchase if you found any issue. Purchase will be automatically accepted if not challenged within 10 minutes.',
            buttons: [
              {
                label: 'Accept',
                onClick: () => alert('Thank you for your purchase!')
              },
              {
                label: 'Reject/Challenge',
                onClick: () => alert('Seller will be notified.')
              }
            ]
          });
    }

    render() {

        let item = ""
        let toRender;

        if (this.state.track == null || this.state.season == null) {
            item = "Skin"
            toRender = (
                <div>
                    <div><b>Seller:</b> {this.state.vendorAddress}</div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Price:</b> {this.state.price}</div>
                </div>
            )
        } else {
            item = "Car Setup"
            toRender = (
                <div>
                    <div><b>Seller:</b> {this.state.vendorAddress}</div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Track:</b> {this.state.track}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Season:</b> {this.state.season}</div>
                    <div><b>Price:</b> {this.state.price}</div>
                </div>
            )
        }

        return (
            <div>
                <h1>Buy {item}</h1>
                <br></br>
                {toRender}
                <br></br>
                <Button onClick={this.buyItem}>Buy Item</Button>
            </div>

        )
    }
}

export default withRouter(ItemPage);