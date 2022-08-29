import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle";
import UIHelper from "../utils/uihelper";

const openpgp = require('openpgp');

const priceConversion = 10 ** 18;

class SellOwnership extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            currentSeries: null,
            currentCarNumber: null,
            currentFilePrice: null,
            contract: null,
            ipfsPath: null,
            image_ipfsPath: "",
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            imageBuffer: null,
        }


        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadImageIPFS = this.uploadImageIPFS.bind(this);
        this.saveImage_toIPFS = this.saveImage_toIPFS.bind(this);
    };


    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimthunderOwner;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs, isSeller: isSeller });
    };


    handleChangeHash = (event) => {
        console.log("IPFS Hash: " + event.target.value);
        this.setState({ ipfsPath: event.target.value });
    }

    handleFilePrice = (event) => {
        const re = /([0-9]*[.])?[0-9]+/;
        if (event.target.value === '' || re.test(event.target.value)) {
            this.setState({ priceValue: event.target.value });
            console.log("File price: " + event.target.value);
            this.setState({ currentFilePrice: event.target.value * priceConversion });
        }
    }

    handleCarNumber = (event) => {
        const re = /^[0-9\b]+$/;
        if (event.target.value === '' || re.test(event.target.value)) {
            this.setState({ currentCarNumber: event.target.value });
        }
    }

    handleSeries = (event) => {
        console.log("Series: " + event.target.value);
        this.setState({ currentSeries: event.target.value });
    }

    onSelectSim = async (event) => {
        //event.preventDefault();
        console.log("Choosing sim: " + event);
        this.setState({ currentSimulator: event });
    }


    convertToBuffer = async (reader) => {
        //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
        //set this buffer -using es6 syntax
        this.setState({ buffer });
    };

    captureFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
    };

    //Guarda a imagem no ipfs 
    saveImage_toIPFS = async () => {
        var fileName = document.getElementById('skin-image').value.toLowerCase();

        console.log("Filename: " + fileName)

        const valid_fileName = fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')
        console.log("Valid filename: " + valid_fileName)
        if (!valid_fileName) {
            alert('You can upload .jpg, .png or .jpeg files only. Invalid file!');
            return false;
        }

        const response = await ipfs.add(this.state.imageBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            console.log("Response image: ", ipfsPath[0].hash)
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ image_ipfsPath: ipfsPath[0].hash });
        })

        this.setState({ image_ipfsPath: response.path });
        return true;

    }

    //Save JSON in ipfs 
    saveJSON_toIPFS = async (image) => {
        var jsonData = { 'description': 'Simthunder Car Ownership', 'name': 'Car', 'image': 'https://ipfs.io/ipfs/' + image };
        //TODO: Change to standard attributes, remove price
        jsonData['series'] = this.state.currentSeries;
        jsonData['seriesOwner'] = this.state.currentAccount;
        jsonData['carNumber'] = this.state.currentCarNumber;
        jsonData['simulator'] = this.state.currentSimulator;
        jsonData['price'] = this.state.currentFilePrice / priceConversion;

        var jsonStr = JSON.stringify(jsonData);

        const response = await ipfs.add(Buffer.from(jsonStr), (err, ipfsPath) => {
            console.log(err, ipfsPath);
            console.log("Response image: ", ipfsPath[0].hash)
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ jsonData_ipfsPath: ipfsPath[0].hash });
        })

        console.log('json ipfs: ' + response.path);
        this.setState({ jsonData_ipfsPath: response.path });
        return true;

    }


    //Transforma a imagem num buffer e guarda como estado
    uploadImageIPFS = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => {
            this.setState({ imageBuffer: Buffer(reader.result) })
            console.log('buffer', this.state.imageBuffer)
        }
    }



    onIPFSSubmit = async (event) => {
        event.preventDefault();

        var fileName = document.getElementById('skin-file').value.toLowerCase();
        if (!fileName.endsWith('.tga')) {
            alert('You can upload .tga files only.');
            return false;
        }

        const password = await Prompt('Type the password to encrypt the file. Use different password for each item.');

        if (!password) return;

        const { message } = await openpgp.encrypt({
            message: openpgp.message.fromBinary(this.state.buffer), // input as Message object
            passwords: [password],                                  // multiple passwords possible
            armor: false                                            // don't ASCII armor (for Uint8Array output)
        });
        const encryptedBuffer = message.packets.write(); // get raw encrypted packets as Uint8Array

        const loggerRootHash = computeMerkleRootHash(Buffer.from(encryptedBuffer));
        console.log(`Logger Root Hash: ${loggerRootHash}`);

        const response = await ipfs.add(encryptedBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ ipfsPath: ipfsPath[0].hash });
        })
        this.setState({ ipfsPath: response.path });
    };

    saveCarOwnershipNFT = async (event) => {
        event.preventDefault();

        if (this.state.currentFilePrice === null) {
            alert('Item price must be an integer');
        } else {
            // let nickname = "";
            // if (!this.state.isSeller) {
            //     nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
            //     if (!nickname) return;
            // }

            UIHelper.showSpinning();

            const response_saveImage = await this.saveImage_toIPFS();
            const response_saveJson = await this.saveJSON_toIPFS(this.state.image_ipfsPath);

            const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

            //'https://gateway.pinata.cloud/ipfs/Qmboj3b42aW2nHGuQizdi2Zp35g6TBKmec6g77X9UiWQXg'
            let tx = await this.state.contractNFTs.methods.awardItem(this.state.contractNFTs.address, this.state.currentAccount, price, 'https://ipfs.io/ipfs/' + this.state.jsonData_ipfsPath)
                .send({ from: this.state.currentAccount })
                //.on('sent', UIHelper.transactionOnSent)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    UIHelper.transactionOnConfirmation("The new car ownership NFT is available for sale!","/");
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) { });
        }
    }

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];

        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            sims.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }


        return (
            <header className="header">
                <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                    <div class="container position-relative">
                        <div class="row">
                            <div class="col-lg-8 mx-auto">
                                <div>
                                    <h2 class="ls-1 text-center"> Mint new Car Ownership NFT for sale </h2>
                                    <hr class="w-10 border-warning border-top-2 o-90" />
                                    <div>
                                        <Form>
                                            <Form.Group controlId="formInsertCar">
                                                <Form.Control type="text" placeholder="Enter Series name" onChange={this.handleSeries} />
                                                <br></br>
                                                <Form.Control type="text" pattern="[0-9]*" placeholder="Enter Car number" value={this.state.currentCarNumber} onChange={this.handleCarNumber} />
                                                <br></br>
                                                <Form.Control type="text" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                <br></br>
                                                <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                                    {sims}
                                                </DropdownButton>
                                            </Form.Group>
                                        </Form>
                                    </div>
                                    <div>
                                        <div> Add Image for new Car Ownership </div>
                                        <Form onSubmit={this.saveImage_toIPFS}>
                                            <input id="skin-image"
                                                type="file"
                                                onChange={this.uploadImageIPFS}
                                            />
                                            <br></br>

                                        </Form>
                                    </div><br></br>
                                    <div>
                                        <Button onClick={this.saveCarOwnershipNFT}>Mint Car Ownership NFT</Button>
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


export default SellOwnership;
