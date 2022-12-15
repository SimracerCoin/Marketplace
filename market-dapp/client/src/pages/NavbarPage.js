import React from "react";
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components
import { Link, NavLink, Redirect } from 'react-router-dom';

class NavbarPage extends React.Component {

    
    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: [],
            listSkins: [],
            haveNotifications: false,
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedPrice: "",
            selectedCarBrand: "",
            searchQuery: ""
        }

    }

    componentDidUpdate() {
        //if no key is set but i still show something, clean it
        if(!localStorage.getItem('searchQuery') && this.state.searchQuery) {
            this.setState({searchQuery: ""});
        }
    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const currentAccount = this.state.drizzleState.accounts[0];
        const haveNotifications = (await contract.methods.listNotificationsPerUser(currentAccount).call()).length != 0;

        let previousSearch = localStorage.getItem('searchQuery');
        let searchQuery = "";
        if(previousSearch && previousSearch.length>0) {
            searchQuery = previousSearch;
        }
        this.setState({ currentAccount: currentAccount, haveNotifications: haveNotifications, searchQuery: searchQuery });
    }

    componentWillUnmount = async (event) => {
        //clean if anything
        localStorage.removeItem('searchQuery');
    }

    gotoStoreAndSearch() {

        //save it on localstorage
        localStorage.setItem('searchQuery', this.state.searchQuery);
        return (<Redirect
            to={{
                pathname: "/store",
                state: {
                    searchQuery: this.state.searchQuery
                }
            }}
        />)
    }

    searchOnClick = (event) => {
        if(!this.state.searchQuery) {
            event.preventDefault();
        }

        this.gotoStoreAndSearch();
       
        return false;
        
    }

    handleChange = (event) => {
        if(event.target.value) {
            localStorage.setItem('searchQuery', event.target.value);
        } else {
            localStorage.removeItem('searchQuery');
        }
        this.setState({searchQuery: event.target.value});
    }

    render() {
        return ([
            <Navbar className="top-menu-navbar navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3">
                <Container>
                    <div className="row">
                        <div className="col-4 col-sm-3 col-md-2 mr-auto ml-4">
                            <Navbar.Brand href="/" className="logo font-weight-bold" style={{alignItems: "first baseline"}}><img src="assets/img/logo-2-sm.png" alt="Simthunder" /> beta</Navbar.Brand>
                        </div>
                        <div className="col-4 d-none d-lg-block mx-auto">
                            <form className="input-group border-0 bg-transparent" action="/store" mthod="GET">
                                <input className="form-control" value={this.state.searchQuery} id="search-field" name="q" onChange={this.handleChange} type="search" placeholder="Search" aria-label="Search"/>
                                <div className="input-group-append">
                                    <button className="btn btn-sm btn-warning text-secondary my-0 mx-0" type="submit" onClick={this.searchOnClick}><i className="fas fa-search"></i></button>
                                </div>
                            </form>
                        </div>
                        <div className="col-8 col-sm-8 col-md-8 col-lg-6 col-xl-4 ml-auto text-right">
                            <Navbar.Text>{this.state.currentAccount}</Navbar.Text>
                            <ul className="nav navbar-nav d-none d-sm-inline-flex flex-row">
                                <li key="languagesettings" className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle small" href="store.html#" id="dropdownGaming" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i className="mr-2 fas fa-globe"></i>EN </a>
                                    <div className="dropdown-menu position-absolute" aria-labelledby="dropdownGaming">
                                        <a className="dropdown-item" href="main.html">English</a>
                                    </div>
                                </li>
                                {/*<li className="nav-item">
                                <a className="nav-link small" href="" data-toggle="offcanvas" data-target="#offcanvas-cart">
                                <span className="p-relative d-inline-flex">
                                    <span className="badge-cart badge badge-counter badge-warning position-absolute l-1">2</span>
                                    <i className="fas fa-shopping-cart"></i>
                                </span>
                                </a>
                            </li>*/}
                                <li key="notifications" className="nav-item">
                                    <Link to="/notifications" className="nav-link small" data-toggle="offcanvas" data-target="#offcanvas-notification">
                                        <span className="p-relative d-inline-flex">
                                            {this.state.haveNotifications ? <span className="badge-cart badge badge-counter badge-warning position-absolute l-1">!</span> : <span></span>}
                                            <i className="fas fa-bell"></i>
                                        </span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Container>
            </Navbar>,
            <Navbar className="navbar-expand-lg navbar-dark bg-dark">
                <Container>
                    <Navbar.Toggle aria-controls="collapsingNavbar" aria-label="Toggle navigation" aria-expanded="false" className="navbar-toggler-fixed" />
                    <Navbar.Collapse id="collapsingNavbar">
                        <Nav>
                            <NavDropdown title="Sell">
                                <Link to="/sellownership">
                                    <NavDropdown.Item as="div">
                                        Sell Car Ownership NFT
                                    </NavDropdown.Item>
                                </Link>
                                <Link to="/sellmomentnft">
                                    <NavDropdown.Item as="div">
                                        Sell Simracer Moment NFT
                                    </NavDropdown.Item>
                                </Link>
                                <Link to="/uploadcar">
                                    <NavDropdown.Item as="div">
                                        Sell Car Setup
                            </NavDropdown.Item>
                                </Link>
                                <Link to="/uploadskin">
                                    <NavDropdown.Item as="div">
                                        Sell Skin
                            </NavDropdown.Item>
                                </Link>
                            </NavDropdown>
                            <NavLink className="nav-link mr-2" to="/about">About</NavLink>
                            <NavLink className="nav-link mr-2" to="/faqs">FAQs</NavLink>
                            <NavLink className="nav-link mr-2" to="/store">Store</NavLink>
                            <NavLink className="nav-link mr-2" to="/auction">Auction</NavLink>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

        ]);
    }
}

export default NavbarPage;