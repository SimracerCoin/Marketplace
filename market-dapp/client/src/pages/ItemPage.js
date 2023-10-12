import React, { Component } from 'react';
import { Button, Form } from 'react-bootstrap';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import { Carousel } from 'react-responsive-carousel';
import StarRatings from 'react-star-ratings';
import UIHelper from "../utils/uihelper";
import ReviewsComponent from "../components/ReviewsComponent";
import SimilarItemsComponent from '../components/SimilarItemsComponent';
import SimpleModal from '../components/SimpleModal';
import ipfs from "../ipfs";

import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../css/custom-carousel.css';
import "../css/itempage.css";
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';

const BufferList = require('bl/BufferList');

const openpgp = require('openpgp');

const priceConversion = 10**18;
const PASSPHRASE = process.env.REACT_APP_PASSPHRASE;
const NON_SECURE_SELL = process.env.REACT_APP_NON_SECURE_SELL === "true";
const NON_SECURE_KEY= process.env.REACT_APP_NON_SECURE_KEY;
const NUMBER_CONFIRMATIONS_NEEDED = Number(process.env.REACT_APP_NUMBER_CONFIRMATIONS_NEEDED);
const NUMBER_LOAD_ITEMS = 10;

class ItemPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
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
            imagePath: props.location.state ? (Array.isArray(props.location.state.imagePath) ? props.location.state.imagePath : [props.location.state.imagePath]) : "",
            isNFT: props.location.state ? props.location.state.isNFT : false,
            isMomentNFT: props.location.state ? props.location.state.isMomentNFT : false,
            usdValue : props.location.state ? props.location.state.usdPrice : 1,
            metadata: props.location.state ? props.location.state.metadata : {},
            contract: null,
            currentAccount: "",
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0,
            isMuted: true,
            messageOptions: {show: false, title:'', variant:'sucess',message:''},
            isSeller: false, 
            isContractOwner: false,
            canDelete: false,
            sellFromWallet: false,
            isNFTOwner: false,
            redirectEdit: false,
            ...props.match.params
        }

        this.mute = this.mute.bind(this);
        this.unmute = this.unmute.bind(this);
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

    extractNFTTraitTypes(attributes) {
        let data = {};
        for(let attribute of attributes) {
            data[attribute.trait_type] = attribute.value;
        }
        return data;
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
              console.error(e);
          }
      }

      return nftlist;
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
        const contractSimracerCoin = await this.state.drizzle.contracts.SimracerCoin;
        const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;
        const stSetup = await this.state.drizzle.contracts.STSetup;
        const stSkin = await this.state.drizzle.contracts.STSkin;

        const currentAccount = await this.state.drizzleState.accounts[0];
        const marketplaceOwner = await contract.methods.owner().call();

        if(!this.state.itemId && this.state.id) {
          let item, info, data;

          try {
            switch(this.state.category) {
              case "carskins":
                item = await stSkin.methods.getSkin(this.state.id).call();
                this.setState({imagePath: item.info.skinPic});
                break;
              case "carsetup":
                item = await stSetup.methods.getSetup(this.state.id).call();
                break;
              case "momentnfts":
                [data, info] = await Promise.all([contractMomentNFTs.methods.tokenURI(this.state.id).call().then(uri => fetch(uri)).then(r => r.json()), contractMomentNFTs.methods.getItem(this.state.id).call(), this.loadRemainingNFTS(contractMomentNFTs)]);

                item = { ad: {price: info[0], seller: info[1], active: true}, info: {...data, imagePath: [data.image], isMomentNFT: true, metadata: this.extractNFTTraitTypes(data.attributes)}};
                break;
              case "ownership":
                [data, info] = await Promise.all([contractNFTs.methods.tokenURI(this.state.id).call().then(uri => fetch(uri)).then(r => r.json()), contractNFTs.methods.getItem(this.state.id).call(), this.loadRemainingNFTS(contractNFTs)]);

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
            itemId: this.state.id,
            usdValue: await this.fetchUSDPrice(),
            vendorAddress: item.ad.seller,
            vendorNickname: (await contract.methods.getSeller(item.ad.seller).call()).nickname
          });
        }

        if(this.state.imagePath) {
          let imagePath = Array.isArray(this.state.imagePath) ? this.state.imagePath : [this.state.imagePath];
          imagePath.forEach((v, idx) => {
              if(/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(v))
                imagePath[idx] = v.split('/').pop();
            });
            this.setState({imagePath: imagePath});
        }

        try {
          // workaround to insure that item persist on metatags cache db
          fetch('/api/metatags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: this.state.itemId,
              category: this.state.category,
              description: this.state.description,
              image: this.state.imagePath ? "https://simthunder.infura-ipfs.io/ipfs/" + this.state.imagePath[0] : null
              })
          });
        } catch(e) {
          console.error(e);
        }

        let sellerAddress = this.state.vendorAddress;
        let isSeller = (currentAccount === sellerAddress);
        let isContractOwner = (currentAccount === marketplaceOwner);
        let isSkin = !this.state.isNFT && !this.state.isMomentNFT && (!this.state.track || !this.state.season);

        const canDelete = isSeller || isContractOwner;
        const hasVideo = this.state.isMomentNFT;

        if (!this.state.isNFT && !this.state.isMomentNFT) {
            const comments = await contract.methods.getItemComments(this.state.itemId).call();
            const average_review = await this.average_rating(comments);

            this.setState({ canDelete: canDelete, currentAccount: currentAccount, isSeller: isSeller, isContractOwner: isContractOwner, contract: contract, contractSimracerCoin: contractSimracerCoin, listComments: comments, average_review: average_review, isSkin: isSkin });
        } else {
          let isNFTOwner = this.state.isNFTOwner;
          if(this.state.isNFT) {
            isNFTOwner = (await contractNFTs.methods.ownerOf(this.state.itemId).call() == currentAccount);
          } else {
            isNFTOwner = (await contractMomentNFTs.methods.ownerOf(this.state.itemId).call() == currentAccount);
          }
          this.setState({ isNFTOwner: isNFTOwner, canDelete: canDelete, currentAccount: currentAccount, isSeller: isSeller, contract: contract, contractMomentNFTs: contractMomentNFTs, contractNFTs: contractNFTs, contractSimracerCoin: contractSimracerCoin, isSkin: isSkin });
        }

        this.setState({isMuted: hasVideo});
        
        UIHelper.scrollToTop();
    }

    average_rating = async (comments) => {
        const total = comments.length;
        let counter_rating = 0;
        if (total == 0) {
            return counter_rating;
        } else {
            for (const [index, value] of comments.entries()) {
                let rating = parseInt(value.review);
                counter_rating = counter_rating + rating;
            }
            return (counter_rating / total);
        }

    }

    changeRating = async (newRating, name) => {
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

    editItem = async(e) => {
      e.preventDefault();
      this.setState({redirectEdit: true});
    }

    performEditItemRedirection() {
      return <Redirect
        to={{
          pathname: (this.state.isSkin?"/uploadskin":"/uploadcar"),
          state: {
            itemId: this.state.itemId,
            priceValue: Number((Math.round(this.state.price / priceConversion) * 100) / 100).toFixed(2),
            currentCar: this.state.carBrand,
            currentSimulator: this.state.simulator,
            currentDescription: this.state.description,
            currentSeason: this.state.season,
            currentSeries: this.state.series,
            currentTrack: this.state.track,
            image_ipfsPath: this.state.imagePath,
            mode: "edit"
          }
        }}
        />;
    }

    deleteItem = async(event) => {
      event.preventDefault();

      if(this.state.canDelete) {
        const id = Number(this.state.itemId);
        UIHelper.showSpinning();

        const isSkin = this.state.isSkin;
        const isCarSetup = !isSkin && !this.state.isNFT && !this.state.isMomentNFT;
        const paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

        if(isSkin || isCarSetup) {
          await this.state.contract.methods.setAdActive(id, false)
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
        } else if(this.state.isNFT) {
          //normal nft
          await this.deleteNFT(this.state.contractNFTs, id);
        } else  { 
          //moment nft
          await this.deleteNFT(this.state.contractMomentNFTs, id);
        }

      
      } else { alert("You have no permissions!")}
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

      const price = this.state.drizzle.web3.utils.toWei(itemPrice);

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

    sellItem = async(event) => {
      event.preventDefault();
      this.setState({sellFromWallet: true});
    }
    buyItem = async (event) => {
        event.preventDefault();

        const balance = this.state.drizzle.web3.utils.toBN(
          await this.state.contractSimracerCoin.methods.balanceOf(this.state.currentAccount).call());
        const price = this.state.drizzle.web3.utils.toBN(this.state.price);

        if(balance.lt(price)) {
          alert("Insufficient balance to purchase the item!");
          return;
        }

        UIHelper.showSpinning();

        if (!this.state.isNFT && !this.state.isMomentNFT) {
          let buyerKey = localStorage.getItem('ak');
          if (!buyerKey) {
              const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
                  userIds: [{ name: this.state.currentAccount }],             // you can pass multiple user IDs
                  curve: 'p256',                                              // ECC curve name
                  passphrase: PASSPHRASE                                      // protects the private key
              });

              buyerKey = this.state.drizzle.web3.utils.asciiToHex(publicKeyArmored);

              localStorage.setItem('ak', buyerKey);
              localStorage.setItem('bk', this.state.drizzle.web3.utils.asciiToHex(privateKeyArmored));
          }

          //approve contract ot spend our SRC
          let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

          let approval = await this.state.contractSimracerCoin.methods.approve(this.state.contract.address, price)
          .send(paramsForCall)
          .catch(function (e) {
            UIHelper.transactionOnError(e);
            });
          if(!approval) {
            UIHelper.transactionOnError("ERROR ON APPROVAL");
          } else {
            //approved
            await this.state.contract.methods.requestPurchase(this.state.itemId, buyerKey, !NON_SECURE_SELL)
            .send(paramsForCall)
            //.on('sent', UIHelper.transactionOnSent)
            .on('confirmation', async (confNumber, receipt, latestBlockHash) => {
              if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                if(!NON_SECURE_SELL) {
                  UIHelper.transactionOnConfirmation("Thank you for your purchase request. Seller will contact you soon.", "/");
                } else {
                  const content = new BufferList();
                  const ipfsP = this.state.drizzle.web3.utils.hexToAscii(this.state.ipfsPath);

                  try {
                    for await (const file of ipfs.get(ipfsP)) {
                        for await (const chunk of file.content) {
                            content.append(chunk);
                        }
                    }

                    const { data: decryptedFile } = await openpgp.decrypt({
                      message: await openpgp.message.read(content),      // parse encrypted bytes
                      passwords: [NON_SECURE_KEY],                       // decrypt with password
                      format: 'binary'                                   // output as Uint8Array
                    });

                    const isCarSetup = await this.state.contract.methods.isCarSetup(this.state.itemId).call();

                    var data = new Blob([decryptedFile]);
                    var csvURL = window.URL.createObjectURL(data);
                    var tempLink = document.createElement('a');
                    tempLink.href = csvURL;
                    tempLink.setAttribute('download', isCarSetup ? 'setup.zip' : 'skin.zip');  // has it isn't a car setup, it is a skin
                    tempLink.click();

                    UIHelper.transactionOnConfirmation("Thank you for your purchase!", false);

                  } catch (e) {
                    UIHelper.transactionOnError(e);
                  }
                }
              }
            })
            .on('error', UIHelper.transactionOnError)
            .catch(function (e) {
              console.log(e);
              });
          }
        } else {

            let contractAddressToApprove = this.state.isNFT ? this.state.contractNFTs.address : this.state.contractMomentNFTs.address;

            let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);
            let approval = await this.state.contractSimracerCoin.methods.approve(contractAddressToApprove, price)
            .send(paramsForCall)
            .catch(function (e) {
              UIHelper.transactionOnError(e);
             });
            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //do it!

              paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);

              //SimthunderOwner NFT
              if(this.state.isNFT) {
              
                await this.state.contractNFTs.methods.buyItem(this.state.itemId,price)
                .send(paramsForCall)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                  if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                    UIHelper.transactionOnConfirmation("Thank you for your purchase.", "/");
                  }
                    
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) {
                  console.log(e);
                });

                //SimracingMomentOwner NFT
              } else if(this.state.isMomentNFT) {
                
                await this.state.contractMomentNFTs.methods.buyItem(this.state.itemId,price)
                .send(paramsForCall)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                   if(confNumber === NUMBER_CONFIRMATIONS_NEEDED) {
                    UIHelper.transactionOnConfirmation("Thank you for your purchase.", "/");
                   }
                    
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) {
                  console.log(e);
                });
              }

              
            }
            
        }

        // const responseFile = await ipfs.get(this.state.ipfsHash);
        // for await (const file of ipfs.get(this.state.ipfsHash)) {
        //     console.log(file.path)
        //     console.log(file);

        //     const content = new BufferList()
        //     for await (const chunk of file.content) {
        //       content.append(chunk)
        //     }
        //     console.log(content.toString())
        //   }
        /*
        alert('Download you file at https://ipfs.io/ipfs/' + this.state.ipfsHash);

        confirmAlert({
            title: 'Review purchased item',
            message: 'Review the purchased item and accept it or challenge the purchase if you found any issue. Purchase will be automatically accepted if not challenged within 10 minutes.',
            buttons: [
                {
                    label: 'Accept',
                    onClick: () => this.acceptItem(response.events.PurchaseRequested.returnValues.purchaseId)
                },
                {
                    label: 'Reject/Challenge',
                    onClick: () =>  this.rejectItem(response.events.PurchaseRequested.returnValues.purchaseId)
                }
            ]
        });*/
    }

    submitComment = async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const description = document.getElementById('comment').value;
        if (this.state.review_rating == 0) {
            alert("Please review this item")
        } else {
            await this.state.contract.methods.newComment(this.state.itemId, description, this.state.review_rating).send({ from: this.state.currentAccount });
            const listComments = await this.state.contract.methods.getItemComments(this.state.itemId).call();
            const average_review = await this.average_rating(listComments);
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
      if (numRatings != 0) {
        for (const [index, value] of this.state.listComments.entries()) {
            let review = parseInt(value.review);
            reviewStars += review;
        }
        reviewStars = Math.ceil((reviewStars/numRatings));
      }
      let retValue = {
        rating : reviewStars,
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
      //let review = parseInt(best.review); NOT USED
      let date = new Date(best.date)
      let date_time = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return <div className="review-item mb-5">
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
                    <a href="" className="text-info"><i className="fas fa-thumbs-up"></i> 135</a>
                   </div>
                  <a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
              </div>
        </div>
    
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

    renderUSDPrice = (price) =>
      ["$" + Number(Math.round((price / priceConversion) * this.state.usdValue * 100) / 100).toFixed(2), <sup className="secondary-sup">USD</sup>];

    renderSellerInfo =() => {

      if(this.state.vendorNickname) {
            return <ul className="list-unstyled mb-3">
                  <li>
                  <span className="platform">Nickname:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname}</u></Link></span>
                  </li>
            
                  <li>
                  <span className="platform">Address:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorAddress}</u></Link></span>
                  </li>
                  </ul>
      } else {
        return <ul className="list-unstyled mb-3">
                
                  <li>
                  <span className="platform">Address:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress } }}><u>{this.state.vendorAddress}</u></Link></span>
                  </li>
                  </ul>
      }
      
    }

    //Skin item information
    renderItemInformationForSkin = () => {
      const price = Number((Math.round(this.state.price / priceConversion) * 100) / 100).toFixed(2);

      return <div className="row">
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
                <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}</span></div>
                </div>
              </div>
            </div>
 
    }

 
    //NFT
    renderItemInformationForNFT = () => {

      let date = "N/A";
      if(this.state.isMomentNFT && this.state.metadata && this.state.metadata.date) {
        date = UIHelper.formaDateAsString(this.state.metadata.date);
      }
     
      const price = Number((Math.round(this.state.price / priceConversion) * 100) / 100).toFixed(2);

      return <div className="row">
              <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
                <div className="row mb-4 mb-sm-0">
                  <div className="col-sm-4"><strong className="fw-500">Date:</strong></div>
                  <div className="col-sm-8">{date}</div>
                </div>
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
                  <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}</span></div>
                </div>
                }
              </div>
            </div>
    
    }

    //Car setup
    renderItemInformationForCarSetup = () => {

      const price = Number((Math.round(this.state.price / priceConversion) * 100) / 100).toFixed(2);

      return <div className="row">
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
                <div className="col-sm-8"><strong>{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}</span></div>
                </div>
              </div>
            </div>
      
    }

    renderCarousel = (hasVideo, hasImage) => {

      if(hasImage && !hasVideo) {
        if(this.state.imagePath.length > 1) {
          return <Carousel>
            {
              this.state.imagePath.map((value, idx) => {
                return <img className="imageContainer" src={"https://simthunder.infura-ipfs.io/ipfs/"+value} alt={"slide_"+idx}/>
              })
            }
          </Carousel>;
        } else {
          return <div className="carousel-product">
            <div className="slider text-secondary" data-slick="product-body">
                  <img className="imageContainer" src={"https://simthunder.infura-ipfs.io/ipfs/"+this.state.imagePath[0]} alt={"slide"}/>
            </div>
          </div>
        }
      } else if(hasVideo) {
        if(this.state.isMuted) {
          return <div className="carousel-product">
                    <div className="slider text-secondary" data-slick="product-body">
                        <video async className="videoContainer" loop muted autoPlay currenttime={0} src={this.state.videoPath} />  
                        <button onClick={this.unmute} className="video-sound-control--btn video-sound-control--btn-off" label="Unmmute" type="button"></button> 
                    </div>
                </div>
        } 
        return  <div className="carousel-product">
                  <div className="slider text-secondary" data-slick="product-body">
                    <video async className="videoContainer" loop autoPlay currenttime={0} src={this.state.videoPath} />  
                    <button onClick={this.mute} className="video-sound-control--btn video-sound-control--btn-on" label="Mute" type="button"></button> 
                  </div>
              </div>
      }

      return "";
    }

    render() {

      if (this.state.redirectEdit) {
        return this.performEditItemRedirection();
      }

      let item = "";

      let hasImage = true;
      let hasVideo = this.state.isMomentNFT && this.state.videoPath !== null;
      
      if (this.state.isNFT) {
        item = "Car Ownership NFT";
      }
      else if(this.state.isMomentNFT) {
        item = "Simracing Moment NFT";
      }
      else if (!this.state.track || !this.state.season) {
        item = "Skin";
      } else {
        item = "Car Setup";
        hasImage = false;
      }
      //compute ratings
      let reviewsRating = this.getReviewsRating();

      const allowsReviews = !this.state.isNFT && !this.state.isMomentNFT;
      const price = Number((Math.round(this.state.price / priceConversion) * 100) / 100).toFixed(2);

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
                          <div className="review_score-btn">{Number(this.state.average_review).toFixed(1)}</div>
                        </div>

                        <div className="star_rating-se text-warning mr-7">

                          {reviewsRating.rating == 0 && 
                           <span>No ratings yet</span>
                          }

                          {reviewsRating.html.map( (value, idx) => {
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
                        { this.renderCarousel(hasVideo, hasImage)}
                        {/*<!--/.Carousel Wrapper-->*/}
    
                        <div className="alert alert-no-border alert-share d-flex mb-6" role="alert">
                          <span className="flex-1 fw-600 text-uppercase text-warning">Share:</span>
                          <div className="social-buttons text-unset">
                            <a className="social-twitter mx-2" target="_blank" rel="noreferrer" href={ "https://twitter.com/intent/tweet?url="+encodeURIComponent(window.location.href) }><i className="fab fa-twitter"></i></a>
                            <a className="social-dribbble mx-2" target="_blank" rel="noreferrer" href={ "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(window.location.href) }><i className="fab fa-facebook"></i></a>
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
                              <SimilarItemsComponent drizzle={this.state.drizzle} category={this.state.category} className="similaritems" selectedItemId={this.state.itemId ? this.state.itemId : this.state.id}></SimilarItemsComponent>   
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
                    {hasImage && this.state.imagePath &&
                        <img className="item-page-img mb-3" src={"https://simthunder.infura-ipfs.io/ipfs/"+this.state.imagePath[0]} alt="Product"/>
                    }
                    <p>
                      {this.state.description && 
                      <span>{this.state.description}</span>
                      }
                    </p>
                    <div className="price-wrapper">
                      <div className="mb-3">
                        <div className="price">
                            {/*<div className="price-prev">300$</div>*/}
                            <div className="price-current"><strong className="price_div_strong">{price} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price"><span className="secondary-price">{this.renderUSDPrice(this.state.price)}</span></span></div>
                          </div>
                        {/*<div className="discount">
                            Save: $20.00 (33%)
                        </div>*/}
                      </div>
                      {
                        !this.state.isSeller && !this.state.isNFTOwner &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><a href="" onClick={this.buyItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Buy</a></div>
                      </div>
                      }
                      { this.state.isNFTOwner && 
                        <div className="price-box mb-4">
                          <div className="flex-1"><a href="" onClick={this.sellItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Sell</a></div>
                        </div>
                      }
                      { this.state.canDelete && !(this.state.isNFT || this.state.isMomentNFT) &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><a href="" onClick={this.editItem} className="btn btn-block btn-primary"> Edit</a></div>
                      </div>
                      }
                      { this.state.canDelete &&
                      <div className="price-box mb-4">
                        <div className="flex-1"><a href="" onClick={this.deleteItem} className="btn btn-block btn-danger">{ (this.state.isNFT || this.state.isMomentNFT) ? "Return" : "Delete" }</a></div>
                      </div>
                      }
                      
                    </div>
                    <div>
                        
                    </div>
                  </div>
                  { !this.state.isNFTOwner && 
                  <div className="bg-dark_A-20 p-4">
                    <h6 className="mb-3">Seller Info</h6>
                    <hr className="border-secondary mt-2 mb-4"/>
                    {this.renderSellerInfo()}
                  </div>
                  }
                </div>
              </div>
            </div>
          </div>
          
          <section className="review-box content-section text-light">
            <div className="container">
              <div className="row">
                <div className="col-lg-8">
                  <div className="mb-8">
                    <h6 className="mb-4 fw-400 ls-1 text-uppercase">Reviews</h6>
                    <hr className="border-secondary mt-2 mb-6"/>
                    <div className="row">
                      {/*<!-- Item -->*/}
                      {this.state.listComments.map( (comment, index) => {
                        return <ReviewsComponent comment={comment}/>
                      })}
                      {/*cannot comment nfts? */}
                      { allowsReviews &&
                        <div className="container">
                        <h4 className="text-white">Add Review</h4>
                        <Form onSubmit={this.submitComment}>
                            <Form.Control as="textarea" rows={3} placeholder="Say something here..." id="comment" /> <br></br>
                            <StarRatings
                                rating={this.state.review_rating}
                                starRatedColor="yellow"
                                changeRating={this.changeRating}
                                numberOfStars={5}
                                starDimension="20px"
                                name='rating'
                            />
                            <br></br>
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
                      <hr className="border-secondary mt-0 mb-5"/>
                      
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          </main>
          <script src="assets/js/main.js" id="_mainJS" data-plugins="load"></script>

          {this.state.sellFromWallet && 
            <SimpleModal onApproval={this.approveSellItem} open={true}></SimpleModal>
          }
        </div>);
    }
}

export default withRouter(ItemPage);