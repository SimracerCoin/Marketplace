import React, { Component } from 'react';
import { Redirect } from "react-router-dom";
import * as $ from 'jquery';

const priceConversion = 10 ** 18;
//pagination is out of scope for now, also would require more items to test properly
const MAX_ITEMS_PER_PAGE = 10;


class StorePage extends Component {

    constructor(props) {
        super(props);
       
        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            //-------------------- lists ----------
            latestCars: [], //contains all the cars returned by the contracts
            filteredCars:[], //list of cars but filtered
            latestSkins: [], //contains all the skins returned by the contracts
            filteredSkins: [], //list of skins but filtered
            latestNFTs: [], //contains all the nfts returned by the contracts
            filteredNFTs: [], // list of nfst but filtered
            listSimulators: [], //list of all simulators available
            filteredSimulators: [], //list of filtered simulators
            //---------------- buy / view item ----------
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedSeries: "",
            selectedDescription: "",
            selectedPrice: "",
            selectedCarBrand: "",
            selectedImagePath: "",
            vendorAddress: "",
            vendorNickname: "",
            ipfsPath: "",
            //-------------------- other stuff --------------
            contract: null,
            currentPage: 1, //for future filtering purposes
            numPages: 1, //num pages by default
            contractNFTs: null,
            context: props.context,
            //---------------------- filters -----------
            activeSimulatorsFilter: [{simulator: "All", checked: true}], //default filter
            //just as reference, we can define others intervals if needed
            activePriceFilters: [
              {name: "tier_1", checked: true, label: "> 0.000001 ETH <= 0.5 ETH", min: 0.00001, max: 0.5},
              {name: "tier_2", checked: true, label: "> 0.5 ETH <= 1.0 ETH", min: 0.500000001, max: 1.0},
              {name: "tier_3", checked: true, label: "> 1.0 ETH", min: 1.00000001, max: 100000000}
            ],
            searchQuery: ""
        }

        // This binding is necessary to make `this` work in the callback
       //this.simulatorsFilterChanged = this.simulatorsFilterChanged.bind(this);

    }

    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------

    componentDidMount = async () => {

        const searchQuery = this.hasSearchFilter();
        if(searchQuery && searchQuery.length > 0) {
          this.setState({searchQuery: searchQuery});
        }
        this.getNFTsData();
      
        //------------------------- Collapser hack -------------------------
        //all the js/jquery will get loaded before the elements are displayed on page so the handlers on main.js don´t work
        //because the elements are not part of the DOM yet
      $('.collapser:not(.readmore-btn)').on('click', function() {
        if($(this).is('.collapser-active')) {
          $(this).removeClass('collapser-active');
          $(this).next().removeClass('show');
        } else {
          $(this).addClass('collapser-active');
          $(this).next().addClass('show');
        }
        
        //--------------------------------------------------------------
    });
    
    }


    //get all contracts data
    async getNFTsData() {

        const contract = await this.state.drizzle.contracts.STMarketplace;
        const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
        const response_cars = await contract.methods.getCarSetups().call();
        const response_skins = await contract.methods.getSkins().call();
        //const currentAccount = this.state.drizzleState.accounts[0];
        console.log("STORE: componentDidMount");
        const nftlist = [];
        // get info from marketplace NFT contract
        const numNfts = await contractNFTs.methods.currentTokenId().call();
        console.log('nft count:' + numNfts);
        //TODO this number can be misleading because we do not parse them all (only => if(ownerAddress === contractNFTs.address) )

        let simsList = [];
        let simulatorsFilter = [];
        simulatorsFilter.push(this.state.activeSimulatorsFilter[0]);

        //if there is a serach in place
        //by default include all items
        let filteredNFTsList = [];
        let filteredCarsList = response_cars;
        let filteredSkinsList = response_skins;

        //use search params?
        let queryString = this.state.searchQuery;
        const considerSearchQuery = (queryString && queryString.length > 0);
        let maxElems = 0;

        //by default on load, these filtered lists inlcude all the items, unless we are searching for somethign specific
        if(considerSearchQuery){
          filteredCarsList = filteredCarsList.filter(value => {
            
            return this.shouldIncludeCarBySearchQuery(queryString.toLowerCase(), value);

          });

          filteredSkinsList = filteredSkinsList.filter(value => {
            return this.shouldIncludeSkinBySearchQuery(queryString.toLowerCase(), value);
          });
        } 
        
        //let currentPage = this;
        for (let i = 1; i < parseInt(numNfts) + 1; i++) {
            try {
                //TODO: change for different ids
                let ownerAddress = await contractNFTs.methods.ownerOf(i).call();
                console.log('ID:'+i+'ownerAddress: '+ownerAddress.toString()+'nfts addr: '+contractNFTs.address);
                if(ownerAddress === contractNFTs.address) {
                    console.log('GOT MATCH');
                    let uri = await contractNFTs.methods.tokenURI(i).call();
                    console.log('uri: ', uri);
                    var xmlhttp = new XMLHttpRequest();
                    // eslint-disable-next-line no-loop-func
                    xmlhttp.onload = function(e) {
                        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                            var data = JSON.parse(xmlhttp.responseText);
                            /**  DATA example:
                            {  
                                "description": "Simthunder Car Ownership",
                                "name": "Car",
                                "image": "https://ipfs.io/ipfs/QmbM3fsbACwV887bMf73tvtY9iA5K1CSZ3kYdwj7G9bL7W",
                                "series": "Simthunder Trophy",
                                "seriesOwner": "0xA59DE47b6fa8911DF14F4524B853B742AF1F3a0c",
                                "carNumber": "48",
                                "simulator": "iRacing",
                                "price": 1
                            }
                            */
                            console.log('nft image:' + data.image);
                            console.log('nft description:' + data.description);
                            data.id=i;

                            //global list of all
                            nftlist.push(data);

                            //update the max elements every time, as we will consider this as the 
                            maxElems = nftlist.length;

                            //TODO UNCOMMENT BLOCK BELLOW FOR TESTING PAGINATION ONLY -> duplicate each NFT 5 times
                            //--------------------------------------------------------------------------------
                            /**for(let j = 0; j<5; j++) {
                              
                                let newOne = Object.assign({}, data);;
                                newOne.series = data.series + "_" + j;
                                newOne.name = data.name + "_ " + j;
                                newOne.description = data.description + "_ " + j;
                                console.log("NEW ONE " + j + " IS " + JSON.stringify(newOne));
                                nftlist.push(newOne);
                              
                            }*/
                            //--------------------------------------------------------------------------------
                            
                            //only filtered list
                            if(considerSearchQuery && (this.shouldIncludeNFTBySearchQuery(queryString.toLowerCase(), data)) ){
                              filteredNFTsList.push(data);
                            }//otherwise goes on the default list => nftlist
                            

                            //add simulator if not present already 
                            let simulator = data.simulator;
                            if(!simsList.includes(simulator)) {

                              simsList.push(data.simulator);

                              if(!considerSearchQuery ) {
                                  simulatorsFilter.push({simulator: data.simulator, checked: true});
                              } else {

                                //matches query, push and check it
                                if(simulator.toLowerCase().indexOf(queryString.toLowerCase())>-1) {
                                  simulatorsFilter.push({simulator: data.simulator, checked: true});
                                } else {
                                  //still push it but disabled
                                  simulatorsFilter.push({simulator: data.simulator, checked: false});
                                }

                                
                              }

                              
                            }

                            //this this GET is assync we need to recalaculate the pagination after every grab
                            this.recalculatePaginationAndNumPages(maxElems, filteredCarsList, filteredSkinsList);
                        

                            this.setState({ 
                                          latestNFTs: nftlist, 
                                          filteredNFTs: considerSearchQuery ? this.paginate(filteredNFTsList, this.state.currentPage): this.paginate(nftlist, this.state.currentPage), 
                                          listSimulators: simsList, 
                                          activeSimulatorsFilter: simulatorsFilter 
                                        });
                        }
                    }.bind(this);
                    xmlhttp.onerror = function (e) {
                        console.error(xmlhttp.statusText);
                    };
                    xmlhttp.open("GET", uri, true);
                    xmlhttp.send(null);
                }
            } catch (e) {
                console.error(e);
            }
        }
        

        //get the number of elements of the bigger list, use it to define the number of pages, minimum 1
        //NOTE: we might reach this part before processing all NFTS, so we also call this inside the loop above
        this.recalculatePaginationAndNumPages(maxElems, filteredCarsList, filteredSkinsList);
        //these won´t change, set only here
        this.setState(
          { 
          latestCars: response_cars, 
          latestSkins: response_skins, 
          contract: contract, 
          contractNFTs: contractNFTs 
        });
        
        console.log("END getNFTSData");
    }

    /**
     * Calculate pagination and set state
     * @param {*} maxElems 
     * @param {*} filteredCarsList 
     * @param {*} filteredSkinsList 
     */
    recalculatePaginationAndNumPages(maxElems, filteredCarsList, filteredSkinsList) {
      if(filteredCarsList.length > maxElems) {
        maxElems = filteredCarsList.length;
      }

      if(filteredSkinsList.length > maxElems) {
        maxElems = filteredSkinsList.length;
      }
      console.log("max elemenst: " + maxElems + " num pages: " +  Math.ceil((maxElems / MAX_ITEMS_PER_PAGE)) || 1 );
      
      this.setState(
        { 
        numPages: ( Math.ceil((maxElems / MAX_ITEMS_PER_PAGE) ) || 1),
        filteredCars: this.paginate(filteredCarsList, this.state.currentPage), 
        filteredSkins: this.paginate(filteredSkinsList, this.state.currentPage), 
        
      });
    }

    /**
     * Method for pagination, can be used for any input collection
     * @param {*} array 
     * @param {*} page_number 
     * @returns 
     */
    paginate(array, page_number) {
      if(array.length <= MAX_ITEMS_PER_PAGE) {
        return array;
      }
      // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
      return array.slice((page_number - 1) * MAX_ITEMS_PER_PAGE, page_number * MAX_ITEMS_PER_PAGE);
    }

    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    simulatorsFilterChanged = (event) => {
      
      let enabledSimulators = [];
      let filters = this.state.activeSimulatorsFilter;
        filters.forEach(filter => {
           if (filter.simulator === event.target.value) {
              filter.checked =  event.target.checked;
           }
          
           if(filter.checked) {
             enabledSimulators.push(filter);
           }
           
        })
       
        this.setState({activeSimulatorsFilter: filters})

        //nothing to show, all price filters disabled
        if(enabledSimulators.length === 0) {
          this.setState({filteredNFTs : [], filteredSkins: [], filteredCars: [], currentPage: 1, numPages: 1 });
        } else {

          this.filterSkinsBySimulator(enabledSimulators);
          this.filterCarsBySimulator(enabledSimulators);
          this.filterNFTsBySimulator(enabledSimulators);
        }
    }

    //filter skins by simulator
    filterSkinsBySimulator(enabledSimulators) {
      
      let filteredListBySimulator = this.state.latestSkins.filter( function(SKIN){
      
          for (let simulator of enabledSimulators) {
               
            let include = (SKIN.info.simulator === simulator.simulator) || simulator.simulator === "All";
            
            if(include) {
              return true;
            }
                  
          }
          return false;
            
        });
  
        
        this.setState({filteredSkins: this.paginate(filteredListBySimulator, this.state.currentPage) })
    }
    

    //filter skinn by price
    filterSkinsByPrice(enabledPrices) {
     
      let filteredListByPrice = this.state.latestSkins.filter( function(SKIN){
      

          let skinPrice = (SKIN.ad.price / priceConversion);
             
             
          for (let tierPrice of enabledPrices) {
                  
            let include = ( skinPrice  > tierPrice.min &&  skinPrice  <= tierPrice.max );
          
            if(include) {
              return true;
            }
          }
          return false;
            
        });
  
        this.setState({filteredSkins: this.paginate(filteredListByPrice, this.state.currentPage)})
    }

    //filter NFTs by simulator
    filterNFTsBySimulator(enabledSimulators) {

       //get all the nfts available
      let filteredListBySimulator = this.state.latestNFTs.filter( function(NFT){
        
        for (let simulator of enabledSimulators) {
           
          let include = ( NFT.simulator  === simulator.simulator) || simulator.simulator === "All";

          if(include) {
            return true;
          }
                
        }
        return false;
          
      });

      this.setState({filteredNFTs: this.paginate(filteredListBySimulator, this.state.currentPage)});
    }

    filterNFTsByPrice(enabledPrices) {

       //get all the nfts available
      let filteredListByPrice = this.state.latestNFTs.filter( function(NFT){
   
        for (let tierPrice of enabledPrices) {
     
          let include = ( NFT.price  > tierPrice.min &&  NFT.price  <= tierPrice.max );
          
          if(include) {
            return true;
          }
                
        }
        return false;
          
      });

      this.setState({filteredNFTs: this.paginate(filteredListByPrice, this.state.currentPage)});
    }

    //filter cars by price
    filterCarsByPrice(enabledPrices) {

      let filteredListByPrice = this.state.latestCars.filter( function(Car){
      

        let carPrice = (Car.ad.price / priceConversion);
           
           
        for (let tierPrice of enabledPrices) {
                
          let include = ( carPrice  > tierPrice.min &&  carPrice  <= tierPrice.max );
        
          if(include) {
            return true;
          }
        }
        return false;
          
      });

      this.setState({filteredCars: this.paginate(filteredListByPrice, this.state.currentPage)})
   }

   filterCarsBySimulator(enabledSimulators) {
      
    let filteredListBySimulator = this.state.latestCars.filter( function(Car){
    
        for (let simulator of enabledSimulators) {
             
          let include = (Car.info.simulator === simulator.simulator) || simulator.simulator === "All";
          
          if(include) {
            return true;
          }
                
        }
        return false;
          
      });


      this.setState({filteredCars: this.paginate(filteredListBySimulator, this.state.currentPage)})
  }



    priceFilterChanged = (event) => {
      
      let filters = this.state.activePriceFilters;
      let enabledPrices = [];
        filters.forEach(filter => {
           if (filter.name === event.target.value) {
            filter.checked =  event.target.checked;
           }
           if(filter.checked) {
             enabledPrices.push(filter);
           }
           
        })

        this.setState({activePriceFilters: filters})

        //nothing to show, all price filters disabled
        if(enabledPrices.length === 0) {
          this.setState({filteredNFTs : [], filteredSkins: [], filteredCars: [], numPages: 1, currentPage: 1});
        } else {

          this.filterSkinsByPrice(enabledPrices);
          this.filterCarsByPrice(enabledPrices);
          this.filterNFTsByPrice(enabledPrices);
        }


        
    }

    //reset filtering by price
    resetPriceFilters() {

      let filtersPrice = this.state.activePriceFilters;
      filtersPrice.forEach(filter => {
        filter.checked = true;
      })

      this.setState({activePriceFilters: filtersPrice});

      if(filtersPrice.length === 0) {
        this.setState({filteredNFTs : [], filteredSkins: [], filteredCars: [], numPages: 1, currentPage: 1});
      } else {

        this.filterSkinsByPrice(filtersPrice);
        this.filterNFTsByPrice(filtersPrice);
        this.filterCarsByPrice(filtersPrice);
      }
    }

    //reset filtering by simulator
    resetSimulatorsFilters() {

      let filtersSimulators = this.state.activeSimulatorsFilter;
      filtersSimulators.forEach(filter => {
        filter.checked = true;
      })

      this.setState({activeSimulatorsFilter: filtersSimulators});

      if(filtersSimulators.length === 0) {
        this.setState({filteredNFTs : [], filteredSkins: [],filteredCars: [], numPages: 1, currentPage: 1});
      } else {

        this.filterSkinsBySimulator(filtersSimulators);
        this.filterNFTsBySimulator(filtersSimulators);
        this.filterCarsBySimulator(filtersSimulators);
      }
    }


    //reset all filters
    resetFilters = (event) => {
      
      event.preventDefault();
      this.setState({searchQuery: ""});
      this.resetPriceFilters();
      this.resetSimulatorsFilters();

      
    }

  
    /**
     * Additional filtering based on any search stri
     * @param {*} queryString 
     * @param {*} NFT 
     * @returns 
     */
    shouldIncludeNFTBySearchQuery(queryString, NFT) {


        let series = NFT.series;
        let simulator = NFT.simulator;                 
        let name = NFT.name;
        let description = NFT.description;
        console.log("series: " + series + " simulator: " + simulator + " name: " + name + " description: " + description + " query: " + queryString);
        if ( 
          (series && series.toLowerCase().indexOf(queryString)>-1) ||
            (simulator && simulator.toLowerCase().indexOf(queryString)>-1) || 
            (name && name.toLowerCase().indexOf(queryString)>-1) ||
            (description && description.toLowerCase().indexOf(queryString)>-1 )
          ) {
            return true;
          }
        return false;

    }

    /**
     * 
     * @param {*} queryString 
     * @param {*} CAR 
     * @returns 
     */
    shouldIncludeCarBySearchQuery(queryString, CAR) {


      let carBrand = CAR.info.carBrand
      let simulator = CAR.info.simulator
      let series = CAR.info.series
      let description = CAR.info.description

      if ( 
        (series && series.toLowerCase().indexOf(queryString)>-1) ||
          (simulator && simulator.toLowerCase().indexOf(queryString)>-1) || 
          (carBrand && carBrand.toLowerCase().indexOf(queryString)>-1) ||
          (description && description.toLowerCase().indexOf(queryString)>-1 )
        ) {
          return true;
        }
      return false;

    }

    /**
     * 
     * @param {*} queryString 
     * @param {*} SKIN 
     * @returns 
     */
    shouldIncludeSkinBySearchQuery(queryString, SKIN) {

      let carBrand = SKIN.info.carBrand
      let simulator = SKIN.info.simulator

      if ( (simulator && simulator.toLowerCase().indexOf(queryString)>-1) ||  (carBrand && carBrand.toLowerCase().indexOf(queryString)>-1) ) {
          return true;
        }
      return false;

  }

    //if has filter, just filter by serach query, any other filtering wipes out 
    //https://stackoverflow.com/questions/24806772/how-to-skip-over-an-element-in-map
    hasSearchFilter() {
      const searchParams = new URLSearchParams(window.location.search);
      if(searchParams) {
        const query = searchParams.get('q');
        if(query) {
          searchParams.delete("q");
          return query;
        }
     
      }
      return null;
    }

    changeActivePage(evt,pageNum) {
      evt.preventDefault();
      console.log("PAGE NUM: " + pageNum);
      let arrayPaginatedNFTS = this.paginate(this.state.latestNFTs, pageNum);
      let arrayPaginatedCars = this.paginate(this.state.latestCars, pageNum);
      let arrayPaginatedSkins = this.paginate(this.state.latestSkins, pageNum);
      
      this.setState({currentPage: pageNum, filteredNFTs: arrayPaginatedNFTS, filteredCars: arrayPaginatedCars, filteredSkins: arrayPaginatedSkins});
    }

    moveNextPage(evt) {
      evt.preventDefault();
      let currPage = this.state.currentPage;
      if(currPage>= this.state.numPages) {
        //go to first
        currPage = 1;
      } else {
        currPage = currPage + 1;
      }

      console.log("GO TO NEXT PAGE: " + currPage);

      let arrayPaginatedNFTS = this.paginate(this.state.latestNFTs, currPage);
      let arrayPaginatedCars = this.paginate(this.state.latestCars, currPage);
      let arrayPaginatedSkins = this.paginate(this.state.latestSkins, currPage);
      
      this.setState({currentPage: currPage, filteredNFTs: arrayPaginatedNFTS, filteredCars: arrayPaginatedCars, filteredSkins: arrayPaginatedSkins});
    }

    movePreviousPage(evt) {
      evt.preventDefault();
      let currPage = this.state.currentPage;
      if(currPage <= 1) {
        //go to last
        currPage = this.state.numPages;
      } else {
        currPage = currPage - 1;
      }

      console.log("GO TO PREVIOUS PAGE: " + currPage);

      let arrayPaginatedNFTS = this.paginate(this.state.latestNFTs, currPage);
      let arrayPaginatedCars = this.paginate(this.state.latestCars, currPage);
      let arrayPaginatedSkins = this.paginate(this.state.latestSkins, currPage);
      
      this.setState({currentPage: currPage, filteredNFTs: arrayPaginatedNFTS, filteredCars: arrayPaginatedCars, filteredSkins: arrayPaginatedSkins});
    }

    renderPagination = (suffix) => {
        //provide unique identifiers for <li> elements
        let previousKey = "pageprevious_" + suffix;
        let page_1_Key = "page1_" + suffix;
        let page_2_Key = "page2_" + suffix;
        let page_3_Key = "page3_" + suffix;
        let nextKey = "pagenext_" + suffix;
        return <nav className="mt-4 pt-4 border-top border-secondary" aria-label="Page navigation">
                  <ul className="pagination justify-content-end">
                    {this.state.numPages > 1 &&
                    <li key={previousKey} className="page-item">
                    <a className="page-link" href="#" onClick={(e) => this.movePreviousPage(e)} aria-label="Previous">
                      {/*<!--<span className="ti-angle-left small-7" aria-hidden="true"></span>
                      <span className="sr-only">Previous</span>-->*/}
                      &lt;
                    </a>
                    </li>
                    }
                    <li key={page_1_Key} className={`page-item ${this.state.currentPage === 1 ? 'active' : ''}`}><a className="page-link" href="#" onClick={(e) => this.changeActivePage(e,1)}>1</a></li>
                    {this.state.numPages >=2 &&
                    <li key={page_2_Key} className={`page-item ${this.state.currentPage === 2 ? 'active' : ''}`}><a className="page-link" href="#" onClick={(e) => this.changeActivePage(e,2)}>2</a></li>
                    }
                    {this.state.numPages >=3 &&
                    <li key={page_3_Key} className={`page-item ${this.state.currentPage === 3 ? 'active' : ''}`}><a className="page-link" href="#" onClick={(e) => this.changeActivePage(e,3)}>3</a></li>
                    }
                    {this.state.numPages > 1 &&
                    <li key={nextKey} className="page-item">
                      <a className="page-link" href="#" onClick={(e) => this.moveNextPage(e)} aria-label="Next">
                        {/*<!--<span className="ti-angle-right small-7" aria-hidden="true"></span>
                        <span className="sr-only">Next</span>-->*/}
                        &gt;
                      </a>
                    </li>
                    }
                  </ul>
                </nav>
    }

    performBuyItemRedirection() {
      return (<Redirect
            to={{
                pathname: "/item",
                state: {
                    selectedItemId: this.state.selectedItemId,
                    selectedTrack: this.state.selectedTrack,
                    selectedSimulator: this.state.selectedSimulator,
                    selectedSeason: this.state.selectedSeason,
                    selectedSeries: this.state.selectedSeries,
                    selectedDescription: this.state.selectedDescription,
                    selectedPrice: this.state.selectedPrice,
                    selectedCarBrand: this.state.selectedCarBrand,
                    imagePath: this.state.selectedImagePath,
                    vendorAddress: this.state.vendorAddress,
                    vendorNickname: this.state.vendorNickname,
                    ipfsPath: this.state.ipfsPath,
                    isNFT: this.state.isNFT,
                }
            }}
        />)
    }

    //Obs: this function was way to many paramaters, bette make a JSON object/payload maybe?
    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, imagePath, isNFT) =>{
      event.preventDefault();
     
      this.setState({
          redirectBuyItem: true,
          selectedItemId: itemId,
          selectedTrack: track,
          selectedSimulator: simulator,
          selectedSeason: season,
          selectedSeries: series,
          selectedDescription: description,
          selectedPrice: price,
          selectedCarBrand: carBrand,
          selectedImagePath: imagePath,
          vendorAddress: address,
          vendorNickname: address ? await this.state.contract.methods.getNickname(address).call() : "",
          ipfsPath: ipfsPath,
          isNFT: isNFT,
      });
  
    }


    render() {

      //const name = this.props.location.;
      //const name = new URLSearchParams(search).get('q');

      //alert("name " + name);

      //we might want to add additional redirections later, so maybe better specific functions?
      if (this.state.redirectBuyItem) {

       return this.performBuyItemRedirection();
      }
      

      return (
            
    <div className="page-body">
    {/*    
    <!-- Start Navbar -->
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3">
      <div className="container">
        <div className="row">
          <div className="col-4 col-sm-3 col-md-2 mr-auto">
            <a className="navbar-brand logo" href="main.html">
              <img src="assets/img/logo-gaming.png" alt="Wicodus" className="logo-light mx-auto">
            </a>
          </div>
          <div className="col-4 d-none d-lg-block mx-auto">
            <form className="input-group border-0 bg-transparent">
              <input className="form-control" type="search" placeholder="Search" aria-label="Search">
              <div className="input-group-append">
                <button className="btn btn-sm btn-warning text-secondary my-0 mx-0" type="submit"><i className="fas fa-search"></i></button>
              </div>
            </form>
          </div>
          <div className="col-8 col-sm-8 col-md-8 col-lg-6 col-xl-4 ml-auto text-right">
            <a className="btn btn-sm btn-warning text-secondary mr-2" href="store.html#" data-toggle="modal" data-target="#userLogin">Sign in</a>
            <a className="btn btn-sm text-light d-none d-sm-inline-block" href="main.html">Sign up</a>
            <ul className="nav navbar-nav d-none d-sm-inline-flex flex-row">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle small" href="store.html#" id="dropdownGaming" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i className="mr-2 fas fa-globe"></i>EN </a>
                <div className="dropdown-menu position-absolute" aria-labelledby="dropdownGaming">
                  <a className="dropdown-item" href="main.html">English</a>
                  <a className="dropdown-item" href="main.html">Deutsch</a>
                  <a className="dropdown-item" href="main.html">Español</a>
                </div>
              </li>
              <li className="nav-item">
                <a className="nav-link small" href="" data-toggle="offcanvas" data-target="#offcanvas-cart">
                  <span className="p-relative d-inline-flex">
                    <span className="badge-cart badge badge-counter badge-warning position-absolute l-1">2</span>
                    <i className="fas fa-shopping-cart"></i>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <button className="navbar-toggler navbar-toggler-fixed" type="button" data-toggle="collapse" data-target="#collapsingNavbar" aria-controls="collapsingNavbar" aria-expanded="false" aria-label="Toggle navigation">☰</button>
        <div className="collapse navbar-collapse" id="collapsingNavbar">
          <ul className="navbar-nav">
            <li className="nav-item dropdown dropdown-hover">
              <a className="nav-link dropdown-toggle pl-lg-0" href="store-product.html" id="dropdownGaming_games" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Games </a>
              <div className="dropdown-menu dropdown-menu-dark-lg" aria-labelledby="dropdownGaming_games">
                <a className="dropdown-item" href="store.html">Action</a>
                <a className="dropdown-item" href="store.html">Adventure</a>
                <a className="dropdown-item" href="store.html">Cooperative</a>
                <a className="dropdown-item" href="store.html">MMO</a>
                <a className="dropdown-item" href="store.html">RPG</a>
                <a className="dropdown-item" href="store.html">Simulation</a>
                <a className="dropdown-item" href="store.html">Economy</a>
                <a className="dropdown-item" href="store.html">Horror</a>
                <a className="dropdown-item" href="store.html">Arcade</a>
                <a className="dropdown-item" href="store.html">Hack & Slash</a>
                <a className="dropdown-item" href="store.html">Puzzle</a>
              </div>
            </li>
            <li className="nav-item dropdown dropdown-hover">
              <a className="nav-link dropdown-toggle" href="store.html" id="dropdownGaming_software" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Software </a>
              <div className="dropdown-menu dropdown-menu-dark-lg" aria-labelledby="dropdownGaming_software">
                <a className="dropdown-item" href="store.html">Animation & Modeling</a>
                <a className="dropdown-item" href="store.html">Audio Production</a>
                <a className="dropdown-item" href="store.html">Design & Illustration</a>
                <a className="dropdown-item" href="store.html">Education</a>
                <a className="dropdown-item" href="store.html">Game Development</a>
                <a className="dropdown-item" href="store.html">Photo Editing</a>
                <a className="dropdown-item" href="store.html">Utilities</a>
                <a className="dropdown-item" href="store.html">Video Production</a>
                <a className="dropdown-item" href="store.html">Web Publishing</a>
              </div>
            </li>
            <li className="nav-item dropdown dropdown-hover">
              <a className="nav-link dropdown-toggle" href="news.html" id="dropdownGaming_community" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Community </a>
              <div className="dropdown-menu dropdown-menu-dark-lg" aria-labelledby="dropdownGaming_community">
                <a className="dropdown-item" href="news.html">Discussions</a>
                <a className="dropdown-item" href="news.html">Workshop</a>
                <a className="dropdown-item" href="news.html">Market</a>
                <a className="dropdown-item" href="news.html">Broadcasts</a>
              </div>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="about.html">About</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="contact.html">Support</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <!-- /.End Navbar -->
    */}

 {/*<!-- Start Main Content -->*/}
    <main className="main-content">

      {/*<!-- Start Content Area -->*/}
      <section className="content-section top_sellers carousel-spotlight ig-carousel pt-8 text-light">
        <div className="container">
          <header className="header">
            <h2>Items</h2>
            <div className="navigation-aligned-right">
             {this.renderPagination('top')}
            </div>
          </header>
          <div className="position-relative">
            <div className="row">
              <div className="col-lg-8">
                {/*<!-- nav tabs -->*/}
                <ul className="spotlight-tabs spotlight-tabs-dark nav nav-tabs border-0 mb-5 position-relative flex-nowrap" id="most_popular_products-carousel-01" role="tablist">
                  <li key="ownership" className="nav-item text-fnwp position-relative">
                    <a className="nav-link active show" id="mp-2-01-tab" data-toggle="tab" href="#mp-2-01-c" role="tab" aria-controls="mp-2-01-c" aria-selected="true">Car Ownership NFTs</a>
                  </li>
                  <li key="carsetup" className="nav-item text-fnwp position-relative"> 
                    <a className="nav-link" id="mp-2-02-tab" data-toggle="tab" href="#mp-2-02-c" role="tab" aria-controls="mp-2-02-c" aria-selected="false">Car Setups</a>
                  </li>
                  <li key="carskins" className="nav-item text-fnwp position-relative"> 
                    <a className="nav-link" id="mp-2-03-tab" data-toggle="tab" href="#mp-2-03-c" role="tab" aria-controls="mp-2-03-c" aria-selected="false">Car Skins</a>
                  </li>
                </ul>
                {/*<!-- tab panes -->*/}
                <div id="color_sel_Carousel-content_02" className="tab-content position-relative w-100">
                  {/*<!-- tab item -->*/}
                  <div className="tab-pane fade active show" id="mp-2-01-c" role="tabpanel" aria-labelledby="mp-2-01-tab">
                    <div className="row">
                      
                  
                      {/*<!-- item -->*/}
                      {/*<div className="col-md-12 mb-4">
                        <a href="store-product.html" className="product-item">
                          <div className="row align-items-center no-gutters">
                            <div className="item_img d-none d-sm-block">
                              <img className="img bl-3 text-primary" src="assets/img/content/store/h-01.jpg" alt="Games Store"/>
                            </div>
                            <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                              <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">Creature 2020</h6>
                              <div className="mb-0">
                                <i className="mr-2 fab fa-windows"></i>
                                <i className="mr-2 fab fa-steam"></i>
                                <i className="fab fa-apple"></i>
                              </div>
                              <div className="position-relative">
                                <span className="item_genre small fw-600">
                                  Drama, Story Rich, Adventure
                                </span>
                              </div>
                            </div>
                            <div className="item_discount d-none d-sm-block">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right text-secondary px-6">
                                  <span className="fw-600 btn bg-warning">-22%</span>
                                </div>
                              </div>
                            </div>
                            <div className="item_price">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right">
                                  <span className="fw-600 td-lt">€99.99</span><br/>
                                  <span className="fw-600">€84.99</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                        </div>*/}
                      {/*<!-- /.item -->*/}
                      {/*<!-- item -->*/}


                            {this.state.filteredNFTs.map(function(value, index){
                                
                                let series = value.series;
                                let simulator = value.simulator;
                                let price = value.price * priceConversion;
                                //TODO: change hardcode
                                let address = value.seriesOwner;
                                let itemId = value.id;
                                let key = itemId + "_" + index
                                let image = value.image;
                                let carNumber = value.carNumber;
                                let name = value.name;
                                let imagePath = value.image;
                                let description = value.description;
                                /*let payload = {
                                  itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true
                                }*/
                                return <div className="col-md-12 mb-4" key={key}>
                                <a href="#1" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true)} className="product-item">
                                  <div className="row align-items-center no-gutters">
                                    <div className="item_img d-none d-sm-block">
                                      <img className="img bl-3 text-primary" src={image} alt="Games Store"/>
                                    </div>
                                    <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                                      <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">Series: {series}</h6>

                                      <div className="position-relative">
                                        <span className="item_genre small fw-600">
                                        Simulator: {simulator}
                                        </span>
                                      </div>
                                      {/* 
                                      <div className="mb-0">
                                        <i className="mr-2 fab fa-windows"></i>
                                        <i className="mr-2 fab fa-steam"></i>
                                        <i className="fab fa-apple"></i>
                                      </div>
                                     */}
                                     <div className="position-relative">
                                        <span className="item_genre small fw-600">
                                        Car number: {carNumber}
                                        </span>
                                      </div>
                                      <div className="position-relative">
                                        <span className="item_genre small fw-600">
                                          {description}
                                        </span>
                                      </div>
                                    </div>
                                    {/*<div className="item_discount d-none d-sm-block">
                                      <div className="row align-items-center h-100 no-gutters">
                                        <div className="text-right text-secondary px-6">
                                          <span className="fw-600 btn bg-warning">-22%</span>
                                        </div>
                                      </div>
                                    </div>*/}
                                    <div className="item_price">
                                      <div className="row align-items-center h-100 no-gutters">
                                        <div className="text-right">
                                          <span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>
                                          <span className="fw-600">{price / priceConversion} ETH</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </a>
                                </div>
                           
                
                            }, this)} {/*Obs: need to pass the context to the map function*/}
                        
                            
                       

                      {/*<div className="col-md-12 mb-4">
                        <a href="store-product.html" className="product-item">
                          <div className="row align-items-center no-gutters">
                            <div className="item_img d-none d-sm-block">
                              <img className="img bl-3 text-primary" src="assets/img/content/store/h-02.jpg" alt="Games Store"/>
                            </div>
                            <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                              <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">Shadow Leap</h6>
                              <div className="mb-0">
                                <i className="mr-2 fab fa-windows"></i>
                                <i className="mr-2 fab fa-steam"></i>
                                <i className="fab fa-apple"></i>
                              </div>
                              <div className="position-relative">
                                <span className="item_genre small fw-600">
                                  Action, Adventure
                                </span>
                              </div>
                            </div>
                            <div className="item_discount d-none d-sm-block">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right text-secondary px-6">
                                  <span className="fw-600 btn bg-warning">-43%</span>
                                </div>
                              </div>
                            </div>
                            <div className="item_price">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right">
                                  <span className="fw-600 td-lt">€72.99</span><br/>
                                  <span className="fw-600">€34.99</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>*/}
                      {/*<!-- /.item -->*/}
                      {/*<!-- item -->*/}
                      {/*<div className="col-md-12 mb-4">
                        <a href="store-product.html" className="product-item">
                          <div className="row align-items-center no-gutters">
                            <div className="item_img d-none d-sm-block">
                              <img className="img bl-3 text-primary" src="assets/img/content/store/h-07.jpg" alt="Games Store"/>
                            </div>
                            <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                              <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">Haku RE</h6>
                              <div className="mb-0">
                                <i className="mr-2 fab fa-windows"></i>
                                <i className="mr-2 fab fa-steam"></i>
                                <i className="fab fa-apple"></i>
                              </div>
                              <div className="position-relative">
                                <span className="item_genre small fw-600">
                                  Action, RPG, Pixel Graphics
                                </span>
                              </div>
                            </div>
                            <div className="item_discount d-none d-sm-block">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right text-secondary px-6">
                                  <span className="fw-600 btn bg-warning">-10%</span>
                                </div>
                              </div>
                            </div>
                            <div className="item_price">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right">
                                  <span className="fw-600 td-lt">€10.99</span><br/>
                                  <span className="fw-600">€3.29</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                        </div>*/}
                      {/*<!-- /.item -->*/}
                    </div>
                  </div>
                  {/*<!-- tab item -->*/}

                  {/*<!-- tab item -->*/}
                  <div className="tab-pane fade" id="mp-2-02-c" role="tabpanel" aria-labelledby="mp-2-02-tab">
                    <div className="row">
                      {/*<!-- item -->*/}
                      {this.state.filteredCars.map(function(value, index){
                                
                            let carBrand = value.info.carBrand
                            let track = value.info.track
                            let simulator = value.info.simulator
                            let season = value.info.season
                            let series = value.info.series
                            let description = value.info.description
                            let price = value.ad.price
                            let address = value.ad.seller
                            let itemId = value.id
                            let key = itemId + "_" + index;
                            let ipfsPath = value.ad.ipfsPath
                            let thumb = "assets/img/sims/"+simulator+".png";
                            /*
                            <div><b>Track:</b> {track}</div>
                            <div><b>Simulator:</b> {simulator}</div>
                            <div><b>Season:</b> {season}</div>
                            <div><b>Price:</b> {price / priceConversion} ETH</div>
                            */
                           return <div className="col-md-12 mb-4" key={key}>
                           <a href="#2" onClick={(e) => this.buyItem(e, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, "", false)} className="product-item">
                             <div className="row align-items-center no-gutters">
                               <div className="item_img d-none d-sm-block">
                                 <img className="img bl-3 text-primary" src={thumb} alt=""/>
                               </div>
                               <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                                 <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">{carBrand}</h6> 
                                 {/*<div className="mb-0">
                                   <i className="mr-2 fab fa-windows"></i>
                                   <i className="mr-2 fab fa-steam"></i>
                                   <i className="fab fa-apple"></i>
                                 </div>*/}
                                 <div className="position-relative">
                                   <span className="item_genre small fw-600">
                                     Track: {track}
                                   </span>
                                 </div>
                                 <div className="position-relative">
                                   <span className="item_genre small fw-600">
                                   Simulator: {simulator}
                                   </span>
                                 </div>
                                 <div className="position-relative">
                                   <span className="item_genre small fw-600">
                                   Season: {season}
                                   </span>
                                 </div>
                               </div>
                               {/*<div className="item_discount d-none d-sm-block">
                                 <div className="row align-items-center h-100 no-gutters">
                                   <div className="text-right text-secondary px-6">
                                     <span className="fw-600 btn bg-warning">-10%</span>
                                   </div>
                                 </div>
                               </div>*/}
                               <div className="item_price">
                                 <div className="row align-items-center h-100 no-gutters">
                                   <div className="text-right">
                                     <span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>
                                     <span className="fw-600">{price / priceConversion} ETH</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </a>
                         </div> 
                      },this)}

                      
                      {/*<!-- /.item -->*/}
                      {/*<!-- item -->*/}
                    
                    </div>
                  </div>

                  {/*<!-- tab item -->*/}
                  <div className="tab-pane fade" id="mp-2-03-c" role="tabpanel" aria-labelledby="mp-2-03-tab">
                    <div className="row">
                      {/*<!-- item -->*/}
                      {/*
                      <div className="col-md-12 mb-4">
                        <a href="store-product.html" className="product-item">
                          <div className="row align-items-center no-gutters">
                            <div className="item_img d-none d-sm-block">
                              <img className="img bl-3 text-primary" src="assets/img/content/store/h-08.jpg" alt="Games Store"/>
                            </div>
                            <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                              <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">Journey of the Solarcity</h6> 
                              <div className="mb-0">
                                <i className="mr-2 fab fa-windows"></i>
                                <i className="mr-2 fab fa-steam"></i>
                                <i className="fab fa-apple"></i>
                              </div>
                              <div className="position-relative">
                                <span className="item_genre small fw-600">
                                  Action, Adventure
                                </span>
                              </div>
                            </div>
                            <div className="item_discount d-none d-sm-block">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right text-secondary px-6">
                                  <span className="fw-600 btn bg-warning">-10%</span>
                                </div>
                              </div>
                            </div>
                            <div className="item_price">
                              <div className="row align-items-center h-100 no-gutters">
                                <div className="text-right">
                                  <span className="fw-600 td-lt">€27.99</span><br/>
                                  <span className="fw-600">€23.99</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                      */}
                        {this.state.filteredSkins.map(function(value, index) {

                                    let carBrand = value.info.carBrand
                                    let simulator = value.info.simulator
                                    
                                    let price = value.ad.price
                                    let address = value.ad.seller
                                    let itemId = value.id
                                    let key = itemId + "_" + index;
                                    let ipfsPath = value.ad.ipfsPath
                                    let imagePath = "https://ipfs.io/ipfs/" + value.info.skinPic
                                    let thumb = "assets/img/sims/"+simulator+".png";
                                    
                                    return <div className="col-md-12 mb-4" key={key}>
                                        <a href="#3" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, null, null, price, carBrand , address, ipfsPath, imagePath, false)} className="product-item">
                                        <div className="row align-items-center no-gutters">
                                            <div className="item_img d-none d-sm-block">
                                            <img className="img bl-3 text-primary" src={thumb} alt="Games Store"/>
                                            </div>
                                            <div className="item_content flex-1 flex-grow pl-0 pl-sm-6 pr-6">
                                            <h6 className="item_title ls-1 small-1 fw-600 text-uppercase mb-1">{carBrand}</h6> 
                                            {/*
                                                <div className="mb-0">
                                                <i className="mr-2 fab fa-windows"></i>
                                                <i className="mr-2 fab fa-steam"></i>
                                                <i className="fab fa-apple"></i>
                                                </div>
                                            */}
                                            <div className="position-relative">
                                                <span className="item_genre small fw-600">
                                                {simulator}
                                                </span>
                                            </div>
                                            </div>
                                            {/*<div className="item_discount d-none d-sm-block">
                                            <div className="row align-items-center h-100 no-gutters">
                                                <div className="text-right text-secondary px-6">
                                                <span className="fw-600 btn bg-warning">-10%</span>
                                                </div>
                                            </div>
                                            </div>*/}
                                            <div className="item_price">
                                            <div className="row align-items-center h-100 no-gutters">
                                                <div className="text-right">
                                                <span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>
                                                <span className="fw-600">{price / priceConversion} ETH</span>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                        </a>
                                    </div>
                            },this)}
                      {/*<!-- /.item -->*/}
                      {/*<!-- item -->*/}
                      
                    </div>
                  </div>
                </div>

                {/*<!-- pagination -->*/}
                {this.renderPagination('bottom')}
                {/*<!-- /.pagination -->*/}
              </div>
              <div className="col-lg-4">
                <div className="filters border border-secondary rounded p-4">
                  <ul className="sidebar-nav-light-hover list-unstyled mb-0 text-unset small-3 fw-600">

                    <li key="collapsesimulators" className="nav-item text-light transition mb-2 active">
                      <a href="/store" aria-expanded="false" data-toggle="collapse" className="nav-link py-2 px-3 text-uppercase collapsed collapser nav-link-border collapser-active">
                          <span className="p-collapsing-title">Simulators</span>
                      </a>
                      <div className="collapse nav-collapse show">
                          <ul className="list-unstyled py-2">

                          {this.state.activeSimulatorsFilter.map( ({simulator, checked}, index) => {
                            let elemName = index + "_sim_" + simulator;
                            let idKey = index + "_" + simulator;
                              return <li key={idKey} className="nav-item">
                                  <div className="nav-link py-2 px-3">
                                    <form>
                                      <div className="custom-control custom-checkbox">
                                        <input className="custom-control-input" type="checkbox" onChange={this.simulatorsFilterChanged} checked={checked} name={elemName} value={simulator} id={elemName}/>
                                        <label className="custom-control-label" htmlFor={elemName}>
                                          {simulator}
                                        </label>
                                      </div>
                                    </form>
                                  </div>
                                </li>
                          }, this)}
                          </ul>
                      </div>
                    </li>
                    <li key="collapseprice" className="nav-item text-light transition mb-2">
                      <a href="/store" aria-expanded="false" data-toggle="collapse" className="nav-link py-2 px-3 text-uppercase collapsed collapser nav-link-border collapser-active">
                          <span className="p-collapsing-title">Price</span>
                      </a>
                      <div className="collapse nav-collapse show">

                          <ul className="list-unstyled py-2">

                          {this.state.activePriceFilters.map( ({name, checked, label, min, max}, index) => {
                            let elemName = index + "_price_" + name;
                            let idKey = index + "_" + name;
                            return <li key={idKey} className="nav-item">
                              <div className="nav-link py-2 px-3">
                                <form>
                                  <div className="custom-control custom-checkbox">
                                    <input className="custom-control-input" type="checkbox"  onChange={this.priceFilterChanged} checked={checked} value={name} name={elemName} id={elemName}/>
                                    <label className="custom-control-label" htmlFor={elemName}>
                                     {label}
                                    </label>
                                  </div>
                                </form>
                              </div>
                            </li>
                          },this)}
                            
                          </ul>
                      </div>
                    </li>
                
                    
                    <li key="resetfilter" className="nav-item text-light transition mt-4">
                      <a href="#" onClick={this.resetFilters} className="btn btn-warning d-block">Reset Filter</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </section>
      {/*<!-- /.End Content Area -->*/}

    </main>

   

    {/*<!-- Sign Up -->*/}
    {/*
    <div className="modal fade" id="userLogin" tabindex="-1" role="dialog" aria-labelledby="userLoginTitle" aria-hidden="true">
      <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div className="modal-content bg-dark text-light">
          <div className="modal-header border-secondary">
            <h5 className="modal-title" id="userLoginTitle">Log in</h5>
            <button type="button" className="close text-light" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div>
              <div className="text-center my-6"> 
                <a className="btn btn-circle btn-sm btn-google mr-2" href=""><i className="fab fa-google"></i></a>
                <a className="btn btn-circle btn-sm btn-facebook mr-2" href=""><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-circle btn-sm btn-twitter" href=""><i className="fab fa-twitter"></i></a>
              </div>
              <span className="hr-text small my-6">Or</span>
            </div>
            <form className="input-transparent">
              <div className="form-group">
                <input type="text" className="form-control border-secondary" name="username" placeholder="Username">
              </div>
              <div className="form-group">
                <input type="password" className="form-control border-secondary" name="password" placeholder="Password">
              </div>
              <div className="form-group d-flex justify-content-between">
                <div className="custom-control custom-checkbox">
                  <input type="checkbox" className="custom-control-input" checked="" id="rememberMeCheck">
                  <label className="custom-control-label" htmlFor="rememberMeCheck">Remember me</label> 
                </div>
                <a className="small-3" href="store.html#">Forgot password?</a>
              </div>
              <div className="form-group mt-6">
                <button className="btn btn-block btn-warning" type="submit">Login</button>
              </div>
            </form>
            <span className="small">Don't have an account? <a href="store.html#">Create an account</a></span>
          </div>
        </div>
      </div>
    </div>*/}
    {/*<!-- /.Sign Up -->*/}

    {/*<!-- offcanvas-cart -->*/}
    {/*
    <div id="offcanvas-cart" className="offcanvas-cart offcanvas text-light h-100 r-0 l-auto d-flex flex-column" data-animation="slideRight">
      <div>
        <button type="button" data-toggle="offcanvas-close" className="close float-right ml-4 text-light o-1 fw-100" data-dismiss="offcanvas" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
        <hr className="border-light o-20 mt-8 mb-4">
      </div>
      <div className="offcanvas-cart-body flex-1">
        <div className="offcanvas-cart-list row align-items-center no-gutters">
          <div className="ocs-cart-item col-12">
            <div className="row align-items-center no-gutters">
              <div className="col-3 item_img d-none d-sm-block">
                <a href="store-product.html"><img className="img bl-3 text-primary" src="assets/img/content/store/h-08.jpg" alt="Product"></a>
              </div>
              <div className="col-7 flex-1 flex-grow pl-0 pl-sm-4 pr-4">
                <a href="store-product.html"><span className="d-block item_title text-lt ls-1 lh-1 small-1 fw-600 text-uppercase mb-2">Journey of the Solarcity</span></a>
                <div className="position-relative lh-1">
                  <div className="number-input">
                    <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()" ><i className="ti-minus"></i></button>
                    <input className="quantity" min="0" name="quantity" value="1" type="number">
                    <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()"><i className="ti-plus"></i></button>
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="row align-items-center h-100 no-gutters">
                  <div className="ml-auto text-center">
                    <a href="store.html#"><i className="far fa-trash-alt"></i></a><br>
                    <span className="fw-500 text-warning">€44.99</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ocs-cart-item col-12">
            <div className="row align-items-center no-gutters">
              <div className="col-3 item_img d-none d-sm-block">
                <a href="store-product.html"><img className="img bl-3 text-primary" src="assets/img/content/store/h-09.jpg" alt="Product"></a>
              </div>
              <div className="col-7 flex-1 flex-grow pl-0 pl-sm-4 pr-4">
                <a href="store-product.html"><span className="d-block item_title text-lt ls-1 lh-1 small-1 fw-600 text-uppercase mb-2">Exploration Memories</span></a>
                <div className="position-relative lh-1">
                  <div className="number-input">
                    <button onclick="this.parentNode.querySelector('input[type=number]').stepDown()" ><i className="ti-minus"></i></button>
                    <input className="quantity" min="0" name="quantity" value="1" type="number">
                    <button onclick="this.parentNode.querySelector('input[type=number]').stepUp()"><i className="ti-plus"></i></button>
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="row align-items-center h-100 no-gutters">
                  <div className="ml-auto text-center">
                    <a href="store.html#"><i className="far fa-trash-alt"></i></a><br>
                    <span className="fw-500 text-warning">€27.59</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <a href="checkout-order.html" className="btn btn-lg btn-block btn-outline-light">View cart</a>
      </div>
    </div>*/}

    {/*
    <!-- /.offcanvas-cart -->

    <!-- jQuery -->
    <script src="assets/js/jquery.min.js"></script>

    <!-- Bootstrap -->
    <script src="assets/js/bootstrap.min.js"></script>

    <!-- User JS -->
    <script src="assets/js/scripts.js"></script>

    <!-- Main JS -->*/}
    <script src="assets/js/main.js" id="_mainJS" data-plugins="load"></script>
    </div>


        );
    }
}


export default StorePage;