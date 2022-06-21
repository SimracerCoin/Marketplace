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
            image_ipfsPath: "",
            encryptedDataHash: null,
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
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ currentAccount: currentAccount, contract: contract, isSeller: isSeller });
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


    onSelectCar = async (event) => {
        //event.preventDefault();
        console.log("Choosing car: " + event.target.value);
        this.setState({ currentCar: event.target.value });
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

        const encryptedDataHash = computeMerkleRootHash(Buffer.from(encryptedBuffer));
        console.log(`Logger Root Hash: ${encryptedDataHash}`);

        const response = await ipfs.add(encryptedBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ ipfsPath: ipfsPath[0].hash });
        })
        this.setState({ ipfsPath: response.path, encryptedDataHash: encryptedDataHash });
    };

    saveSkin = async (event) => {
        event.preventDefault();

        if (this.state.currentFilePrice === null) {
            alert('Item price must be an integer');
        } else {
            let nickname = "";
            if (!this.state.isSeller) {
                nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
                if (!nickname) return;
            }

            UIHelper.showSpinning();

            const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

            //document.getElementById('formInsertCar').reset()
            console.log("Current account: " + this.state.currentAccount);
            console.log("Current hash: " + this.state.ipfsPath);
            console.log("Current car: " + this.state.currentCar);
            console.log("Current simulator: " + this.state.currentSimulator);
            console.log("Current price: " + this.state.currentFilePrice);

            const ipfsPathBytes = this.state.drizzle.web3.utils.fromAscii(this.state.ipfsPath);

            // TO DO: change placeholders for correct values
            const placeholder = this.state.drizzle.web3.utils.fromAscii('some hash');
            console.log(placeholder);

            const response_saveImage = await this.saveImage_toIPFS();

            if (response_saveImage == true) {
                const response = await this.state.contract.methods.newSkin(ipfsPathBytes, this.state.currentCar,
                    this.state.currentSimulator, price, placeholder, this.state.encryptedDataHash, nickname, this.state.image_ipfsPath)
                    .send({ from: this.state.currentAccount })
                    //.on('sent', UIHelper.transactionOnSent)
                    .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                        UIHelper.transactionOnConfirmation("The new skin is available for sale!");
                    })
                    .on('error', UIHelper.transactionOnError)
                    .catch(function (e) { });
            }
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
                                    <h2 class="ls-1 text-center">Add new Car Skin for sale</h2>
                                    <hr class="w-10 border-warning border-top-2 o-90" />
                                    <div>
                                        <Form onSubmit={this.onIPFSSubmit}>
                                            <div class="form-group">
                                                <FormLabel for="skin-file" className="col-sm-3 mr-2 col-form-label font-weight-bold">Choose Skin file:</FormLabel>
                                                <input id="skin-file"
                                                    type="file" accept=".tga"
                                                    onChange={this.captureFile} />
                                            </div>
                                            <div class="form-row">
                                                <Button className="col-3 mr-2" type="submit">Generate IPFS Hash</Button>
                                                <Form.Control className="col-8" type="text" placeholder="Generate IPFS Hash" value={this.state.ipfsPath} onChange={this.handleChangeHash} readOnly />
                                            </div>
                                        </Form>
                                    </div>
                                    <div class="mt-4">
                                        <Form>
                                            <div class="form-row">
                                                <div class="form-group col-6">
                                                    <Form.Control type="text" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group col-6">
                                                    <Form.Control type="text" placeholder="Enter Car brand" onChange={this.onSelectCar} />
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group col-6">
                                                    <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                                        {sims}
                                                    </DropdownButton>
                                                </div>
                                            </div>
                                        </Form>
                                    </div>
                                    <div>
                                        <Form onSubmit={this.saveImage_toIPFS}>
                                            <div class="form-group">
                                                <FormLabel for="skin-image" className="col-sm-3 mr-2 col-form-label font-weight-bold">Choose Skin image:</FormLabel>
                                                <input id="skin-image"
                                                    type="file" accept=".png,.jpg,.jpeg"
                                                    onChange={this.uploadImageIPFS} />
                                            </div>
                                        </Form>
                                    </div>
                                    <div class="form-row mt-4">
                                        <Button onClick={this.saveSkin}>Save Skin</Button>
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
