import React, { Component } from 'react';
import UIHelper from "../utils/uihelper";
import { Button, Card } from 'react-bootstrap';
import { withRouter } from "react-router-dom";
import Countdown from "../components/CountdownComponent"

const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);

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
            let dropContract, drops = [], i = 0;
            while((dropContract = await drizzle.contracts["SimracingMomentDrop" + i++])) {
                const drop = await UIHelper.callWithRetry(dropContract.methods.getDrop());
                if(!drop.closed && parseInt(drop.saleStart) > 0) {
                    drops.push(drop);
                }
            }

            this.setState({ drops: drops?.reverse(), id: null}, UIHelper.hideSpinning);
        } else {
            const dropContract = await drizzle.contracts["SimracingMomentDrop" + (dropId-1)];
            // Load single drop
            const drop = await UIHelper.callWithRetry(dropContract.methods.getDrop());
            const price = await UIHelper.callWithRetry(dropContract.methods.getPackPrice(drop.boughtPacks+1));
            this.setState({
                ...drop,
                price: Number(web3.utils.fromWei(price)).toFixed(2),
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
        const dropContract = await drizzle.contracts["SimracingMomentDrop"+(state.id-1)];

        UIHelper.showSpinning();

        try {
            const balance = web3.utils.toBN(await UIHelper.callWithRetry(SimracerCoin.methods.balanceOf(currentAccount)));
            const price = web3.utils.toBN(web3.utils.toWei(state.price.toString(), "ether"));

            if(balance.lt(price)) {
                UIHelper.transactionOnError("Insufficient balance to purchase the item!");
                return;
            }

            const allowance = web3.utils.toBN(await UIHelper.callWithRetry(SimracerCoin.methods.allowance(currentAccount, dropContract.address)));
    
            if(allowance.lt(price)) {
                const data = [dropContract.address, price];
                await SimracerCoin.methods.approve(...data).send(
                    await UIHelper.calculateGasUsingStation(currentAccount, SimracerCoin.methods.approve, data)
                );
            }

            const data = [parseInt(state.boughtPacks) + 1];
            await dropContract.methods.buyPack(...data).send(
                await UIHelper.calculateGasUsingStation(currentAccount, dropContract.methods.buyPack, data)
            ).on("confirmation", confNumber => {
                if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                    UIHelper.transactionOnConfirmation("Thank you for your purchase!", false);
                }
            });
        } catch(err) {
            UIHelper.transactionOnError(err);
        }
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
                        {this.state.drops.slice(i * 4, (i * 4) + 4).map((drop, idx) => (
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1" key={drop.id}>
                                <a href={`/drops/${drop.id}`} className="link-no-hover">
                                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2">
                                        { (i > 0 || idx > 0) &&
                                        <Card.Header style={{ height: '240px' }} className="d-flex flex-wrap align-items-center justify-content-center">
                                            <Card.Img variant="top" src={drop.cover} style={{ width: 'auto', maxHeight: '100%' }} />
                                        </Card.Header>
                                        }
                                        <Card.Body className={(i > 0 || idx > 0) && "text-center"}>
                                            { (i === 0 && idx === 0) &&
                                            <div className="row">
                                                <div className="col-8">
                                                    <h5>Drop #{drop.id}</h5>
                                                    <h6>{drop.title}</h6>
                                                    <Countdown saleStart={drop.saleStart} saleEnd={drop.saleEnd} />
                                                    <p>{drop.description}</p>
                                                    <Button variant="warning">KNOW MORE</Button>
                                                </div>
                                                <div className="col-4">
                                                    <Card.Img variant="top" src={drop.cover} style={{ width: 'auto', maxHeight: '100%' }} />
                                                </div>
                                            </div>
                                            }
                                            { (i > 0 || idx > 0) &&
                                            <div className="row">
                                                <Card.Title className="mt-5 col-8 text-left"><strong>DROP #{drop.id}</strong><br />{drop.title}</Card.Title>
                                                <div className="mt-5 font-weight-bold col-4 h4">
                                                    {drop.boughtPacks} / {drop.totalPacks}
                                                </div>
                                                <Button variant="warning">View</Button>
                                            </div>
                                            }
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
                                                <Countdown saleStart={state.saleStart} saleEnd={state.saleEnd} />
                                                <div><strong>{state.totalPacks - state.boughtPacks} available</strong></div>
                                                <div className="price_div"><strong className="price_div_strong">{state.price}<sup className="main-sup">SRC</sup></strong><br /><span className="secondary-price">{usdPrice(state.price)}<sup className="secondary-sup">USD</sup></span></div>
                                            </div>
                                            <div className="row mt-5">
                                                <Button disabled={state.totalPacks - state.boughtPacks === 0 || Math.floor(Date.now() / 1000) < state.saleStart || Math.floor(Date.now() / 1000) > state.saleEnd} variant="warning" onClick={this.buyItem}>GET PACK</Button>
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
