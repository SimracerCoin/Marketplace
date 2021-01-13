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
        const notificationsIds = await contract.methods.listNotificationsPerSeller(this.state.drizzleState.accounts[0]).call();
        const notifications = await contract.methods.getNotifications(notificationsIds).call();

        if (this.state.listNotifications != null) {
            for (const [index, value] of this.state.listNotifications.entries()) {
                let purchaseId = value.purchaseId
                let notificationId = this.state.listNotificationsIds[index];

                const purchase = await this.state.contract.methods.getPurchase(purchaseId).call();
            }
        }

        this.setState({ listNotifications: notifications, listNotificationsIds: notificationsIds, contract: contract });
    }

    archiveNotification = async (event,notificationId) => {
        event.preventDefault();

        await this.state.contract.methods.archiveNotification(notificationId).send();
    }

    render() {
        let notifications = [];

        if (this.state.listNotifications != null) {
            for (const [index, value] of this.state.listNotifications.entries()) {
                let purchaseId = value.purchaseId
                let notificationId = this.state.listNotificationsIds[index];

                const purchase = this.state.contract.methods.getPurchase(purchaseId).call();
                console.log(purchase);

                notifications.push(<tr>
                    <td>#{notificationId}</td>
                    <td>{purchase.date}</td>
                    <td>{purchase.adId}</td>
                    <td>{purchase.message}</td>
                    <td><Link onClick={(e) => this.archiveNotification(e,notificationId)}><i class="fas fa-archive"></i></Link></td>
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
                        <table>
                            <thead>
                                <tr>
                                    <th>Notification</th>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Message</th>
                                    <th></th>
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