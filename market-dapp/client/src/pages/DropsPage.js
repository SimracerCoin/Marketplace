import React, { Component } from 'react';
import UIHelper from "../utils/uihelper";
import { Button, Card } from 'react-bootstrap';
import { withRouter, Link } from "react-router-dom";

class DropsPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            drops: [],
            id: null, // To track single drop data when id is provided
        };
    }
    
    componentDidMount = async () => {
        const { match } = this.props;
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
            }, UIHelper.hideSpinning);
        }
    }

    render() {
        const { state } = this;

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
                                                <Card.Title className="mt-5 font-weight-bold col-8">DROP #{drop.id} {drop.title}</Card.Title>
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
                                            <div className="row">
                                                {state.description}
                                            </div>
                                            <div className="row mt-5">
                                                <a href={`/packs/${state.id}`} className="btn btn-warning">GET PACKS</a>
                                                <Button variant="primary" className="ml-2">COLLECT MOMENTS</Button>
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
