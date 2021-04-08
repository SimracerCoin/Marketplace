import React, { Component } from 'react';

import "../css/mainpage.css";

class Underconstruction extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            contract: null
        }
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const currentAccount = this.state.drizzleState.accounts[0];

        this.setState({ currentAccount: currentAccount });
    }

    requestBtnClick = (event) => {
        document.querySelector('.discord-dialog').className = 'discord-dialog discord-dialog--active';
    }

    render() {
        return ([
                <header id="header" class="header h-fullscreen__page text-light">
                    <div class="media-container parallax-window" data-parallax="scroll" data-image-src="assets/img/bg/bg-2.jpg" style={{backgroundImage: 'url(\'/assets/img/bg/bg-8.png\')'}}></div>
                    <div class="overlay bg-dark_A-40"></div>
                    <div class="overlay d-flex align-items-center">
                        <div class="container text-center">
                        <div class="row align-items-center">
                            <div class="col-lg-6 mx-auto">
                            <div class="fadeIn ad-500ms">
                                <img src="assets/img/logo-2.png" className="slideInLeft ad-400ms display-lg-2 fw-700 lh-2 mb-4" style={{maxWidth: '500px'}} />
                                <h2 class="lead-2 ls-3 d-block slideInRight ad-500ms fw-300 text-uppercase mb-7">Beta 1.0</h2>
                                <a class="btn btn-lg btn-round btn-outline-light" onClick={this.requestBtnClick}>Request Beta Access</a>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </header>
        ]);
    }
}

export default Underconstruction;