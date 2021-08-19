import React, { Component } from 'react';

class ReviewsComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            /*itemId: props.location.state.selectedItemId,
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
            isNFT: props.location.state.isNFT,*/
            contract: null,
            currentAccount: "",
            comment: props.comment
          
        }
    }

    componentDidMount = async (event) => {
        console.log("render reviews component");
        let commentator = this.state.comment.commentator;
        let description = this.state.comment.description;
        let review = parseInt(this.state.comment.review);
        let date = new Date(this.state.comment.date)
        let date_time = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.setState({commentator: commentator, description: description, review: review, date: date_time});
    }

    getRatingStars = () =>  {
      let stars = [];
      for(let i=0; i< this.state.review; i++) {
        stars.push(<i class="fas fa-star"></i>);
      }
      return stars;
    }


    render() {
        return (
            <div class="col-12 mb-7">
                        <div class="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/1.jpg" class="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div class="review-item ml-sm-4">
                            <div class="small d-flex align-items-start">
                              {/*<!-- user -->*/}
                              <span class="name text-lt badge badge-info fw-600 small-4">{this.state.commentator}</span>
                              {/*<!-- /.user -->
                              <!-- time -->*/}
                              <div class="time ml-2">{this.state.date}</div>
                              {/*<!-- /.time -->
                              <!-- star -->*/}
                              <div class="ml-2 text-warning">
                                {this.getRatingStars().map( (star, idx) => {
                                  return star
                                })}
                                {/*<i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                                */}
                              </div>
                             {/*} <!-- /.star -->
                              <!-- info -->*/}
                              <div class="ml-auto">
                                <div class="d-flex small-1">
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-up"></i></a></div>
                                  <div class="mr-2"><a href="" class="text-info"><i class="fas fa-thumbs-down"></i></a></div>
                                  <div class="dropdown">
                                      <a class="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_01" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i class="fas fa-share-alt"></i></a>
                                      <div class="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_01">
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-twitter"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-dribbble"></i></a>
                                        <a class="dropdown-item" href="store-product.html#"><i class="fab fa-instagram"></i></a>
                                      </div>
                                  </div>
                                </div>
                              </div>
                              {/*<!-- /.info -->*/}
                            </div>
                            <div>
                              <span class="d-block lead-2 mb-2">{this.state.description}</span>
                              <div class="collapse readmore r-fade">
                                <p class="mb-0 small-3">{this.state.description}.</p>
                              </div>
                              <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                        <hr class="border-secondary my-2"/>
                      </div>
        );
    }
}
export default ReviewsComponent;