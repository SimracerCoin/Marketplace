import React, { Component } from 'react';

class FaqsPage extends Component {

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

                                    <h5>#1 - Don't do that</h5>
                                    <p class="lead-1">ok</p>

                                    <h5>#2 - Don't do that</h5>
                                    <p class="lead-1">ok</p>

                                    <h5>#3 - Don't do that</h5>
                                    <p class="lead-1">ok</p>

                                    <h5>#4 - Don't do that</h5>
                                    <p class="lead-1">ok</p>

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
