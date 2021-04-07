import React, { Component } from 'react';

import "../css/mainpage.css";

class Underconstruction extends Component {

    render() {
        return ([
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3" style={{ height: '88px' }}>
                <div class="container">
                    <div class="row">
                        <div class="col-4 col-sm-3 col-md-2 mr-auto">
                            <a class="navbar-brand logo" href="/">
                                <img src="assets/img/logo-2.png" alt="Simthunder" class="logo-light mx-auto" />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>,
            <header id="header" class="header h-fullscreen__page text-light">
                <div class="media-container parallax-window" data-parallax="scroll" data-image-src="assets/img/bg/bg-2.jpg" style={{ backgroundImage: 'url(\'/assets/img/bg/bg-2.jpg\')' }}></div>
                <div class="overlay bg-dark_A-40"></div>
                <div class="overlay d-flex align-items-center">
                    <div class="container text-center">
                        <div class="row align-items-center">
                            <div class="col-lg-6 mx-auto">
                                <div class="fadeIn ad-500ms">
                                    <h1 class="slideInLeft ad-400ms display-lg-2 fw-700 lh-2 mb-4"><span class="text-warning">Sim</span>thunder</h1>
                                    <h2 class="lead-2 ls-3 d-block slideInRight ad-500ms fw-300 text-uppercase mb-7">Our new site is coming soon!!!</h2>
                                    <p class="lead-lg mb-7">Stay tuned for something amazing</p>
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