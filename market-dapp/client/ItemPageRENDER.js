
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
                            <Button onClick={this.buyItem}>Buy Item</Button>
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
                            <Button onClick={this.buyItem}>Buy Item</Button>
                        </div>
                    </section>
                </header>

            )
        }