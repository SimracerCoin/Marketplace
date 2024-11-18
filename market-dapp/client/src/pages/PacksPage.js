import React, { Component } from 'react';
import UIHelper from "../utils/uihelper";
import { Button, Card } from 'react-bootstrap';
import { withRouter } from "react-router-dom";

class PacksPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            packs: [],
            title: "",
            dropId: null,
            usdValue: 1
        };
    }

    componentDidMount = async () => {
        const { match, drizzle } = this.props;
        const dropId = match.params.id;
        const { web3 } = drizzle;

        UIHelper.showSpinning('Loading items ...');

        const packs = {1: {
            id: 1,
            type: "COMMON",
            price: Number(web3.utils.fromWei("1000000000000000000")).toFixed(2),
            cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
            available: 40
        }, 2: {
            id: 2,
            type: "SPECIAL",
            price: Number(web3.utils.fromWei("10000000000000000000")).toFixed(2),
            cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
            available: 20
        }, 3: {
            id: 3,
            type: "EPIC",
            price: Number(web3.utils.fromWei("100000000000000000000")).toFixed(2),
            cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
            available: 10
        }, 4: {
            id: 4,
            type: "LEGENDARY",
            price: Number(web3.utils.fromWei("1000000000000000000000")).toFixed(2),
            cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
            available: 3
        }, 5: {
            id: 5,
            type: "UNIQUE",
            price: Number(web3.utils.fromWei("10000000000000000000000")).toFixed(2),
            cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
            available: 1
        }};
        
        this.setState({ 
            packs, 
            dropId,
            usdValue: await UIHelper.fetchSRCPriceVsUSD(), 
            title: "DROP #1 Lorem ipsum dolor sit."
        }, UIHelper.hideSpinning);
    }

    buyItem = async (e, packId) => {
        e.preventDefault();

        const { state, props } = this;
        const { drizzle, drizzleState } = props;
        const { web3, contracts } = drizzle;
        const { SimracerCoin } = contracts;
        const currentAccount = await drizzleState.accounts[0];
        const pack = state.packs[packId];

        const balance = web3.utils.toBN(await UIHelper.callWithRetry(SimracerCoin.methods.balanceOf(currentAccount)));
        const price = web3.utils.toBN(web3.utils.toWei(pack.price.toString(), "ether"));

        if(balance.lt(price)) {
            alert("Insufficient balance to purchase the item!");
            return;
        }

        UIHelper.showSpinning();
    }

    render() {
        const { state } = this;

        const usdPrice = price => Number(Math.round(parseFloat(price)  * state.usdValue * 100) / 100).toFixed(2);

        return <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div id="latest-container" className="container latest-items">
                        <div className="center-text">
                            <h1>{state.title}</h1>
                        </div>
                        <div className="container-fluid">
                            <div className="row justify-content-center">
                            {Object.values(this.state.packs).map(pack => (
                                <div className="col-auto">
                                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2" onClick={e => this.buyItem(e, pack.id)}>
                                        <Card.Header style={{ height: '240px' }} className="d-flex flex-wrap align-items-center justify-content-center">
                                            <Card.Img variant="top" src={pack.cover} style={{ width: 'auto', maxHeight: '100%' }} />
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <Card.Title className="mt-5 font-weight-bold">{pack.type}</Card.Title>
                                            <div className="text-left">
                                                <div>{state.title}</div>
                                                <div>{pack.available} available</div>
                                                <div className="price_div"><strong className="price_div_strong">{pack.price} <sup className="main-sup">SRC</sup></strong><br/> <span className="secondary-price">{usdPrice(pack.price)}<sup className="secondary-sup">USD</sup></span></div>
                                            </div>
                                            { pack.available > 0 &&
                                            <Button variant="warning" onClick={e => this.buyItem(e, pack.id)}>Buy</Button>
                                            }
                                        </Card.Body>
                                    </Card>
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                </section>
            </header>
    }
}

export default withRouter(PacksPage);
