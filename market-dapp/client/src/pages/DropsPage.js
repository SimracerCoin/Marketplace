import React, { Component } from 'react';
import UIHelper from "../utils/uihelper";
import { Button, Card } from 'react-bootstrap';
import { withRouter } from "react-router-dom";

class DropsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            drops: [],
            id: null, // To track single drop data when id is provided
            usdValue: 1
        };
    }
    
    componentDidMount = async () => {
        const { match, drizzle } = this.props;
        const { web3 } = drizzle;
        const dropId = match?.params.id;

        UIHelper.showSpinning('Loading items ...');

        if (!dropId) {
            // Load multiple drops
            const drops = [{
                id: 1,
                title: "Lorem ipsum dolor sit.",
                cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
                totalPacks: 76,
                boughtPacks: 0 
            }];
            this.setState({ drops, id: null}, UIHelper.hideSpinning);
        } else {
            // Load single drop
            this.setState({
                id: dropId,
                title: "Lorem ipsum dolor sit.",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus a tortor ut velit consectetur gravida sit amet quis orci. Nunc mattis tortor magna, vitae pretium nunc porttitor vel. Donec ut elit efficitur, accumsan leo id, tincidunt lorem. Pellentesque consequat augue ante. Quisque vel magna non diam feugiat mattis. Donec non sem ac eros semper dignissim. Sed ut magna nec arcu feugiat facilisis. Duis porta ipsum in massa suscipit congue. Suspendisse a orci id est sodales maximus. Etiam ultricies pharetra nisi non maximus. Pellentesque scelerisque in arcu eget malesuada. Phasellus pellentesque orci quis nisl laoreet, quis suscipit purus vehicula. Mauris mattis enim lectus, ut congue sapien porttitor vel. Morbi auctor lobortis augue, sed molestie sem luctus eget. Aenean dignissim accumsan massa, non finibus lorem.",
                cover: "https://simthunder.infura-ipfs.io/ipfs/QmYQM7fe7JUxncS3yQfPat6UvtjJu8urjzr7Z7gJYXVbdb",
                totalPacks: 76,
                boughtPacks: 0,
                price: Number(web3.utils.fromWei("10000000000000000000000")).toFixed(2),
                available: 79,
                usdValue: await UIHelper.fetchSRCPriceVsUSD()
            }, UIHelper.hideSpinning);
        }
    }

    buyItem = async (e) => {
        e.preventDefault();

        const { state, props } = this;
        const { drizzle, drizzleState } = props;
        const { web3, contracts } = drizzle;
        const { SimracerCoin } = contracts;
        const currentAccount = await drizzleState.accounts[0];

        const balance = web3.utils.toBN(await UIHelper.callWithRetry(SimracerCoin.methods.balanceOf(currentAccount)));
        const price = web3.utils.toBN(web3.utils.toWei(state.price.toString(), "ether"));

        if(balance.lt(price)) {
            alert("Insufficient balance to purchase the item!");
            return;
        }

        UIHelper.showSpinning();
    }

    render() {
        const { state } = this;

        const usdPrice = price => Number(Math.round(parseFloat(price)  * state.usdValue * 100) / 100).toFixed(2);

        let rContent = [];
        if(state.drops.length) {
            const rDrops = [];

            for (let i = 0; i < Math.ceil(state.drops.length / 4); i++) {
                rDrops.push(
                    <div className="row" key={i}>
                        {this.state.drops.slice(i * 4, (i * 4) + 4).map(drop => (
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1" key={drop.id}>
                                <a href={`/drops/${drop.id}`}>
                                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2">
                                        <Card.Header style={{ height: '240px' }} className="d-flex flex-wrap align-items-center justify-content-center">
                                            <Card.Img variant="top" src={drop.cover} style={{ width: 'auto', maxHeight: '100%' }} />
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <div className="row">
                                                <Card.Title className="mt-5 col-8 text-left"><strong>DROP #{drop.id}</strong><br />{drop.title}</Card.Title>
                                                <div className="mt-5 font-weight-bold col-4 h4">
                                                    {drop.boughtPacks} / {drop.totalPacks}
                                                </div>
                                            </div>
                                            <Button variant="warning">View</Button>
                                        </Card.Body>
                                    </Card>
                                </a>
                            </div>
                        ))}
                    </div>
                );
            }

            rContent = <header className="header">
                        <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                        <section className="content-section text-light br-n bs-c bp-c pb-8">
                            <div id="latest-container" className="container latest-items">
                                <div className="center-text">
                                    <h1>Simracing Moment Drops</h1>
                                </div>
                                <div className="container-fluid">
                                    { rDrops }
                                </div>
                            </div>
                        </section>
                    </header>
        } else if(state.id) {
            rContent = <div className="page-body">    
                        <main className="main-content">
                            <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape"/></div>
                            <div className="content-section text-light pt-8">
                                <div className="container">
                                    <div className="row">
                                        <div className="col-8">
                                            <div className="row gutters-y">
                                                <header>
                                                    <h3 className="product_name mb-4">DROP #{state.id}</h3>
                                                    <h4>{state.title}</h4>
                                                </header>
                                            </div>
                                            <div className="row" style={{ flexFlow: 'column' }}>
                                                <p>{state.description}</p>
                                                <div><strong>{state.available} available</strong></div>
                                                <div className="price_div"><strong className="price_div_strong">{state.price}<sup className="main-sup">SRC</sup></strong><br /><span className="secondary-price">{usdPrice(state.price)}<sup className="secondary-sup">USD</sup></span></div>
                                            </div>
                                            <div className="row mt-5">
                                                <Button variant="warning" onClick={this.buyItem}>GET PACK</Button>
                                                <a href="/inventory?v=packs" className="btn btn-primary ml-2">COLLECT MOMENTS</a>
                                            </div>
                                        </div>
                                        <div className="col-4 text-center">
                                            <img className="item-page-img" src={state.cover} alt="Product"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
        }

        return rContent;
    }
}

export default withRouter(DropsPage);
