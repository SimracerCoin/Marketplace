import React from "react";
import { Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components
import { Link, NavLink } from 'react-router-dom'

class NavbarPage extends React.Component {


    render() {
        return (
            <Navbar bg="light" expand="lg">
                <Navbar.Brand href="/">Market DApp</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav>
                            <Nav.Link as={NavLink} to='/'>Home</Nav.Link>
                        </Nav>
                        <NavDropdown title="Upload" id="basic-nav-dropdown">
                            <Nav>
                                <Nav.Link as={NavLink} to='/uploadcar'>Car</Nav.Link>
                            </Nav>
                            <Nav>
                                <Nav.Link as={NavLink} to='/uploadskin'>Skin</Nav.Link>
                            </Nav>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

        );
    }
}

export default NavbarPage;