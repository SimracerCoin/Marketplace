import React, { Component } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import { Redirect } from "react-router-dom";
import { withRouter } from "react-router";

const priceConversion = 10**18;

class SellerPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            vendorAddress: props.location.state.vendorAddress,
            vendorNickname: props.location.state.vendorNickname,
            contract: null,
            currentAccount: null
        }
    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace
        const currentAccount = this.state.drizzleState.accounts[0];
        const response_cars = await contract.methods.getCarSetups().call();
        const response_skins = await contract.methods.getSkins().call();
        this.setState({ listCars: response_cars, listSkins: response_skins, contract: contract, currentAccount: currentAccount });
    }

    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, address, nickname, ipfsPath) => {
        event.preventDefault();

        this.setState({
            redirectBuyItem: true,
            selectedItemId: itemId,
            selectedTrack: track,
            selectedSimulator: simulator,
            selectedSeason: season,
            selectedSeries: series,
            selectedDescription: description,
            selectedPrice: price,
            selectedCarBrand: carBrand,
            vendorAddress: address,
            vendorNickname: nickname,
            ipfsPath: ipfsPath,
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
                        selectedSeries: this.state.selectedSeries,
                        selectedDescription: this.state.selectedDescription,
                        selectedPrice: this.state.selectedPrice,
                        selectedCarBrand: this.state.selectedCarBrand,
                        vendorAddress: this.state.vendorAddress,
                        vendorNickname: this.state.vendorNickname,
                        ipfsPath: this.state.ipfsPath,
                    }
                }}
            />)
        }

        if (this.state.listCars != null || this.state.listSkins != null) {

            let nickname = this.state.vendorNickname;

            for (const [index, value] of this.state.listCars.entries()) {

                if(value.ad.seller != this.state.vendorAddress) continue;

                let carBrand = value.info.carBrand
                let track = value.info.track
                let simulator = value.info.simulator
                let season = value.info.season
                let series = value.info.series
                let description = value.info.description
                let price = value.ad.price
                let address = value.ad.seller
                let itemId = value.id
                let ipfsPath = value.ad.ipfsPath
                cars.push(
                    <ListGroup.Item key={index}>
                        <Card className="card-block" key={index}>
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>Track:</b> {track}</div>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Season:</b> {season}</div>
                                    <div><b>Price:</b> {price / priceConversion} ETH</div>
                                    {/* <div><b>Vendor address:</b> {address}</div> */}
                                </Card.Text>
                                <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, nickname, ipfsPath)}> View item</Button>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }

            cars.reverse();

            for (const [index, value] of this.state.listSkins.entries()) {

                if(value.ad.seller != this.state.vendorAddress) continue;

                let carBrand = value.info.carBrand
                let simulator = value.info.simulator
                let price = value.ad.price
                let address = value.ad.seller
                let itemId = value.id
                let ipfsPath = value.ad.ipfsPath
                skins.push(
                    <ListGroup.Item key={index}>
                        <Card className="card-block">
                            <Card.Body>
                                <Card.Title>{carBrand}</Card.Title>
                                <Card.Text>
                                    <div><b>Simulator:</b> {simulator}</div>
                                    <div><b>Price:</b> {price / priceConversion} ETH</div>
                                    {/* <div><b>Vendor address:</b> {address}</div> */}
                                </Card.Text>
                                <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, price, carBrand , address, nickname, ipfsPath)}> View item</Button>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }

            skins.reverse();
        }

        return (
            <header className="header">
                <section className="content-section text-light br-n bs-c bp-c pb-8" style={{backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')'}}>
                    <div id="latest-container" className="container">
                        <div>
                            <div><b>Seller: </b>{this.state.vendorNickname} ({this.state.vendorAddress})</div>
                        </div>
                        <div>
                            <h4>Seller Car Setups</h4>
                        </div>
                        <div>
                            <ListGroup className="list-group list-group-horizontal scrolling-wrapper">
                                {cars}
                            </ListGroup>

                        </div>
                        <br></br>
                        <div>
                            <h4>Seller Car Skins</h4>
                        </div>
                        <div>
                            <ListGroup className="list-group list-group-horizontal scrolling-wrapper">
                                {skins}
                            </ListGroup>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}

export default withRouter(SellerPage);