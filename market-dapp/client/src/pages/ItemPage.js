import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { withRouter } from "react-router";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import ipfs from "../ipfs";
const BufferList = require('bl/BufferList');

const openpgp = require('openpgp');

const priceConversion = 10 ** 18;

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

    /*
    acceptItem = async (purchaseId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was accepted", this.state.vendorAddress, 3).send({ from: this.state.currentAccount });
        
        alert('Thank you for your purchase!');
    }

    rejectItem = async (purchaseId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was challenged", this.state.vendorAddress, 2).send({ from: this.state.currentAccount });
        
        alert('Seller will be notified.');
    }
    */

    buyItem = async (event) => {
        event.preventDefault();

        // TODO: buyer public key
        //const buyerPK = this.state.drizzle.web3.utils.hexToBytes(this.state.drizzle.web3.utils.randomHex(16));
        //console.log('Item price:' + this.state.price);

        let buyerKey = localStorage.getItem('ak');
        console.log(buyerKey);
        if (!buyerKey) {
            const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
                userIds: [{ name: this.state.currentAccount }],             // you can pass multiple user IDs
                curve: 'p256',                                              // ECC curve name
                passphrase: 'garlic stress stumble dislodge copier shortwave cucumber extrude rebuff spearman smile reward'           // protects the private key
            });

            buyerKey = this.state.drizzle.web3.utils.asciiToHex(publicKeyArmored);

            localStorage.setItem('ak', buyerKey);
            localStorage.setItem('bk', this.state.drizzle.web3.utils.asciiToHex(privateKeyArmored));
        }

        await this.state.contract.methods.requestPurchase(this.state.itemId, buyerKey).send({ value: this.state.price, from: this.state.currentAccount });

        /*
        console.log(response);
        console.log(this.state.vendorAddress);
        
        const notification = await this.state.contract.methods.newNotification(response.events.PurchaseRequested.returnValues.purchaseId, "Purchase was requested", this.state.currentAccount, this.state.vendorAddress, 0).send();
        
        console.log(notification);*/
        alert("Thank you for wanting to purchase. Seller contact you sooner.");

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
        /*
        alert('Download you file at https://ipfs.io/ipfs/' + this.state.ipfsHash);

        confirmAlert({
            title: 'Review purchased item',
            message: 'Review the purchased item and accept it or challenge the purchase if you found any issue. Purchase will be automatically accepted if not challenged within 10 minutes.',
            buttons: [
                {
                    label: 'Accept',
                    onClick: () => this.acceptItem(response.events.PurchaseRequested.returnValues.purchaseId)
                },
                {
                    label: 'Reject/Challenge',
                    onClick: () =>  this.rejectItem(response.events.PurchaseRequested.returnValues.purchaseId)
                }
            ]
        });*/
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
                    <div><b>Price:</b> {this.state.price / priceConversion}</div>
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
                    <div><b>Price:</b> {this.state.price / priceConversion}</div>
                </div>
            )
        }

        return (
            <header className="header">
                <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                    <div className="container">
                        <h1>Buy {item}</h1>
                        <br></br>
                        {toRender}
                        <br></br>
                        <Button onClick={this.buyItem}>Buy Item</Button>
                    </div>
                </section>
            </header>

        )
    }
}

export default withRouter(ItemPage);