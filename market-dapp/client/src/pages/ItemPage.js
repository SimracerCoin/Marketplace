import React, { Component } from 'react';
import { Button, Form } from 'react-bootstrap';
import { withRouter } from "react-router";
import { Redirect, Link } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import { Buffer } from 'buffer';
import StarRatings from 'react-star-ratings';
import UIHelper from "../utils/uihelper";
import ReviewsComponent from "../components/ReviewsComponent";
import SimilarItemsComponent from '../components/SimilarItemsComponent';
import SimpleModal from '../components/SimpleModal';
import ipfs from "../ipfs";
import * as openpgp from 'openpgp';

import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../css/custom-carousel.css';
import "../css/itempage.css";

const PASSPHRASE = process.env.REACT_APP_PASSPHRASE;
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);
const NUMBER_LOAD_ITEMS = 10;

class ItemPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            itemId: "",
            track:  "",
            simulator: "",
            season: "",
            series: "",
            description: "",
            price: "",
            carBrand: "",
            carNumber: 0,
            vendorAddress: "",
            vendorNickname: "",
            ipfsPath: "",
            videoPath: "",
            imagePath: [],
            isNFT: false,
            isMomentNFT: false,
            usdValue: 1,
            metadata: {},
            contract: null,
            currentAccount: "",
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0,
            isMuted: true,
            messageOptions: {show: false, title:'', variant:'sucess', message:''},
            isSeller: false, 
            isContractOwner: false,
            canDelete: false,
            sellFromWallet: false,
            isNFTOwner: false,
            redirectEdit: false,
            hasVideo: false,
            hasImage: false
        }

        this.mute = this.mute.bind(this);
        this.unmute = this.unmute.bind(this);
    }

    extractNFTTraitTypes(attributes) {
        let data = {};
        for(let attribute of attributes) {
            data[attribute.trait_type] = attribute.value;
        }
        return data;
    }

    componentDidMount = async () => {
        const { props } = this;
        const { drizzle, drizzleState } = props;

        const contract = await drizzle.contracts.STMarketplace;
        const contractNFTs = await drizzle.contracts.SimthunderOwner;
        const contractSimracerCoin = await drizzle.contracts.SimracerCoin;
        const contractMomentNFTs = await drizzle.contracts.SimracingMomentOwner;
        const stSetup = await drizzle.contracts.STSetup;
        const stSkin = await drizzle.contracts.STSkin;

        const currentAccount = await drizzleState.accounts[0];
        const marketplaceOwner = await UIHelper.callWithRetry(contract.methods.owner());

        const updateAfterLoad = async () => {
          const { state } = this;

          this.setState({usdValue: await UIHelper.fetchSRCPriceVsUSD()});

          if(state.imagePath && (!Array.isArray(state.imagePath) || !state.imagePath.every(str => str === ""))) {
            const imagePath = Array.isArray(state.imagePath) ? state.imagePath : [state.imagePath];
            imagePath.forEach((v, idx) => {
              if(/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(v)) {
                imagePath[idx] = v.split('/').pop();
              }
            });
            this.setState({imagePath, hasImage: true});

            try {
              // workaround to insure that item persist on metatags cache db
              fetch('/api/metatags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: state.itemId,
                  category: state.category,
                  description: state.description,
                  image: imagePath ? "https://simthunder.infura-ipfs.io/ipfs/" + imagePath[0] : null
                  })
              });
            } catch(e) {
              console.error(e);
            }
          }

          const sellerAddress = state.vendorAddress;
          const isSeller = (currentAccount === sellerAddress);
          const isContractOwner = (currentAccount === marketplaceOwner);
          const isSkin = !state.isNFT && !state.isMomentNFT && (!state.track || !state.season);
          const canDelete = isSeller || isContractOwner;
          const hasVideo = state.isMomentNFT && state.videoPath;
  
          if (!state.isNFT && !state.isMomentNFT) {
            const listComments = await UIHelper.callWithRetry(contract.methods.getItemComments(state.itemId));
            const average_review = await this.averageRating(listComments);
  
            this.setState({ canDelete, currentAccount, isSeller, isContractOwner, contract, contractSimracerCoin, listComments, average_review, isSkin });
          } else {
            const isNFTOwner = (await UIHelper.callWithRetry((state.isNFT ? contractNFTs : contractMomentNFTs).methods.ownerOf(state.itemId))) === currentAccount;
  
            this.setState({ isNFTOwner, canDelete, currentAccount, isSeller, contract, contractMomentNFTs, contractNFTs, contractSimracerCoin, isSkin });
          }
  
          this.setState({hasVideo, isMuted: hasVideo});
        }

        const {category, id} = props.match.params;
        this.setState({category});

        if(props.location.state) {
          this.setState({
            itemId: props.location.state ? props.location.state.selectedItemId : "",
            track: props.location.state ? props.location.state.selectedTrack : "",
            simulator: props.location.state ? props.location.state.selectedSimulator  : "",
            season: props.location.state ? props.location.state.selectedSeason : "",
            series: props.location.state ? props.location.state.selectedSeries : "",
            description: props.location.state ? props.location.state.selectedDescription : "",
            price: props.location.state ? props.location.state.selectedPrice : "",
            carBrand: props.location.state ? props.location.state.selectedCarBrand : "",
            carNumber: props.location.state ? props.location.state.selectedCarNumber : 0,
            vendorAddress: props.location.state ? props.location.state.vendorAddress : "",
            vendorNickname: props.location.state ? props.location.state.vendorNickname : "",
            ipfsPath: props.location.state ? props.location.state.ipfsPath : "",
            videoPath: props.location.state ? props.location.state.videoPath : "",
            imagePath: props.location.state ? (Array.isArray(props.location.state.imagePath) ? props.location.state.imagePath : [props.location.state.imagePath]) : [],
            isNFT: props.location.state ? props.location.state.isNFT : false,
            isMomentNFT: props.location.state ? props.location.state.isMomentNFT : false,
            metadata: props.location.state ? props.location.state.metadata : {},
          }, updateAfterLoad);
        } else if(id) {
          let item, info, data;

          try {
            switch(category) {
              case "carskins":
                item = await UIHelper.callWithRetry(stSkin.methods.getSkin(id));
                this.setState({imagePath: [item.info.skinPic]});
                break;
              case "carsetup":
                item = await UIHelper.callWithRetry(stSetup.methods.getSetup(id));
                break;
              case "momentnfts":
                [data, info] = await Promise.all([UIHelper.callWithRetry(contractMomentNFTs.methods.tokenURI(id)).then(uri => fetch(uri)).then(r => r.json()), UIHelper.callWithRetry(contractMomentNFTs.methods.getItem(id))]);

                item = { ad: {price: info[0], seller: info[1], active: true}, info: {...data, imagePath: [data.image], isMomentNFT: true, metadata: this.extractNFTTraitTypes(data.attributes)}};
                break;
              case "ownership":
                [data, info] = await Promise.all([UIHelper.callWithRetry(contractNFTs.methods.tokenURI(id)).then(uri => fetch(uri)).then(r => r.json()), UIHelper.callWithRetry(contractNFTs.methods.getItem(id))]);

                item = { ad: {price: info[0], seller: info[1], active: true}, info: {...data, imagePath: [data.image], isNFT: true, metadata: this.extractNFTTraitTypes(data.attributes)}};
                break;
                default:
            }
          } catch(e) {
            console.error(e);

            alert("Item not found!");
            window.location.href = "/";
            return;
          }

          this.setState({ 
            ...item.ad, 
            ...item.info,
            itemId: id,
            vendorAddress: item.ad.seller,
            vendorNickname: (await UIHelper.callWithRetry(contract.methods.getSeller(item.ad.seller))).nickname
          }, updateAfterLoad);
        } else {
          alert("Item not found!");
          window.location.href = "/";
          return;
        }

        UIHelper.scrollToTop();
    }

    averageRating = async (comments) => {
        const total = comments.length;
        let counter_rating = 0;
        if (total === 0) {
            return counter_rating;
        } else {
            for (const [_,value] of comments.entries()) {
                let rating = parseInt(value.review);
                counter_rating = counter_rating + rating;
            }
            return (counter_rating / total);
        }

    }

    changeRating = async (newRating) => {
        this.setState({
            review_rating: newRating
        });
    }

    /*
    acceptItem = async (purchaseId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was accepted", this.state.vendorAddress, 3).send({ from: this.state.currentAccount });
        
        alert('Thank you for your purchase!');
    }

    rejectItem = async (purchaseId) => {
        await this.state.contract.methods.newNotification(purchaseId, "Purchase was challenged", this.state.vendorAddress, 2).send({ from: this.state.currentAccount });
        
        alert('Seller will be notified.');
    }
    */

    editItem = async() => {
      this.setState({redirectEdit: true});
    }

    performEditItemRedirection() {
      const { state } = this;

      return (
        <Redirect
            to={{
              pathname: (state.isSkin?"/uploadskin":"/uploadcar"),
              state: {
                itemId: state.itemId,
                priceValue: Number(this.props.drizzle.web3.utils.fromWei(state.price)),
                currentCar: state.carBrand,
                currentSimulator: state.simulator,
                currentDescription: state.description,
                currentSeason: state.season,
                currentSeries: state.series,
                currentTrack: state.track,
                image_ipfsPath: state.imagePath,
                mode: "edit"
              }
            }}
        />
      );
    }

    deleteItem = async() => {
      if(this.state.canDelete) {
        const id = Number(this.state.itemId);
        UIHelper.showSpinning();

        const isSkin = this.state.isSkin;
        const isCarSetup = !isSkin && !this.state.isNFT && !this.state.isMomentNFT;
        const paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

        if(isSkin || isCarSetup) {
          await this.state.contract.methods.setAdActive(id, false)
              .send(paramsForCall)
              .on('confirmation', confNumber => {
                    window.localStorage.setItem('forceUpdate','yes');
                    if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {  
                      UIHelper.transactionOnConfirmation("The item was removed from sale!","/");
                    }
                })
                .on('error', UIHelper.transactionOnError)
                .catch((e) => {
                    console.error(e);
                    UIHelper.hideSpinning();
                });
        } else if(this.state.isNFT) {
          //normal nft
          await this.deleteNFT(this.state.contractNFTs, id);
        } else  { 
          //moment nft
          await this.deleteNFT(this.state.contractMomentNFTs, id);
        }
      } else { alert("You have no permissions!"); }
    }

    deleteNFT = async (contract, itemId) => {

      let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);
        //delete itemId
        await contract.methods.deleteItem(itemId)
          .send(paramsForCall)
          .on('confirmation', function (confNumber, receipt, latestBlockHash) {
              window.localStorage.setItem('forceUpdate','yes');
              if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                UIHelper.transactionOnConfirmation("The item was removed from sale!","/");
              }
          })
          .on('error', UIHelper.transactionOnError)
          .catch(function (e) {
              UIHelper.hideSpinning();
          });
    }

    approveSellItem = async (itemPrice) => {
      
      //wrong type of item
      if(isNaN(this.state.itemId) || isNaN(itemPrice) || (!this.state.isMomentNFT && !this.state.isNFT) ) {
        return;
      }
      let itemId = Number(this.state.itemId);
      let isNFT = this.state.isNFT;
      let contract = isNFT ? this.state.contractNFTs : this.state.contractMomentNFTs;

      const price = this.props.drizzle.web3.utils.toWei(itemPrice);

      //some gas estimations
      //estimate method gas consuption (units of gas)
      let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

      UIHelper.showSpinning();
      await contract.methods.sellFromWallet(itemId, price)
          .send( paramsForCall )
          .on('confirmation', function (confNumber, receipt, latestBlockHash) {
            window.localStorage.setItem('forceUpdate','yes');
            if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
              UIHelper.transactionOnConfirmation("The item is now available for sale!","/");                            
            }
          })
          .on('error', ()=> {
              UIHelper.hideSpinning();
              UIHelper.transactionOnError("Unable to sell NFT!");
          })
          .catch(function (e) { 
            UIHelper.hideSpinning();
          });
    }

    sellItem = async() => {
      this.setState({sellFromWallet: true});
    }

    buyItem = async() => {
        const { state } = this;
        const { web3 } = this.props.drizzle;

        const balance = web3.utils.toBN(
          await UIHelper.callWithRetry(state.contractSimracerCoin.methods.balanceOf(state.currentAccount)));
        const price = web3.utils.toBN(state.price);

        if(balance.lt(price)) {
          alert("Insufficient balance to purchase the item!");
          return;
        }

        UIHelper.showSpinning();

        if (!state.isNFT && !state.isMomentNFT) {

          const downloadFile = async () => {
            const ipfsP = web3.utils.hexToAscii(state.ipfsPath);

            const chunks = [];
            for await (const chunk of ipfs.cat(ipfsP)) {
              chunks.push(chunk);
            }
            const content = Buffer.concat(chunks);

            const encryptedMessage = await openpgp.readMessage({
              binaryMessage: content // parse encrypted bytes
            });
            const { data: decryptedFile } = await openpgp.decrypt({
              message: encryptedMessage,
              passwords: [NON_SECURE_KEY],                       // decrypt with password
              format: 'binary'                                   // output as Uint8Array
            });

            const isSkin = state.isSkin;
            const isCarSetup = !isSkin && !state.isNFT && !state.isMomentNFT;

            const data = new Blob([decryptedFile]);
            const csvURL = window.URL.createObjectURL(data);
            const tempLink = document.createElement('a');
            tempLink.href = csvURL;
            tempLink.setAttribute('download', isCarSetup ? 'setup.zip' : 'skin.zip');  // has it isn't a car setup, it is a skin
            tempLink.click();
          }

          if(state.price == 0) {
            downloadFile()
              .then(UIHelper.hideSpinning)
              .catch(UIHelper.transactionOnError);
          } else {
            let buyerKey = localStorage.getItem('ak');
            if (!buyerKey) {
                const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
                    userIDs: [{ name: this.state.currentAccount }],             // you can pass multiple user IDs
                    curve: 'p256',                                              // ECC curve name
                    passphrase: PASSPHRASE                                      // protects the private key
                });

                buyerKey = web3.utils.asciiToHex(publicKeyArmored);

                localStorage.setItem('ak', buyerKey);
                localStorage.setItem('bk', web3.utils.asciiToHex(privateKeyArmored));
            }
            
            //approve contract ot spend our SRC
            const paramsForCall = await UIHelper.calculateGasUsingStation(state.currentAccount);
            const approval = await state.contractSimracerCoin.methods.approve(state.contract.address, price)
              .send(paramsForCall)
              .catch(UIHelper.transactionOnError);

            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //approved
              await state.contract.methods.requestPurchase(state.itemId, buyerKey, !NON_SECURE_SELL)
                .send(paramsForCall)
                //.on('sent', UIHelper.transactionOnSent)
                .on('confirmation', async (confNumber) => {
                  if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                    if(!NON_SECURE_SELL) {
                      UIHelper.transactionOnConfirmation("Thank you for your purchase request. Seller will contact you soon.", "/");
                    } else {
                      downloadFile()
                        .then(() => UIHelper.transactionOnConfirmation("Thank you for your purchase!", false))
                        .catch(UIHelper.transactionOnError);
                    }
                  }
                })
                .on('error', UIHelper.transactionOnError)
                .catch(console.error);
            }
          }
        } else {
            const contractAddressToApprove = state.isNFT ? state.contractNFTs.address : state.contractMomentNFTs.address;
            const paramsForCall = await UIHelper.calculateGasUsingStation(state.currentAccount);
            const approval = await this.state.contractSimracerCoin.methods.approve(contractAddressToApprove, price)
              .send(paramsForCall)
              .catch(UIHelper.transactionOnError);

            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //SimthunderOwner NFT
              if(state.isNFT) {
              
                await state.contractNFTs.methods.buyItem(state.itemId, price)
                  .send(paramsForCall)
                  .on('confirmation', (confNumber) => {
                    if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                      UIHelper.transactionOnConfirmation("Thank you for your purchase.", "/");
                    }
                  })
                  .on('error', UIHelper.transactionOnError)
                  .catch(console.error);

                //SimracingMomentOwner NFT
              } else if(state.isMomentNFT) {
                await state.contractMomentNFTs.methods.buyItem(state.itemId, price)
                  .send(paramsForCall)
                  .on('confirmation', (confNumber) => {
                    if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                      UIHelper.transactionOnConfirmation("Thank you for your purchase.", "/");
                    }
                  })
                  .on('error', UIHelper.transactionOnError)
                  .catch(console.error);
              }
            }
        }
    }

    submitComment = async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const description = document.getElementById('comment').value;

        if (this.state.review_rating === 0) {
            alert("Please review this item")
        } else {
            await this.state.contract.methods.newComment(this.state.itemId, description, this.state.review_rating).send({ from: this.state.currentAccount });
            const listComments = await UIHelper.callWithRetry(this.state.contract.methods.getItemComments(this.state.itemId));
            const average_review = await this.averageRating(listComments);
            document.getElementById("comment").value = "";
            this.setState({ listComments: listComments, review_rating: 0, average_review: average_review });
        }
    }

    unmute = async() => {
      this.setState({isMuted: false});    
    }

    mute = async() => {
      this.setState({isMuted: true});
    }

    handleReview = async (event) => {
        this.setState({ review: event });
    }

    getReviewsRating = () => {
      let numRatings = this.state.listComments.length;
      let reviewStars = 0;
      if (numRatings > 0) {
        for (const [_,value] of this.state.listComments.entries()) {
            let review = parseInt(value.review);
            reviewStars += review;
        }
        reviewStars = Math.ceil((reviewStars/numRatings));
      }
      let retValue = {
        rating: reviewStars,
        html: []
      };
      for(let i = 0; i < reviewStars; i++) {
        retValue.html.push('<i className="fas fa-star"></i>');
      }
      return retValue;
    }

    //just 1 best
    getBestReviews = () => {
      let numRatings = this.state.listComments.length;
      let best = null;
      if(numRatings > 0) {
        for(let i = 0; i < numRatings; i++) {
          let elem = this.state.listComments[i];
          let rate = parseInt(elem.review);
          if(best == null) {
            best = elem;
          } else {
            if(rate > parseInt(best.review)) {
              //new best
              best = elem;
            }
          }
        }
      } else {
        return <span>No reviews yet</span>
      }

      let commentator = best.commentator;
      let description = best.description;
      let date = new Date(best.date*1000);
      let date_time = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return (
          <div className="review-item mb-5">
            <div className="small d-flex">
                <div className="flex-1">
                   <span className="name badge badge-warning-address">{commentator}</span>{/*fw-600 small-4*/}
                   <span className="time ml-2">{date_time}</span>
                </div>
             </div>
             <div>
                <span className="lead-2">{description}</span>
                   <div className="collapse readmore r-fade">
                    <p className="mb-0 small-3">{description}</p>
                    {/*<a href="" className="text-info"><i className="fas fa-thumbs-up"></i>135</a>*/}
                   </div>
                  {/*<a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>*/}
              </div>
          </div>
      );
    }

    /**
     * 
     * @returns Handle right side menu with item info
     */
    renderItemInformation = () => {
      if (this.state.isNFT || this.state.isMomentNFT) {
          return this.renderItemInformationForNFT();
      } 
      else if (!this.state.track || !this.state.season) {
          return this.renderItemInformationForSkin();
      } else {
          return this.renderItemInformationForCarSetup();
      }
    }

    renderUSDPrice = () =>
      ["$" + Number(Math.round(Number(this.props.drizzle.web3.utils.fromWei(this.state.price)) * this.state.usdValue * 100) / 100).toFixed(2), <sup className="secondary-sup">USD</sup>];

    renderSellerInfo = () => {

      if(this.state.vendorNickname) {
            return (
              <ul className="list-unstyled mb-3">
                <li key="nickname">
                  <span className="platform">Nickname:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname}</u></Link></span>
                </li>
          
                <li key="address">
                  <span className="platform">Address:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorAddress}</u></Link></span>
                </li>
              </ul>
            );
      } else {
        return (
          <ul className="list-unstyled mb-3">    
            <li key="address">
              <span className="platform">Address:</span> 
              <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress } }}><u>{this.state.vendorAddress}</u></Link></span>
            </li>
          </ul>
        );
      }
      
    }

    //Skin item information
    renderItemInformationForSkin = () => {
      const price = Number(this.props.drizzle.web3.utils.fromWei(this.state.price)).toFixed(2);

      return ( 
        <div className="row">
          <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Simulator:</strong></div>
            <div className="col-sm-8">{this.state.simulator}</div>
            </div>
            
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Car Brand:</strong></div>
            <div className="col-sm-8">{this.state.carBrand}</div>
            </div>

            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Description:</strong></div>
              <div className="col-sm-8">{this.state.description}</div>
            </div>
            
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
            <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice()}</span></div>
            </div>
          </div>
        </div>
      );
    }

    //NFT
    renderItemInformationForNFT = () => {

      let date = "N/A";
      if(this.state.isMomentNFT && this.state.metadata && this.state.metadata.date) {
        date = UIHelper.formaDateAsString(this.state.metadata.date);
      }
      
      const price = Number(this.props.drizzle.web3.utils.fromWei(this.state.price)).toFixed(2);

      return (
        <div className="row">
          <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
            { this.state.isMomentNFT &&
            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Date:</strong></div>
              <div className="col-sm-8">{date}</div>
            </div>
            }
            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Simulator:</strong></div>
              <div className="col-sm-8">{this.state.simulator}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Series:</strong></div>
              <div className="col-sm-8">{this.state.series}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Description:</strong></div>
              <div className="col-sm-8">{this.state.description}</div>
            </div>
            {
              this.state.isNFT &&
              <div className="row mb-4 mb-sm-0">
                <div className="col-sm-4"><strong className="fw-500">Car Number:</strong></div>
                <div className="col-sm-8">{this.state.carNumber}</div>
              </div>
            }
            { !this.state.isNFTOwner && 
            <div className="row mb-4 mb-sm-0">
              <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
              <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice()}</span></div>
            </div>
            }
          </div>
        </div>
      );
    }

    //Car setup
    renderItemInformationForCarSetup = () => {
      const price = Number(this.props.drizzle.web3.utils.fromWei(this.state.price)).toFixed(2);

      return (
        <div className="row">
          <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Simulator:</strong></div>
            <div className="col-sm-8">{this.state.simulator}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Series:</strong></div>
            <div className="col-sm-8">{this.state.series}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Car Brand:</strong></div>
            <div className="col-sm-8">{this.state.carBrand}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Season:</strong></div>
            <div className="col-sm-8">{this.state.season}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Description:</strong></div>
            <div className="col-sm-8">{this.state.description}</div>
            </div>
            <div className="row mb-4 mb-sm-0">
            <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
            <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice()}</span></div>
            </div>
          </div>
        </div>
      );
    }

    renderCarousel = () => {

      const { hasVideo, hasImage } = this.state;

      if(hasImage && !hasVideo) {
        return (
          <Carousel>
            {
              this.state.imagePath.map((value, idx) => {
                return <img className="imageContainer" src={"https://simthunder.infura-ipfs.io/ipfs/"+value} alt={"slide_"+idx}/>
              })
            }
          </Carousel>
        );
      } else if(hasVideo) {
        if(this.state.isMuted) {
          return <div className="carousel-product">
                    <div className="slider text-secondary" data-slick="product-body">
                        <video async className="videoContainer" loop muted autoPlay currenttime={0} src={this.state.videoPath} />  
                        <button onClick={this.unmute} className="video-sound-control--btn video-sound-control--btn-off" label="Unmmute" type="button"></button> 
                    </div>
                </div>
        } 
        return (
              <div className="carousel-product">
                  <div className="slider text-secondary" data-slick="product-body">
                    <video async className="videoContainer" loop autoPlay currenttime={0} src={this.state.videoPath} />  
                    <button onClick={this.mute} className="video-sound-control--btn video-sound-control--btn-on" label="Mute" type="button"></button> 
                  </div>
              </div>
        );
      }

      return "";
    }

    render() {

      const { state, props } = this;

      if (state.redirectEdit) {
        return this.performEditItemRedirection();
      }

      let item = 
        state.category === "carskins" ? "Skin" : 
        state.category === "carsetup" ? "Car Setup" :
        state.category === "momentnfts" ? "Simracing Moment NFT" :
        state.category === "ownership" ? "Car Ownership NFT" : "";
      
      //compute ratings
      const reviewsRating = this.getReviewsRating();
      const allowsReviews = !state.isNFT && !state.isMomentNFT;
      const price = Number(this.props.drizzle.web3.utils.fromWei(state.price)).toFixed(2);

      return (
        <div className="page-body">    
        <main className="main-content">
          <div className="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape"/></div>
          {/*<!-- Start Content Area -->*/}
          <div className="content-section text-light pt-8">
            <div className="container">
              <div className="row gutters-y">
                <div className="col-12">
                  <header>
                    <h3 className="product_name mb-4">{item}</h3>
                    <div className="d-flex flex-wrap align-items-center">
                      <div className="review d-flex">
                        <div className="review_score">
                          <div className="review_score-btn">{Number(state.average_review).toFixed(1)}</div>
                        </div>
                        <div className="star_rating-se text-warning mr-7">
                          {!reviewsRating.rating && 
                            <span>No ratings yet</span>
                          }
                          {reviewsRating.html.map( () => {
                            return <i className="fas fa-star"></i>
                          })}
                        </div>
                      </div>
                    </div>
                  </header>
                </div>
                <div className="col-lg-8">
                  <div className="row">
                    <div className="col-12">
                      <div className="product-body">
                        {/*<!--Carousel Wrapper-->*/}
                        {this.renderCarousel()}
                        {/*<!--/.Carousel Wrapper-->*/}
                        <div className="alert alert-no-border alert-share d-flex mb-6" role="alert">
                          <span className="flex-1 fw-600 text-uppercase text-warning">Share:</span>
                          <div className="social-buttons text-unset">
                            <a className="social-twitter mx-2" target="_blank" rel="noreferrer" href={"https://twitter.com/intent/tweet?url="+encodeURIComponent(window.location.href)}><i className="fab fa-twitter"></i></a>
                            <a className="social-dribbble mx-2" target="_blank" rel="noreferrer" href={"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(window.location.href)}><i className="fab fa-facebook"></i></a>
                          </div>
                        </div>
                        <div id="system_requirements" className="mb-8">
                          <h6 className="mb-4 fw-400 ls-1 text-uppercase">Item Information</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                            <div className="tab-content" id="fillupTabContent">
                              <div className="tab-pane fade active show" id="fillup-1" role="tabpanel" aria-labelledby="fillup-home-tab">
                                {this.renderItemInformation()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <h6 className="mb-0 fw-400 ls-1 text-uppercase">More like this</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                              <SimilarItemsComponent drizzle={props.drizzle} category={props.match.params.category} className="similaritems" selectedItemId={props.match.params.id}></SimilarItemsComponent>   
                          </div>
                        </div>
                        <div className="mb-0">
                          <div>
                            <div>
                              <p className="small"></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="bg-dark_A-20 p-4 mb-4">
                    { state.hasImage &&
                      <img className="item-page-img mb-3" src={"https://simthunder.infura-ipfs.io/ipfs/"+state.imagePath[0]} alt="Product"/>
                    }
                    <p>
                    { state.description && 
                      <span>{state.description}</span>
                    }
                    </p>
                    <div className="price-wrapper">
                      <div className="mb-3">
                        <div className="price">
                            {/*<div className="price-prev">300$</div>*/}
                            <div className="price-current"><strong className="price_div_strong">{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price"><span className="secondary-price">{this.renderUSDPrice()}</span></span></div>
                          </div>
                        {/*<div className="discount">
                            Save: $20.00 (33%)
                        </div>*/}
                      </div>
                      { !state.isSeller && !state.isNFTOwner &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><button onClick={this.buyItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Buy</button></div>
                      </div>
                      }
                      { state.isNFTOwner && 
                        <div className="price-box mb-4">
                          <div className="flex-1"><button onClick={this.sellItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Sell</button></div>
                        </div>
                      }
                      { state.canDelete && !(state.isNFT || state.isMomentNFT) &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><button onClick={this.editItem} className="btn btn-block btn-primary"> Edit</button></div>
                      </div>
                      }
                      { state.canDelete &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><button onClick={this.deleteItem} className="btn btn-block btn-danger">{ (state.isNFT || state.isMomentNFT) ? "Return" : "Delete" }</button></div>
                      </div>
                      }
                    </div>
                  </div>
                  { !state.isNFTOwner && 
                    <div className="bg-dark_A-20 p-4">
                      <h6 className="mb-3">Seller Info</h6>
                      <hr className="border-secondary mt-2 mb-4" />
                      {this.renderSellerInfo()}
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
          { !this.state.isNFT && !this.state.isMomentNFT &&
          <section className="review-box content-section text-light">
            <div className="container">
              <div className="row">
                <div className="col-lg-8">
                  <div className="mb-8">
                    <h6 className="mb-4 fw-400 ls-1 text-uppercase">Reviews</h6>
                    <hr className="border-secondary mt-2 mb-6"/>
                    <div className="row">
                      {/*<!-- Item -->*/}
                      {this.state.listComments.map(comment => {
                        return <ReviewsComponent comment={comment} />
                      })}
                      {/*cannot comment nfts? */}
                      { allowsReviews &&
                        <div className="container">
                        <h4 className="text-white">Add Review</h4>
                        <Form onSubmit={this.submitComment}>
                            <Form.Control as="textarea" rows={3} placeholder="Say something here..." id="comment" />
                            <br />
                            <StarRatings
                                rating={this.state.review_rating}
                                starRatedColor="yellow"
                                changeRating={this.changeRating}
                                numberOfStars={5}
                                starDimension="20px"
                                name='rating' />
                            <br />
                            <Button className="mt-5" onClick={this.submitComment}>Comment</Button>
                        </Form>
                      </div>
                      }
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div>
                    <h6 className="mb-4 fw-400 ls-1 text-uppercase">Best reviews</h6>
                    <div className="border border-secondary rounded p-4">
                       {this.getBestReviews()}
                      <hr className="border-secondary mt-0 mb-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          }
          </main>
          <script src="assets/js/main.js" id="_mainJS" data-plugins="load"></script>

          {this.state.sellFromWallet && 
            <SimpleModal onApproval={this.approveSellItem} open={true}></SimpleModal>
          }
        </div>
      );
    }
}

export default withRouter(ItemPage);