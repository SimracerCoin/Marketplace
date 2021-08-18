import React, { Component } from 'react';
import { Button, Form, Card, ListGroup, Row, Col } from 'react-bootstrap';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import StarRatings from 'react-star-ratings';
import UIHelper from "../utils/uihelper";
import ReviewsComponent from "../components/ReviewsComponent";
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
            imagePath: props.location.state.imagePath,
            isNFT: props.location.state.isNFT,
            contract: null,
            currentAccount: "",
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0
        }
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = this.state.drizzle.contracts.SimthunderOwner;
        const currentAccount = this.state.drizzleState.accounts[0];
        console.log('istNFT:' + this.state.isNFT);
        if (!this.state.isNFT) {
            const comments = await contract.methods.getItemComments(this.state.itemId).call();
            const average_review = await this.average_rating(comments);

            this.setState({ currentAccount: currentAccount, contract: contract, listComments: comments, average_review: average_review });
        } else {
            this.setState({ currentAccount: currentAccount, contract: contract, contractNFTs: contractNFTs });
        }

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

            console.log('price =' + this.state.price);
            await this.state.contract.methods.requestPurchase(this.state.itemId, buyerKey)
                .send({ value: this.state.price, from: this.state.currentAccount })
                //.on('sent', UIHelper.transactionOnSent)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    UIHelper.transactionOnConfirmation("Thank you for your purchase request. Seller will contact you soon.", false);
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) { });
        } else {
            let tx = await this.state.contractNFTs.methods.buyItem(this.state.itemId)
                .send({ value: this.state.price, from: this.state.currentAccount })
                //.on('sent', UIHelper.transactionOnSent)
                .on('confirmation', function (confNumber, receipt, latestBlockHash) {
                    UIHelper.transactionOnConfirmation("Thank you for your purchase.", false);
                })
                .on('error', UIHelper.transactionOnError)
                .catch(function (e) { });
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
        retValue.html.push('<i class="fas fa-star"></i>');
      }
      return retValue;
    }

    render() {

        let item = ""
        let toRender;
        let commentsRender = [];

        let hasImage = true;
        if (this.state.isNFT) {
          item = "Car Ownership NFT";
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
        <main class="main-content">
          <div class="overlay overflow-hidden pe-n"><img src="assets/img/bg/bg_shape.png" alt="Background shape"/></div>
          {/*<!-- Start Content Area -->*/}
          <div class="content-section text-light pt-8">
            <div class="container">
              <div class="row gutters-y">
                <div class="col-12">
                  <header>
                    {/*<nav aria-label="breadcrumb">
                      <ol class="breadcrumb-product breadcrumb-nowrap breadcrumb breadcrumb-angle bg-transparent pl-0 pr-0 mb-0">
                        <li class="breadcrumb-item"><a href="store-product.html#">All Games</a></li>
                        <li class="breadcrumb-item"><a href="store-product.html#">Action Games</a></li>
                        <li class="breadcrumb-item active" aria-current="page">Explosive: Blast Definitive Edition</li>
                      </ol>
                    </nav>*/}
                    <h3 class="product_name mb-4">{item}</h3>
                    <div class="d-flex flex-wrap align-items-center">
                      <div class="review d-flex">
                        <div class="review_score">
                          <div class="review_score-btn">{reviewsRating.rating}</div>
                        </div>

                        <div class="star_rating-se text-warning mr-7">

                          {reviewsRating.rating == 0 && 
                           <span>No ratings yet</span>
                          }

                          {reviewsRating.html.map( (value, idx) => {
                            return <i class="fas fa-star"></i>
                          })}
                        </div>
                      </div>
                      {/*<ul class="tag-list d-none d-md-flex flex-wrap list-unstyled mb-0">
                        <li class="tag-item"><a href="" class="badge badge-warning fw-600">Twitch Streams</a></li>
                        <li class="tag-item"><a href="" class="badge badge-warning fw-600">Discussions</a></li>
                        <li class="tag-item"><a href="" class="text-unset release-date"><i class="far fa-clock text-warning mr-1"></i> OCT 18 2020</a></li>
                      </ul>*/}
                    </div>
                  </header>
                </div>
                <div class="col-lg-8">
                  <div class="row">
                    <div class="col-12">
                      <div class="product-body">
                        {/*<!--Carousel Wrapper-->*/}
                        {/** Later we might have more images, for now display just 1 if any */}
                        { hasImage &&
                        <div class="carousel-product">
                          <div class="slider text-secondary" data-slick="product-body">
                            <img src={this.state.imagePath} alt="Game"/>
                            {/*<img src="assets/img/content/product/02.jpg" alt="Game"/>
                            <img src="assets/img/content/product/03.jpg" alt="Game"/>
                            <img src="assets/img/content/product/05.jpg" alt="Game"/>
                            <img src="assets/img/content/product/04.jpg" alt="Game"/>*/}
                          </div>
                          {/*<div class="slider product-slider-nav text-secondary">
                            <div class="slide-item px-1"><img src={this.state.imagePath} class="screenshot" alt="Game"/></div>
                            div class="slide-item px-1"><img src="assets/img/content/product/02.jpg" class="screenshot" alt="Game"/></div>
                            <div class="slide-item px-1"><img src="assets/img/content/product/03.jpg" class="screenshot" alt="Game"/></div>
                            <div class="slide-item px-1"><img src="assets/img/content/product/05.jpg" class="screenshot" alt="Game"/></div>
                            <div class="slide-item px-1"><img src="assets/img/content/product/04.jpg" class="screenshot" alt="Game"/></div>
                          </div>*/}
                        </div>
                        }
                       {/*<!--/.Carousel Wrapper-->*/}
    
                        <div class="alert alert-no-border alert-share d-flex mb-6" role="alert">
                          <span class="flex-1 fw-600 text-uppercase text-warning">Share:</span>
                          <div class="social-buttons text-unset">
                            <a class="social-twitter mx-2" href="store-product.html#"><i class="fab fa-twitter"></i></a>
                            <a class="social-dribbble mx-2" href="store-product.html#"><i class="fab fa-dribbble"></i></a>
                            <a class="social-instagram ml-2" href="store-product.html#"><i class="fab fa-instagram"></i></a>
                          </div>
                        </div>
                        <div id="about" class="about mb-8">
                          <h6 class="mb-4 fw-400 ls-1 text-uppercase">About this {item}</h6>
                          <hr class="border-secondary my-2"/>
                          <div>
                            <div class="collapse readmore" id="collapseSummary">
                              <p>{this.state.description}</p>
                            </div>
                            {/*<a class="readmore-btn collapsed" data-toggle="collapse" href="store-product.html#collapseSummary" aria-expanded="false" aria-controls="collapseSummary"></a>*/}
                          </div>
                        </div>
                        <div id="system_requirements" class="mb-8">
                          <h6 class="mb-4 fw-400 ls-1 text-uppercase">Seller Info</h6>
                          <hr class="border-secondary my-2"/>
                          <div>
                            {/*<ul class="sreq_nav nav nav-tabs-minimal text-center mb-4" role="tablist">
                              <li class="nav-item">
                                <a class="py-2 px-7 nav-link active show" id="fillup-home-tab" data-toggle="tab" href="store-product.html#fillup-1" role="tab" aria-controls="fillup-home-tab" aria-selected="true"><i class="fab fa-windows"></i> PC</a>
                              </li>
                              <li class="nav-item">
                                <a class="py-2 px-7 nav-link" id="fillup-profile-tab" data-toggle="tab" href="store-product.html#fillup-2" role="tab" aria-controls="fillup-profile-tab" aria-selected="false"><i class="fas fa-apple-alt"></i> MAC</a>
                              </li>
                            </ul>*/}
                            <div class="tab-content" id="fillupTabContent">
                              <div class="tab-pane fade active show" id="fillup-1" role="tabpanel" aria-labelledby="fillup-home-tab">
                                <div class="row">
                                  <div class="col-xs-12 col-lg-6 mb-6 mb-lg-0">
                                    {/*<div class="row">
                                      <div class="col-12">
                                        <span class="d-inline-block text-uppercase fw-500 mb-3 text-info">Seller:</span>
                                      </div>
                                    </div>*/}
                                    {/*<div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4">
                                        <strong class="fw-500">
                                        <Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} ({this.state.vendorAddress})</u></Link>
                                        </strong>
                                      </div>
                                      
                                    </div>*/}
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Seller:</strong></div>
                                      <div class="col-sm-8"><Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} {this.state.vendorAddress}</u></Link></div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Price:</strong></div>
                                      <div class="col-sm-8">{this.state.price / priceConversion} ETH</div>
                                    </div>
                                    {/*
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Memory:</strong></div>
                                      <div class="col-sm-8">6 GB RAM</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Graphics:</strong></div>
                                      <div class="col-sm-8">NVIDIA GeForce GTX 660 or AMD R9 270 (2048 MB VRAM with Shader Model 5.0)</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Disk Space:</strong></div>
                                      <div class="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Architecture:</strong></div>
                                      <div class="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">API:</strong></div>
                                      <div class="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Miscellaneous:</strong></div>
                                      <div class="col-sm-8">Video Preset: Lowest (720p)</div>
                                    </div>*/}
                                  </div>
                                  {/*<div class="col-xs-12 col-lg-6">
                                    <div class="row">
                                      <div class="col-12">
                                        <span class="d-inline-block text-uppercase fw-500 mb-3 text-warning">Recommended Requirements:</span>
                                      </div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">OS:</strong></div>
                                      <div class="col-sm-8">Windows 7,Windows 8.1,Windows 10</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Processor:</strong></div>
                                      <div class="col-sm-8">Intel Core i7- 3770 @ 3.5 GHz or AMD FX-8350 @ 4.0 GHz</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Memory:</strong></div>
                                      <div class="col-sm-8">8 GB RAM</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Graphics:</strong></div>
                                      <div class="col-sm-8">NVIDIA GeForce GTX 760 or AMD R9 280X (3GB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Disk Space:</strong></div>
                                      <div class="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Architecture:</strong></div>
                                      <div class="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">API:</strong></div>
                                      <div class="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Miscellaneous:</strong></div>
                                      <div class="col-sm-8">Video Preset: High (1080p)</div>
                                    </div>
                                  </div>*/}
                                </div>
                              </div>
                              <div class="tab-pane fade" id="fillup-2" role="tabpanel" aria-labelledby="fillup-profile-tab">
                                <div class="row">
                                  <div class="col-xs-12 col-lg-6 mb-6 mb-lg-0">
                                    <div class="row">
                                      <div class="col-12">
                                        <span class="d-inline-block text-uppercase fw-500 mb-3 text-info">Minimum Requirements:</span>
                                      </div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">OS:</strong></div>
                                      <div class="col-sm-8">OSX 10.5</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Processor:</strong></div>
                                      <div class="col-sm-8">Intel Core i5-2400s @ 2.5 GHz or AMD FX-6350 @ 3.9 GHz</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Memory:</strong></div>
                                      <div class="col-sm-8">6 GB RAM</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Graphics:</strong></div>
                                      <div class="col-sm-8">NVIDIA GeForce GTX 660 or AMD R9 270 (2048 MB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Disk Space:</strong></div>
                                      <div class="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Architecture:</strong></div>
                                      <div class="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">API:</strong></div>
                                      <div class="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Miscellaneous:</strong></div>
                                      <div class="col-sm-8">Video Preset: Lowest (720p)</div>
                                    </div>
                                    
                                  </div>
                                  {/*<div class="col-xs-12 col-lg-6">
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-12">
                                        <span class="d-inline-block text-uppercase fw-500 mb-3 text-warning">Recommended Requirements:</span>
                                      </div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">OS:</strong></div>
                                      <div class="col-sm-8">OSX 10.5</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Processor:</strong></div>
                                      <div class="col-sm-8">Intel Core i7- 3770 @ 3.5 GHz or AMD FX-8350 @ 4.0 GHz</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Memory:</strong></div>
                                      <div class="col-sm-8">8 GB RAM</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Graphics:</strong></div>
                                      <div class="col-sm-8">NVIDIA GeForce GTX 760 or AMD R9 280X (3GB VRAM with Shader Model 5.0 or better)</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Disk Space:</strong></div>
                                      <div class="col-sm-8">42 GB available space</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Architecture:</strong></div>
                                      <div class="col-sm-8">Requires a 64-bit processor and OS</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">API:</strong></div>
                                      <div class="col-sm-8">DirectX 11</div>
                                    </div>
                                    <div class="row mb-4 mb-sm-0">
                                      <div class="col-sm-4"><strong class="fw-500">Miscellaneous:</strong></div>
                                      <div class="col-sm-8">Video Preset: High (1080p)</div>
                                    </div>
                                    
                                  </div>*/}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="mb-6">
                          <h6 class="mb-0 fw-400 ls-1 text-uppercase">More like this</h6>
                          <hr class="border-secondary my-2"/>
                          <div>
                              <div class="owl-carousel carousel_sm" data-carousel-items="1, 2, 3, 3" data-carousel-margin="10" data-carousel-nav="false" data-carousel-dots="true">
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg-c_01.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Akamen</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg-c_02.jpg)"}}>
                                              <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                                <div class="px-4 py-3 lh-1">
                                                      <h6 class="mb-1 small-1 text-light text-uppercase">Punk City</h6>
                                                      <div class="price d-flex flex-wrap align-items-center">
                                                        <span class="discount_final text-warning small-2">€99.99</span>
                                                    </div>
                                                </div>
                                              </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg-c_03.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Transaction</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg_04.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Golden Mask</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg_05.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">ONI</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg_06.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Engineer</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-t ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg_07.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Informant</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg_08.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Haku</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                                  <div class="item">
                                      <a href="store-product.html#">
                                        <div class="d-flex h-100 bs-c br-n bp-c ar-8_5 position-relative" style={{backgroundImage: "url(/assets/img/content/cont/cg-c_02.jpg)"}}>
                                          <div class="position-absolute w-100 l-0 b-0 bg-dark_A-80 text-light">
                                            <div class="px-4 py-3 lh-1">
                                              <h6 class="mb-1 small-1 text-light text-uppercase">Punk City</h6>
                                              <div class="price d-flex flex-wrap align-items-center">
                                                <span class="discount_final text-warning small-2">€99.99</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    </a>
                                  </div>
                              </div>
                          </div>
                        </div>
                        <div class="mb-0">
                          <div>
                            <div>
                              <p class="small">*Duis sit amet lectus pharetra, placerat ante et, varius urna. Praesent euismod lacinia lacus, at posuere quam vestibulum ut. Vivamus eu ligula at massa laoreet commodo. In consequat aliquet scelerisque. Proin dapibus velit quis suscipit interdum. Vestibulum eu sapien eget lorem volutpat dapibus molestie a metus. Proin in turpis a arcu luctus euismod. Sed vitae ante at leo bibendum blandit nec vel mauris. Ut laoreet bibendum lobortis.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div class="bg-dark_A-20 p-4 mb-4">
                    {hasImage &&
                        <img src={this.state.imagePath} alt="Product" class="mb-3"/>
                    }
                    <p>TODO</p>
                    <div class="price-wrapper">
                      <div class="mb-3">
                        <div class="price">
                            {/*<div class="price-prev">300$</div>*/}
                            <div class="price-current">{this.state.price / priceConversion} ETH</div>
                          </div>
                        {/*<div class="discount">
                            Save: $20.00 (33%)
                        </div>*/}
                      </div>
                      <div class="price-box mb-4">
                          <div class="mr-4">
                            <div class="quantity-group input-group">
                                <input type="text" class="form-control form-control-sm h-auto" value="1"/>
                            </div>
                          </div>
                        <div class="flex-1"><a href="" class="btn btn-block btn-warning"><i class="fas fa-shopping-cart"></i> Add to Cart</a></div>
                      </div>
                    </div>
                    <div>
                        <div class="row mb-4">
                            <form class="col mb-3 mb-md-0">
                                <div class="custom-control custom-checkbox">
                                  <input class="custom-control-input" type="checkbox" value="" id="comp_check"/>
                                  <label class="custom-control-label fw-600 text-uppercase small-5" htmlFor="comp_check">
                                    Add To Compare
                                  </label>
                                </div>
                            </form>
                            <form class="col-sm-auto">
                                <div class="custom-control custom-checkbox">
                                  <input class="custom-control-input" type="checkbox" value="" id="gift_check"/>
                                  <label class="custom-control-label fw-600 text-uppercase small-5" htmlFor="gift_check">
                                    Buy as gift
                                  </label>
                                </div>
                            </form>
                        </div>
                        <a href="" class="btn btn-block btn-secondary"><i class="fas fa-heart"></i> Add to wishlist</a>
                    </div>
                  </div>
                  <div class="bg-dark_A-20 p-4">
                    <h6 class="mb-3">Item Information</h6>
                    <hr class="border-secondary mt-2 mb-4"/>
                    <ul class="list-unstyled mb-3">
                      <li>
                        <span class="platform">Simulator:</span> 
                        <span class="developer-item text-lt">{this.state.simulator}</span>
                      </li>
                        {/*<span class="platform-item btn btn-sm btn-outline-warning"><i class="fab fa-windows"></i> PC</span>
                    Seller:</b> 
                      <li>
                        <span class="platform">Simulator:</span> 
                        <span class="developer-item text-lt">{this.state.simulator}</span>
                        {/*<span class="platform-item btn btn-sm btn-outline-warning"><i class="fab fa-windows"></i> PC</span>
                        <span class="platform-item btn btn-sm btn-outline-warning"><i class="fas fa-apple-alt"></i> mac</span>*/}
                      
                      <li>
                        <span class="platform">Series:</span> 
                        <span class="developer-item text-lt">{this.state.series}</span>
                      </li>
                    </ul>
                    {/*<ul class="list-unstyled mb-3">
                      <li class="developer-wrapper d-flex">
                        <span class="developer">Series:</span>
                        <span class="developer-item text-lt">{this.state.series}</span>
                      </li>
                    </ul>*/}
                    {/*<ul class="list-unstyled small-2 mb-3">
                      <li class="developer-wrapper">
                        <a href="" class="developer">Genres:</a>
                        <a href="">Indie</a>,
                        <a href="">Simulation</a>,
                        <a href="">Strategy</a>
                      </li>
                    </ul>*/}
                    {/*<ul class="list-unstyled small-2 mb-3">
                      <li class="developer-wrapper">
                        <a href="" class="developer">Languages:</a>
                        <hr class="my-2 border-secondary"/>
                        <div>
                          <div class="d-flex align-items-center">
                            <span class="flex-1">English</span>
                            <span class="text-warning ti-check"></span>
                          </div>
                          <hr class="my-2 border-secondary"/>
                          <div class="d-flex align-items-center">
                            <span class="flex-1">German</span>
                            <span class="text-warning ti-check"></span>
                          </div>
                          <hr class="my-2 border-secondary"/>
                          <div class="d-flex align-items-center">
                            <span class="flex-1">French</span>
                            <span class="text-warning ti-check"></span>
                          </div>
                          <hr class="my-2 border-secondary"/>
                          <div class="d-flex align-items-center">
                            <span class="flex-1">Polish</span>
                            <span class="text-warning ti-check"></span>
                          </div>
                          <hr class="my-2 border-secondary"/>
                          <div class="d-flex align-items-center">
                            <span class="flex-1">Russian</span>
                            <span class="text-warning ti-check"></span>
                          </div>
                        </div>
                      </li>
                    </ul>*/}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <section class="container text-light">
            <div class="border border-secondary py-5 px-2">
              <div class="mx-3 mb-6">
                <h6 class="mb-4 fw-400 ls-1 text-uppercase">Featured & Recommended</h6>
                <hr class="border-secondary my-2"/>
              </div>
              <div class="owl-carousel" data-carousel-items="1, 2, 3, 6">
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-01.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">Creature 2020</a>
                  <span class="time d-block small-4">26 Sep, 2020</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 23</span>
                </div>
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-02.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">Shadow Leap</a>
                  <span class="time d-block small-4">14 Sep, 2020</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 57</span>
                </div>
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-04.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">Golden Mask</a>
                  <span class="time d-block small-4">18 Oct, 2020</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 57</span>
                </div>
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-03.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">Mechaone</a>
                  <span class="time d-block small-4">05 Oct, 2020</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 57</span>
                </div>
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-05.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">ONE</a>
                  <span class="time d-block small-4">16 Oct, 2020</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 57</span>
                </div>
                <div class="item mx-3">
                  <img src="assets/img/content/store/h-06.jpg" alt="Game" class="mb-3"/>
                  <a href="store-product.html#" class="text-uppercase fw-500 small-2 mb-0">Engineer</a>
                  <span class="time d-block small-4">27 Oct, 2019</span>
                  <span class="d-block small text-warning"><i class="far fa-eye"></i> 57</span>
                </div>
              </div>
            </div>
          </section>
          <section class="review-box content-section text-light">
            <div class="container">
              <div class="row">
                <div class="col-lg-8">
                  <div class="mb-8">
                    <h6 class="mb-4 fw-400 ls-1 text-uppercase">Reviews</h6>
                    <hr class="border-secondary mt-2 mb-6"/>
                    <div class="row">
                      {/*<!-- Item -->*/}
                      <ReviewsComponent/>
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div class="col-12 mb-7">
                        <div class="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/2.jpg" class="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div class="review-item ml-sm-4">
                            <div class="small d-flex align-items-start">
                              <!-- user -->
                              <span class="name text-lt badge badge-info fw-600 small-4">metus</span>
                              <!-- /.user -->
                              <!-- time -->
                              <div class="time ml-2">05/08/2020</div>
                              *<!-- /.time -->
                              <!-- star -->
                              <div class="ml-2 text-warning">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                              </div>
                              <!-- /.star -->
                              <!-- info -->
                              <div class="ml-auto">
                                <div class="d-flex small-1">
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-up"></i></a></div>
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-down"></i></a></div>
                                  <div class="dropdown">
                                      <a class="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_02" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i class="fas fa-share-alt"></i></a>
                                      <div class="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_02">
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-twitter"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-dribbble"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-instagram"></i></a>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              <!-- /.info -->
                            </div>
                            <div>
                              <span class="d-block lead-2 mb-2">Class aptent taciti sociosqu ad litora torquent per conubia nostra</span>
                              <div class="collapse readmore r-fade">
                                <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam, vel mollis diam tempus ac. Duis euismod diam et ante egestas, sed porttitor orci euismod. In quis ligula fermentum, elementum quam quis, pellentesque lorem. Vivamus eget ligula ante. Aliquam porttitor nisl sit amet malesuada finibus. Etiam sit amet porttitor purus. Etiam at aliquam massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse cursus sollicitudin malesuada.</p>
                              </div>
                              <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                      </div>*/}
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div class="col-12 mb-7">
                        <div class="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/3.jpg" class="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div class="review-item ml-sm-4">
                            <div class="small d-flex align-items-start">
                              <!-- user -->
                              <span class="name text-lt badge badge-info fw-600 small-4">metus</span>
                              <!-- /.user -->
                              <!-- time -->
                              <div class="time ml-2">03/08/2020</div>
                              <!-- /.time -->
                              <!-- star -->
                              <div class="ml-2 text-warning">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                              </div>
                              <!-- /.star -->
                              <!-- info -->
                              <div class="ml-auto">
                                <div class="d-flex small-1">
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-up"></i></a></div>
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-down"></i></a></div>
                                  <div class="dropdown">
                                      <a class="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_03" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i class="fas fa-share-alt"></i></a>
                                      <div class="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_03">
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-twitter"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-dribbble"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-instagram"></i></a>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              <!-- /.info -->
                            </div>
                            <div>
                              <span class="d-block lead-2 mb-2">Class aptent taciti sociosqu ad litora torquent per conubia nostra</span>
                              <div class="collapse readmore r-fade">
                                <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam, vel mollis diam tempus ac. Duis euismod diam et ante egestas, sed porttitor orci euismod. In quis ligula fermentum, elementum quam quis, pellentesque lorem. Vivamus eget ligula ante. Aliquam porttitor nisl sit amet malesuada finibus. Etiam sit amet porttitor purus. Etiam at aliquam massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse cursus sollicitudin malesuada.</p>
                              </div>
                              <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                      </div>*/}
                      {/*<!-- /.Item -->*/}
                    </div>
                  </div>
                </div>
                <div class="col-lg-4">
                  <div>
                    <h6 class="mb-4 fw-400 ls-1 text-uppercase">Best reviews</h6>
                    <div class="border border-secondary rounded p-4">
                      {/*<!-- Item -->*/}
                      <div class="review-item mb-5">
                        <div class="small d-flex">
                          <div class="flex-1">
                            <span class="name badge badge-warning fw-600 small-4">metus</span>
                            <span class="time ml-2">05/08/2020</span>
                          </div>
                          <a href="" class="text-info"><i class="fas fa-thumbs-up"></i> 135</a>
                        </div>
                        <div>
                          <span class="lead-2">Sociosqu ad litora torquent</span>
                          <div class="collapse readmore r-fade">
                            <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam.</p>
                          </div>
                          <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                        </div>
                      </div>
                      <hr class="border-secondary mt-0 mb-5"/>
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div class="review-item mb-5">
                        <div class="small d-flex">
                          <div class="flex-1">
                            <span class="name badge badge-warning fw-600 small-4">metus</span>
                            <span class="time ml-2">05/08/2020</span>
                          </div>
                          <a href="" class="text-info"><i class="fas fa-thumbs-up"></i> 135</a>
                        </div>
                        <div>
                          <span class="lead-2">Sociosqu ad litora torquent</span>
                          <div class="collapse readmore r-fade">
                            <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam.</p>
                          </div>
                          <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                        </div>
                      </div>
                      <hr class="border-secondary mt-0 mb-5"/>
                      */}
                      {/*<!-- /.Item -->
                      <!-- Item -->*/}
                      {/*<div class="review-item mb-0">
                        <div class="small d-flex">
                          <div class="flex-1">
                            <span class="name badge badge-warning fw-600 small-4">metus</span>
                            <span class="time ml-2">05/08/2020</span>
                          </div>
                          <a href="" class="text-info"><i class="fas fa-thumbs-up"></i> 135</a>
                        </div>
                        <div>
                          <span class="lead-2">Sociosqu ad litora torquent</span>
                          <div class="collapse readmore r-fade">
                            <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam.</p>
                          </div>
                          <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
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
        </div>
        );
    }
}

export default withRouter(ItemPage);