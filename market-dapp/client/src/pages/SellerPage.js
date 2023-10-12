import React, { Component } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import { Redirect } from "react-router-dom";
import { withRouter } from "react-router";
import StarRatings from 'react-star-ratings';

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
            currentAccount: null,
            listComments: [],
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedSeries: "",
            selectedDescription: "",
            selectedPrice: "",
            selectedCarBrand: "",
            selectedImagePath: "",
            ipfsPath:""
        }
    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const stSetup = await this.state.drizzle.contracts.STSetup;
        const stSkin = await this.state.drizzle.contracts.STSkin;

        const currentAccount = this.state.drizzleState.accounts[0];

        const response_cars = (await stSetup.methods.getSetups().call()).filter(item => item.ad.active && item.ad.seller === this.state.vendorAddress);
        const response_skins = (await stSkin.methods.getSkins().call()).filter(item => item.ad.active && item.ad.seller === this.state.vendorAddress);
        const response_comments = await contract.methods.getSellerComments(this.state.vendorAddress).call();
        this.setState({ listCars: response_cars, listSkins: response_skins, contract: contract, currentAccount: currentAccount, listComments: response_comments });
    
        // scroll to top
        document.body.scrollTop = 0;            // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }

    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, carNumber, address, ipfsPath, imagePath) => {
        event.preventDefault();

        let similarItems = [];
        let category = "";
        if(track == null || season == null) {
            similarItems = similarItems.concat(this.state.listSkins);
            category = "carskins";
        } else {
            similarItems = similarItems.concat(this.state.listCars);
            category = "carsetup";
        }
        
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
            selectedCarNumber: carNumber,
            selectedImagePath: imagePath,
            selectedCategory: category,
            vendorAddress: address,
            ipfsPath: ipfsPath,
            similarItems: similarItems
        });
    }

    render() {
        const cars = [];
        const skins = [];
        let commentsRender = [];

        if (this.state.redirectBuyItem) {
            return (<Redirect
                to={{
                    pathname: "/item/"+this.state.selectedCategory+"/"+this.state.selectedItemId,
                    state: {
                        selectedItemId: this.state.selectedItemId,
                        selectedTrack: this.state.selectedTrack,
                        selectedSimulator: this.state.selectedSimulator,
                        selectedSeason: this.state.selectedSeason,
                        selectedSeries: this.state.selectedSeries,
                        selectedDescription: this.state.selectedDescription,
                        selectedPrice: this.state.selectedPrice,
                        selectedCarBrand: this.state.selectedCarBrand,
                        selectedCarNumber: this.state.selectedCarNumber,
                        imagePath: this.state.selectedImagePath,
                        vendorAddress: this.state.vendorAddress,
                        vendorNickname: this.state.vendorNickname,
                        ipfsPath: this.state.ipfsPath,
                        similarItems: this.state.similarItems
                    }
                }}
            />)
        }

        let nickname = this.state.vendorNickname;

        for (const [index, value] of this.state.listCars.entries()) {

            let carBrand = value.info.carBrand
            let carNumber = value.info.carNumber
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
                <ListGroup.Item key={itemId}>
                    <Card className="card-block">
                        <Card.Body>
                            <Card.Title>{carBrand}</Card.Title>
                            <div className="text-left">
                                <div><b>Track:</b> {track}</div>
                                <div><b>Simulator:</b> {simulator}</div>
                                <div><b>Season:</b> {season}</div>
                                <div><b>Price:</b> {price / priceConversion} SRC</div>
                                {/* <div><b>Vendor address:</b> {address}</div> */}
                            </div>
                            <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, nickname, ipfsPath)}> View item</Button>
                        </Card.Body>
                    </Card>
                </ListGroup.Item>
            )
        }

        if(cars) cars.reverse();

        for (const [index, value] of this.state.listSkins.entries()) {

            let carBrand = value.info.carBrand
            let simulator = value.info.simulator
            let price = value.ad.price
            let address = value.ad.seller
            let itemId = value.id
            let ipfsPath = value.ad.ipfsPath
            let imagePath = value.info.skinPic
            skins.push(
                <ListGroup.Item key={itemId}>
                    <Card className="card-block">
                        <Card.Body>
                            <Card.Img variant="top" src={"https://simthunder.infura-ipfs.io/ipfs/"+imagePath[0]} />
                            <Card.Title>{carBrand}</Card.Title>
                            <div className="text-left">
                                <div><b>Simulator:</b> {simulator}</div>
                                <div><b>Price:</b> {price / priceConversion} SRC</div>
                                {/* <div><b>Vendor address:</b> {address}</div> */}
                            </div>
                            <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, null, price, carBrand , address, ipfsPath, imagePath)}> View item</Button>
                        </Card.Body>
                    </Card>
                </ListGroup.Item>
            )
        }

        if(skins) skins.reverse();

        for (const [index, value] of this.state.listComments.entries()) {
            let commentator = value.commentator;
            let description = value.description;
            let review = parseInt(value.review);
            let date = new Date(value.date)
            let date_time = date.toLocaleDateString() + " " +date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
            commentsRender.push(
                <ListGroup.Item key={index} className="mb-5">
                    <Card className="card-block">
                        <Card.Body>
                            <div className="text-left">
                                <div>
                                    <StarRatings 
                                        rating={review}
                                        starRatedColor="rgb(230, 67, 47)"
                                        starDimension="20px"
                                        numberOfStars={5}
                                        name='rating'
                                    />
                                </div>
                                <div><b>Commentator:</b> {commentator}</div>
                                <div><b>Description:</b> {description}</div>
                                <div><b>Review:</b> {review}</div>
                                <div><b>Date:</b> {date_time}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </ListGroup.Item>
            )
        }
        if(commentsRender) commentsRender.reverse();

        return (
            <header className="header">
                <div class="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
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
                        <br /><br />
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
                <div className="container">
                    <h3 className="text-white">Comments</h3>
                    <ListGroup>
                        {commentsRender}
                    </ListGroup>
                </div>
            </header>
        );
    }
}

export default withRouter(SellerPage);