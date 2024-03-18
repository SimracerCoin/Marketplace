import React from 'react';
import { Carousel } from 'react-responsive-carousel';

const NUMBER_LOAD_ITEMS = 10;

class SimilarItemsComponent extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            filteredItems: []
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

      let path = '/item/'+this.props.category+'/'+itemId;
      window.location.href = path;
    }

    componentDidMount = async () => {
        const { drizzle, selectedItemId } = this.props;

        const contractNFTs = await drizzle.contracts.SimthunderOwner;
        const contractMomentNFTs = await drizzle.contracts.SimracingMomentOwner;
        const stSetup = await drizzle.contracts.STSetup;
        const stSkin = await drizzle.contracts.STSkin;

        let similarItems = [];
        switch(this.props.category) {
          case "carskins":
            similarItems = await stSkin.methods.getSkins().call();
            break;
          case "carsetup":
            similarItems = await stSetup.methods.getSetups().call();
            break;
          case "momentnfts":
            similarItems = await this.loadRemainingNFTS(contractMomentNFTs);
            break;
          case "ownership":
            similarItems = await this.loadRemainingNFTS(contractNFTs);
            break;
          default:
        }
        
        this.filterSimilarItems(similarItems, selectedItemId);
      }

     filterSimilarItems = (items, referenceItem) => {
        if(items.length > 0) {
          const filteredItems = items.filter(item => item && item.id && item.id !== referenceItem && (!item.ad || item.ad.active)).slice(0, NUMBER_LOAD_ITEMS);
          this.setState({filteredItems});
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

    renderItemDetails = (payload) => {

      const { props } = this;

      if(props.category === "ownership") {
        //ownership
        return (
          <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.routeChange(e, payload.itemId)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>
        );
      } else if(props.category === "momentnfts") {
        //moment
        return (
          <div id={payload.itemId} className="carousel-pointer" onClick={(e) => this.routeChange(e, payload.itemId)} >
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>
        );
      }
      else if(props.category === "carskins") {
        //skin
        return (
          <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.routeChange(e, payload.itemId )}>
            <img className="carousel-pointer" alt={payload.description} src={"https://simthunder.infura-ipfs.io/ipfs/"+payload.imagePath[0]}/>
            <p className="legend">{payload.description}</p>
          </div>
        );

      } else {
        //car
        return (
          <div className="carousel-pointer" id={payload.itemId} onClick={(e) => this.routeChange(e, payload.itemId)}>
            <img className="carousel-pointer" alt={payload.description} src={payload.imagePath} />
            <p className="legend">{payload.description}</p>
          </div>
        );
      }
    }

    render() {

      const { state, props } = this;

      if(state.filteredItems.length === 0) {
        return "No items found in this category";
      }

      //exclude itself
      let isNFT = props.category === "ownership";
      let isSkin = props.category === "carskins";
      let isMomentNFT = props.category === "momentnfts";


      //https://github.com/leandrowd/react-responsive-carousel/
      return <Carousel autoPlay>
      {state.filteredItems.map(value => {

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

          payload.imagePath = "/assets/img/sims/"+value.info.simulator+".png";
          payload.description = value.info.description;
        }

        payload.itemId = value.id;

        return this.renderItemDetails(payload);  

      }, this)}
      </Carousel>
    }
}

export default SimilarItemsComponent;