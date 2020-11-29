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
import { Navbar, Nav, NavDropdown, Form, FormControl } from 'react-bootstrap'; // Check out drizzle's react components at @drizzle/react-components


class RouterPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
            listCars: null,
            listSkins: null,
        }

    }

    componentDidMount = async () => {
        const contract = this.state.drizzle.contract;
        console.log(this.state.drizzle)
        /*
        const response_cars = await contract.methods.getCars().call();
        const response_skins = await contract.methods.getSkins().call();
        this.setState({ listCars: response_cars, listSkins: response_skins });*/
    }


    render() {
        return (
            <div>
                <Router>
                    <NavbarPage />
                    <Switch>
                        <Route exact path="/uploadcar">
                            <UploadCar drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        </Route>
                        <Route exact path="/uploadskin">
                            <UploadSkin drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
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