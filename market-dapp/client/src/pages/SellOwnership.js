import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormCheck } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle";
import UIHelper from "../utils/uihelper";
import "../css/auction.css";

const openpgp = require('openpgp');

const priceConversion = 10**18;
const timingOpt = ["1 day", "3 days", "7 days", "1 month", "3 month", "6 month"];
const timingOptions = [];
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);

class SellOwnership extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            currentSeries: "",
            currentCarNumber: "",
            contract: null,
            ipfsPath: "",
            image_ipfsPath: "",
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            imageBuffer: null,
            auctionItem: false,
            auctionTimeRange: false,
            currentTimingOption: timingOpt[0], 
            auctionStart: new Date(),
            auctionEnd: new Date(),
            priceValue: ""
        }


        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadImageIPFS = this.uploadImageIPFS.bind(this);
        this.saveImage_toIPFS = this.saveImage_toIPFS.bind(this);
        this.onSelectAuctionTiming = this.onSelectAuctionTiming.bind(this);
        this.handleAuction = this.handleAuction.bind(this);
        this.handleAuctionRange = this.handleAuctionRange.bind(this);
    };


    componentDidMount = async () => {

        for (const [index, value] of timingOpt.entries()) {
            timingOptions.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }

        let now = new Date();
        let daysForEnd = UIHelper.extractDaysFromAuctionString(timingOpt[0]);
        let endDate = this.getUpdatedEndDate(now,daysForEnd);
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimthunderOwner;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ auctionStart: now, auctionEnd:endDate, currentTimingOption: timingOpt[0], timingOptions: timingOptions, currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs, isSeller: isSeller });
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
    };

    handleCarNumber = (event) => {
        const re = new RegExp(event.target.pattern);
        console.log("pattern:",event.target.pattern);
        if (!re.test(event.target.value)) {
            console.log("entrou");
            event.target.value = "";
        }

        this.setState({ currentCarNumber: event.target.value });
    }

    handleSeries = (event) => {
        console.log("Series: " + event.target.value);
        this.setState({ currentSeries: event.target.value });
    }

    handleAuction = (value) => {
        console.log("Is auction: " + value);
        this.setState({ auctionItem: !this.state.auctionItem });
        if(this.state.auctionItem) {

            let now = new Date();
            //let daysForEnd = UIHelper.extractDaysFromAuctionString(this.state.currentTimingOption);
            //let endDate = UIHelper.addDaysToDate(now, daysForEnd);
            let endDate = this.getUpdatedEndDate(now, this.state.currentTimingOption);
            this.setState({auctionStart: now, auctionEnd: endDate});
        }
    }

    handleAuctionRange = (value) => {
        console.log("Is range auction: " + value);
        this.setState({ auctionTimeRange: !this.state.auctionTimeRange });
    }

    getUpdatedEndDate = (now, currentTimingOption) => {
       
        let daysForEnd = UIHelper.extractDaysFromAuctionString(currentTimingOption);
        let endDate = UIHelper.addDaysToDate(now, daysForEnd);
        return endDate;
    }

    setStartDate = async (value)=> {
        let daysForEnd = UIHelper.extractDaysFromAuctionString(this.state.currentTimingOption);
        let endDate = UIHelper.addDaysToDate(value, daysForEnd);

        this.setState({auctionStart: value, auctionEnd: endDate});
    }

    setEndDate = async (value)=> {
        this.setState({auctionEnd: value});
    }

    onSelectAuctionTiming = async(value) => {
        console.log("Choosing timing: " + value);
        this.setState({ currentTimingOption: value });

        let now = new Date();
        let endDate = this.getUpdatedEndDate(now, value);
        this.setState({auctionStart: now, auctionEnd: endDate});
        console.log('START: ' + now + " END: " +  endDate);
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
        var jsonData = { 'description': 'Simthunder Car Ownership', 'name': 'Car', 'image': 'https://simthunder.infura-ipfs.io/ipfs/' + image };
        //TODO: Change to standard attributes, remove price
        jsonData['series'] = this.state.currentSeries;
        //jsonData['seriesOwner'] = this.state.currentAccount;
        jsonData['carNumber'] = this.state.currentCarNumber;
        jsonData['simulator'] = this.state.currentSimulator;
        //jsonData['price'] = this.state.currentFilePrice / priceConversion;

        jsonData.attributes = [];
/*        jsonData.attributes.push(
            {
                "trait_type": "auction_item", 
                "value": this.state.auctionItem
            });

        if(this.state.auctionItem) {
            jsonData.attributes.push(
                {
                    "trait_type": "auction_time_range", 
                    "value": this.state.auctionTimeRange
                },
                {
                    "trait_type": "auction_time_range", 
                    "value": this.state.auctionTimeRange
                },
                {
                    "trait_type": "auctionStart", 
                    "value": this.state.auctionStart
                },
                {
                        "trait_type": "auctionEnd", 
                        "value": this.state.auctionEnd
                }
            )
        }    */

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

        if (!this.state.priceValue) {
            alert('Item price must be an integer');
        } else if(!this.state.imageBuffer) {
            alert('Image file missing or invalid!');
        } else {
            // let nickname = "";
            // if (!this.state.isSeller) {
            //     nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
            //     if (!nickname) return;
            // }

            UIHelper.showSpinning();

            const response_saveImage = await this.saveImage_toIPFS();
            const response_saveJson = await this.saveJSON_toIPFS(this.state.image_ipfsPath);

            if(response_saveImage && response_saveJson) {

                const price = this.state.drizzle.web3.utils.toWei(this.state.priceValue);

                //some gas estimations
                //estimate method gas consuption (units of gas)
                let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

                //'https://gateway.pinata.cloud/ipfs/Qmboj3b42aW2nHGuQizdi2Zp35g6TBKmec6g77X9UiWQXg'
                await this.state.contractNFTs.methods.awardItem(this.state.contractNFTs.address, this.state.currentAccount, price, 'https://simthunder.infura-ipfs.io/ipfs/' + this.state.jsonData_ipfsPath)
                    .send(paramsForCall)
                    //.on('sent', UIHelper.transactionOnSent)
                    .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                        window.localStorage.setItem('forceUpdate','yes');
                        if(confNumber >= NUMBER_CONFIRMATIONS_NEEDED) {
                            UIHelper.transactionOnConfirmation("The new car ownership NFT is available for sale!","/");
                        }
                    })
                    .on('error', UIHelper.transactionOnError)
                    .catch(function (e) {
                        UIHelper.hideSpinning();
                     });
            } else {
                UIHelper.hideSpinning();
            }

            
        }
    }

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];

        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="16" /> {value}</Dropdown.Item>)
        }


        return (
            <header className="header">
                <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <div>
                                    <h2 className="ls-1 text-center"> Mint new Car Ownership NFT for sale </h2>
                                    <hr className="w-10 border-warning border-top-2 o-90" />
                                    <div>
                                        <Form>
                                            <Form.Group controlId="formInsertCar">
                                                <Form.Control type="text" placeholder="Enter Series name" onChange={this.handleSeries} />
                                                <br></br>
                                                <Form.Control type="text" pattern="\d+$" placeholder="Enter Car number" value={this.state.currentCarNumber} onChange={this.handleCarNumber} />
                                                <br></br>
                                                <Form.Control type="number" min="0" step="1" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                <br></br>
                                                <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSim}>
                                                    {sims}
                                                </DropdownButton>
                                                <br></br>
                                                {false &&
                                                <div className="auction_item_input">
                                                    <div className="auction_item_checkbox_container">    
                                                        <FormCheck.Input type="checkbox" id='auction_item' value={this.state.auctionItem} onChange={this.handleAuction}/>
                                                        <FormCheck.Label className="auction_item_label">Timed auction ?</FormCheck.Label>
                                                    </div>
                                                    <div className={`further_date_options ${this.state.auctionItem ? 'auction_item_visible' : 'auction_item_invisible'}`}>
                                                     
                                                        <div>Duration:</div>   
                                                      
                                                        <DropdownButton className={`banner ${this.state.auctionItem ? 'auction_item_visible' : 'auction_item_invisible'}`} id="dropdown-choose-timing" title={this.state.currentTimingOption} onSelect={this.onSelectAuctionTiming}>
                                                            {this.state.timingOptions}
                                                        </DropdownButton>
                                                        <br></br>
                                                        <br></br>
                                                        <div className="auction_item_checkbox_container">    
                                                            <FormCheck.Input type="checkbox" id='timed_auction_item' value={this.state.c} onChange={this.handleAuctionRange}/>
                                                            <FormCheck.Label className="auction_item_label">Set date range ?</FormCheck.Label>
                                                        </div>
                                                        
                                                        <div className={`further_date_options ${this.state.auctionTimeRange ? 'auction_item_visible' : 'auction_item_invisible'}`}>
                                                            
                                                            <div>Date range:</div>
                                                            <Form.Control className="date_picker" type="date" value={this.state.auctionStart} onChange={(e) => this.setStartDate(e.target.value)} name="startDate" placeholder="Start date" />
                                                            <Form.Control className="date_picker" type="date" value={this.state.auctionEnd} onChange={(e) => this.setEndDate(e.target.value)} name="endDate" placeholder="End date" />
                                                        </div>
                                                    </div>
                                                </div>
                                                }
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
