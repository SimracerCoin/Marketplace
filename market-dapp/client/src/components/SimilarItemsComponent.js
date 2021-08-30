import React, {Component } from 'react';

const priceConversion = 10 ** 18;

class SimilarItemsComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isNFT: props.isNFT,
            isSkin: props.isSkin,
            selectedItemId: props.selectedItemId,
            value: props.value,
            //drizzle: props.drizzle,
            //drizzleState: props.drizzleState,
        }
    }

    componentDidMount = async (event) => {
        console.log("SimilarItemsComponent did mount isSkin " + this.state.isSkin + " isNFT: " + this.state.isNFT + " id: " + this.state.selectedItemId + " : " + JSON.stringify(this.state.value));
    }

    render() {
      let imagePath = ";"
      let price = 0;
      let series = null;
      let simulator = null;
      let address = null;
      let carNumber = null;
      let carBrand = null;
      let description = "";
      let value = this.state.value;

      let itemId = value.id;

      if(itemId === this.state.selectedItemId) {
          return "<span>NADA</span>";
      }

      if(this.state.isNFT) {
        imagePath = value.image;
        price = value.price * priceConversion;
        simulator = value.simulator;
        simulator = value.series;
        address = value.seriesOwner;
        carNumber = value.carNumber;
        description = value.description;
        return <div className="item">
              {/*<a href="#" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true)}>*/}
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
              {/*</a>*/}
              </div>
        

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
      else {/*isCar*/ 
        imagePath = value.ad.ipfsPath;
        price = value.ad.price;
        series = value.info.series;
        simulator = value.info.simulator;
        address = value.ad.seller;
        carBrand = value.info.carBrand;

        let track = value.info.track
        let season = value.info.season
        description = value.info.description
        

        return <div className="item">
                <a href="#" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, imagePath, "", false)}>
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
    }
}

export default SimilarItemsComponent;