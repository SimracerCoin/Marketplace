import React from "react";
import { Navbar, Nav, NavDropdown, Dropdown } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components
import { Link, NavLink } from 'react-router-dom';

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
            selectedCarBrand: ""
        }

    }

    componentDidMount = async (event) => {
        const contract = await this.state.drizzle.contracts.STMarketplace;
        const currentAccount = this.state.drizzleState.accounts[0];
        const haveNotifications = (await contract.methods.listNotificationsPerUser(currentAccount).call()).length != 0;

        this.setState({ currentAccount: currentAccount, haveNotifications: haveNotifications});
    }

    render() {
        return ([
            // <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3">
            //     <Navbar.Brand href="/">Simthunder</Navbar.Brand>
            //     <Navbar.Toggle aria-controls="basic-navbar-nav" />
            //     <Navbar.Collapse id="basic-navbar-nav">
            //         <Nav className="mr-auto">
            //             <Nav>
            //                 <Nav.Link as={NavLink} to='/'>Home</Nav.Link>
            //             </Nav>
            //             <NavDropdown title="Sell" id="basic-nav-dropdown">
            //                 <Link to="/uploadcar">
            //                     <NavDropdown.Item as="div">
            //                         Car Setup
            //                 </NavDropdown.Item>
            //                 </Link>

            //                 <Link to="/uploadskin">
            //                     <NavDropdown.Item as="div">
            //                         Skin
            //                 </NavDropdown.Item>
            //                 </Link>
            //             </NavDropdown>
            //             {/* <Nav>
            //                 <Nav.Link as={NavLink} to='/registorvendor'>Register</Nav.Link>
            //             </Nav> */}
            //             <Navbar.Text>{this.state.currentAccount}</Navbar.Text>
            //         </Nav>
            //     </Navbar.Collapse>
            // </Navbar>,
            <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3">
                <div className="container">
                    <div className="row">
                    <div className="col-4 col-sm-3 col-md-2 mr-auto">
                        <Navbar.Brand href="/" className="h5">SIMTHUNDER</Navbar.Brand>
                    </div>
                    <div className="col-4 d-none d-lg-block mx-auto">
                        <form className="input-group border-0 bg-transparent">
                        <input className="form-control" type="search" placeholder="Search" aria-label="Search" />
                        <div className="input-group-append">
                            <button className="btn btn-sm btn-warning text-secondary my-0 mx-0" type="submit"><i className="fas fa-search"></i></button>
                        </div>
                        </form>
                    </div>
                    <div className="col-8 col-sm-8 col-md-8 col-lg-6 col-xl-4 ml-auto text-right">
                        <Navbar.Text>{this.state.currentAccount}</Navbar.Text>
                        <ul className="nav navbar-nav d-none d-sm-inline-flex flex-row">
                            <li className="nav-item dropdown">
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
                            <li className="nav-item">
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
                </div>
            </Navbar>,
            <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                <Navbar.Toggle aria-controls="collapsingNavbar" aria-label="Toggle navigation" aria-expanded="false" className="navbar-toggler navbar-toggler-fixed" />
                <Navbar.Collapse id="collapsingNavbar" className="collapse navbar-collapse">
                    <Nav className="navbar-nav">
                        <NavDropdown title="Sell" className="nav-item dropdown dropdown-hover" id="basic-nav-dropdown">
                            <Link to="/sellownership">
                                <NavDropdown.Item as="div">
                                    Sell Car Ownership NFT
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
                        
                    </Nav>
                </Navbar.Collapse>
                </div>
            </Navbar>

                ]);
    }
}

export default NavbarPage;