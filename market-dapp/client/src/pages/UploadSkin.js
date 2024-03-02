import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import { Buffer } from 'buffer';
import { withRouter } from "react-router";
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle";
import UIHelper from "../utils/uihelper";
import Dropzone from 'react-dropzone-uploader';
import { getDroppedOrSelectedFiles } from 'html5-file-selector';
import * as $ from 'jquery';
import * as openpgp from 'openpgp';

import 'react-dropzone-uploader/dist/styles.css'

const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);

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
        const isSeller = (await contract.methods.getSeller(currentAccount).call()).active;
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
        let error = false;
        const { imageBuffer, image_ipfsPath } = this.state;

        // TODO: edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

        $(".dzu-dropzone .dzu-previewImage").each(async (idx, elem) => {
            const response = await ipfs.add(imageBuffer[$(elem).attr("alt").split(',')[0]]);

            if(response) {
                image_ipfsPath[idx] = response.path;
            } else {
                error = true;
                return false;
            }
        });
        if(error) { alert("Error on upload files. Please try again later."); return false; }

        this.setState({ image_ipfsPath });
        return true;
    }

    onIPFSSubmit = async () => {

        // edit mode, nothing to upload... continue and keep the same
        if("edit" === this.state.mode)
            return true;

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
            console.log(price);
            const ipfsPathBytes = web3.utils.asciiToHex(state.ipfsPath);
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
                state.stSkin.methods.newSkin(ipfsPathBytes, state.currentCar, state.currentSimulator, price, state.encryptedDataHash, nickname, state.image_ipfsPath, state.currentDescription, state.designer, state.license) : 
                state.stSkin.methods.editSkin(state.itemId, state.currentCar, state.currentSimulator, price, state.image_ipfsPath, state.currentDescription, state.designer, state.license)
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
        const { imageBuffer } = this.state;
        console.log(imageBuffer);

        if(status === "done") {
            const reader = new window.FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = () => {
                imageBuffer[meta.name] = Buffer(reader.result);
                this.setState({imageBuffer});
            }
        } else if(status === "removed") {
            delete imageBuffer[meta.name];
            this.setState({imageBuffer});
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

    simOptions = () => {
        const sims = [];

        for (const [index, value] of UIHelper.simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="16" alt="thumbnail" /> {value}</Dropdown.Item>)
        }

        return sims;
    }
    
    handleValidation = ({meta}) => {
      return this.state.imageBuffer[meta.name] !== undefined;
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
                                                            initialFiles={this.state.files}
                                                            LayoutComponent={({input, previews, submitButton, dropzoneProps}) => {
                                                                // Remove previews which do not pass the validation
                                                                const previewsToDisplay = previews.filter((preview) => {
                                                                  return preview.props.meta.status !== 'error_validation';
                                                                });
                                                                return (
                                                                  <div {...dropzoneProps}>
                                                                    {previewsToDisplay}
                                                                    {input}
                                                                    {submitButton}
                                                                  </div>
                                                                );
                                                              }}
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
