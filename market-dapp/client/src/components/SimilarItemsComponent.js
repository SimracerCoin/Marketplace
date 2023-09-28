import React from 'react';
import { Carousel } from 'react-responsive-carousel';

const NUMBER_LOAD_ITEMS = 10;

class SimilarItemsComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedItemId: props.selectedItemId,
            items: props.items,
            filteredItems: [],
            drizzle: props.drizzle,
            category: props.category
        }

        this.routeChange = this.routeChange.bind(this);
    }

    loadRemainingNFTS = async (contract) => {
      let nftlist = [];

      for (let i = 1; i < parseInt(await contract.methods.currentTokenId().call()) + 1; i++) {
          try {
              let ownerAddress = await contract.methods.ownerOf(i).call();
              if(ownerAddress === contract.address) {
                  
                  let data = await contract.methods.tokenURI(i).call().then(u => fetch(u)).then(r => r.json());
                  data.id = i;

                  nftlist.push(data);
                  
                  // load only 10 nft's
                  if(nftlist.length === NUMBER_LOAD_ITEMS) break;
              }
          } catch (e) {
              console.error("can't load " + i + " similar item - " + e);
          }
      }

      return nftlist;
    }

    routeChange(e, itemId) {
      e.preventDefault();

      let path = '/item/'+this.state.category+'/'+itemId;
      window.location.href = path;
    }

    componentDidMount = async (event) => {
        let referenceItem = this.state.selectedItemId;

        if(!this.state.items) {
          const contract = await this.state.drizzle.contracts.STMarketplace;
          const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
          const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;

          let similarItems = [];
          switch(this.state.category) {
            case "carskins":
              similarItems = await contract.methods.getSkins().call();
              break;
            case "carsetup":
              similarItems = await contract.methods.getCarSetups().call();
              break;
            case "momentnfts":
              similarItems = await this.loadRemainingNFTS(contractMomentNFTs);
              break;
            case "ownership":
              similarItems = await this.loadRemainingNFTS(contractNFTs);
              break;
            default:
          }

          this.setState({
            items: similarItems,
          });
        }

        this.filterSimilarItems(referenceItem);
      }


     filterSimilarItems = (referenceItem) => {
        if(this.state.items.length > 0) {
          let filteredItems = this.state.items.filter(item => item && item.id && item.id !== referenceItem && item.ad.active).slice(0, NUMBER_LOAD_ITEMS);
          this.setState({filteredItems: filteredItems});
        } else {
          this.setState({filteredItems: []});
        }
      }

    extractMomentNFTTraitTypes(attributes) {
      let data = {};
      for(let attribute of attributes) {
          data[attribute.trait_type] = attribute.value;
      }
      return data;
    }

    renderItemDetails = (payload, fullItem) => {

      if(this.state.category === "ownership") {
        //ownership
        return <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.routeChange(e, payload.itemId)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      } else if(this.state.category === "momentnfts") {
        //moment
        return <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.routeChange(e, payload.itemId)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      }
      else if(this.state.category === "carskins") {
        //skin
        return <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.routeChange(e, payload.itemId )}>
            <img className="carousel-pointer" alt={payload.description} src={"https://simthunder.infura-ipfs.io/ipfs/"+payload.imagePath[0]}/>
            <p className="legend">{payload.description}</p>
          </div>

      } else {
        //car
        return <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.routeChange(e, payload.itemId)}>
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>

      }
    }

    render() {

      if(this.state.filteredItems.length === 0) {
        return "No items found in this category";
      }

      //exclude itself
      let isNFT = this.state.category === "ownership";
      let isSkin = this.state.category === "carskins";
      let isMomentNFT = this.state.category === "momentnfts";


      //https://github.com/leandrowd/react-responsive-carousel/
      return <Carousel autoPlay>
      {this.state.filteredItems.map( function(value, index) {

        let payload = {};

        if(isNFT) {

          let metadata =  this.extractMomentNFTTraitTypes(value.attributes);
  
          payload.imagePath = value.image;
          payload.description =  (value.description || metadata.description);

        } else if(isMomentNFT) {

          let metadata =  this.extractMomentNFTTraitTypes(value.attributes);
  
          payload.imagePath = value.image;
          payload.description =  (value.description || metadata.description);

        } else if(isSkin) {

          payload.imagePath = value.info.skinPic;
          payload.description = value.info.description;

        } else {

          payload.imagePath = value.ad.ipfsPath;
          payload.description = value.info.description;
        }

        payload.itemId = value.id;
        payload.index = index;

        return this.renderItemDetails(payload, value);  

      },this)}
      </Carousel>
    }
}

export default SimilarItemsComponent;