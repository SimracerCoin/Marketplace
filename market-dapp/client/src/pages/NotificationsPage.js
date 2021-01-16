import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from "react-router";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

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
        const notificationsIds = await contract.methods.listNotificationsPerUser(currentAccount).call();
        
        console.log(currentAccount);
        console.log(notificationsIds);
        
        const notifications = await contract.methods.getNotifications(notificationsIds).call();
        const purchases = [];

        for (const [index, value] of notifications.entries()) {
            let purchase = await contract.methods.getPurchase(value.purchaseId).call();
            purchases.push(purchase);
        }

        this.setState({ listNotifications: notifications, listNotificationsIds: notificationsIds, listPurchases: purchases, currentAccount: currentAccount, contract: contract });
    }

    archiveNotification = async (event,notificationId) => {
        event.preventDefault();

        await this.state.contract.methods.archiveNotification(notificationId).call();
    }

    //
    // ===== seller methods =====
    //
    acceptPurchase = async (event, purchaseId, senderId) => {
        event.preventDefault();

        await this.state.contract.methods.newNotification(purchaseId, "Thank you for your purchase. Please check item.", this.state.currentAccount, senderId, 1).send();

        alert("Buyer will be notified");
    }

    resolvePurchase = async (event, purchaseId, senderId) => {
        event.preventDefault();

        alert("Solve challenge");
    }
    // =========================

    //
    // ==== buyer methods ======
    //
    acceptItem = async (purchaseId, senderId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was accepted", this.state.currentAccount, senderId, 3).send();
        
        alert('Thank you for your purchase!');
    }

    rejectItem = async (purchaseId, senderId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was challenged", this.state.currentAccount, senderId, 2).send();
        
        alert('Seller will be notified.');
    }

    endPurchase = async (event, purchaseId, senderId) => {
        event.preventDefault();

        // TODO: download file url
        alert('Download you file at https://ipfs.io/ipfs/');

        confirmAlert({
            title: 'Review purchased item',
            message: 'Review the purchased item and accept it or challenge the purchase if you found any issue. Purchase will be automatically accepted if not challenged within 10 minutes.',
            buttons: [
                {
                    label: 'Accept',
                    onClick: () => this.acceptItem(purchaseId, senderId)
                },
                {
                    label: 'Reject/Challenge',
                    onClick: () =>  this.rejectItem(purchaseId, senderId)
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

                notifications.push(<tr>
                    <th scope="row">#{notificationId}</th>
                    <td>{new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}).format(value.date*1000)}</td>
                    <td><Link onClick={(e) => this.viewItem(e, purchase.adId)}>{purchase.adId}</Link></td>
                    <td>{value.message}</td>
                    <td>
                    {value.nType == 1 ?
                        <Link onClick={(e) => this.endPurchase(e,value.purchaseId,value.sender)}><i class="fas fa-reply"></i></Link> :
                     value.nType == 3 ? '' :
                        <Link onClick={(e) => (value.nType == 0 ? this.acceptPurchase(e,value.purchaseId,value.sender) : this.resolvePurchase(e,value.purchaseId,value.sender))}><i class="fas fa-reply"></i></Link>}
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