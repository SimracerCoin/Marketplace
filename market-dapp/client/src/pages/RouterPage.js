import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import MainPage from "./MainPage";
import UploadCar from "./UploadCar";
import UploadSkin from "./UploadSkin";
import SellOwnership from "./SellOwnership";
import UploadSimracerMoment from "./UploadSimracerMoment";
import NavbarPage from "./NavbarPage";
import RegisterVendor from "./RegisterVendor";
import ItemPage from "./ItemPage";
//import ItemPageOld from "./ItemPageOld";
import NotificationsPage from "./NotificationsPage";
import SellerPage from "./SellerPage";
import AboutPage from "./AboutPage";
import FaqsPage from "./FaqsPage";
import StorePage from "./StorePage";
import AuctionPage from "./AuctionPage";

class RouterPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            drizzle: props.drizzle,
            drizzleState: props.drizzleState,
        }

    }

    render() {
        return (
            <Router>
                <NavbarPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                <Switch>
                    <Route exact path="/uploadcar">
                        <UploadCar drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route exact path="/uploadskin">
                        <UploadSkin drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route exact path="/sellownership">
                        <SellOwnership drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route exact path="/sellmomentnft">
                        <UploadSimracerMoment drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route exact path="/registorvendor">
                        <RegisterVendor drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route path="/item">
                        <ItemPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                        {/*<ItemPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} /> */}
                    </Route>
                    <Route exact path="/notifications">
                        <NotificationsPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route path="/seller">
                        <SellerPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState} />
                    </Route>
                    <Route exact path="/about">
                        <AboutPage />
                    </Route>
                    <Route exact path="/faqs">
                        <FaqsPage />
                    </Route>
                    <Route path="/store">
                        <StorePage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                    </Route>
                    <Route path="/auction">
                        <AuctionPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                    </Route>
                    <Route exact path="/">
                        <MainPage drizzle={this.state.drizzle} drizzleState={this.state.drizzleState}/>
                    </Route>
                </Switch>
            </Router>
        );
    }
}

export default RouterPage;