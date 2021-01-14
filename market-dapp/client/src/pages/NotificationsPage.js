import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from "react-router";

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
        const notificationsIds = await contract.methods.listNotificationsPerSeller(this.state.drizzleState.accounts[0]).call();
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

        await this.state.contract.methods.archiveNotification(notificationId).send();
    }

    acceptPurchase = async (event,purchaseId) => {
        event.preventDefault();

        await this.state.contract.methods.newNotification(purchaseId, "Thank you for your purchase.", 1).send({ from: this.state.currentAccount });

        alert("Buyer will be notified");
    }

    resolvePurchase = async (event,purchaseId) => {
        event.preventDefault();

        alert("Solve challenge");
    }

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
                    <td>{new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit'}).format(value.date)}</td>
                    <td><Link onClick={(e) => this.setState(e, purchase.adId)}>{purchase.adId}</Link></td>
                    <td>{value.message}</td>
                    <td>
                    {value.sender == this.state.currentAccount || value.nType == 1 || value.nType == 3 ? '' :
                        <Link onClick={(e) => (value.nType == 0 ? this.acceptPurchase(e,value.purchaseId) : this.resolvePurchase(e,value.purchaseId))}><i class="fas fa-reply"></i></Link>}
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