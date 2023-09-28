import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import { withRouter } from "react-router";
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle"
import UIHelper from "../utils/uihelper"
import Dropzone from 'react-dropzone-uploader'
import { getDroppedOrSelectedFiles } from 'html5-file-selector'
import * as $ from 'jquery'

import 'react-dropzone-uploader/dist/styles.css'

const openpgp = require('openpgp');

const priceConversion = 10**18;
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);
const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];

class UploadSkin extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            contract: null,
            currentAccount: null,
            currentSimulator: "Choose your simulator",
            ipfsPath: "",
            image_ipfsPath: [],
            encryptedDataHash: "",
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            imageBuffer: [],
            priceValue: "",
            currentDescription: "",
            designer: "",
            license: "",
            mode: "create"
        }

        if(props.location.state) {
            this.state = {...this.state, ...props.location.state};
        }
    };

    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const isSeller = await contract.methods.isSeller(currentAccount).call();

        // TODO: rebuild image previewer
        /*if("edit" === this.state.mode && this.state.image_ipfsPath) {
            this.setState({files: []})
            this.state.image_ipfsPath.forEach(async (image) => {
                const res = await fetch("https://simthunder.infura-ipfs.io/ipfs/" + image);
                const buf = await res.arrayBuffer();

                const file = new File([buf], image, { type: res.headers.get('Content-Type') });
                this.state.files.push(file);
            });
        }*/

        this.setState({ currentAccount: currentAccount, contract: contract, isSeller: isSeller });

        UIHelper.scrollToTop();
    };

    handleFilePrice = (event) => {
        const re = new RegExp(event.target.pattern);
        if (!re.test(event.target.value)) {
            event.target.value = '';
        }

        this.setState({ priceValue: event.target.value })
    }

    handleDescription = (event) => {
        this.setState({ currentDescription: event.target.value });
    }

    handleSelectCar = async (event) => {
        this.setState({ currentCar: event.target.value });
    }

    handleSelectSim = async (event) => {
        this.setState({ currentSimulator: event });
    }

    convertToBuffer = async (reader) => {
        //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
        //set this buffer -using es6 syntax
        this.setState({ buffer });
    };

    captureFile = (event) => {
        event.stopPropagation();
        event.preventDefault();

        var fileName = event.target.value.toLowerCase();
        if (!fileName.endsWith('.zip')) {
            alert('You can only upload .zip files.');
            event.target.value = "";
            return false;
        }

        /*if("edit" === this.state.mode) {
            if(!window.confirm("Are you sure you want to change the original skin file?")) {
                event.target.value = "";
                return false;
            }
        }*/

        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
    };

    //Guarda a imagem no ipfs 
    saveImage_toIPFS = async () => {
        let paths = [];
        let error = false;
        const { imageBuffer } = this.state;

        // TODO: edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

        $(".dzu-dropzone .dzu-previewImage").each(async (idx, elem) => {
            const path = (await ipfs.add(imageBuffer[$(elem).attr("src")])).path;
            if(path) {
                paths.push(path);
            } else {
                error = true;
                return false;
            }
        });
        if(error) { alert("Error on upload files. Please try again later."); return false; }

        this.setState({ image_ipfsPath: paths.reverse() });
        return true;
    }

    onIPFSSubmit = async () => {

        // edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

        const password = NON_SECURE_SELL ? NON_SECURE_KEY : await Prompt('Type the password to encrypt the file. Use different password for each item.');
        if (!password) { alert("Invalid password"); return false; }

        const { message } = await openpgp.encrypt({
            message: openpgp.message.fromBinary(this.state.buffer), // input as Message object
            passwords: [password],                                  // multiple passwords possible
            armor: false                                            // don't ASCII armor (for Uint8Array output)
        });
        const encryptedBuffer = message.packets.write(); // get raw encrypted packets as Uint8Array

        const encryptedDataHash = computeMerkleRootHash(Buffer.from(encryptedBuffer));
        console.log(`Logger Root Hash: ${encryptedDataHash}`);

        const response = await ipfs.add(encryptedBuffer, (err, ipfsPath) => {
            if(err) console.error(err);
        });

        if(!response) { 
            alert("Error on upload files. Please try again later.")
            return false;
        }

        this.setState({ ipfsPath: response.path, encryptedDataHash: encryptedDataHash });

        return true;
    };

    saveSkin = async (event) => {
        event.preventDefault();

        if (!this.state.priceValue) {
            alert('Item price is invalid');
        } else if("create" === this.state.mode && !this.state.buffer) {
            alert('File missing or invalid!');
        } else if(!simsElements.includes(this.state.currentSimulator)) {
            alert('Choose a simulator!');
        } else if(!this.state.currentDescription) {
            alert('Description is required!');
        } else {
            let nickname = "";
            if (!this.state.isSeller) {
                nickname = await Prompt('You are adding your first item for sale, please choose your seller nickname.');
                if (!nickname) return;
            }

            UIHelper.showSpinning();

            if(!(await Promise.all([this.onIPFSSubmit(), this.saveImage_toIPFS()])).every(e => e === true)) {
                UIHelper.hideSpinning();
                return;
            }

            const { state } = this;

            const price = state.drizzle.web3.utils.toWei(state.priceValue);
            const ipfsPathBytes = state.drizzle.web3.utils.asciiToHex(state.ipfsPath);
            const placeholder = state.drizzle.web3.utils.asciiToHex('');   // TODO
            const paramsForCall = await UIHelper.calculateGasUsingStation(state.currentAccount);

            //document.getElementById('formInsertCar').reset()
            console.log("id:", state.itemId);
            console.log("account:", state.currentAccount);
            console.log("hash:", state.ipfsPath);
            console.log("car:", state.currentCar);
            console.log("simulator:", state.currentSimulator);
            console.log("price:", state.priceValue);
            console.log("description:", state.currentDescription);
            console.log("designer:", state.designer);
            console.log("license:", state.license);
            console.log("image_ipfsPath:", state.image_ipfsPath);
            
            await (state.mode === "create" ? 
                state.contract.methods.newSkin(ipfsPathBytes, state.currentCar, state.currentSimulator, price, placeholder, state.encryptedDataHash, nickname, state.image_ipfsPath, state.currentDescription, state.designer, state.license) : 
                state.contract.methods.editSkin(state.itemId, state.currentCar, state.currentSimulator, price, state.image_ipfsPath, state.currentDescription, state.designer, state.license)
            ).send(paramsForCall)
            .on('confirmation', (confNumber, receipt, latestBlockHash) => {
                window.localStorage.setItem('forceUpdate','yes');
                if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                    UIHelper.transactionOnConfirmation("create" === state.mode ? 
                        "The new skin is available for sale!" : 
                        "The skin was edited successfully", "/");
                }
            })
            .on('error', UIHelper.transactionOnError)
            .catch( (e) => { 
                console.error(e);
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
                imageBuffer[meta.previewUrl] = Buffer(reader.result);
                this.setState({imageBuffer: imageBuffer});
            }
        } else if(status === "removed") {
            let imageBuffer = this.state.imageBuffer;
            delete imageBuffer[meta.previewUrl];
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
                                            {"create" === this.state.mode &&
                                                <div className="form-row">
                                                    <div className="form-group col-12">
                                                        <FormLabel htmlFor="skin-file" className="mr-2 col-form-label font-weight-bold">Choose Skin file (.zip):</FormLabel>
                                                        <input id="skin-file" type="file" accept=".zip" onChange={this.captureFile} />
                                                    </div>
                                                </div>
                                            }
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <Form.Control type="number" min="0" step="1" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <Form.Control type="text" placeholder="Enter Car brand" value={this.state.currentCar} onChange={this.handleSelectCar} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-md-6 col-12">
                                                    <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.handleSelectSim}>
                                                        {sims}
                                                    </DropdownButton>
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group col-12">
                                                    <Form.Control as="textarea" placeholder="Enter Description" value={this.state.currentDescription} onChange={this.handleDescription} />
                                                </div>
                                            </div>
                                            {"create" === this.state.mode &&
                                                <div className="form-row">
                                                    <div className="form-group col-md-6 col-12">
                                                        <FormLabel htmlFor="skin-image" className="mr-2 col-form-label font-weight-bold">Choose Skin images (first will be the main image):</FormLabel>
                                                        <Dropzone
                                                            id="dropzone"
                                                            onChangeStatus={this.onFileChange}
                                                            InputComponent={this.selectFileInput}
                                                            getFilesFromEvent={this.getFilesFromEvent}
                                                            SubmitButtonComponent={null}
                                                            autoUpload={false}
                                                            accept="image/*"
                                                            maxFiles={5}
                                                            inputContent={(files, extra) => (extra.reject ? 'Image files only' : 'Drag Files')}
                                                            initialFiles={this.state.files}
                                                            styles={{
                                                                dropzone: { maxHeight: 400 },
                                                                dropzoneActive: { borderColor: 'green' },
                                                                previewImage: { maxHeight: 60 },
                                                                dropzoneReject: { borderColor: 'red', backgroundColor: '#DAA' },
                                                                inputLabel: (files, extra) => (extra.reject ? { color: 'red' } : {})
                                                            }}            
                                                        />
                                                    </div>
                                                </div>
                                            }
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


export default withRouter(UploadSkin);
