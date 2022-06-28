import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from "react-router";
import { confirmAlert } from 'react-confirm-alert';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import 'react-confirm-alert/src/react-confirm-alert.css';
import { generateStore, EventActions } from '@drizzle/store'
import { ethers } from "ethers";
import UIHelper from "../utils/uihelper"

const openpgp = require('openpgp');
const BufferList = require('bl/BufferList');

// TODO: use addresses from config file of the Cartesi nodes that will participating
const claimer = '0xF393a9865cb4f1b68813359D5D282878d5d0BdE1';
const challenger = '0x3Ac21b20E16eF666Db34Ba208d7f67Aa8c5f6B0D';
const passphrase = process.env.REACT_APP_PASSPHRASE;

class NotificationsPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listNotifications: [],
            //listNotificationsIds: [],
            //listPurchases: [],
            //listAds: [],
            currentAccount: null
        }
    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        //const descartesContract = await this.state.drizzle.contracts.Descartes;
        const currentAccount = this.state.drizzleState.accounts[0];
        const notificationsIds = await contract.methods.listNotificationsPerUser(currentAccount).call()
        const notifications_r = await contract.methods.getNotifications(notificationsIds).call();

        let notifications = [];
        for (const [index, value] of notificationsIds.entries()) {
            notifications[index] = Object.assign({ "id": value }, notifications_r[index]);

            notifications[index].purchase = await contract.methods.getPurchase(notifications[index].purchaseId).call();
            notifications[index].ad = await contract.methods.getAd(notifications[index].purchase.adId).call();

            //purchasesIds.push(value.purchaseId);
        }

        // reverse sort by id
        notifications.sort((a, b) => b.date - a.date);

        //const purchases = await contract.methods.getPurchases(purchasesIds).call();


        //const adsIds = [];
        //for (const [index, value] of purchases.entries()) {
        //    adsIds.push(value.adId);
        // }

        //const ads = await contract.methods.getAds(purchasesIds).call();

        ////Descartes test:
        this.setState({ listNotifications: notifications, currentAccount: currentAccount, contract: contract /*, descartesContract: descartesContract*/ });

        //this.setState({ listNotifications: notifications, currentAccount: currentAccount, contract: contract });
    }

    archiveNotification = async (event, notificationId) => {
        event.preventDefault();

        await this.state.contract.methods.archiveNotification(notificationId).send({ from: this.state.currentAccount });
    }

    //
    // ===== seller methods =====
    //
    acceptPurchase = async (event, purchaseId, buyerKey) => {
        event.preventDefault();

        const password = await Prompt('Password to decrypt');

        if (!password) return;

        const encrypted = await openpgp.encrypt({
            message: openpgp.message.fromText(password),                      // input as Message object
            publicKeys: (await openpgp.key.readArmored(this.state.drizzle.web3.utils.hexToAscii(buyerKey))).keys,   // for encryption
        });
        const encryptedDataKey = this.state.drizzle.web3.utils.asciiToHex(encrypted.data); // ReadableStream containing '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

        await this.state.contract.methods.acceptPurchase(purchaseId, encryptedDataKey)
            .send({ from: this.state.currentAccount })
            .on('sent', UIHelper.showSpinning)
            .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                UIHelper.transactionOnConfirmation("Buyer will be notified", false);
            })
            .on('error', UIHelper.transactionOnError)
            .catch(function (e) { });
    }

    resolvePurchase = async (event, purchaseId, descartesId, buyer) => {
        event.preventDefault();

        let st = this.state.contract;
        let stateBack = this.state;

        let res = await st.methods.getResult(descartesId, purchaseId).call();

        console.log(res);

        if (res["1"]) {
            alert("Still validating. Please wait.");
            return;
        }

        if (!res["0"]) {
            alert("An unexpected error occurred. The Reject/Challenge needs to be done again.");
        } else {
            res = stateBack.drizzle.web3.utils.hexToAscii(res["3"]).slice(0, 1);

            if ("1" == res) {
                alert("The purchase was successfully validated. No refund was issued.");
            } else {
                alert("A refund was issued.");
            }

            //console.log("Buyer: ", buyer);
            //console.log("currentaccount: ", this.state.currentAccount);

            // if buyer, finalize purchase
            //if (buyer == this.state.currentAccount)
            //    await this.state.contract.methods.finalizePurchase(purchaseId, "1" == res).send({ from: this.state.currentAccount });
        }
    }
    // =========================

    //
    // ==== buyer methods ======
    //
    acceptItem = async (purchaseId) => {

        await this.state.contract.methods.finalizePurchase(purchaseId, true)
            .send({ from: this.state.currentAccount })
            .on('sent', UIHelper.showSpinning)
            .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                UIHelper.transactionOnConfirmation("Thank you for your purchase!");
            })
            .on('error', UIHelper.transactionOnError)
            .catch(function (e) { });
    }

    rejectItem = async (purchaseId, password, ipfsPath, ipfsSize, loggerRootHash) => {
        // TODO:
        //const privateKey = localStorage.getItem('bk');

        /*
        let st = this.state.contract;
        let stateBack = this.state;
        this.state.descartesContract.events.DescartesCreated({fromBlock: 0}, (error, event) => {
            console.log('error event');
            console.log(error, event);
        }).on('data', async function(event){
            console.log('data event');
            console.log(event);

            console.log('returnValue[0]: '+event.returnValues[0]);
            let result = await st.methods.getResult(event.returnValues[0]).call();
            console.log(result);

            //let verification = await st.methods.getResult(0).call();
            //console.log(verification);
            let verificationResult = result['3'];
            let verificationResultStr = stateBack.drizzle.web3.utils.hexToAscii(verificationResult);
            console.log(verificationResultStr);
            alert(verificationResultStr); 
        })
        .on('changed', function(event){
            console.log('changed event');
            console.log(event);
        })
        .on('error', console.error);*/

        //const ipfsPath = '/ipfs/QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk';
        //const loggerRootHash = '0x878c868df0c867cff5ad4fc7750600bb59981dcc6c3cf77c1e0447cb507b7812';

        const aDrive = {
            position: '0xa000000000000000',
            driveLog2Size: Math.ceil(Math.log2(ipfsSize)),
            directValue: ethers.utils.formatBytes32String(""),
            loggerIpfsPath: ethers.utils.hexlify(
                ethers.utils.toUtf8Bytes(ipfsPath.replace(/\s+/g, ""))
            ),
            loggerRootHash: loggerRootHash,
            waitsProvider: false,
            needsLogger: true,
            provider: claimer,
        };

        const pDrive = {
            position: '0xb000000000000000',
            driveLog2Size: 10,
            directValue: ethers.utils.formatBytes32String(password),
            loggerIpfsPath: ethers.utils.formatBytes32String(""),
            loggerRootHash: ethers.utils.formatBytes32String(""),
            waitsProvider: false,
            needsLogger: false,
            provider: claimer,
        }

        console.log(claimer, challenger, purchaseId, [aDrive, pDrive]);
        let verificationTx = await this.state.contract.methods.instantiateCartesiVerification(claimer, challenger, purchaseId, [aDrive, pDrive])
            .send({ from: this.state.currentAccount })
            .on('sent', UIHelper.showSpinning)
            .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                UIHelper.transactionOnConfirmation("The challenge will be completed in minutes. Please, check the status shortly.", false);
            })
            .on('error', UIHelper.transactionOnError)
            .catch(function (e) { });
    }

    endPurchase = async (event, purchaseId, adId, ipfsPath, buyerKey, encryptedDataKey, loggerRootHash) => {
        event.preventDefault();

        const content = new BufferList();
        const ipfsP = this.state.drizzle.web3.utils.hexToAscii(ipfsPath);

        let password;

        try {

            for await (const file of ipfs.get(ipfsP)) {
                for await (const chunk of file.content) {
                    content.append(chunk);
                }
            }

            const privateKeyArmored = this.state.drizzle.web3.utils.hexToAscii(localStorage.getItem('bk'));

            const privateKey = (await openpgp.key.readArmored([privateKeyArmored])).keys[0];
            await privateKey.decrypt(passphrase);

            const decrypted = await openpgp.decrypt({
                message: await openpgp.message.readArmored(this.state.drizzle.web3.utils.hexToAscii(encryptedDataKey)),       // parse armored message
                publicKeys: (await openpgp.key.readArmored(this.state.drizzle.web3.utils.hexToAscii(buyerKey))).keys,         // for verification (optional)
                privateKeys: [privateKey]                                             // for decryption
            });
            password = await openpgp.stream.readToEnd(decrypted.data);

            const { data: decryptedFile } = await openpgp.decrypt({
                message: await openpgp.message.read(content),      // parse encrypted bytes
                passwords: [password],                             // decrypt with password
                format: 'binary'                                   // output as Uint8Array
            });

            const isCarSetup = await this.state.contract.methods.isCarSetup(adId).call();

            var data = new Blob([decryptedFile]);
            var csvURL = window.URL.createObjectURL(data);
            var tempLink = document.createElement('a');
            tempLink.href = csvURL;
            tempLink.setAttribute('download', isCarSetup ? 'setup.sto' : 'skin.tga'); // has it isn't a car setup, it is a skin
            tempLink.click();

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
                        onClick: () => this.rejectItem(purchaseId, password, ipfsP, content.length, loggerRootHash)
                    }
                ]
            });
        } catch {

            confirmAlert({
                title: 'Error',
                message: 'Something went wrong while we were trying to obtain the file',
                buttons: [
                    {
                        label: 'Reject/Challenge',
                        onClick: () => this.rejectItem(purchaseId, password, ipfsP, content.length, loggerRootHash)
                    }
                ]
            });
        }

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
                let purchase = value.purchase;
                let ad = value.ad;

                notifications.push(<tr>
                    <th scope="row">#{value.id}</th>
                    <td>{new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(value.date * 1000)}</td>
                    <td><Link onClick={(e) => this.viewItem(e, purchase.adId)}>{purchase.adId}</Link></td>
                    <td>{value.message}</td>
                    <td>
                        {value.nType == 1 ?
                            <Link onClick={(e) => this.endPurchase(e, value.purchaseId, purchase.adId, ad.ipfsPath, purchase.buyerKey, purchase.encryptedDataKey, ad.encryptedDataHash)}><i className="fas fa-reply"></i></Link> :
                            value.nType == 3 || value.nType == 4 ? '' :
                                value.nType == 0 ?
                                    <Link onClick={(e) => this.acceptPurchase(e, value.purchaseId, purchase.buyerKey)}><i className="fas fa-reply"></i></Link> : <Link onClick={(e) => this.resolvePurchase(e, value.purchaseId, purchase.descartesIndex, purchase.buyer)}><i className="fas fa-info"></i></Link>}
                    </td>
                </tr>)
            }
        }

        return (<header className="header">
            <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
            <section className="content-section text-light br-n bs-c bp-c pb-8">
                <div id="latest-container" className="container">
                    <div className="center-text">
                        <h1>Notifications</h1>
                    </div>
                    <div>
                        <table className="table table-striped">
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