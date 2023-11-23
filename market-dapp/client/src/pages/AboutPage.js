import React, { Component } from 'react';

class AboutPage extends Component {

    render() {
        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <div>
                                    <h2 className="ls-1 text-center">About</h2>
                                    <hr className="w-10 border-warning border-top-2 o-90" />

                                    <p className="lead-1">Simthunder is a decentralised sim racing assets marketplace, that will enable sim racers to exchange sim racing items such as car setup files and skins, as well as NFTs that represent ownership of digital cars in private sim racing leagues, among others. This is one of the core features of the Simracer Coin project, one of the first integrations in GG Dapp.</p>
                                    {/* <p className="lead-1"></p>

                                    <p className="lead-1">To learn more check our quick guide <a href="/faqs" id="faqsLink">here</a>.</p> */}
                                    <p className="lead-1">ATTENTION: BETA VERSION</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default AboutPage;
