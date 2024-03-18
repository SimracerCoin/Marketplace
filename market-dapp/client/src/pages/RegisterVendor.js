import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import UIHelper from "../utils/uihelper";

class RegisterVendor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            contract: null,
            currentAccount: "",
            isVendor: false
        }
    }

    componentDidMount = async () => {
        const { drizzle, drizzleState } = this.props;

        const contract = await drizzle.contracts.STMarketplace;
        const currentAccount = await drizzleState.accounts[0];
        const isVendor = await UIHelper.callWithRetry(contract.methods.isVendor(currentAccount));
        
        this.setState({ contract, currentAccount, isVendor });
    }

    registerVendor = async (event) => {
        event.preventDefault();

        await this.state.contract.methods.saveVendor(this.state.currentAccount).send({ from: this.state.currentAccount });
        this.setState({ isVendor: true })
    }

    render() {
        let vendor = "";

        if (this.state.isVendor === false) {
            vendor = (<Button onClick={this.registerVendor}>Register Vendor</Button>)
        } else {
            vendor = ("You already are vendor!")
        }
        return (
            <div>
                <h1>Register as Vendor</h1>
                {vendor}
            </div>

        )
    }
}

export default RegisterVendor;