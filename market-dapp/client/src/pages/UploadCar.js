import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button } from 'react-bootstrap';
import ipfs from "../ipfs";

class UploadCar extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            accounts: null,
            currentAccount: null,
            currentCar: "Choose your car brand",
            currentSimulator: "Choose your simulator",
            currentTrack: "Choose your track",
            currentSeason: null,
            currentFilePrice: null,
            contract: null,
            ipfsHash: null,
            formIPFS: "",
            formAddress: "",
            receivedIPFS: ""
        }


        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.handleSeason = this.handleSeason.bind(this);

    };


    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.IPFSInbox;
        this.setState({ currentAccount: currentAccount, contract: contract });
    };


    handleChangeHash = (event) => {
        console.log("IPFS Hash: " + event.target.value);
        this.setState({ ipfsHash: event.target.value });
    }

    handleFilePrice = (event) => {
        console.log("File price: " + event.target.value);
        this.setState({ currentFilePrice: event.target.value });
    }

    handleSeason = (event) => {
        console.log("Season: " + event.target.value);
        this.setState({ currentSeason: event.target.value });
    }

    onSelectCar = async (event) => {
        //event.preventDefault();
        console.log("Choosing car: " + event);
        this.setState({ currentCar: event });
    }

    onSelectTrack = async (event) => {
        //event.preventDefault();
        console.log("Choosing track: " + event);
        this.setState({ currentTrack: event });
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
        const response = await ipfs.add(this.state.buffer, (err, ipfsHash) => {
            console.log(err, ipfsHash);
            //setState by setting ipfsHash to ipfsHash[0].hash 
            this.setState({ ipfsHash: ipfsHash[0].hash });
        })

        console.log(response)
        console.log(response.path)
        this.setState({ ipfsHash: response.path })
    };

    saveCar = async (event) => {
        event.preventDefault();

        const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

        //document.getElementById('formInsertCar').reset()
        console.log("Current account: " + this.state.currentAccount);
        console.log("Current hash: " + this.state.ipfsHash);
        console.log("Current car: " + this.state.currentCar);
        console.log("Current track: " + this.state.currentTrack);
        console.log("Current simulator: " + this.state.currentSimulator);
        console.log("Current season: " + this.state.currentSeason);
        console.log("Current price: " + this.state.currentFilePrice);

        const response = await this.state.contract.methods.saveCar(this.state.currentAccount, this.state.ipfsHash, this.state.currentCar, this.state.currentTrack,
            this.state.currentSimulator, this.state.currentSeason, price).send({ from: this.state.currentAccount });
        console.log(response);
    }

    render() {
        const carsElements = ["Chevrolet Monte Carlo SS", "Legends Ford 34 Coupe", "Legends Ford 34 Coupe - Rookie", "NASCAR Cup Series Chevrolet Camaro ZL1", "NASCAR Cup Series Ford Mustang",
            "NASCAR Cup Series Toyota Camry", "Super Late Model", "Aston Martin DBR9 GT1", "Audi 90 GTO", "Audi R18", "Audi R8 LMS",
            "BMW M4 GT4", "BMW M8 GTE", "Cadillac CTS-V Racecar", "Chevrolet Corvette C6R GT1", "Dallara F3", "Dallara IR18", "Ferrari 488 GT3",
            "Ferrari 488 GTE", "Ford Fiesta RS WRC", "Ford GT", "Ford Mustang FR500S", "McLaren MP4-30"];
        const simsElements = ["iRacing", "F12020", "rFactor", "Asseto Corsa"];
        const tracksElements = ["Monza", "Daytona", "SPA", "LeMans", "Talladega", "Bristol", "Charlotte", "Portimão", "Brands Hatch"];

        const cars = [];
        const sims = [];
        const tracks = [];

        for (const [index, value] of carsElements.entries()) {
            cars.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }

        for (const [index, value] of simsElements.entries()) {
            sims.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }

        for (const [index, value] of tracksElements.entries()) {
            tracks.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }


        return (
            <div className="App">
                <div>
                    <h2> Add file to IPFS </h2>
                    <Form onSubmit={this.onIPFSSubmit}>
                        <input
                            type="file"
                            onChange={this.captureFile}
                        />
                        <br></br>
                        <Button type="submit">Send It</Button>
                    </Form>
                    <p> The IPFS hash is: {this.state.ipfsHash}</p>
                </div>
                <div>
                    <Form>
                        <Form.Group controlId="formInsertCar">
                            <Form.Label>Insert Car</Form.Label>
                            <Form.Control type="text" placeholder="Enter IPFS Hash" onChange={this.handleChangeHash} />
                            <br></br>
                            <Form.Control type="text" placeholder="Enter File Price" onChange={this.handleFilePrice} />
                            <br></br>
                            <Form.Control type="text" placeholder="Enter Season" onChange={this.handleSeason} />
                            <br></br>
                            <DropdownButton id="dropdown-cars-button" title={this.state.currentCar} onSelect={this.onSelectCar}>
                                {cars}
                            </DropdownButton>
                            <br></br>
                            <DropdownButton id="dropdown-track-button" title={this.state.currentTrack} onSelect={this.onSelectTrack}>
                                {tracks}
                            </DropdownButton>
                            <br></br>
                            <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                {sims}
                            </DropdownButton>
                        </Form.Group>
                    </Form>
                </div>
                <div>
                    <Button onClick={this.saveCar}>Save Car</Button>
                </div>
            </div>
        );
    }
}


export default UploadCar;
