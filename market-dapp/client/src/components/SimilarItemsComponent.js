import React, {Component } from 'react';
import { Redirect } from "react-router-dom";
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../css/custom-carousel.css';

const priceConversion = 10 ** 18;

class SimilarItemsComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isNFT: props.isNFT,
            isSkin: props.isSkin,
            isMomentNFT: props.isMomentNFT,
            selectedItemId: props.selectedItemId,
            items: props.items,
            filteredItems: [],
            contextParent : props.contextParent,
            callbackParent: props.callbackParent,
            usdValue: props.usdValue
            //drizzle: props.drizzle,
            //drizzleState: props.drizzleState,
        }
    }

    componentDidMount = async (event) => {
        console.log("SimilarItemsComponent did mount isSkin " + this.state.isSkin + " isNFT: " + this.state.isNFT + " isMomentNFT: " + this.state.isMomentNFT + " id: " + this.state.selectedItemId );
        let referenceItem = this.state.selectedItemId;
        this.filterSimilarItems(referenceItem);
      
      }


     filterSimilarItems = (referenceItem) => {

        
        let filteredItems = this.state.items.filter(function(value, index) {
          console.log("filtering items: value " + JSON.stringify(value));
          let itemId = value.id;
          console.log("item id: " + itemId + " selected one " + referenceItem); 
          return itemId!== referenceItem;
        });
        this.setState({filteredItems: filteredItems});
      }

    extractMomentNFTTraitTypes(attributes) {

      let data = {};
      for(let attribute of attributes) {
          data[attribute.trait_type] = attribute.value;
      }
      return data;
    }

    renderUSDPrice = (price) => {
      let usdPrice = Number(Math.round((price / priceConversion) * this.state.usdValue * 100) / 100).toFixed(2);
      return "(" + usdPrice + "$) ";
    }

    renderItemDetails = (payload, fullItem) => {

      if(this.state.isNFT) {

        return <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.switchSimilarItem(e, true, false,false, payload, fullItem)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      } else if(this.state.isMomentNFT) {

        return <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.switchSimilarItem(e, false, true, false, payload, fullItem)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      }
      else if(this.state.isSkin) {
        
        return <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.switchSimilarItem(e, false, false, true, payload, fullItem )}>
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath}/>
            <p className="legend">{payload.description}</p>
          </div>

      } else {
        //car
        return <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.switchSimilarItem(e, false, false, false, payload, fullItem)}>
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      }

      
    }
    
    /**
     * 
     * Will re-render the parent page (item)
     * @param {*} isNFT 
     * @param {*} isSkin 
     * @param {*} item 
     */
    switchSimilarItem = async (event, isNFT, isMomentNFT, isSkin, payload, item) =>{

      //console.log("set new selected on to " + item.id);
      //this will update parent
      this.state.callbackParent(this.state.contextParent, isNFT, isMomentNFT, isSkin, payload, item); //payload is actually the entire item data

      let referenceItem = item.id;
      //this will update children
      this.setState({selectedItemId: referenceItem});
      this.filterSimilarItems(referenceItem);
  
    }

    render() {

      if(this.state.filteredItems.length === 0) {
        return "No items found in this category";
      }

      //exclude itself
      let isNFT = this.state.isNFT;
      let isSkin = this.state.isSkin;
      let isMomentNFT = this.state.isMomentNFT;


      //https://github.com/leandrowd/react-responsive-carousel/
      return <Carousel autoPlay>
      {this.state.filteredItems.map( function(value, index) {

        let payload = {};

        if(isNFT) {
  
          payload.imagePath = value.image;
          payload.price = value.price * priceConversion;
          payload.simulator = value.simulator;
          payload.series = value.series;
          payload.address = value.seriesOwner;
          payload.carNumber = value.carNumber;
          payload.description =  (value.description || value.carNumber);

        }else if(isMomentNFT) {
  
          payload.imagePath = value.image;

          let metadata =  this.extractMomentNFTTraitTypes(value.attributes);
         
          payload.price = metadata.price * priceConversion;
          payload.description =  (value.description || metadata.description);

          payload.simulator = metadata.simulator;
          payload.series = metadata.series;
          payload.address = metadata.seriesOwner;
          payload.video = value.animation_url || metadata.video;

        } else if(isSkin) {

          payload.imagePath = "https://ipfs.io/ipfs/" + value.info.skinPic;
          payload.price = value.ad.price;
          payload.carBrand = value.info.carBrand;
          payload.simulator = value.info.simulator;
          payload.address = value.ad.seller;
          payload.ipfsPath = value.ad.ipfsPath;
          payload.description = value.info.carBrand; //no description field on skin

        } else {

          payload.imagePath = value.ad.ipfsPath;
          payload.price = value.ad.price;
          payload.series = value.info.series;
          payload.simulator = value.info.simulator;
          payload.address = value.ad.seller;
          payload.carBrand = value.info.carBrand;

          payload.track = value.info.track;
          payload.season = value.info.season;
          payload.description = (value.info.description || value.info.carBrand);
        }

        payload.itemId = value.id;
        payload.index = index;

        return this.renderItemDetails(payload, value);  

      },this)}
      </Carousel>
      
      

      

      

      

      

      /**
      if(this.state.isNFT) {
        imagePath = value.image;
        price = value.price * priceConversion;
        simulator = value.simulator;
        simulator = value.series;
        address = value.seriesOwner;
        carNumber = value.carNumber;
        description = value.description;
        
        

      }
      else if (this.state.isSkin) {
        imagePath = "https://ipfs.io/ipfs/" + value.info.skinPic;
        price = value.ad.price;
        carBrand = value.info.carBrand;
        simulator = value.info.simulator;
        address = value.ad.seller;
        
        let ipfsPath = value.ad.ipfsPath;
        description = value.info.carBrand; //no description field on skin

        return <div className="item">
              <a href="#" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, null, price, carBrand , address, ipfsPath, imagePath, false)}>
                <div className="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: {imagePath}}}>
                      <div className="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                        <div className="px-4 py-3 lh-1">
                              <h6 className="mb-1 small-1 text-light text-uppercase">{description}</h6>
                              <div className="price d-flex flex-wrap align-items-center">
                                <span className="discount_final text-warning small-2">{price / priceConversion} ETH</span>
                            </div>
                        </div>
                      </div>
                </div>
              </a>
            </div>
        
   
      }
      else {//isCar
        imagePath = value.ad.ipfsPath;
        price = value.ad.price;
        series = value.info.series;
        simulator = value.info.simulator;
        address = value.ad.seller;
        carBrand = value.info.carBrand;

        let track = value.info.track
        let season = value.info.season
        description = value.info.description
        

        
        
      }*/
    }
}

export default SimilarItemsComponent;