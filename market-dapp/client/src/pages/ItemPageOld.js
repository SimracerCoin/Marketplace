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

class ItemPageOld extends Component {

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

        if (this.state.isNFT) {
            item = "Car Ownership NFT"
            toRender = (
                <div>
                    <div><img src={this.state.imagePath} /></div>
                    <div><b>Seller:</b> <Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} ({this.state.vendorAddress})</u></Link></div>
                    <div><b>Series:</b> {this.state.series}</div>
                    <div><b>Number:</b> {this.state.description}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Price:</b> {this.state.price / priceConversion}</div>
                </div>
            )

        } else if (this.state.track == null || this.state.season == null) {
            item = "Skin"
            toRender = (
                <div>
                    <div><img src={this.state.imagePath} /></div>
                    <div><b>Seller:</b> <Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} ({this.state.vendorAddress})</u></Link></div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Price:</b> {this.state.price / priceConversion}</div>
                </div>
            )
        } else {
            item = "Car Setup"
            toRender = (
                <div>
                    <div><b>Seller:</b> <Link to={{ pathname: "/seller", state: { vendorAddress: this.state.vendorAddress, vendorNickname: this.state.vendorNickname } }}><u>{this.state.vendorNickname} ({this.state.vendorAddress})</u></Link></div>
                    <div><b>Car Brand:</b> {this.state.car}</div>
                    <div><b>Track:</b> {this.state.track}</div>
                    <div><b>Simulator:</b> {this.state.simulator}</div>
                    <div><b>Season:</b> {this.state.season}</div>
                    <div><b>Series:</b> {this.state.series}</div>
                    <div><b>Description:</b> {this.state.description}</div>
                    <div><b>Price:</b> {this.state.price / priceConversion}</div>
                </div>
            )
        }

        if (this.state.listComments.length != 0) {
            for (const [index, value] of this.state.listComments.entries()) {
                let commentator = value.commentator;
                let description = value.description;
                let review = parseInt(value.review);
                let date = new Date(value.date)
                let date_time = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                commentsRender.push(
                    <ListGroup.Item key={index} className="mb-5">
                        <Card className="card-block">
                            <Card.Body>
                                <Card.Text>
                                    <div>
                                        <StarRatings
                                            rating={review}
                                            starRatedColor="rgb(230, 67, 47)"
                                            starDimension="20px"
                                            numberOfStars={5}
                                            name='rating'
                                        />
                                    </div>
                                    <div><b>Commentator:</b> {commentator}</div>
                                    <div><b>Description:</b> {description} </div>
                                    {/* <div><b>Review:</b> {review}</div> */}
                                    <div><b>Date:</b> {date_time}</div>
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                )
            }
            commentsRender.reverse();
        }
        
    
            if (!this.state.isNFT) {
                return (
                    <header className="header">
                        <div class="overlay overflow-hidden pe-n"><img src="/assets/img/bg/bg_shape.png" alt="Background shape" /></div>
                        <section className="content-section text-light br-n bs-c bp-c pb-8">
                            <div className="container">
                                <h1>Buy {item}</h1>
                                <br /><br />
                                {toRender}
                                <br /><br />
                                <Button onClick={this.buyItem}>Buy</Button>
                            </div>
                        </section>
    
                        <div className="container">
                            <h3 className="text-white">Review</h3>
                            <Form onSubmit={this.submitComment}>
                                <Form.Control as="textarea" rows={3} placeholder="Say something here..." id="comment" /> <br></br>
                                <StarRatings
                                    rating={this.state.review_rating}
                                    starRatedColor="yellow"
                                    changeRating={this.changeRating}
                                    numberOfStars={5}
                                    starDimension="25px"
                                    name='rating'
                                />
                                <br></br>
                                <Button className="mt-5" onClick={this.submitComment}>Comment</Button>
                            </Form>
                        </div>
                        <br></br>
                        <div className="container">
                            <h3 className="text-white">Reviews</h3>
                            <div className="container">
                                <Row>
                                    <div className="review d-flex">
                                        <div className="review_score">
                                            <div className="review_score-btn">
                                                {this.state.average_review.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="star_rating-se text-warning mr-7">
                                            <div className="mb-1">
                                                <StarRatings
                                                    rating={this.state.average_review}
                                                    starRatedColor="yellow"
                                                    numberOfStars={5}
                                                    starDimension="25px"
                                                    name='rating'
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="text-white">({this.state.listComments.length})</h4>
                                </Row>
                            </div>
                            <ListGroup>
                                {commentsRender}
                            </ListGroup>
                        </div>
                    </header>
    
                )
            } else {
                return (
                    <header className="header">
                        <section className="content-section text-light br-n bs-c bp-c pb-8" style={{ backgroundImage: 'url(\'/assets/img/bg/bg_shape.png\')' }}>
                            <div className="container">
                                <h1>Buy {item}</h1>
                                <br></br>
                                {toRender}
                                <br></br>
                                <Button onClick={this.buyItem}>Buy</Button>
                            </div>
                        </section>
                    </header>
    
                )
            }
    }
}

export default withRouter(ItemPageOld);