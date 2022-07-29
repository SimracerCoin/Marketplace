import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle"
import UIHelper from "../utils/uihelper"

const openpgp = require('openpgp');

const priceConversion = 10 ** 18;

class UploadSkin extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            currentFilePrice: null,
            contract: null,
            ipfsPath: null,
            video_ipfsPath: "",
            encryptedDataHash: null,
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            videoBuffer: null,
        }


        //this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadVideoIPFS = this.uploadVideoIPFS.bind(this);
        this.saveVideo_toIPFS = this.saveVideo_toIPFS.bind(this);
    };


    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ currentAccount: currentAccount, contract: contract, isSeller: isSeller });
    };


    //handleChangeHash = (event) => {
    //    console.log("Handling IPFS Hash: " + event.target.value);
    //    this.setState({ ipfsPath: event.target.value });
    //}

    handleFilePrice = (event) => {
        const re = /([0-9]*[.])?[0-9]+/;
        if (event.target.value === '' || re.test(event.target.value)) {
            this.setState({ priceValue: event.target.value });
            console.log("Handling File price: " + event.target.value);
            this.setState({ currentFilePrice: event.target.value * priceConversion });
        }
    }

    handleDescription = (event) => {
        console.log("Handling Description: " + event.target.value);
        this.setState({ currentDescription: event.target.value });
    }

    handleSeries = (event) => {
        console.log("Handling Series: " + event.target.value);
        this.setState({ currentSeries: event.target.value });
    }

    onSelectSimulator = async (event) => {
        console.log("Choosing Simulator: " + event);
        this.setState({ currentSimulator: event });
    }


    convertToBuffer = async (reader) => {
        //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
        //set this buffer -using es6 syntax
        this.setState({ buffer });
    };

    captureVideoFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
    };

    //Guarda o video no ipfs 
    saveVideo_toIPFS = async () => {
        

        console.log('saveVideo_toIPFS....');

        const response = await ipfs.add(this.state.videoBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            console.log("Response video path on ipfs: ", ipfsPath[0].hash);
            this.setState({ video_ipfsPath: ipfsPath[0].hash });
        })

        this.setState({ video_ipfsPath: response.path });
        return true;

    }

    //Transforma o video num buffer e guarda como estado
    //apenas se tiver menos de 30secs
    uploadVideoIPFS = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0];


        const readVideoAsBuffer = () => {

            const reader = new window.FileReader()
            reader.readAsArrayBuffer(file)
            reader.onloadend = () => {
                this.setState({ videoBuffer: Buffer(reader.result) })
                console.log('video buffer', this.state.videoBuffer)
            }
        } 

        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            const duration = video.duration;
            console.log("video duration: " + duration + " secs");

            if(duration > 30) {
                alert("The video duration must not exceed 30 seconds!");
            } else {
                readVideoAsBuffer();
            }
        
        }

        video.src = URL.createObjectURL(file);
    }

    saveSimracerMoment = async (event) => {
        event.preventDefault();

        if (this.state.currentFilePrice === null) {
            alert('Item price must be an integer');
        } else {

            UIHelper.showSpinning();

            const response_saveImage = await this.saveVideo_toIPFS();
            const response_saveJson = await this.saveJSON_toIPFS(this.state.video_ipfsPath);

            const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

            //'https://gateway.pinata.cloud/ipfs/Qmboj3b42aW2nHGuQizdi2Zp35g6TBKmec6g77X9UiWQXg'
            let tx = await this.state.contractNFTs.methods.awardItem(this.state.contractNFTs.address, this.state.currentAccount, price, 'https://ipfs.io/ipfs/' + this.state.jsonData_ipfsPath)
                .send({ from: this.state.currentAccount })
                //.on('sent', UIHelper.transactionOnSent)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    UIHelper.transactionOnConfirmation("The new Simracing Moment NFT is available for sale!");
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) { });
        }
    }

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];
        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="24" /> {value}</Dropdown.Item>)
        }

        return (
            <header className="header">
                <div class="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div class="container position-relative">
                        <div class="row">
                            <div class="col-lg-8 mx-auto">
                                <div>
                                    <h2 class="ls-1 text-center">Mint new Simracing Moment NFT</h2>
                                    <hr class="w-10 border-warning border-top-2 o-90" />
                                    <div>
                                        <Form>
                                            <Form.Group controlId="formInsertCar">
                                                <Form.Control type="text" placeholder="Enter Series name" onChange={this.handleSeries} />
                                                <br></br>
                                                <Form.Control as="textarea" placeholder="Enter Description" onChange={this.handleDescription} />
                                                <br></br>
                                                <Form.Control type="text" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                <br></br>
                                                <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSimulator}>
                                                    {sims}
                                                </DropdownButton>
                                            </Form.Group>
                                        </Form>
                                    </div>

                                    <div>
                                      {/* Video file (max 30 secs) */}  
                                    <div> Add Video For Simracing Moment NFT</div>
                                        <Form onSubmit={this.saveVideo_toIPFS}>
                                            <input id="skin-video"
                                                type="file" accept="video/*"
                                                onChange={this.uploadVideoIPFS}
                                            />
                                            <br></br>

                                        </Form>
                                    </div><br></br>
                                    <div class="form-row mt-4">
                                        <Button onClick={this.saveSimracerMomentNFT}>Mint Simracing Moment NFT</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default UploadSkin;
