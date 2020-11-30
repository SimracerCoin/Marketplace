import React, { Component } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Redirect } from "react-router-dom";

import "../css/mainpage.css";

class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedPrice: "",
            selectedCarBrand: "",
            vendorAddress: "",
        }

    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace
        const response_cars = await contract.methods.getCarSetups().call();
        const response_skins = await contract.methods.getSkins().call();
        this.setState({ listCars: response_cars, listSkins: response_skins });
    }


    buyItem = async (event, itemId, track, simulator, season, price, carBrand, address) => {
        event.preventDefault();

        this.setState({
            redirectBuyItem: true,
            selectedItemId: itemId,
            selectedTrack: track,
            selectedSimulator: simulator,
            selectedSeason: season,
            selectedPrice: price,
            selectedCarBrand: carBrand,
            vendorAddress: address
        });
    }


    render() {

        const cars = [];
        const skins = [];

        if (this.state.redirectBuyItem == true) {
            return (<Redirect
                to={{
                    pathname: "/item",
                    state: {
                        selectedItemId: this.state.selectedItemId,
                        selectedTrack: this.state.selectedTrack,
                        selectedSimulator: this.state.selectedSimulator,
                        selectedSeason: this.state.selectedSeason,
                        selectedPrice: this.state.selectedPrice,
                        selectedCarBrand: this.state.selectedCarBrand,
                        vendorAddress: this.state.vendorAddress,
                    }
                }}
            />)
        }

        if (this.state.listCars != null || this.state.listSkins != null) {

            for (const [index, value] of this.state.listCars.entries()) {
                let carBrand = value.carBrand
                let track = value.track
                let simulator = value.simulator
                let season = value.season
                let price = value.price
                let address = value._address
                let itemId = value.itemId
                cars.push(
                    <ListGroup.Item key={index}>
                        <Card className="card-block" key={index}>
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>Track:</b> {track}</div>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Season:</b> {season}</div>
                                    <div><b>Price:</b> {price}</div>
                                    {/* <div><b>Vendor address:</b> {address}</div> */}
                                </Card.Text>
                                <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, price, carBrand, address)}> Buy</Button>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }

            for (const [index, value] of this.state.listSkins.entries()) {
                let carBrand = value.carBrand
                let simulator = value.simulator
                let price = value.price
                let address = value._address
                let itemId = value.itemId
                skins.push(
                    <ListGroup.Item key={index}>
                        <Card className="card-block">
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Price:</b> {price}</div>
                                    {/* <div><b>Vendor address:</b> {address}</div> */}
                                </Card.Text>
                                <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, price, carBrand , address)}> Buy</Button>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }
        }

        return (
            <div>
                <div className="center-text">
                    <h1 >Welcome to Simthunder!</h1>
                    <h2 >The largest marketplace for sim racing assets</h2>
                    <h5> Buy, sell, discover, and trade sim racing goods</h5>
                </div>
                <div>
                    <h4>Latest Car Setups</h4>
                </div>
                <div>
                    <ListGroup className="list-group list-group-horizontal scrolling-wrapper">
                        {cars}
                    </ListGroup>

                </div>
                <br></br>
                <div>
                    <h4>Latest Car Skins</h4>
                </div>
                <div>
                    <ListGroup className="list-group list-group-horizontal scrolling-wrapper">
                        {skins}
                    </ListGroup>
                </div>
                <br>
                </br>
            </div>
        );
    }
}

export default MainPage;