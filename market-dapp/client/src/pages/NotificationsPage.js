import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from "react-router";
import { confirmAlert } from 'react-confirm-alert';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import 'react-confirm-alert/src/react-confirm-alert.css';

const openpgp = require('openpgp');

class NotificationsPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listNotifications: [],
        }
    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace
        const currentAccount = this.state.drizzleState.accounts[0];
        const notificationsIds = await contract.methods.listNotificationsPerUser(currentAccount).call()
        const notifications = await contract.methods.getNotifications(notificationsIds).call();
        
        const purchasesIds = [];
        for (const [index, value] of notifications.entries()) {
            purchasesIds.push(value.purchaseId);
        }

        const purchases = await contract.methods.getPurchases(purchasesIds).call();

        const adsIds = [];
        for (const [index, value] of purchases.entries()) {
            adsIds.push(value.adId);
        }

        const ads = await contract.methods.getAds(purchasesIds).call();

        this.setState({ listNotifications: notifications, listNotificationsIds: notificationsIds, listPurchases: purchases, listAds: ads, currentAccount: currentAccount, contract: contract });
    }

    archiveNotification = async (event,notificationId) => {
        event.preventDefault();

        await this.state.contract.methods.archiveNotification(notificationId).send({ from: this.state.currentAccount });
    }

    //
    // ===== seller methods =====
    //
    acceptPurchase = async (event, purchaseId, buyerKey) => {
        event.preventDefault();

        const password = await Prompt('Password to decrypt');

        const encrypted = await openpgp.encrypt({
            message: openpgp.message.fromText(password),                      // input as Message object
            publicKeys: (await openpgp.key.readArmored(this.state.drizzle.web3.utils.hexToAscii(buyerKey))).keys,   // for encryption
        });
        const encryptedDataKey = this.state.drizzle.web3.utils.asciiToHex(encrypted.data); // ReadableStream containing '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

        await this.state.contract.methods.acceptPurchase(purchaseId, encryptedDataKey).send({ from: this.state.currentAccount });

        alert("Buyer will be notified");
    }

    resolvePurchase = async (event, purchaseId) => {
        event.preventDefault();

        alert("Solve challenge");
    }
    // =========================

    //
    // ==== buyer methods ======
    //
    acceptItem = async (purchaseId) => {

        await this.state.contract.methods.finalizePurchase(purchaseId).send({ from: this.state.currentAccount });

        alert('Thank you for your purchase!');
    }

    rejectItem = async (purchaseId) => {

        // TODO:
        const privateKey = this.state.drizzle.web3.utils.hexToAscii(localStorage.getItem('pk'))

        await this.state.contract.methods.challengePurchase(purchaseId, privateKey).send({ from: this.state.currentAccount });

        alert('Seller will be notified.');
    }

    endPurchase = async (event, purchaseId, ipfsHash, buyerKey, encryptedDataKey) => {
        event.preventDefault();

        console.log(encryptedDataKey);

        const ipfsPath = this.state.drizzle.web3.utils.toAscii(ipfsHash);

        const file = await ipfs.get(ipfsPath);

        const privateKey = this.state.drizzle.web3.utils.hexToAscii(localStorage.getItem('pk'));

        const decrypted = await openpgp.decrypt({
            message: await openpgp.message.readArmored(this.state.drizzle.web3.utils.hexToAscii(encryptedDataKey)),       // parse armored message
            publicKeys: (await openpgp.key.readArmored(this.state.drizzle.web3.utils.hexToAscii(buyerKey))).keys,         // for verification (optional)
            privateKeys: [privateKey]                                           // for decryption
        });
        const password = await openpgp.stream.readToEnd(decrypted.data);

        
        const { data: decryptedFile } = await openpgp.decrypt({
            message: await openpgp.message.read(file),      // parse encrypted bytes
            passwords: [password],                          // decrypt with password
            format: 'binary'                                // output as Uint8Array
        });

        var data = new Blob([decryptedFile]);
        var csvURL = window.URL.createObjectURL(data);
        var tempLink = document.createElement('a');
        tempLink.href = csvURL;
        tempLink.setAttribute('download', 'setup');
        tempLink.click();

        // TODO: download file url
        //alert('Download you file at https://ipfs.io/ipfs/' + ipfsPath);

        confirmAlert({
            title: 'Review purchased item',
            message: 'Review the purchased item and accept it or challenge the purchase if you found any issue. Purchase will be automatically accepted if not challenged within 10 minutes.',
            buttons: [
                {
                    label: 'Accept',
                    onClick: () => this.acceptItem(purchaseId)
                },
                {
                    label: 'Reject/Challenge',
                    onClick: () =>  this.rejectItem(purchaseId)
                }
            ]
        });
    }
    // =========================

    viewItem = async (event, itemId) => {
        event.preventDefault();

        this.setState({
            redirectBuyItem: true,
            selectedItemId: itemId
        });
    }

    render() {
        let notifications = [];

        if (this.state.listNotifications != null) {
            for (const [index, value] of this.state.listNotifications.entries()) {
                let notificationId = this.state.listNotificationsIds[index];
                let purchase = this.state.listPurchases[index];
                let ad = this.state.listAds[index];

                notifications.push(<tr>
                    <th scope="row">#{notificationId}</th>
                    <td>{new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}).format(value.date*1000)}</td>
                    <td><Link onClick={(e) => this.viewItem(e, purchase.adId)}>{purchase.adId}</Link></td>
                    <td>{value.message}</td>
                    <td>
                    {value.nType == 1 ?
                        <Link onClick={(e) => this.endPurchase(e,value.purchaseId,ad.ipfsPath,purchase.buyerKey,purchase.encryptedDataKey)}><i class="fas fa-reply"></i></Link> :
                     value.nType == 3 ? '' :
                        <Link onClick={(e) => (value.nType == 0 ? this.acceptPurchase(e,value.purchaseId,purchase.buyerKey) : this.resolvePurchase(e,value.purchaseId))}><i class="fas fa-reply"></i></Link>}
                    </td>
                </tr>)
            }
        }

        return (<header className="header">
            <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                <div id="latest-container" className="container">
                    <div className="center-text">
                        <h1>Notifications</h1>
                    </div>
                    <div>
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Item</th>
                                    <th scope="col">Message</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications}
                            </tbody>
                        </table>                    
                    </div>
                </div>
            </section>
        </header>);
    }

}

export default withRouter(NotificationsPage);