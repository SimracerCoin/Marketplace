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
            comment: "",
            listComments: [],
            review_rating: 0,
            average_review: 0
        }
    }

    componentDidMount = async (event) => {
        console.log("render reviews component");
    }

    render() {
        return (
            <div class="col-12 mb-7">
                        <div class="d-flex flex-wrap flex-sm-nowrap">
                          <div><img src="assets/img/avatar/1.jpg" class="d-none d-sm-block avatar rounded" alt="Avatar"/></div>
                          <div class="review-item ml-sm-4">
                            <div class="small d-flex align-items-start">
                              {/*<!-- user -->*/}
                              <span class="name text-lt badge badge-info fw-600 small-4">metus</span>
                              {/*<!-- /.user -->
                              <!-- time -->*/}
                              <div class="time ml-2">05/08/2020</div>
                              {/*<!-- /.time -->
                              <!-- star -->*/}
                              <div class="ml-2 text-warning">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
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
                              <span class="d-block lead-2 mb-2">Class aptent taciti sociosqu ad litora torquent per conubia nostra</span>
                              <div class="collapse readmore r-fade">
                                <p class="mb-0 small-3">Vestibulum vitae sem eget tortor dignissim convallis. Sed a vehicula tortor. Etiam semper gravida erat eget tristique. Integer suscipit finibus diam, vestibulum lobortis eros lobortis eu.Sed blandit tincidunt nibh, nec ullamcorper lacus porttitor a. Cras vitae justo nisi. Cras in congue turpis. Cras cursus vestibulum diam, vel mollis diam tempus ac. Duis euismod diam et ante egestas, sed porttitor orci euismod. In quis ligula fermentum, elementum quam quis, pellentesque lorem. Vivamus eget ligula ante. Aliquam porttitor nisl sit amet malesuada finibus. Etiam sit amet porttitor purus. Etiam at aliquam massa. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse cursus sollicitudin malesuada.</p>
                              </div>
                              <a class="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>
                            </div>
                          </div>
                        </div>
                      </div>
        );
    }
}
export default ReviewsComponent;