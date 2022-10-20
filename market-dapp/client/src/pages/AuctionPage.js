import React, { Component } from 'react';
import "../css/auction.css";

class AuctionPage extends Component {

    render() {
        return (
            <header className="header">
                <div class="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div class="container position-relative">
                        <div class="row">
                            <div class="col-lg-8 mx-auto">
                                <div>
                                    <h2 class="ls-1 text-center">FAQs</h2>
                                    <hr class="w-10 border-warning border-top-2 o-90" />

                                    <h3 class="ls-1 text-center">Coming soon</h3>

                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default AuctionPage;
