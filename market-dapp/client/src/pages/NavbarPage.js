import React from "react";
import { Navbar, Nav, NavDropdown, Dropdown } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components
import { Link, NavLink } from 'react-router-dom';

class NavbarPage extends React.Component {


    render() {
        return (
            <Navbar className="navbar navbar-expand-lg navbar-dark bg-dark border-nav zi-3" expand="lg">
                <Navbar.Brand href="/">Market DApp</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav>
                            <Nav.Link as={NavLink} to='/'>Home</Nav.Link>
                        </Nav>
                        <NavDropdown title="Upload" id="basic-nav-dropdown">
                            <Link to="/uploadcar">
                                <NavDropdown.Item as="div">
                                    Car
                            </NavDropdown.Item>
                            </Link>

                            <Link to="/uploadskin">
                                <NavDropdown.Item as="div">
                                    Skin
                            </NavDropdown.Item>
                            </Link>
                        </NavDropdown>
                        <Nav>
                            <Nav.Link as={NavLink} to='/registorvendor'>Register</Nav.Link>
                        </Nav>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

        );
    }
}

export default NavbarPage;