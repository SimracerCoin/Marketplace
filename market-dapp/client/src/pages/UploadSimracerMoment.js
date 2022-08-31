import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormLabel } from 'react-bootstrap';
import { Prompt } from 'react-st-modal';
import ipfs from "../ipfs";
import computeMerkleRootHash from "../utils/merkle"
import UIHelper from "../utils/uihelper"
import fetch from 'node-fetch';


const priceConversion = 10 ** 18;


const testingVideo = 'https://assets.json2video.com/sites/github/hello-world.mp4';

class UploadSimracerMoment extends Component {

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
            video_ipfsPath: "",
            image_ipfsPath: "",
            encryptedDataHash: null,
            formIPFS: "",
            formAddress: "",
            receivedIPFS: "",
            isSeller: false,
            videoBuffer: null,
            imageBuffer: null,
            priceValue:0
        }


        //this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadVideo = this.uploadVideo.bind(this);
        this.saveVideo_toIPFS = this.saveVideo_toIPFS.bind(this);
        this.saveSimracingMomentNFT = this.saveSimracingMomentNFT.bind(this);
    }


    componentDidMount = async () => {
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimracingMomentOwner;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs, isSeller: isSeller });
    };


    //handleChangeHash = (event) => {
    //    console.log("Handling IPFS Hash: " + event.target.value);
    //    this.setState({ ipfsPath: event.target.value });
    //}

    handleFilePrice = (event) => {
        const re = /([0-9]*[.])?[0-9]+/;
        if (event.target.value === '' || re.test(event.target.value)) {
            this.setState({ priceValue: event.target.value });
            console.log("Handling File price: " + event.target.value);
            this.setState({ currentFilePrice: event.target.value * priceConversion });
        }
    };

    checkInput = (value) => {
        let element = document.getElementById('skin-video');
        if(value === null || value.length <=0) {
            element.disabled=true;  
        }
        else if(this.state.currentSeries && this.state.currentDescription && this.state.currentSeries.length > 0 && this.state.currentDescription.length > 0 ) {
            element.disabled=false;
        } else {
            element.disabled=true;
        }
    }

    handleDescription = (event) => {
        console.log("Handling Description: " + event.target.value);
        this.setState({ currentDescription: event.target.value });
        this.checkInput(event.target.value);
    };

    handleSeries = (event) => {
        console.log("Handling Series: " + event.target.value);
        this.setState({ currentSeries: event.target.value });
        this.checkInput(event.target.value);
    };

    onSelectSimulator = async (event) => {
        console.log("Choosing Simulator: " + event);
        this.setState({ currentSimulator: event });
    };

    createVideoScene = (description, series) => {

        return  {
        
            "scenes": [
              {
                "background-color": "#4392F1",
                "elements": [
                  {
                    "type": "text",
                    "style": "003",
                    "text": description,
                    "duration": 2,
                    "start": 1
                  }
                ]
              },
              {
                "background-color": "#4392F1",
                "elements": [
                  {
                    "type": "text",
                    "style": "003",
                    "text": series,
                    "duration": 2,
                    "start": 3
                  }
                ]
              }
            ]
          }
           
    };


    convertToBuffer = async (reader) => {
        //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
        //set this buffer -using es6 syntax
        this.setState({ buffer });
    };

    captureVideoFile = (event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
    };


    // render(): Starts a new rendering job
    /*render = async () => {
        if (!this.apikey) throw "Invalid API Key";

        let response = await this.fetch("POST", api_url, videoTemplate, {
            "Content-Type": "application/json",
            "x-api-key": apikey
        });

        if (response && response.success && response.project) this.object.project = response.project;

        return response;
    };*/

    /**
     * ex:
     *  "resolution": "full-hd",
        "quality": "high",
        "scenes": [
            {
                    "background-color": "#000000",
                    "elements": [
                        {
                            "type": "text",
                            "text": "Hello world",
                            "duration": 10
                        }
                    ]
                }
            ]
        }
     */

    

    //Guarda o video no ipfs 
    saveVideo_toIPFS = async () => {
        

        console.log('saveVideo_toIPFS....');

        const response = await ipfs.add(this.state.videoBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            console.log("Response video path on ipfs: ", ipfsPath[0].hash);
            this.setState({ video_ipfsPath: ipfsPath[0].hash });
        })

        console.log('saveVideo_toIPFS - response.path', response.path);
        this.setState({ video_ipfsPath: response.path });
        return true;

    }

    //Guarda o screenshot no ipfs 
    saveImage_toIPFS = async () => {
        
        console.log('saveImage_toIPFS....');

        const response = await ipfs.add(this.state.imageBuffer, (err, ipfsPath) => {
            console.log(err, ipfsPath);
            console.log("Response video path on ipfs: ", ipfsPath[0].hash);
            this.setState({ image_ipfsPath: ipfsPath[0].hash });
        })

        console.log('saveImage_toIPFS - response.path', response.path);
        this.setState({ image_ipfsPath: response.path });
        return true;

    }

    /**
     * Creates a screenshot from the video
     */
    captureScreenshotFromVideo(video, scope) {
        let canvas = document.createElement('canvas');

        const getBase64StringFromDataURL = (dataURL) => {
            return dataURL.replace('data:', '').replace(/^.+,/, '');
        }

        video.addEventListener('seeked', function(){
            canvas.width = 1920;
            canvas.height = 1080;

            let ctx = canvas.getContext('2d');
            ctx.drawImage( video, 0, 0, canvas.width, canvas.height );

            let dataURL = canvas.toDataURL('image/jpeg');
            //console.log('img', dataURL);

            const imageBase64 = getBase64StringFromDataURL(dataURL);

            const imageBuffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

            scope.setState({ imageBuffer: imageBuffer})
            console.log('screenshot got buffer image', scope.state.imageBuffer)
            
        });
        //take a screenshot at 2 seconds of video play moment
        video.currentTime = 2;
    }

    //JSON2VIDEO
    //##############################################################    

    /** mergeVideosServerSide = async(bufferData) => {
        console.log('will merge videos - buffer size : ', bufferData.byteLength)
        //merge 2 videos in 1
        let response = await fetch('http://localhost:3001/mergevideos', {
            method: 'post',
            body: bufferData,
            headers: {'Content-Type': 'application/octet-stream', 'Content-Length': bufferData.byteLength}});

        console.log('still here array:', response);
        const data = await response.arrayBuffer();
        console.log('merged data is:', data);
        return data;
    }*/

    //the video returned by JSON2VIDEO
    /** getVideoFrames = async (scenesTemplate) => {

        //test video 'https://assets.json2video.com/clients/vkyssyob9a/renders/2022-08-18-89909.mp4'
        console.log('will get video frames from scene: ', JSON.stringify(scenesTemplate));

        let response = await fetch('http://localhost:3001/json2video', {
            method: 'post',
            body: JSON.stringify(scenesTemplate),
            headers: {'Content-Type': 'application/json'}});

        console.log('still here array:', response);
        const data = await response.arrayBuffer();
        console.log('data is:', data);
        return data;

    }*/

    /** DOES NOT WORK FOR VIDEO FILES
    appendBuffers = async (buffer1, buffer2) => {
        let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        console.log('Appended buffers: ',tmp.buffer);
        return tmp.buffer;
    };*/

    //##############################################################  

    //Transforma o video num buffer e guarda como estado
    //apenas se tiver menos de 30secs
    uploadVideo = async (event) => {

        event.stopPropagation();
        event.preventDefault();

        if(!this.state.currentDescription || !this.state.currentSeries || this.state.currentDescription.length === 0 || this.state.currentSeries.length === 0) {
            alert('Series and Description must not be empty!');
            return;
        }
       
        console.log('uploadVideo started...');

        //create the scenes template
        //const videoTemplate = this.createVideoScene(this.state.currentDescription, this.state.currentSeries);
        /**
         * Flow: 
            Upload video -> 
            Send scene params to proxy -> 
            Create scene request on JSON2Video -> 
            Wait for the video to be ready (save it) -> 
            Send upload file to server (save it) ->
            Read both (merge them) and send result back to DAPP -> 
            Mint
         */

        //const scenesBuffer = await this.getVideoFrames(videoTemplate);
        //console.log('scenesBuffer: ', scenesBuffer);

        const file = event.target.files[0];

        let self = this;
      
        const readVideoAsBuffer = () => {

            const reader = new window.FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = () => {
                const videoBuffer = reader.result;
                //console.log('video buffer original: ', videoBuffer);
                //if(scenesBuffer !== -1 ) {
                    //append frames
                    //this.appendBuffers(scenesBuffer, videoBuffer).then( fullVideo => {
                    //    console.log('full video: ', fullVideo);
                    //    self.setState({ videoBuffer: fullVideo });
                    //});
                    
                 //   this.mergeVideosServerSide(videoBuffer).then( fullVideo => {
                 //       self.setState({ videoBuffer: fullVideo });
                 //   });
                        
                    
                    
                //} else {
                    //just this one
                    this.setState({ videoBuffer: videoBuffer});
                //}
                
                self.captureScreenshotFromVideo(video, self);
            }
        } 

        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function() {
         
            window.URL.revokeObjectURL(video.src);
            const duration = video.duration;
            console.log("video duration: " + duration + " secs");

            if(duration > 30) {
                alert("The video duration must not exceed 30 seconds!");
                self.setState({videoBuffer: null});
            } else {
                readVideoAsBuffer();
            }
        
        }

        video.src = URL.createObjectURL(file);
    }

    saveSimracingMomentNFT = async (event) => {
        event.preventDefault();

        if(this.state.videoBuffer === null || this.state.imageBuffer === null) {
            alert('Video and/or screnshot are not ready to process. Please wait or try again!');
        }
        else if(!this.state.currentDescription || !this.state.currentSeries || this.state.currentDescription.length === 0 || this.state.currentSeries.length === 0) {
            alert('Series and Description must not be empty!');
        }
        else if (this.state.currentFilePrice === null) {
            alert('Item price must be an integer');
        } else {

            UIHelper.showSpinning();

            let self = this;

            const response_saveVideo = await this.saveVideo_toIPFS();
            console.log('response_saveVideo: ', response_saveVideo);
            const response_saveImage = await this.saveImage_toIPFS();
            console.log('response_saveImage: ', response_saveImage);
            const response_saveJson = await this.saveJSON_toIPFS(this.state.image_ipfsPath, this.state.video_ipfsPath);

            console.log('response_saveJson: ', response_saveJson);

            if(response_saveVideo && response_saveImage && response_saveJson) {
                //all good!

                const price = this.state.drizzle.web3.utils.toBN(this.state.currentFilePrice);

                //'https://gateway.pinata.cloud/ipfs/Qmboj3b42aW2nHGuQizdi2Zp35g6TBKmec6g77X9UiWQXg'
                let tx = await this.state.contractNFTs.methods.awardItem(this.state.contractNFTs.address, this.state.currentAccount, price, 'https://ipfs.io/ipfs/' + this.state.jsonData_ipfsPath)
                    .send({ from: this.state.currentAccount })
                    //.on('sent', UIHelper.transactionOnSent)
                    .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                        window.localStorage.setItem('forceUpdate','yes');

                        if(confNumber > 9) {
                            UIHelper.transactionOnConfirmation("The new Simracing Moment NFT is available for sale!","/");     
                            //reset stuff
                            self.setState({videoBuffer: null, imageBuffer: null});                       
                        }
                        
                    })
                    .on('error', UIHelper.transactionOnError)
                    .catch(function (e) { 
                        UIHelper.hiddeSpinning();
                    });
            } else {
                UIHelper.hiddeSpinning();
            }

            
        }
    }

    //Save JSON in ipfs 
    saveJSON_toIPFS = async (imagePath, videoPath) => {

        console.log('saveJSON_toIPFS... ');
        /*
        ERC721 NFT schema
        {
    "title": "Asset Metadata",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Identifies the asset to which this NFT represents"
        },
        "description": {
            "type": "string",
            "description": "Describes the asset to which this NFT represents"
        },
        "image": {
            "type": "string",
            "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
        }
            }
        }
        */
        var jsonData = { 'description': this.state.currentDescription, 
                        'name': 'Simracing Moment NFT', 
                        'image': 'https://ipfs.io/ipfs/' + imagePath, 
                        'animation_url': 'https://ipfs.io/ipfs/' + videoPath,
                        'seriesOwner': this.state.currentAccount};

        jsonData.attributes = [];
        //Opensea style attributes
        jsonData.attributes.push(
            {
                "trait_type": "series", 
                "value": this.state.currentSeries
            },
            //{
            //    "trait_type": "seriesOwner", 
            //    "value": this.state.currentAccount
            //},
            {
                "trait_type": "simulator", 
                "value": this.state.currentSimulator
            },
            {
                "trait_type": "price", 
                "value": this.state.currentFilePrice / priceConversion
            }
            //,
            //{
            //    "trait_type": "video", 
            //    "value": 'https://ipfs.io/ipfs/' + videoPath
            //}
        );

        const jsonStr = JSON.stringify(jsonData);
        console.log('json str: ', jsonStr);

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

    render() {
        const simsElements = ["iRacing", "F12020", "rFactor", "Assetto Corsa"];
        const sims = [];

        for (const [index, value] of simsElements.entries()) {
            let thumb = "/assets/img/sims/" + value + ".png";
            sims.push(<Dropdown.Item eventKey={value} key={index}><img src={thumb} width="24" /> {value}</Dropdown.Item>)
        }

        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div className="container position-relative">
                        <div className="row">
                            <div className="col-lg-8 mx-auto">
                                <div>
                                    <h2 className="ls-1 text-center">Mint new Simracing Moment NFT</h2>
                                    <hr className="w-10 border-warning border-top-2 o-90" />
                                    <div>
                                        <Form>
                                            <Form.Group controlId="formInsertCar">
                                                <Form.Control type="text" placeholder="Enter Series name" onChange={this.handleSeries} />
                                                <br></br>
                                                <Form.Control as="textarea" placeholder="Enter Description" onChange={this.handleDescription} />
                                                <br></br>
                                                <Form.Control htmlSize="50" min="0" step="0.001" max="999999999" type="number" pattern="([0-9]*[.])?[0-9]+" placeholder="Enter File price (SRC)" value={this.state.priceValue} onChange={this.handleFilePrice} />
                                                <br></br>
                                                <DropdownButton id="dropdown-skin-button" title={this.state.currentSimulator} onSelect={this.onSelectSimulator}>
                                                    {sims}
                                                </DropdownButton>
                                            </Form.Group>
                                        </Form>
                                    </div>

                                    <div>
                                      {/* Video file (max 30 secs) */}  
                                    <div> Add Video For Simracing Moment NFT</div>
                                        <Form onSubmit={this.saveVideo_toIPFS}>
                                            <input id="skin-video" disabled
                                                type="file" accept="video/*"
                                                onChange={this.uploadVideo}
                                            />
                                            <br></br>

                                        </Form>
                                    </div><br></br>
                                    <div className="form-row mt-4">
                                        <Button onClick={this.saveSimracingMomentNFT}>Mint Simracing Moment NFT</Button>
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


export default UploadSimracerMoment;
