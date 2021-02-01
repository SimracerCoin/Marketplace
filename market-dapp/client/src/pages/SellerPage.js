import React, { Component } from 'react';

class SellerPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            currentAccount: null
        }
    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace
        const currentAccount = this.state.drizzleState.accounts[0];
        const response_cars = await contract.methods.getCarSetups().call();
        const response_skins = await contract.methods.getSkins().call();
        this.setState({ listCars: response_cars, listSkins: response_skins });
    }

    render() {
    }
}