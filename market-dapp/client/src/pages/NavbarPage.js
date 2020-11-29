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


                            {/*  <Link to="/uploadcard">
                                <MenuItem href="/uploadcar">
                                    Car
                                </MenuItem>
                            </Link>
                            <Link to="/uploadskin">
                                <MenuItem href="/uploadskin">
                                    Skin
                                </MenuItem>
                            </Link> */}
                            <Nav>
                                <Nav.Link as={NavLink} to='/uploadcar'><bold>Car</bold></Nav.Link>
                            </Nav>
                            <Nav>
                                <Nav.Link as={NavLink} to='/uploadskin'><bold>Skin</bold></Nav.Link>
                            </Nav>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>

        );
    }
}

export default NavbarPage;