import React from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"; // Check out drizzle's react components at @drizzle/react-components
import { Link, NavLink, Redirect } from "react-router-dom";
import QuickswapModal from "../components/QuickswapModal";
import * as $ from "jquery";

class NavbarPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userBalance: undefined,
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
      searchQuery: "",
      isNFTOwner: false,
      isMomentNFTOwner: false,
      showQSModal: false,
      expanded: false,
    };

    this.handleNavClick = this.handleNavClick.bind(this);
    this.toggleNavbar = this.toggleNavbar.bind(this);
  }

  handleNavClick() {
    this.setState({ expanded: false });
  }

  toggleNavbar() {
    this.setState({ expanded: !this.state.expanded });
  }

  componentDidUpdate() {
    //if no key is set but i still show something, clean it
    if (!localStorage.getItem("searchQuery") && this.state.searchQuery) {
      this.setState({ searchQuery: "" });
    }
  }

  componentDidMount = async (event) => {
    const contract = await this.state.drizzle.contracts.STMarketplace;
    const currentAccount = this.state.drizzleState.accounts[0];
    const haveNotifications = (await contract.methods.listNotificationsUser(currentAccount).call()).length > 0;
    const walletAddr = currentAccount.substr(0, 6) + "..." + currentAccount.substr(-4);
    const contractNFTs = await this.state.drizzle.contracts.SimthunderOwner;
    const contractMomentNFTs = await this.state.drizzle.contracts.SimracingMomentOwner;
    const contractSimracerCoin = await this.state.drizzle.contracts.SimracerCoin;
    const ownerNFT = await contractNFTs.methods.owner().call();
    const ownerMomentNFT = await contractMomentNFTs.methods.owner().call();
    //check if account is contract(s) owner
    const isNFTOwner = ownerNFT === currentAccount;
    const isMomentNFTOwner = ownerMomentNFT === currentAccount;

    let previousSearch = localStorage.getItem("searchQuery");
    let searchQuery = "";
    if (previousSearch && previousSearch.length > 0) {
      searchQuery = previousSearch;
    }

    this.setState({
      isNFTOwner: isNFTOwner,
      isMomentNFTOwner: isMomentNFTOwner,
      currentAccountFullAddr: currentAccount,
      currentAccount: walletAddr,
      haveNotifications: haveNotifications,
      contractSimracerCoin: contractSimracerCoin,
      searchQuery: searchQuery,
    });

    this.getAccountBalance().then(userBalance => {
      console.log("balance: " + userBalance);
      console.log('conta: ', currentAccount);

    }).catch(error => {
      console.error("Erro ao obter saldo do usuário:", error);
    });

  };

  componentWillUnmount = async (event) => {
    //clean if anything
    localStorage.removeItem("searchQuery");
  };

  gotoStoreAndSearch() {
    //save it on localstorage
    localStorage.setItem("searchQuery", this.state.searchQuery);
    return (
      <Redirect
        to={{
          pathname: "/store",
          state: {
            searchQuery: this.state.searchQuery,
          },
        }}
      />
    );
  }

  changeInventory = (e) => {
    if (/inventory/.test(window.location.href)) {
      if (/Moment/.test(e.target.firstChild.data)) {
        $("#mp-2-01-tab").removeClass(["active", "show"]);
        $("#mp-2-04-tab").addClass(["active", "show"]);
      }

      if (/Ownership/.test(e.target.firstChild.data)) {
        $("#mp-2-01-tab").addClass(["active", "show"]);
        $("#mp-2-04-tab").removeClass(["active", "show"]);
      }
    }

    this.handleNavClick(e);
  };

  searchOnClick = (event) => {
    if (!this.state.searchQuery) {
      event.preventDefault();
    }

    this.gotoStoreAndSearch();

    return false;
  };

  handleChange = (event) => {
    if (event.target.value) {
      localStorage.setItem("searchQuery", event.target.value);
    } else {
      localStorage.removeItem("searchQuery");
    }
    this.setState({ searchQuery: event.target.value });
  }




  getAccountBalance = async () => {
    try {
      const userBalance = this.state.drizzle.web3.utils.fromWei(
        await this.state.contractSimracerCoin.methods.balanceOf(this.state.currentAccountFullAddr).call());
      const userBalanceString = userBalance;
      let balance = Number(Math.round(userBalanceString)).toFixed(2);

      this.setState({
        userBalance: userBalanceString,
        balance:balance
      });

      return balance;
    } catch (error) {
      console.log('Failed to access user balance', error);
    }
  };

  render() {
    return [
      <Navbar className="top-menu-navbar navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3">
        <Container>
          <div className="row">
            <div className="col-4 col-sm-3 col-md-2 mr-auto ml-4">
              <Navbar.Brand
                href="/"
                className="logo font-weight-bold"
                style={{ alignItems: "first baseline" }}
              >
                <img src="/assets/img/logo-2-sm.png" alt="Simthunder" /> beta
              </Navbar.Brand>
              <Navbar.Text>
                <div class="userInfo">
                  {this.state.currentAccount && (
                    <span>{this.state.currentAccount}</span>
                  )}
                  
                  {this.state.userBalance !== undefined ? (
                    <span>Balance: {this.state.balance} SRC</span>
                  ) : (
                    <span>Balance: 0 SRC</span>
                  )}
                </div>
              </Navbar.Text>
            </div>
            <div className="col-4 d-none d-lg-block mx-auto">
              <form
                className="input-group border-0 bg-transparent"
                action="/store"
                mthod="GET"
              >
                <input
                  className="form-control"
                  value={this.state.searchQuery}
                  id="search-field"
                  name="q"
                  onChange={this.handleChange}
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                />
                <div className="input-group-append">
                  <button
                    className="btn btn-sm btn-warning text-secondary my-0 mx-0"
                    type="submit"
                    onClick={this.searchOnClick}
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-8 col-sm-8 col-md-8 col-lg-6 col-xl-4 ml-auto text-right">

              <Navbar.Text>
                <div class="userInfo1">
                  {this.state.currentAccount && (
                    <span>{this.state.currentAccount}</span>
                  )}
                  
                  {this.state.userBalance !== undefined ? (
                    <span>Balance: {this.state.balance} SRC</span>
                  ) : (
                    <span>Balance: 0 SRC</span>
                  )}
                </div>
              </Navbar.Text>

              {
/*Navbar.Text className="border border-warning rounded-2 p-2">{this.state.currentAccount} &nbsp;|&nbsp; <a className="btn m-0 p-0" role="button" onClick={() => this.setState({showQSModal: true})}><b>Get SRC</b></a></Navbar.Text>*/}
              <ul className="nav navbar-nav d-none d-sm-inline-flex flex-row">
                <li key="languagesettings" className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle small"
                    href="#"
                    id="dropdownGaming"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="mr-2 fas fa-globe"></i>EN{" "}
                  </a>
                  <div
                    className="dropdown-menu position-absolute"
                    aria-labelledby="dropdownGaming"
                  >
                    <a className="dropdown-item" href="/">
                      English
                    </a>
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
                  <Link
                    to="/notifications"
                    className="nav-link small"
                    data-toggle="offcanvas"
                    data-target="#offcanvas-notification"
                  >
                    <span className="p-relative d-inline-flex">
                      {this.state.haveNotifications ? (
                        <span className="badge-cart badge badge-counter badge-warning position-absolute l-1">
                          !
                        </span>
                      ) : (
                        <span></span>
                      )}
                      <i className="fas fa-bell"></i>
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          {this.state.showQSModal && (
            <QuickswapModal
              open={true}
              onClose={() => this.setState({ showQSModal: false })}
            ></QuickswapModal>
          )}
        </Container>
      </Navbar>,
      <Navbar
        expanded={this.state.expanded}
        className="navbar-expand-lg navbar-dark bg-dark"
      >
        <Container>
          <Navbar.Toggle
            onClick={this.toggleNavbar}
            aria-controls="collapsingNavbar"
            aria-label="Toggle navigation"
            aria-expanded="false"
            className="navbar-toggler-fixed"
          />
          <Navbar.Collapse id="collapsingNavbar">
            <Nav>
              <NavDropdown title="Sell">
                <Link
                  to={{ pathname: "/inventory", state: { view: "momentnfts" } }}
                  onClick={this.changeInventory}
                >
                  <NavDropdown.Item as="div">
                    Sell Simracing Moment
                  </NavDropdown.Item>
                </Link>

                <Link
                  to={{ pathname: "/inventory", state: { view: "ownership" } }}
                  onClick={this.changeInventory}
                >
                  <NavDropdown.Item as="div" name="ownership">
                    Sell Car Ownership
                  </NavDropdown.Item>
                </Link>

                {this.state.isNFTOwner && (
                  <Link to="/sellownership" onClick={this.handleNavClick}>
                    <NavDropdown.Item as="div">
                      Mint Car Ownership NFT
                    </NavDropdown.Item>
                  </Link>
                )}
                {this.state.isMomentNFTOwner && (
                  <Link to="/sellmomentnft" onClick={this.handleNavClick}>
                    <NavDropdown.Item as="div">
                      Mint Simracer Moment NFT
                    </NavDropdown.Item>
                  </Link>
                )}

                <Link to="/uploadcar" onClick={this.handleNavClick}>
                  <NavDropdown.Item as="div">Sell Car Setup</NavDropdown.Item>
                </Link>
                <Link to="/uploadskin" onClick={this.handleNavClick}>
                  <NavDropdown.Item as="div">Sell Skin</NavDropdown.Item>
                </Link>
              </NavDropdown>
              <NavLink className="nav-link mr-2" to="/about" onClick={this.handleNavClick}>
                About
              </NavLink>
              <NavLink className="nav-link mr-2" to="/faqs" onClick={this.handleNavClick}>
                FAQs
              </NavLink>
              <NavLink className="nav-link mr-2" to="/store" onClick={this.handleNavClick}>
                Store
              </NavLink>
              {/*<!--<NavLink className="nav-link mr-2" to="/auction">Auction</NavLink>-->*/}
              <NavLink className="nav-link mr-2" to="/inventory" onClick={this.handleNavClick}>
                NFT Inventory
              </NavLink>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    ];
  }
}

export default NavbarPage;
