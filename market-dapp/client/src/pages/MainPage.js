import React, { Component } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import { Redirect } from "react-router-dom";

import "../css/mainpage.css";

const priceConversion = 10 ** 18;

class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            latestNFTs: [],
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedSeries: "",
            selectedDescription: "",
            selectedPrice: "",
            selectedCarBrand: "",
            selectedImagePath: "",
            vendorAddress: "",
            vendorNickname: "",
            ipfsPath: "",
            contract: null,
            contractNFTs: null,
            similarItems: []
        }

    }

    componentDidMount = async () => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
        const response_cars = await contract.methods.getCarSetups().call();
        const response_skins = await contract.methods.getSkins().call();
        //const currentAccount = this.state.drizzleState.accounts[0];
        const nftlist = [];
        
        console.log('componentDidMount');

        // get info from marketplace NFT contract
        //let numNfts = await contractNFTs.methods.balanceOf(contractNFTs.address).call();
        const numNfts = await contractNFTs.methods.currentTokenId().call();
        console.log('nft count:' + numNfts);
        
        //let currentPage = this;
        for (let i = 1; i < parseInt(numNfts) + 1; i++) {
            try {
                //TODO: change for different ids
                let ownerAddress = await contractNFTs.methods.ownerOf(i).call();
                console.log('ID:'+i+'ownerAddress: '+ownerAddress.toString()+'nfts addr: '+contractNFTs.address);
                if(ownerAddress === contractNFTs.address) {
                    console.log('GOT MATCH');
                    let uri = await contractNFTs.methods.tokenURI(i).call();
                    console.log('uri: ', uri);
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.onload = function(e) {
                        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                            var data = JSON.parse(xmlhttp.responseText);
                            console.log('nftData:' + data.image);
                            console.log('nftData:' + data.description);
                            data.id=i;
                            nftlist.push(data);
                            this.setState({ latestNFTs: nftlist });
                        }
                    }.bind(this);
                    xmlhttp.onerror = function (e) {
                        console.error(xmlhttp.statusText);
                    };
                    xmlhttp.open("GET", uri, true);
                    xmlhttp.send(null);
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        this.setState({ listCars: response_cars, listSkins: response_skins, contract: contract, contractNFTs: contractNFTs });
    }


    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, imagePath, isNFT) => {
        event.preventDefault();

        let similarItems = [];
        if(isNFT) {
            similarItems = similarItems.concat(this.state.latestNFTs);
        } else if(track == null || season == null) {
            similarItems = similarItems.concat(this.state.listSkins);
        } else {
            similarItems = similarItems.concat(this.state.listCars);
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
            selectedImagePath: imagePath,
            vendorAddress: address,
            vendorNickname: address ? await this.state.contract.methods.getNickname(address).call() : "",
            ipfsPath: ipfsPath,
            isNFT: isNFT,
            similarItems: similarItems
        });
    }

    render() {

        const cars = [];
        const skins = [];
        const nfts = [];


        if (this.state.redirectBuyItem) {
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
                        imagePath: this.state.selectedImagePath,
                        vendorAddress: this.state.vendorAddress,
                        vendorNickname: this.state.vendorNickname,
                        ipfsPath: this.state.ipfsPath,
                        isNFT: this.state.isNFT,
                        similarItems: this.state.similarItems
                    }
                }}
            />)
        }

        for (const [index, value] of this.state.listCars.entries()) {
            console.log('list cars value:');
            console.log(value);
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
            let thumb = "assets/img/sims/"+simulator+".png";

            cars.push(
                <ListGroup.Item key={itemId} className="bg-dark_A-20 col-3 mb-4" style={{minWidth: '275px'}}>
                    <Card className="card-block">
                        <div style={{height: '160px'}} className="d-flex flex-wrap align-items-center justify-content-center">
                            <Card.Img variant="top" src={thumb} style={{width: 'auto', maxHeight: '160px'}} />
                        </div>
                        <Card.Body>
                            <Card.Title className="mt-5 font-weight-bold">{carBrand}</Card.Title>
                            <div className="text-left">
                            <div><b>Track:</b> {track}</div>
                            <div><b>Simulator:</b> {simulator}</div>
                            <div><b>Season:</b> {season}</div>
                            <div><b>Price:</b> {price / priceConversion} ETH</div>
                            {/* <div><b>Vendor address:</b> {address}</div> */}
                            </div>
                            <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, "", false)}> View item</Button>
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
            let imagePath = "https://ipfs.io/ipfs/" + value.info.skinPic
            let thumb = "assets/img/sims/"+simulator+".png";
            
            skins.push(
                <ListGroup.Item key={itemId} className="bg-dark_A-20 col-3 mb-4" style={{minWidth: '275px'}}>
                    <Card className="card-block">
                        <Card.Img variant="top" src={imagePath} style={{maxHeight: '320px', width: 'auto'}} />
                        <Card.Body>
                            <Card.Title className="mt-5 font-weight-bold">{carBrand}</Card.Title>
                            <div className="text-left">
                                <div><b>Simulator:</b>&nbsp;<img src={thumb} width="24" alt={simulator} /> {simulator}</div>
                                <div><b>Price:</b> {price / priceConversion} ETH</div>
                            </div>
                            <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, null, price, carBrand , address, ipfsPath, imagePath, false)}> View item</Button>
                        </Card.Body>
                    </Card>
                </ListGroup.Item>
            )
        }

        if(skins) skins.reverse();

        for (const [index, value] of this.state.latestNFTs.entries()) {
            let series = value.series;
            let simulator = value.simulator;
            let price = value.price*priceConversion;
            //TODO: change hardcode
            let address = value.seriesOwner;
            let itemId = value.id;
            let carNumber = value.carNumber;
            // let ipfsPath = value.ad.ipfsPath
            console.log(' ID NFT:'+value.id);
            let imagePath = value.image
            nfts.push(
                <ListGroup.Item key={itemId} className="bg-dark_A-20 col-3 mb-4" style={{minWidth: '275px'}}>
                    <Card className="card-block">
                        <Card.Img variant="top" src={imagePath} style={{maxHeight: '320px', width: 'auto'}} />
                        <Card.Body>
                        <div className="text-left">
                            <div><b>Series:</b> {series}</div>
                            <div><b>Simulator:</b> {simulator}</div>
                            <div><b>Car Number:</b> {carNumber}</div>
                            <div><b>Price:</b> {price / priceConversion} ETH</div>
                            </div>
                            <Button variant="primary" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true)}> View item</Button>
                        </Card.Body>
                    </Card>
                </ListGroup.Item>
            )
        }

        if(nfts) nfts.reverse();

        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div id="latest-container" className="container">
                        <div className="center-text">
                            <h1>Welcome to Simthunder!</h1>
                            <h2>The largest marketplace for sim racing assets</h2>
                            <h5>Buy, sell, discover, and trade sim racing goods</h5>
                        </div>
                        <br /><br />
                        <div>
                            <h4>Latest Car Ownership NFTs</h4>
                        </div>
                        <div>
                            <ListGroup horizontal className="scrolling-wrapper">
                                {nfts}
                            </ListGroup>
                        </div>
                        <br /><br />
                        <div>
                            <h4>Latest Car Setups</h4>
                        </div>
                        <div>
                            <ListGroup horizontal className="scrolling-wrapper">
                                {cars}
                            </ListGroup>
                        </div>
                        <br /><br />
                        <div>
                            <h4>Latest Car Skins</h4>
                        </div>
                        <div>
                            <ListGroup horizontal className="scrolling-wrapper">
                                {skins}
                            </ListGroup>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}

export default MainPage;