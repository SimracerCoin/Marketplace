import React, { Component } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Redirect, withRouter, Link } from "react-router-dom";
import UIHelper from "../utils/uihelper";
import "../css/mainpage.css";

const priceConversion = 10**18;

const NUM_ITEMS_LOAD = Number(process.env.REACT_APP_NUM_ITEMS_LOAD) || 4;

const getProperDate = (metadataDate) => {
    let date = metadataDate;
    if(!date) {
        date="N/A";
    } else {
        date = UIHelper.formaDateAsString(date);
    }
    return (
        <div>{date}</div> 
    ) 
} 

class MainPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            latestNFTs: [],
            shorterNFTsList: [],
            latestVideoNFTs: [],
            shorterVideosNftsList: [],
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedSeries: "",
            selectedDescription: "",
            selectedPrice: "",
            selectedCarBrand: "",
            selectedCarNumber: "",
            selectedImagePath: "",
            vendorAddress: "",
            vendorNickname: "",
            ipfsPath: "",
            contract: null,
            contractNFTs: null,
            similarItems: [],
            usdValue: 1
        }

        this.props.history.push('/');
        this.props.history.push(this.props.match.url);

    }

    updateData = async () => {

        UIHelper.showSpinning('loading items ...');

        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
        const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;
        const stSetup = await this.state.drizzle.contracts.STSetup;
        const stSkin = await this.state.drizzle.contracts.STSkin;

        const response_cars = (await stSetup.methods.getSetups().call()).filter(item => item.ad.active).slice(0, NUM_ITEMS_LOAD);
        const response_skins = (await stSkin.methods.getSkins().call()).filter(item => item.ad.active).slice(0, NUM_ITEMS_LOAD);

        //const currentAccount = this.state.drizzleState.accounts[0];
        //car ownership nfts
        
        const shorterNFTsList = []; //hold NUM_ITEMS_LOAD max

        //simracing moment nfts
        
        const shorterVideosNftsList = []; //hold NUM_ITEMS_LOAD max

        // get info from marketplace NFT contract


        /*let balance = await contractNFTs.methods.balanceOf(contractNFTs.address).call();
        console.log("balance: ", balance);
        for(var i = 0; i < balance; i++) {

            let uri = await contractNFTs.methods.tokenURI(i).call();
            console.log("token uri: ", uri);
            contractNFTs.methods.tokenOfOwnerByIndex(contractNFTs.address, i).call()
            .then((id) => { 
                console.log("LOADED NFT ID ID: ", id);
            });       
        }*/
      
        const numNfts = Number(await contractNFTs.methods.currentTokenId().call());
        const numMomentNfts = Number(await contractMomentNFTs.methods.currentTokenId().call());

        //console.log('car ownership nfts count:' + numNfts);
        //console.log('car moment nfts count:' + numMomentNfts);
        //console.log("MAX NUM ITEMS 2 TO LOAD: ", NUM_ITEMS_LOAD);

        //laod only first NUM_ITEMS_LOAD items
        const numNFTs2Load = Math.min(numNfts, NUM_ITEMS_LOAD);
        //---------------------------------------------
        //TODO start backwards
        for (let i = numNfts;  i > 0; i--) {
            try {
                //TODO: change for different ids
                let ownerAddress = await contractNFTs.methods.ownerOf(i).call();
              
                if(ownerAddress === contractNFTs.address) {
                    
                    let uri = await contractNFTs.methods.tokenURI(i).call();
                    //console.log("contractNFTs loaded: " + i + " uri: " + uri);
                    let response = await fetch(uri);
                    let info = await contractNFTs.methods.getItem(i).call();
                    let data = {id: i, price: info[0], seriesOwner: info[1], ...await response.json()};

                    //put on shorter list
                    shorterNFTsList.push(data);  
                    if(shorterNFTsList.length === numNFTs2Load) {
                        break;
                    }  
                }

            } catch (e) {
                console.error(e);
            }
        }

        const numMomentNFTs2Load = Math.min(numMomentNfts, NUM_ITEMS_LOAD);
        //moment nfts
        //TODO start backwards
        for (let i = numMomentNfts; i > 0 ; i--) {
            try {
                //TODO: change for different ids
                let ownerAddress = await contractMomentNFTs.methods.ownerOf(i).call();
                
                if(ownerAddress === contractMomentNFTs.address) {
                    
                    let uri = await contractMomentNFTs.methods.tokenURI(i).call();
                    //console.log("contractMomentNFTs loaded: " + i + " uri: " + uri);
                    let response = await fetch(uri);
                    let info = await contractMomentNFTs.methods.getItem(i).call();
                    let data = {id: i, price: info[0], seriesOwner: info[1], ...await response.json()};

                    shorterVideosNftsList.push(data);
                    if(shorterVideosNftsList.length === numMomentNFTs2Load) {
                        break;
                    }
                    
                }
            } catch (e) {
                console.error(e);
            }
        }
        //----------------------------------------------------


        //hide spinning as soon as we load the minimum
        UIHelper.hideSpinning();

        //onwnership nfts
        this.setState(
            { 
                shorterNFTsList: shorterNFTsList, 
                shorterVideosNftsList: shorterVideosNftsList,
                usdValue: await this.fetchUSDPrice(), 
                listCars: response_cars, 
                listSkins: response_skins, 
                contract: contract, 
                contractNFTs: contractNFTs, 
                contractMomentNFTs: contractMomentNFTs 
            }); 
        //simracing moment
        

        const totalNFTs = parseInt(numNfts);
        //load all remaining car ownership nfts

        const alreadyLoadedNFTS = shorterNFTsList.length;
        const nftlist = [...await this.loadRemainingCardOwnershipNFTS(contractNFTs, alreadyLoadedNFTS, totalNFTs), ...shorterNFTsList];
        
        const totalMomentNFTs = parseInt(numMomentNfts);
        //load all remaining simracing moment nfts
        const alreadyLoadedMomentNFTS = shorterVideosNftsList.length;
        
        const videoNftsList = [...await this.loadRemainingSimracingMomentNFTS(contractMomentNFTs, alreadyLoadedMomentNFTS, totalMomentNFTs), ...shorterVideosNftsList];

        console.log("loaded them all");
        
        this.setState({latestNFTs: nftlist, latestVideoNFTs: videoNftsList});
    }

    loadRemainingNFTS = async (contract, alreadyLoaded, total) => {
        let nftlist = [];

        for (let i = 1; i < (total - alreadyLoaded) + 1; i++) {
            try {
                let ownerAddress = await contract.methods.ownerOf(i).call();
                if(ownerAddress === contract.address) {
                    
                    let uri = await contract.methods.tokenURI(i).call();
                    let response = await fetch(uri);
                    let data = await response.json();

                    data.id=i;

                    nftlist.push(data);
                    
                    // load only 10 nft's
                    if(nftlist.length === 10) break;
                }
            } catch (e) {
                console.error(e);
            }
        }

        return nftlist;
    }

    loadRemainingSimracingMomentNFTS = async (contractMomentNFTs, alreadyLoaded, totalMomentNFTs) => 
        this.loadRemainingNFTS(contractMomentNFTs, alreadyLoaded, totalMomentNFTs);
        
    loadRemainingCardOwnershipNFTS = async (contractNFTs, alreadyLoaded, totalNFTs) => 
        this.loadRemainingNFTS(contractNFTs, alreadyLoaded, totalNFTs);

    componentDidMount = async () => this.updateData();

    componentDidUpdate = async () => {
        //Handy trick to know when we should update again (using react navigation approach was a total mess, and not even building)
        const forceUpdate = window.localStorage.getItem('forceUpdate');
        if("yes" === forceUpdate) {
            window.localStorage.removeItem('forceUpdate'); 
            this.updateData();
        }
    }

    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, carNumber, address, ipfsPath, imagePath, isNFT, isMomentNFT, videoPath, itemMetadata) => {
        event.preventDefault();

        let similarItems = [];
        let category = "";
        if(isMomentNFT) {
            similarItems = similarItems.concat(this.state.latestVideoNFTs);
            category = "momentnfts";
        } else if(isNFT) {
            similarItems = similarItems.concat(this.state.latestNFTs);
            category = "ownership";
        } else if(track == null || season == null) {
            similarItems = similarItems.concat(this.state.listSkins);
            category = "carskins";
        } else {
            similarItems = similarItems.concat(this.state.listCars);
            category = "carsetup";
        }

        this.setState({
            redirectBuyItem: true,
            selectedItemId: itemId,
            selectedTrack: track,
            selectedSimulator: simulator,
            selectedSeason: season,
            selectedSeries: series,
            selectedDescription: description,
            selectedPrice: price,
            selectedCategory: category,
            usdPrice : this.state.usdValue,
            selectedCarBrand: carBrand,
            selectedCarNumber: carNumber,
            selectedImagePath: imagePath,
            vendorAddress: address,
            vendorNickname: address ? (await this.state.contract.methods.getSeller(address).call()).nickname : "",
            ipfsPath: ipfsPath,
            videoPath: videoPath,
            isNFT: isNFT,
            isMomentNFT: isMomentNFT,
            similarItems: similarItems,
            metadata: itemMetadata
        });
    }

    /** @deprecated */
    isMomentVideoNFT(attributes) {
        
        for(let attribute of attributes) {
            if(attribute.trait_type === 'video') {
                return true;
            }
        }
        return false;
    }

    extractMomentNFTTraitTypes(attributes) {

        let data = {};
        for(let attribute of attributes) {
            data[attribute.trait_type] = attribute.value;
        }
        return data;
    }

    fetchUSDPrice = async () => {
       try {
            const priceUSD = await UIHelper.fetchSRCPriceVsUSD();
            const priceObj = await priceUSD.json();
            const key = Object.keys(priceObj);
            return priceObj[key]['usd']; 

        }catch(err) {
           return 1;
        }
    }
      

    render() {

        const cars = [];
        const skins = [];
        const nfts = [];
        const momentNfts = [];

        if (this.state.redirectBuyItem) {
            //for easier testing

            let path = "/item";// process.env.REACT_APP_TEST_AUCTION_PAGE == "true" ? "/auction" : "/item";
            //if is auction we do a different redirect
            if(this.state.metadata && this.state.metadata['auction_item']) {
                path = "/auction";
            }

            return (<Redirect
                to={{
                    pathname: path+"/"+this.state.selectedCategory+"/"+this.state.selectedItemId,// "/item",
                    state: {
                        selectedItemId: this.state.selectedItemId,
                        selectedTrack: this.state.selectedTrack,
                        selectedSimulator: this.state.selectedSimulator,
                        selectedSeason: this.state.selectedSeason,
                        selectedSeries: this.state.selectedSeries,
                        selectedDescription: this.state.selectedDescription,
                        selectedPrice: this.state.selectedPrice,
                        usdPrice : this.state.usdValue,
                        selectedCarBrand: this.state.selectedCarBrand,
                        selectedCarNumber: this.state.selectedCarNumber,
                        imagePath: this.state.selectedImagePath,
                        vendorAddress: this.state.vendorAddress,
                        vendorNickname: this.state.vendorNickname,
                        ipfsPath: this.state.ipfsPath,
                        videoPath: this.state.videoPath,
                        isNFT: this.state.isNFT,
                        isMomentNFT: this.state.isMomentNFT,
                        similarItems: this.state.similarItems,
                        metadata: this.state.metadata
                    }
                }}
            />)
        }

        //moment nfts
        //TODO we can use already videoNftsList here
        for (const [index, value] of this.state.shorterVideosNftsList.entries()) {
            //console.log('moment nft value is,',value);
  
            let itemId = value.id;
       
            // let ipfsPath = value.ad.ipfsPath
            //console.log(' ID NFT:'+value.id);
            let imagePath = value.image;

            let metadata = this.extractMomentNFTTraitTypes(value.attributes);
            let series = metadata.series;
            let simulator = metadata.simulator;
            let address = value.seriesOwner;
            let price = value.price;
            let video = value.animation_url; 
            let description = value.description;

            let price_src = Number((Math.round(price / priceConversion) * 100) / 100).toFixed(2);
            let usdPrice = Number(Math.round(price_src  * this.state.usdValue * 100) / 100).toFixed(2);
          
            if(usdPrice === 0.00) {
                usdPrice = 0.01;
            }
            
            usdPrice = "$" + usdPrice;

            let thumb = "/assets/img/sims/"+simulator+".png";

            //console.log('METADATA VIDEO ', video);
                /**
                 *  attribute:  {trait_type: 'series', value: 'Cupra series'}
                    attribute:  {trait_type: 'simulator', value: 'iRacing'}
                    attribute:  {trait_type: 'video', value: 'https://ipfs.io/ipfs/QmbNW26he9uk8R7FHEE5KUDbTfBaHDCKgPAkUUnpeoWdZH'}
                 */
                
            //console.log('attributes: ', value.attributes);
            momentNfts.push(
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1">
                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, description, price, null, null, address, null, imagePath, false, true, video, metadata)}>
                        <Card.Header style={{height: '240px'}} className="d-flex flex-wrap align-items-center justify-content-center">
                            <Card.Img variant="top" src={imagePath} style={{width: 'auto', maxHeight: '100%'}} />
                        </Card.Header>
                        <Card.Body className="text-center">
                            <Card.Title className="mt-5 font-weight-bold">{series}</Card.Title>
                            <div className="text-left">
                            <div><strong  className="price_div_strong">{price_src} <sup className="main-sup">SRC</sup></strong><br/> <span className="secondary-price">{usdPrice}<sup className="secondary-sup">USD</sup></span></div>
                            {value.attributes.map( function(att) {
                               let label = att.trait_type.charAt(0).toUpperCase() + att.trait_type.slice(1);
                               let value2Render = att.value;
                               if(att.trait_type === 'date') {
                                value2Render = getProperDate(value2Render);
                               } 

                                if(label === 'SeriesOwner') {
                                    return "";
                                }
                                if(att.trait_type === 'series') {
                                    return "";
                                }
                                if(att.trait_type === 'video') {
                                    return <div><a href={value2Render} rel="noreferrer" target="_blank">{value2Render}</a></div>
                                }
                                if(att.trait_type === 'simulator') {
                                    return <div><img src={thumb} width="32" alt={value2Render} /> {value2Render}</div>
                                }
                                return <div>{value2Render}</div>
                            }, this)}
                            </div>
                        <Button variant="warning">Buy</Button>
                        </Card.Body>
                    </Card>
            </div>
            )
        }

        //car ownership ones
        for (const [index, value] of this.state.shorterNFTsList.entries()) {

            //console.log('ownership nft value is,',value);
            let metadata = this.extractMomentNFTTraitTypes(value.attributes);

            let series = value.series;
            let simulator = value.simulator;
            let price = value.price;
            //TODO: change hardcode
            let address = value.seriesOwner;
            let itemId = value.id;
            let description = value.description;
            let carNumber = value.carNumber;
            // let ipfsPath = value.ad.ipfsPath
            //console.log(' ID NFT:'+value.id);
            let imagePath = value.image;

            let price_src = Number((Math.round(price / priceConversion) * 100) / 100).toFixed(2);
            let usdPrice = Number(Math.round(price_src  * this.state.usdValue * 100) / 100).toFixed(2);

            if(usdPrice === 0.00) {
                usdPrice = 0.01;
            }
            usdPrice = '$' + usdPrice;

            let thumb = "/assets/img/sims/"+simulator+".png";

            //could be empty for these nfts (if not auction data)
            
            nfts.push(
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1">
                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, description, price, null, carNumber, address, null, imagePath, true, false, null, metadata)}>
                        <Card.Header style={{height: '240px'}} className="d-flex flex-wrap align-items-center justify-content-center">
                            <Card.Img variant="top" src={imagePath} style={{width: 'auto', maxHeight: '100%'}} />
                        </Card.Header>
                        <Card.Body className="text-center">
                            <Card.Title className="mt-5 font-weight-bold text-truncate">{series}</Card.Title>
                            <div className="text-left">
                            <div><img src={thumb} width="32" alt={simulator} /> {simulator}</div>
                            <div className="price_div"><strong className="price_div_strong">{price_src} <sup className="main-sup">SRC</sup></strong><br/> <span className="secondary-price">{usdPrice}<sup className="secondary-sup">USD</sup></span></div>
                            </div>
                            <Button variant="warning">Buy</Button>
                        </Card.Body>
                    </Card>
                </div> 
            )
        }

        //skins
        for(let i = this.state.listSkins.length-1, j = 0; j < this.state.listSkins.length; --i, ++j) {
            let value = this.state.listSkins[i];

            let carBrand = value.info.carBrand
            let simulator = value.info.simulator
            let price = value.ad.price
            let address = value.ad.seller
            let itemId = value.id
            let ipfsPath = value.ad.ipfsPath
            let imagePath = value.info.skinPic
            let description = value.info.description
            let thumb = "/assets/img/sims/"+simulator+".png"

            let price_src = Number((Math.round(price / priceConversion) * 100) / 100).toFixed(2);
            let usdPrice = Number(Math.round(price_src  * this.state.usdValue * 100) / 100).toFixed(2);

            if(usdPrice === 0.00) {
                usdPrice = 0.01;
            }
            usdPrice = "$" + usdPrice;

            skins.push(
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1">
                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, description, price, carBrand, null, address, ipfsPath, imagePath, false, false, null, null)}>
                        <Card.Header style={{height: '240px'}} className="d-flex flex-wrap align-items-center justify-content-center">
                            <Card.Img variant="top" src={"https://simthunder.infura-ipfs.io/ipfs/"+imagePath[0]} style={{width: 'auto', maxHeight: '100%'}} />
                        </Card.Header>
                        <Card.Body className="text-center">
                            <Card.Title className="mt-5 font-weight-bold">{carBrand}</Card.Title>
                            <div className="text-left">
                                <div><img src={thumb} width="32" alt={simulator} /> {simulator}</div>
                                <div className="price_div"><strong className="price_div_strong">{price_src} <sup className="main-sup">SRC</sup></strong><br/> <span className="secondary-price">{usdPrice}<sup className="secondary-sup">USD</sup></span></div>
                            </div>
                            <Button variant="warning">Buy</Button>
                        </Card.Body>
                    </Card>
                </div>
            )
        }

        //car setups
        for(let i = this.state.listCars.length-1, j = 0; j < this.state.listCars.length; --i, ++j) {
            let value = this.state.listCars[i];
            //console.log('list cars value:');
            //console.log(value);
            let carBrand = value.info.carBrand
            let track = value.info.track
            let simulator = value.info.simulator
            let season = value.info.season
            let series = value.info.series
            let description = value.info.description
            let price = value.ad.price
            let address = value.ad.seller
            let itemId = value.id
            let ipfsPath = value.ad.ipfsPath
            let thumb = "/assets/img/sims/"+simulator+".png";

            let price_src = Number((Math.round(price / priceConversion) * 100) / 100).toFixed(2);
            let usdPrice = Number(Math.round(price_src  * this.state.usdValue * 100) / 100).toFixed(2);

            if(usdPrice === 0.00) {
                usdPrice = 0.01;
            }
            usdPrice = "$" + usdPrice;

            cars.push(
                <div className="col-12 col-sm-6 col-md-4 col-lg-3 px-1">
                    <Card className="card-block bg-dark_A-20 p-4 mx-1 mt-2" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, null, address, ipfsPath, "", false, false,null, null)}>
                        <Card.Header style={{height: '240px'}} className="d-flex flex-wrap align-items-center justify-content-center">
                            <Card.Img variant="top" src={thumb} style={{width: 'auto', maxHeight: '100%'}} />
                        </Card.Header>
                        <Card.Body className="text-center">
                            <Card.Title className="mt-5 font-weight-bold">{carBrand}</Card.Title>
                            <div className="text-left">
                            <div>{track}</div>
                            <div><img src={thumb} width="32" alt={simulator} /> {simulator}</div>
                            <div>{season}</div>

                            <div className="price_div"><strong className="price_div_strong">{price_src} <sup className="main-sup">SRC</sup></strong><br/> <span className="secondary-price">{usdPrice}<sup className="secondary-sup">USD</sup></span></div>

                            {/* <div><b>Vendor address:</b> {address}</div> */}
                            </div>
                            <Button variant="warning">Buy</Button>
                        </Card.Body>
                    </Card>
                </div>
            )
        }

        return (
            <header className="header">
                <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                <section className="content-section text-light br-n bs-c bp-c pb-8">
                    <div id="latest-container" className="container latest-items">
                        <div className="center-text">
                            <h1>Welcome to Simthunder!</h1>
                            <h5>Buy, sell, discover, and trade sim racing goods</h5>
                        </div>

                        { momentNfts.length > 0 && 
                        <div className="momentslist">

                            <br /><br />
                            <div>
                                <h4 className="pl-1">Latest Simracing Moment NFTs</h4>
                            </div>
                            <div>
                            <div className="container-fluid">
                                <div className="row">
                                    {momentNfts}
                                </div>
                            </div>
                                {this.state.latestVideoNFTs.length > NUM_ITEMS_LOAD &&
                                <Link to="/store?m=momentnfts" className="view-more">View more &gt;&gt; </Link>
                                }
                                
                            </div>

                        </div>
                        }

                        { nfts.length > 0 &&
                        <div className="nftslist">
                            <br /><br />
                            <div>
                                <h4 className="pl-1">Latest Car Ownership NFTs</h4>
                            </div>
                            <div>
                            <div className="container-fluid">
                                <div className="row">
                                    {nfts}
                                </div>
                            </div>
                                {this.state.latestNFTs.length > NUM_ITEMS_LOAD &&
                                <Link to="/store?m=ownership" className="view-more">View more &gt;&gt; </Link>
                                }
                                
                                
                            </div>
                        </div>
                        }

                        { skins.length > 0 &&
                        <div className="skinslist">
                            <br /><br />
                            <div>
                                <h4 className="pl-1">Latest Car Skins</h4>
                            </div>
                            <div>
                            <div className="container-fluid">
                                <div className="row">
                                    {skins}
                                </div>
                            </div>
                                {this.state.listSkins.length === NUM_ITEMS_LOAD &&
                                <Link to="/store?m=carskins" className="view-more">View more &gt;&gt; </Link>
                                }
                                
                            </div>
                        </div>    
                        }

                        { cars.length > 0 && 
                        <div className="carslist">
                            <br /><br />
                            <div>
                                <h4 className="pl-1">Latest Car Setups</h4>
                            </div>
                            <div>

                            <div className="container-fluid">
                                <div className="row">
                                    {cars}
                                </div>
                            </div>
                            {this.state.listCars.length === NUM_ITEMS_LOAD &&
                                <Link to="/store?m=carsetup" className="view-more">View more &gt;&gt; </Link>
                            }
                            </div>
                        </div>
                        }
                    </div>
                </section>
            </header>
        );
    }
}

export default withRouter(MainPage);