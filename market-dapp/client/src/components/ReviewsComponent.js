import React, { Component } from 'react';

class ReviewsComponent extends Component {

    constructor(props) {
      super(props);

      this.state = {
        commentator: "",
        description: "",
        review: "",
        date: ""
      }
    }

    componentDidMount = async () => {
        const { comment } = this.props;

        const commentator = comment.commentator;
        const description = comment.description;
        const review = parseInt(comment.review);
        const date = new Date(comment.date*1000);
        const date_time = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.setState({commentator, description, review, date: date_time});
    }

    getRatingStars = () =>  {
      let stars = [];
      for(let i=0; i< this.state.review; i++) {
        stars.push(<i className="fas fa-star"></i>);
      }
      return stars;
    }

    render() {
        return (
            <div className="col-12 mb-7">
                        <div className="d-flex flex-wrap flex-sm-nowrap">
                          <div className="review-item ml-sm-4">
                            <div className="small d-flex align-items-start">
                              {/*<!-- user -->*/}
                              <span className="name text-lt badge badge-info fw-600 small-4">{this.state.commentator}</span>
                              {/*<!-- /.user -->
                              <!-- time -->*/}
                              <div className="time ml-2">{this.state.date}</div>
                              {/*<!-- /.time -->
                              <!-- star -->*/}
                              <div className="ml-2 text-warning">
                                {this.getRatingStars().map( (star, idx) => {
                                  return star
                                })}
                                {/*<i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star-half-alt"></i>
                                */}
                              </div>
                             {/*} <!-- /.star -->
                              <!-- info -->*/}
                              <div className="ml-auto">
                                <div className="d-flex small-1">
                                  {/*<div className="mr-2"><a href="#" className="text-info"><i className="fas fa-thumbs-up"></i></a></div>
                                  <div className="mr-2"><a href="#" className="text-info"><i className="fas fa-thumbs-down"></i></a></div>
                                  <div className="dropdown">
                                      <a className="dropdown-toggle text-info" href="store-product.html#" id="dropdownShare_01" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"><i className="fas fa-share-alt"></i></a>
                                      <div className="dropdown-menu dropdown-menu-share" aria-labelledby="dropdownShare_01">
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-twitter"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-dribbble"></i></a>
                                        <a className="dropdown-item" href="store-product.html#"><i className="fab fa-instagram"></i></a>
                                      </div>
                                  </div>*/}
                                </div>
                              </div>
                              {/*<!-- /.info -->*/}
                            </div>
                            <div>
                              <span className="d-block lead-2 mb-2">{this.state.description}</span>
                              <div className="collapse readmore r-fade">
                                <p className="mb-0 small-3">{this.state.description}</p>
                              </div>
                              {/*<a className="readmore-btn collapsed collapser" data-toggle="collapse" aria-expanded="false" href=""></a>*/}
                            </div>
                          </div>
                        </div>
                        <hr className="border-secondary my-2"/>
                      </div>
        );
    }
}
export default ReviewsComponent;