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
            redirectBuyItem: false,
            selectedItemId: "",
            selectedTrack: "",
            selectedSimulator: "",
            selectedSeason: "",
            selectedPrice: "",
            selectedCarBrand: "",
        }

    }

    componentDidMount = async (event) => {
        const currentAccount = this.state.drizzleState.accounts[0];
        this.setState({ currentAccount: currentAccount});
    }

    render() {
        return (
            <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3" expand="lg">
                <Navbar.Brand href="/">Simthunder</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav>
                            <Nav.Link as={NavLink} to='/'>Home</Nav.Link>
                        </Nav>
                        <NavDropdown title="Sell" id="basic-nav-dropdown">
                            <Link to="/uploadcar">
                                <NavDropdown.Item as="div">
                                    Car Setup
                            </NavDropdown.Item>
                            </Link>

                            <Link to="/uploadskin">
                                <NavDropdown.Item as="div">
                                    Skin
                            </NavDropdown.Item>
                            </Link>
                        </NavDropdown>
                        {/* <Nav>
                            <Nav.Link as={NavLink} to='/registorvendor'>Register</Nav.Link>
                        </Nav> */}
                        <Navbar.Text>{this.state.currentAccount}</Navbar.Text>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

        );
    }
}

export default NavbarPage;