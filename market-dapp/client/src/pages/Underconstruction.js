import React, { Component } from 'react';
import "../css/mainpage.css";

const allowAllWallets = (process.env.REACT_APP_ALLOW_ALL_WALLETS === "true" ? true : false);

class Underconstruction extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isLoggedIn: props.isLoggedIn,
            wrongNetwork: props.wrongNetwork
        }
    }

    componentDidMount = async () => {
        const { state } = this;

        if(state.isLoggedIn && !state.wrongNetwork) {
            alert("Welcome to SimThunder! Please request your beta access first.");
        }
    }

    requestBtnClick = (event) => {
        document.querySelector('.discord-dialog').className = 'discord-dialog discord-dialog--active';
    }

    switchNetwork = async () => {
        const ethereum = window.ethereum;
        if(ethereum !== 'undefined') {
  
            try {
                await ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x89' }],
                });
                console.log("Sucessfully switched to Polygon");
                window.location.reload();
              } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                console.log("error switching network:", switchError);
                if (switchError.code === 4902) {
                  try {
                    await ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: '0x89', //137 in hex
                          chainName: 'Polygon',
                          rpcUrls: ['https://polygon-rpc.com'],
                          nativeCurrency: {
                            name: 'Matic',
                            symbol: 'Matic', // 2-6 characters long
                            decimals: 18
                          }
                        },
                      ],
                    });
                  } catch (addError) {
                    // handle "add" error
                    console.log("error switching network:", addError);
                  }
                }
                // handle other "switch" errors
              }
        }
  
      }

    renderSwitchButton = () => {

        return <div>
                <button className="switch-btn" onClick={(e) => this.switchNetwork()}>Switch Network</button>
                </div>
    }  

    render() {
        const { state } = this;
        const { web3 } = window;

        let hiddenLoginBtn = !web3 || state.isLoggedIn ? 'd-none' : '';
        let hiddenRequestBtn = state.wrongNetwork || allowAllWallets ? 'd-none' : '';
        let hiddenErrorMsg = web3 && !state.wrongNetwork ? 'd-none' : 'd-block';

        let error_msg = '';
        if(!web3 || state.wrongNetwork) {
            if(!web3) {
                error_msg = "No Ethereum wallet detected.";
                hiddenLoginBtn = '';
            } else if(state.isLoggedIn && state.wrongNetwork) {
                error_msg = "Wrong network! SimThunder is now on Polygon Network.";
            }
        }

        const switchNeeded = (web3 && state.wrongNetwork);

        return ([
            <header id="header" className="header h-fullscreen__page text-light">
                <div className="media-container parallax-window" data-parallax="scroll" data-image-src="assets/img/bg/bg-2.jpg" style={{ backgroundImage: 'url(\'/assets/img/bg/bg-8.png\')' }}></div>
                <div className="overlay bg-dark_A-40"></div>
                <div className="overlay d-flex align-items-center">
                    <div className="container text-center">
                        <div className="row align-items-center">
                            <div className="col-lg-6 mx-auto">
                                <div className="fadeIn ad-500ms">
                                    <img src="assets/img/logo-2.png" className="slideInLeft ad-400ms display-lg-2 fw-700 lh-2 mb-4" />
                                    <h2 className="lead-2 ls-3 d-block slideInRight ad-500ms fw-300 text-uppercase mb-7">Beta 1.2</h2>
                                    <h3 className={`lead-2 ls-3 slideInRight ad-500ms fw-300 text-uppercase mb-7 ${hiddenErrorMsg}`}><strong>{error_msg}</strong></h3>
                                    {switchNeeded && 
                                        this.renderSwitchButton()
                                    }
                                    <a className={`btn btn-lg btn-round btn-outline-light mr-2 ${hiddenLoginBtn}`} onClick={this.props.login}>Login</a>
                                    <a className={`btn btn-lg btn-round btn-outline-light ${hiddenRequestBtn}`} onClick={this.requestBtnClick}>Request Beta Access</a>
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
