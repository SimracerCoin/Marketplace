import React, { Component } from 'react';
import { Button, Form, Dropdown, DropdownButton } from 'react-bootstrap';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import StarRatings from 'react-star-ratings';
import UIHelper from "../utils/uihelper";
import ReviewsComponent from "../components/ReviewsComponent";
import SimilarItemsComponent from '../components/SimilarItemsComponent';
import AlertComponent from '../components/AlertComponent';
import "../css/auction.css";

const openpgp = require('openpgp');

const priceConversion = 10 ** 18;

const passphrase = process.env.REACT_APP_PASSPHRASE;

const timingOpt = ["24h", "1 week", "1 month", "3 months", "6 months", "1 year", "All time"];
const timingOptions = [];

class AuctionPage extends Component {

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
            number_offers: 0,
            similarItems: props.location.state.similarItems,
            isMuted: true,
            currentTimingOption: timingOpt[0],
            messageOptions: {show: false, title:'', variant:'sucess',message:''},
            usdValue : props.location.state.usdPrice
        }

        this.mute = this.mute.bind(this);
        this.unmute = this.unmute.bind(this);
        this.onSelectAuctionTiming = this.onSelectAuctionTiming.bind(this);
    }

    componentDidMount = async (event) => {

      for (const [index, value] of timingOpt.entries()) {
        timingOptions.push(<Dropdown.Item eventKey={value} key={index}>{value}</Dropdown.Item>)
      }
       
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
        const contractSimracerCoin = await this.state.drizzle.contracts.SimracerCoin;
        const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;

        const currentAccount = await this.state.drizzleState.accounts[0];
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
            this.setState({currentTimingOption: timingOpt[0], timingOptions: timingOptions, currentAccount: currentAccount, contract: contract, contractMomentNFTs: contractMomentNFTs, contractNFTs: contractNFTs, contractSimracerCoin: contractSimracerCoin, isSkin: isSkin });
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

    onSelectAuctionTiming = async(value) => {
      console.log("Choosing timing: " + value);
      this.setState({ currentTimingOption: value });
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

        if (!this.state.isNFT && !this.state.isMomentNFT) {

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
              await this.state.contract.methods.requestPurchase(price, this.state.itemId, buyerKey, true)
              .send(paramsForCall)
              //.on('sent', UIHelper.transactionOnSent)
              .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                if(confNumber > 9) {
                  UIHelper.transactionOnConfirmation("Thank you for your purchase request. Seller will contact you soon.", "/");
                }
                  
              })
              .on('error', UIHelper.transactionOnError)
              .catch(function (e) {
                console.log(e);
               });
            }
            
            
            
        } else {

            let paramsForCall = await UIHelper.calculateGasUsingStation(this.state.currentAccount);
            let approval = await this.state.contractSimracerCoin.methods.approve(this.state.contractNFTs.address, price)
            .send(paramsForCall)
            .catch(function (e) {
              UIHelper.transactionOnError(e);
             });
            if(!approval) {
              UIHelper.transactionOnError("ERROR ON APPROVAL");
            } else {
              //do it!

              //SimthunderOwner NFT
              if(this.state.isNFT) {
              
                await this.state.contractNFTs.methods.buyItem(this.state.itemId,price)
                .send(paramsForCall)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                  if(confNumber > 9) {
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
                   if(confNumber > 9) {
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

    renderUSDPrice = (price) => {

      let usdPrice = Number(Math.round((price / priceConversion) * this.state.usdValue * 100) / 100).toFixed(2);


      return "$" + usdPrice;
    }

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
                  <span className="developer-item developer-item-smaller text-lt"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorAddress}</u></Link></span>
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
                <div className="col-sm-8"><strong>{this.state.price / priceConversion} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}<sup className="secondary-sup">USD</sup></span></div>
                </div>
              </div>
            </div>
 
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
                <div className="col-sm-8"><strong>{this.state.price / priceConversion} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}<sup className="secondary-sup">USD</sup></span></div>
                </div>
              </div>
            </div>
    
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
                <div className="col-sm-8"><strong>{this.state.price / priceConversion} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price">{this.renderUSDPrice(this.state.price)}<sup className="secondary-sup">USD</sup></span></div>
                </div>
              </div>
            </div>
      
    }

    //called from the similar items component
    callbackParent = async (context, isNFT, isMomentNFT, isSkin, payload, item) => {
    
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
        isMomentNFT: isMomentNFT,
        isSkin: isSkin,
        vendorAddress: payload.address,
        vendorNickname: payload.address ? await context.state.contract.methods.getNickname(payload.address).call() : "",
        
      });

      if (!isNFT && !this.state.isMomentNFT) {
          const comments = await context.state.contract.methods.getItemComments(item.id).call();
          const average_review = context.average_rating(comments);

          context.setState({ listComments: comments, average_review: average_review, isSkin: isSkin });
      } 

      this.scrollToTop();

    }

    renderVideoFrame = (hasVideo) => {

      if(!hasVideo) {
        return "";
      }
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
        //this reviewsRating = this.getReviewsRating();
        let numOffers = Number(this.state.number_offers);

      const allowsReviews = !this.state.isNFT && !this.state.isMomentNFT;

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
                          <div className="review_score-btn">{numOffers}</div>
                        </div>

                        <div className="star_rating-se text-warning mr-7">

                          {numOffers == 0 && 
                           <span>No Offers yet</span>
                          }

                          {numOffers > 0 &&
                            <span>Offers so far</span>
                          }
                        </div>
                      </div>
                      
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
                            <img className="imageContainer" src={this.state.imagePath} alt={this.state.imagePath}/>
                            
                          </div>
                          
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
                        
                        <div id="system_requirements" className="mb-8">
                          <h6 className="mb-4 fw-400 ls-1 text-uppercase">Item Information</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                            
                            <div className="tab-content" id="fillupTabContent">
                              <div className="tab-pane fade active show" id="fillup-1" role="tabpanel" aria-labelledby="fillup-home-tab">
                                {this.renderItemInformation()}
                                
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
                                  
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/*<!--<div className="mb-6">
                          <h6 className="mb-0 fw-400 ls-1 text-uppercase">More like this</h6>
                          <hr className="border-secondary my-2"/>
                          <div>
                              <SimilarItemsComponent contextParent={this} usdValue={this.state.usdValue} callbackParent={this.callbackParent} className="similaritems"  items={this.state.similarItems} isNFT={this.state.isNFT} isMomentNFT={this.state.isMomentNFT} isSkin={!this.state.isNFT && !this.state.isMomentNFT && (this.state.track == null || this.state.season == null)} selectedItemId={this.state.itemId}></SimilarItemsComponent>   
                          </div>
                        </div>
                        <div className="mb-0">
                          <div>
                            <div>
                              <p className="small"></p>
                            </div>
                          </div>
                        </div>-->*/}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="bg-dark_A-20 p-4 mb-4">
                    <div className="high_offer_title">
                    <h6 className="mb-3">Highest offer</h6>
                    </div>
                    {/*
                    {hasImage &&
                        <img className="item-page-img mb-3" src={this.state.imagePath} alt="Product"/>
                    }
                    <p>
                      {this.state.description && 
                      <span>{this.state.description}</span>
                      }
                    </p>
                    */}
                    <div className="price-wrapper">
                      <div className="mb-3">
                        <div className="price">
                            {/*<div className="price-prev">300$</div>*/}
                            <div className="price-current"><strong className="price_div_strong">{this.state.price / priceConversion} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price"><span className="secondary-price">{this.renderUSDPrice(this.state.price)}<sup className="secondary-sup">USD</sup></span></span></div>
                          </div>
                        {/*<div className="discount">
                            Save: $20.00 (33%)
                        </div>*/}
                      </div>
                      <div className="price-box mb-4">
                         
                        <div className="flex-1"><a href="" onClick={this.buyItem} className="btn btn-block btn-warning"><i className="fas fa-shopping-cart"></i> Make offer</a></div>
                      </div>
                    </div>
                    <div>
                        
                    </div>
                  </div>
                  <div className="bg-dark_A-20 p-4">
                    <div className="high_offer_title">
                      <h6 className="mb-3">Owned by</h6>
                    </div>
                    <hr className="border-secondary mt-2 mb-4"/>
                    {this.renderSellerInfo()}
                    
                  </div>
                  <p></p>

                  <div className="bg-dark_A-20 p-4">
                    <div className="high_offer_title">
                      <h6 className="mb-3">Price history</h6>
                    </div>
                    <hr className="border-secondary mt-2 mb-4"/>
                    <div className="averagePrice"> 
                      <DropdownButton id="dropdown-choose-timing" title={this.state.currentTimingOption} onSelect={this.onSelectAuctionTiming}>
                        {this.state.timingOptions}
                      </DropdownButton> 
                        <div className="inner_average_price">
                          Average price ({this.state.currentTimingOption}): <div className="price-current"><strong>{this.state.price / priceConversion} <sup className="main-sup">SRC</sup></strong><br/><span className="secondary-price"><span className="secondary-price">{this.renderUSDPrice(this.state.price)}<sup className="secondary-sup">USD</sup></span></span></div></div>
                        </div>
                    </div>

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
        </div>
        
        );
    }
}

export default withRouter(AuctionPage);