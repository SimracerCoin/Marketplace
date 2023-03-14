import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle"
import UIHelper from "../utils/uihelper"

const openpgp = require('openpgp');

const priceConversion = 10**18;
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);

class UploadCar extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            accounts: null,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            currentSeason: null,
            currentSeries: null,
            currentDescription: null,
            contract: null,
            encryptedDataHash: null,
            ipfsPath: "",
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            priceValue: ""
        }

        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.handleSeason = this.handleSeason.bind(this);
        this.handleSeries = this.handleSeries.bind(this);
        this.handleDescription = this.handleDescription.bind(this);
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
        const re = new RegExp(event.target.pattern);
        if (re.test(event.target.value)) {
            console.log("File price: " + event.target.value);
        } else {
            event.target.value = '';
        }

        this.setState({ priceValue: event.target.value })
    }

    handleSeason = (event) => {
        this.setState({ currentSeason: event.target.value });
    }

    handleDescription = (event) => {
        this.setState({ currentDescription: event.target.value });
    }

    handleSeries = (event) => {
        this.setState({ currentSeries: event.target.value });
    }

    onSelectCar = async (event) => {
        this.setState({ currentCar: event.target.value });
    }

    onSelectTrack = async (event) => {
        this.setState({ currentTrack: event.target.value });
    }

    onSelectSim = async (event) => {
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

    onIPFSSubmit = async () => {
        var fileName = document.getElementById('car-file').value.toLowerCase();
        if (!fileName.endsWith('.zip')) {
            alert('You can upload .zip files only.');
            return false;
        }

        const password = NON_SECURE_SELL ? NON_SECURE_KEY : await Prompt('Type the password to encrypt the file. Use different password for each item.');
        if (!password) return false;

        const { message } = await openpgp.encrypt({
            message: openpgp.message.fromBinary(this.state.buffer), // input as Message object
            passwords: [password],                                  // multiple passwords possible
            armor: false                                            // don't ASCII armor (for Uint8Array output)
        });
        const encryptedBuffer = message.packets.write(); // get raw encrypted packets as Uint8Array

        const encryptedDataHash = computeMerkleRootHash(Buffer.from(encryptedBuffer));
        console.log(`Logger Root Hash: ${encryptedDataHash}`);

        const response = await ipfs.add(encryptedBuffer, (err, ipfsPath) => {
            //console.log(err, ipfsPath);
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ ipfsPath: ipfsPath[0].hash });
        })
        this.setState({ ipfsPath: response.path, encryptedDataHash: encryptedDataHash });

        return true;
    };

    saveCar = async (event) => {
        event.preventDefault();

        if (!this.state.priceValue) {
            alert('Item price must be a number');
        } else if(!this.state.buffer) {
            alert('File missing or invalid!');
        } else {
            let nickname = "";
            if (!this.state.isSeller) {
                nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
                if (!nickname) return;
            }

            UIHelper.showSpinning();

            if(!(await this.onIPFSSubmit())) {
                return;
            }

            const price = this.state.drizzle.web3.utils.toWei(this.state.priceValue);

            console.log("Current account: " + this.state.currentAccount);
            console.log("Current hash: " + this.state.ipfsPath);
            console.log("Current car: " + this.state.currentCar);
            console.log("Current track: " + this.state.currentTrack);
            console.log("Current simulator: " + this.state.currentSimulator);
            console.log("Current season: " + this.state.currentSeason);
            console.log("Current price: " + this.state.priceValue);

            const ipfsPathBytes = this.state.drizzle.web3.utils.fromAscii(this.state.ipfsPath);

            // TO DO: change placeholders for correct values
            const placeholder = this.state.drizzle.web3.utils.fromAscii('');
            console.log(placeholder);

            let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

            await this.state.contract.methods.newCarSetup(ipfsPathBytes, this.state.currentCar, this.state.currentTrack,
                this.state.currentSimulator, this.state.currentSeason, this.state.currentSeries, this.state.currentDescription, price, placeholder, this.state.encryptedDataHash, nickname)
                .send(paramsForCall)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    window.localStorage.setItem('forceUpdate','yes');
                    if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                        UIHelper.transactionOnConfirmation("The new car setup is available for sale!", "/");
                    }
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) {
                    UIHelper.hideSpinning();
                 });
        }
    }

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];
        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="16" alt="thumbnail" /> {value}</Dropdown.Item>)
        }

        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <h2 className="ls-1 text-center">Add new Car Setup for sale</h2>
                                <hr className="w-10 border-warning border-top-2 o-90" />
                                <div className="mt-4">
                                    <Form>
                                        <div className="form-row">
                                            <div className="form-group col-12">
                                                <FormLabel for="car-file" className="mr-2 col-form-label font-weight-bold">Choose Setup file (.zip):</FormLabel>
                                                <input id="car-file" type="file" accept=".zip" onChange={this.captureFile} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <Form.Control type="number" min="0" step="1" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <Form.Control type="text" placeholder="Enter Season" onChange={this.handleSeason} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <Form.Control type="text" placeholder="Enter Series name" onChange={this.handleSeries} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <Form.Control type="text" placeholder="Enter Car brand" onChange={this.onSelectCar} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <Form.Control type="text" placeholder="Enter Track" onChange={this.onSelectTrack} />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6 col-12">
                                                <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                                    {sims}
                                                </DropdownButton>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-12">
                                                <Form.Control as="textarea" placeholder="Enter Description" onChange={this.handleDescription} />
                                            </div>
                                        </div>
                                    </Form>
                                </div>
                                <div className="form-row mt-4">
                                    <Button onClick={this.saveCar}>Save Car</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default UploadCar;
