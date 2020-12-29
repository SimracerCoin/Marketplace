import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import MainPage from "./MainPage";
import UploadCar from "./UploadCar";
import UploadSkin from "./UploadSkin";
import NavbarPage from "./NavbarPage";
import RegisterVendor from "./RegisterVendor";
import ItemPage from "./ItemPage";
import NotificationsPage from "./NotificationsPage"
import { Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components


class RouterPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
        }

    }

    componentDidMount = async () => {
        const contract = this.state.drizzle.contract;
        console.log(this.state.drizzle)
    }


    render() {
        return (
            <div>
                <Router>
                    <NavbarPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                    <Switch>
                        <Route exact path="/uploadcar">
                            <UploadCar drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        </Route>
                        <Route exact path="/uploadskin">
                            <UploadSkin drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        </Route>
                        <Route exact path="/registorvendor">
                            <RegisterVendor drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                        </Route>
                        <Route path="/item">
                            <ItemPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        </Route>
                        <Route path="/notifications">
                            <NotificationsPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        </Route>
                        <Route exact
                            path="/"
                            component={() => <MainPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />} />
                    </Switch>
                </Router>
            </div>
        );
    }
}

export default RouterPage;