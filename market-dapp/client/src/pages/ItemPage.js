import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import { withRouter } from "react-router";

class ItemPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            track: props.location.state.selectedTrack,
            simulator: props.location.state.selectedSimulator,
            season: props.location.state.selectedSeason,
            price: props.location.state.selectedPrice,
            car: props.location.state.selectedCarBrand,
            contract: null,
            currentAccount: "",
        }
        console.log(props)
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.IPFSInbox;
        const currentAccount = this.state.drizzleState.accounts[0];

    }

    buyItem = async (event) => {
        event.preventDefault();

        alert("Congratulations!")
    }

    render() {

        let item = ""
        let toRender;

        if (this.state.track == null || this.state.season == null) {
            item = "Skin"
            toRender = (
                <div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Price:</b> {this.state.price}</div>
                </div>
            )
        } else {
            item = "Car Setup"
            toRender = (
                <div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Track:</b> {this.state.track}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Season:</b> {this.state.season}</div>
                    <div><b>Price:</b> {this.state.price}</div>
                </div>
            )
        }

        return (
            <div>
                <h1>Buy {item}</h1>
                <br></br>
                {toRender}
                <br></br>
                <Button onClick={this.buyItem}>Buy Item</Button>
            </div>

        )
    }
}

export default withRouter(ItemPage);