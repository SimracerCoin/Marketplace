import React, { Component } from 'react';
import { Dropdown, Form, DropdownButton, Button, FormCheck } from 'react-bootstrap';
import ipfs from "../ipfs";
import UIHelper from "../utils/uihelper";
import "../css/auction.css";

//import fetch from 'node-fetch';


const priceConversion = 10 ** 18;


const testingVideo = 'https://assets.json2video.com/sites/github/hello-world.mp4';


const timingOpt = ["1 day", "3 days", "7 days", "1 month", "3 month", "6 month"];
const timingOptions = [];

const FormatDate = (inputDate) => {
    var formattedDate = inputDate.getFullYear() + '-' + (inputDate.getMonth() + 1) +'-'+ inputDate.getDate();
    return formattedDate;
 }

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
            priceValue:0,
            auctionItem: false,
            auctionTimeRange: false,
            currentTimingOption: timingOpt[0],
            auctionStart: FormatDate(new Date()),
            auctionEnd: FormatDate(new Date()),
            recordingDate: FormatDate(new Date())
        }


        //this.handleChangeHash = this.handleChangeHash.bind(this);
        this.handleFilePrice = this.handleFilePrice.bind(this);
        this.uploadVideo = this.uploadVideo.bind(this);
        this.saveVideo_toIPFS = this.saveVideo_toIPFS.bind(this);
        this.saveSimracingMomentNFT = this.saveSimracingMomentNFT.bind(this);
        this.onSelectAuctionTiming = this.onSelectAuctionTiming.bind(this);
        this.handleAuction = this.handleAuction.bind(this);
        this.handleAuctionRange = this.handleAuctionRange.bind(this);
        //upload img
        this.uploadImageIPFS = this.uploadImageIPFS.bind(this);
    }


    componentDidMount = async () => {
        
        for (const [index, value] of timingOpt.entries()) {
            timingOptions.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
        }

        let now = new Date();
        let daysForEnd = UIHelper.extractDaysFromAuctionString(timingOpt[0]);
        let endDate = this.getUpdatedEndDate(now,daysForEnd);
        const currentAccount = this.state.drizzleState.accounts[0];
        const contract = this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimracingMomentOwner;
        const isSeller = await contract.methods.isSeller(currentAccount).call();
        this.setState({ auctionStart: now, auctionEnd:endDate, currentTimingOption: timingOpt[0], timingOptions: timingOptions, currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs, isSeller: isSeller });
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

    handleAuction = (value) => {
        console.log("Is auction: " + value);
        this.setState({ auctionItem: !this.state.auctionItem });
        if(this.state.auctionItem) {

            let now = new Date();
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

    setRecordingDate = async (value)=> {
        
        let elem = document.getElementById('ontopdate');
        if(elem) {
            if(elem.classList.contains('is-visible')) {
                elem.classList.remove('is-visible');
                elem.classList.add('is-invisible');
            } else {
                elem.classList.add('is-visible');
                elem.classList.remove('is-invisible');
            }
        }
        this.setState({recordingDate: value});
    }

    onSelectAuctionTiming = async(value) => {
        console.log("Choosing timing: " + value);
        this.setState({ currentTimingOption: value });
        let now = new Date();
        let endDate = this.getUpdatedEndDate(now, value);
        this.setState({auctionStart: now, auctionEnd: endDate});
        console.log('START: ' + now + " END: " +  endDate);
    }

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

        if(this.state.imageBuffer === null) {

            var fileName = document.getElementById('skin-image').value.toLowerCase();

            console.log("Filename: " + fileName)

            const valid_fileName = fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')
            console.log("Valid filename: " + valid_fileName)
            if (!valid_fileName) {
                alert('You can upload .jpg, .png or .jpeg files only. Invalid file!');
                return false;
            }
        } else {
            const response = await ipfs.add(this.state.imageBuffer, (err, ipfsPath) => {
                console.log(err, ipfsPath);
                console.log("Response video path on ipfs: ", ipfsPath[0].hash);
                this.setState({ image_ipfsPath: ipfsPath[0].hash });
            })
    
            console.log('saveImage_toIPFS - response.path', response.path);
            this.setState({ image_ipfsPath: response.path });
            return true;
        }


    }

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

                //no image uploaded? than create a screenshot
                if(self.state.imageBuffer == null) {
                    self.captureScreenshotFromVideo(video, self);
                }
                
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
            alert('Video and/or thumbnail are not ready to process. Please wait or try again!');
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


                //some gas estimations
                //estimate method gas consuption (units of gas)
                let gasLimit = UIHelper.defaultGasLimit;
                let paramsForCall = await UIHelper.calculateGasUsingStation(gasLimit, this.state.currentAccount);
                //console.log("params for call ", paramsForCall);

                //'https://gateway.pinata.cloud/ipfs/Qmboj3b42aW2nHGuQizdi2Zp35g6TBKmec6g77X9UiWQXg'
                let tx = await this.state.contractNFTs.methods.awardItem(this.state.contractNFTs.address, this.state.currentAccount, price, 'https://simthunder.infura-ipfs.io/ipfs/' + this.state.jsonData_ipfsPath)
                    .send( paramsForCall )
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
                        'image': 'https://simthunder.infura-ipfs.io/ipfs/' + imagePath, 
                        'animation_url': 'https://simthunder.infura-ipfs.io/ipfs/' + videoPath,
                        'seriesOwner': this.state.currentAccount};

        jsonData.attributes = [];
        //Opensea style attributes
        jsonData.attributes.push(
            {
                "trait_type": "series", 
                "value": this.state.currentSeries
            },
            {
                "trait_type": "date", 
                "value": this.state.recordingDate, //yyyy-MM-DD
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
                                                <br></br>
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
                                            </Form.Group>
                                        </Form>
                                    </div>
                                    {/*  image field */}
                                    
                                    <div>
                                        <div> Add Image for new Simracing Moment NFT </div>
                                        <Form onSubmit={this.saveImage_toIPFS}>
                                            <input id="skin-image"
                                                type="file"
                                                onChange={this.uploadImageIPFS}
                                            />
                                            <br></br>

                                        </Form>
                                    </div><br></br>
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
                                    <div>                   
                                     <FormCheck.Label className="auction_item_label">Recording date</FormCheck.Label>
                                     <Form.Control className="date_picker" type="date" value={this.state.recordingDate} onChange={(e) => this.setRecordingDate(e.target.value)} name="startDate" placeholder="Now" />
                                    <div id="ontopdate" className="ontopdate is-visible">Now</div>
                                    </div>
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
