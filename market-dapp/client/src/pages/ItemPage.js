import React, { Component } from 'react';
import { Button, Form, Card, ListGroup, Row, Col } from 'react-bootstrap';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import StarRatings from 'react-star-ratings';
import UIHelper from "../utils/uihelper";
import ReviewsComponent from "../components/ReviewsComponent";
import SimilarItemsComponent from '../components/SimilarItemsComponent';
import "../css/itempage.css";

const openpgp = require('openpgp');

const priceConversion = 10 ** 18;

const passphrase = process.env.REACT_APP_PASSPHRASE;

class ItemPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            itemId: props.location.state.selectedItemId,
            track: props.location.state.selectedTrack,
            simulator: props.location.state.selectedSimulator,
            season: props.location.state.selectedSeason,
            series: props.location.state.selectedSeries,
            description: props.location.state.selectedDescription,
            price: props.location.state.selectedPrice,
            car: props.location.state.selectedCarBrand,
            vendorAddress: props.location.state.vendorAddress,
            vendorNickname: props.location.state.vendorNickname,
            ipfsPath: props.location.state.ipfsPath,
            videoPath: props.location.state.videoPath,
            imagePath: props.location.state.imagePath,
            isNFT: props.location.state.isNFT,
            isMomentNFT: props.location.state.isMomentNFT,
            contract: null,
            currentAccount: "",
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0,
            similarItems: props.location.state.similarItems,
            isMuted: true
        }

        this.mute = this.mute.bind(this);
        this.unmute = this.unmute.bind(this);
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimthunderOwner;
        const contractSimracerCoin = this.state.drizzle.contracts.SimracerCoin;

        const currentAccount = this.state.drizzleState.accounts[0];
        console.log('isNFT:' + this.state.isNFT);
        console.log('isMomentNFT:' + this.state.isMomentNFT);
        let isSkin = !this.state.isNFT && !this.state.isMomentNFT && (this.state.track == null || this.state.season == null);
        console.log('isSkin:' + isSkin);

        const hasVideo = this.state.isMomentNFT;

        if (!this.state.isNFT && !this.state.isMomentNFT) {
            const comments = await contract.methods.getItemComments(this.state.itemId).call();
            const average_review = await this.average_rating(comments);

            this.setState({ currentAccount: currentAccount, contract: contract, contractSimracerCoin: contractSimracerCoin, listComments: comments, average_review: average_review, isSkin: isSkin });
        } else {
            this.setState({ currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs, contractSimracerCoin: contractSimracerCoin, isSkin: isSkin });
        }

        this.setState({isMuted: hasVideo});
        
        this.scrollToTop();
    }

    scrollToTop = () => {
      // scroll to top
      document.body.scrollTop = 0;            // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
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

    buyItem = async (event) => {
        event.preventDefault();

        UIHelper.showSpinning();

        const price = this.state.drizzle.web3.utils.toBN(this.state.price);
        console.log('item price =' + price);

        // TODO: buyer public key
        //const buyerPK = this.state.drizzle.web3.utils.hexToBytes(this.state.drizzle.web3.utils.randomHex(16));
        //console.log('Item price:' + this.state.price);
        if (!this.state.isNFT) {

            let buyerKey = localStorage.getItem('ak');
            if (!buyerKey) {
                const { privateKeyArmored, publicKeyArmored, revocationCertificate } = await openpgp.generateKey({
                    userIds: [{ name: this.state.currentAccount }],             // you can pass multiple user IDs
                    curve: 'p256',                                              // ECC curve name
                    passphrase: passphrase                                      // protects the private key
                });

                buyerKey = this.state.drizzle.web3.utils.asciiToHex(publicKeyArmored);

                localStorage.setItem('ak', buyerKey);
                localStorage.setItem('bk', this.state.drizzle.web3.utils.asciiToHex(privateKeyArmored));
            }

            //approve contract ot spend our SRC
            let approval = await this.state.contractSimracerCoin.methods.approve(this.state.contract.address, price)
            .send({from: this.state.currentAccount })
            .catch(function (e) {
              UIHelper.transactionOnError(e);
             });
            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //approved
              await this.state.contract.methods.requestPurchase(price, this.state.itemId, buyerKey)
              .send({from: this.state.currentAccount })
              //.on('sent', UIHelper.transactionOnSent)
              .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                  UIHelper.transactionOnConfirmation("Thank you for your purchase request. Seller will contact you soon.", false);
              })
              .on('error', UIHelper.transactionOnError)
              .catch(function (e) {
                console.log(e);
               });
            }
            
            
            
        } else {

            let approval = await this.state.contractSimracerCoin.methods.approve(this.state.contractNFTs.address, price)
            .send({from: this.state.currentAccount })
            .catch(function (e) {
              UIHelper.transactionOnError(e);
             });
            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //do it!
              await this.state.contractNFTs.methods.buyItem(this.state.itemId,price)
              .send({from: this.state.currentAccount })
              //.on('sent', UIHelper.transactionOnSent)
              .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                  UIHelper.transactionOnConfirmation("Thank you for your purchase.", false);
              })
              .on('error', UIHelper.transactionOnError)
              .catch(function (e) {
                console.log(e);
               });
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
            const date = new Date(Date.now());
            await this.state.contract.methods.newComment(this.state.itemId, description, this.state.review_rating, date.toString(), this.state.vendorNickname).send({ from: this.state.currentAccount });
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
          return this.renderItemInformationForNFT(this.state.isMomentNFT);
      } 
      else if (this.state.track == null || this.state.season == null) {
          return this.renderItemInformationForSkin();
      } else {
          return this.renderItemInformationForCarSetup();
      }
    }

    /**
    getBuyItemLink = (value, isNFT, isSkin, isCar) => {
      let imagePath = ";"
      let price = 0;
      let series = null;
      let simulator = null;
      let address = null;
      let carNumber = null;
      let carBrand = null;
      let description = "";

      let itemId = value.id;

      if(isNFT) {
        imagePath = value.image;
        price = value.price * priceConversion;
        simulator = value.simulator;
        simulator = value.series;
        address = value.seriesOwner;
        carNumber = value.carNumber;
        description = value.description;
        return <div className="item">
              <a href="#" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true)}>
                <div className="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: {imagePath}}}>
                      <div className="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                        <div className="px-4 py-3 lh-1">
                              <h6 className="mb-1 small-1 text-light text-uppercase">{description}</h6>
                              <div className="price d-flex flex-wrap align-items-center">
                                <span className="discount_final text-warning small-2">{price / priceConversion} SRC</span>
                            </div>
                        </div>
                      </div>
                </div>
              </a>
              </div>
        

      }
      else if (isSkin) {
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
                                <span className="discount_final text-warning small-2">{price / priceConversion} SRC</span>
                            </div>
                        </div>
                      </div>
                </div>
              </a>
            </div>
        
   
      }
      else { //car
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
                                  <span className="discount_final text-warning small-2">{price / priceConversion} SRC</span>
                              </div>
                          </div>
                        </div>
                  </div>
              </a>
            </div>
        
      }
      //SKIN: onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, null, price, carBrand , address, ipfsPath, imagePath, false)}
                //CAR onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, "", false)}
                // NFT onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true)}
    }*/

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
                  <li>

                  <span className="platform">Price:</span> 
                  <span className="developer-item text-lt">{this.state.price / priceConversion} SRC</span>
                  </li>
                  </ul>
      } else {
        return <ul className="list-unstyled mb-3">
                
                  <li>
                  <span className="platform">Address:</span> 
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorAddress}</u></Link></span>
                  </li>
                  <li>

                  <span className="platform">Price:</span> 
                  <span className="developer-item text-lt">{this.state.price / priceConversion} SRC</span>
                  </li>
                  </ul>
      }
      
    }

    //Skin item information
    renderItemInformationForSkin = () => {
      return <div className="row">
              <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
                <div className="row mb-4 mb-sm-0">
                <div className="col-sm-4"><strong className="fw-500">Simulator:</strong></div>
                <div className="col-sm-8">{this.state.simulator}</div>
                </div>
                
                <div className="row mb-4 mb-sm-0">
                <div className="col-sm-4"><strong className="fw-500">Car Brand:</strong></div>
                <div className="col-sm-8">{this.state.car}</div>
                </div>
                
                <div className="row mb-4 mb-sm-0">
                <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
                <div className="col-sm-8">{this.state.price / priceConversion} SRC</div>
                </div>
              </div>
            </div>
      
      /*<ul className="list-unstyled mb-3">
            <li>
            <span className="platform">Simulator:</span> 
            <span className="developer-item text-lt">{this.state.simulator}</span>
            </li>
            <li>
            <span className="platform">Car brand:</span> 
            <span className="developer-item text-lt">{this.state.car}</span>
            </li>
            <li>
            <span className="platform">Price:</span> 
            <span className="developer-item text-lt">{this.state.price / priceConversion} SRC</span>
            </li>
            </ul>*/
    }
    //NFT
    renderItemInformationForNFT = (isMomentNFT) => {

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
                <div className="col-sm-4"><strong className="fw-500">{isMomentNFT ? 'Description' : 'Number'}</strong></div>
                <div className="col-sm-8">{this.state.description}</div>
                </div>
                <div className="row mb-4 mb-sm-0">
                <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
                <div className="col-sm-8">{this.state.price / priceConversion} SRC</div>
                </div>
              </div>
            </div>
            /*<ul className="list-unstyled mb-3">
            <li>
            <span className="platform">Simulator:</span> 
            <span className="developer-item text-lt">{this.state.simulator}</span>
            </li>
            <li>
            <span className="platform">Series:</span> 
            <span className="developer-item text-lt">{this.state.series}</span>
            </li>
            <li>
            <span className="platform">Number:</span> 
            <span className="developer-item text-lt">{this.state.description}</span>
            </li>
            <li>
            <span className="platform">Price:</span> 
            <span className="developer-item text-lt">{this.state.price / priceConversion} SRC</span>
            </li>
            </ul>*/
    }

    //Car setup
    renderItemInformationForCarSetup = () => {

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
                <div className="col-sm-8">{this.state.car}</div>
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
                <div className="col-sm-8">{this.state.price / priceConversion} SRC</div>
                </div>
              </div>
            </div>
      
        /*<ul className="list-unstyled mb-3">
            <li>
            <span className="platform">Simulator:</span> 
            <span className="developer-item text-lt">{this.state.simulator}</span>
            </li>
            <li>
            <span className="platform">Series:</span> 
            <span className="developer-item text-lt">{this.state.series}</span>
            </li>
            <li>
            <span className="platform">Car Brand:</span> 
            <span className="developer-item text-lt">{this.state.car}</span>
            </li>
            <li>
            <span className="platform">Season:</span> 
            <span className="developer-item text-lt">{this.state.season}</span>
            </li>
            <li>
            <span className="platform">Description:</span> 
            <span className="developer-item text-lt">{this.state.description}</span>
            </li>
            <li>
            <span className="platform">Price:</span> 
            <span className="developer-item text-lt">{this.state.price / priceConversion} SRC</span>
            </li>
            </ul>*/
    }

    callbackParent = async (context, isNFT, isSkin, payload, item) => {
      console.log("PARENT CALLED BACK WITH ARG item.id " + item.id + " : " + JSON.stringify(item));
      console.log("PAYLOAD IS: " + JSON.stringify(payload));
      context.setState({
        itemId: item.id,
        track: payload.track ? payload.track : null,
        simulator: payload.simulator,
        season: payload.season,
        series: payload.series,
        description: payload.description,
        price: payload.price,
        car: payload.carBrand,
        ipfsPath: payload.ipfsPath,
        imagePath: payload.imagePath,
        isNFT: isNFT,
        vendorAddress: payload.address,
        vendorNickname: payload.address ? await context.state.contract.methods.getNickname(payload.address).call() : "",
        
      });

      if (!isNFT) {
          const comments = await context.state.contract.methods.getItemComments(item.id).call();
          const average_review = context.average_rating(comments);

          context.setState({ listComments: comments, average_review: average_review, isSkin: isSkin });
      } 

      this.scrollToTop();

      /*
payload.imagePath = value.ad.ipfsPath;
          payload.price = value.ad.price;
          payload.series = value.info.series;
          payload.simulator = value.info.simulator;
          payload.address = value.ad.seller;
          payload.carBrand = value.info.carBrand;

          payload.track = value.info.track;
          payload.season = value.info.season;
          payload.description = (value.info.description || value.info.carBrand);
      */
      /*
drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            itemId: props.location.state.selectedItemId,
            track: props.location.state.selectedTrack,
            simulator: props.location.state.selectedSimulator,
            season: props.location.state.selectedSeason,
            series: props.location.state.selectedSeries,
            description: props.location.state.selectedDescription,
            price: props.location.state.selectedPrice,
            car: props.location.state.selectedCarBrand,
            vendorAddress: props.location.state.vendorAddress,
            vendorNickname: props.location.state.vendorNickname,
            ipfsPath: props.location.state.ipfsPath,
            imagePath: props.location.state.imagePath,
            isNFT: props.location.state.isNFT,
            contract: null,
            currentAccount: "",
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0,
            similarItems: props.location.state.similarItems
      */
    }

    renderVideoFrame = (hasVideo) => {

      if(!hasVideo) {
        return "";
      }
      if(this.state.isMuted) {
        return <div className="carousel-product">
                   <div className="slider text-secondary" data-slick="product-body">
                      <video className="videoContainer" loop muted autoPlay currenttime={0} src={this.state.videoPath} />  
                      <button onClick={this.unmute} className="video-sound-control--btn video-sound-control--btn-off" label="Unmmute" type="button"></button> 
                   </div>
               </div>
      } 
      return  <div className="carousel-product">
                <div className="slider text-secondary" data-slick="product-body">
                  <video className="videoContainer" loop autoPlay currenttime={0} src={this.state.videoPath} />  
                  <button onClick={this.mute} className="video-sound-control--btn video-sound-control--btn-on" label="Mute" type="button"></button> 
                </div>
            </div>
    } 

    render() {

        let item = ""
        //let toRender;
        //let commentsRender = [];

        let hasImage = true;
        let hasVideo = this.state.isMomentNFT && this.state.videoPath !== null;
        
        if (this.state.isNFT) {
          item = "Car Ownership NFT";
        }
        else if(this.state.isMomentNFT) {
          item = "Simracing Moment NFT";
        }
        else if (this.state.track == null || this.state.season == null) {
          item = "Skin";
        } else {
          item = "Car Setup";
          hasImage = false;
        }
        //compute ratings
        let reviewsRating = this.getReviewsRating();


        return (
        <div className="page-body">     
        <main className="main-content">
          <div className="overlay overflow-hidden pe-n"><img src="assets/img/bg/bg_shape.png" alt="Background shape"/></div>
          {/*<!-- Start Content Area -->*/}
          <div className="content-section text-light pt-8">
            <div className="container">
              <div className="row gutters-y">
                <div className="col-12">
                  <header>
                    {/*<nav aria-label="breadcrumb">
                      <ol className="breadcrumb-product breadcrumb-nowrap breadcrumb breadcrumb-angle bg-transparent pl-0 pr-0 mb-0">
                        <li className="breadcrumb-item"><a href="store-product.html#">All Games</a></li>
                        <li className="breadcrumb-item"><a href="store-product.html#">Action Games</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Explosive: Blast Definitive Edition</li>
                      </ol>
                    </nav>*/}
                    <h3 className="product_name mb-4">{item}</h3>
                    <div className="d-flex flex-wrap align-items-center">
                      <div className="review d-flex">
                        <div className="review_score">
                          <div className="review_score-btn">{this.state.average_review.toFixed(1)}</div>
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
                      {/*<ul className="tag-list d-none d-md-flex flex-wrap list-unstyled mb-0">
                        <li className="tag-item"><a href="" className="badge badge-warning fw-600">Twitch Streams</a></li>
                        <li className="tag-item"><a href="" className="badge badge-warning fw-600">Discussions</a></li>
                        <li className="tag-item"><a href="" className="text-unset release-date"><i className="far fa-clock text-warning mr-1"></i> OCT 18 2020</a></li>
                      </ul>*/}
                    </div>
                  </header>
                </div>
                <div className="col-lg-8">
                  <div className="row">
                    <div className="col-12">
                      <div className="product-body">

                        { this.renderVideoFrame(hasVideo)}
                        {/*<!--Carousel Wrapper-->*/}
                        {/** Later we might have more images, for now display just 1 if any */}
                        { hasImage && !hasVideo &&
                        <div className="carousel-product">
                          <div className="slider text-secondary" data-slick="product-body">
                            <img src={this.state.imagePath} alt={this.state.imagePath}/>
                            {/*<img src="assets/img/content/product/02.jpg" alt="Game"/>
                            <img src="assets/img/content/product/03.jpg" alt="Game"/>
                            <img src="assets/img/content/product/05.jpg" alt="Game"/>
                            <img src="assets/img/content/product/04.jpg" alt="Game"/>*/}
                          </div>
                          {/*<div className="slider product-slider-nav text-secondary">
                            <div className="slide-item px-1"><img src={this.state.imagePath} className="screenshot" alt="Game"/></div>
                            div className="slide-item px-1"><img src="assets/img/content/product/02.jpg" className="screenshot" alt="Game"/></div>
                            <div className="slide-item px-1"><img src="assets/img/content/product/03.jpg" className="screenshot" alt="Game"/></div>
                            <div className="slide-item px-1"><img src="assets/img/content/product/05.jpg" className="screenshot" alt="Game"/></div>
                            <div className="slide-item px-1"><img src="assets/img/content/product/04.jpg" className="screenshot" alt="Game"/></div>
                          </div>*/}
                        </div>
                        }
                       {/*<!--/.Carousel Wrapper-->*/}
    
                        <div className="alert alert-no-border alert-share d-flex mb-6" role="alert">
                          <span className="flex-1 fw-600 text-uppercase text-warning">Share:</span>
                          <div className="social-buttons text-unset">
                            <a className="social-twitter mx-2" href="store-product.html#"><i className="fab fa-twitter"></i></a>
                            <a className="social-dribbble mx-2" href="store-product.html#"><i className="fab fa-dribbble"></i></a>
                            <a className="social-instagram ml-2" href="store-product.html#"><i className="fab fa-instagram"></i></a>
                          </div>
                        </div>
                        {/*<div id="about" className="about mb-8">
                          <h6 className="mb-4 fw-400 ls-1 text-uppercase">About this {item}</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                            <div className="collapse readmore" id="collapseSummary">
                              TODO (what gos here? A description? but not all have description)
                              <p>{this.state.description}</p>
                            </div>
                            {/*<a className="readmore-btn collapsed" data-toggle="collapse" href="store-product.html#collapseSummary" aria-expanded="false" aria-controls="collapseSummary"></a>*/}
                          {/*</div>
                        </div>*/}
                        <div id="system_requirements" className="mb-8">
                          <h6 className="mb-4 fw-400 ls-1 text-uppercase">Item Information</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                            {/*<ul className="sreq_nav nav nav-tabs-minimal text-center mb-4" role="tablist">
                              <li className="nav-item">
                                <a className="py-2 px-7 nav-link active show" id="fillup-home-tab" data-toggle="tab" href="store-product.html#fillup-1" role="tab" aria-controls="fillup-home-tab" aria-selected="true"><i className="fab fa-windows"></i> PC</a>
                              </li>
                              <li className="nav-item">
                                <a className="py-2 px-7 nav-link" id="fillup-profile-tab" data-toggle="tab" href="store-product.html#fillup-2" role="tab" aria-controls="fillup-profile-tab" aria-selected="false"><i className="fas fa-apple-alt"></i> MAC</a>
                              </li>
                            </ul>*/}
                            <div className="tab-content" id="fillupTabContent">
                              <div className="tab-pane fade active show" id="fillup-1" role="tabpanel" aria-labelledby="fillup-home-tab">
                                {this.renderItemInformation()}
                                {/*<div className="row">
                                  <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">*/}
                                    {/*<div className="row">
                                      <div className="col-12">
                                        <span className="d-inline-block text-uppercase fw-500 mb-3 text-info">Seller:</span>
                                      </div>
                                    </div>*/}
                                    {/*<div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4">
                                        <strong className="fw-500">
                                        <Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} ({this.state.vendorAddress})</u></Link>
                                        </strong>
                                      </div>
                                      
                                    </div>*/}
                                    {/*<div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Seller:</strong></div>
                                      <div className="col-sm-8"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} {this.state.vendorAddress}</u></Link></div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Price:</strong></div>
                                      <div className="col-sm-8">{this.state.price / priceConversion} SRC</div>
                                    </div>*/}
                                    {/*
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Memory:</strong></div>
                                      <div className="col-sm-8">6 GB RAM</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Graphics:</strong></div>
                                      <div className="col-sm-8">NVIDIA GeForce GTX 660 or AMD R9 270 (2048 MB VRAM with Shader Model 5.0)</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Disk Space:</strong></div>
                                      <div className="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Architecture:</strong></div>
                                      <div className="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">API:</strong></div>
                                      <div className="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Miscellaneous:</strong></div>
                                      <div className="col-sm-8">Video Preset: Lowest (720p)</div>
                                    </div>*/}
                                  {/*</div>*/}
                                  {/*<div className="col-xs-12 col-lg-6">
                                    <div className="row">
                                      <div className="col-12">
                                        <span className="d-inline-block text-uppercase fw-500 mb-3 text-warning">Recommended Requirements:</span>
                                      </div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">OS:</strong></div>
                                      <div className="col-sm-8">Windows 7,Windows 8.1,Windows 10</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Processor:</strong></div>
                                      <div className="col-sm-8">Intel Core i7- 3770 @ 3.5 GHz or AMD FX-8350 @ 4.0 GHz</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Memory:</strong></div>
                                      <div className="col-sm-8">8 GB RAM</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Graphics:</strong></div>
                                      <div className="col-sm-8">NVIDIA GeForce GTX 760 or AMD R9 280X (3GB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Disk Space:</strong></div>
                                      <div className="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Architecture:</strong></div>
                                      <div className="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">API:</strong></div>
                                      <div className="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Miscellaneous:</strong></div>
                                      <div className="col-sm-8">Video Preset: High (1080p)</div>
                                    </div>
                                  </div>*/}
                                {/*</div>*/}
                              </div>
                              <div className="tab-pane fade" id="fillup-2" role="tabpanel" aria-labelledby="fillup-profile-tab">
                                <div className="row">
                                  <div className="col-xs-12 col-lg-6 mb-6 mb-lg-0">
                                    <div className="row">
                                      <div className="col-12">
                                        <span className="d-inline-block text-uppercase fw-500 mb-3 text-info">Minimum Requirements:</span>
                                      </div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">OS:</strong></div>
                                      <div className="col-sm-8">OSX 10.5</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Processor:</strong></div>
                                      <div className="col-sm-8">Intel Core i5-2400s @ 2.5 GHz or AMD FX-6350 @ 3.9 GHz</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Memory:</strong></div>
                                      <div className="col-sm-8">6 GB RAM</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Graphics:</strong></div>
                                      <div className="col-sm-8">NVIDIA GeForce GTX 660 or AMD R9 270 (2048 MB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Disk Space:</strong></div>
                                      <div className="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Architecture:</strong></div>
                                      <div className="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">API:</strong></div>
                                      <div className="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Miscellaneous:</strong></div>
                                      <div className="col-sm-8">Video Preset: Lowest (720p)</div>
                                    </div>
                                    
                                  </div>
                                  {/*<div className="col-xs-12 col-lg-6">
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-12">
                                        <span className="d-inline-block text-uppercase fw-500 mb-3 text-warning">Recommended Requirements:</span>
                                      </div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">OS:</strong></div>
                                      <div className="col-sm-8">OSX 10.5</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Processor:</strong></div>
                                      <div className="col-sm-8">Intel Core i7- 3770 @ 3.5 GHz or AMD FX-8350 @ 4.0 GHz</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Memory:</strong></div>
                                      <div className="col-sm-8">8 GB RAM</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Graphics:</strong></div>
                                      <div className="col-sm-8">NVIDIA GeForce GTX 760 or AMD R9 280X (3GB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Disk Space:</strong></div>
                                      <div className="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Architecture:</strong></div>
                                      <div className="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">API:</strong></div>
                                      <div className="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div className="row mb-4 mb-sm-0">
                                      <div className="col-sm-4"><strong className="fw-500">Miscellaneous:</strong></div>
                                      <div className="col-sm-8">Video Preset: High (1080p)</div>
                                    </div>
                                    
                                  </div>*/}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <h6 className="mb-0 fw-400 ls-1 text-uppercase">More like this</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                              {/*<div className="owl-carousel carousel_sm" data-carousel-items="1, 2, 3, 3" data-carousel-margin="10" data-carousel-nav="false" data-carousel-dots="true">
                                  <div className="item">
                                      <a href="store-product.html#">
                                        <div className="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={ {backgroundImage: `url('assets/img/content/cont/cg-c_02.jpg')`}} >
                                          <div className="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div className="px-4 py-3 lh-1">
                                              <h6 className="mb-1 small-1 text-light text-uppercase">Akamen</h6>
                                              <div className="price d-flex flex-wrap align-items-center">
                                                <span className="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </a>
                                    </div>
                                  
                                  {this.state.similarItems.map( (value, index) => { */}
                                     <SimilarItemsComponent contextParent={this} callbackParent={this.callbackParent} className="similaritems"  items={this.state.similarItems} isNFT={this.state.isNFT} isMomentNFT={this.state.isMomentNFT} isSkin={!this.state.isNFT && !this.state.isMomentNFT && (this.state.track == null || this.state.season == null)} selectedItemId={this.state.itemId}></SimilarItemsComponent>
                                 {/* })}
                                  </div>*/}
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
                    {hasImage &&
                        <img className="item-page-img mb-3" src={this.state.imagePath} alt="Product"/>
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
                            <div className="price-current">{this.state.price / priceConversion} SRC</div>
                          </div>
                        {/*<div className="discount">
                            Save: $20.00 (33%)
                        </div>*/}
                      </div>
                      <div className="price-box mb-4">
                          {/*<div className="mr-4">
                            <div className="quantity-group input-group">
                                <input type="text" className="form-control form-control-sm h-auto" value="1"/>
                            </div>
                          </div>*/}
                        <div className="flex-1"><a href="" onClick={this.buyItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Buy Item</a></div>
                      </div>
                    </div>
                    <div>
                        {/*<div className="row mb-4">
                            <form className="col mb-3 mb-md-0">
                                <div className="custom-control custom-checkbox">
                                  <input className="custom-control-input" type="checkbox" value="" id="comp_check"/>
                                  <label className="custom-control-label fw-600 text-uppercase small-5" htmlFor="comp_check">
                                    Add To Compare
                                  </label>
                                </div>
                            </form>
                            <form className="col-sm-auto">
                                <div className="custom-control custom-checkbox">
                                  <input className="custom-control-input" type="checkbox" value="" id="gift_check"/>
                                  <label className="custom-control-label fw-600 text-uppercase small-5" htmlFor="gift_check">
                                    Buy as gift
                                  </label>
                                </div>
                            </form>
                        </div>*/}
                        {/*<a href="" className="btn btn-block btn-secondary"><i className="fas fa-heart"></i> Add to wishlist</a>*/}
                    </div>
                  </div>
                  <div className="bg-dark_A-20 p-4">
                    <h6 className="mb-3">Seller Info</h6>
                    <hr className="border-secondary mt-2 mb-4"/>
                    {this.renderSellerInfo()}
                    {/*{this.renderItemInformation()}*/}
                    {/*<ul className="list-unstyled mb-3">
                      <li>
                        <span className="platform">Simulator:</span> 
                        <span className="developer-item text-lt">{this.state.simulator}</span>
                      </li>
                        <span className="platform-item btn btn-sm btn-outline-warning"><i className="fab fa-windows"></i> PC</span>
                    Seller:</b> 
                      <li>
                        <span className="platform">Simulator:</span> 
                        <span className="developer-item text-lt">{this.state.simulator}</span>
                        {<span className="platform-item btn btn-sm btn-outline-warning"><i className="fab fa-windows"></i> PC</span>
                        <span className="platform-item btn btn-sm btn-outline-warning"><i className="fas fa-apple-alt"></i> mac</span>
                      
                      <li>
                        <span className="platform">Series:</span> 
                        <span className="developer-item text-lt">{this.state.series}</span>
                      </li>
                      <li>
                        <span className="platform">Car Brand:</span> 
                        <span className="developer-item text-lt">{this.state.car}</span>
                      </li>
                    </ul>*/}
                    {/*<ul className="list-unstyled mb-3">
                      <li className="developer-wrapper d-flex">
                        <span className="developer">Series:</span>
                        <span className="developer-item text-lt">{this.state.series}</span>
                      </li>
                    </ul>*/}
                    {/*<ul className="list-unstyled small-2 mb-3">
                      <li className="developer-wrapper">
                        <a href="" className="developer">Genres:</a>
                        <a href="">Indie</a>,
                        <a href="">Simulation</a>,
                        <a href="">Strategy</a>
                      </li>
                    </ul>*/}
                    {/*<ul className="list-unstyled small-2 mb-3">
                      <li className="developer-wrapper">
                        <a href="" className="developer">Languages:</a>
                        <hr className="my-2 border-secondary"/>
                        <div>
                          <div className="d-flex align-items-center">
                            <span className="flex-1">English</span>
                            <span className="text-warning ti-check"></span>
                          </div>
                          <hr className="my-2 border-secondary"/>
                          <div className="d-flex align-items-center">
                            <span className="flex-1">German</span>
                            <span className="text-warning ti-check"></span>
                          </div>
                          <hr className="my-2 border-secondary"/>
                          <div className="d-flex align-items-center">
                            <span className="flex-1">French</span>
                            <span className="text-warning ti-check"></span>
                          </div>
                          <hr className="my-2 border-secondary"/>
                          <div className="d-flex align-items-center">
                            <span className="flex-1">Polish</span>
                            <span className="text-warning ti-check"></span>
                          </div>
                          <hr className="my-2 border-secondary"/>
                          <div className="d-flex align-items-center">
                            <span className="flex-1">Russian</span>
                            <span className="text-warning ti-check"></span>
                          </div>
                        </div>
                      </li>
                    </ul>*/}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/*<section className="container text-light">
            <div className="border border-secondary py-5 px-2">
              <div className="mx-3 mb-6">
                <h6 className="mb-4 fw-400 ls-1 text-uppercase">Featured & Recommended</h6>
                <hr className="border-secondary my-2"/>
                <span>TODO what goes here?</span>
              </div>
              <div className="owl-carousel" data-carousel-items="1, 2, 3, 6">
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-01.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">Creature 2020</a>
                  <span className="time d-block small-4">26 Sep, 2020</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 23</span>
                </div>
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-02.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">Shadow Leap</a>
                  <span className="time d-block small-4">14 Sep, 2020</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 57</span>
                </div>
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-04.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">Golden Mask</a>
                  <span className="time d-block small-4">18 Oct, 2020</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 57</span>
                </div>
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-03.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">Mechaone</a>
                  <span className="time d-block small-4">05 Oct, 2020</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 57</span>
                </div>
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-05.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">ONE</a>
                  <span className="time d-block small-4">16 Oct, 2020</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 57</span>
                </div>
                <div className="item mx-3">
                  <img src="assets/img/content/store/h-06.jpg" alt="Game" className="mb-3"/>
                  <a href="store-product.html#" className="text-uppercase fw-500 small-2 mb-0">Engineer</a>
                  <span className="time d-block small-4">27 Oct, 2019</span>
                  <span className="d-block small text-warning"><i className="far fa-eye"></i> 57</span>
                </div>
              </div>
            </div>
          </section>*/}
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
                      {!this.state.isNFT &&
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
                      
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div className="col-12 mb-7">
                        <div className="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/2.jpg" className="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div className="review-item ml-sm-4">
                            <div className="small d-flex align-items-start">
                              <!-- user -->
                              <span className="name text-lt badge badge-info fw-600 small-4">metus</span>
                              <!-- /.user -->
                              <!-- time -->
                              <div className="time ml-2">05/08/2020</div>
                              *<!-- /.time -->
                              <!-- star -->
                              <div className="ml-2 text-warning">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star-half-alt"></i>
                              </div>
                              <!-- /.star -->
                              <!-- info -->
                              <div className="ml-auto">
                                <div className="d-flex small-1">
                                  <div className="mr-2"><a href="" className="text-info"><i className="fas fa-thumbs-up"></i></a></div>
                                  <div className="mr-2"><a href="" className="text-info"><i className="fas fa-thumbs-down"></i></a></div>
                                  <div className="dropdown">
                                      <a className="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_02" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i className="fas fa-share-alt"></i></a>
                                      <div className="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_02">
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-twitter"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-dribbble"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-instagram"></i></a>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              <!-- /.info -->
                            </div>
                            <div>
                              <span className="d-block lead-2 mb-2">Class aptent taciti sociosqu ad litora torquent per conubia nostra</span>
                              <div className="collapse readmore r-fade">
                                <p className="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam, vel mollis diam tempus ac. Duis euismod diam et ante egestas, sed porttitor orci euismod. In quis ligula fermentum, elementum quam quis, pellentesque lorem. Vivamus eget ligula ante. Aliquam porttitor nisl sit amet malesuada finibus. Etiam sit amet porttitor purus. Etiam at aliquam massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse cursus sollicitudin malesuada.</p>
                              </div>
                              <a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                      </div>*/}
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div className="col-12 mb-7">
                        <div className="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/3.jpg" className="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div className="review-item ml-sm-4">
                            <div className="small d-flex align-items-start">
                              <!-- user -->
                              <span className="name text-lt badge badge-info fw-600 small-4">metus</span>
                              <!-- /.user -->
                              <!-- time -->
                              <div className="time ml-2">03/08/2020</div>
                              <!-- /.time -->
                              <!-- star -->
                              <div className="ml-2 text-warning">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star-half-alt"></i>
                              </div>
                              <!-- /.star -->
                              <!-- info -->
                              <div className="ml-auto">
                                <div className="d-flex small-1">
                                  <div className="mr-2"><a href="" className="text-info"><i className="fas fa-thumbs-up"></i></a></div>
                                  <div className="mr-2"><a href="" className="text-info"><i className="fas fa-thumbs-down"></i></a></div>
                                  <div className="dropdown">
                                      <a className="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_03" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i className="fas fa-share-alt"></i></a>
                                      <div className="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_03">
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-twitter"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-dribbble"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-instagram"></i></a>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              <!-- /.info -->
                            </div>
                            <div>
                              <span className="d-block lead-2 mb-2">Class aptent taciti sociosqu ad litora torquent per conubia nostra</span>
                              <div className="collapse readmore r-fade">
                                <p className="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam, vel mollis diam tempus ac. Duis euismod diam et ante egestas, sed porttitor orci euismod. In quis ligula fermentum, elementum quam quis, pellentesque lorem. Vivamus eget ligula ante. Aliquam porttitor nisl sit amet malesuada finibus. Etiam sit amet porttitor purus. Etiam at aliquam massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse cursus sollicitudin malesuada.</p>
                              </div>
                              <a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                      </div>*/}
                      {/*<!-- /.Item -->*/}
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div>
                    <h6 className="mb-4 fw-400 ls-1 text-uppercase">Best reviews</h6>
                    <div className="border border-secondary rounded p-4">
                      {/*<!-- Item -->*/}
                       {this.getBestReviews()}
                      <hr className="border-secondary mt-0 mb-5"/>
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div className="review-item mb-5">
                        <div className="small d-flex">
                          <div className="flex-1">
                            <span className="name badge badge-warning fw-600 small-4">metus</span>
                            <span className="time ml-2">05/08/2020</span>
                          </div>
                          <a href="" className="text-info"><i className="fas fa-thumbs-up"></i> 135</a>
                        </div>
                        <div>
                          <span className="lead-2">Sociosqu ad litora torquent</span>
                          <div className="collapse readmore r-fade">
                            <p className="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam.</p>
                          </div>
                          <a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                        </div>
                      </div>
                      <hr className="border-secondary mt-0 mb-5"/>
                      */}
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div className="review-item mb-0">
                        <div className="small d-flex">
                          <div className="flex-1">
                            <span className="name badge badge-warning fw-600 small-4">metus</span>
                            <span className="time ml-2">05/08/2020</span>
                          </div>
                          <a href="" className="text-info"><i className="fas fa-thumbs-up"></i> 135</a>
                        </div>
                        <div>
                          <span className="lead-2">Sociosqu ad litora torquent</span>
                          <div className="collapse readmore r-fade">
                            <p className="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam.</p>
                          </div>
                          <a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                        </div>
                      </div>*/}
                      {/*<!-- /.Item -->*/}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          </main>
          <script src="assets/js/main.js" id="_mainJS" data-plugins="load"></script>
        </div>
        
        );
    }
}

export default withRouter(ItemPage);