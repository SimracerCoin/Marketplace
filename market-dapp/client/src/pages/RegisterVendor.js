import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

class RegisterVendor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            contract: null,
            currentAccount: "",
            isVendor: false
        }
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.IPFSInbox;
        const currentAccount = await this.state.drizzleState.accounts[0];
        const isVendor = await contract.methods.isVendor(currentAccount).call();
        
        this.setState({ contract, currentAccount, isVendor });
    }

    registerVendor = async (event) => {
        event.preventDefault();
        const response = await this.state.contract.methods.saveVendor(this.state.currentAccount).send({ from: this.state.currentAccount });
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