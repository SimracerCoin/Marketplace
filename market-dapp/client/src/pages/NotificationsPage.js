import React, { Component } from 'react';
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
        const response_notifications = await contract.methods.getNotifications().call();
        this.setState({ listNotifications: response_notifications });
    }

    removeNotification = async (event) => {
        event.preventDefault();


    }

    render() {
        let notifications = [];

        if (this.state.listNotifications != null) {
            for (const [index, value] of this.state.listNotifications.entries()) {
                let address = value._address
                let date = value.date
                let itemId = value.itemId

                notifications.push(<tr>
                    <td>{date}</td>
                    <td>{itemId}</td>
                    <td>{address}</td>
                    <td><Link onClick={(e) => this.removeNotification(e)}><i class="fas fa-times"></i></Link></td>
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
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Address</th>
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