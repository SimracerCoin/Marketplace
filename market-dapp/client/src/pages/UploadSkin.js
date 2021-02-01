import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";

const openpgp = require('openpgp');

const priceConversion = 10**18;

class UploadSkin extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            currentAccount: null,
            currentCar: "Choose your car brand",
            currentSimulator: "Choose your simulator",
            currentFilePrice: null,
            contract: null,
            ipfsHash: null,
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false
        }


        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
    };


    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ currentAccount: currentAccount, contract: contract, isSeller: isSeller });
    };


    handleChangeHash = (event) => {
        console.log("IPFS Hash: " + event.target.value);
        this.setState({ ipfsHash: event.target.value });
    }

    handleFilePrice = (event) => {
        const re = /^[0-9\b]+$/;
        if (event.target.value === '' || re.test(event.target.value)) {
            this.setState({priceValue: event.target.value});
            console.log("File price: " + event.target.value);
            this.setState({ currentFilePrice: event.target.value * priceConversion});
        }
    }


    onSelectCar = async (event) => {
        //event.preventDefault();
        console.log("Choosing car: " + event);
        this.setState({ currentCar: event });
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

    onIPFSSubmit = async (event) => {
        event.preventDefault();

        const password = await Prompt('Password to encrypt');

        if(!password) return;

        const { message } = await openpgp.encrypt({
            message: openpgp.message.fromBinary(this.state.buffer), // input as Message object
            passwords: [password],                                  // multiple passwords possible
            armor: false                                            // don't ASCII armor (for Uint8Array output)
        });
        const encryptedBuffer = message.packets.write(); // get raw encrypted packets as Uint8Array

        const response = await ipfs.add(encryptedBuffer, (err, ipfsHash) => {
            console.log(err, ipfsHash);
            //setState by setting ipfsHash to ipfsHash[0].hash 
            this.setState({ ipfsHash: ipfsHash[0].hash });
        })
        this.setState({ ipfsHash: response.path });
    };

    saveSkin = async (event) => {
        event.preventDefault();

        if (this.state.currentFilePrice === null) {
            alert('Item price must be an integer');
        } else {
            let nickname = "";
            if(!this.state.isSeller) {
                nickname = await Prompt('Enter a nickname');
                if(!nickname) return;
            }

            const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

            //document.getElementById('formInsertCar').reset()
            console.log("Current account: " + this.state.currentAccount);
            console.log("Current hash: " + this.state.ipfsHash);
            console.log("Current car: " + this.state.currentCar);
            console.log("Current simulator: " + this.state.currentSimulator);
            console.log("Current price: " + this.state.currentFilePrice);

            const ipfsHashBytes = this.state.drizzle.web3.utils.fromAscii(this.state.ipfsHash);
            
            // TO DO: change placeholders for correct values
            const placeholder = this.state.drizzle.web3.utils.fromAscii('some hash');
            console.log(placeholder);

            const response = await this.state.contract.methods.newSkin(ipfsHashBytes, this.state.currentCar,
                this.state.currentSimulator, price, placeholder, placeholder, nickname).send({ from: this.state.currentAccount });
            console.log(response);

            alert("The new skin is available for sale!");
        }
    }

    render() {
        const carsElements = ["Chevrolet Monte Carlo SS", "Legends Ford 34 Coupe", "Legends Ford 34 Coupe - Rookie", "NASCAR Cup Series Chevrolet Camaro ZL1", "NASCAR Cup Series Ford Mustang",
            "NASCAR Cup Series Toyota Camry", "Super Late Model", "Aston Martin DBR9 GT1", "Audi 90 GTO", "Audi R18", "Audi R8 LMS",
            "BMW M4 GT4", "BMW M8 GTE", "Cadillac CTS-V Racecar", "Chevrolet Corvette C6R GT1", "Dallara F3", "Dallara IR18", "Ferrari 488 GT3",
            "Ferrari 488 GTE", "Ford Fiesta RS WRC", "Ford GT", "Ford Mustang FR500S", "McLaren MP4-30"];
        const simsElements = ["iRacing", "F12020", "rFactor", "Asseto Corsa"];

        const cars = [];
        const sims = [];

        for (const [index, value] of carsElements.entries()) {
            cars.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }

        for (const [index, value] of simsElements.entries()) {
            sims.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }


        return (
            <header className="header">
                <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                    <div className="container">
                        <div>
                            <h2> Add new Car Skin for sale </h2>
                            <Form onSubmit={this.onIPFSSubmit}>
                                <input
                                    type="file"
                                    onChange={this.captureFile}
                                />
                                <br></br>
                                <Button type="submit">Generate IPFS Hash</Button>
                            </Form>

                        </div>
                        <div>
                            <Form>
                                <Form.Group controlId="formInsertCar">
                                    <Form.Label>Insert Car</Form.Label>
                                    <Form.Control type="text" placeholder="Generate IPFS Hash" value={this.state.ipfsHash} onChange={this.handleChangeHash} readOnly />
                                    <br></br>
                                    <Form.Control type="text" pattern="[0-9]*" placeholder="Enter File Price" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                    <br></br>
                                    <DropdownButton id="dropdown-cars-button" title={this.state.currentCar} onSelect={this.onSelectCar}>
                                        {cars}
                                    </DropdownButton>
                                    <br></br>
                                    <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                        {sims}
                                    </DropdownButton>
                                </Form.Group>
                            </Form>
                        </div>
                        <div>
                            <Button onClick={this.saveSkin}>Save Skin</Button>
                        </div>
                    </div>
                </section>
            </header>
        );
    }
}


export default UploadSkin;
