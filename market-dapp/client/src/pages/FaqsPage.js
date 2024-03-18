import React, { Component } from 'react';

class FaqsPage extends Component {

    render() {
        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <div>
                                    <h2 className="ls-1 text-center">FAQs</h2>
                                    <hr className="w-10 border-warning border-top-2 o-90" />

                                    <h5>How can I buy items in the marketplace?</h5>
                                    <p className="lead-1">To buy items you need first to have Simracer Coin (SRC).</p>

                                    <h5>How can I buy Simracer Coin (SRC)?</h5>
                                    <p className="lead-1">Simracer Coin is available in Catex exchange (<a href="https://www.catex.io/trading/SRC/ETH" target="_blank" rel="noreferrer">https://catex.io</a>).</p>

                                    <h5>What are Ownership NFTs?</h5>
                                    <p className="lead-1">These are like entries for private league competitions. By having the NFT you are owner of that car entry and number and receive the prize if that car gets one.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default FaqsPage;
