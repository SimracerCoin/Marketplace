import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle"
import UIHelper from "../utils/uihelper"
import Dropzone from 'react-dropzone-uploader'
import { getDroppedOrSelectedFiles } from 'html5-file-selector'

import 'react-dropzone-uploader/dist/styles.css'

const openpgp = require('openpgp');

const priceConversion = 10**18;
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);

class UploadSkin extends Component {

    constructor(props) {
        super(props)

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            contract: null,
            ipfsPath: "",
            image_ipfsPath: [],
            encryptedDataHash: null,
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            imageBuffer: [],
            priceValue: "",
            currentDescription: null
        }

        this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadImageIPFS = this.uploadImageIPFS.bind(this);
        this.saveImage_toIPFS = this.saveImage_toIPFS.bind(this);
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

    handleDescription = (event) => {
        this.setState({ currentDescription: event.target.value });
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
        let paths = [];
        let imageBuffer = Object.values(this.state.imageBuffer.sort((a,b) => {return a.pos - b.pos}));
        for(let i = 0; i < imageBuffer.length; ++i) {
            const path = (await ipfs.add(imageBuffer[i].buffer)).path;
            if(path) paths.push(path);
            else return false;
        }

        this.setState({ image_ipfsPath: paths });
        return true;
    }

    /** @deprecated */
    //Transforma a imagem num buffer e guarda como estado
    uploadImageIPFS = (event) => {
        event.stopPropagation();
        event.preventDefault();

        var filePath = event.target.value;
         
        // Allowing file type
        var allowedExtensions =
                /(\.jpg|\.jpeg|\.png|\.gif|\.bmp)$/i;
            
        if (!allowedExtensions.exec(filePath)) {
            alert('Invalid file type');
            event.target.value = '';
            return false;
        }

        this.setState({imageBuffer: []});

        for (let i = 0; i < event.target.files.length; i++) {
            const file = event.target.files[i];
            const reader = new window.FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = () => {
                this.state.imageBuffer.push(Buffer(reader.result));
            }
        }
    }

    onIPFSSubmit = async () => {
        var fileName = document.getElementById('skin-file').value.toLowerCase();
        if (!fileName.endsWith('.zip')) {
            alert('You can only upload .zip files.');
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
            console.log(err, ipfsPath);
            //setState by setting ipfsPath to ipfsPath[0].hash 
            this.setState({ ipfsPath: ipfsPath[0].hash });
        });

        this.setState({ ipfsPath: response.path, encryptedDataHash: encryptedDataHash });

        return true;
    };

    saveSkin = async (event) => {
        event.preventDefault();

        if (!this.state.priceValue) {
            alert('Item price is invalid');
        } else if(!this.state.buffer) {
            alert('File missing or invalid!');
        } else {
            let nickname = "";
            if (!this.state.isSeller) {
                nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
                if (!nickname) return;
            }

            UIHelper.showSpinning();

            if(!(await Promise.all([this.onIPFSSubmit(), this.saveImage_toIPFS()])).every(e => e === true)) {
                alert("Error on upload files. Please try again later.");
                UIHelper.hideSpinning();
            }

            const price = this.state.drizzle.web3.utils.toWei(this.state.priceValue);

            //document.getElementById('formInsertCar').reset()
            console.log("Current account: " + this.state.currentAccount);
            console.log("Current hash: " + this.state.ipfsPath);
            console.log("Current car: " + this.state.currentCar);
            console.log("Current simulator: " + this.state.currentSimulator);
            console.log("Current price: " + this.state.priceValue);

            const ipfsPathBytes = this.state.drizzle.web3.utils.fromAscii(this.state.ipfsPath);

            // TO DO: change placeholders for correct values
            const placeholder = this.state.drizzle.web3.utils.fromAscii('');

            let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

            await this.state.contract.methods.newSkin(ipfsPathBytes, this.state.currentCar,
                this.state.currentSimulator, price, placeholder, this.state.encryptedDataHash, nickname, this.state.image_ipfsPath, this.state.currentDescription)
                .send(paramsForCall)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    window.localStorage.setItem('forceUpdate','yes');
                    if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                        UIHelper.transactionOnConfirmation("The new skin is available for sale!", "/");
                    }
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) { 
                    UIHelper.hideSpinning();
                });
        }
    }

    onFileChange = ({ meta, file }, status) => {
        if(status === "done") {
            const reader = new window.FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = () => {
                let imageBuffer = this.state.imageBuffer;
                imageBuffer[meta.id] = { buffer: Buffer(reader.result), pos: Object.keys(imageBuffer).length + 1 };
                this.setState({imageBuffer: imageBuffer});
            }
        } else if(status === "removed") {
            let imageBuffer = this.state.imageBuffer;
            let pos_c = imageBuffer[meta.id].pos;
            Object.values(imageBuffer).forEach((image, idx) => {
                if(image.pos > pos_c) imageBuffer[Object.keys(imageBuffer)[idx]].pos -=1;
            })
            delete imageBuffer[meta.id];
            this.setState({imageBuffer: imageBuffer});
        }
    }
    getFilesFromEvent = e => {
        return new Promise(resolve => {
            getDroppedOrSelectedFiles(e).then(chosenFiles => {
                resolve(chosenFiles.map(f => f.fileObject))
            })
        })
    }
    selectFileInput = ({ accept, onFiles, files, getFilesFromEvent }) => {
        const textMsg = files.length > 0 ? 'Add More' : 'Select Files'
        return (
            <label className="btn btn-danger mt-4">
                {textMsg}
                <input
                    style={{ display: 'none' }}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={e => {
                        getFilesFromEvent(e).then(chosenFiles => {
                            onFiles(chosenFiles)
                        })
                    }}
                />
            </label>
        )
    }

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];
        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} alt="tumb" width="24" /> {value}</Dropdown.Item>)
        }

        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <div>
                                    <h2 className="ls-1 text-center">Add new Car Skin for sale</h2>
                                    <hr className="w-10 border-warning border-top-2 o-90" />
                                    <div className="mt-4">
                                        <Form>
                                            <div className="form-row">
                                                <div className="form-group col-12">
                                                    <FormLabel htmlFor="skin-file" className="mr-2 col-form-label font-weight-bold">Choose Skin file (.zip):</FormLabel>
                                                    <input id="skin-file" type="file" accept=".zip" onChange={this.captureFile} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <Form.Control type="number" min="0" step="1" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <Form.Control type="text" placeholder="Enter Car brand" onChange={this.onSelectCar} />
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
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <FormLabel htmlFor="skin-image" className="mr-2 col-form-label font-weight-bold">Choose Skin image (first will be the main image):</FormLabel>
                                                    <Dropzone
                                                        id="dropzone"
                                                        onChangeStatus={this.onFileChange}
                                                        InputComponent={this.selectFileInput}
                                                        getFilesFromEvent={this.getFilesFromEvent}
                                                        SubmitButtonComponent={null}
                                                        autoUpload={false}
                                                        accept="image/*"
                                                        maxFiles={5}
                                                        inputContent="Drop A File"
                                                        styles={{
                                                            dropzone: { maxHeight: 400 },
                                                            dropzoneActive: { borderColor: 'green' },
                                                            previewImage: { maxHeight: 60 }
                                                        }}            
                                                    />
                                                    {/*<input id="skin-image"  
                                                        type="file" accept="image/*"
                                                        onChange={this.uploadImageIPFS} multiple />*/}
                                                </div>
                                            </div>
                                            <div className="form-row mt-4">
                                                <Button onClick={this.saveSkin}>Save Skin</Button>
                                            </div>
                                        </Form>
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
