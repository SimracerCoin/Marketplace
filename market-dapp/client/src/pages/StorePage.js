/* eslint-disable no-loop-func */
import React, { Component } from 'react';
import { Redirect } from "react-router-dom";
import { withRouter } from "react-router";
import * as $ from 'jquery';
import UIHelper from "../utils/uihelper";

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
            
            latestMomentNFTs: [], //contains all the nfts returned by the contracts
            filteredMomentNFTs: [], // list of nfst but filtered

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
            priceStep: 0.0001,
            priceMin: 0,
            priceMinDefault: 0,
            priceMax: 10000,
            priceMaxDefault: 10000,

            //just as reference, we can define others intervals if needed
            //activePriceFilters: [
            //  {name: "min", label: "min", default_value: 0.00000001, value: 0.00000001},
            //  {name: "max", label: "max", default_value: 100000000, value: 100000000}
            //],
            searchQuery: "",
            //searchRef: props.searchRef //search field
        }

        // This binding is necessary to make `this` work in the callback
       //this.simulatorsFilterChanged = this.simulatorsFilterChanged.bind(this);

    }

    

    //-----------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------
    componentWillMount() {
      this.unlisten = this.props.history.listen((location, action) => {
        localStorage.removeItem('searchQuery');
      });
    }
    componentWillUnmount = async () => {
      this.unlisten();
    }
    componentDidMount = async () => {

      console.log("STORE: componentDidMount");

       UIHelper.showSpinning("loading ...");

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

        
        let simsList = [];
        let simulatorsFilter = [];
        simulatorsFilter.push(this.state.activeSimulatorsFilter[0]);

        //use search params?
        let queryString = this.state.searchQuery;
        const considerSearchQuery = (queryString && queryString.length > 0);

        const nftlist = [];
        // get info from marketplace NFT contract
        const numNfts = await contractNFTs.methods.currentTokenId().call();
        console.log('ownership nft count:' + numNfts);
        //TODO this number can be misleading because we do not parse them all (only => if(ownerAddress === contractNFTs.address) )


        //if there is a serach in place
        //by default include all items
        let filteredNFTsList = [];
        let filteredCarsList = response_cars;
        let filteredSkinsList = response_skins;

        let maxElems, maxElems2 = 0;


        //by default on load, these filtered lists inlcude all the items, unless we are searching for somethign specific
        if(considerSearchQuery){
          filteredCarsList = filteredCarsList.filter(value => {
            
            return this.shouldIncludeCarBySearchQuery(queryString.toLowerCase(), value);

          });

          filteredSkinsList = filteredSkinsList.filter(value => {
            return this.shouldIncludeSkinBySearchQuery(queryString.toLowerCase(), value);
          });
        } 

    //--------------------------------------------------------------------------


       

    //-------------------------- MOMENT NFTS -----------------------------------
    

    const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;

    const momentNftslist = [];
    // get info from marketplace NFT contract
    const numMomentNfts = await contractMomentNFTs.methods.currentTokenId().call();
    console.log('moment nft count:' + numMomentNfts);

    let filteredMomentNFTsList = [];

    let max = parseInt(numMomentNfts) + 1;


    //--------------------------------------------------------------------------
      
      for (let i = 1; i < max; i++) {
        try {
            //TODO: change for different ids
            let ownerAddress = await contractMomentNFTs.methods.ownerOf(i).call();
            console.log('ID:'+i+'ownerAddress: '+ownerAddress.toString()+'nfts addr: '+contractMomentNFTs.address);
            if(ownerAddress === contractMomentNFTs.address) {
               
                let uri = await contractMomentNFTs.methods.tokenURI(i).call();
                console.log('uri: ', uri);
                var xmlhttp = new XMLHttpRequest();
                xmlhttp.onload = function(e) {
                    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                        var data = JSON.parse(xmlhttp.responseText);
                        
                        console.log('moment nft name:' + data.name);
                        console.log('moment nft image:' + data.image);
                        console.log('moment nft description:' + data.description);
                        data.id=i;

                        let metadata = this.extractMomentNFTTraitTypes(data.attributes);
                        //global list of all
                        momentNftslist.push(data);

                        //update the max elements every time, as we will consider this as the 
                        maxElems2 = momentNftslist.length;
                        
                        //only filtered list
                        if(considerSearchQuery && (this.shouldIncludeMomentNFTBySearchQuery(queryString.toLowerCase(), data, metadata)) ){
                          filteredMomentNFTsList.push(data);
                        }//otherwise goes on the default list => nftlist
                        

                        //add simulator if not present already 
                        let simulator = metadata.simulator;
                        if(simulator && !simsList.includes(simulator)) {

                          simsList.push(metadata.simulator);

                          if(!considerSearchQuery ) {
                              simulatorsFilter.push({simulator: simulator, checked: true});
                          } else {

                            //matches query, push and check it
                            if(simulator.toLowerCase().indexOf(queryString.toLowerCase())>-1) {
                              simulatorsFilter.push({simulator: simulator, checked: true});
                            } else {
                              //still push it but disabled
                              simulatorsFilter.push({simulator: simulator, checked: false});
                            }

                            
                          }
                          
                        }

                        //this GET is assync, so we need to recalaculate the pagination after every grab
                            this.recalculatePaginationAndNumPages(maxElems2, maxElems, filteredCarsList, filteredSkinsList, filteredMomentNFTsList);
                        

                            this.setState({ 
                                          latestMomentNFTs: momentNftslist, 
                                          filteredMomentNFTs: considerSearchQuery ? this.paginate(filteredMomentNFTsList, this.state.currentPage): this.paginate(momentNftslist, this.state.currentPage), 
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
      //--------------------------------------------------------------------------
  
        
        //------------------------ Car ownership nfts ------------------------------
        //--------------------------------------------------------------------------
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

                            //only filtered list
                            if(considerSearchQuery && (this.shouldIncludeNFTBySearchQuery(queryString.toLowerCase(), data)) ){
                              filteredNFTsList.push(data);
                            }//otherwise goes on the default list => nftlist
                            

                            //add simulator if not present already 
                            let simulator = data.simulator;
                            if(simulator && !simsList.includes(simulator)) {

                              simsList.push(data.simulator);

                              if(!considerSearchQuery ) {
                                  simulatorsFilter.push({simulator: simulator, checked: true});
                              } else {

                                //matches query, push and check it
                                if(simulator.toLowerCase().indexOf(queryString.toLowerCase())>-1) {
                                  simulatorsFilter.push({simulator: simulator, checked: true});
                                } else {
                                  //still push it but disabled
                                  simulatorsFilter.push({simulator: simulator, checked: false});
                                }

                                
                              }

                              
                            }

                            //this GET is assync, so we need to recalaculate the pagination after every grab
                            this.recalculatePaginationAndNumPages(maxElems2, maxElems, filteredCarsList, filteredSkinsList, filteredMomentNFTsList);
                        

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
        //--------------------------------------------------------------------------

        


        //-------------------
        

        //get the number of elements of the bigger list, use it to define the number of pages, minimum 1
        //NOTE: we might reach this part before processing all NFTS, so we also call this inside the loop above
        this.recalculatePaginationAndNumPages(maxElems2, maxElems, filteredCarsList, filteredSkinsList, filteredMomentNFTsList);
        //these won´t change, set only here
        this.setState(
          { 
          latestCars: response_cars, 
          latestSkins: response_skins, 
          contract: contract, 
          contractNFTs: contractNFTs, 
          contractMomentNFTs: contractMomentNFTs
        });
        
        console.log("END getNFTSData");
        UIHelper.hiddeSpinning();
    }

    //specific for moment NFTS
    extractMomentNFTTraitTypes(attributes) {

      let data = {};
      for(let attribute of attributes) {
          data[attribute.trait_type] = attribute.value;
      }
      return data;
     }

    /**
     * Calculate pagination and set state
     * @param {*} maxElems 
     * @param {*} filteredCarsList 
     * @param {*} filteredSkinsList 
     */
    recalculatePaginationAndNumPages(maxMomentNFTsElems, maxNFTsElems, filteredCarsList, filteredSkinsList,filteredMomentNFTsList) {

      let maxElems = 0;
      if(maxMomentNFTsElems > maxElems) {
        maxElems = maxMomentNFTsElems;
      }

      if(maxNFTsElems > maxElems) {
        maxElems = maxNFTsElems;
      }
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
        filteredMomentNFTs: this.paginate(filteredMomentNFTsList, this.state.currentPage)
        
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
          this.filterMomentNFTsBySimulator(enabledSimulators);
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
    filterSkinsByPrice(priceMin, priceMax) {
     
      let filteredListByPrice = this.state.latestSkins.filter( function(SKIN){
      
          let skinPrice = (SKIN.ad.price / priceConversion);
          return ( skinPrice >= priceMin && skinPrice <= priceMax );
            
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

    //filter Moment NFTs by simulator
    filterMomentNFTsBySimulator(enabledSimulators) {

      //get all the nfts available
     let filteredListBySimulator = this.state.latestMomentNFTs.filter( function(NFT){
       
      let metadata = this.extractMomentNFTTraitTypes(NFT.attributes);

       for (let simulator of enabledSimulators) {
          
         let include = ( metadata.simulator  === simulator.simulator) || simulator.simulator === "All";

         if(include) {
           return true;
         }
               
       }
       return false;
         
     }, this);

     this.setState({filteredNFTs: this.paginate(filteredListBySimulator, this.state.currentPage)});
   }

    filterNFTsByPrice(priceMin, priceMax) {

       //get all the nfts available
      let filteredListByPrice = this.state.latestNFTs.filter( function(NFT){

          return (NFT.price >= priceMin &&  NFT.price <= priceMax );
          
      });

      this.setState({filteredNFTs: this.paginate(filteredListByPrice, this.state.currentPage)});
    }

    filterMomentNFTsByPrice(priceMin, priceMax) {

       //get all the nfts available
      let filteredListByPrice = this.state.latestMomentNFTs.filter( function(NFT){

          let metadata = this.extractMomentNFTTraitTypes(NFT.attributes);
          return (metadata.price >= priceMin &&  metadata.price <= priceMax );
          
      }, this);

      this.setState({filteredNFTs: this.paginate(filteredListByPrice, this.state.currentPage)});
    }

    //filter cars by price
    filterCarsByPrice(priceMin, priceMax) {

      let filteredListByPrice = this.state.latestCars.filter( function(Car){
      
        let carPrice = (Car.ad.price / priceConversion);
        return ( carPrice >= priceMin && carPrice <= priceMax );
          
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


    priceFilterChanged = (event, name) => {

      let { value, min, max } = event.target;
      value = Math.max(Number(min), Math.min(Number(max), Number(value)));
      

      if(name === "min") {
        min = value;
        max = this.state.priceMax;
      } else {
        min = this.state.priceMin;
        max = value;
      }

      this.setState({priceMin: min, priceMax: max});

        this.filterSkinsByPrice(min, max);
        this.filterCarsByPrice(min, max);
        this.filterNFTsByPrice(min, max);
        this.filterMomentNFTsByPrice(min, max);

    }

    //reset filtering by price
    resetPriceFilters() {

      this.setState({priceMin: this.state.priceMinDefault, priceMax: this.state.priceMaxDefault});
  
        this.filterSkinsByPrice(this.state.priceMinDefault, this.state.priceMaxDefault);
        this.filterNFTsByPrice(this.state.priceMinDefault, this.state.priceMaxDefault);
        this.filterMomentNFTsByPrice(this.state.priceMinDefault, this.state.priceMaxDefault);
        this.filterCarsByPrice(this.state.priceMinDefault, this.state.priceMaxDefault);
      
    }

    //reset filtering by simulator
    resetSimulatorsFilters() {

      let filtersSimulators = this.state.activeSimulatorsFilter;
      filtersSimulators.forEach(filter => {
        filter.checked = true;
      })

      this.setState({activeSimulatorsFilter: filtersSimulators});

      if(filtersSimulators.length === 0) {
        this.setState({filteredNFTs : [], filteredMomentNFTs: [], filteredSkins: [],filteredCars: [], numPages: 1, currentPage: 1});
      } else {

        this.filterSkinsBySimulator(filtersSimulators);
        this.filterNFTsBySimulator(filtersSimulators);
        this.filterMomentNFTsBySimulator(filtersSimulators);
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
        //console.log("series: " + series + " simulator: " + simulator + " name: " + name + " description: " + description + " query: " + queryString);
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
     * Additional filtering based on any search stri
     * @param {*} queryString 
     * @param {*} NFT 
     * @returns 
     */
     shouldIncludeMomentNFTBySearchQuery(queryString, NFT, metadata) {


      let series = NFT.series;
      let simulator = NFT.simulator;                 
      let name = NFT.name;
      let description = NFT.description;
      //console.log("series: " + series + " simulator: " + simulator + " name: " + name + " description: " + description + " query: " + queryString);
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
      let similarItems = [];
      if (this.state.isNFT) {
        similarItems = similarItems.concat(this.state.latestNFTs);
      } else if (this.state.selectedTrack == null || this.state.selectedSeason == null) {
        similarItems = similarItems.concat(this.state.latestSkins);
      } else {
        similarItems = similarItems.concat(this.state.latestCars);
      }

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
                    similarItems: similarItems
                }
            }}
        />)
    }

    //Obs: this function was way to many paramaters, bette make a JSON object/payload maybe?
    buyItem = async (event, itemId, track, simulator, season, series, description, price, carBrand, address, ipfsPath, imagePath, isNFT, isMomentNFT) =>{
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
          isMomentNFT: isMomentNFT
      });
  
    }

    getListWithResults = () => {
      if(this.state.filteredNFTs.length > 0) {
        return "ownership";
      }
      if(this.state.filteredCars.length > 0) {
        return "carsetup";
      }

      if(this.state.filteredSkins.length > 0) {
        return "carskins";
      }

      if(this.state.filteredMomentNFTs.length > 0) {
        return "momentnfts";
      }

      return "ownership";
    }

    getActiveClasses = (key) => {

      let queryString = this.state.searchQuery;
      const considerSearchQuery = (queryString && queryString.length > 0);
      if(!considerSearchQuery) {
        if(key === "ownership") {
          return "nav-link active show";
        } else {
          return "nav-link";
        }
      } else {
        let active = this.getListWithResults();
        //consider search
         if(key === active) {
            return "nav-link active show";
         }
         return "nav-link";
      }
     
    }

    getPanelActiveClasses = (key) => {

      let queryString = this.state.searchQuery;
      const considerSearchQuery = (queryString && queryString.length > 0);
      if(!considerSearchQuery) {
        if(key === "ownership") {
          return "tab-pane fade active show";
        } else {
          return "tab-pane fade";
        }
      } else {
        let active = this.getListWithResults();
        //consider search
         if(key === active) {
            return "tab-pane fade active show";
         }
         return "tab-pane fade";
      }
     
    }

    render() {

      //const name = this.props.location.;
      //const name = new URLSearchParams(search).get('q');
      //we might want to add additional redirections later, so maybe better specific functions?
      if (this.state.redirectBuyItem) {

       return this.performBuyItemRedirection();
      }

      return (
            
    <div className="page-body">

 {/*<!-- Start Main Content -->*/}
    <main className="main-content">

      {/*<!-- Start Content Area -->*/}
      <section className="content-section top_sellers carousel-spotlight ig-carousel pt-8 text-light">
        <div className="container">
          <header className="header">
            <h2>Items</h2>
          </header>
          <div className="position-relative">
            <div className="row">
              <div className="col-lg-8">
              <div className="navigation-aligned-right">
                {this.renderPagination('top')}
              </div>
                {/*<!-- nav tabs -->*/}
                <ul className="spotlight-tabs spotlight-tabs-dark nav nav-tabs border-0 mb-5 position-relative flex-nowrap" id="most_popular_products-carousel-01" role="tablist">
                  <li key="ownership" className="nav-item text-fnwp position-relative">
                    <a className={this.getActiveClasses('ownership')} id="mp-2-01-tab" data-toggle="tab" href="#mp-2-01-c" role="tab" aria-controls="mp-2-01-c" aria-selected="true">Car Ownership NFTs</a>
                  </li>
                  <li key="momentnfts" className="nav-item text-fnwp position-relative"> 
                    <a className={this.getActiveClasses('momentnfts')} id="mp-2-04-tab" data-toggle="tab" href="#mp-2-04-c" role="tab" aria-controls="mp-2-04-c" aria-selected="false">Simracing Moment NFTs</a>
                  </li>
                  <li key="carsetup" className="nav-item text-fnwp position-relative"> 
                    <a className={this.getActiveClasses('carsetup')} id="mp-2-02-tab" data-toggle="tab" href="#mp-2-02-c" role="tab" aria-controls="mp-2-02-c" aria-selected="false">Car Setups</a>
                  </li>
                  <li key="carskins" className="nav-item text-fnwp position-relative"> 
                    <a className={this.getActiveClasses('carskins')} id="mp-2-03-tab" data-toggle="tab" href="#mp-2-03-c" role="tab" aria-controls="mp-2-03-c" aria-selected="false">Car Skins</a>
                  </li>
                </ul>
                {/*<!-- tab panes -->*/}
                <div id="color_sel_Carousel-content_02" className="tab-content position-relative w-100">
                  {/*<!-- tab item -->*/}
                  <div className={this.getPanelActiveClasses('ownership')} id="mp-2-01-c" role="tabpanel" aria-labelledby="mp-2-01-tab">
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
                            {this.state.filteredNFTs.length === 0 &&
                              <div className="col-md-12 mb-4"><span>No items found in this category</span></div>
                            }

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
                                <a href="#1" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true, false)} className="product-item">
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
                                          {/*<span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>*/}
                                          <span className="fw-600">{price / priceConversion} SRC</span>
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

                  {/* start moment nfts*/}
                        {/*<!-- tab item -->*/}
                  <div className={this.getPanelActiveClasses('momentnfts')} id="mp-2-04-c" role="tabpanel" aria-labelledby="mp-2-04-tab">
                    <div className="row">
                      {/*<!-- item -->*/}

                      {this.state.filteredMomentNFTs.length === 0 &&
                          <div className="col-md-12 mb-4"><span>No items found in this category</span></div>
                      }
                      {this.state.filteredMomentNFTs.map(function(value, index){
                                
                                let metadata = this.extractMomentNFTTraitTypes(value.attributes);

                                let series = metadata.series;
                                let simulator = metadata.simulator;
                                let price = metadata.price * priceConversion;
                                //TODO: change hardcode
                                let address = metadata.seriesOwner;
                                let itemId = value.id;
                                let key = itemId + "_" + index
                                let image = value.image;
                                //let carNumber = value.carNumber;
                                let name = value.name;
                                let imagePath = value.image;
                                let description = value.description;
                                /*let payload = {
                                  itemId, null, simulator, null, series, carNumber, price, null , address, null, imagePath, true
                                }*/
                                return <div className="col-md-12 mb-4" key={key}>
                                <a href="#1" onClick={(e) => this.buyItem(e, itemId, null, simulator, null, series, description, price, null , address, null, imagePath, false, true)} className="product-item">
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
                                        Description: {description}
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
                                          {/*<span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>*/}
                                          <span className="fw-600">{price / priceConversion} SRC</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </a>
                                </div>
                           
                
                            }, this)} {/*Obs: need to pass the context to the map function*/}

                      
                      {/*<!-- /.item -->*/}
                      {/*<!-- item -->*/}
                    
                    </div>
                  </div>
                  {/*end moment nfts */}

                  {/*<!-- tab item -->*/}
                  <div className={this.getPanelActiveClasses('carsetup')} id="mp-2-02-c" role="tabpanel" aria-labelledby="mp-2-02-tab">
                    <div className="row">
                      {/*<!-- item -->*/}

                      {this.state.filteredCars.length === 0 &&
                          <div className="col-md-12 mb-4"><span>No items found in this category</span></div>
                      }
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
                                     {/*<span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>*/}
                                     <span className="fw-600">{price / priceConversion} SRC</span>
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
                  <div className={this.getPanelActiveClasses('carskins')} id="mp-2-03-c" role="tabpanel" aria-labelledby="mp-2-03-tab">
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
                        {this.state.filteredSkins.length === 0 &&
                          <div className="col-md-12 mb-4"><span>No items found in this category</span></div>
                        }
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
                                                {/*<span className="fw-600 td-lt">{price / priceConversion} ETH</span><br/>*/}
                                                <span className="fw-600">{price / priceConversion} SRC</span>
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

                          
                            <li key="price_filter" className="nav-item">
                              <div className="nav-link py-2 px-3">
                                
                                    
                                    <label className="custom-control-label1" htmlFor="MIN_PRICE">Min: </label>
                                    <input className="custom-control-input1" type="number" min={this.state.priceMinDefault} max={this.state.priceMaxDefault} step={this.state.priceStep}  onChange={ (e) => this.priceFilterChanged(e,"min")} value={this.state.priceMin} name="MIN_PRICE" id="MIN_PRICE"/>
                                    <br/>
                                    <label className="custom-control-label1" htmlFor="MAX_PRICE">Max: </label>
                                    <input className="custom-control-input1" type="number" min={this.state.priceMinDefault} max={this.state.priceMaxDefault}  step={this.state.priceStep}  onChange={ (e) => this.priceFilterChanged(e, "max")} value={this.state.priceMax} name="MAX_PRICE" id="MAX_PRICE"/>
                                   
                               
                              </div>
                            </li>
                         
                            
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


export default withRouter(StorePage);