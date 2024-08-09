import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import { Buffer } from 'buffer';
import { withRouter } from "react-router";
import ipfs from "../ipfs";
//import computeMerkleRootHash from "../utils/merkle";
import UIHelper from "../utils/uihelper";
import Dropzone from 'react-dropzone-uploader';
import { getDroppedOrSelectedFiles } from 'html5-file-selector';
//import * as openpgp from 'openpgp';

import 'react-dropzone-uploader/dist/styles.css'

/*
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);
*/

function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Convert to unsigned 32-bit integer
}

class UploadSkin extends Component {

    constructor(props) {
        super(props);

        this.state = {
            contract: null,
            currentAccount: null,
            currentCar: "",
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
    };

    componentDidMount = async () => {
        const { props } = this;
        const { drizzle, drizzleState } = props;

        const currentAccount = drizzleState.accounts[0];
        const contract = drizzle.contracts.STMarketplace;
        const isSeller = (await UIHelper.callWithRetry(contract.methods.getSeller(currentAccount))).active;
        const stSkin = await drizzle.contracts.STSkin;

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

        this.setState({ currentAccount, contract, stSkin, isSeller, ...props.location.state });

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

    handleSelectCar = (event) => {
        this.setState({ currentCar: event.target.value });
    }

    handleSelectSim = (event) => {
        this.setState({ currentSimulator: event });
    }

    convertToBuffer = (file) => {
        return new Promise(async (resolve, reject) => {
            const handleError = error => {
                alert("Error on upload the file. Please try again.");
                console.error('Error reading file:', error);
                reject();
            }

            if(file) {
                UIHelper.showSpinning("Wait for file upload...")
                const reader = new FileReader()
                reader.readAsArrayBuffer(file)
                //file is converted to a buffer for upload to IPFS
                reader.onloadend = () => {
                    UIHelper.hideSpinning(); 
                    resolve(Buffer.from(reader.result));
                }
                reader.onerror = event => handleError(event.target.error);
            } else {
                handleError("missing file");
            }
        });
    }

    captureFile = (event) => {
        event.stopPropagation();
        event.preventDefault();

        var fileName = event.target.value.toLowerCase();
        if (!fileName.endsWith('.zip')) {
            alert('You can only upload .zip files.');
            event.target.value = "";
            return false;
        }
        this.convertToBuffer(event.target.files[0]).then(buffer => this.setState({buffer}));
    };

    onFileChange = ({ meta, file, remove }, status) => {
        const { imageBuffer } = this.state;
    
        if(meta.error) return;
    
        switch (status) {
            case "done":
                this.convertToBuffer(file).then(buffer => {
                    imageBuffer[hashString(meta.name)] = buffer;
                    this.setState({ imageBuffer });
                });
                break;
    
            case "removed":
                delete imageBuffer[hashString(meta.name)];
                this.setState({ imageBuffer });
                break;
    
            case "error_validation":
                meta.error = true;
                remove();
                break;
    
            default:
                console.log("Unhandled status:", status);
                break;
        }
    }

    //Guarda a imagem no ipfs 
    saveImage_toIPFS = async () => {
        let error = false;
        const image_ipfsPath = [];
        const { imageBuffer } = this.state;

        // TODO: edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

        for (const img of [...document.querySelectorAll(".dzu-dropzone .dzu-previewImage")].map(img => hashString(img.alt.split(',')[0]))) {
            try {
                let response = await ipfs.add(imageBuffer[img]);
                if (response && response.path) {
                    image_ipfsPath.push(response.path);
                } else {
                    console.error("IPFS response is missing the 'path' property:", response);
                    error = true;
                    break;
                }
            } catch (err) {
                console.error("Error adding image to IPFS:", err);
                error = true;
                break;
            }
        }
        
        if(error) { 
            alert("Error on upload files. Please try again later."); 
            return false; 
        }

        this.setState({ image_ipfsPath });
        return true;
    }

    onIPFSSubmit = async () => {

        // edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

        const { web3 } = this.props.drizzle;

        /*
        const password = NON_SECURE_SELL ? NON_SECURE_KEY : await Prompt('Type the password to encrypt the file. Use different password for each item.');
        if (!password) { alert("Invalid password"); return false; }

        const message = await openpgp.createMessage({ binary: this.state.buffer });
        const encryptedBuffer = await openpgp.encrypt({
            message,                                                // input as Message object
            passwords: [password],                                  // multiple passwords possible
            format: 'binary'                                        // don't ASCII armor (for Uint8Array output)
        });
        const encryptedDataHash = computeMerkleRootHash(Buffer.from(encryptedBuffer));
        console.log(`Logger Root Hash: ${encryptedDataHash}`);
        */
        const encryptedBuffer = this.state.buffer;
        const encryptedDataHash = web3.utils.padRight(web3.utils.asciiToHex(""), 64);

        const response = await ipfs.add(encryptedBuffer, err => {
            if(err) console.error(err);
        });

        if(!response) { 
            alert("Error on upload files. Please try again later.")
            return false;
        }

        this.setState({ ipfsPath: response.path, encryptedDataHash });

        return true;
    };

    saveSkin = async (event) => {
        event.preventDefault();

        const { web3 } = this.props.drizzle;

        if (!this.state.priceValue) {
            alert('Item price is invalid');
        } else if("create" === this.state.mode && !this.state.buffer) {
            alert('File missing or invalid!');
        } else if(!UIHelper.simsElements.includes(this.state.currentSimulator)) {
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

            const price = web3.utils.toWei(state.priceValue);
            const ipfsPathBytes = web3.utils.asciiToHex(state.ipfsPath);
            //const paramsForCall = await UIHelper.calculateGasUsingStation(state.currentAccount);

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
            
            fetch('/api/methods/STSkin/' + (state.mode === "create" ? 'newSkinByOwner' : 'editSkinByOwner'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: state.mode === "create" ? 
                    JSON.stringify([state.currentAccount, ipfsPathBytes, state.currentCar, state.currentSimulator, price, state.encryptedDataHash, nickname, state.image_ipfsPath, state.currentDescription, state.designer, state.license]) :
                    JSON.stringify([state.currentAccount, state.itemId, state.currentCar, state.currentSimulator, price, state.image_ipfsPath, state.currentDescription, state.designer, state.license])  
            })
            .then(async (res) => {
                const data = await res.json();

                if(!res.ok || !data.success) {
                    UIHelper.transactionOnError(data.error || "Unexpected error. Please try again later.");
                } 
                else {
                    window.localStorage.setItem('forceUpdate','yes');
                    UIHelper.transactionOnConfirmation(state.mode === "create" ? 
                            "The new skin is available for sale!" : 
                            "The skin was edited successfully", "/");
                }
            })
            .catch(UIHelper.transactionOnError);
        }
    }
    getFilesFromEvent = e => {
        return new Promise((resolve, reject) => {
            getDroppedOrSelectedFiles(e).then(chosenFiles => {
                resolve(chosenFiles.map(f => f.fileObject))
            })
            .catch(err => {console.log(err); reject()});
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

    simOptions = () => {
        const sims = [];

        for (const [index, value] of UIHelper.simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="16" alt="thumbnail" /> {value}</Dropdown.Item>)
        }

        return sims;
    }
    
    handleValidation = ({meta}) => {
      return (hashString(meta.name) in this.state.imageBuffer);
    };

    render() {
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
                                                        {this.simOptions()}
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
                                                            validate={this.handleValidation}
                                                            onChangeStatus={this.onFileChange}
                                                            InputComponent={this.selectFileInput}
                                                            getFilesFromEvent={this.getFilesFromEvent}
                                                            SubmitButtonComponent={null}
                                                            autoUpload={false}
                                                            accept="image/*"
                                                            maxFiles={5}
                                                            inputContent={(files, extra) => (extra.reject ? 'Image files only' : 'Drag Files')}
                                                            //initialFiles={this.state.files}
                                                            styles={{
                                                                dropzone: { maxHeight: 500 },
                                                                dropzoneActive: { borderColor: 'green' },
                                                                previewImage: { maxHeight: 60 },
                                                                dropzoneReject: { borderColor: 'red', backgroundColor: '#DAA' },
                                                                inputLabel: (files, extra) => (extra.reject ? { color: 'red' } : {})
                                                            }}            
                                                        />
                                                        <span>(max. 5 files)</span>
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
